import {
  type MessagePreview,
  type SendRequest,
} from "@/features/emails/api/parseCSV";
import { CsvUploader } from "@/features/emails/CsvUploader";
import { EmailPreviewer } from "@/features/emails/EmailPreviewer";
import { Box, Flex } from "@mantine/core";
import { useState } from "react";

export default function EmailAdminPage() {
  const [userFile, setUserFile] = useState<File | null>(null);
  const [pairingFile, setPairingFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");
  const [request, setRequest] = useState<SendRequest | null>(null);
  const [previews, setPreviews] = useState<MessagePreview[] | null>(null);

  return (
    <Flex align="flex-start" gap="lg" wrap="nowrap">
      <Box w="30%">
        <CsvUploader
          userFile={userFile}
          setUserFile={setUserFile}
          pairingFile={pairingFile}
          setPairingFile={setPairingFile}
          template={template}
          setTemplate={setTemplate}
          request={request}
          setRequest={setRequest}
        />
      </Box>
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
