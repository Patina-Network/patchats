import MembersPage from "@/features/members/Members.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";

test("renders every member returned by the API", async () => {
  renderWithProviders(<MembersPage />);

  expect(await screen.findByText("Alex Morgan")).toBeInTheDocument();
  expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
  expect(screen.getByText("2 members")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("Inactive")).toBeInTheDocument();
});

test("renders an empty state when there are no members", async () => {
  server.use(
    http.get("/api/members", () =>
      HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [],
        success: true,
      }),
    ),
  );

  renderWithProviders(<MembersPage />);

  expect(await screen.findByText("No members found.")).toBeInTheDocument();
  expect(screen.getByText("0 members")).toBeInTheDocument();
});
