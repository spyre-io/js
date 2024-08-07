import {
  Signature,
  SigningErrorType,
  SigniningError,
  SignStakeParameters,
  Txn,
  Web3Address,
  Web3Config,
  Web3ConnectionStatus,
} from "./types";

import {
  getDepositDomain,
  getDepositTypes,
  getPermitDomain,
  getPermitTypes,
  getRSV,
  getStakingDomain,
  getStakingTypes,
} from "./helpers";
import {base, baseSepolia, Chain} from "thirdweb/chains";
import {ConnectionManager} from "thirdweb/wallets";
import {
  getContract,
  readContract,
  ThirdwebClient,
  ThirdwebContract,
} from "thirdweb";
import {asyncOps} from "../util/async";
import {IAccountService} from "../account/service";
import {ReadContractResult} from "thirdweb/dist/types/transaction/read-contract";
import {
  WatchedValue,
  WatchedAsyncValue,
  SpyreError,
  CancelToken,
} from "../shared/types";
import {SpyreErrorCode} from "../shared/errors";
import {IRpcService} from "../../core/net/service";
import {DepositResponse, GetNonceResponse, PermitResponse} from "./types.gen";

/*export const useHangmanDomain = () => {
  const params = useWeb3Contants();
  return {
    "name": "gamestaking",
    "version": "1",
    "chainId": params.chainId.toHexString(),
    "verifyingContract": params.contracts.staking.addr,
  };
};*/

export interface IWeb3Service {
  get config(): Web3Config;

  // setup
  get status(): WatchedValue<Web3ConnectionStatus>;
  get activeAddress(): WatchedValue<Web3Address | null>;
  get linkedAddress(): WatchedValue<Web3Address | null>;
  get needsToSwitchChains(): WatchedValue<boolean>;

  // balance
  get stakingBalance(): WatchedAsyncValue<bigint>;
  get usdcBalance(): WatchedAsyncValue<bigint>;

  // withdrawal
  get withdrawAfter(): WatchedAsyncValue<Date>;

  switchChain(): Promise<void>;
  signStake(
    params: SignStakeParameters,
    cancel?: CancelToken,
  ): Promise<Signature>;

  requiresApproval(wad: bigint, cancel?: CancelToken): Promise<boolean>;
  approve(wad?: bigint, cancel?: CancelToken): Promise<Txn>;
  deposit(amount: bigint, cancel?: CancelToken): Promise<Txn>;
}

export class ThirdWebWeb3Service implements IWeb3Service {
  public readonly network: Chain;

  _status: WatchedValue<Web3ConnectionStatus> =
    new WatchedValue<Web3ConnectionStatus>("disconnected");
  _activeAddress: WatchedValue<Web3Address | null> =
    new WatchedValue<Web3Address | null>(null);
  _linkedAddress: WatchedValue<Web3Address | null> =
    new WatchedValue<Web3Address | null>(null);
  _needsToSwitchChains: WatchedValue<boolean> = new WatchedValue(false);

  public readonly stakingContract: ThirdwebContract<any>;
  public readonly usdcContract: ThirdwebContract<any>;

  public readonly stakingBalance: WatchedAsyncValue<bigint>;
  public readonly usdcBalance: WatchedAsyncValue<bigint>;
  public readonly withdrawAfter: WatchedAsyncValue<Date> = {
    value: new WatchedValue(new Date()),
    fetch: new WatchedValue(asyncOps.new()),
    refresh: async () => {
      throw new Error("Not implemented");
    },
  };

  constructor(
    public readonly config: Web3Config,
    private readonly _account: IAccountService,
    private readonly _rpc: IRpcService,
    public readonly thirdweb: ThirdwebClient,
    private readonly _connectionManager: ConnectionManager,
  ) {
    if (!config.contracts["staking"]) {
      throw new Error("Missing staking contract");
    }

    if (!config.contracts["usdc"]) {
      throw new Error("Missing usdc contract");
    }

    this.network = config.chainId === 8432 ? base : baseSepolia;

    // load contracts
    this.stakingContract = getContract({
      client: thirdweb,
      chain: this.network,
      address: config.contracts.staking.addr,
      abi: config.contracts.staking.abi,
    });
    this.usdcContract = getContract({
      client: thirdweb,
      chain: this.network,
      address: config.contracts.usdc.addr,
      abi: config.contracts.usdc.abi,
    });

    // setup async values
    this.stakingBalance = {
      value: new WatchedValue<bigint>(BigInt(0)),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        this.stakingBalance.fetch.setValue(asyncOps.inProgress());

        let result: ReadContractResult<any>;
        try {
          result = await readContract({
            contract: this.stakingContract,
            method: "balances",
            params: [this._account.user?.walletAddr],
          });
        } catch (error) {
          this.stakingBalance.fetch.setValue(asyncOps.failure(error));

          return;
        }

        this.stakingBalance.value.setValue(result.value);
        this.stakingBalance.fetch.setValue(asyncOps.success());
      },
    };

    this.usdcBalance = {
      value: new WatchedValue<bigint>(BigInt(0)),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        this.usdcBalance.fetch.setValue(asyncOps.inProgress());

        let result: ReadContractResult<any>;
        try {
          result = await readContract({
            contract: this.usdcContract,
            method: "balanceOf",
            params: [this._account.user?.walletAddr],
          });
        } catch (error) {
          this.usdcBalance.fetch.setValue(asyncOps.failure(error));

          return;
        }

        this.usdcBalance.value.setValue(result.value);
        this.usdcBalance.fetch.setValue(asyncOps.success());
      },
    };

    // listen to thirdweb
    const thirdwebConnectionStatus =
      this._connectionManager.activeWalletConnectionStatusStore;
    this._status.setValue(thirdwebConnectionStatus.getValue());
    thirdwebConnectionStatus.subscribe(() => {
      const status = thirdwebConnectionStatus.getValue();
      this._status.setValue(
        status === "connected" ? "connected" : "disconnected",
      );
    });

    const thirdwebActiveAccount = this._connectionManager.activeAccountStore;
    this._activeAddress.setValue(
      (thirdwebActiveAccount.getValue()?.address as Web3Address) || null,
    );
    thirdwebActiveAccount.subscribe(() => {
      this._activeAddress.setValue(
        (thirdwebActiveAccount.getValue()?.address as Web3Address) || null,
      );
    });

    const thirdwebActiveChain = this._connectionManager.activeWalletChainStore;
    this._needsToSwitchChains.setValue(
      thirdwebActiveChain.getValue()?.id !== this.network.id,
    );
    thirdwebActiveChain.subscribe(() => {
      this._needsToSwitchChains.setValue(
        thirdwebActiveChain.getValue()?.id !== this.network.id,
      );
    });

    // listen to account
    this._account.onUpdate((user) => {
      this._linkedAddress.setValue(user.walletAddr);
    });
    this._linkedAddress.setValue(this._account.user.walletAddr);
  }

  get status(): WatchedValue<Web3ConnectionStatus> {
    return this._status;
  }

  get needsToSwitchChains(): WatchedValue<boolean> {
    return this._needsToSwitchChains;
  }

  get activeAddress(): WatchedValue<Web3Address | null> {
    return this._activeAddress;
  }

  get linkedAddress(): WatchedValue<Web3Address | null> {
    return this._linkedAddress;
  }

  requiresApproval(wad: bigint, cancel?: CancelToken): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  approve = async (wad?: bigint, cancel?: CancelToken): Promise<Txn> => {
    const account = this._connectionManager.activeAccountStore.getValue();
    if (!account) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Wallet is not connected.",
      );
    }

    if (this.linkedAddress.getValue() !== this.activeAddress.getValue()) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Connected wallet address is not linked to account.",
      );
    }

    cancel?.throwIfCancelled();

    // get nonce first
    let nonce: ReadContractResult<any>;
    try {
      nonce = await readContract({
        contract: this.usdcContract,
        method: "nonces",
        params: [this._linkedAddress.getValue()],
      });
    } catch (error) {
      throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to get nonce.", [
        error,
      ]);
    }

    cancel?.throwIfCancelled();

    const domain = getPermitDomain({
      contractAddr: this.config.contracts.usdc.addr,
      chainId: this.network.id,
    });
    const types = {Permit: getPermitTypes()};
    const permit = {
      owner: this._linkedAddress.getValue(),
      spender: this.config.contracts.staking.addr,
      value:
        wad ||
        BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ),
      nonce,
      deadline: BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      ),
    };

    let signResult;
    try {
      signResult = await account.signTypedData({
        domain,
        types,
        primaryType: "Permit",
        message: permit,
      });
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to sign permit.",
        [error],
      );
    }

    cancel?.throwIfCancelled();

    let permitResult;
    try {
      permitResult = await this._rpc.call<PermitResponse>("pipeline/permit", {
        permit,
        signedMsg: signResult,
      });
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Permit successfully signed, but there was an error submitting.",
        [error],
      );
    }

    cancel?.throwIfCancelled();

    if (!permitResult.payload.success) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit permit.",
        [permitResult.payload.error],
      );
    }

    const txn = new Txn(permitResult.payload.txnId);

    // todo: WATCH txn

    return txn;
  };

  deposit = async (wad: bigint, cancel?: CancelToken): Promise<Txn> => {
    const account = this._connectionManager.activeAccountStore.getValue();
    if (!account) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Wallet is not connected.",
      );
    }

    if (this.linkedAddress.getValue() !== this.activeAddress.getValue()) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Connected wallet address is not linked to account.",
      );
    }

    cancel?.throwIfCancelled();

    // get nonce
    const {
      payload: {success, nonce},
    } = await this._rpc.call<GetNonceResponse>("nonces/get-nonce", {});
    if (!success) {
      throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to get nonce.");
    }

    const domain = getDepositDomain({
      contractAddr: this.config.contracts.staking.addr,
      chainId: this.network.id,
    });
    const types = {Deposit: getDepositTypes()};
    const deposit = {
      user: this.linkedAddress.getValue(),
      nonce: BigInt(nonce),
      expiry: BigInt(0),
      amount: BigInt(wad + "000000"),
      fee: BigInt(0),
    };

    let result;
    try {
      result = await account.signTypedData({
        domain,
        primaryType: "Deposit",
        types,
        message: deposit,
      });
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to sign deposit.",
      );
    }

    const signature = result;
    const rsv = getRSV(signature);

    let depositResult;
    try {
      depositResult = await this._rpc.call<DepositResponse>(
        "pipeline/deposit",
        {
          deposit,
          signedMsg: rsv,
        },
      );
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit deposit.",
      );
    }

    cancel?.throwIfCancelled();

    if (!depositResult.payload.success) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit deposit.",
      );
    }

    const txn = new Txn(depositResult.payload.txnId);

    // TODO: WATCH txn

    return txn;
  };

  switchChain = async (): Promise<void> => {
    await this._connectionManager.switchActiveWalletChain(this.network);
  };

  signStake = async (
    {nonce, expiry, amount, fee}: SignStakeParameters,
    cancel?: CancelToken,
  ): Promise<Signature> => {
    const account = this._connectionManager.activeAccountStore.getValue();
    if (!account) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Wallet is not connected.",
      );
    }

    if (this.linkedAddress.getValue() !== this.activeAddress.getValue()) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Connected wallet address is not linked to account.",
      );
    }

    const domain = getStakingDomain({
      chainId: this.network.id,
      contractAddr: this.config.contracts["staking"].addr,
      name: this.config.name,
      version: "2",
    });
    const types = {Stake: getStakingTypes()};
    const stake = {
      user: this.activeAddress.getValue(),
      nonce,
      expiry,
      amount,
      fee,
    };

    let result;
    try {
      result = await account.signTypedData({
        domain,
        types,
        primaryType: "Stake",
        message: stake,
      });
    } catch (error) {
      if ((error as any).code === 4001) {
        // TODO: MIXPANEL

        // user canceled -- do nothing
        throw new SigniningError(SigningErrorType.USER_CANCELED);
      }

      if ((error as any).code === -32603) {
        // TODO: MIXPANEL
        //mixpanel.track("stake/sign/error", { nonce, });

        // TODO: wrong chain
        //switchChain(network);

        throw new SigniningError(SigningErrorType.WRONG_CHAIN);
      }

      // TODO: MIXPANEL
      // TODO: SENTRY
      //mixpanel.track("stake/sign/error", { nonce, });
      //Sentry.captureException(error);

      throw new SigniningError(
        SigningErrorType.UNKNOWN,
        (error as any).message,
      );
    }

    return getRSV(result);
  };
}
