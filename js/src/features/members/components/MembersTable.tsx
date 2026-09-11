import {
  Member,
  useMembers,
  MemberFilters,
} from "@/features/members/api/useMembers";
import { useUpdateMemberStatus } from "@/features/members/api/useUpdateMemberStatus";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Link } from "react-router-dom";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export const MembersTable = ({
  members,
  filters,
}: {
  members: Member[];
  filters: MemberFilters;
}) => {
  const { isError, isPending } = useMembers(filters);
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

  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
    variables: statusUpdateVariables,
  } = useUpdateMemberStatus();

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
};
