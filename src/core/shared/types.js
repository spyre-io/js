import { SpyreErrorCode } from "./errors";
export const newCancelToken = () => {
    const token = {
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
export class SpyreError extends Error {
    code;
    errors;
    constructor(code, message, errors = []) {
        super(message);
        this.code = code;
        this.errors = errors;
    }
}
export class WatchedValue {
    _value;
    _listeners = [];
    _queuedToRemove = [];
    _errors = [];
    constructor(_value) {
        this._value = _value;
        //
    }
    getValue = () => this._value;
    setValue = (value) => {
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
            }
            catch (error) {
                this._errors.push(error);
            }
        }
        // throw all errors
        if (this._errors.length > 0) {
            const error = new SpyreError(SpyreErrorCode.PLUGIN, "WatchedValue listener error.", this._errors.concat());
            this._errors.length = 0;
            throw error;
        }
    };
    watch = (listener) => {
        this._listeners.push(listener);
        return () => {
            this._queuedToRemove.push(listener);
        };
    };
}
