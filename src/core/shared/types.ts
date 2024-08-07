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
    super(message);
  }
}
export class WatchedValue<T> {
  private _value: T;

  private _listeners: (() => void)[] = [];
  private _queuedToRemove: (() => void)[] = [];
  private _errors: any[] = [];

  constructor(value: T) {
    this._value = value;
  }

  getValue = () => this._value;

  setValue = (value: T) => {
    if (value === this._value) {
      return;
    }

    this._value = value;

    // remove all listeners queued for removal
    if (this._queuedToRemove.length > 0) {
      for (const listener of this._queuedToRemove) {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
      this._queuedToRemove.length = 0;
    }

    // iterate and fire all listeners
    for (const listener of this._listeners) {
      try {
        listener();
      } catch (error) {
        this._errors.push(error);
      }
    }

    // throw all errors
    if (this._errors.length > 0) {
      const error = new SpyreError(
        SpyreErrorCode.PLUGIN,
        "WatchedValue listener error.",
        this._errors.concat(),
      );
      this._errors.length = 0;

      throw error;
    }
  };

  watch = (listener: () => void): (() => void) => {
    this._listeners.push(listener);

    return () => {
      this._queuedToRemove.push(listener);
    };
  };
}

export type WatchedAsyncValue<T> = {
  value: WatchedValue<T>;
  fetch: WatchedValue<AsyncOp>;

  refresh: () => Promise<void>;
};
