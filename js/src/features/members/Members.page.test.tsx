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

test("opens a confirm modal naming the member before deactivating", async () => {
  const user = userEvent.setup();
  renderWithProviders(<MembersPage />);

  const membersTable = await screen.findByRole("table");
  const alexRow = within(membersTable).getByText("Alex Morgan").closest("tr");
  expect(alexRow).not.toBeNull();
  await user.click(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    within(alexRow!).getByRole("button", { name: "Deactivate" }),
  );

  expect(await screen.findByText("Deactivate member")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Deactivate Alex Morgan? They won't be included in the next matching cycle until reactivated.",
    ),
  ).toBeInTheDocument();
});

test("confirming deactivation calls the status endpoint and updates the row", async () => {
  const user = userEvent.setup();
  const requestedBodies: unknown[] = [];
  // Mirrors what a real backend would do: once the status endpoint is called,
  // the list endpoint's response reflects the change on refetch.
  let alexActive = true;
  server.use(
    http.get("/api/members", () =>
      HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [
          {
            active: alexActive,
            createdAt: "2026-01-15T14:30:00Z",
            email: "alex@example.com",
            extraNotes: null,
            firstName: "Alex",
            id: "50ecf8a0-6345-40f8-b59f-438c3f338b82",
            industryPref: "Technology",
            introduction: "I build community-focused software.",
            lastName: "Morgan",
            linkedInUrl: "https://www.linkedin.com/in/alex-morgan",
            matchPref: "Peer",
            referralSource: "Patina Network",
            rolePref: "Engineering",
            topics: "Community, Technology",
            updatedAt: "2026-01-15T14:30:00Z",
          },
        ],
        success: true,
      }),
    ),
    http.patch("/api/members/:id/status", async ({ request }) => {
      requestedBodies.push(await request.json());
      alexActive = false;
      return HttpResponse.json({
        message: "Member deactivated successfully",
        payload: {
          active: false,
          createdAt: "2026-01-15T14:30:00Z",
          email: "alex@example.com",
          extraNotes: null,
          firstName: "Alex",
          id: "50ecf8a0-6345-40f8-b59f-438c3f338b82",
          industryPref: "Technology",
          introduction: "I build community-focused software.",
          lastName: "Morgan",
          linkedInUrl: "https://www.linkedin.com/in/alex-morgan",
          matchPref: "Peer",
          referralSource: "Patina Network",
          rolePref: "Engineering",
          topics: "Community, Technology",
          updatedAt: "2026-01-15T14:30:00Z",
        },
        success: true,
      });
    }),
  );

  renderWithProviders(<MembersPage />);

  const membersTable = await screen.findByRole("table");
  const alexRow = within(membersTable).getByText("Alex Morgan").closest("tr");
  expect(alexRow).not.toBeNull();
  await user.click(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    within(alexRow!).getByRole("button", { name: "Deactivate" }),
  );

  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

  await waitFor(() => expect(requestedBodies).toEqual([{ active: false }]));
  await waitFor(() => {
    const updatedAlexRow = within(screen.getByRole("table"))
      .getByText("Alex Morgan")
      .closest("tr");
    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      within(updatedAlexRow!).getByRole("button", { name: "Reactivate" }),
    ).toBeInTheDocument();
  });
});

test("confirming reactivation calls the status endpoint and updates the row", async () => {
  const user = userEvent.setup();
  const requestedBodies: unknown[] = [];
  // Jordan Lee starts inactive in the base mock; mirror test 6's pattern of
  // reflecting the mutation's effect on the next list refetch.
  let jordanActive = false;
  server.use(
    http.get("/api/members", () =>
      HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [
          {
            active: jordanActive,
            createdAt: "2025-12-10T09:00:00Z",
            email: "jordan@example.com",
            extraNotes: "Prefers virtual chats.",
            firstName: "Jordan",
            id: "db827ce4-5ed1-4649-98ca-3e5fb538d22e",
            industryPref: "Design",
            introduction: "I am a product designer.",
            lastName: "Lee",
            linkedInUrl: null,
            matchPref: "Mentor",
            referralSource: null,
            rolePref: "Product design",
            topics: "Design systems",
            updatedAt: "2026-02-01T11:00:00Z",
          },
        ],
        success: true,
      }),
    ),
    http.patch("/api/members/:id/status", async ({ request }) => {
      requestedBodies.push(await request.json());
      jordanActive = true;
      return HttpResponse.json({
        message: "Member reactivated successfully",
        payload: {
          active: true,
          createdAt: "2025-12-10T09:00:00Z",
          email: "jordan@example.com",
          extraNotes: "Prefers virtual chats.",
          firstName: "Jordan",
          id: "db827ce4-5ed1-4649-98ca-3e5fb538d22e",
          industryPref: "Design",
          introduction: "I am a product designer.",
          lastName: "Lee",
          linkedInUrl: null,
          matchPref: "Mentor",
          referralSource: null,
          rolePref: "Product design",
          topics: "Design systems",
          updatedAt: "2026-02-01T11:00:00Z",
        },
        success: true,
      });
    }),
  );

  renderWithProviders(<MembersPage />);

  const membersTable = await screen.findByRole("table");
  const jordanRow = within(membersTable).getByText("Jordan Lee").closest("tr");
  expect(jordanRow).not.toBeNull();
  await user.click(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    within(jordanRow!).getByRole("button", { name: "Reactivate" }),
  );

  expect(await screen.findByText("Reactivate member")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Reactivate Jordan Lee? They will be included in the next matching cycle again.",
    ),
  ).toBeInTheDocument();

  const dialog = screen.getByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Reactivate" }));

  await waitFor(() => expect(requestedBodies).toEqual([{ active: true }]));
  await waitFor(() => {
    const updatedJordanRow = within(screen.getByRole("table"))
      .getByText("Jordan Lee")
      .closest("tr");
    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      within(updatedJordanRow!).getByRole("button", { name: "Deactivate" }),
    ).toBeInTheDocument();
  });
});

test("cancelling the confirm modal makes no request", async () => {
  const user = userEvent.setup();
  const requestedBodies: unknown[] = [];
  server.use(
    http.patch("/api/members/:id/status", async ({ request }) => {
      requestedBodies.push(await request.json());
      return HttpResponse.json({
        message: "Member deactivated successfully",
        payload: {},
        success: true,
      });
    }),
  );

  renderWithProviders(<MembersPage />);

  const membersTable = await screen.findByRole("table");
  const alexRow = within(membersTable).getByText("Alex Morgan").closest("tr");
  expect(alexRow).not.toBeNull();
  await user.click(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    within(alexRow!).getByRole("button", { name: "Deactivate" }),
  );

  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  await waitFor(() =>
    expect(screen.queryByText("Deactivate member")).not.toBeInTheDocument(),
  );
  expect(requestedBodies).toHaveLength(0);
});
