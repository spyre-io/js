import {useClient} from "./use-client";

export const useNotificationService = () => useClient().notifications;
export const useMultiplayerService = () => useClient().multiplayer;
export const useLeaderboardService = () => useClient().leaderboards;
