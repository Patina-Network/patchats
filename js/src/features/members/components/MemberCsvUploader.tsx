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
  Paper,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconFileSpreadsheet } from "@tabler/icons-react";
import { DragEvent, useRef, useState } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const isDisabled = disabled || isReading;

  const rejectFile = (message: string) => {
    setFile(null);
    setResult(null);
    setReadError(message);
    onChange(null);
  };

  const handleFileChange = async (nextFile: File | null) => {
    if (isDisabled) return;
    if (
      nextFile &&
      !nextFile.name.toLowerCase().endsWith(".csv") &&
      nextFile.type !== "text/csv"
    ) {
      rejectFile("Choose a .csv file.");
      return;
    }

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

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    if (isDisabled || event.dataTransfer.files.length === 0) return;
    if (event.dataTransfer.files.length !== 1) {
      rejectFile("Choose one CSV file at a time.");
      return;
    }
    void handleFileChange(event.dataTransfer.files[0]);
  };

  const validCount =
    result?.rows.filter((row) => row.errors.length === 0).length ?? 0;

  return (
    <Stack gap="md">
      <Paper
        role="region"
        aria-label="CSV file drop area"
        aria-disabled={isDisabled}
        withBorder
        p="md"
        radius="md"
        onDragEnter={(event) => {
          event.preventDefault();
          if (isDisabled || !event.dataTransfer.types.includes("Files")) return;
          dragDepth.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = isDisabled ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setIsDragging(false);
        }}
        onDrop={handleDrop}
        style={{
          borderStyle: "dashed",
          borderColor:
            isDragging && !isDisabled ?
              "var(--mantine-primary-color-filled)"
            : undefined,
          backgroundColor:
            isDragging && !isDisabled ?
              "var(--mantine-primary-color-light)"
            : undefined,
        }}
      >
        <Stack gap="sm">
          <Text c="dimmed" size="sm" ta="center">
            {isDragging && !isDisabled ?
              "Drop your CSV file here"
            : "Drag and drop a CSV file here, or choose one below."}
          </Text>
          <FileInput
            accept=".csv,text/csv"
            clearable
            description="Required headers: firstName, lastName, email, and introduction"
            disabled={isDisabled}
            label="Member CSV"
            leftSection={<IconFileSpreadsheet size={16} />}
            onChange={handleFileChange}
            placeholder="Choose a .csv file"
            value={file}
            withAsterisk
          />
        </Stack>
      </Paper>
      {readError && (
        <Alert color="red" title="CSV upload failed">
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
