export class MatchContext {
    connection;
    match;
    constructor(connection, match) {
        this.connection = connection;
        this.match = match;
        //
    }
    get matchId() {
        return this.match.match_id;
    }
    addHandler(opCode, handler) {
        return () => { };
    }
    async send(opCode, payload) {
        const json = JSON.stringify(payload);
        try {
            await this.connection.sendMatchState(this.match.match_id, opCode, json);
        }
        catch (error) { }
    }
    quit() {
        //
    }
}
export class NullMatchContext {
    get matchId() {
        return "";
    }
    addHandler(opCode, handler) {
        return () => { };
    }
    send(opCode, payload) {
        //
    }
    quit() {
        //
    }
}
