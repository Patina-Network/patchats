import { MemberFilters, useMembers } from "@/features/members/api/useMembers";
import {
  Alert,
  Anchor,
  Badge,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useSearchParams } from "react-router-dom";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function MembersPage() {
  const [searchParams] = useSearchParams();
  const filters: MemberFilters = {
    active: searchParams.get("active") ?? undefined,
    email: searchParams.get("email") ?? undefined,
    firstName: searchParams.get("firstName") ?? undefined,
    industryPref: searchParams.get("industryPref") ?? undefined,
    lastName: searchParams.get("lastName") ?? undefined,
    matchPref: searchParams.get("matchPref") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    rolePref: searchParams.get("rolePref") ?? undefined,
    topics: searchParams.get("topics") ?? undefined,
  };
  const { data: members, isError, isPending } = useMembers(filters);

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
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      }
    </Stack>
  );
}
