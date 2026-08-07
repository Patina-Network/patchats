import type { SendAsyncRequest } from "@/features/emails/dto/emailDto";

import { sendToEmailApi } from "@/features/emails/api/emailAPI";
import { enqueueEmails, triggerProcess } from "@/features/emails/api/emailAPI";
import {
  showEmailError,
  showEmailPending,
  showEmailSuccess,
} from "@/features/emails/api/emailError";
import { type EnqueueEmailRequest } from "@/features/emails/dto/emailDto";
import { Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 *  Button to send  emails.
 *  @param request - The SendRequest object containing the email data to be sent.
 *  @returns A button that, when clicked, opens a confirmation modal and sends the emails if confirmed.
 */

export function EmailSender({
  request,
  selectedTemplateId,
  isSending,
  setIsSending,
  navigate,
}: {
  request: SendAsyncRequest | null;
  selectedTemplateId: string | null;
  isSending: boolean;
  setIsSending: (isSending: boolean) => void;
  navigate: (path: string) => void;
}) {
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
      onConfirm: () => void handleAsyncSend(),
    });

  const handleAsyncSend = async () => {
    if (!selectedTemplateId) {
      showEmailError("Missing Template", "Please select a template");
      return;
    }
    if (!request) {
      showEmailError("Missing Request", "Please process CSV files first");
      return;
    }

    setIsSending(true);
    try {
      // Transform the SendRequest to EnqueueEmailRequest
      const enqueueRequest: EnqueueEmailRequest = {
        templateId: selectedTemplateId,
        replyTo: request.replyTo || undefined,
        messages: request.messages,
      };

      const response = await enqueueEmails(enqueueRequest);
      showEmailSuccess("Emails Queued", `Accepted ${response.accepted} emails`);

      // Kick the runner to start draining
      await triggerProcess();

      navigate(`../progress/${response.requestId}`);
    } catch (err) {
      showEmailError(
        "Send Failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={openModal}
      disabled={!request || !selectedTemplateId}
      loading={isSending}
      fullWidth
    >
      Send Emails
    </Button>
  );
}
