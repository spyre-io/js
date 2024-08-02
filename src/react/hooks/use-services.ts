import {useClient} from "./use-client";

export const useAccountService = () => useClient().account;
export const useNotificationService = () => useClient().notifications;
export const useWeb3Service = () => useClient().web3;
export const useMultiplayerService = () => useClient().multiplayer;
export const useLeaderboardService = () => useClient().leaderboards;
