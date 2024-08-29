import {Dispatcher} from "./dispatcher";
import {SpyreErrorCode} from "./errors";

export type Kv<T> = {[k: string]: T};

export type CancelToken = {
  cancelled: boolean;
  cancel: () => void;
  throwIfCancelled: () => void;
};

export const newCancelToken = () => {
  const token: CancelToken = {
    cancelled: false,
    cancel: () => (token.cancelled = true),
    throwIfCancelled: () => {
      if (token.cancelled) {
        throw new Error("Cancelled");
      }
    },
  };

  return token;
};

export type AsyncOp = {
  isInProgress: boolean;
  isStarted: boolean;
  isComplete: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  error: any;
  lastUpdated: number;
};

export type AsyncValue<T> = {
  value: T;
  fetch: AsyncOp;
};

export class SpyreError extends Error {
  constructor(
    public readonly code: number,
    message: string,

    public readonly errors: any[] = [],
  ) {
    super(`${message}\n${errors.map((e) => e.message).join("\n\t")}`);
  }
}
export class WatchedValue<T> {
  private _dispatcher: Dispatcher<void> = new Dispatcher();

  constructor(private _value: T) {
    //
  }

  getValue = () => this._value;

  setValue = (value: T) => {
    if (value === this._value) {
      return;
    }

    this._value = value;

    this._dispatcher.on(0, undefined);
  };

  watch = (listener: () => void): (() => void) => {
    return this._dispatcher.addHandler(0, listener);
  };
}

export type WatchedAsyncValue<T> = {
  value: WatchedValue<T>;
  fetch: WatchedValue<AsyncOp>;

  refresh: () => Promise<void>;
};
