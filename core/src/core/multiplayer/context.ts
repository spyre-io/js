import {Match} from "@heroiclabs/nakama-js";
import {IConnectionService} from "@/core/net/interfaces";
import {Dispatcher} from "@/core/shared/dispatcher";
import {ClockService} from "@/core/clock/service";
import {OpCodeInitClock} from "./types";
import {IMatchContext} from "./interfaces";
import {childLogger} from "@/core/util/logger";

const logger = childLogger("becky:match-context");

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
    logger.debug("onMatchData(@OpCode)", opCode);

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
