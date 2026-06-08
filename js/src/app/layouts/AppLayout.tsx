import { AppShell, Group, Text } from "@mantine/core";
import { Outlet } from "react-router-dom";

/** Chrome for authenticated pages: a header plus the routed page content. */
export function AppLayout() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Text fw={700}>PatChats</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
