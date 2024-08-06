import {Web3Address} from "../web3/types";

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
  walletAddr: Web3Address | null;
};
