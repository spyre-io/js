export type TimedVault = {
  name: string;
  type: string;
  startedAt: number;
  startingValue: number;
  parameters: number[];
  maxCapacity: number;
  isEnabled: boolean;
};

export function isVaultFull(vault: TimedVault) {
  if (!vault) {
    return true;
  }

  return getVaultValue(vault) >= vault.maxCapacity;
}

export function getVaultValue(vault: TimedVault) {
  if (!vault) {
    return 0;
  }

  const {type, startedAt, startingValue, parameters, maxCapacity, isEnabled} =
    vault;

  if (!isEnabled) {
    return 0;
  }

  const time = Date.now();
  const deltaMillis = time - startedAt;
  if (deltaMillis < 0) {
    return 0;
  }

  switch (type) {
    case "linear": {
      // requires a parameter for the rate of change
      if (parameters.length != 1) {
        return 0;
      }

      // calculate
      const m = parameters[0];
      if (m <= 0) {
        return 0;
      }

      const deltaHours = deltaMillis / 1000 / 60 / 60;
      const val = Math.max(
        0,
        Math.min(m * deltaHours + startingValue, maxCapacity),
      );

      return Math.floor(val);
    }
    default: {
      return 0;
    }
  }
}
