import {AsyncOp, WatchedValue} from "../shared/types";

export interface IClockService {
  sampling: WatchedValue<AsyncOp>;
  offsetMillis: WatchedValue<number>;

  update(): void;
}
