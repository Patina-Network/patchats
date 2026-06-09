// THIS MUST BE FIRST. NEVER MOVE THIS.
import "@/patches";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@mantine/notifications/styles.css";
import { StrictMode } from "react";
import "@mantine/dates/styles.css";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import QueryProvider from "@/app/providers/QueryProvider";
import { themeOverride } from "@/app/providers/theme";
import { router } from "@/app/router/router";

// if (import.meta.env.VITE_MOCK === "true") {
//   const { launchMockServer } = await import("@/__mock__");
//   await launchMockServer();
// }

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <MantineProvider theme={themeOverride} forceColorScheme={"dark"}>
        <RouterProvider router={router} />
        <Notifications />
      </MantineProvider>
      <ReactQueryDevtools />
    </QueryProvider>
  </StrictMode>,
);
