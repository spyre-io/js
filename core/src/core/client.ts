import {IConnectionService, IRpcService} from "@/core/net/interfaces";

import {IMultiplayerService} from "./multiplayer/interfaces";
import {ISpyreClient} from "./interfaces";
import {getDeviceId} from "./util";
import {IAccountService} from "./account/interfaces";
import {IWeb3Service} from "./web3/interfaces";
import {ILeaderboardService} from "./leaderboards/interfaces";
import {IClockService} from "./clock/interfaces";
import {IHistoryService} from "./history/interfaces";
import {INotificationService} from "./notifications/interfaces";
import {IVaultService} from "./vault/interfaces";
import {IComplianceService} from "./compliance/service";

export class SpyreClient implements ISpyreClient {
  constructor(
    public readonly account: IAccountService,
    public readonly notifications: INotificationService,
    public readonly connection: IConnectionService,
    public readonly web3: IWeb3Service,
    public readonly multiplayer: IMultiplayerService,
    public readonly rpc: IRpcService,
    public readonly leaderboards: ILeaderboardService,
    public readonly history: IHistoryService,
    public readonly vaults: IVaultService,
    public readonly clock: IClockService,
    public readonly compliance: IComplianceService,
  ) {
    //
  }

  async initialize(): Promise<void> {
    this.connection.init(getDeviceId());

    await this.connection.connect();
    await this.account.refresh();
  }
}
