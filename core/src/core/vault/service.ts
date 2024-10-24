import {IRpcService} from "@/core/net/interfaces";
import {AsyncOp} from "@/core/shared/types";
import {asyncOps} from "@/core/util/async";
import {IVaultService} from "./interfaces";
import {CollectVaultResponse, GetVaultsResponse, TimedVault} from "./types.gen";

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
    }

    this._status = asyncOps.success();
  }
}
