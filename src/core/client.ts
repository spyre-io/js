import {ILogTarget} from "@/core/util/logger";
import {AccountService, IAccountService} from "@/core/account/service";
import {
  IMultiplayerService,
  MultiplayerService,
} from "@/core/multiplayer/service";
import {ConnectionService} from "@/core/net/service";
import {IConnectionService, IRpcService} from "@/core/net/interfaces";
import {
  INotificationService,
  NotificationService,
} from "@/core/notifications/service";
import {IWeb3Service, ThirdWebWeb3Service} from "@/core/web3/service";
import {Web3Config} from "@/core/web3/types";

import {v4, validate} from "uuid";
import {
  ILeaderboardService,
  LeaderboardService,
} from "@/core/leaderboards/service";
import {ThirdwebClient} from "thirdweb";
import {ConnectionManager} from "thirdweb/wallets";
import {Dispatcher} from "@/core/shared/dispatcher";
import {HistoryService, IHistoryService} from "@/core/history/service";

/**
 * Options for creating a new {@link ISpyreClient} instance.
 */
export type CreateSpyreClientOptions = {
  /**
   * Web3 configuration.
   */
  web3: Web3Config;

  /**
   * Optional logging configuration.
   */
  logging?: LogConfig;
};

/**
 * Logging configuration.
 */
export type LogConfig = {
  /**
   * Log targets may be specified, which will accept log messages from Spyre.
   */
  loggers: ILogTarget[];
};

/**
 * Retrieves the device ID from local storage. A device ID is a unique GUID that is stored in local storage. If one does not exist, a new one is generated.
 */
export const getDeviceId = (): string => {
  let id = localStorage.getItem("deviceId");
  if (!id || !validate(id)) {
    id = v4();
    localStorage.setItem("deviceId", id);
  }

  return id;
};

/**
 * The main client object that provides access to all Spyre services.
 */
export interface ISpyreClient {
  /**
   * Retrieves the {@link IAccountService} instance. This provides access to information about a user.
   */
  account: IAccountService;

  /**
   * Retrieves the {@link IHistoryService} instance. This provides an API for retrieving match history.
   */
  history: IHistoryService;

  /**
   * Retrieves the {@link ILeaderboardService} instance. This provides access to the leaderboard service, which allows you to retrieve and update leaderboard information.
   */
  leaderboards: ILeaderboardService;

  /**
   * Retrieves the {@link IMultiplayerService} instance. This provides access to multiplayer services, such as matchmaking and in-match communcation.
   */
  multiplayer: IMultiplayerService;

  /**
   * Retrieves the {@link IConnectionService} instance. This manages the socket connection to the Spyre servers. It automatically handles reconnections and disconnects.
   */
  connection: IConnectionService;

  /**
   * Retrieves the {@link INotificationService} instance. This listens to push events from Spyre servers.
   */
  notifications: INotificationService;

  /**
   * Retrieves the {@link IWeb3Service} instance. This provides an easy interface over Spyre's Game Wallet API, which connects off-chain account services with on-chain actions.
   */
  web3: IWeb3Service;

  /**
   * Retrieves the {@link IRpcService} instance. This provides access to the RPC service, which allows you to call functions on the server.
   */
  rpc: IRpcService;

  /**
   * Initializes the client. This should be called before using any other services.
   *
   * @param logConfig - Optional logging configuration.
   */
  initialize(logConfig?: LogConfig): Promise<void>;
}

class SpyreClient implements ISpyreClient {
  constructor(
    public readonly account: IAccountService,
    public readonly notifications: INotificationService,
    public readonly connection: IConnectionService,
    public readonly web3: IWeb3Service,
    public readonly multiplayer: IMultiplayerService,
    public readonly rpc: IRpcService,
    public readonly leaderboards: ILeaderboardService,
    public readonly history: IHistoryService,
  ) {
    //
  }

  async initialize(): Promise<void> {
    this.connection.init(getDeviceId());

    await this.connection.connect();
  }
}

/**
 * Creates an {@link ISpyreClient} instance.
 *
 * ```ts
 *
 * const client = createSpyreClient({
 *  options, thirdweb, connectionManager
 * });
 *
 * await client.initialize();
 * ```
 *
 * @param options Options for creating the client.
 * @param thirdweb A Thirdweb client instance. This allows external applications to manage the connection to the Thirdweb wallet.
 * @param connectionManager A Thirdweb connection manager instance.
 * @returns
 */
export function createSpyreClient(
  options: CreateSpyreClientOptions,
  thirdweb: ThirdwebClient,
  connectionManager: ConnectionManager,
): ISpyreClient {
  const events = new Dispatcher<any>();
  const notifications = new NotificationService();
  const leaderboards = new LeaderboardService();
  const connection = new ConnectionService(notifications);

  // todo: fix circular dependency
  notifications.init(connection);

  const account = new AccountService(connection, events);
  const history = new HistoryService(connection);

  const web3 = new ThirdWebWeb3Service(
    events,
    account,
    connection,
    connectionManager,
    options.web3,
    thirdweb,
  );
  const multiplayer = new MultiplayerService(
    connection,
    account,
    web3,
    connection,
  );

  return new SpyreClient(
    account,
    notifications,
    connection,
    web3,
    multiplayer,
    connection,
    leaderboards,
    history,
  );
}
