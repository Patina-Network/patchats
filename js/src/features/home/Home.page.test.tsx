import HomePage from "@/features/home/Home.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { expect, test } from "vitest";

test("renders the landing page intro copy and list", () => {
  renderWithProviders(<HomePage />);

  expect(
    screen.getByText(/PatChats is a program where every month/i),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
