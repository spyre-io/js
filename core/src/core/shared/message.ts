import {Web3Address} from "@/core/web3/types";

export enum Messages {
  // account
  ACCOUNT_WALLET_CONNECTED = 100,
}

export const VoidMessage = {};

export type AccountWalletConnectedMessage = {
  addr: Web3Address;
};
