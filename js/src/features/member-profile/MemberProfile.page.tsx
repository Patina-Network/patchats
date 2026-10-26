import { MemberProfileForm } from "@/features/member-profile/components/MemberProfileForm";
import { Alert } from "@mantine/core";
import { useParams } from "react-router-dom";

export function MemberProfilePage() {
  const { id } = useParams();
  if (!id) return <Alert color="red">No member ID provided.</Alert>;

  return <MemberProfileForm id={id} title="Member Profile" />;
}
