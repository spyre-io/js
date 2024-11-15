import {ApiAccount} from "@heroiclabs/nakama-js/dist/api.gen";
import {Kv} from "@/core/shared/types";
import {Web3Address} from "@/core/web3/types";
import {User} from "./types";
import {childLogger} from "@/core/util/logger";

const logger = childLogger("core:account");

export const getUser = (account: ApiAccount): User => {
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

export const getBalances = (account: ApiAccount): Kv<bigint> => {
  if (!account.wallet) {
    return {};
  }

  const parsed = JSON.parse(account.wallet);
  for (const key in parsed) {
    parsed[key] = BigInt(parsed[key]);
  }

  return parsed;
};

export const getMeta = (account: ApiAccount): any => {
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
