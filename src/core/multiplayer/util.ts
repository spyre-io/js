import {MatchmakingInfo} from "../shared/types.gen";
import {MatchmakingBracketInfo} from "./types";

export const getMatchmakingBracketInfo = (
  info: MatchmakingInfo,
): MatchmakingBracketInfo => {
  const {nonce, expiry, amount, fee} = info;

  return {
    nonce,
    expiry: parseInt(expiry),
    amount: parseInt(amount),
    fee: parseInt(fee),
  };
};
