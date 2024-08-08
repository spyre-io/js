import {AsyncOp} from "@/core/shared/types";
import {waitFor} from "./time";

export const asyncOps = {
  new: (): AsyncOp => ({
    isInProgress: false,
    isStarted: false,
    isComplete: false,
    isSuccess: false,
    isFailure: false,
    error: null,
    lastUpdated: Date.now(),
  }),
  inProgress: (): AsyncOp => ({
    isInProgress: true,
    isStarted: true,
    isComplete: false,
    isSuccess: false,
    isFailure: false,
    error: null,
    lastUpdated: Date.now(),
  }),
  success: (): AsyncOp => ({
    isInProgress: false,
    isStarted: true,
    isComplete: true,
    isSuccess: true,
    isFailure: false,
    error: null,
    lastUpdated: Date.now(),
  }),
  failure: (error: any): AsyncOp => ({
    isInProgress: false,
    isStarted: true,
    isComplete: true,
    isSuccess: false,
    isFailure: true,
    error,
    lastUpdated: Date.now(),
  }),
};

export const repeatAsync = (
  fn: () => Promise<void>,
  times: number,
  delayMs: number,
) => {
  return new Promise<void>((resolve, reject) => {
    const loop = (n: number) => {
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
