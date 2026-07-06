import { notifications } from "@mantine/notifications";

/**
 * This function displays a notification with the specified color, title, and message.
 * @param color - The color of the notification (e.g., "red", "green", "yellow").
 * @param title - The title of the notification.
 * @param message - The message content of the notification.
 */

export const showEmailError = (
  color: string,
  title: string,
  message: string,
) => {
  notifications.show({
    color: color,
    title: title,
    message: message,
  });
};
