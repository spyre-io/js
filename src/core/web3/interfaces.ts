import {
  Signature,
  SignStakeParameters,
  Txn,
  Web3Address,
  Web3Config,
  Web3ConnectionStatus,
} from "./types";

import {
  WatchedValue,
  WatchedAsyncValue,
  CancelToken,
} from "@/core/shared/types";

/**
 * The Web3 service provides access to the Spyre blockchain actions, coordinated through the Thirdweb client, chain-chomp, and other Spyre services.
 */
export interface IWeb3Service {
  /**
   * Retrieves the configuration for the Web3 service. This object cannot be changed at runtime.
   */
  get config(): Web3Config;

  /**
   * The current status of the Web3 connection.
   */
  get status(): WatchedValue<Web3ConnectionStatus>;

  /**
   * The current active address of the connected wallet.
   */
  get activeAddress(): WatchedValue<Web3Address | null>;

  /**
   * The address linked to the current user account. Note that this is NOT necessarily the same as the current active address. A user may have linked one account (via Metamask or some other provider), then switch wallets. Both the linked and the active addresses must match to perform Spyre transactions.
   */
  get linkedAddress(): WatchedValue<Web3Address | null>;

  /**
   * Indicates if the connected wallet is on the correct chain for the current service.
   */
  get needsToSwitchChains(): WatchedValue<boolean>;

  /**
   * The balance of USDC in the GameWallet staking contract.
   */
  get stakingBalance(): WatchedAsyncValue<bigint>;

  /**
   * The balance of USDC the user has in their wallet.
   */
  get usdcBalance(): WatchedAsyncValue<bigint>;

  /**
   * Given by the Spyre GameWallet contract, the date after which the user can withdraw their staked USDC.
   */
  get withdrawAfter(): WatchedAsyncValue<Date>;

  /**
   * An in-app wallet means that we can make wallet operations without user interaction.
   */
  get isInAppWallet(): WatchedValue<boolean>;

  /**
   * Switches the user's wallet to the correct chain given by the configuration.
   */
  switchChain(): Promise<void>;

  /**
   * Links the connected wallet to the current user account.
   */
  link(cancel?: CancelToken): Promise<void>;

  /**
   * Signs a stake, which can then be used to enter matches.
   *
   * @param params - The stake parameters needed to enter a match.
   * @param cancel - An optional cancel token to cancel the operation.
   */
  signStake(
    params: SignStakeParameters,
    cancel?: CancelToken,
  ): Promise<Signature>;

  /**
   * Checks if the user needs to approve a deposit. This is enforced by the USDC smart contract.
   *
   * @param wad - The amount to deposit.
   * @param cancel - An optional cancel token to cancel the operation.
   */
  requiresApproval(wad: bigint, cancel?: CancelToken): Promise<boolean>;

  /**
   * Approves the staking contract to transfer USDC on the user's behalf.
   *
   * The transaction object returned from this function represents a potentially in progress transaction. That is,
   * this function returns after submission, not after confirmation. Use the watch function to watch the transaction
   * for status changes.
   *
   * @param namespace - The namespace of the staking contract.
   * @param wad - The amount to approve.
   * @param cancel - An optional cancel token to cancel the operation.
   */
  approve(namespace: string, wad?: bigint, cancel?: CancelToken): Promise<Txn>;

  /**
   * Deposits USDC into the staking contract.
   *
   * The transaction object returned from this function represents a potentially in progress transaction. That is,
   * this function returns after submission, not after confirmation. Use the watch function to watch the transaction
   * for status changes.
   *
   * @param namespace - The namespace of the staking contract.
   * @param amount - The amount to deposit.
   * @param cancel - An optional cancel token to cancel the operation.
   */
  deposit(
    namespace: string,
    amount: bigint,
    cancel?: CancelToken,
  ): Promise<Txn>;

  /**
   * Watches a transaction for status change.
   *
   * @param txn The transaction to watch.
   */
  watch(txn: Txn): Promise<void>;
}
