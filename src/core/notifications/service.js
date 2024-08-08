import { Dispatcher } from "@/core/shared/dispatcher";
export class NotificationService extends Dispatcher {
    nakama = null;
    // TODO: fix circular dependency
    init(nakama) {
        this.nakama = nakama;
    }
    async list(count) {
        if (!this.nakama) {
            throw new Error("NotificationService not initialized");
        }
        return this.nakama.getApi(async (client, session) => {
            const res = await client.listNotifications(session, count);
            return res.notifications || [];
        }, 3);
    }
    async delete(ids) {
        if (!this.nakama) {
            throw new Error("NotificationService not initialized");
        }
        return this.nakama.getApi(async (client, session) => {
            await client.deleteNotifications(session, ids);
        }, 3);
    }
}
