import {ApiAccount} from "@heroiclabs/nakama-js/dist/api.gen";
import {INakamaClientService} from "../net/service";
import {Kv, WatchedValue} from "../shared/types";
import {logger} from "../util/logger";
import {Web3Address} from "../web3/types";

export class User {
  avatarUrl?: string;
  createTime?: string;
  displayName?: string;
  id?: string;
  lang_tag?: string;
  location?: string;
  metadata?: string;
  online?: boolean;
  timezone?: string;
  username?: string;
  walletAddr: Web3Address | null = null;
}

export const NullUser = {
  walletAddr: null,
};

export interface IAccountService {
  get user(): WatchedValue<User>;
  get balances(): WatchedValue<Kv<BigInt>>;
  get meta(): WatchedValue<Kv<any>>;

  refresh(): Promise<void>;
  update(user: User): Promise<void>;
}

const getUser = (account: ApiAccount): User => {
  const user = account.user;
  if (!user) {
    throw new Error("Invalid account");
  }

  // verified address
  let walletAddr: Web3Address | null = null;
  if (account.custom_id) {
    if (account.custom_id.startsWith("0x")) {
      walletAddr = account.custom_id as `0x${string}`;
    } else {
      logger.warn(
        "Invalid wallet address, '@WalletAddress' for user @UserId.",
        account.custom_id,
        user.id,
      );
    }
  }

  return {
    avatarUrl: user.avatar_url,
    createTime: user.create_time,
    displayName: user.display_name,
    id: user.id,
    lang_tag: user.lang_tag,
    location: user.location,
    metadata: user.metadata,
    online: user.online,
    timezone: user.timezone,
    username: user.username,
    walletAddr: walletAddr,
  };
};

const getBalances = (account: ApiAccount): Kv<BigInt> => {
  if (!account.wallet) {
    return {};
  }

  const parsed = JSON.parse(account.wallet);
  for (const key in parsed) {
    parsed[key] = BigInt(parsed[key]);
  }

  return parsed;
};

export class AccountService implements IAccountService {
  public readonly user: WatchedValue<User> = new WatchedValue<User>(NullUser);
  public readonly balances: WatchedValue<Kv<BigInt>> = new WatchedValue<
    Kv<BigInt>
  >({});
  public readonly meta: WatchedValue<Kv<any>> = new WatchedValue<Kv<any>>({});

  constructor(private readonly _nakama: INakamaClientService) {
    //
  }

  async refresh(): Promise<void> {
    await this._nakama.getApi(async (client, session) => {
      const account = await client.getAccount(session);

      this.user.setValue(getUser(account));
      this.balances.setValue(getBalances(account));
      this.meta.setValue(
        account.user?.metadata ? JSON.parse(account.user.metadata) : {},
      );
    }, 3);
  }

  async update(user: User): Promise<void> {
    throw new Error("Not implemented");
  }
}
