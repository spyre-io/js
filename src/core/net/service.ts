import {Client, ISession, Match, Session, Socket} from "@heroiclabs/nakama-js";
import {getBackoffMs, waitMs} from "../util/net";
import {childLogger} from "../util/logger";
import {v4} from "uuid";
import {ApiRpc} from "@heroiclabs/nakama-js/dist/api.gen";
import {CancelToken, Kv, newCancelToken} from "../shared/types";
import {INotificationService} from "../notifications/service";

const log = childLogger("connection");

type AsyncClientFn<T> = (client: Client, session: Session) => Promise<T>;

export interface INakamaClientService {
  getApi<T>(fn: AsyncClientFn<T>, retries: number): Promise<T>;
}

export interface IConnectionService {
  get isConnected(): boolean;

  init(deviceId: string): void;
  connect(): Promise<void>;
  disconnect(): void;

  join(matchId: string, meta: Kv<string>, retries: number): Promise<Match>;
  leave(): Promise<void>;
  sendMatchState(
    matchId: string,
    opCode: number,
    payload: string | Uint8Array,
    retries?: number,
  ): Promise<void>;
}

export type RpcResponse<T> = {
  payload: T;

  // todo: other network info
};

export interface IRpcService {
  call<T>(id: string, input: any): Promise<RpcResponse<T>>;
}

type ParsedApiRpc = ApiRpc & {payload: any};

export class ConnectionService
  implements IConnectionService, IRpcService, INakamaClientService
{
  // set on construction
  _isSecure: boolean;
  _client: Client;

  // set on connection
  _session: Session | null = null;
  _socket: Socket | null = null;

  // set in connect
  _connectCancel: CancelToken | null = null;
  _connectPromise: Promise<void> | null = null;

  // set in init
  _deviceId: string | null = null;

  // set in heartbeat to determine refresh
  _runtimeId: string | null = null;

  // set in join
  _matchId: string | null = null;
  _matchMeta: object | null = null;

  // used in rpcWithRetry to dedupe requests
  _requestCache: {[key: string]: Promise<ParsedApiRpc>} = {};

  get isConnected() {
    return !!this._socket;
  }

  constructor(private readonly notifs: INotificationService) {
    this._isSecure = process.env.NEXT_PUBLIC_NAKAMA_SSL_ENABLED === "true";
    this._client = new Client(
      process.env.NEXT_PUBLIC_NAKAMA_SERVER_KEY,
      process.env.NEXT_PUBLIC_NAKAMA_HOST,
      process.env.NEXT_PUBLIC_NAKAMA_PORT,
      this._isSecure,
      3000,
      false,
    );
  }

  init(deviceId: string): void {
    if (this._deviceId) {
      // safely return if already initialized with the same parameters
      if (this._deviceId === deviceId) {
        return;
      }

      throw new Error(
        `Already initialized, current deviceId '${this._deviceId}' != '${deviceId}'.`,
      );
    }

    this._deviceId = deviceId;

    // kick-off heartbeat
    this.heartbeat(newCancelToken());
  }

  // Connects to the server. This is safe to call at any time, as it will
  // only connect if not already connected.
  connect(): Promise<void> {
    if (!this._deviceId) {
      throw new Error("Not initialized.");
    }

    if (!this._connectPromise) {
      this._connectCancel = newCancelToken();
      this._connectPromise = this.connectWithRetries(this._connectCancel);
    }

    return this._connectPromise;
  }

  // Disconnects from the server.
  disconnect(): void {
    if (!this._deviceId) {
      throw new Error("Not initialized.");
    }

    if (this._connectCancel) {
      this._connectCancel.cancel();
      this._connectCancel = null;
    }

    if (this._socket) {
      this._socket.disconnect(true);
      this._socket = null;
    }

    this._session = null;
    this._connectPromise = null;
  }

  // The RPC interface. This both deduplicates requests and auto-reconnects if
  // there is a connection failure.
  call<T>(id: string, input: any): Promise<RpcResponse<T>> {
    const payload = JSON.stringify(input);
    const key = id + payload;

    let req = this._requestCache[key];
    if (!req) {
      const uuid = v4();

      log.debug("Rpc start [@Uuid] --> @RPC", uuid, id);

      req = this._requestCache[key] = this.rpcWithRetry(id, payload)
        .then((res) => {
          // deletes the cache entry
          delete this._requestCache[key];

          log.debug(
            "Rpc end [@Uuid] <-- @RPC: @Response",
            uuid,
            id,
            res.payload,
          );

          const payload = JSON.parse(res.payload || "{}");
          if (payload.error) {
            throw new Error(payload.error);
          }

          return {
            id: res.id,
            ...payload,
          };
        })
        .catch((error) => {
          log.debug("Rpc error [@Uuid] <-- @RPC: @Error", uuid, id, error);

          // deletes the cache entry-- note that this cannot go in onFinally as
          // this would break retry logic
          delete this._requestCache[key];

          throw error;
        });
    }

    return req;
  }

  // Joins a match with the given match ID and metadata. This should be used
  // rather than the socket directly, as it handles reconnects.
  async join(
    matchId: string,
    meta: Kv<string>,
    retries: number = 3,
  ): Promise<Match> {
    if (!this._socket) {
      await this.connect();
      await waitMs(getBackoffMs(retries));

      return this.join(matchId, meta, retries + 1);
    }

    let match;
    try {
      match = await this._socket.joinMatch(matchId, "", meta);
    } catch (error) {
      log.debug(`Failed joinMatch for unhandled reason: @Error`, error);

      throw error;
    }

    this._matchId = matchId;
    this._matchMeta = meta;

    return match;
  }

  // Leaves the current match. This should be used when a match is complete
  // so that reconnects don't attempt to rejoin matches.
  async leave() {
    if (this._matchId) {
      try {
        await this._socket!.leaveMatch(this._matchId);
      } catch (error) {
        log.debug(`Failed leaveMatch for unhandled reason: @Error`, error);
      }
    }

    this._matchId = null;
    this._matchMeta = null;
  }

  // Sends a match state update. This should be used rather than the socket
  // directly, as it handles reconnects.
  async sendMatchState(
    matchId: string,
    opCode: number,
    payload: string | Uint8Array,
    retries: number = 0,
  ): Promise<void> {
    if (retries > 5) {
      throw new Error("Too many retries.");
    }

    // reconnect if necessary
    if (!this._socket) {
      await this.connect();
    }

    log.debug(
      "Sending match state @MatchId @OpCode @Payload",
      matchId,
      opCode,
      payload,
    );

    try {
      await this._socket!.sendMatchState(matchId, opCode, payload);
    } catch (error) {
      if (error === "Socket connection has not been established yet.") {
        // reconnect and retry
        log.debug(
          `Retrying failed sendMatchState (retry number @Retries) due to connection issue.`,
          retries,
        );

        this.disconnect();
        await this.connect();

        return await this.sendMatchState(matchId, opCode, payload, retries + 1);
      } else {
        log.debug(`Failed sendMatchState for unhandled reason: @Error`, error);

        // unknown
        // TODO: SENTRY
        //Sentry.captureException(error);

        throw error;
      }
    }
  }

  async getApi<T>(fn: AsyncClientFn<T>, retries: number = 0): Promise<T> {
    if (retries > 5) {
      throw new Error("Too many retries.");
    }

    try {
      return await fn(this._client, this._session!);
    } catch (error) {
      if (error === "Socket connection has not been established yet.") {
        // reconnect and retry
        log.debug(
          `Retrying failed API request (retry number @Retries) due to connection issue.`,
          retries,
        );

        this.disconnect();
        await this.connect();

        return await this.getApi(fn, retries + 1);
      } else {
        log.debug(`Failed API request for unhandled reason: @Error`, error);

        // unknown
        //Sentry.captureException(error);
        // TODO: SENTRY

        throw error;
      }
    }
  }

  // Connects in a loop with exponential backoff. Doesn't quit until
  // the connection is established or the cancel token is cancelled.
  private async connectWithRetries(
    cancelToken: CancelToken,
    retries: number = 0,
  ): Promise<void> {
    if (retries > 0) {
      const ms = getBackoffMs(retries);

      log.info("Retrying connection in @Ms ms.", ms);

      await waitMs(ms);
    }

    if (cancelToken.cancelled) {
      throw new Error("cancelled");
    }

    let session;
    try {
      session = await this._client.authenticateDevice(this._deviceId!, true);
    } catch (error) {
      log.info("Failed to authenticate: @Error", error);

      return await this.connectWithRetries(cancelToken, retries + 1);
    }

    if (cancelToken.cancelled) {
      throw new Error("cancelled");
    }

    const socket = this._client.createSocket(this._isSecure);
    try {
      await socket.connect(session, true);
    } catch (error) {
      log.info("Failed to connect: @Error", error);

      return await this.connectWithRetries(cancelToken, retries + 1);
    }

    if (cancelToken.cancelled) {
      socket.disconnect(false);

      throw new Error("cancelled");
    }

    // set high -- though this doesn't appear to do anything
    socket.setHeartbeatTimeoutMs(30000);

    socket.onmatchdata = (message) => {};
    socket.onnotification = (message) => {
      this.notifs.on(message.code!, {
        code: message.code!,
        content: message.content,
        create_time: message.create_time,
        id: message.id,
        persistent: message.persistent,
        sender_id: message.sender_id,
        subject: message.subject,
      });
    };

    // save connection objects
    this._socket = socket;
    this._session = session;

    // check for active match
    if (this._matchId) {
      log.debug("Rejoining match @MatchId.", this._matchId);

      try {
        await this._socket.joinMatch(this._matchId, "", this._matchMeta!);
      } catch (error) {
        if ((error as any).code === 4) {
          // this is a match not found error, which means the match is no longer active
          log.debug(
            "Failed joinMatch on connect() for match not found! Redirecting user to match results.",
          );

          this._matchId = null;
          this._matchMeta = null;

          // TODO: WHAT DO WE DO HERE
          //window.location.href = `/results/${_matchId}`;
        } else {
          log.debug(
            `Failed joinMatch on connect() for unhandled reason, progressing to connected: @Error`,
            error,
          );
        }
      }
    } else {
      log.debug("No active match to rejoin.");
    }

    log.info("Connected.");
  }

  // Attempts to refresh the session. Returns true iff successful.
  private async refreshSession() {
    let session;
    try {
      session = await this._client.sessionRefresh(this._session!);
    } catch (error) {
      log.error("Failed to refresh session: @Error", error as object);

      return false;
    }

    this._session = session;
    return true;
  }

  // The heartbeat loop. This will refresh the session if it is about to expire
  // and ping the server every 5 seconds. If the runtime ID changes, it will
  // trigger a full refresh.
  private async heartbeat(cancelToken: CancelToken) {
    while (!cancelToken.cancelled) {
      // first, wait
      await waitMs(5000);

      // check cancel
      if (cancelToken.cancelled) {
        throw new Error("cancelled");
      }

      // only heartbeat if we have a session
      if (this._session) {
        // check expiry (five minutes before expiry)
        const now = Date.now();
        if (this._session.isexpired(now / 1000 + 600)) {
          log.debug("Session is going to expire!");

          // Refresh the session. If it can't be refreshed, we need to
          // do a full disconnect/reconnect..
          const isRefreshed = await this.refreshSession();

          if (cancelToken.cancelled) {
            throw new Error("cancelled");
          }

          if (!isRefreshed) {
            this.disconnect();

            // ignore async nature
            this.connect();
          }
        } else {
          if (this._socket) {
            // ping with keep alive
            let res;
            try {
              res = await this._socket.rpc("heartbeat/ping", "{}");
            } catch (error) {
              log.debug("Heartbeat failed!");

              if (cancelToken.cancelled) {
                throw new Error("cancelled");
              }

              this.disconnect();
              this.connect();

              continue;
            }

            if (cancelToken.cancelled) {
              throw new Error("cancelled");
            }

            const {payload} = res;
            const {runtimeId} = JSON.parse(payload || "{}");
            if (this._runtimeId === null) {
              this._runtimeId = runtimeId;
            } else if (this._runtimeId !== runtimeId) {
              // full refresh
              log.info("Runtime ID mismatch! Full refresh.");

              window.location.reload();
              return;
            }
          }
        }
      }
    }
  }

  // Calls an RPC with retries.
  private async rpcWithRetry(
    id: string,
    payload: string,
    retries: number = 0,
  ): Promise<ApiRpc> {
    if (retries > 5) {
      throw new Error("Too many retries.");
    }

    if (!this._socket) {
      await this.connect();
      await waitMs(getBackoffMs(retries));

      return await this.rpcWithRetry(id, payload, retries + 1);
    }

    let res;
    try {
      res = await this._socket.rpc(id, payload);
    } catch (error) {
      if (
        error === "Socket connection has not been established yet." ||
        error === "The socket timed out while waiting for a response." ||
        (error as any).status === 401
      ) {
        log.debug(
          `Retrying failed RPC '@Rpc' (retry number @Retries) due to connection issue.`,
          id,
          retries,
        );

        // wait + retry
        await waitMs(getBackoffMs(retries));
        return await this.rpcWithRetry(id, payload, retries + 1);
      } else {
        // unknown
        // TODO: SENTRY
        //Sentry.captureException(error);
      }

      throw error;
    }

    return res;
  }
}
