import {Kv} from "@/core/shared/types";
import {Web3Address} from "@/core/web3/types";

export type User = {
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

  // derived
  walletAddr: Web3Address | null;
  coins: Number;
  balances: Kv<BigInt>;
  meta: any;
};
