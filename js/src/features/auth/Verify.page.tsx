import { useVerifyMagicLink } from "@/features/auth/api/useVerifyMagicLink";
import { Alert, Button, Center, Loader, Stack, Text } from "@mantine/core";
import { Link, Navigate, useSearchParams } from "react-router-dom";

/**
 * Landing page for the emailed link (`/auth/verify?token=...`). The link is a
 * plain GET so email scanners can prefetch it harmlessly; the actual
 * single-use consumption happens here via POST when the page mounts.
 */
export default function VerifyPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const verify = useVerifyMagicLink(token);

  if (verify.isSuccess) {
    return <Navigate replace to="/" />;
  }

  if (!token || verify.isError) {
    return (
      <Stack gap="md">
        <Alert color="red" title="Sign-in link problem">
          {verify.error?.message ??
            "This sign-in link is invalid or has expired. Request a new one."}
        </Alert>
        <Button component={Link} to="/login" w="fit-content">
          Request a new link
        </Button>
      </Stack>
    );
  }

  return (
    <Center h="50vh">
      <Stack align="center" gap="sm">
        <Loader />
        <Text c="dimmed">Signing you in…</Text>
      </Stack>
    </Center>
  );
}
