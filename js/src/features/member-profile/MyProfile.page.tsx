import { useSession } from "@/features/auth/api/useSession";
import { useMemberProfile } from "@/features/member-profile/api/useMemberProfile";
import { MemberProfileForm } from "@/features/member-profile/components/MemberProfileForm";
import { ProfileWalkthrough } from "@/features/member-profile/components/ProfileWalkthrough";
import { MemberProfile } from "@/features/member-profile/types";
import { Alert, Center, Loader } from "@mantine/core";
import { useState } from "react";

export function MyProfilePage() {
  const { data: session } = useSession();
  const id = session?.id;

  if (!id) return <Alert color="red">No member ID provided.</Alert>;

  return <MyProfile id={id} />;
}

function MyProfile({ id }: { id: string }) {
  const { data: member, isLoading, isError } = useMemberProfile(id);

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !member) {
    return <Alert color="red">Failed to load profile.</Alert>;
  }

  return <WalkthroughOrProfile member={member} />;
}

/** Shows the walkthrough first if profile setup isn't done (checked once). */
function WalkthroughOrProfile({ member }: { member: MemberProfile }) {
  const [inWalkthrough, setInWalkthrough] = useState(
    () => !member.profileSetupDone,
  );

  if (inWalkthrough) {
    return (
      <ProfileWalkthrough
        member={member}
        onDone={() => setInWalkthrough(false)}
      />
    );
  }

  return (
    <MemberProfileForm id={member.id} title="My Profile" showActivationToggle />
  );
}
