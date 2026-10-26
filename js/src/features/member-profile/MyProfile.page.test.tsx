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

const REASON_LABEL = "Why are you deactivating?";

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
  expect(
    within(dialog).getByText("Deactivate your profile?"),
  ).toBeInTheDocument();
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
  expect(
    within(dialog).getByText("Reactivate your profile?"),
  ).toBeInTheDocument();
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

/** Records every body sent to the profile update endpoint. */
function captureProfileUpdates() {
  const bodies: unknown[] = [];
  server.use(
    http.patch("/api/members/:id", async ({ request }) => {
      const body = (await request.json()) as Partial<MemberProfile>;
      bodies.push(body);
      return memberProfileResponse({ ...memberProfile, ...body });
    }),
  );
  return bodies;
}

test("shows the profile as text, with empty answers marked as not set", async () => {
  renderWithProviders(<MyProfilePage />);

  expect(await screen.findByText("Ann Example")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "linkedin.com/in/ann-example" }),
  ).toHaveAttribute("href", "https://www.linkedin.com/in/ann-example");
  // The fixture leaves "Anything else" empty.
  expect(screen.getByText("Not set")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

test("only a real LinkedIn profile URL becomes a link", async () => {
  respondWithProfile({ linkedInUrl: "javascript:alert(1)" });
  renderWithProviders(<MyProfilePage />);

  expect(await screen.findByText("javascript:alert(1)")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /javascript/ }),
  ).not.toBeInTheDocument();
});

test("editing saves the trimmed changes and goes back to the profile", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Edit" }));
  const firstName = screen.getByLabelText(/first name/i);
  await user.clear(firstName);
  await user.type(firstName, " Annie ");
  await user.click(screen.getByRole("button", { name: "Save" }));

  // Only what a member can change is sent: no email or referral source.
  await waitFor(() =>
    expect(bodies).toEqual([
      {
        firstName: "Annie",
        lastName: "Example",
        linkedInUrl: "https://www.linkedin.com/in/ann-example",
        introduction: "Ann is a designer who loves mentoring.",
        matchPref: "Peer",
        industryPref: "Technology",
        rolePref: "Design",
        topics: "Community",
        extraNotes: "",
      },
    ]),
  );
  expect(await screen.findByText("Profile saved")).toBeInTheDocument();
  expect(await screen.findByText("Annie Example")).toBeInTheDocument();
});

const LINKEDIN = "What's your LinkedIn?";
const TOPICS = /would you like to talk about/i;

test("a member with no unanswered questions goes straight to their profile", async () => {
  renderWithProviders(<MyProfilePage />);

  expect(await screen.findByText("My Profile")).toBeInTheDocument();
  expect(screen.queryByText(/question 1 of/i)).not.toBeInTheDocument();
});

test("unanswered (NULL) questions get the onboarding page instead of the profile", async () => {
  respondWithProfile({ topics: null, linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  expect(await screen.findByText(/question 1 of 2/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: TOPICS })).toBeInTheDocument();
  expect(screen.getByLabelText(TOPICS)).toHaveFocus();
  expect(screen.queryByText("My Profile")).not.toBeInTheDocument();
  // Only brand-new members are greeted; this one has answered some already.
  expect(screen.queryByText(/welcome to patchats/i)).not.toBeInTheDocument();
});

/** A brand-new member: every optional field is still NULL. */
function respondWithNewMember() {
  respondWithProfile({
    linkedInUrl: null,
    matchPref: null,
    industryPref: null,
    rolePref: null,
    topics: null,
    extraNotes: null,
  });
}

test("a brand-new member is greeted, then asked the one-click questions first", async () => {
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  expect(
    await screen.findByText("Welcome to PatChats, Ann!"),
  ).toBeInTheDocument();
  expect(await screen.findByText(/question 1 of 4/i)).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /what kind of match/i }),
  ).toBeInTheDocument();
  // Only text questions take focus; a ringed option would look pre-selected.
  expect(screen.getByRole("radio", { name: /^mentor/i })).not.toHaveFocus();
});

test("skip for now skips every question for good", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Skip for now" }));

  await waitFor(() =>
    expect(bodies).toEqual([
      { matchPref: "", industryPref: "", topics: "", linkedInUrl: "" },
    ]),
  );
  expect(await screen.findByText("My Profile")).toBeInTheDocument();
});

test("continue saves just that answer, trimmed, and moves on", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ topics: null, linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  const topics = await screen.findByLabelText(TOPICS);
  expect(topics).toHaveAttribute("maxlength", "200");
  await user.type(topics, " Design systems ");
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await waitFor(() => expect(bodies).toEqual([{ topics: "Design systems" }]));
  expect(await screen.findByText(/question 2 of 2/i)).toBeInTheDocument();
});

test("a LinkedIn shorthand is saved as the full URL", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  await user.type(
    await screen.findByLabelText(LINKEDIN),
    "linkedin.com/in/ann",
  );
  await user.click(screen.getByRole("button", { name: "Finish" }));

  await waitFor(() =>
    expect(bodies).toEqual([{ linkedInUrl: "https://linkedin.com/in/ann" }]),
  );
});

test("picking a choice and continuing saves the full option", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ matchPref: null, topics: null });
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("radio", { name: /^peer/i }));
  expect(bodies).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await waitFor(() =>
    expect(bodies).toEqual([
      { matchPref: "Peer - I am looking for someone at a similar level" },
    ]),
  );
  expect(await screen.findByText(/question 2 of 2/i)).toBeInTheDocument();
});

test("an invalid answer shows the error and saves nothing", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  await user.type(await screen.findByLabelText(LINKEDIN), "not a url");
  await user.click(screen.getByRole("button", { name: "Finish" }));

  expect(
    await screen.findByText(/enter a linkedin profile url/i),
  ).toBeInTheDocument();
  expect(bodies).toHaveLength(0);
});

test("skip saves an empty answer, so the question is never asked again", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ topics: null, linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Skip" }));

  await waitFor(() => expect(bodies).toEqual([{ topics: "" }]));
  expect(await screen.findByText(/question 2 of 2/i)).toBeInTheDocument();
});

test("skip for now keeps answers already given and skips only the rest", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ topics: null, linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  await user.type(await screen.findByLabelText(TOPICS), "Design");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText(/question 2 of 2/i);
  await user.click(screen.getByRole("button", { name: "Skip for now" }));

  await waitFor(() =>
    expect(bodies).toEqual([{ topics: "Design" }, { linkedInUrl: "" }]),
  );
  expect(await screen.findByText("My Profile")).toBeInTheDocument();
});

test("finishing shows a confirmation and then the profile", async () => {
  const user = userEvent.setup();
  captureProfileUpdates();
  respondWithProfile({ topics: null });
  renderWithProviders(<MyProfilePage />);

  await user.type(await screen.findByLabelText(TOPICS), "Design systems");
  await user.click(screen.getByRole("button", { name: "Finish" }));

  expect(await screen.findByText("You're all set")).toBeInTheDocument();
  expect(await screen.findByText("My Profile")).toBeInTheDocument();
});

test("going back to a saved answer and skipping keeps that answer", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithProfile({ topics: null, linkedInUrl: null });
  renderWithProviders(<MyProfilePage />);

  await user.type(await screen.findByLabelText(TOPICS), "Design");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText(/question 2 of 2/i);
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: "Skip" }));

  await screen.findByText(/question 2 of 2/i);
  expect(bodies).toEqual([{ topics: "Design" }]);
});
