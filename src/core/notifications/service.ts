import {INakamaClientService} from "core/net/service";
import {Dispatcher, IDispatcher} from "../shared/dispatcher";
import {Notification} from "./types";

export interface INotificationService extends IDispatcher<Notification> {
  list(count: number): Promise<Notification[]>;
  delete(ids: string[]): Promise<void>;
}

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
