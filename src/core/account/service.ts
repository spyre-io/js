import {ApiAccount} from "@heroiclabs/nakama-js/dist/api.gen";
import {INakamaClientService} from "@/core/net/service";
import {AsyncOp, Kv} from "@/core/shared/types";
import {logger} from "@/core/util/logger";
import {Web3Address} from "@/core/web3/types";
import {User} from "./types";
import {asyncOps} from "@/core/util/async";
import {Dispatcher} from "@/core/shared/dispatcher";

export const NullUser: User = {
  walletAddr: null,
  coins: 0,
  balances: {},
  meta: {},
};

export interface IAccountService {
  get status(): AsyncOp;
  get user(): User;

  refresh(): Promise<void>;
  update(user: User): Promise<void>;

  onUpdate(fn: (user: User) => void): void;
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

  // get derived
  const balances = getBalances(account);
  const meta = getMeta(account);
  const coins = Number(balances["coins"] || BigInt(0));

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
    balances,
    meta,
    coins,
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

const getMeta = (account: ApiAccount): any => {
  if (!account.user?.metadata) {
    return {};
  }

  try {
    return JSON.parse(account.user.metadata);
  } catch (error) {
    logger.warn(`Invalid user metadata: ${account.user.metadata}`);
    return {};
  }
};

export class AccountService implements IAccountService {
  private _user: User = NullUser;
  private _status: AsyncOp = asyncOps.new();

  private _refreshPromise: Promise<void> | null = null;

  private readonly _dispatcher = new Dispatcher<User>();

  constructor(private readonly _nakama: INakamaClientService) {
    //
  }

  get status(): AsyncOp {
    return this._status;
  }

  get user(): User {
    return this._user;
  }

  refresh = async (): Promise<void> => {
    if (!this._refreshPromise) {
      this._status = asyncOps.inProgress();

      this._refreshPromise = this._nakama
        .getApi((client, session) => client.getAccount(session), 3)
        .then((account) => {
          this._user = getUser(account);

          this._dispatcher.on(0, this._user);

          this._status = asyncOps.success();
        })
        .catch((err) => {
          this._status = asyncOps.failure(err);
        })
        .finally(() => {
          this._refreshPromise = null;
        });
    }

    return this._refreshPromise;
  };

  update = async (user: User): Promise<void> => {
    throw new Error("Not implemented");
  };

  onUpdate = (fn: (user: User) => void): void => {
    this._dispatcher.addHandler(0, fn);
  };
}
