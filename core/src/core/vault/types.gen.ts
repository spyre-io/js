export type TimedVault = {
  name: string;
  type: string;
  startedAt: number;
  startingValue: number;
  parameters: number[];
  maxCapacity: number;
  isEnabled: boolean;
};

export type GetVaultsResponse = {
  success: boolean;
  error: string;
  vaults: TimedVault[];
};

export type CollectVaultResponse = {
  success: boolean;
  error: string;
  value: number;
  vault: TimedVault;
};
