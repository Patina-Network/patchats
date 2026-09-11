import { useSession } from "@/features/auth/api/useSession";
import { MemberProfileForm } from "@/features/member-profile/components/MemberProfileForm";
import { Stack, Title, Alert } from "@mantine/core";

export function MyProfilePage() {
  const { data: session } = useSession();
  const id = session?.id;

  if (!id) return <Alert color="red">No member ID provided.</Alert>;

  return (
    <Stack gap="xl">
      <Title order={2}>My Profile</Title>
      <MemberProfileForm id={id} showActivationToggle={true} />
    </Stack>
  );
}
