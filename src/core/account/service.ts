import {ApiAccount} from "@heroiclabs/nakama-js/dist/api.gen";
import {INakamaClientService} from "core/net/service";
import {Kv} from "core/shared/types";

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
  walletAddr?: string;
}

export interface IAccountService {
  get user(): User | null;
  get balances(): Kv<BigInt>;
  get meta(): Kv<any>;

  refresh(): Promise<void>;
  update(user: User): Promise<void>;
}

const getUser = (account: ApiAccount): User => {
  const user = account.user;
  if (!user) {
    throw new Error("Invalid account");
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
    walletAddr: account.custom_id,
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
  private _user: User | null = null;
  private _balances: Kv<BigInt> = {};
  private _meta: Kv<any> = {};

  constructor(private readonly _nakama: INakamaClientService) {
    //
  }

  get user(): User | null {
    return this._user;
  }

  get balances(): Kv<BigInt> {
    return this._balances;
  }

  get meta(): Kv<any> {
    return this._meta;
  }

  async refresh(): Promise<void> {
    await this._nakama.getApi(async (client, session) => {
      const account = await client.getAccount(session);

      this._user = getUser(account);
      this._balances = getBalances(account);
      this._meta = account.user?.metadata
        ? JSON.parse(account.user.metadata)
        : {};
    }, 3);
  }

  async update(user: User): Promise<void> {
    //
  }
}
