import {IMatchContext} from "./context";
import {
  DisconnectReason,
  MatchEndEvent,
  MatchStartEvent,
  MatchUserState,
} from "./types";

export interface IMatchHandlerFactory {
  instance(): IMatchHandler;
}

export interface IMatchHandler {
  joined(context: IMatchContext): void;
  presenceJoined(context: IMatchContext, user: MatchUserState): void;
  presenceLeft(context: IMatchContext, user: MatchUserState): void;
  matchStarted(context: IMatchContext, evt: MatchStartEvent): void;
  matchEnded(context: IMatchContext, evt: MatchEndEvent): void;
  disconnect(reason: DisconnectReason): void;
}

export class NullMatchHandler implements IMatchHandler {
  joined(context: IMatchContext): void {
    //
  }

  presenceJoined(context: IMatchContext, user: MatchUserState): void {
    //
  }

  presenceLeft(context: IMatchContext, user: MatchUserState): void {
    //
  }

  matchStarted(context: IMatchContext, evt: MatchStartEvent): void {
    //
  }

  matchEnded(context: IMatchContext, evt: MatchEndEvent): void {
    //
  }

  disconnect(reason: DisconnectReason): void {
    //
  }
}
