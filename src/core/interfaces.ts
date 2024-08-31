import {IAccountService} from "@/core/account/service";
import {IConnectionService, IRpcService} from "@/core/net/interfaces";
import {INotificationService} from "@/core/notifications/service";
import {IWeb3Service} from "@/core/web3/service";

import {ILeaderboardService} from "@/core/leaderboards/service";
import {IHistoryService} from "@/core/history/service";
import {IVaultService} from "./vault/service";
import {IClockService} from "./clock/service";
import {IMultiplayerService} from "./multiplayer/interfaces";
import {LogConfig} from "./types";

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
   * Retrieves the {@link IVaultService} instance. This provides access to the vault service, which allows you to manage vaults.
   */
  vaults: IVaultService;

  /**
   * Retrieves the {@link IClockService} instance. This provides access to an accurate server time offset.
   */
  clock: IClockService;

  /**
   * Initializes the client. This should be called before using any other services.
   *
   * @param logConfig - Optional logging configuration.
   */
  initialize(logConfig?: LogConfig): Promise<void>;
}
