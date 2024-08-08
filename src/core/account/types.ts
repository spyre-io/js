import {Kv} from "@/core/shared/types";
import {Web3Address} from "@/core/web3/types";

/**
 * The `User` type describes a user account.
 */
export type User = {
  /**
   * The user's avatar URL.
   */
  avatarUrl?: string;

  /**
   * The user's creation time.
   */
  createTime?: string;

  /**
   * The user's display name.
   */
  displayName?: string;

  /**
   * A unique id for this user.
   */
  id?: string;

  /**
   * The user's language tag, if specified.
   */
  lang_tag?: string;

  /**
   * A rough location of the user, if consent was given.
   */
  location?: string;

  /**
   * Raw, additional metadata about the user.
   */
  metadata?: string;

  /**
   * Whether the user is currently online.
   */
  online?: boolean;

  /**
   * The user's timezone.
   */
  timezone?: string;

  /**
   * The user's username.
   */
  username?: string;

  /**
   * For accounts with connected wallets, the wallet address.
   */
  walletAddr: Web3Address | null;

  /**
   * The user's coin balance.
   */
  coins: number;

  /**
   * Balances of other off-chain coins.
   */
  balances: Kv<bigint>;

  /**
   * Additional metadata about the user, safely parsed from the `metadata` field.
   */
  meta: any;
};
