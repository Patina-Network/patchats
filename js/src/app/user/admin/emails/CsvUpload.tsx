import { readFiles } from "@/app/user/admin/emails/parseCSV";
import { FileInput, Button, Stack, NativeSelect } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

export function CsvSubmitButton({ onSubmit }: { onSubmit: () => void }) {
  return <Button onClick={onSubmit}>Send Emails</Button>;
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
      data={["Pair", "Reminder", "Restart"]}
    />
  );
}

export function CsvUpload() {
  const [userFile, setUserFile] = useState<File | null>(null);
  const [pairingFile, setPairingFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");

  const handleSubmit = async () => {
    if (!userFile && !pairingFile) {
      notifications.show({
        color: "red",
        title: "Missing files",
        message: "Please upload both a User CSV and a Pairing CSV.",
      });
      return;
    }
    if (!userFile) {
      notifications.show({
        color: "red",
        title: "Missing file",
        message: "Please upload a User CSV.",
      });
      return;
    }
    if (!template) {
      notifications.show({
        color: "red",
        title: "Missing template",
        message: "Please select an email template.",
      });
      return;
    }
    await Promise.all([readFiles(userFile, pairingFile, template)]);
  };

  return (
    <Stack>
      <UserCsvUpload value={userFile} onChange={setUserFile} />
      <PairingCsvUpload value={pairingFile} onChange={setPairingFile} />
      <TemplateSelect value={template} onChange={setTemplate} />
      <CsvSubmitButton onSubmit={() => void handleSubmit()} />
    </Stack>
  );
}
