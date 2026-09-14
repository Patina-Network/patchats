import { Member } from "@/features/members/api/useMembers";
import { useUpdateMemberStatus } from "@/features/members/api/useUpdateMemberStatus";
import { Button, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

export const MembersActivationToggle = ({ member }: { member: Member }) => {
  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
    variables: statusUpdateVariables,
  } = useUpdateMemberStatus();

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

  return (
    <Stack>
      <Button
        color={member.active ? "red" : "green"}
        loading={isUpdatingStatus && statusUpdateVariables?.id === member.id}
        onClick={() => handleToggleStatus(member)}
        size="xs"
        variant="light"
      >
        {member.active ? "Deactivate" : "Reactivate"}
      </Button>
    </Stack>
  );
};
