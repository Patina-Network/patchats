import { useUpdateMemberStatus } from "@/features/member-profile/api/useUpdateMemberStatus";
import { MemberProfile } from "@/features/member-profile/types";
import {
  confirmActivationToggle,
  notifyActivationToggleSuccess,
} from "@/lib/components/activation-toggle/activationToggle";
import { ActivationToggleButton } from "@/lib/components/activation-toggle/ActivationToggleButton";
import { Stack, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRef } from "react";

export const SelfActivationToggle = ({ member }: { member: MemberProfile }) => {
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateMemberStatus(member.id);

  const deactivationReasonRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleStatus = () => {
    const nextActive = !member.active;
    confirmActivationToggle({
      nextActive,
      body: (
        <Stack>
          <Text size="sm">
            {nextActive ?
              `Reactivate your profile? You will be included in the next matching cycle.`
            : <>
                <Text size="sm">
                  Deactivate your profile? You won't be included in the next
                  matching cycle until reactivated.
                </Text>
                <br />
                <Text size="sm">
                  You may still log in and edit your profile.
                </Text>
              </>
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
      onConfirm: () =>
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
                message: `Could not update your status.`,
                title: "Update failed",
              }),
            onSuccess: () =>
              notifyActivationToggleSuccess(
                nextActive,
                `Your profile is now ${nextActive ? "active" : "inactive"}.`,
              ),
          },
        ),
    });
  };

  return (
    <ActivationToggleButton
      active={member.active}
      loading={isUpdatingStatus}
      onClick={handleToggleStatus}
    />
  );
};
