import { MemberProfileForm } from "@/features/member-profile/components/MemberProfileForm";
import { Stack, Title, Alert } from "@mantine/core";
import { useParams } from "react-router-dom";

export function MemberProfilePage() {
  const { id } = useParams();
  if (!id) return <Alert color="red">No member ID provided.</Alert>;

  return (
    <Stack gap="xl">
      <Title order={2}>Member Profile</Title>
      <MemberProfileForm id={id} />
    </Stack>
  );
}
