import { useUpdateMemberStatus } from "@/features/member-profile/api/useUpdateMemberStatus";
import { MemberProfile } from "@/features/member-profile/types";
import { Button, Stack, Text, Textarea } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useRef } from "react";

export const MembersActivationToggle = ({
  member,
}: {
  member: MemberProfile;
}) => {
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateMemberStatus(member.id);

  const deactivationReasonRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleStatus = (member: MemberProfile) => {
    const nextActive = !member.active;
    modals.openConfirmModal({
      title: nextActive ? "Reactivate member" : "Deactivate member",
      children: (
        <Stack>
          <Text size="sm">
            {nextActive ?
              `Reactivate your profile? You will be included in the next matching cycle.`
            : `Deactivate your profile? You won't be included in the next matching cycle until reactivated.`
            }
          </Text>
          {!nextActive && (
            <Textarea
              ref={deactivationReasonRef}
              label="Why do you want to opt out of PatChats? (optional)"
            />
          )}
        </Stack>
      ),
      labels: {
        confirm: nextActive ? "Reactivate" : "Deactivate",
        cancel: "Cancel",
      },
      confirmProps: { color: nextActive ? "green" : "red" },
      onConfirm: () => {
        updateStatus(
          {
            active: nextActive,
            deactivationReason:
              nextActive ? undefined : (
                deactivationReasonRef.current?.value || undefined
              ),
          },
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
                message: `Your profile is now ${nextActive ? "active" : "inactive"}.`,
                title: nextActive ? "Member reactivated" : "Member deactivated",
              }),
          },
        );
      },
    });
  };

  return (
    <Stack>
      <Button
        color={member.active ? "red" : "green"}
        loading={isUpdatingStatus}
        onClick={() => handleToggleStatus(member)}
        size="xs"
        variant="light"
      >
        {member.active ? "Deactivate" : "Reactivate"}
      </Button>
    </Stack>
  );
};
