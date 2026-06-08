import { Stack, Text, Title } from "@mantine/core";

/**
 * Sample admin-only page. Lives in the same feature as Sample.page to show that
 * one domain can span permission levels — access is decided in the router, not
 * the folder.
 */
export default function SampleAdminPage() {
  return (
    <Stack>
      <Title order={2}>Sample admin page</Title>
      <Text>Only admins can see this.</Text>
    </Stack>
  );
}
