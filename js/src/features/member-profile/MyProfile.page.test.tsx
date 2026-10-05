import { memberSession, sessionResponse } from "@/features/auth/api/auth.mock";
import {
  memberProfile,
  memberProfileResponse,
} from "@/features/member-profile/api/member-profile.mock";
import { MyProfilePage } from "@/features/member-profile/MyProfile.page";
import { MemberProfile } from "@/features/member-profile/types";
import {
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "@/lib/test/render";
import { server } from "@/lib/test/server";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, test } from "vitest";

const REASON_LABEL = "Why do you want to opt out of PatChats? (optional)";

beforeEach(() => {
  server.use(http.get("/api/session", () => sessionResponse(memberSession)));
});

function respondWithProfile(overrides: Partial<MemberProfile>) {
  server.use(
    http.get("/api/members/:id", () =>
      memberProfileResponse({ ...memberProfile, ...overrides }),
    ),
  );
}

/** Records every body sent to the self-service status endpoint. */
function captureStatusRequests() {
  const bodies: unknown[] = [];
  server.use(
    http.patch("/api/members/me/status", async ({ request }) => {
      const body = (await request.json()) as { active: boolean };
      bodies.push(body);
      return HttpResponse.json({
        success: true,
        message: "ok",
        payload: { ...memberProfile, active: body.active },
      });
    }),
  );
  return bodies;
}

test("offers an active member the option to deactivate their own profile", async () => {
  renderWithProviders(<MyProfilePage />);

  expect(
    await screen.findByRole("button", { name: "Deactivate" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Reactivate" }),
  ).not.toBeInTheDocument();
});

test("deactivating asks for an optional reason in a confirm modal", async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Deactivate" }));

  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Deactivate member")).toBeInTheDocument();
  expect(within(dialog).getByLabelText(REASON_LABEL)).toBeInTheDocument();
});

test("confirming deactivation sends the typed reason and flips the button to reactivate", async () => {
  const user = userEvent.setup();
  const bodies = captureStatusRequests();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Deactivate" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText(REASON_LABEL), "Moving abroad");
  await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

  await waitFor(() =>
    expect(bodies).toEqual([
      { active: false, deactivationReason: "Moving abroad" },
    ]),
  );
  expect(
    await screen.findByRole("button", { name: "Reactivate" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("Your profile is now inactive."),
  ).toBeInTheDocument();
});

test("deactivating without typing a reason sends no reason at all", async () => {
  const user = userEvent.setup();
  const bodies = captureStatusRequests();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Deactivate" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

  await waitFor(() => expect(bodies).toEqual([{ active: false }]));
});

test("reactivating skips the reason prompt, sends only the status, and flips the button back", async () => {
  const user = userEvent.setup();
  const bodies = captureStatusRequests();
  respondWithProfile({ active: false, deactivationReason: "Moving abroad" });
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Reactivate" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Reactivate member")).toBeInTheDocument();
  expect(within(dialog).queryByLabelText(REASON_LABEL)).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Reactivate" }));

  await waitFor(() => expect(bodies).toEqual([{ active: true }]));
  expect(
    await screen.findByRole("button", { name: "Deactivate" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("Your profile is now active."),
  ).toBeInTheDocument();
});

test("cancelling the confirm modal makes no request", async () => {
  const user = userEvent.setup();
  const bodies = captureStatusRequests();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Deactivate" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(bodies).toHaveLength(0);
});

test("a failed update shows an error and leaves the profile active", async () => {
  const user = userEvent.setup();
  server.use(
    http.patch("/api/members/me/status", () =>
      HttpResponse.json({ success: false, message: "boom" }, { status: 500 }),
    ),
  );
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Deactivate" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

  expect(await screen.findByText("Update failed")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Reactivate" }),
  ).not.toBeInTheDocument();
});
