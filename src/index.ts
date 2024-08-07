// core

// core/util
export {logger, childLogger, getHistory} from "./core/util/logger";
export {runFor, waitFor} from "./core/util/time";
export {asyncOps, repeatAsync} from "./core/util/async";
export {getBackoffMs, waitMs} from "./core/util/net";

// core/web3
export {fromWei, toWei} from "./core/web3/helpers";

// core/features/vault
//export {getVaultValue, isVaultFull} from "./core/features/vaults/helpers";

// client
export {createSpyreClient} from "./client/client";
export type {ISpyreClient, CreateSpyreClientOptions} from "./client/client";

// core/account
export type {User} from "./core/account/types";

// core/web3
export type {
  Web3Address,
  Web3ConnectionStatus,
  Web3Config,
  ContractConfig,
  Signature,
  SignStakeParameters,
  TxnStatus,
  Txn,
} from "./core/web3/types";

// react
export {SpyreClientProvider, SpyreConnect} from "./react/client-provider";

// react/hooks
export {useClient} from "./react/hooks/use-client";
export {
  useMultiplayerService,
  useNotificationService,
  useLeaderboardService,
} from "./react/hooks/use-services";

// react/hooks/connection
export {
  useConnectionService,
  useIsConnected,
} from "./react/hooks/use-connection";

// react/hooks/account
export {
  useAccount,
  useAccountBalances,
  useAccountCoins,
  useAccountWalletAddress,
  useAccountMetadata,
  useAccountRefresh,
  useAccountUpdate,
} from "./react/hooks/use-account";

// react/hooks/web3
export {
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
} from "./react/hooks/use-web3";

// redux?
