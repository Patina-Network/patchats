import { PublicNavbar } from "@/app/layouts/PublicNavbar";
import { AppShell } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Outlet } from "react-router-dom";

/** Chrome for public (unauthenticated) pages, e.g. landing and login. */
export function PublicLayout() {
  // Matches the `xs` breakpoint (36em) used by the navbar's responsive props.
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
            inset: 0,
            zIndex: -1,
            background:
              "linear-gradient(to bottom, var(--mantine-color-body) calc(var(--app-shell-header-offset, 0rem) * 0.2), transparent var(--app-shell-header-offset, 0rem))",
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
