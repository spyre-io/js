import {
  Signature,
  SigningErrorType,
  SigniningError,
  SignStakeParameters,
  Web3Config,
} from "./types";

import {getRSV, getStakingDomain, getStakingTypes} from "./helpers";
import {base, baseSepolia, Chain} from "thirdweb/chains";
import {Account, ConnectionManager} from "thirdweb/wallets";
import {
  getContract,
  readContract,
  ThirdwebClient,
  ThirdwebContract,
} from "thirdweb";
import {AsyncOp, asyncOps} from "../util/async";
import {IAccountService} from "../account/service";
import {ReadContractResult} from "thirdweb/dist/types/transaction/read-contract";

/*export const useHangmanDomain = () => {
  const params = useWeb3Contants();
  return {
    "name": "gamestaking",
    "version": "1",
    "chainId": params.chainId.toHexString(),
    "verifyingContract": params.contracts.staking.addr,
  };
};*/

type AsyncValue<T> = {
  value: T;
  fetch: AsyncOp;
  refresh: () => Promise<void>;
};

export interface IWeb3Service {
  get config(): Web3Config;
  get status(): "connected" | "disconnected" | "connecting";
  get address(): `0x${string}` | null;
  get chainId(): number;
  get needsToSwitchChains(): boolean;

  get stakingBalance(): AsyncValue<BigInt>;
  get usdcBalance(): AsyncValue<BigInt>;
  get withdrawAfter(): AsyncValue<Date>;

  switchChain(): Promise<void>;
  signStake(params: SignStakeParameters): Promise<Signature>;
}

export class ThirdWebWeb3Service implements IWeb3Service {
  _network: Chain;
  _stakingContract: ThirdwebContract<any>;
  _usdcContract: ThirdwebContract<any>;

  _stakingBalance: AsyncValue<BigInt>;
  _usdcBalance: AsyncValue<BigInt>;
  _withdrawAfter: AsyncValue<Date> = {
    value: new Date(),
    fetch: asyncOps.new(),
    refresh: async () => {
      throw new Error("Not implemented");
    },
  };

  constructor(
    public readonly config: Web3Config,
    private readonly _account: IAccountService,
    private readonly _client: ThirdwebClient,
    private readonly _connectionManager: ConnectionManager,
  ) {
    if (!config.contracts["staking"]) {
      throw new Error("Missing staking contract");
    }

    if (!config.contracts["usdc"]) {
      throw new Error("Missing usdc contract");
    }

    this._network = config.chainId === 8432 ? base : baseSepolia;

    // load contracts
    this._stakingContract = getContract({
      client: _client,
      chain: this._network,
      address: config.contracts.staking.addr,
      abi: config.contracts.staking.abi,
    });
    this._usdcContract = getContract({
      client: _client,
      chain: this._network,
      address: config.contracts.usdc.addr,
      abi: config.contracts.usdc.abi,
    });

    // setup async values
    this._stakingBalance = {
      value: BigInt(0),
      fetch: asyncOps.new(),
      refresh: async () => {
        this._stakingBalance.fetch = asyncOps.inProgress();

        let result: ReadContractResult<any>;
        try {
          result = await readContract({
            contract: this._stakingContract,
            method: "balances",
            params: [this._account.user?.walletAddr],
          });
        } catch (error) {
          this._stakingBalance.fetch = asyncOps.failure(error);

          return;
        }

        this._stakingBalance.value = result.value;
        this._stakingBalance.fetch = asyncOps.success();
      },
    };

    this._usdcBalance = {
      value: BigInt(0),
      fetch: asyncOps.new(),
      refresh: async () => {
        this._usdcBalance.fetch = asyncOps.inProgress();

        let result: ReadContractResult<any>;
        try {
          result = await readContract({
            contract: this._usdcContract,
            method: "balanceOf",
            params: [this._account.user?.walletAddr],
          });
        } catch (error) {
          this._usdcBalance.fetch = asyncOps.failure(error);

          return;
        }

        this._usdcBalance.value = result.value;
        this._usdcBalance.fetch = asyncOps.success();
      },
    };
  }

  get status(): "connected" | "disconnected" | "connecting" {
    return this._connectionManager.activeWalletConnectionStatusStore.getValue();
  }

  get address(): `0x${string}` | null {
    if (!this._account.user) {
      return null;
    }

    return this._account.user.walletAddr;
  }

  get chainId(): number {
    return this._network.id;
  }

  get needsToSwitchChains(): boolean {
    return (
      this._connectionManager.activeWalletChainStore.getValue()?.id !==
      this.chainId
    );
  }

  get stakingBalance(): AsyncValue<BigInt> {
    return this._stakingBalance;
  }

  get usdcBalance(): AsyncValue<BigInt> {
    return this._usdcBalance;
  }

  get withdrawAfter(): AsyncValue<Date> {
    return this._withdrawAfter;
  }

  get account(): Account | null {
    return null;
  }

  async switchChain(): Promise<void> {
    await this._connectionManager.switchActiveWalletChain(this._network);
  }

  async signStake({
    nonce,
    expiry,
    amount,
    fee,
  }: SignStakeParameters): Promise<Signature> {
    const domain = getStakingDomain({
      chainId: this.chainId,
      contractAddr: this.config.contracts["staking"].addr,
      name: this.config.name,
      version: "2",
    });
    const types = {Stake: getStakingTypes()};
    const stake = {
      user: this.address,
      nonce,
      expiry,
      amount,
      fee,
    };

    let result;
    try {
      result = await this.account!.signTypedData({
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
  }
}
