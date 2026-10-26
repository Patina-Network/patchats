import { server } from "@/lib/test/server";
import { notifications } from "@mantine/notifications";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

// --- MSW lifecycle: mock the network for every test ---
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mantine's notification store is global and shows at most 5 at once, so
// clear it or one test's leftovers queue up the next test's notifications.
afterEach(() => notifications.clean());

// --- Browser APIs jsdom lacks but Mantine needs ---
vi.stubGlobal("matchMedia", (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);
