import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export default function AdminPage() {
  return (
    <Stack py="xl" mx="xl">
      <Title order={2}>Admin home</Title>
      <Text>Manage PatChats administrative workflows from here.</Text>
      <Button component={Link} to="/admin/members" w="fit-content">
        Members
      </Button>
    </Stack>
  );
}
