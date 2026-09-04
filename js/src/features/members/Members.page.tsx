import {
  Member,
  MemberFilters,
  useMembers,
} from "@/features/members/api/useMembers";
import { useUpdateMemberStatus } from "@/features/members/api/useUpdateMemberStatus";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

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

export function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({});
  const form = useForm<MemberFilterValues>({
    initialValues: initialFilterValues,
    validate: zodResolver(memberFiltersSchema),
  });
  const { data: members, isError, isPending } = useMembers(filters);
  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
    variables: statusUpdateVariables,
  } = useUpdateMemberStatus();

  const clearFilters = () => {
    form.reset();
    setFilters({});
  };

  const handleToggleStatus = (member: Member) => {
    const nextActive = !member.active;
    modals.openConfirmModal({
      title: nextActive ? "Reactivate member" : "Deactivate member",
      children: (
        <Text size="sm">
          {nextActive ?
            `Reactivate ${member.firstName} ${member.lastName}? They will be included in the next matching cycle again.`
          : `Deactivate ${member.firstName} ${member.lastName}? They won't be included in the next matching cycle until reactivated.`
          }
        </Text>
      ),
      labels: {
        confirm: nextActive ? "Reactivate" : "Deactivate",
        cancel: "Cancel",
      },
      confirmProps: { color: nextActive ? "green" : "red" },
      onConfirm: () =>
        updateStatus(
          { active: nextActive, id: member.id },
          {
            onError: () =>
              notifications.show({
                color: "red",
                message: `Could not update status for ${member.firstName} ${member.lastName}.`,
                title: "Update failed",
              }),
            onSuccess: () =>
              notifications.show({
                color: "green",
                message: `${member.firstName} ${member.lastName} is now ${nextActive ? "active" : "inactive"}.`,
                title: nextActive ? "Member reactivated" : "Member deactivated",
              }),
          },
        ),
    });
  };

  if (isPending) {
    return (
      <Center py="xl">
        <Loader aria-label="Loading members" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert color="red" title="Members could not be loaded">
        Try refreshing the page. If the problem continues, check that the
        backend is running.
      </Alert>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Members</Title>
          <Text c="dimmed">Everyone registered for PatChats.</Text>
        </div>
        <Badge size="lg" variant="light">
          {members.length} {members.length === 1 ? "member" : "members"}
        </Badge>
      </Group>
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
      {members.length === 0 ?
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            No members found.
          </Text>
        </Paper>
      : <Table.ScrollContainer minWidth={1100}>
          <Table highlightOnHover striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>LinkedIn</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Match preference</Table.Th>
                <Table.Th>Industry</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Topics</Table.Th>
                <Table.Th>Joined</Table.Th>
                <Table.Th>Profile</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {members.map((member) => (
                <Table.Tr key={member.id}>
                  <Table.Td fw={600}>
                    {member.firstName} {member.lastName}
                  </Table.Td>
                  <Table.Td>
                    <Anchor href={`mailto:${member.email}`}>
                      {member.email}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    {member.linkedInUrl ?
                      <Anchor
                        href={member.linkedInUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Profile
                      </Anchor>
                    : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={member.active ? "green" : "gray"}>
                      {member.active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{member.matchPref ?? "—"}</Table.Td>
                  <Table.Td>{member.industryPref ?? "—"}</Table.Td>
                  <Table.Td>{member.rolePref ?? "—"}</Table.Td>
                  <Table.Td>{member.topics ?? "—"}</Table.Td>
                  <Table.Td>
                    {dateFormatter.format(new Date(member.createdAt))}
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/profile/${member.id}`}>
                      View
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      color={member.active ? "red" : "green"}
                      loading={
                        isUpdatingStatus &&
                        statusUpdateVariables?.id === member.id
                      }
                      onClick={() => handleToggleStatus(member)}
                      size="xs"
                      variant="light"
                    >
                      {member.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      }
    </Stack>
  );
}
