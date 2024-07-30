import {
  Client,
  Match,
  MatchData,
  Notification,
  Session,
  Socket,
} from "@heroiclabs/nakama-js";
import {getBackoffMs, waitMs} from "../util/net";
import {childLogger} from "../util/logger";
import {v4} from "uuid";
import {ApiRpc} from "@heroiclabs/nakama-js/dist/api.gen";
import {Kv} from "core/shared/types";

const log = childLogger("net");

const _isSecure = process.env.NEXT_PUBLIC_NAKAMA_SSL_ENABLED === "true";

const _client = new Client(
  process.env.NEXT_PUBLIC_NAKAMA_SERVER_KEY,
  process.env.NEXT_PUBLIC_NAKAMA_HOST,
  process.env.NEXT_PUBLIC_NAKAMA_PORT,
  _isSecure,
  3000,
  false,
);

// set on connection
let _session: Session | null;
let _socket: Socket | null;

// set in init
let _deviceId: string | null = null;
let _runtimeId: string | null = null;

// set in emitter
let _onMatchData: (message: MatchData) => void;
let _onNotificationReceived: (message: Notification) => void;

// set in join
let _matchId: string | null = null;
let _matchMeta: object | null = null;

// set in connect
let _connectCancel: CancelToken | null = null;
let _connectPromise: Promise<void> | null = null;

type CancelToken = {
  cancelled: boolean;
  cancel: () => void;
};

const newCancelToken = () => {
  const token: CancelToken = {
    cancelled: false,
    cancel: () => (token.cancelled = true),
  };

  return token;
};

const heartbeat = async (cancelToken: CancelToken) => {
  while (!cancelToken.cancelled) {
    // first, wait
    await waitMs(5000);

    // check cancel
    if (cancelToken.cancelled) {
      throw new Error("cancelled");
    }

    // only heartbeat if we have a session
    if (_session) {
      // check expiry (five minutes before expiry)
      const now = Date.now();
      if (_session.isexpired(now / 1000 + 600)) {
        log.debug("Session is going to expire!");

        // Refresh the session. If it can't be refreshed, we need to
        // do a full disconnect/reconnect..
        const isRefreshed = await refreshSession();

        if (cancelToken.cancelled) {
          throw new Error("cancelled");
        }

        if (!isRefreshed) {
          disconnect();
          connect();
        }
      } else {
        if (_socket) {
          // ping with keep alive
          let res;
          try {
            res = await _socket.rpc("heartbeat/ping", "{}");
          } catch (error) {
            log.debug("Heartbeat failed!");

            if (cancelToken.cancelled) {
              throw new Error("cancelled");
            }

            disconnect();
            connect();

            continue;
          }

          if (cancelToken.cancelled) {
            throw new Error("cancelled");
          }

          const {payload} = res;
          const {runtimeId} = JSON.parse(payload || "{}");
          if (_runtimeId === null) {
            _runtimeId = runtimeId;
          } else if (_runtimeId !== runtimeId) {
            // full refresh
            log.info("Runtime ID mismatch! Full refresh.");

            window.location.reload();
            return;
          }
        }
      }
    }
  }
};

// Attempts to refresh the session. Returns true iff successful.
const refreshSession = async () => {
  let session;
  try {
    session = await _client.sessionRefresh(_session!);
  } catch (error) {
    log.error("Failed to refresh session: @Error", error as object);

    return false;
  }

  _session = session;
  return true;
};

// Connects in a loop with exponential backoff. Doesn't quit until
// the connection is established or the cancel token is cancelled.
const connectWithRetries = async (
  cancelToken: CancelToken,
  retries: number = 0,
) => {
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
    session = await _client.authenticateDevice(_deviceId!, true);
  } catch (error) {
    log.info("Failed to authenticate: @Error", error);

    return await connectWithRetries(cancelToken, retries + 1);
  }

  if (cancelToken.cancelled) {
    throw new Error("cancelled");
  }

  const socket = _client.createSocket(_isSecure);
  try {
    await socket.connect(session, true);
  } catch (error) {
    log.info("Failed to connect: @Error", error);

    return await connectWithRetries(cancelToken, retries + 1);
  }

  if (cancelToken.cancelled) {
    socket.disconnect(false);

    throw new Error("cancelled");
  }

  // set high -- though this doesn't appear to do anything
  socket.setHeartbeatTimeoutMs(30000);

  socket.onmatchdata = (message) => {
    if (_onMatchData) {
      _onMatchData(message);
    }
  };
  socket.onnotification = (message) => {
    if (_onNotificationReceived) {
      _onNotificationReceived(message);
    }
  };

  // save connection objects
  _socket = socket;
  _session = session;

  // check for active match
  if (_matchId) {
    log.debug("Rejoining match @MatchId.", _matchId);

    try {
      await _socket.joinMatch(_matchId, "", _matchMeta!);
    } catch (error) {
      if ((error as any).code === 4) {
        // this is a match not found error, which means the match is no longer active
        log.debug(
          "Failed joinMatch on connect() for match not found! Redirecting user to match results.",
        );

        _matchId = null;
        _matchMeta = null;

        window.location.href = `/results/${_matchId}`;
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
};

// Calls an RPC with retries.
const rpcWithRetry = async (
  id: string,
  payload: string,
  retries: number = 0,
) => {
  if (retries > 5) {
    throw new Error("Too many retries.");
  }

  if (!_socket) {
    await connect();
    await waitMs(getBackoffMs(retries));

    return await rpcWithRetry(id, payload, retries + 1);
  }

  let res;
  try {
    res = await _socket.rpc(id, payload);
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
      return await rpcWithRetry(id, payload, retries + 1);
    } else {
      // unknown
      // TODO: SENTRY
      //Sentry.captureException(error);
    }

    throw error;
  }

  return res;
};

// Public interface.

// Initializes the connection with the given device ID.
export const init = (deviceId: string) => {
  if (_deviceId) {
    // safely return if already initialized with the same parameters
    if (_deviceId === deviceId) {
      return;
    }

    throw new Error(
      `Already initialized, current deviceId '${_deviceId}' != '${deviceId}'.`,
    );
  }

  _deviceId = deviceId;

  // kick-off heartbeat
  heartbeat(newCancelToken());
};

// Connects to the server. This is safe to call at any time, as it will
// only connect if not already connected.
export const connect = async () => {
  if (!_deviceId) {
    throw new Error("Not initialized.");
  }

  if (!_connectPromise) {
    _connectCancel = newCancelToken();
    _connectPromise = connectWithRetries(_connectCancel);
  }

  return _connectPromise;
};

// Disconnects from the server.
export const disconnect = () => {
  if (!_deviceId) {
    throw new Error("Not initialized.");
  }

  if (_connectCancel) {
    _connectCancel.cancel();
    _connectCancel = null;
  }

  if (_socket) {
    _socket.disconnect(true);
    _socket = null;
  }

  _session = null;
  _connectPromise = null;
};

// TODO: wrap
export const getSession = () => _session;
export const getSocket = () => _socket;
export const getIsConnected = () => !!_socket;

export const setSocketEvents = ({
  onMatchData,
  onNotificationReceived,
}: {
  onMatchData: (message: MatchData) => void;
  onNotificationReceived: (message: Notification) => void;
}) => {
  _onMatchData = onMatchData;
  _onNotificationReceived = onNotificationReceived;
};

// The RPC interface. This both deduplicates requests and auto-reconnects if
// there is a connection failure.
type ParsedApiRpc = ApiRpc & {payload: any};
const requestCache: {[key: string]: Promise<ParsedApiRpc>} = {};
export const getRpc = (id: string, input: any) => {
  const payload = JSON.stringify(input);
  const key = id + payload;

  let req = requestCache[key];
  if (!req) {
    const uuid = v4();

    log.debug("Rpc start [@Uuid] --> @RPC", uuid, id);

    req = requestCache[key] = rpcWithRetry(id, payload)
      .then((res) => {
        // deletes the cache entry
        delete requestCache[key];

        log.debug("Rpc end [@Uuid] <-- @RPC: @Response", uuid, id, res);

        return {
          ...res,
          payload: JSON.parse(res.payload || "{}"),
        };
      })
      .catch((error) => {
        log.debug("Rpc error [@Uuid] <-- @RPC: @Error", uuid, id, error);

        // deletes the cache entry-- note that this cannot go in onFinally as
        // this would break retry logic
        delete requestCache[key];

        throw error;
      });
  }

  return req;
};

// Joins a match with the given match ID and metadata. This should be used
// rather than the socket directly, as it handles reconnects.
export const join = async (
  matchId: string,
  meta: Kv<string>,
  retries: number = 3,
): Promise<Match> => {
  if (!_socket) {
    await connect();
    await waitMs(getBackoffMs(retries));

    return join(matchId, meta, retries + 1);
  }

  let match;
  try {
    match = await _socket.joinMatch(matchId, "", meta);
  } catch (error) {
    log.debug(`Failed joinMatch for unhandled reason: @Error`, error);

    throw error;
  }

  _matchId = matchId;
  _matchMeta = meta;

  return match;
};

// Leaves the current match. This should be used when a match is complete
// so that reconnects don't attempt to rejoin matches.
export const leave = async () => {
  if (_matchId) {
    try {
      await _socket!.leaveMatch(_matchId);
    } catch (error) {
      log.debug(`Failed leaveMatch for unhandled reason: @Error`, error);
    }
  }

  _matchId = null;
  _matchMeta = null;
};

// Sends a match state update. This should be used rather than the socket
// directly, as it handles reconnects.
export const sendMatchState = async (
  matchId: string,
  opCode: number,
  payload: string | Uint8Array,
  retries: number = 0,
): Promise<void> => {
  if (retries > 5) {
    throw new Error("Too many retries.");
  }

  // reconnect if necessary
  if (!_socket) {
    await connect();
  }

  log.debug(
    "Sending match state @MatchId @OpCode @Payload",
    matchId,
    opCode,
    payload,
  );

  try {
    await _socket!.sendMatchState(matchId, opCode, payload);
  } catch (error) {
    if (error === "Socket connection has not been established yet.") {
      // reconnect and retry
      log.debug(
        `Retrying failed sendMatchState (retry number @Retries) due to connection issue.`,
        retries,
      );

      disconnect();
      await connect();

      return await sendMatchState(matchId, opCode, payload, retries + 1);
    } else {
      log.debug(`Failed sendMatchState for unhandled reason: @Error`, error);

      // unknown
      // TODO: SENTRY
      //Sentry.captureException(error);

      throw error;
    }
  }
};

type AsyncClientFn = (client: Client, session: Session) => Promise<any>;

export const getApi = async (
  fn: AsyncClientFn,
  retries: number = 0,
): Promise<any> => {
  if (retries > 5) {
    throw new Error("Too many retries.");
  }

  try {
    return await fn(_client, _session!);
  } catch (error) {
    if (error === "Socket connection has not been established yet.") {
      // reconnect and retry
      log.debug(
        `Retrying failed API request (retry number @Retries) due to connection issue.`,
        retries,
      );

      disconnect();
      await connect();

      return await getApi(fn, retries + 1);
    } else {
      log.debug(`Failed API request for unhandled reason: @Error`, error);

      // unknown
      //Sentry.captureException(error);
      // TODO: SENTRY

      throw error;
    }
  }
};
