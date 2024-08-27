import {IRpcService} from "../net/interfaces";
import {AsyncOp} from "../shared/types";
import {asyncOps} from "../util/async";
import {CollectVaultResponse, GetVaultsResponse, TimedVault} from "./types.gen";

export interface IVaultService {
  /**
   * The current loading status of the vaults.
   */
  get status(): AsyncOp;

  /**
   * All loaded vaults.
   */
  get vaults(): TimedVault[];

  /**
   * Refresh all vaults.
   */
  refresh(): Promise<void>;

  /**
   * True if and only if the vault is at capacity.
   *
   * @param vault The vault to check.
   */
  isFull(vault: TimedVault): boolean;

  /**
   * Calculates the current value of the vault.
   *
   * @param vault The vault to check.
   */
  getValue(vault: TimedVault): number;

  /**
   * Collects the vault.
   *
   * @param vault The vault to collect.
   */
  collect(vault: TimedVault): Promise<void>;
}

export class VaultService implements IVaultService {
  _status: AsyncOp = asyncOps.new();
  _vaults: TimedVault[] = [];

  constructor(private readonly _rpc: IRpcService) {
    //
  }

  get status(): AsyncOp {
    return this._status;
  }

  get vaults(): TimedVault[] {
    return this._vaults;
  }

  async refresh(): Promise<void> {
    this._status = asyncOps.inProgress();

    try {
      const res = await this._rpc.call<GetVaultsResponse>("vaults/get", {});
      this._vaults = res.vaults;
    } catch (error) {
      this._status = asyncOps.failure(error);
      return;
    }

    this._status = asyncOps.success();
  }

  isFull(vault: TimedVault): boolean {
    if (!vault) {
      return true;
    }

    return this.getValue(vault) >= vault.maxCapacity;
  }

  getValue(vault: TimedVault): number {
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

  async collect(vault: TimedVault): Promise<void> {
    this._status = asyncOps.inProgress();

    let res: CollectVaultResponse;
    try {
      res = await this._rpc.call<CollectVaultResponse>("vaults/collect", {
        name: vault.name,
      });
    } catch (error) {
      this._status = asyncOps.failure(error);
      return;
    }

    const updatedVault = res.vault;
    const index = this._vaults.findIndex((v) => v.name === updatedVault.name);
    if (index !== -1) {
      this._vaults[index] = updatedVault;

      console.log("collect()");
    }

    this._status = asyncOps.success();
  }
}
