import { useSession } from "@/features/auth/api/useSession";
import { useAddAdmin } from "@/features/members/api/useAddAdmin";
import { Admin } from "@/features/members/api/useAdmins";
import { Member } from "@/features/members/api/useMembers";
import { useRemoveAdmin } from "@/features/members/api/useRemoveAdmin";
import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

export function AdminToggle({
  member,
  admins,
}: {
  member: Member;
  admins: Admin[];
}) {
  const { data: session } = useSession();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();

  const isAdmin = admins.some((a) => a.email === member.email);
  const isLastAdmin = isAdmin && admins.length === 1;
  const isSelf = session?.email === member.email;

  const handleToggle = () => {
    if (isAdmin) {
      modals.openConfirmModal({
        title: "Revoke admin",
        children:
          isSelf ?
            "You are revoking your own admin access. You will lose access to the admin panel at next login."
          : `Revoke admin access for ${member.firstName} ${member.lastName}? Takes effect at their next login.`,
        labels: { confirm: "Revoke", cancel: "Cancel" },
        confirmProps: { color: "red" },
        onConfirm: () =>
          removeAdmin.mutate(member.email, {
            onError: () =>
              notifications.show({
                color: "red",
                message: `Could not revoke admin for ${member.firstName} ${member.lastName}.`,
                title: "Revoke failed",
              }),
            onSuccess: () =>
              notifications.show({
                color: "green",
                message: `${member.firstName} ${member.lastName} is no longer an admin.`,
                title: "Admin revoked",
              }),
          }),
      });
    } else {
      modals.openConfirmModal({
        title: "Grant admin",
        children: `Grant admin access to ${member.firstName} ${member.lastName}? Takes effect at their next login.`,
        labels: { confirm: "Grant", cancel: "Cancel" },
        confirmProps: { color: "green" },
        onConfirm: () =>
          addAdmin.mutate(
            { email: member.email },
            {
              onError: () =>
                notifications.show({
                  color: "red",
                  message: `Could not grant admin to ${member.firstName} ${member.lastName}.`,
                  title: "Grant failed",
                }),
              onSuccess: () =>
                notifications.show({
                  color: "green",
                  message: `${member.firstName} ${member.lastName} is now an admin.`,
                  title: "Admin granted",
                }),
            },
          ),
      });
    }
  };

  return (
    <Button
      color={isAdmin ? "red" : "green"}
      disabled={isLastAdmin}
      loading={
        isAdmin ?
          removeAdmin.isPending && removeAdmin.variables === member.email
        : addAdmin.isPending && addAdmin.variables?.email === member.email
      }
      onClick={handleToggle}
      size="xs"
      variant="light"
    >
      {isAdmin ? "Revoke" : "Grant"}
    </Button>
  );
}
