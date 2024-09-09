////////////////////////////////////////////////////////////////////////// core

// core/account
export type {User} from "@/core/account/types";
export type {IAccountService} from "@/core/account/interfaces";

// core/clock
export type {IClockService} from "@/core/clock/interfaces";

// core/history
export type {IHistoryService} from "@/core/history/interfaces";
export type {HistorySearchCriteria} from "@/core/history/types";
export type {HistoryItem, HistorySummaryItem} from "@/core/history/types.gen";

// core/leaderboards
export type {ILeaderboardService} from "@/core/leaderboards/interfaces";
export type {LeaderboardEntry} from "@/core/leaderboards/types";

// core/multiplayer
export type {
  IMultiplayerService,
  IMatchHandler,
  IMatchHandlerFactory,
  IMatchContext,
} from "@/core/multiplayer/interfaces";
export type {
  MatchmakingAcceptSignals,
  MatchmakingBracketInfo,
} from "@/core/multiplayer/types";
export {
  MatchUserState,
  MatchStartEvent,
  MatchEndEvent,
  DisconnectReason,
} from "@/core/multiplayer/types";

// core/net
export type {IRpcService, IConnectionService} from "@/core/net/interfaces";

// core/notifications
export type {INotificationService} from "@/core/notifications/interfaces";
export type {Notification, NotificationCodes} from "@/core/notifications/types";

// core/shared
export type {
  AsyncOp,
  SpyreError,
  Kv,
  AsyncValue,
  CancelToken,
  WatchedAsyncValue,
  WatchedValue,
} from "@/core/shared/types";

// core/util
export {logger, childLogger, getHistory} from "@/core/util/logger";
export type {ILogTarget} from "@/core/util/logger";
export {runFor, waitFor} from "@/core/util/time";
export {asyncOps, repeatAsync} from "@/core/util/async";
export {getBackoffMs, waitMs} from "@/core/util/net";

// core/web3
export {fromWei, toWei} from "@/core/web3/helpers";
export type {IWeb3Service} from "@/core/web3/interfaces";
export type {
  Web3Address,
  Web3ConnectionStatus,
  Web3Config,
  ContractConfig,
  Signature,
  SignStakeParameters,
  SigningErrorType,
  TxnStatus,
  Txn,
} from "@/core/web3/types";

// client
export {createSpyreClient} from "@/core/client";
export type {ISpyreClient} from "@/core/interfaces";
export type {CreateSpyreClientOptions, LogConfig} from "@/core/types";

///////////////////////////////////////////////////////////////////////// react
export {SpyreClientProvider, SpyreConnect} from "@/react/client-provider";

// react/components
export {WalletConnection} from "@/react/components/WalletConnection";
export type {WalletConnectionProps} from "@/react/components/WalletConnection";

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
} from "@/react/hooks/use-account";

// react/hooks/clock
export {useClockOffsetMillis} from "@/react/hooks/use-clock";

// react/hooks/connection
export {
  useConnectionService,
  useIsConnected,
} from "@/react/hooks/use-connection";

// react/hooks/history
export {useHistoryFind, useHistoryGet} from "@/react/hooks/use-history";

// react/hooks/leaderboard
export {
  useLb,
  useLbDaily,
  useLbWeekly,
  useLbAll,
} from "@/react/hooks/use-leaderboards";

// react/hooks/multiplayer
export {
  useMpBrackets,
  useMpMatchmakingFind,
  useMpMatchmakingAcceptAndJoin,
  useMpMatchmakingInfo,
  useMpMatchmakingJoinIds,
  useMpMatchId,
  useMpMatchmakingMatchInfo,
} from "@/react/hooks/use-multiplayer";

// react/hooks/notifications
export {useNotifHandler} from "@/react/hooks/use-notifications";

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
  useWeb3RequiresApproval,
  useWeb3Approve,
  useWeb3Deposit,
  useWeb3Sign,
  useWeb3IsInAppWallet,
  useWeb3Link,
} from "@/react/hooks/use-web3";

// redux?
