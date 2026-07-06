import { themeOverride } from "@/app/providers/theme";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode, StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";

/**
 * A fresh QueryClient per render so tests never share cache. Retries are off so
 * failed requests surface immediately instead of hanging the test.
 */
function createWrapper(initialEntries?: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // StrictMode mirrors main.tsx: double-invoked effects surface bugs (e.g.
  // observers detached from in-flight requests) that a bare render hides.
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={themeOverride} forceColorScheme="dark">
            <MemoryRouter initialEntries={initialEntries}>
              {children}
            </MemoryRouter>
          </MantineProvider>
        </QueryClientProvider>
      </StrictMode>
    );
  };
}

/**
 * Render a component wrapped in the app's providers (Query, Mantine, Router).
 * Pass `initialEntries` when the component reads the URL (params, search).
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { initialEntries?: string[] },
) {
  const { initialEntries, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper(initialEntries),
    ...renderOptions,
  });
}

// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
