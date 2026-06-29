import type { SendRequest } from "@/features/emails/dto/EmailDto";

import { readFiles } from "@/features/emails/api/parseCSV";
import { FileInput, Button, NativeSelect, Flex, Box, ScrollArea, Text} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";

/**
 * Component for user and pairing CSV file uploaders, an email template dropdown, and email generation button.
 */
export function CsvUploader({
  setRequest,
}: {
  setRequest: React.Dispatch<React.SetStateAction<SendRequest | null>>;
}) {
  const [userFile, setUserFile] = useState<File | null>(null);
  const [pairingFile, setPairingFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");

  const handleCSV = async () => {
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
    try{
    const req = await readFiles(userFile, pairingFile, template);
    setRequest(req);
    }catch(err){
      notifications.show({
        color: "red",
        title: "Error when processing CSV",
        message: `${err}`,
      });
    }
  };

  return (
    <Flex gap="lg" direction="column">
      <UserCsvUpload value={userFile} onChange={setUserFile} />
      <PairingCsvUpload value={pairingFile} onChange={setPairingFile} />
      <TemplateSelect value={template} onChange={setTemplate} />
      <Button onClick={() => void handleCSV()}>Process Files and Template</Button>
    </Flex>
  );
}

export function UserCsvUpload({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const [rawText, setRawText] = useState<string>("");

  useEffect(() => {
    if (value) {
      value.text().then((text) => {
          setRawText(text);
      });
    } else {
      setRawText("");
    }
  }, [value]);

  return (
    <Box>
      <FileInput
        accept=".csv"
        label="User CSV"
        withAsterisk
        description="Upload a CSV file containing information about users"
        placeholder="Choose file"
        value={value}
        onChange={onChange}
      />
      <Text size = "sm">File Content:</Text>
      {value ? (
        <ScrollArea h = {150}>
        <Text size = "sm">{rawText}</Text>
        </ScrollArea>
      ) : (
        <Text size = "sm">Select a file to see its raw text contents.</Text>
      )}
    </Box>
  );
}
export function PairingCsvUpload({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const [rawText, setRawText] = useState<string>("");

  useEffect(() => {
    if (value) {
      value.text().then((text) => {
          setRawText(text);
      });
    } else {
      setRawText("");
    }
  }, [value]);

  return (
    <Box>
    <FileInput
      accept=".csv"
      label="Pairing CSV"
      withAsterisk
      description="Upload a CSV file containing information about pairings"
      placeholder="Choose file"
      value={value}
      onChange={onChange}
    />
    <Text size = "sm">File Content:</Text>
      {value ? (
        <ScrollArea h = {150}>
        <Text size = "sm">{rawText}</Text>
        </ScrollArea>
      ) : (
        <Text size = "sm">Select a file to see its raw text contents.</Text>
      )}
      </Box>
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
