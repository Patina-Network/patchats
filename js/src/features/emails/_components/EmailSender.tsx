import type { SendRequest } from "@/features/emails/dto/emailDto";

import { sendToEmailApi } from "@/features/emails/api/emailAPI";
import { showEmailError } from "@/features/emails/api/emailError";
import { Button, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 *  Button to send  emails.
 *  @param request - The SendRequest object containing the email data to be sent.
 *  @returns A button that, when clicked, opens a confirmation modal and sends the emails if confirmed.
 */
export function EmailSender({ request }: { request: SendRequest | null }) {
  const mutation = useMutation({
    mutationFn: async (req: SendRequest) => sendToEmailApi(req),
  });
  useEffect(() => {
    if (mutation.status === "pending") {
      showEmailError(
        "yellow",
        `${mutation.status}`,
        "Email sending in progress...",
      );
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
        showEmailError(
          "yellow",
          "Cancel",
          `${request?.messages.length} Emails cancelled.`,
        ),
      onConfirm: () => void handleSend(),
    });

  const handleSend = async () => {
    if (!request) {
      showEmailError("red", "Preview first", "Preview before sending.");
      return;
    }

    try {
      await mutation.mutateAsync(request);
      showEmailError("green", "Success", "Emails sent.");
    } catch {
      showEmailError("red", "Error", "Unable to send emails.");
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
