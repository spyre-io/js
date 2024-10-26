import {AptosExtension, MagicAptosWallet} from "@magic-ext/aptos";
import {Extension, InstanceWithExtensions, SDKBase} from "@magic-sdk/provider";
import {
  asyncOps,
  CancelToken,
  IWeb3Service,
  Signature,
  SignStakeParameters,
  Txn,
  WatchedAsyncValue,
  WatchedValue,
  Web3Config,
  Web3ConnectionStatus,
} from "@spyre-io/js";

export class MagicWeb3Service implements IWeb3Service {
  public readonly wallet: MagicAptosWallet;

  public readonly status: WatchedValue<Web3ConnectionStatus> =
    new WatchedValue<Web3ConnectionStatus>("disconnected");
  public readonly activeAddress: WatchedValue<`0x${string}` | null> =
    new WatchedValue<`0x${string}` | null>(null);
  public readonly linkedAddress: WatchedValue<`0x${string}` | null> =
    new WatchedValue<`0x${string}` | null>(null);
  public readonly needsToSwitchChains: WatchedValue<boolean> =
    new WatchedValue<boolean>(false);
  public readonly isInAppWallet: WatchedValue<boolean> =
    new WatchedValue<boolean>(true);
  public readonly stakingBalance: WatchedAsyncValue<bigint>;
  public readonly usdcBalance: WatchedAsyncValue<bigint>;
  public readonly usdcPermitAmount: WatchedAsyncValue<bigint>;
  public readonly withdrawAfter: WatchedAsyncValue<Date>;

  constructor(
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

  switchChain(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  link(cancel?: CancelToken): Promise<void> {
    throw new Error("Method not implemented.");
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
