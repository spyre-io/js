import {IMatchContext, IMatchHandler} from "./interfaces";
import {
  DisconnectReason,
  MatchEndEvent,
  MatchStartEvent,
  MatchUserState,
} from "./types";

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
