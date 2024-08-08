import {Match} from "@heroiclabs/nakama-js";
import {IConnectionService} from "@/core/net/interfaces";
import {logger} from "../util/logger";

export interface IMatchContext {
  get matchId(): string;

  addHandler<T>(opCode: number, handler: (payload: T) => void): () => void;

  send(opCode: number, payload: any): void;
  quit(): void;
}

export class MatchContext implements IMatchContext {
  constructor(
    private readonly connection: IConnectionService,
    public readonly match: Match,
  ) {
    //
  }

  get matchId(): string {
    return this.match.match_id;
  }

  addHandler<T>(opCode: number, handler: (payload: T) => void): () => void {
    logger.debug(`MatchContext.addHandler(@opCode, @handler)`, opCode, handler);

    return () => {};
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

  send(opCode: number, payload: any): void {
    logger.debug(`NullMatchContext.send(@opCode, @payload)`, opCode, payload);
  }

  quit(): void {
    logger.debug(`NullMatchContext.quit()`);
  }
}
