import type {
  MessagePreview,
  SendAsyncRequest,
} from "@/features/emails/dto/emailDto";

import { CsvUploader } from "@/features/emails/_components/CsvUploader";
import { EmailPreviewer } from "@/features/emails/_components/EmailPreviewer";
import { EmailSender } from "@/features/emails/_components/EmailSender";
import { TemplateSelector } from "@/features/emails/_components/TemplateSelector";
import { Box, Flex, Stack } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function EmailSendPage() {
  const [request, setRequest] = useState<SendAsyncRequest | null>(null);
  const [previews, setPreviews] = useState<MessagePreview[] | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleTemplateChange = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    setRequest(null);
    setPreviews(null);
  };

  return (
    <Flex align="flex-start" gap="lg" wrap="nowrap">
      <Stack w="30%" gap="lg">
        {/* Template selector - new for async */}
        <TemplateSelector
          value={selectedTemplateId}
          onChange={handleTemplateChange}
          label="Email Template"
        />
        {/* CSV uploader */}
        <CsvUploader templateId={selectedTemplateId} setRequest={setRequest} />
        {/* Send button */}
        <EmailSender
          request={request}
          selectedTemplateId={selectedTemplateId}
          isSending={isSending}
          setIsSending={setIsSending}
          navigate={navigate}
        />
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
  );
}
