import type { SendAsyncRequest } from "@/features/emails/dto/emailDto";

import { sendToEmailApi } from "@/features/emails/api/emailAPI";
import {
  showEmailError,
  showEmailPending,
  showEmailSuccess,
} from "@/features/emails/api/emailError";
import { Button, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 *  Button to send  emails.
 *  @param request - The SendRequest object containing the email data to be sent.
 *  @returns A button that, when clicked, opens a confirmation modal and sends the emails if confirmed.
 */
export function EmailSender({ request }: { request: SendAsyncRequest | null }) {
  const mutation = useMutation({
    mutationFn: async (req: SendAsyncRequest) => sendToEmailApi(req),
  });
  useEffect(() => {
    if (mutation.status === "pending") {
      showEmailPending(`${mutation.status}`, "Email sending in progress...");
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
        showEmailPending(
          "Cancel",
          `${request?.messages.length} Emails cancelled.`,
        ),
      onConfirm: () => void handleSend(),
    });

  const handleSend = async () => {
    if (!request) {
      showEmailError("Preview first", "Preview before sending.");
      return;
    }

    try {
      await mutation.mutateAsync(request);
      showEmailSuccess("Success", "Emails sent.");
    } catch {
      showEmailError("Error", "Unable to send emails.");
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
