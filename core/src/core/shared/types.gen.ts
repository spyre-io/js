export type MatchmakingInfo = {
  mmId: string;
  bracketId: number;
  onChain: boolean;
  contractAddress: string;
  address: string;
  nonce: string;
  expiry: string;
  amount: string;
  fee: string;
};

export type MatchInfo = {
  creatorMatchId: string;
  opponentMatchIds: string[];
  bracketDefId: number;
};
