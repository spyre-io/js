import {
  getDepositDomain,
  getDepositTypes,
  getPermitDomain,
  getPermitTypes,
  getRSV,
  getStakingDomain,
  getStakingTypes,
} from "@/core/helpers";

import {
  Signature,
  SigningErrorType,
  SigningError,
  SignStakeParameters,
  Txn,
  Web3Address,
  Web3Config,
  Web3ConnectionStatus,
  bigIntToString,
  asyncOps,
  IAccountService,
  WatchedValue,
  WatchedAsyncValue,
  SpyreError,
  CancelToken,
  SpyreErrorCode,
  IRpcService,
  AuthWalletVerifyResponse,
  DepositResponse,
  GetLinkChallengeResponse,
  GetNonceResponse,
  GetTxnRpcResponse,
  PermitResponse,
  Dispatcher,
  Messages,
  childLogger,
  IWeb3Service,
} from "@spyre-io/js";

import {
  getContract,
  Hex,
  readContract,
  ThirdwebClient,
  ThirdwebContract,
} from "thirdweb";
import {base, baseSepolia, Chain} from "thirdweb/chains";
import {ConnectionManager} from "thirdweb/wallets";
import {ReadContractResult} from "thirdweb/dist/types/transaction/read-contract";
import {IDispatcher} from "@spyre-io/js/dist/core/shared/dispatcher";

const logger = childLogger("becky:web3");

export class ThirdWebWeb3Service implements IWeb3Service {
  public readonly network: Chain;

  _status: WatchedValue<Web3ConnectionStatus> =
    new WatchedValue<Web3ConnectionStatus>("disconnected");
  _activeAddress: WatchedValue<Web3Address | null> =
    new WatchedValue<Web3Address | null>(null);
  _linkedAddress: WatchedValue<Web3Address | null> =
    new WatchedValue<Web3Address | null>(null);
  _needsToSwitchChains: WatchedValue<boolean> = new WatchedValue(false);
  _isInAppWallet: WatchedValue<boolean> = new WatchedValue(false);

  public readonly stakingContract: ThirdwebContract<any>;
  public readonly usdcContract: ThirdwebContract<any>;

  public readonly stakingBalance: WatchedAsyncValue<bigint>;
  public readonly usdcBalance: WatchedAsyncValue<bigint>;
  public readonly usdcPermitAmount: WatchedAsyncValue<bigint>;
  public readonly withdrawAfter: WatchedAsyncValue<Date> = {
    value: new WatchedValue(new Date()),
    fetch: new WatchedValue(asyncOps.new()),
    refresh: async () => {
      throw new Error("Not implemented");
    },
  };

  constructor(
    private readonly _events: IDispatcher<any>,
    private readonly _account: IAccountService,
    private readonly _rpc: IRpcService,
    private readonly _connectionManager: ConnectionManager,
    public readonly config: Web3Config,
    public readonly thirdweb: ThirdwebClient,
  ) {
    if (!config.contracts["staking"]) {
      throw new Error("Missing staking contract");
    }

    if (!config.contracts["usdc"]) {
      throw new Error("Missing usdc contract");
    }

    this.network = config.chainId === 8453 ? base : baseSepolia;

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

        this.stakingBalance.value.setValue(result);
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

        this.usdcBalance.value.setValue(result);
        this.usdcBalance.fetch.setValue(asyncOps.success());
      },
    };

    this.usdcPermitAmount = {
      value: new WatchedValue<bigint>(BigInt(0)),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        this.usdcPermitAmount.fetch.setValue(asyncOps.inProgress());

        let result: ReadContractResult<any>;
        try {
          result = await readContract({
            contract: this.usdcContract,
            method: "allowance",
            params: [
              this._account.user?.walletAddr,
              this.config.contracts.staking.addr,
            ],
          });
        } catch (error) {
          this.usdcPermitAmount.fetch.setValue(asyncOps.failure(error));

          return;
        }

        this.usdcPermitAmount.value.setValue(result);
        this.usdcPermitAmount.fetch.setValue(asyncOps.success());
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

    const thirdWebWallet = this._connectionManager.activeWalletStore;
    this._isInAppWallet.setValue(thirdWebWallet.getValue()?.id === "inApp");
    thirdWebWallet.subscribe(() => {
      this._isInAppWallet.setValue(thirdWebWallet.getValue()?.id === "inApp");
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

  get isInAppWallet(): WatchedValue<boolean> {
    return this._isInAppWallet;
  }

  link = async (cancelToken?: CancelToken): Promise<void> => {
    cancelToken?.throwIfCancelled();

    const account = this._connectionManager.activeAccountStore.getValue();
    if (!account) {
      throw new SpyreError(
        SpyreErrorCode.FAILED_PRECONDITION,
        "Wallet is not connected.",
      );
    }

    // this might already be done
    if (this.linkedAddress.getValue() === this.activeAddress.getValue()) {
      return;
    }

    // first, get a challenge
    // todo: remove hangman, obvi
    let res: GetLinkChallengeResponse;
    try {
      res = await this._rpc.call<GetLinkChallengeResponse>(
        "hangman/auth/wallet-init",
        {},
      );
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to get challenge.",
        [error],
      );
    }

    if (!res.success) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to get challenge.",
        [res.error],
      );
    }

    cancelToken?.throwIfCancelled();

    // sign the challenge
    let signRes: Hex;
    try {
      signRes = await account.signMessage({
        message: res.payload,
      });
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to sign challenge.",
        [error],
      );
    }

    cancelToken?.throwIfCancelled();

    // fire off to server
    let submitRes: AuthWalletVerifyResponse;
    try {
      submitRes = await this._rpc.call<AuthWalletVerifyResponse>(
        "hangman/auth/wallet-verify",
        {
          initRequestId: res.initRequestId,
          signedPayload: signRes,
        },
      );
    } catch (error) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit challenge.",
        [error],
      );
    }

    if (!submitRes.success) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit challenge.",
        [submitRes.error],
      );
    }

    cancelToken?.throwIfCancelled();

    // update local account custom_id
    this._linkedAddress.setValue(submitRes.addr);
    this._events.on(Messages.ACCOUNT_WALLET_CONNECTED, {
      addr: submitRes.addr,
    });
  };

  watch = async (txn: Txn): Promise<void> => {
    // TODO: very naive implementation, need a queue and batched requests
    let retries = 3;

    const promise = new Promise<void>((resolve, rej) => {
      const intervalId = setInterval(async () => {
        const res = await this._rpc.call<GetTxnRpcResponse>("web3/txn/get", {
          txnId: txn.id,
          ns: txn.ns,
        });

        if (res.success) {
          if (res.txn.status === "success") {
            clearInterval(intervalId);

            // confirm
            txn.confirm(res.txn.txnHash);

            resolve();
          } else if (res.txn.status === "failure") {
            clearInterval(intervalId);

            // fail
            txn.fail(res.txn.error);

            resolve();
          }

          // other statuses fall through
        } else if (--retries === 0) {
          logger.warn("Could not get txn: @Error.", res.error);

          clearInterval(intervalId);
          rej(new SpyreError(SpyreErrorCode.UNAVAILABLE, res.error));
        }
      }, 3000);
    });

    return promise;
  };

  approve = async (
    namespace: string,
    wad?: bigint,
    cancel?: CancelToken,
  ): Promise<Txn> => {
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
      value: bigIntToString(
        wad ||
          BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          ),
      ),
      nonce: bigIntToString(nonce),
      deadline: bigIntToString(
        BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ),
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

    if (!permitResult.success) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit permit.",
        [permitResult.error],
      );
    }

    return new Txn(permitResult.txnId, namespace);
  };

  deposit = async (
    namespace: string,
    wad: bigint,
    cancel?: CancelToken,
  ): Promise<Txn> => {
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
    const {success, nonce} = await this._rpc.call<GetNonceResponse>(
      "nonces/get-nonce",
      {},
    );
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
      nonce: bigIntToString(BigInt(nonce)),
      expiry: bigIntToString(BigInt(0)),
      amount: bigIntToString(wad),
      fee: bigIntToString(BigInt(0)),
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

    if (!depositResult.success) {
      throw new SpyreError(
        SpyreErrorCode.UNAVAILABLE,
        "Failed to submit deposit.",
      );
    }

    return new Txn(depositResult.txnId, namespace);
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

    cancel?.throwIfCancelled();

    const domain = getStakingDomain({
      chainId: this.network.id,
      contractAddr: this.config.contracts["staking"].addr,
      name: "gamestaking",
      //version: "2", <-- ?
    });
    const types = {Stake: getStakingTypes()};
    const stake = {
      user: this.activeAddress.getValue(),
      nonce,
      expiry,
      amount,
      fee,
    };

    logger.debug(
      "Signing: @Domain, @Types, @Stake",
      JSON.stringify(domain, null, 2),
      JSON.stringify(types, null, 2),
      JSON.stringify(stake, null, 2),
    );

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
        // user canceled -- do nothing
        throw new SigningError(SigningErrorType.USER_CANCELED);
      }

      if ((error as any).code === -32603) {
        // TODO: wrong chain
        //switchChain(network);

        throw new SigningError(SigningErrorType.WRONG_CHAIN);
      }

      throw new SigningError(SigningErrorType.UNKNOWN, (error as any).message);
    }

    cancel?.throwIfCancelled();

    return getRSV(result);
  };
}
