import {
  readFiles,
  sendToEmailApi,
  sendToPreviewApi,
  type MessagePreview,
  type SendRequest,
} from "@/features/emails/api/parseCSV";
import { EmailPreview } from "@/features/emails/EmailPreview";
import {
  FileInput,
  Button,
  Stack,
  NativeSelect,
  Box,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

export function CsvUpload() {
  const [userFile, setUserFile] = useState<File | null>(null);
  const [pairingFile, setPairingFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");
  const [request, setRequest] = useState<SendRequest | null>(null);
  const [previews, setPreviews] = useState<MessagePreview[] | null>(null);

  const handlePreview = async () => {
    if (!userFile) {
      notifications.show({
        color: "red",
        title: "Missing file",
        message: "Please upload a User CSV.",
      });
      return;
    }
    if (template === "") {
      notifications.show({
        color: "red",
        title: "Missing template",
        message: "Please select a template.",
      });
      return;
    }
    const req = await readFiles(userFile, pairingFile, template);
    setRequest(req);
    setPreviews(await sendToPreviewApi(req));
  };

  const handleSend = async () => {
    if (!request) {
      notifications.show({
        color: "red",
        title: "Preview first",
        message: "Preview before sending.",
      });
      return;
    }
    await sendToEmailApi(request);
    notifications.show({
      color: "green",
      title: "Sent",
      message: "Emails sent.",
    });
  };

  return (
    <Group align="flex-start" gap="xl">
      <Box w="25%">
        <Stack gap="md">
          <UserCsvUpload value={userFile} onChange={setUserFile} />
          <PairingCsvUpload value={pairingFile} onChange={setPairingFile} />
          <TemplateSelect value={template} onChange={setTemplate} />
          <Button onClick={() => void handlePreview()}>Preview Emails</Button>
          <Button onClick={() => void handleSend()}>Send Emails</Button>
        </Stack>
      </Box>
      {
        <Box style={{ flex: 1 }}>
          <EmailPreview previews={previews} />
        </Box>
      }
    </Group>
  );
}

export function UserCsvUpload({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <FileInput
      accept=".csv"
      label="User CSV"
      withAsterisk
      description="Upload a CSV file containing information about users"
      placeholder="Choose file"
      value={value}
      onChange={onChange}
    />
  );
}

export function PairingCsvUpload({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <FileInput
      accept=".csv"
      label="Pairing CSV"
      withAsterisk
      description="Upload a CSV file containing information about pairings"
      placeholder="Choose file"
      value={value}
      onChange={onChange}
    />
  );
}
export function TemplateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <NativeSelect
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      label="Email Templates"
      description="Select an email template"
      data={[{ label: "Select a template", value: "" }, "Pair", "Reminder"]}
    />
  );
}
