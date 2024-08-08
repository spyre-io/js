import { waitFor } from "./time";
export const asyncOps = {
    new: () => ({
        isInProgress: false,
        isStarted: false,
        isComplete: false,
        isSuccess: false,
        isFailure: false,
        error: null,
        lastUpdated: Date.now(),
    }),
    inProgress: () => ({
        isInProgress: true,
        isStarted: true,
        isComplete: false,
        isSuccess: false,
        isFailure: false,
        error: null,
        lastUpdated: Date.now(),
    }),
    success: () => ({
        isInProgress: false,
        isStarted: true,
        isComplete: true,
        isSuccess: true,
        isFailure: false,
        error: null,
        lastUpdated: Date.now(),
    }),
    failure: (error) => ({
        isInProgress: false,
        isStarted: true,
        isComplete: true,
        isSuccess: false,
        isFailure: true,
        error,
        lastUpdated: Date.now(),
    }),
};
export const repeatAsync = (fn, times, delayMs) => {
    return new Promise((resolve, reject) => {
        const loop = (n) => {
            if (n === 0) {
                resolve();
                return;
            }
            fn()
                .then(() => waitFor(delayMs))
                .then(() => loop(n - 1))
                .catch(reject);
        };
        loop(times);
    });
};
