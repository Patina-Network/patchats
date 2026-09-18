import { Member } from "@/features/members/api/useMembers";
import { useUpdateMemberStatus } from "@/features/members/api/useUpdateMemberStatus";
import {
  confirmActivationToggle,
  notifyActivationToggleSuccess,
} from "@/lib/components/activation-toggle/activationToggle";
import { ActivationToggleButton } from "@/lib/components/activation-toggle/ActivationToggleButton";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const AdminActivationToggle = ({ member }: { member: Member }) => {
  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
    variables: statusUpdateVariables,
  } = useUpdateMemberStatus();

  const handleToggleStatus = () => {
    const nextActive = !member.active;
    confirmActivationToggle({
      nextActive,
      body: (
        <Text size="sm">
          {nextActive ?
            `Reactivate ${member.firstName} ${member.lastName}? They will be included in the next matching cycle again.`
          : `Deactivate ${member.firstName} ${member.lastName}? They won't be included in the next matching cycle until reactivated.`
          }
        </Text>
      ),
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
              notifyActivationToggleSuccess(
                nextActive,
                `${member.firstName} ${member.lastName} is now ${nextActive ? "active" : "inactive"}.`,
              ),
          },
        ),
    });
  };

  return (
    <ActivationToggleButton
      active={member.active}
      loading={isUpdatingStatus && statusUpdateVariables?.id === member.id}
      onClick={handleToggleStatus}
    />
  );
};
