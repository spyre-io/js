import {Match} from "@heroiclabs/nakama-js";
import {IConnectionService} from "@/core/net/interfaces";
import {logger} from "../util/logger";
import {Dispatcher} from "../shared/dispatcher";
import {ClockService} from "../clock/service";
import {OpCodeInitClock} from "./types";
import {IMatchContext} from "./interfaces";

export class MatchContext implements IMatchContext {
  private readonly _dispatcher: Dispatcher<Uint8Array> = new Dispatcher();

  constructor(
    private readonly connection: IConnectionService,
    clock: ClockService,
    public readonly match: Match,
  ) {
    this._dispatcher.addHandler(OpCodeInitClock, (message) => {
      const raw = new TextDecoder("utf-8").decode(message);
      const {d} = JSON.parse(raw);

      clock.addLatencyMeasurement(d);
    });
  }

  get matchId(): string {
    return this.match.match_id;
  }

  addHandler(
    opCode: number,
    handler: (payload: Uint8Array) => void,
  ): () => void {
    return this._dispatcher.addHandler(opCode, handler);
  }

  onMatchData(opCode: number, payload: Uint8Array): void {
    this._dispatcher.on(opCode, payload);
  }

  async send(opCode: number, payload: any): Promise<void> {
    const json = JSON.stringify(payload);

    try {
      await this.connection.sendMatchState(this.match.match_id, opCode, json);
    } catch (error) {
      //
    }
  }

  quit(): void {
    //
  }
}

export class NullMatchContext implements IMatchContext {
  get matchId(): string {
    return "";
  }

  addHandler<T>(opCode: number, handler: (payload: T) => void): () => void {
    logger.debug(
      `NullMatchContext.addHandler(@opCode, @handler)`,
      opCode,
      handler,
    );
    return () => {};
  }

  onMatchData(opCode: number, payload: any): void {
    //
  }

  send(opCode: number, payload: any): void {
    logger.debug(`NullMatchContext.send(@opCode, @payload)`, opCode, payload);
  }

  quit(): void {
    logger.debug(`NullMatchContext.quit()`);
  }
}
