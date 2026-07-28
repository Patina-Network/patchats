import { CsvUploader } from "@/features/emails/_components/CsvUploader";
import { EmailHistory } from "@/features/emails/_components/EmailHistory";
import { EmailPreviewer } from "@/features/emails/_components/EmailPreviewer";
import { EmailProgress } from "@/features/emails/_components/EmailProgress";
import { TemplateSelector } from "@/features/emails/_components/TemplateSelector";
import { enqueueEmails, triggerProcess } from "@/features/emails/api/emailAPI";
import {
  showEmailSuccess,
  showEmailError,
} from "@/features/emails/api/emailError";
import {
  type MessagePreview,
  type SendAsyncRequest,
  type EnqueueEmailRequest,
} from "@/features/emails/dto/emailDto";
import { Box, Flex, Stack, Tabs, Button, Text, Group } from "@mantine/core";
import { useState } from "react";

export default function EmailAdminPage() {
  const [selectedTab, setSelectedTab] = useState<string | null>("send");
  const [request, setRequest] = useState<SendAsyncRequest | null>(null);
  const [previews, setPreviews] = useState<MessagePreview[] | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

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
      setRequestId(response.requestId);

      // Kick the runner to start draining
      await triggerProcess();

      // Switch to progress view
      setSelectedTab("progress");
    } catch (err) {
      showEmailError(
        "Send Failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setRequest(null);
    setPreviews(null);
    setSelectedTemplateId(null);
    setRequestId(null);
    setSelectedTab("send");
  };

  const handleTemplateChange = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    setRequest(null);
    setPreviews(null);
  };

  return (
    <Tabs value={selectedTab} onChange={setSelectedTab}>
      <Tabs.List>
        <Tabs.Tab value="send">Send Emails</Tabs.Tab>
        {requestId && <Tabs.Tab value="progress">Live Progress</Tabs.Tab>}
        <Tabs.Tab value="history">History</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="send" pt="lg">
        <Flex align="flex-start" gap="lg" wrap="nowrap">
          <Stack w="30%" gap="lg">
            {/* Template selector - new for async */}
            <TemplateSelector
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              label="Email Template"
            />
            {/* CSV uploader */}
            <CsvUploader
              templateId={selectedTemplateId}
              setRequest={setRequest}
            />
            {/* Send button */}
            <Button
              onClick={handleAsyncSend}
              disabled={!request || !selectedTemplateId}
              loading={isSending}
              fullWidth
            >
              Send Async
            </Button>
          </Stack>
          <Box w="70%">
            {/* Preview */}
            <EmailPreviewer
              previews={previews}
              setPreviews={setPreviews}
              request={request}
            />
          </Box>
        </Flex>
      </Tabs.Panel>
      {requestId && (
        <Tabs.Panel value="progress" pt="lg">
          <Stack gap="lg">
            <Group justify="space-between">
              <Text fw={600}>Batch {requestId}</Text>
              <Button variant="subtle" onClick={handleReset} size="xs">
                New Send
              </Button>
            </Group>
            <EmailProgress requestId={requestId} />
          </Stack>
        </Tabs.Panel>
      )}
      <Tabs.Panel value="history" pt="lg">
        <EmailHistory />
      </Tabs.Panel>
    </Tabs>
  );
}
