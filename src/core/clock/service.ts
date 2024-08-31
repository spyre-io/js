import {IMultiplayerService} from "../multiplayer/interfaces";
import {OpCodeInitClock} from "../multiplayer/types";
import {AsyncOp, WatchedValue} from "../shared/types";
import {asyncOps} from "../util/async";

export interface IClockService {
  sampling: WatchedValue<AsyncOp>;
  offsetMillis: WatchedValue<number>;

  update(): void;
}

export class ClockService implements IClockService {
  private _sampling: WatchedValue<AsyncOp> = new WatchedValue<AsyncOp>(
    asyncOps.new(),
  );
  private _offsetMillis: WatchedValue<number> = new WatchedValue<number>(0);
  private _offsetMeasurements: number[] = [];

  constructor(private readonly _multiplayer: IMultiplayerService) {
    //
  }

  get sampling(): WatchedValue<AsyncOp> {
    return this._sampling;
  }

  get offsetMillis(): WatchedValue<number> {
    return this._offsetMillis;
  }

  async update(): Promise<void> {
    this._sampling.setValue(asyncOps.inProgress());

    try {
      await this._multiplayer.send(
        OpCodeInitClock,
        JSON.stringify({
          s: Math.floor(Date.now() + this._offsetMillis.getValue()),
        }),
        1000,
      );
    } catch (error) {
      this._sampling.setValue(asyncOps.failure(error));
      return;
    }
  }

  addLatencyMeasurement(measurement: number) {
    this._sampling.setValue(asyncOps.success());

    // "ring buffer"
    this._offsetMeasurements.push(measurement);
    if (this._offsetMeasurements.length > 5) {
      this._offsetMeasurements.shift();
    }

    // take the average
    // TODO: take out outliers because these are probably TCP rebroadcast
    const average =
      this._offsetMeasurements.reduce((acc, cur) => acc + cur, 0) /
      this._offsetMeasurements.length;
    this._offsetMillis.setValue(average);
  }
}
