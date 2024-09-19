import {INakamaClientService} from "@/core/net/interfaces";
import {AsyncOp} from "@/core/shared/types";
import {User} from "./types";
import {asyncOps} from "@/core/util/async";
import {Dispatcher} from "@/core/shared/dispatcher";
import {Messages} from "@/core/shared/message";
import {IAccountService} from "./interfaces";
import {getUser} from "./util";

export const NullUser: User = {
  walletAddr: null,
  coins: 0,
  balances: {},
  meta: {},
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
    await this._nakama.getApi(async (client, session) => {
      await client.updateAccount(session, {
        avatar_url: user.avatarUrl,
        display_name: user.displayName,
        username: user.username,
      });
    }, 0);
  };

  onUpdate = (fn: (user: User) => void): (() => void) => {
    return this._dispatcher.addHandler(0, fn);
  };
}
