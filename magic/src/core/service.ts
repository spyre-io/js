import {AptosExtension, MagicAptosWallet} from "@magic-ext/aptos";
import {Extension, InstanceWithExtensions, SDKBase} from "@magic-sdk/provider";
import {
  asyncOps,
  CancelToken,
  IRpcService,
  IWeb3Service,
  IDispatcher,
  Signature,
  SignStakeParameters,
  Txn,
  WatchedAsyncValue,
  WatchedValue,
  Web3Config,
  Web3ConnectionStatus,
  Messages,
  Web3Address,
} from "@spyre-io/js";
import {MagicWalletLinkResponse} from "./types.gen";

export class MagicWeb3Service implements IWeb3Service {
  public readonly wallet: MagicAptosWallet;

  public readonly status: WatchedValue<Web3ConnectionStatus> =
    new WatchedValue<Web3ConnectionStatus>("disconnected");
  public readonly activeAddress: WatchedValue<Web3Address | null> =
    new WatchedValue<Web3Address | null>(null);
  public readonly linkedAddress: WatchedValue<Web3Address | null> =
    new WatchedValue<Web3Address | null>(null);
  public readonly needsToSwitchChains: WatchedValue<boolean> =
    new WatchedValue<boolean>(false);
  public readonly isInAppWallet: WatchedValue<boolean> =
    new WatchedValue<boolean>(true);
  public readonly stakingBalance: WatchedAsyncValue<bigint>;
  public readonly usdcBalance: WatchedAsyncValue<bigint>;
  public readonly usdcPermitAmount: WatchedAsyncValue<bigint>;
  public readonly withdrawAfter: WatchedAsyncValue<Date>;

  constructor(
    private readonly _rpc: IRpcService,
    private readonly _events: IDispatcher<any>,

    public readonly config: Web3Config,
    public readonly magic: InstanceWithExtensions<
      SDKBase,
      [AptosExtension, Extension]
    >,
  ) {
    this.wallet = new MagicAptosWallet(this.magic, {
      connect: async () => {
        await this.magic.auth.loginWithEmailOTP({
          email: "benjamin@thegoldenmule.com",
        });

        return await this.magic.aptos.getAccountInfo();
      },
    });

    this.stakingBalance = {
      value: new WatchedValue<bigint>(BigInt(0)),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        // todo
      },
    };

    this.usdcBalance = {
      value: new WatchedValue<bigint>(BigInt(0)),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        // todo
      },
    };

    this.usdcPermitAmount = {
      value: new WatchedValue<bigint>(BigInt(0)),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        // todo
      },
    };

    this.withdrawAfter = {
      value: new WatchedValue<Date>(new Date()),
      fetch: new WatchedValue(asyncOps.new()),
      refresh: async () => {
        // todo
      },
    };
  }

  async init() {
    this.status.setValue("connecting");

    let isConnected;
    try {
      isConnected = await this.magic.user.isLoggedIn();
    } catch (e) {
      isConnected = false;
    }

    if (isConnected) {
      this.status.setValue("connected");
    } else {
      this.status.setValue("disconnected");
    }
  }

  switchChain(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async link(cancel?: CancelToken): Promise<void> {
    const did = await this.magic.user.generateIdToken();
    const res = await this._rpc.call<MagicWalletLinkResponse>(
      "auth/magic/link",
      {did},
    );

    if (!res.success) {
      throw new Error(res.error);
    }

    // update local account custom_id
    this.linkedAddress.setValue(res.addr);
    this._events.on(Messages.ACCOUNT_WALLET_CONNECTED, {
      addr: res.addr,
    });
  }

  signStake(
    params: SignStakeParameters,
    cancel?: CancelToken,
  ): Promise<Signature> {
    throw new Error("Method not implemented.");
  }

  approve(namespace: string, wad?: bigint, cancel?: CancelToken): Promise<Txn> {
    throw new Error("Method not implemented.");
  }

  deposit(
    namespace: string,
    amount: bigint,
    cancel?: CancelToken,
  ): Promise<Txn> {
    throw new Error("Method not implemented.");
  }

  watch(txn: Txn): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
