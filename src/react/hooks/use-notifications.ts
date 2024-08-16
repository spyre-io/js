import {Notification, NotificationCodes} from "@/core/notifications/types";
import {useClient} from "./use-client";
import {useEffect} from "react";

/**
 * Subscribes a handler to a type of notification.
 *
 * @param code The notification code.
 * @param fn The function to subscribe.
 */
export const useNotifHandler = (
  code: NotificationCodes,
  fn: (notif: Notification) => void,
) => {
  const notifs = useClient().notifications;

  useEffect(() => notifs.addHandler(code, fn), [notifs, code, fn]);
};
