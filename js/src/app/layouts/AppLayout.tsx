import { useLogout } from "@/features/auth/api/useLogout";
import { AppShell, Button, Group, Text } from "@mantine/core";
import { Outlet } from "react-router-dom";

/** Chrome for authenticated pages: a header plus the routed page content. */
export function AppLayout() {
  const logout = useLogout();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Text fw={700}>PatChats</Text>
          <Button
            variant="subtle"
            size="compact-sm"
            loading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Log out
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
