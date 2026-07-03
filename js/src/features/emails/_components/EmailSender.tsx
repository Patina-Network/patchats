import type { SendRequest } from "@/features/emails/dto/emailDto";

import { sendToEmailApi } from "@/features/emails/api/emailAPI";
import { Button, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 *  Button to send  emails.
 */
export function EmailSender({ request }: { request: SendRequest | null }) {
  const mutation = useMutation({
    mutationFn: async (req: SendRequest) => sendToEmailApi(req),
  });
  useEffect(() => {
    if (mutation.status === "pending") {
      notifications.show({
        color: "yellow",
        title: `${mutation.status}`,
        message: "Email sending in progress...",
      });
    }
  }, [mutation.status]);

  const openModal = () =>
    modals.openConfirmModal({
      title: "Email Send Confirmation",
      children: (
        <Text size="sm">
          Please confirm that you want to send {request?.messages.length} email
          {request?.messages.length === 1 ? "" : "s"}.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () =>
        notifications.show({
          color: "yellow",
          title: `Cancel`,
          message: `${request?.messages.length} Emails cancelled.`,
        }),
      onConfirm: () => void handleSend(),
    });

  const handleSend = async () => {
    if (!request) {
      notifications.show({
        color: "red",
        title: "Preview first",
        message: "Preview before sending.",
      });
      return;
    }

    try {
      await mutation.mutateAsync(request);
      notifications.show({
        color: "green",
        title: `${mutation.status}`,
        message: `Emails sent.`,
      });
    } catch {
      notifications.show({
        color: "red",
        title: `${mutation.status}`,
        message: "Unable to send emails.",
      });
    }
  };

  return (
    <Flex>
      <Button fullWidth loading={mutation.isPending} onClick={openModal}>
        Send Emails
      </Button>
    </Flex>
  );
}
