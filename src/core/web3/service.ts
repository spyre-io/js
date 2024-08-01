import {
  Signature,
  SigningErrorType,
  SigniningError,
  SignStakeParameters,
  Web3Config,
} from "./types";

import {getRSV, getStakingDomain, getStakingTypes} from "./helpers";
import {ChainOptions} from "thirdweb/chains";
import {Account} from "thirdweb/wallets";

export interface IWeb3Service {
  get config(): Web3Config;
  get address(): `0x${string}`;
  get chainId(): number;

  signStake(params: SignStakeParameters): Promise<Signature>;
}

export type ThirdWebWeb3Config = Web3Config & {
  network: ChainOptions;
};

export class ThirdWebWeb3Service implements IWeb3Service {
  _config: ThirdWebWeb3Config;

  constructor(config: ThirdWebWeb3Config) {
    if (!config.contracts["staking"]) {
      throw new Error("Missing staking contract");
    }

    if (!config.contracts["usdc"]) {
      throw new Error("Missing usdc contract");
    }

    this._config = config;
  }

  get config(): Web3Config {
    return this._config;
  }

  get address(): `0x${string}` {
    return "0x0";
  }

  get chainId(): number {
    return 0;
  }

  get account(): Account | null {
    return null;
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
