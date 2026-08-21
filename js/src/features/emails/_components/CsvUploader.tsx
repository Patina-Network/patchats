import type {
  Pair,
  SendAsyncRequest,
  User,
} from "@/features/emails/dto/emailDto";

import { showEmailError } from "@/features/emails/api/emailError";
import {
  EmailTemplate,
  emailTemplateMap,
} from "@/features/emails/api/emailTemplate";
import {
  dataToSendRequest,
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
import { useEffect, useState } from "react";

// Style definition for each row in the  User file preview table
const rowStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 200,
  whiteSpace: "nowrap",
};

/**
 * Main component for user and pairing CSV file uploaders, an email template dropdown, and email generation button.
 * @param setRequest - A function to set the SendRequest object in the parent component.
 * @returns  A component that allows users to upload CSV files, select an email template, and generate a SendRequest object.
 */
export function CsvUploader({
  setRequest,
}: {
  setRequest: React.Dispatch<React.SetStateAction<SendAsyncRequest | null>>;
}) {
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [pairList, setPairList] = useState<Pair[]>([]);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [pairingFile, setPairingFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");

  const handleCSV = async () => {
    if (!userMap || userMap.size === 0) {
      showEmailError("Missing file", "Please upload a User CSV.");
      return;
    }
    if (template === "") {
      showEmailError("Missing template", "Please select a template.");
      return;
    }
    try {
      const req = await dataToSendRequest(userMap, pairList, template);
      setRequest(req);
    } catch (err) {
      showEmailError("Error when processing CSV", `${err}`);
    }
  };

  return (
    <Flex gap="lg" direction="column">
      <UserCsvUpload
        userFile={userFile}
        setUserFile={setUserFile}
        setUsers={setUserMap}
      />
      <PairingCsvUpload
        pairFile={pairingFile}
        setPairFile={setPairingFile}
        setPairs={setPairList}
      />
      <TemplateSelect selection={template} setSelection={setTemplate} />
      <Button onClick={() => void handleCSV()}>
        Process Files and Template
      </Button>
    </Flex>
  );
}

/**
 * Component for user CSV file upload and preview.
 * @param userFile - The current user CSV file.
 * @param setUserFile - A function to handle changes to the user CSV file.
 * @param setUsers - A function to handle changes to the user data.
 * @returns File Input and Table preview of the user CSV file.
 */
export function UserCsvUpload({
  userFile,
  setUserFile,
  setUsers,
}: {
  userFile: File | null;
  setUserFile: (file: File | null) => void;
  setUsers: (users: Map<string, User>) => void;
}) {
  const [rows, setRows] = useState<React.ReactNode[]>([]);
  useEffect(() => {
    if (userFile) {
      parseUserFile(userFile)
        .then((users) => {
          setRows(
            Array.from(users.values()).map((user) => (
              <Table.Tr key={user.email}>
                <Table.Td style={rowStyle}>{user.firstName}</Table.Td>
                <Table.Td style={rowStyle}>{user.lastName}</Table.Td>
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
          setUsers(users);
        })
        .catch((error) => {
          showEmailError("Error parsing user file", `${error}`);
          setUsers(new Map());
          setRows([]);
        });
    } else {
      setUsers(new Map());
      setRows([]);
    }
  }, [userFile, setUsers]);

  return (
    <Box>
      <FileInput
        accept=".csv"
        label="User CSV"
        withAsterisk
        description="Upload a CSV file containing information about users"
        placeholder="Choose file"
        value={userFile}
        onChange={setUserFile}
      />
      {userFile ?
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
                <Table.Th>First name</Table.Th>
                <Table.Th>Last name</Table.Th>
                <Table.Th>Email</Table.Th>
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

/**
 * Component for pairing CSV file upload and preview.
 * @param pairFile - The current pairing CSV file.
 * @param setPairFile - A function to handle changes to the pairing CSV file.
 * @param setPairs - A function to handle changes to the pairing data.
 * @returns File Input and Table preview of the pairing CSV file.
 */
export function PairingCsvUpload({
  pairFile,
  setPairFile,
  setPairs,
}: {
  pairFile: File | null;
  setPairFile: (file: File | null) => void;
  setPairs: (pairs: Pair[]) => void;
}) {
  const [rows, setRows] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (pairFile) {
      parsePairingFile(pairFile).then((pairs) => {
        setRows(
          Array.from(pairs.values()).map((pair) => (
            <Table.Tr key={`${pair.emailA}-${pair.emailB}`}>
              <Table.Td>{pair.firstNameA}</Table.Td>
              <Table.Td>{pair.lastNameA}</Table.Td>
              <Table.Td>{pair.emailA}</Table.Td>
              <Table.Td>{pair.firstNameB}</Table.Td>
              <Table.Td>{pair.lastNameB}</Table.Td>
              <Table.Td>{pair.emailB}</Table.Td>
            </Table.Tr>
          )),
        );
        setPairs(pairs);
      });
    } else {
      setPairs([]);
      setRows([]);
    }
  }, [pairFile, setPairs]);

  return (
    <Box>
      <FileInput
        accept=".csv"
        label="Pairing CSV"
        withAsterisk
        description="Upload a CSV file containing information about pairings"
        placeholder="Choose file"
        value={pairFile}
        onChange={setPairFile}
      />
      {pairFile ?
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
                <Table.Th>First name #1</Table.Th>
                <Table.Th>Last name #1</Table.Th>
                <Table.Th>Email #1</Table.Th>
                <Table.Th>First name #2</Table.Th>
                <Table.Th>Last name #2</Table.Th>
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

/**
 * Component for email template selection.
 * @param selection - The currently selected email template. (undefined if no template is selected)
 * @param setSelection - A function to handle changes to the selected email template.
 * @returns Email template selection dropdown and template text preview.
 */
export function TemplateSelect({
  selection,
  setSelection,
}: {
  selection: string | undefined;
  setSelection: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [template, setTemplate] = useState<EmailTemplate>();

  useEffect(() => {
    if (selection) {
      // Display the appropriate template
      const template = emailTemplateMap[selection];
      setTemplate(template);
    } else {
      setTemplate(undefined);
    }
  }, [selection]);

  return (
    <Flex gap="xxs" direction="column">
      <NativeSelect
        value={selection}
        onChange={(event) => setSelection(event.currentTarget.value)}
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
