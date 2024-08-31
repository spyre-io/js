import {AsyncOp} from "@/core/shared/types";
import {User} from "./types";

/**
 * This interface describes all methods for interacting with user accounts.
 */
export interface IAccountService {
  /**
   * The current loading status of the user.
   */
  get status(): AsyncOp;

  /**
   * The current {@link User} object. This object is immutable, refreshed through `refresh`, and updated through `update`.
   */
  get user(): User;

  /**
   * Refreshes the {@link User} object.
   */
  refresh(): Promise<void>;

  /**
   * Updates the {@link User} object.
   *
   * @param user - The new {@link User} object.
   *
   */
  update(user: User): Promise<void>;

  /**
   * Registers a callback to be called when the user object is updated.
   *
   * ```ts
   * client.account.onUpdate((user) => {
   *  console.log("User updated:", user);
   * });
   * ```
   *
   * @param fn - The callback function
   * @returns A function that unregisters the callback.
   */
  onUpdate(fn: (user: User) => void): () => void;
}
