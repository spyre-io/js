import {
  AccountService,
  ClockService,
  ConnectionService,
  CreateSpyreClientOptions,
  Dispatcher,
  HistoryService,
  ISpyreClient,
  LeaderboardService,
  MultiplayerService,
  NotificationService,
  SpyreClient,
  VaultService,
} from "@spyre-io/js";
import {ThirdwebClient} from "thirdweb";
import {ConnectionManager} from "thirdweb/wallets";
import {ThirdWebWeb3Service} from "./service";

/**
 * Creates an {@link ISpyreClient} instance for Thirdweb.
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
export function createThirdwebSpyreClient(
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
