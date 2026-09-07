import { PublicNavbar } from "@/app/layouts/PublicNavbar";
import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";

/** Chrome for public (unauthenticated) pages, e.g. landing and login. */
export function PublicLayout() {
  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <AppShell.Header
        style={{ backgroundColor: "transparent", border: "none" }}
      >
        <PublicNavbar />
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
