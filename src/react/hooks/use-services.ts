import {useClient} from "./use-client";

export const useMultiplayerService = () => useClient().multiplayer;
export const useLeaderboardService = () => useClient().leaderboards;
