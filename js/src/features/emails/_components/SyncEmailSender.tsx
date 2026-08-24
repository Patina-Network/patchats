import type {
  SendAsyncRequest,
  SendRequest,
  EmailTemplate,
} from "@/features/emails/dto/emailDto";

import { listTemplates, sendToEmailApi } from "@/features/emails/api/emailAPI";
import {
  showEmailError,
  showEmailPending,
  showEmailSuccess,
} from "@/features/emails/api/emailError";
import { Button, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function SyncEmailSender({
  request,
}: {
  request: SendAsyncRequest | null;
}) {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);

  const mutation = useMutation({
    mutationFn: async (req: SendRequest) => sendToEmailApi(req),
  });

  useEffect(() => {
    if (!request?.templateId) {
      setTemplate(null);
      return;
    }

    let cancelled = false;

    const loadTemplate = async () => {
      try {
        const templates = await listTemplates();
        const found = templates.find((t) => t.id === request.templateId);
        if (!cancelled) {
          setTemplate(found ?? null);
        }
      } catch {
        if (!cancelled) {
          setTemplate(null);
        }
      }
    };

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [request?.templateId]);

  useEffect(() => {
    if (mutation.status === "pending") {
      showEmailPending("pending", "Email sending in progress...");
    }
  }, [mutation.status]);

  const openModal = () =>
    modals.openConfirmModal({
      title: "SYNCHRONOUS Email Send Confirmation",
      children: (
        <Text size="sm">
          Please confirm that you want to send {request?.messages.length} email
          {request?.messages.length === 1 ? "" : "s"} synchronously.
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

    if (!template) {
      showEmailError(
        "Template missing",
        "Could not load the template subject/body.",
      );
      return;
    }
    // Convert SendAsyncRequest to SendRequest
    const syncRequest: SendRequest = {
      templateId: request.templateId,
      subject: template.subject,
      body: template.body,
      replyTo: request.replyTo ?? null,
      messages: request.messages,
    };

    try {
      const response = await mutation.mutateAsync(syncRequest);
      const payload = response?.payload;
      const sent = payload?.sent ?? 0;
      const failed = payload?.failed ?? 0;

      if (failed > 0) {
        showEmailError(
          "Partial Success",
          `Sent ${sent} of ${sent + failed} emails`,
        );
      } else {
        showEmailSuccess(
          "Success",
          `All ${sent} email${sent === 1 ? "" : "s"} sent.`,
        );
      }
    } catch {
      showEmailError("Error", "Unable to send emails.");
    }
  };

  return (
    <Flex>
      <Button
        fullWidth
        loading={mutation.isPending}
        onClick={openModal}
        disabled={!request || !template}
      >
        Send Synchronous Emails
      </Button>
    </Flex>
  );
}
