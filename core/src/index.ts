////////////////////////////////////////////////////////////////////////// core

// core/account
export type {User} from "@/core/account/types";
export type {IAccountService} from "@/core/account/interfaces";
export {AccountService} from "@/core/account/service";

// core/clock
export type {IClockService} from "@/core/clock/interfaces";
export {ClockService} from "@/core/clock/service";

// core/compliance
export type {IComplianceService} from "@/core/compliance/service";
export {ComplianceService} from "@/core/compliance/service";

// core/history
export type {
  IHistoryService,
  HistorySearchResults,
} from "@/core/history/interfaces";
export {HistoryService} from "@/core/history/service";
export type {HistorySearchCriteria} from "@/core/history/types";
export type {HistoryItem, HistorySummaryItem} from "@/core/history/types.gen";

// core/leaderboards
export type {ILeaderboardService} from "@/core/leaderboards/interfaces";
export {LeaderboardService} from "@/core/leaderboards/service";
export type {
  LbWinnersResponse,
  LbListResponse,
  LbRecord,
  RewardDefinition,
} from "@/core/leaderboards/types";

// core/multiplayer
export type {
  IMultiplayerService,
  IMatchHandler,
  IMatchHandlerFactory,
  IMatchContext,
} from "@/core/multiplayer/interfaces";
export {MultiplayerService} from "@/core/multiplayer/service";
export type {
  MatchmakingAcceptSignals,
  MatchmakingBracketInfo,
  MatchUserState,
  MatchStartEvent,
  MatchEndEvent,
  DisconnectReason,
} from "@/core/multiplayer/types";
export type {BracketDefinition} from "@/core/multiplayer/types.gen";

// core/net
export type {IRpcService, IConnectionService} from "@/core/net/interfaces";
export {ConnectionService} from "@/core/net/service";

// core/notifications
export type {INotificationService} from "@/core/notifications/interfaces";
export {NotificationService} from "@/core/notifications/service";
export type {Notification, NotificationCodes} from "@/core/notifications/types";

// core/shared
export type {
  AsyncOp,
  Kv,
  AsyncValue,
  WatchedAsyncValue,
  CancelToken,
} from "@/core/shared/types";
export {WatchedValue, SpyreError} from "@/core/shared/types";
export type {MatchmakingInfo} from "@/core/shared/types.gen";
export {Dispatcher} from "@/core/shared/dispatcher";
export type {IDispatcher} from "@/core/shared/dispatcher";
export {Messages} from "@/core/shared/message";
export {SpyreErrorCode} from "@/core/shared/errors";

// core/util
export {logger, childLogger, getHistory} from "@/core/util/logger";
export type {ILogTarget} from "@/core/util/logger";
export {runFor, waitFor} from "@/core/util/time";
export {asyncOps, repeatAsync} from "@/core/util/async";
export {getBackoffMs, waitMs} from "@/core/util/net";

// core/vault
export type {IVaultService} from "@/core/vault/interfaces";
export {VaultService} from "@/core/vault/service";
export type {TimedVault} from "@/core/vault/types.gen";

// core/web3
export type {IWeb3Service} from "@/core/web3/interfaces";
export type {
  Web3Address,
  Web3ConnectionStatus,
  Web3Config,
  ContractConfig,
  Signature,
  SignStakeParameters,
  TxnStatus,
} from "@/core/web3/types";
export {SigningError, SigningErrorType, Txn} from "@/core/web3/types";
export type {
  AuthWalletVerifyResponse,
  DepositResponse,
  GetLinkChallengeResponse,
  GetNonceResponse,
  GetTxnRpcResponse,
  PermitResponse,
} from "@/core/web3/types.gen";
export {bigIntToString, toWei, fromWei} from "@/core/web3/helpers";

// client
export {SpyreClient} from "@/core/client";
export type {ISpyreClient} from "@/core/interfaces";
export type {CreateSpyreClientOptions, LogConfig} from "@/core/types";

///////////////////////////////////////////////////////////////////////// react
export {SpyreClientCtx} from "@/react/client-provider";

// react/hooks
export {useClient, useDeviceId} from "@/react/hooks/use-client";
export {
  useMultiplayerService,
  useLeaderboardService,
} from "@/react/hooks/use-services";

// react/hooks/account
export {
  useAccount,
  useAccountRefresh,
  useAccountUpdate,
  useAccountUpdateUsername,
} from "@/react/hooks/use-account";

// react/hooks/clock
export {useClockOffsetMillis} from "@/react/hooks/use-clock";

// reac/hooks/compliance
export {
  useComplianceRefresh,
  useComplianceRaffles,
  useComplianceCashGames,
  useComplianceUpdateBirthday,
  useComplianceUpdateLocation,
} from "@/react/hooks/use-compliance";

// react/hooks/connection
export {
  useConnectionService,
  useIsConnected,
} from "@/react/hooks/use-connection";

// react/hooks/discord
export {
  useDiscordConnectionStatus,
  useDiscordUserId,
  useDiscordUsername,
  useDiscordUnlink,
} from "@/react/hooks/use-discord";

// react/hooks/elo
export {useElo, useEloHistory} from "@/react/hooks/use-elo";

// react/hooks/history
export {useHistoryFind, useHistoryGet} from "@/react/hooks/use-history";

// react/hooks/leaderboard
export {useLbGet, useLbWinners} from "@/react/hooks/use-leaderboards";

// react/hooks/multiplayer
export {
  useMpBrackets,
  useMpBracketRefreshSecUTC,
  useMpBracket,
  useMpMatchmakingFind,
  useMpMatchmakingAcceptAndJoin,
  useMpMatchmakingInfo,
  useMpMatchmakingJoinIds,
  useMpMatchId,
  useMpMatchBracketDefId,
  useMpSend,
} from "@/react/hooks/use-multiplayer";

// react/hooks/notifications
export {useNotifHandler} from "@/react/hooks/use-notifications";

// react/hooks/raffle
export {useRaffles, useRaffleSubmit} from "@/react/hooks/use-raffle";

// react/hooks/rpc
export {useRpcCall} from "@/react/hooks/use-rpc";

// react/hooks/vault
export {useVaultCollect, useVault} from "@/react/hooks/use-vaults";

// react/hooks/web3
export {
  useWeb3Config,
  useWeb3ConnectionStatus,
  useWeb3IsWalletConnected,
  useWeb3IsWalletConnectedAndLinked,
  useWeb3ActiveAddress,
  useWeb3LinkedAddress,
  useWeb3StakingBalance,
  useWeb3UsdcBalance,
  useWeb3NeedsSwitchChain,
  useWeb3SwitchChain,
  useWeb3RefreshBalances,
  useWeb3UsdcPermitAmount,
  useWeb3ApproveAndWatch,
  useWeb3DepositAndWatch,
  useWeb3Sign,
  useWeb3IsInAppWallet,
  useWeb3Link,
} from "@/react/hooks/use-web3";

// redux?
