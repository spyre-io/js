import {Dispatcher, IDispatcher} from "../shared/dispatcher";
import {Notification} from "./types";

export interface INotificationService extends IDispatcher<Notification> {
  //
}

export class NotificationService
  extends Dispatcher<Notification>
  implements INotificationService {}
