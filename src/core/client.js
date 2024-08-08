import { AccountService } from "./account/service";
import { MultiplayerService } from "./multiplayer/service";
import { ConnectionService, } from "./net/service";
import { NotificationService, } from "./notifications/service";
import { ThirdWebWeb3Service } from "./web3/service";
import { v4, validate } from "uuid";
import { LeaderboardService } from "./leaderboards/service";
export const getDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id || !validate(id)) {
        id = v4();
        localStorage.setItem("deviceId", id);
    }
    return id;
};
class SpyreClient {
    account;
    notifications;
    connection;
    web3;
    multiplayer;
    rpc;
    leaderboards;
    constructor(account, notifications, connection, web3, multiplayer, rpc, leaderboards) {
        this.account = account;
        this.notifications = notifications;
        this.connection = connection;
        this.web3 = web3;
        this.multiplayer = multiplayer;
        this.rpc = rpc;
        this.leaderboards = leaderboards;
        //
    }
    async initialize() {
        this.connection.init(getDeviceId());
        await this.connection.connect();
    }
}
export function createSpyreClient(options, thirdweb, connectionManager) {
    const notifications = new NotificationService();
    const leaderboards = new LeaderboardService();
    const connection = new ConnectionService(notifications);
    // todo: fix circular dependency
    notifications.init(connection);
    const account = new AccountService(connection);
    const web3 = new ThirdWebWeb3Service(options.web3, account, connection, thirdweb, connectionManager);
    const multiplayer = new MultiplayerService(connection, account, web3, connection);
    return new SpyreClient(account, notifications, connection, web3, multiplayer, connection, leaderboards);
}
