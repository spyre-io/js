import { logger } from "@/core/util/logger";
import { asyncOps } from "@/core/util/async";
import { Dispatcher } from "@/core/shared/dispatcher";
export const NullUser = {
    walletAddr: null,
    coins: 0,
    balances: {},
    meta: {},
};
const getUser = (account) => {
    const user = account.user;
    if (!user) {
        throw new Error("Invalid account");
    }
    // verified address
    let walletAddr = null;
    if (account.custom_id) {
        if (account.custom_id.startsWith("0x")) {
            walletAddr = account.custom_id;
        }
        else {
            logger.warn("Invalid wallet address, '@WalletAddress' for user @UserId.", account.custom_id, user.id);
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
const getBalances = (account) => {
    if (!account.wallet) {
        return {};
    }
    const parsed = JSON.parse(account.wallet);
    for (const key in parsed) {
        parsed[key] = BigInt(parsed[key]);
    }
    return parsed;
};
const getMeta = (account) => {
    if (!account.user?.metadata) {
        return {};
    }
    try {
        return JSON.parse(account.user.metadata);
    }
    catch (error) {
        logger.warn(`Invalid user metadata: ${account.user.metadata}`);
        return {};
    }
};
export class AccountService {
    _nakama;
    _user = NullUser;
    _status = asyncOps.new();
    _refreshPromise = null;
    _dispatcher = new Dispatcher();
    constructor(_nakama) {
        this._nakama = _nakama;
        //
    }
    get status() {
        return this._status;
    }
    get user() {
        return this._user;
    }
    refresh = async () => {
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
    update = async (user) => {
        throw new Error("Not implemented");
    };
    onUpdate = (fn) => {
        this._dispatcher.addHandler(0, fn);
    };
}
