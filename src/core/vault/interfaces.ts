import {AsyncOp} from "../shared/types";
import {TimedVault} from "./types.gen";

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
