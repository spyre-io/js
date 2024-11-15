import {Client, Match, MatchData, Session, Socket} from "@heroiclabs/nakama-js";
import {getBackoffMs, waitMs} from "@/core/util/net";
import {childLogger} from "@/core/util/logger";
import {v4} from "uuid";
import {ApiRpc} from "@heroiclabs/nakama-js/dist/api.gen";
import {CancelToken, Kv, newCancelToken, SpyreError} from "@/core/shared/types";
import {INotificationService} from "@/core/notifications/interfaces";
import {
  IConnectionService,
  IMatchDataHandler,
  INakamaClientService,
  IRpcService,
} from "./interfaces";
import {AsyncClientFn} from "./types";
import {SpyreErrorCode} from "@/core/shared/errors";

const logger = childLogger("core:connection");

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

  // handles match data
  _matchDataHandler: IMatchDataHandler | null = null;

  // used in rpcWithRetry to dedupe requests
  _requestCache: {[key: string]: Promise<any>} = {};

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

  setMatchDataHandler(handler: IMatchDataHandler | null): void {
    this._matchDataHandler = handler;

    if (this._socket) {
      if (handler) {
        this._socket.onmatchdata = ({op_code, data}: MatchData) =>
          handler.onData(op_code, data);
      } else {
        this._socket.onmatchdata = ({op_code, data}: MatchData) =>
          logger.warn(
            "Unhandled match data! @OpCode -> @Payload",
            op_code,
            new TextDecoder().decode(data),
          );
      }
    }
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
  call<T>(id: string, input: any): Promise<T> {
    const payload = JSON.stringify(input);
    const key = id + payload;

    let req = this._requestCache[key];
    if (!req) {
      const uuid = v4();

      logger.debug("Rpc start [@Uuid] --> @RPC", uuid, id);

      req = this._requestCache[key] = this.rpcWithRetry(id, payload)
        .then((res) => {
          // deletes the cache entry
          delete this._requestCache[key];

          logger.debug(
            "Rpc end [@Uuid] <-- @RPC: @Response",
            uuid,
            id,
            res.payload,
          );

          const payload = JSON.parse(res.payload || "{}");
          if (payload.error) {
            throw new SpyreError(SpyreErrorCode.INTERNAL, payload.error);
          }

          return {
            id: res.id,
            ...payload,
          };
        })
        .catch((error) => {
          logger.debug("Rpc error [@Uuid] <-- @RPC: @Error", uuid, id, error);

          // deletes the cache entry-- note that this cannot go in onFinally as
          // this would break retry logic
          delete this._requestCache[key];

          throw error;
        });
    }

    return req as Promise<T>;
  }

  // Joins a match with the given match ID and metadata. This should be used
  // rather than the socket directly, as it handles reconnects.
  async join(
    matchId: string,
    meta: Kv<string>,
    retries: number,
  ): Promise<Match> {
    if (!this._socket) {
      await waitMs(getBackoffMs(retries));
      await this.connect();

      return this.join(matchId, meta, retries + 1);
    }

    // add handler first
    this.setMatchDataHandler(this._matchDataHandler);

    let match;
    try {
      match = await this._socket.joinMatch(matchId, "", meta);
    } catch (error) {
      logger.debug(`Failed joinMatch for unhandled reason: @Error`, error);

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
        logger.debug(`Failed leaveMatch for unhandled reason: @Error`, error);
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
      await waitMs(getBackoffMs(retries));
      await this.connect();

      return this.sendMatchState(matchId, opCode, payload, retries + 1);
    }

    logger.debug(
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
        logger.debug(
          `Retrying failed sendMatchState (retry number @Retries) due to connection issue.`,
          retries,
        );

        // todo: clear socket?

        return this.sendMatchState(matchId, opCode, payload, retries + 1);
      } else {
        logger.debug(
          `Failed sendMatchState for unhandled reason: @Error`,
          error,
        );

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

    if (!this._session) {
      await waitMs(getBackoffMs(retries));
      await this.connect();

      return this.getApi(fn, retries + 1);
    }

    try {
      return await fn(this._client, this._session!);
    } catch (error) {
      if (error === "Socket connection has not been established yet.") {
        // reconnect and retry
        logger.debug(
          `Retrying failed API request (retry number @Retries) due to connection issue.`,
          retries,
        );

        // todo: clear session?

        return this.getApi(fn, retries + 1);
      } else {
        logger.debug(`Failed API request for unhandled reason: @Error`, error);

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

      logger.info("Retrying connection in @Ms ms.", ms);

      await waitMs(ms);
    }

    if (cancelToken.cancelled) {
      throw new Error("cancelled");
    }

    let session;
    try {
      session = await this._client.authenticateDevice(this._deviceId!, true);
    } catch (error) {
      logger.info("Failed to authenticate: @Error", error);

      return this.connectWithRetries(cancelToken, retries + 1);
    }

    if (cancelToken.cancelled) {
      throw new Error("cancelled");
    }

    const socket = this._client.createSocket(this._isSecure);
    try {
      await socket.connect(session, true);
    } catch (error) {
      logger.info("Failed to connect: @Error", error);

      return this.connectWithRetries(cancelToken, retries + 1);
    }

    if (cancelToken.cancelled) {
      socket.disconnect(false);

      throw new Error("cancelled");
    }

    // set high -- though this doesn't appear to do anything
    socket.setHeartbeatTimeoutMs(30000);
    this.setMatchDataHandler(this._matchDataHandler);

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

    // kick-off heartbeat
    this.heartbeat(cancelToken);

    // check for active match
    if (this._matchId) {
      logger.debug("Rejoining match @MatchId.", this._matchId);

      try {
        await this._socket.joinMatch(this._matchId, "", this._matchMeta!);
      } catch (error) {
        if ((error as any).code === 4) {
          // this is a match not found error, which means the match is no longer active
          logger.debug(
            "Failed joinMatch on connect() for match not found! Redirecting user to match results.",
          );

          this._matchId = null;
          this._matchMeta = null;

          // TODO: WHAT DO WE DO HERE
          //window.location.href = `/results/${_matchId}`;
        } else {
          logger.debug(
            `Failed joinMatch on connect() for unhandled reason, progressing to connected: @Error`,
            error,
          );
        }
      }
    } else {
      logger.debug("No active match to rejoin.");
    }

    logger.info("Connected.");
  }

  // Attempts to refresh the session. Returns true iff successful.
  private async refreshSession() {
    let session;
    try {
      session = await this._client.sessionRefresh(this._session!);
    } catch (error) {
      logger.error("Failed to refresh session: @Error", error as object);

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
        // nothing is handling this, just return
        return;
      }

      // only heartbeat if we have a session
      if (this._session) {
        // check expiry (five minutes before expiry)
        const now = Date.now();
        if (this._session.isexpired(now / 1000 + 600)) {
          logger.debug("Session is going to expire!");

          // Refresh the session. If it can't be refreshed, we need to
          // do a full disconnect/reconnect..
          const isRefreshed = await this.refreshSession();

          if (cancelToken.cancelled) {
            // nothing is handling this, just return
            return;
          }

          if (!isRefreshed) {
            this.disconnect();

            // ignore async nature, but catch errors
            this.connect().catch(() => {});
          }
        } else if (this._socket) {
          // ping with keep alive
          let res;
          try {
            res = await this._socket.rpc("heartbeat/ping", "{}");
          } catch (error) {
            logger.debug("Heartbeat failed!");

            if (cancelToken.cancelled) {
              // nothing is handling this, just return
              return;
            }

            this.disconnect();
            this.connect().catch(() => {});

            continue;
          }

          if (cancelToken.cancelled) {
            // nothing is handling this, just return
            return;
          }

          const {payload} = res;
          const {runtimeId} = JSON.parse(payload || "{}");
          if (this._runtimeId === null) {
            this._runtimeId = runtimeId;
          } else if (this._runtimeId !== runtimeId) {
            // full refresh
            logger.info("Runtime ID mismatch! Full refresh.");

            window.location.reload();
            return;
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
        logger.debug(
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
