import {ILogTarget} from "./util/logger";
import {AccountService, IAccountService} from "./account/service";
import {IMultiplayerService, MultiplayerService} from "./multiplayer/service";
import {
  ConnectionService,
  IConnectionService,
  IRpcService,
} from "./net/service";
import {
  INotificationService,
  NotificationService,
} from "./notifications/service";
import {IWeb3Service, ThirdWebWeb3Service} from "./web3/service";
import {Web3Config} from "./web3/types";

import {v4, validate} from "uuid";
import {ILeaderboardService, LeaderboardService} from "./leaderboards/service";
import {ThirdwebClient} from "thirdweb";
import {ConnectionManager} from "thirdweb/wallets";

export type CreateSpyreClientOptions = {
  web3: Web3Config;
  logging?: LogConfig;
};

export type LogConfig = {
  loggers: ILogTarget[];
};

export const getDeviceId = (): string => {
  let id = localStorage.getItem("deviceId");
  if (!id || !validate(id)) {
    id = v4();
    localStorage.setItem("deviceId", id);
  }

  return id;
};

export interface ISpyreClient {
  account: IAccountService;
  notifications: INotificationService;
  connection: IConnectionService;
  web3: IWeb3Service;
  multiplayer: IMultiplayerService;
  rpc: IRpcService;
  leaderboards: ILeaderboardService;

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
  ) {
    //
  }

  async initialize(): Promise<void> {
    this.connection.init(getDeviceId());

    await this.connection.connect();
  }
}

export function createSpyreClient(
  options: CreateSpyreClientOptions,
  thirdweb: ThirdwebClient,
  connectionManager: ConnectionManager,
): SpyreClient {
  const notifications = new NotificationService();
  const leaderboards = new LeaderboardService();
  const connection = new ConnectionService(notifications);

  // todo: fix circular dependency
  notifications.init(connection);

  const account = new AccountService(connection);

  const web3 = new ThirdWebWeb3Service(
    options.web3,
    account,
    connection,
    thirdweb,
    connectionManager,
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
  );
}
