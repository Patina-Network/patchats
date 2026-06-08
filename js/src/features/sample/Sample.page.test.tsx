import SamplePage from "@/features/sample/Sample.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { expect, test } from "vitest";

test("renders the message returned by the API", async () => {
  renderWithProviders(<SamplePage />);

  expect(await screen.findByText("Hello from MSW")).toBeInTheDocument();
});
