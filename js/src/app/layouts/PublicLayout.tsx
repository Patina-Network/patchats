import { PublicNavbar } from "@/app/layouts/PublicNavbar";
import { AppShell } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Outlet } from "react-router-dom";

export function PublicLayout() {
  const isDesktop = useMediaQuery("(min-width: 36em)");

  return (
    <AppShell header={{ height: isDesktop ? 110 : 116 }} padding={0}>
      <AppShell.Header
        style={{ backgroundColor: "transparent", border: "none" }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "calc(var(--app-shell-header-offset, 0rem) * 1.5)",
            zIndex: -1,
            background:
              "linear-gradient(to bottom, var(--mantine-color-body) 60%, transparent)",
            pointerEvents: "none",
          }}
        />
        <PublicNavbar />
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
