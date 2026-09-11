import { MemberFilters } from "@/features/members/api/useMembers";
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";

type MemberFilterValues = z.infer<typeof memberFiltersSchema>;

const initialFilterValues: MemberFilterValues = {
  active: null,
  email: "",
  firstName: "",
  industryPref: "",
  lastName: "",
  matchPref: "",
  rolePref: "",
  topics: "",
};

function toMemberFilters(values: MemberFilterValues): MemberFilters {
  const normalize = (value: string | null) => value?.trim() || undefined;

  return {
    active: normalize(values.active),
    email: normalize(values.email),
    firstName: normalize(values.firstName),
    industryPref: normalize(values.industryPref),
    lastName: normalize(values.lastName),
    matchPref: normalize(values.matchPref),
    rolePref: normalize(values.rolePref),
    topics: normalize(values.topics),
  };
}

const memberFiltersSchema = z.object({
  active: z.enum(["true", "false"]).nullable(),
  email: z.string(),
  firstName: z.string(),
  industryPref: z.string(),
  lastName: z.string(),
  matchPref: z.string(),
  rolePref: z.string(),
  topics: z.string(),
});

export function MembersFiltersForm({
  setFilters,
}: {
  setFilters: (filters: MemberFilters) => void;
}) {
  const form = useForm<MemberFilterValues>({
    initialValues: initialFilterValues,
    validate: zodResolver(memberFiltersSchema),
  });

  const clearFilters = () => {
    form.reset();
    setFilters({});
  };
  return (
    <Stack>
      <Paper p="md" withBorder>
        <form
          onSubmit={form.onSubmit((values) =>
            setFilters(toMemberFilters(values)),
          )}
        >
          <Stack gap="md">
            <div>
              <Text fw={600}>Filter members</Text>
              <Text c="dimmed" size="sm">
                Text filters match the full value and are not case-sensitive.
              </Text>
            </div>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
              <TextInput
                label="First name"
                placeholder="Alex"
                {...form.getInputProps("firstName")}
              />
              <TextInput
                label="Last name"
                placeholder="Morgan"
                {...form.getInputProps("lastName")}
              />
              <TextInput
                label="Email"
                placeholder="alex@example.com"
                {...form.getInputProps("email")}
              />
              <Select
                clearable
                clearButtonProps={{
                  "aria-hidden": false,
                  "aria-label": "Clear status",
                }}
                data={[
                  { label: "Active", value: "true" },
                  { label: "Inactive", value: "false" },
                ]}
                label="Status"
                placeholder="Any status"
                {...form.getInputProps("active")}
              />
              <TextInput
                label="Match preference"
                placeholder="Peer"
                {...form.getInputProps("matchPref")}
              />
              <TextInput
                label="Industry"
                placeholder="Technology"
                {...form.getInputProps("industryPref")}
              />
              <TextInput
                label="Role"
                placeholder="Engineering"
                {...form.getInputProps("rolePref")}
              />
              <TextInput
                label="Topics"
                placeholder="Community, Technology"
                {...form.getInputProps("topics")}
              />
            </SimpleGrid>
            <Group justify="flex-end">
              <Button color="gray" onClick={clearFilters} variant="subtle">
                Clear filters
              </Button>
              <Button type="submit">Apply filters</Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
