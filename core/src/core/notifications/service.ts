import {INakamaClientService} from "@/core/net/interfaces";
import {Dispatcher} from "@/core/shared/dispatcher";
import {Notification} from "./types";
import {INotificationService} from "./interfaces";

export class NotificationService
  extends Dispatcher<Notification>
  implements INotificationService
{
  private nakama: INakamaClientService | null = null;

  // TODO: fix circular dependency
  init(nakama: INakamaClientService): void {
    this.nakama = nakama;
  }

  async list(count: number): Promise<Notification[]> {
    if (!this.nakama) {
      throw new Error("NotificationService not initialized");
    }

    return this.nakama.getApi(async (client, session) => {
      const res = await client.listNotifications(session, count);
      return res.notifications || [];
    }, 3);
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.nakama) {
      throw new Error("NotificationService not initialized");
    }

    return this.nakama.getApi(async (client, session) => {
      await client.deleteNotifications(session, ids);
    }, 3);
  }
}
