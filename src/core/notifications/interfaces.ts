import {IDispatcher} from "@/core/shared/dispatcher";
import {Notification} from "./types";

export interface INotificationService extends IDispatcher<Notification> {
  list(count: number): Promise<Notification[]>;
  delete(ids: string[]): Promise<void>;
}
