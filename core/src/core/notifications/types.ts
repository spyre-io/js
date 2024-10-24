export class Notification {
  code?: number;
  content?: {};
  create_time?: string;
  id?: string;
  persistent?: boolean;
  sender_id?: string;
  subject?: string;
}

export enum NotificationCodes {
  MatchPlayerJoined = 1000,
  MatchRub = 1001,
  MatchReady = 1002,
  BlockchainStakeStatus = 1100,
  BlockchainPermitStatus = 1101,
  BlockchainDepositStatus = 1102,
}
