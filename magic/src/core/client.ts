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
import {MagicWeb3Service} from "./service";
import {AptosExtension} from "@magic-ext/aptos";
import {Extension, InstanceWithExtensions, SDKBase} from "@magic-sdk/provider";

/**
 * Creates an {@link ISpyreClient} instance for Magic.
 *
 * ```ts
 *
 * const client = createMagicSpyreClient({
 *  options, magic,
 * });
 *
 * await client.initialize();
 * ```
 *
 * @param options Options for creating the client.
 * @param magic A Magic client instance, created with `new Magic()`. This allows external applications to manage the connection to Magic.
 * @returns
 */
export function createMagicSpyreClient(
  options: CreateSpyreClientOptions,
  magic: InstanceWithExtensions<SDKBase, [AptosExtension, Extension]>,
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

  const web3 = new MagicWeb3Service(connection, events, options.web3, magic);
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
