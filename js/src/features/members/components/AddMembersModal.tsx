import { MemberCsvParseResult } from "@/features/members/api/parseMemberCsv";
import { memberSchema, MemberFormValues } from "@/features/members/api/schemas";
import { useSubmitMembers } from "@/features/members/api/useSubmitMembers";
import { MemberCsvUploader } from "@/features/members/components/MemberCsvUploader";
import {
  Alert,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

const memberTextFields = [
  ["firstName", "First name", true],
  ["lastName", "Last name", true],
  ["email", "Email", true],
  ["linkedInUrl", "LinkedIn URL", false],
  ["referralSource", "Referral source", false],
  ["matchPref", "Match preference", false],
  ["industryPref", "Industry preference", false],
  ["rolePref", "Role preference", false],
  ["topics", "Topics", false],
] as const;

interface AddMembersModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AddMembersModal({ opened, onClose }: AddMembersModalProps) {
  const [csvResult, setCsvResult] = useState<MemberCsvParseResult | null>(null);
  const { submitMembers, isSubmitting } = useSubmitMembers();
  const form = useForm<MemberFormValues>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      linkedInUrl: "",
      introduction: "",
      referralSource: "",
      matchPref: "",
      industryPref: "",
      rolePref: "",
      topics: "",
      extraNotes: "",
    },
    validate: zodResolver(memberSchema),
    validateInputOnBlur: true,
  });
  const isCsvValid =
    csvResult !== null &&
    csvResult.fileErrors.length === 0 &&
    csvResult.rows.length > 0 &&
    csvResult.rows.every((row) => row.errors.length === 0);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add members"
      size="xl"
      centered
    >
      <Tabs defaultValue="manual" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="manual">Manual entry</Tabs.Tab>
          <Tabs.Tab value="csv">Upload CSV</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="manual">
          <form
            onSubmit={form.onSubmit((values) => {
              submitMembers([memberSchema.parse(values)]);
            })}
          >
            <Stack gap="md">
              <Text c="dimmed" size="sm">
                Enter the details for one member. Fields marked with an asterisk
                are required.
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {memberTextFields.map(([field, label, required]) => (
                  <TextInput
                    key={field}
                    label={label}
                    type={field === "email" ? "email" : "text"}
                    withAsterisk={required}
                    {...form.getInputProps(field)}
                  />
                ))}
              </SimpleGrid>
              <Textarea
                label="Introduction"
                minRows={3}
                autosize
                withAsterisk
                {...form.getInputProps("introduction")}
              />
              <Textarea
                label="Extra notes"
                minRows={2}
                autosize
                {...form.getInputProps("extraNotes")}
              />
              <Group justify="flex-end">
                <Button type="submit" loading={isSubmitting}>
                  Confirm member
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>
        <Tabs.Panel value="csv" keepMounted>
          <Stack gap="md">
            <Text c="dimmed" size="sm">
              Choose a CSV file to validate and preview multiple members.
            </Text>
            <MemberCsvUploader
              disabled={isSubmitting}
              onChange={setCsvResult}
            />
            {isCsvValid && (
              <Alert color="green" title="CSV validated">
                All member rows passed validation. Review the preview above
                before importing.
              </Alert>
            )}
            <Group justify="flex-end">
              <Button
                disabled={!isCsvValid || isSubmitting}
                loading={isSubmitting}
                onClick={() => {
                  if (!isCsvValid || !csvResult) return;
                  submitMembers(csvResult.rows.map((row) => row.values));
                }}
              >
                Confirm import
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
