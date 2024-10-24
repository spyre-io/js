import {ILogTarget} from "./util/logger";
import {Web3Config} from "./web3/types";

/**
 * Options for creating a new {@link ISpyreClient} instance.
 */
export type CreateSpyreClientOptions = {
  /**
   * Web3 configuration.
   */
  web3: Web3Config;

  /**
   * Optional logging configuration.
   */
  logging?: LogConfig;
};

/**
 * Logging configuration.
 */
export type LogConfig = {
  /**
   * Log targets may be specified, which will accept log messages from Spyre.
   */
  loggers: ILogTarget[];
};
