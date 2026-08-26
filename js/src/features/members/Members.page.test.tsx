import { MembersPage } from "@/features/members/Members.page";
import {
  fireEvent,
  renderWithProviders,
  screen,
  within,
} from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";

test("renders every member returned by the API", async () => {
  renderWithProviders(<MembersPage />);

  expect(await screen.findByText("Alex Morgan")).toBeInTheDocument();
  expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
  expect(screen.getByText("2 members")).toBeInTheDocument();
  const membersTable = screen.getByRole("table");
  expect(within(membersTable).getByText("Active")).toBeInTheDocument();
  expect(within(membersTable).getByText("Inactive")).toBeInTheDocument();
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

test("applies form filters as API request parameters", async () => {
  const user = userEvent.setup();
  const requestedUrls: URL[] = [];
  server.use(
    http.get("/api/members", ({ request }) => {
      requestedUrls.push(new URL(request.url));
      return HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [],
        success: true,
      });
    }),
  );

  renderWithProviders(<MembersPage />, { route: "/admin/members" });

  expect(await screen.findByText("No members found.")).toBeInTheDocument();

  await user.type(screen.getByLabelText("First name"), "  Alex  ");
  await user.type(screen.getByLabelText("Last name"), "Morgan");
  await user.type(screen.getByLabelText("Email"), "alex@example.com");
  await user.click(screen.getByPlaceholderText("Any status"));
  fireEvent.click(screen.getByRole("option", { hidden: true, name: "Active" }));
  await user.type(screen.getByLabelText("Match preference"), "Peer");
  await user.type(screen.getByLabelText("Industry"), "Technology");
  await user.type(screen.getByLabelText("Role"), "Engineering");
  await user.type(screen.getByLabelText("Topics"), "Community building");
  await user.click(screen.getByRole("button", { name: "Apply filters" }));

  await waitFor(() => expect(requestedUrls).toHaveLength(2));
  const requestedUrl = requestedUrls[1];
  expect(requestedUrl.searchParams.get("firstName")).toBe("Alex");
  expect(requestedUrl.searchParams.get("lastName")).toBe("Morgan");
  expect(requestedUrl.searchParams.get("email")).toBe("alex@example.com");
  expect(requestedUrl.searchParams.get("active")).toBe("true");
  expect(requestedUrl.searchParams.get("matchPref")).toBe("Peer");
  expect(requestedUrl.searchParams.get("industryPref")).toBe("Technology");
  expect(requestedUrl.searchParams.get("rolePref")).toBe("Engineering");
  expect(requestedUrl.searchParams.get("topics")).toBe("Community building");
});

test("allows status to be deselected and clears it with the other filters", async () => {
  const user = userEvent.setup();
  const requestedUrls: URL[] = [];
  server.use(
    http.get("/api/members", ({ request }) => {
      requestedUrls.push(new URL(request.url));
      return HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [],
        success: true,
      });
    }),
  );

  renderWithProviders(<MembersPage />);

  expect(await screen.findByText("No members found.")).toBeInTheDocument();
  const statusInput = screen.getByRole("textbox", { name: "Status" });
  await user.click(statusInput);
  fireEvent.click(screen.getByRole("option", { hidden: true, name: "Active" }));
  expect(statusInput).toHaveValue("Active");

  await user.click(screen.getByRole("button", { name: "Clear status" }));
  expect(statusInput).toHaveValue("");
  await user.type(screen.getByLabelText("First name"), "Alex");
  await user.click(screen.getByRole("button", { name: "Apply filters" }));

  await waitFor(() => expect(requestedUrls).toHaveLength(2));
  expect(requestedUrls[1].searchParams.get("firstName")).toBe("Alex");
  expect(requestedUrls[1].searchParams.has("active")).toBe(false);

  const renderedStatusInput = await screen.findByRole("textbox", {
    name: "Status",
  });
  await user.click(renderedStatusInput);
  fireEvent.click(
    screen.getByRole("option", { hidden: true, name: "Inactive" }),
  );
  await user.click(screen.getByRole("button", { name: "Clear filters" }));

  expect(renderedStatusInput).toHaveValue("");
  expect(screen.getByLabelText("First name")).toHaveValue("");
});
