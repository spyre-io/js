export type TimedVault = {
  name: string;
  type: string;
  startedAt: number;
  startingValue: number;
  parameters: number[];
  maxCapacity: number;
  isEnabled: boolean;
};
