import {Kv} from "@/core/shared/types";
import {MatchInfo, MatchmakingInfo} from "@/core/shared/types.gen";
import {Signature} from "@/core/web3/types";

export type BracketDefinition = {
  id: number;
  meta: Kv<string>;
};

export type BracketDictionary = {
  bracketId: number;
  dictIds: number[];
  dictNames: string[];
};

export type GetBracketsRequest = {};

export type GetBracketsResponse = {
  success: boolean;
  error: string;
  brackets: BracketDefinition[];
  dictionaries: BracketDictionary[];
  refreshSecUTC: number;
};

export type MatchmakingRequest = {
  bracketId: number;
};

export type MatchmakingResponse = {
  matchmakingInfo: MatchmakingInfo; // used if we are not currently in a match
  matchInfo: MatchInfo; // used if we are already in a match or have already accepted one
  success: boolean;
  error: string;
};

export type MatchmakingAcceptRequest = {
  mmId: string;
  signature: Signature;
};

export type MatchmakingAcceptResponse = {
  matchJoinIds: string[];
  success: boolean;
  error: string;
};
