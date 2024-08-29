import {Match} from "@heroiclabs/nakama-js";
import {Kv} from "@/core/shared/types";
import {AsyncClientFn} from "./types";

export interface INakamaClientService {
  getApi<T>(fn: AsyncClientFn<T>, retries: number): Promise<T>;
}

export interface IMatchHandler {
  onData: (opCode: number, data: Uint8Array) => void;
}

/**
 * This describes an object that manages the connection to Spyre services.
 */
export interface IConnectionService {
  /**
   * True if and only if the client has a live socket connection with Spyre services. A heartbeat keeps this up to date within an epsilon.
   */
  get isConnected(): boolean;

  /**
   * Initializes the connection service with a device ID. This must be called before any of the services will work.
   *
   * @param deviceId A unique identifier for this device. Generally used with the `getDeviceId()` function.
   */
  init(deviceId: string): void;

  /**
   * Connects to the Spyre services. This must be called before any of the services will work.
   */
  connect(): Promise<void>;

  /**
   * Disconnects from the Spyre services.
   */
  disconnect(): void;

  /**
   * Joins a match with the given match ID and metadata. The metadata is a key-value map of strings.
   *
   * @param matchId The match ID to join.
   * @param meta A key-value map of strings.
   * @param retries The number of times to retry if the join
   * @param handler The function to handle events from the socket.
   * @returns A promise that resolves to the match object.
   * @throws If the match cannot be joined.
   *
   */
  join(
    matchId: string,
    meta: Kv<string>,
    retries: number,
    handler: (opCode: number, payload: Uint8Array) => void,
  ): Promise<Match>;

  /**
   * Leaves the current match.
   */
  leave(): Promise<void>;

  /**
   * Sends a message to the match with the given op code and payload. The payload can be a string or a byte array.
   *
   * @param matchId The match ID to send the message to.
   * @param opCode The operation code.
   * @param payload The payload to send.
   * @param retries The number of times to retry if the message cannot be sent.
   */
  sendMatchState(
    matchId: string,
    opCode: number,
    payload: string | Uint8Array,
    retries?: number,
  ): Promise<void>;
}

/**
 * This describes an object that can perform RPCs.
 */
export interface IRpcService {
  /**
   * Calls an RPC function with the given ID and input.
   *
   * @param id The ID of the RPC function to call.
   * @param input The input to the RPC function.
   * @returns A promise that resolves to the output of the RPC function.
   */
  call<T>(id: string, input: any): Promise<T>;
}
