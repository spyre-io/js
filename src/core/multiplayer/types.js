export class MatchUserState {
    userId;
    constructor(userId) {
        this.userId = userId;
        //
    }
}
export class MatchStartEvent {
    startTime;
    constructor(startTime) {
        this.startTime = startTime;
        //
    }
}
export class MatchEndEvent {
    endTime;
    constructor(endTime) {
        this.endTime = endTime;
        //
    }
}
export var DisconnectReason;
(function (DisconnectReason) {
    DisconnectReason[DisconnectReason["MatchIsOver"] = 0] = "MatchIsOver";
    DisconnectReason[DisconnectReason["UserRequested"] = 1] = "UserRequested";
    DisconnectReason[DisconnectReason["Disposal"] = 2] = "Disposal";
    DisconnectReason[DisconnectReason["Exception"] = 3] = "Exception";
})(DisconnectReason || (DisconnectReason = {}));
