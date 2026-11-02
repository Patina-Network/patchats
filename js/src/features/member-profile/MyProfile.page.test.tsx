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

const REASON_LABEL = "Reason (optional)";

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
  expect(await screen.findByText("Profile deactivated")).toBeInTheDocument();
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
  expect(await screen.findByText("Profile reactivated")).toBeInTheDocument();
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
const PEER = "Peer - I am looking for someone at a similar level";

/** A member who hasn't done profile setup; every optional field is still empty. */
function respondWithNewMember() {
  respondWithProfile({
    profileSetupDone: false,
    linkedInUrl: "",
    matchPref: "",
    industryPref: "",
    rolePref: "",
    topics: "",
    extraNotes: "",
  });
}

/** Skips ahead to the given question (1-based). */
async function skipTo(
  user: ReturnType<typeof userEvent.setup>,
  question: number,
) {
  for (let current = 1; current < question; current++) {
    await user.click(await screen.findByRole("button", { name: "Skip" }));
  }
  await screen.findByText(`Question ${question} of 4`);
}

test("a member whose profile setup isn't done is asked every question, pre-filled with saved answers", async () => {
  const user = userEvent.setup();
  respondWithProfile({
    profileSetupDone: false,
    matchPref: PEER,
    topics: "Community",
  });
  renderWithProviders(<MyProfilePage />);

  expect(await screen.findByText(/question 1 of 4/i)).toBeInTheDocument();
  expect(screen.queryByText("My Profile")).not.toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /^peer/i })).toBeChecked();
  await skipTo(user, 3);
  expect(screen.getByLabelText(TOPICS)).toHaveValue("Community");
});

test("a new member is greeted, then asked the one-click questions first", async () => {
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

test("exit setup asks to confirm, then marks profile setup done", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Exit setup" }));
  const dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByText(/answer them on your profile anytime/i),
  ).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Exit setup" }));

  await waitFor(() => expect(bodies).toEqual([{ profileSetupDone: true }]));
  expect(await screen.findByText("My Profile")).toBeInTheDocument();
});

test("continue saves just that answer, trimmed, and moves on", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await skipTo(user, 3);
  const topics = screen.getByLabelText(TOPICS);
  expect(topics).toHaveFocus();
  await user.type(topics, " Design systems ");
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await waitFor(() => expect(bodies).toEqual([{ topics: "Design systems" }]));
  expect(await screen.findByText(/question 4 of 4/i)).toBeInTheDocument();
});

test("finishing saves a LinkedIn shorthand as the full URL, then shows the profile", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await skipTo(user, 4);
  await user.type(screen.getByLabelText(LINKEDIN), "linkedin.com/in/ann");
  await user.click(screen.getByRole("button", { name: "Finish" }));

  await waitFor(() =>
    expect(bodies).toEqual([
      { linkedInUrl: "https://linkedin.com/in/ann", profileSetupDone: true },
    ]),
  );
  expect(await screen.findByText("You're all set")).toBeInTheDocument();
  expect(await screen.findByText("My Profile")).toBeInTheDocument();
});

test("picking a choice and continuing saves the full option", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("radio", { name: /^peer/i }));
  expect(bodies).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await waitFor(() => expect(bodies).toEqual([{ matchPref: PEER }]));
  expect(await screen.findByText(/question 2 of 4/i)).toBeInTheDocument();
});

test("an invalid answer shows the error and saves nothing", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await skipTo(user, 4);
  await user.type(screen.getByLabelText(LINKEDIN), "not a url");
  await user.click(screen.getByRole("button", { name: "Finish" }));

  expect(
    await screen.findByText(/enter a linkedin profile url/i),
  ).toBeInTheDocument();
  expect(bodies).toHaveLength(0);
});

test("a failed save shows an error and stays on the question", async () => {
  const user = userEvent.setup();
  server.use(
    http.patch("/api/members/:id", () =>
      HttpResponse.json({ success: false, message: "boom" }, { status: 500 }),
    ),
  );
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("radio", { name: /^peer/i }));
  await user.click(screen.getByRole("button", { name: "Continue" }));

  expect(
    await screen.findByText(/couldn't save your answer/i),
  ).toBeInTheDocument();
  expect(screen.getByText(/question 1 of 4/i)).toBeInTheDocument();
});

test("continue is disabled until there's an answer", async () => {
  const user = userEvent.setup();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  const continueButton = await screen.findByRole("button", {
    name: "Continue",
  });
  expect(continueButton).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: /^peer/i }));
  expect(continueButton).toBeEnabled();

  await skipTo(user, 3);
  await user.type(screen.getByLabelText(TOPICS), "  ");
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
});

test("skip saves nothing and moves on", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await user.click(await screen.findByRole("button", { name: "Skip" }));

  expect(await screen.findByText(/question 2 of 4/i)).toBeInTheDocument();
  expect(bodies).toHaveLength(0);
});

test("skipping the last question still marks profile setup done", async () => {
  const user = userEvent.setup();
  const bodies = captureProfileUpdates();
  respondWithNewMember();
  renderWithProviders(<MyProfilePage />);

  await skipTo(user, 4);
  await user.click(screen.getByRole("button", { name: "Skip" }));

  await waitFor(() => expect(bodies).toEqual([{ profileSetupDone: true }]));
  expect(await screen.findByText("My Profile")).toBeInTheDocument();
});
