import { notifications } from "@mantine/notifications";

/**
 * This function displays a notification with the specified color, title, and message.
 * @param color - The color of the notification (e.g., "red", "green", "yellow").
 * @param title - The title of the notification.
 * @param message - The message content of the notification.
 */

export const showEmailError = (title: string, message: string) => {
  notifications.show({
    color: "red",
    title: title,
    message: message,
  });
};

export const showEmailPending = (title: string, message: string) => {
  notifications.show({
    color: "yellow",
    title: title,
    message: message,
  });
};

export const showEmailSuccess = (title: string, message: string) => {
  notifications.show({
    color: "green",
    title: title,
    message: message,
  });
};
