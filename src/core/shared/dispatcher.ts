import {SpyreErrorCode} from "./errors";
import {SpyreError} from "./types";

export interface IDispatcher<T> {
  on(code: number, payload: T): void;
  addHandler(code: number, handler: (notif: T) => void): () => void;
}

export class Dispatcher<T> implements IDispatcher<T> {
  _handlers: {[key: number]: ((payload: T) => void)[]} = {};
  _removalQueue: (() => void)[] = [];

  on(code: number, payload: T) {
    const handlers = this._handlers[code];
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }

    // remove any queued handlers
    if (this._removalQueue.length > 0) {
      for (const remove of this._removalQueue) {
        remove();
      }
      this._removalQueue.length = 0;
    }
  }

  addHandler(code: number, handler: (notif: T) => void) {
    if (!this._handlers[code]) {
      this._handlers[code] = [];
    }

    // ensure it's not already in the list
    if (this._handlers[code].includes(handler)) {
      return () => {};
    }

    // add to the list
    this._handlers[code].push(handler);

    // queue for removal
    return () =>
      this._removalQueue.push(() => {
        this._handlers[code] = this._handlers[code].filter(
          (h) => h !== handler,
        );
      });
  }
}
