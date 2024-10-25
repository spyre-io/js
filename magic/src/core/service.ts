import {AptosExtension, MagicAptosWallet} from "@magic-ext/aptos";
import {Extension, InstanceWithExtensions, SDKBase} from "@magic-sdk/provider";
import {
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
  }

  get status(): WatchedValue<Web3ConnectionStatus> {
    throw new Error("Method not implemented.");
  }

  get activeAddress(): WatchedValue<`0x${string}` | null> {
    throw new Error("Method not implemented.");
  }

  get linkedAddress(): WatchedValue<`0x${string}` | null> {
    throw new Error("Method not implemented.");
  }

  get needsToSwitchChains(): WatchedValue<boolean> {
    throw new Error("Method not implemented.");
  }

  get stakingBalance(): WatchedAsyncValue<bigint> {
    throw new Error("Method not implemented.");
  }

  get usdcBalance(): WatchedAsyncValue<bigint> {
    throw new Error("Method not implemented.");
  }

  get usdcPermitAmount(): WatchedAsyncValue<bigint> {
    throw new Error("Method not implemented.");
  }

  get withdrawAfter(): WatchedAsyncValue<Date> {
    throw new Error("Method not implemented.");
  }

  get isInAppWallet(): WatchedValue<boolean> {
    throw new Error("Method not implemented.");
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
