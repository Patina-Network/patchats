import { AppShell, Badge, Group, Text } from "@mantine/core";
import { Outlet } from "react-router-dom";

/** Chrome for admin pages: the authed header plus an admin marker. */
export function AdminLayout() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Text fw={700}>PatChats</Text>
          <Badge color="red">Admin</Badge>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
