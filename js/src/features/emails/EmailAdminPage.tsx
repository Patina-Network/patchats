import { CsvUploader } from "@/features/emails/_components/CsvUploader";
import { EmailPreviewer } from "@/features/emails/_components/EmailPreviewer";
import { EmailSender } from "@/features/emails/_components/EmailSender";
import {
  SendAsyncRequest,
  type MessagePreview,
} from "@/features/emails/dto/emailDto";
import { Box, Flex, Stack } from "@mantine/core";
import { useState } from "react";

export default function EmailAdminPage() {
  const [request, setRequest] = useState<SendAsyncRequest | null>(null);
  const [previews, setPreviews] = useState<MessagePreview[] | null>(null);

  return (
    <Flex align="flex-start" gap="lg" wrap="nowrap">
      <Stack w="30%" gap="lg">
        <CsvUploader setRequest={setRequest} />
        <EmailSender request={request} />
      </Stack>
      <Box w="70%">
        <EmailPreviewer
          previews={previews}
          setPreviews={setPreviews}
          request={request}
        />
      </Box>
    </Flex>
  );
}
