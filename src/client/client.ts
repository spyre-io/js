import {AccountService, IAccountService} from "../core/account/service";
import {
  IMultiplayerService,
  MultiplayerService,
} from "../core/multiplayer/service";
import {ConnectionService, IConnectionService} from "../core/net/service";
import {
  INotificationService,
  NotificationService,
} from "../core/notifications/service";
import {IWeb3Service, ThirdWebWeb3Service} from "../core/web3/service";
import {Web3Config} from "../core/web3/types";

import {base, baseSepolia as baseSepoliaTestnet} from "thirdweb/chains";

type CreateSpyreClientOptions = {
  config: {
    web3: Web3Config;
  };
};

type SpyreClient = {
  account: IAccountService;
  notifications: INotificationService;
  connection: IConnectionService;
  web3: IWeb3Service;
  multiplayer: IMultiplayerService;
};

export function createSpyreClient(
  options: CreateSpyreClientOptions,
): SpyreClient {
  const account = new AccountService();
  const notifications = new NotificationService();
  const connection = new ConnectionService(notifications);

  const chain =
    options.config.web3.chainId === 8432 ? base : baseSepoliaTestnet;
  const web3 = new ThirdWebWeb3Service({
    ...options.config.web3,
    network: chain,
  });
  const multiplayer = new MultiplayerService(
    connection,
    account,
    web3,
    connection,
  );

  return {
    account,
    notifications,
    connection,
    web3,
    multiplayer,
  };
}
