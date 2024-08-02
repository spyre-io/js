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
  async list(count: number): Promise<Notification[]> {
    return [];
  }

  async delete(ids: string[]): Promise<void> {
    //
  }
}
