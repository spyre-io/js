import {AccountService} from "@/core/account/service";
import {MultiplayerService} from "@/core/multiplayer/service";
import {ConnectionService} from "@/core/net/service";
import {IConnectionService, IRpcService} from "@/core/net/interfaces";
import {NotificationService} from "@/core/notifications/service";
import {ThirdWebWeb3Service} from "@/core/web3/service";

import {LeaderboardService} from "@/core/leaderboards/service";
import {ThirdwebClient} from "thirdweb";
import {ConnectionManager} from "thirdweb/wallets";
import {Dispatcher} from "@/core/shared/dispatcher";
import {HistoryService} from "@/core/history/service";
import {VaultService} from "./vault/service";
import {ClockService} from "./clock/service";
import {IMultiplayerService} from "./multiplayer/interfaces";
import {ISpyreClient} from "./interfaces";
import {getDeviceId} from "./util";
import {CreateSpyreClientOptions} from "./types";
import {IAccountService} from "./account/interfaces";
import {IWeb3Service} from "./web3/interfaces";
import {ILeaderboardService} from "./leaderboards/interfaces";
import {IClockService} from "./clock/interfaces";
import {IHistoryService} from "./history/interfaces";
import {INotificationService} from "./notifications/interfaces";
import {IVaultService} from "./vault/interfaces";

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
    public readonly vaults: IVaultService,
    public readonly clock: IClockService,
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
  const connection = new ConnectionService(notifications);
  const leaderboards = new LeaderboardService(connection);

  // todo: fix circular dependency
  notifications.init(connection);

  const account = new AccountService(connection, events);
  const history = new HistoryService(connection);
  const vaults = new VaultService(connection);

  const web3 = new ThirdWebWeb3Service(
    events,
    account,
    connection,
    connectionManager,
    options.web3,
    thirdweb,
  );
  const multiplayer = new MultiplayerService(connection, web3, connection);
  const clock = new ClockService(multiplayer);

  // todo: fix circular dependencies
  multiplayer.init(clock);
  connection.setMatchDataHandler(multiplayer);

  return new SpyreClient(
    account,
    notifications,
    connection,
    web3,
    multiplayer,
    connection,
    leaderboards,
    history,
    vaults,
    clock,
  );
}
