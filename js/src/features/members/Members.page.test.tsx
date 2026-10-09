import { MembersPage } from "@/features/members/Members.page";
import {
  fireEvent,
  renderWithProviders,
  screen,
  within,
} from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { notifications } from "@mantine/notifications";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, test } from "vitest";

beforeEach(() => notifications.clean());

test("confirms a member was added and refreshes the members table", async () => {
  const user = userEvent.setup();
  let createdMember: Record<string, unknown> | null = null;
  server.use(
    http.get("/api/members", () =>
      HttpResponse.json({
        success: true,
        message: "Members retrieved successfully",
        payload: createdMember ? [createdMember] : [],
      }),
    ),
    http.post("/api/members", async ({ request }) => {
      createdMember = {
        ...((await request.json()) as Record<string, unknown>),
        id: "new-member",
        active: true,
        createdAt: "2026-09-15T12:00:00Z",
        updatedAt: "2026-09-15T12:00:00Z",
      };
      return HttpResponse.json({
        success: true,
        message: "Member created successfully",
        payload: createdMember,
      });
    }),
  );

  renderWithProviders(<MembersPage />);
  await user.click(screen.getByRole("button", { name: "Add members" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(
    within(dialog).getByLabelText("First name", { exact: false }),
    {
      target: { value: "Taylor" },
    },
  );
  fireEvent.change(
    within(dialog).getByLabelText("Last name", { exact: false }),
    {
      target: { value: "Quinn" },
    },
  );
  fireEvent.change(within(dialog).getByLabelText("Email", { exact: false }), {
    target: { value: "taylor@example.com" },
  });
  fireEvent.change(
    within(dialog).getByLabelText("Introduction", { exact: false }),
    {
      target: { value: "I enjoy meeting new people." },
    },
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Confirm member" }),
  );

  expect(
    await screen.findByText("taylor@example.com was added successfully."),
  ).toBeInTheDocument();
  expect(await screen.findByText("Taylor Quinn")).toBeInTheDocument();
});

test.each([
  {
    status: 409,
    message: "Member with email taylor@example.com already exists",
    expected: "The email taylor@example.com already exists.",
  },
  {
    status: 400,
    message: "introduction must not be blank",
    expected: "introduction must not be blank",
  },
  {
    status: 500,
    message: "Internal database error",
    expected: "An unknown error occurred.",
  },
  { status: 0, message: "", expected: "An unknown error occurred." },
])(
  "shows submission feedback for a $status error",
  async ({ status, message, expected }) => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/members", () =>
        status === 0 ?
          HttpResponse.error()
        : HttpResponse.json(
            { success: false, message, payload: null },
            { status },
          ),
      ),
    );

    renderWithProviders(<MembersPage />);
    await user.click(screen.getByRole("button", { name: "Add members" }));
    const dialog = await screen.findByRole("dialog");
    for (const [label, value] of [
      ["First name", "Taylor"],
      ["Last name", "Quinn"],
      ["Email", "taylor@example.com"],
      ["Introduction", "I enjoy meeting new people."],
    ]) {
      fireEvent.change(within(dialog).getByLabelText(label, { exact: false }), {
        target: { value },
      });
    }
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm member" }),
    );

    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(
      screen.queryByText("taylor@example.com was added successfully."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Internal database error"),
    ).not.toBeInTheDocument();
  },
);

test.each([true, false])(
  "summarizes CSV successes with duplicate email: %s",
  async (hasDuplicate) => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/members", async ({ request }) => {
        const member = (await request.json()) as Record<string, unknown>;
        return hasDuplicate && member.email === "existing@example.com" ?
            HttpResponse.json(
              {
                success: false,
                message: "Email already exists",
                payload: null,
              },
              { status: 409 },
            )
          : HttpResponse.json({
              success: true,
              message: "Member created successfully",
              payload: member,
            });
      }),
    );

    renderWithProviders(<MembersPage />);
    await user.click(screen.getByRole("button", { name: "Add members" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: "Upload CSV" }));
    const fileInput = dialog.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement))
      throw new Error("Missing CSV input");
    const file = new File([""], "members.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      value: async () =>
        "firstName,lastName,email,introduction\nTaylor,Quinn,new@example.com,Hello\nAlex,Morgan,existing@example.com,Hello",
    });
    await user.upload(fileInput, file);
    const confirm = within(dialog).getByRole("button", {
      name: "Confirm import",
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(
      await screen.findByText(
        hasDuplicate ?
          "1 member was added successfully."
        : "2 members were added successfully.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("new@example.com was added successfully."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("existing@example.com was added successfully."),
    ).not.toBeInTheDocument();
    if (hasDuplicate) {
      expect(
        await screen.findByText(
          "The email existing@example.com already exists.",
        ),
      ).toBeInTheDocument();
    } else {
      expect(
        screen.queryByText("The email existing@example.com already exists."),
      ).not.toBeInTheDocument();
    }
  },
);

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
