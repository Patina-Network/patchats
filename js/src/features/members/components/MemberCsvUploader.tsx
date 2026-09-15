import {
  MemberCsvParseResult,
  parseMemberCsv,
} from "@/features/members/api/parseMemberCsv";
import {
  Alert,
  Badge,
  FileInput,
  Group,
  List,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconFileSpreadsheet } from "@tabler/icons-react";
import { useState } from "react";

const PREVIEW_FIELDS = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["email", "Email"],
  ["linkedInUrl", "LinkedIn"],
  ["introduction", "Introduction"],
  ["referralSource", "Referral source"],
  ["matchPref", "Match preference"],
  ["industryPref", "Industry preference"],
  ["rolePref", "Role preference"],
  ["topics", "Topics"],
  ["extraNotes", "Extra notes"],
] as const;

interface MemberCsvUploaderProps {
  disabled?: boolean;
  onChange: (result: MemberCsvParseResult | null) => void;
}

/** Uploads, validates, and previews CSV rows for POST /api/members. */
export function MemberCsvUploader({
  disabled = false,
  onChange,
}: MemberCsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MemberCsvParseResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const handleFileChange = async (nextFile: File | null) => {
    setFile(nextFile);
    setResult(null);
    setReadError(null);
    onChange(null);

    if (!nextFile) return;

    setIsReading(true);
    try {
      const nextResult = parseMemberCsv(await nextFile.text());
      setResult(nextResult);
      onChange(nextResult);
    } catch (_error) {
      setReadError("The selected file could not be read as a CSV file.");
    } finally {
      setIsReading(false);
    }
  };

  const validCount =
    result?.rows.filter((row) => row.errors.length === 0).length ?? 0;

  return (
    <Stack gap="md">
      <FileInput
        accept=".csv,text/csv"
        clearable
        description="Required headers: firstName, lastName, email, and introduction"
        disabled={disabled || isReading}
        label="Member CSV"
        leftSection={<IconFileSpreadsheet size={16} />}
        onChange={handleFileChange}
        placeholder="Choose a .csv file"
        value={file}
        withAsterisk
      />
      {readError && (
        <Alert color="red" title="Could not read CSV">
          {readError}
        </Alert>
      )}
      {result && (
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>CSV preview</Text>
            <Group gap="xs">
              <Badge color="green" variant="light">
                {validCount} valid
              </Badge>
              <Badge
                color={result.rows.length === validCount ? "gray" : "red"}
                variant="light"
              >
                {result.rows.length - validCount} invalid
              </Badge>
            </Group>
          </Group>
          {result.fileErrors.length > 0 && (
            <Alert color="red" title="CSV needs attention">
              <List size="sm">
                {result.fileErrors.map((error) => (
                  <List.Item key={error}>{error}</List.Item>
                ))}
              </List>
            </Alert>
          )}
          {result.rows.length > 0 && (
            <Table.ScrollContainer minWidth={1900} maxHeight={400}>
              <Table
                fz="xs"
                stickyHeader
                striped
                withColumnBorders
                withTableBorder
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>CSV row</Table.Th>
                    {PREVIEW_FIELDS.map(([, label]) => (
                      <Table.Th key={label}>{label}</Table.Th>
                    ))}
                    <Table.Th>Validation</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {result.rows.map((row) => (
                    <Table.Tr key={row.rowNumber}>
                      <Table.Td>{row.rowNumber}</Table.Td>
                      {PREVIEW_FIELDS.map(([field]) => (
                        <Table.Td key={field} maw={220}>
                          <Text lineClamp={2} size="xs">
                            {row.values[field] || "—"}
                          </Text>
                        </Table.Td>
                      ))}
                      <Table.Td miw={220}>
                        {row.errors.length > 0 ?
                          <Text c="red" size="xs">
                            {row.errors.join("; ")}
                          </Text>
                        : <Badge color="green" size="sm" variant="light">
                            Ready
                          </Badge>
                        }
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      )}
    </Stack>
  );
}
