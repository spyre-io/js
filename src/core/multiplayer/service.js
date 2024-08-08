import { logger } from "@/core/util/logger";
import { NullMatchHandler } from "./handler";
import { MatchContext, NullMatchContext } from "./context";
export class MultiplayerService {
    rpc;
    account;
    web3;
    connection;
    match = null;
    matchInfo = null;
    matchmakingInfo = null;
    matchJoinIds = [];
    mmId = "";
    context = new NullMatchContext();
    handler = new NullMatchHandler();
    constructor(rpc, account, web3, connection) {
        this.rpc = rpc;
        this.account = account;
        this.web3 = web3;
        this.connection = connection;
    }
    join = async (matchId, meta, retries = 3) => {
        return this.connection.join(matchId, meta, retries);
    };
    leave() {
        return this.connection.leave();
    }
    send(opCode, payload, retries) {
        if (!this.match) {
            throw new Error("No match");
        }
        return this.connection.sendMatchState(this.match.match_id, opCode, payload, retries);
    }
    async findMatches(bracketId) {
        this.match = null;
        this.matchmakingInfo = null;
        this.matchJoinIds = [];
        this.matchInfo = null;
        const res = await this.rpc.call("hangman/matchmaking/find", { bracketId });
        if (!res.payload.success) {
            throw new Error("Failed to find matches");
        }
        const { matchmakingInfo, matchInfo } = res.payload;
        // we might already be in a match
        const { creatorMatchId, opponentMatchIds } = matchInfo;
        this.matchJoinIds = [];
        if (creatorMatchId && creatorMatchId.length > 0) {
            this.matchJoinIds.push(creatorMatchId);
        }
        if (opponentMatchIds && opponentMatchIds.length > 0) {
            this.matchJoinIds.push(...opponentMatchIds);
        }
        this.matchmakingInfo = matchmakingInfo;
    }
    async accept({ nonce, expiry, amount, fee }, factory, { onSignStart, onSignComplete, onAcceptStart, onAcceptComplete, onJoinStart, onJoinComplete, } = {}) {
        if (!this.matchmakingInfo) {
            throw new Error("No matchmaking info");
        }
        // first, sign the stake
        if (onSignStart) {
            onSignStart();
        }
        const sig = await this.web3.signStake({
            nonce,
            expiry,
            amount,
            fee,
        });
        if (onSignComplete) {
            onSignComplete(sig);
        }
        // submit to backend
        if (onAcceptStart) {
            onAcceptStart();
        }
        const res = await this.rpc.call("hangman/matchmaking/accept", {
            mmId: this.matchmakingInfo.mmId,
            signature: sig,
        });
        if (!res.payload.success) {
            throw new Error("Failed to accept match");
        }
        if (onAcceptComplete) {
            onAcceptComplete();
        }
        this.matchJoinIds = res.payload.matchJoinIds;
        // iterate through match join ids and try to join one
        if (onJoinStart) {
            onJoinStart();
        }
        let match = null;
        for (const id of this.matchJoinIds) {
            try {
                match = await this.join(id, { mmId: this.matchmakingInfo.mmId });
                break;
            }
            catch (error) {
                logger.info("Couldn't join match @MatchId: " + error, id);
            }
        }
        if (!match) {
            throw new Error("Failed to join match");
        }
        if (onJoinComplete) {
            onJoinComplete();
        }
        this.context = new MatchContext(this.connection, match);
        this.handler = factory.instance(match.match_id);
        this.handler.joined(this.context);
    }
}
