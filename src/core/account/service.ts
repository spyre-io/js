import {ApiAccount} from "@heroiclabs/nakama-js/dist/api.gen";
import {INakamaClientService} from "@/core/net/interfaces";
import {AsyncOp, Kv} from "@/core/shared/types";
import {logger} from "@/core/util/logger";
import {Web3Address} from "@/core/web3/types";
import {User} from "./types";
import {asyncOps} from "@/core/util/async";
import {Dispatcher} from "@/core/shared/dispatcher";
import {Messages} from "@/core/shared/message";

export const NullUser: User = {
  walletAddr: null,
  coins: 0,
  balances: {},
  meta: {},
};

/**
 * This interface describes all methods for interacting with user accounts.
 */
export interface IAccountService {
  /**
   * The current loading status of the user.
   */
  get status(): AsyncOp;

  /**
   * The current {@link User} object. This object is immutable, refreshed through `refresh`, and updated through `update`.
   */
  get user(): User;

  /**
   * Refreshes the {@link User} object.
   */
  refresh(): Promise<void>;

  /**
   * Updates the {@link User} object.
   *
   * @param user - The new {@link User} object.
   *
   */
  update(user: User): Promise<void>;

  /**
   * Registers a callback to be called when the user object is updated.
   *
   * ```ts
   * client.account.onUpdate((user) => {
   *  console.log("User updated:", user);
   * });
   * ```
   *
   * @param fn - The callback function
   * @returns A function that unregisters the callback.
   */
  onUpdate(fn: (user: User) => void): () => void;
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

const getBalances = (account: ApiAccount): Kv<bigint> => {
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

  constructor(
    private readonly _nakama: INakamaClientService,
    private readonly _events: Dispatcher<any>,
  ) {
    // listen for updates
    _events.addHandler(
      Messages.ACCOUNT_WALLET_CONNECTED,
      (msg) => (this._user.walletAddr = msg.addr),
    );
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
    logger.debug("AccountService.update(@user)", {user});
    throw new Error("Not implemented");
  };

  onUpdate = (fn: (user: User) => void): (() => void) => {
    return this._dispatcher.addHandler(0, fn);
  };
}
