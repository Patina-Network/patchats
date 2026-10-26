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
      title:
        nextActive ? "Reactivate your profile?" : "Deactivate your profile?",
      body:
        nextActive ?
          <Text size="sm">
            You&apos;ll be included in the next matching cycle.
          </Text>
        : <Stack gap="md">
            <Text size="sm">
              You won&apos;t be matched until you reactivate. You can still log
              in and edit your profile.
            </Text>
            <Textarea
              ref={deactivationReasonRef}
              label="Why are you deactivating?"
              description="Optional. It helps us improve PatChats."
              autosize
              minRows={2}
            />
          </Stack>,
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
      size="sm"
    />
  );
};
