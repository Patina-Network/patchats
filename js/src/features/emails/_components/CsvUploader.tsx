import type { SendRequest } from "@/features/emails/dto/emailDto";

import {
  EmailTemplate,
  emailTemplateMap,
} from "@/features/emails/api/emailTemplate";
import {
  readFiles,
  parseUserFile,
  parsePairingFile,
} from "@/features/emails/api/parseCSV";
import {
  FileInput,
  Button,
  NativeSelect,
  Flex,
  Box,
  ScrollArea,
  Text,
  Table,
  Spoiler,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";

// style definition for each row in the  User file preview table
const rowStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 200,
  whiteSpace: "nowrap",
};

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
    try {
      const req = await readFiles(userFile, pairingFile, template);
      setRequest(req);
    } catch (err) {
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
      <Button onClick={() => void handleCSV()}>
        Process Files and Template
      </Button>
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
  const [rows, setRows] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (value) {
      parseUserFile(value).then((users) => {
        setRows(
          Array.from(users.values()).map((user) => (
            <Table.Tr key={user.email}>
              <Table.Td style={rowStyle}>{user.name}</Table.Td>
              <Table.Td style={rowStyle}>{user.email}</Table.Td>
              <Table.Td style={rowStyle}>{user.intro}</Table.Td>
              <Table.Td style={rowStyle}>{user.linkedIn}</Table.Td>
              <Table.Td style={rowStyle}>{user.industry}</Table.Td>
              <Table.Td style={rowStyle}>{user.preferences}</Table.Td>
              <Table.Td style={rowStyle}>{user.topics}</Table.Td>
              <Table.Td style={rowStyle}>{user.anything}</Table.Td>
            </Table.Tr>
          )),
        );
      });
    } else {
      setRows([]);
    }
  }, [value, rows]);

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
      {value ?
        <ScrollArea h={150}>
          <Table
            stickyHeader
            striped
            withTableBorder
            withColumnBorders
            horizontalSpacing="xs"
            verticalSpacing="xs"
            fz="xs"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Intro</Table.Th>
                <Table.Th>Linked In</Table.Th>
                <Table.Th>Industry</Table.Th>
                <Table.Th>Preferences</Table.Th>
                <Table.Th>Topics</Table.Th>
                <Table.Th>Anything</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      : <Text></Text>}
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
  const [rows, setRows] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (value) {
      parsePairingFile(value).then((pairs) => {
        setRows(
          Array.from(pairs.values()).map((pair) => (
            <Table.Tr key={`${pair.emailA}-${pair.emailB}`}>
              <Table.Td>{pair.fullNameA}</Table.Td>
              <Table.Td>{pair.emailA}</Table.Td>
              <Table.Td>{pair.fullNameB}</Table.Td>
              <Table.Td>{pair.emailB}</Table.Td>
            </Table.Tr>
          )),
        );
      });
    } else {
      setRows([]);
    }
  }, [value, rows]);

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
      {value ?
        <ScrollArea h={150}>
          <Table
            stickyHeader
            striped
            withTableBorder
            withColumnBorders
            horizontalSpacing="xs"
            verticalSpacing="xs"
            fz="xs"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name #1</Table.Th>
                <Table.Th>Email #1</Table.Th>
                <Table.Th>Name #2</Table.Th>
                <Table.Th>Email #2</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      : <Text></Text>}
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
  const [template, setTemplate] = useState<EmailTemplate>();

  useEffect(() => {
    if (value) {
      //display the appropriate template
      const template = emailTemplateMap[value];
      setTemplate(template);
    } else {
      setTemplate(undefined);
    }
  }, [value]);
  return (
    <Flex gap="xxs" direction="column">
      <NativeSelect
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        label="Email Templates"
        description="Select an email template"
        data={[{ label: "Select a template", value: "" }, "Pair", "Reminder"]}
      />
      <Flex>
        <Spoiler maxHeight={0} showLabel="Preview Template" hideLabel="Hide">
          <Text size="xs">Subject: {template ? template.subject : ""}</Text>
          <br />
          <Text size="xs" style={{ whiteSpace: "pre-line" }}>
            Body:{" "}
            {template ? template.body : "Select a template to see its content."}
          </Text>
        </Spoiler>
      </Flex>
    </Flex>
  );
}
