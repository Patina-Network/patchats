import { rateLimitedResponse } from "@/features/auth/api/auth.mock";
import { duplicateMemberResponse } from "@/features/sign-up/api/sign-up.mock";
import { SignUpPage } from "@/features/sign-up/SignUp.page";
import { renderWithProviders, screen, waitFor } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes, useLocation } from "react-router-dom";
import { expect, test } from "vitest";

/** Login probe that echoes the email handed over in router state. */
function LoginProbe() {
  const state = useLocation().state as { email?: string } | null;
  return <div>login page for {state?.email ?? "nobody"}</div>;
}

function renderSignUp() {
  return renderWithProviders(
    <Routes>
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/login" element={<LoginProbe />} />
    </Routes>,
    { route: "/sign-up" },
  );
}

const ok = () =>
  HttpResponse.json({ success: true, message: "ok", payload: null });

/** Records every body sent to the sign-up and request-link endpoints. */
function captureRequests() {
  const signUps: unknown[] = [];
  const linkRequests: unknown[] = [];
  server.use(
    http.post("/api/members", async ({ request }) => {
      signUps.push(await request.json());
      return ok();
    }),
    http.post("/api/auth/request-link", async ({ request }) => {
      linkRequests.push(await request.json());
      return ok();
    }),
  );
  return { signUps, linkRequests };
}

/** Stray spaces on purpose: what's sent and shown should be trimmed. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), " Jane ");
  await user.type(screen.getByLabelText(/last name/i), "Doe ");
  await user.type(
    screen.getByLabelText(/email address/i),
    " jane@example.com ",
  );
  await user.type(
    screen.getByLabelText(/introduce yourself/i),
    "Jane is a designer who loves mentoring. ",
  );
}

test("rejects missing required fields without calling the API", async () => {
  const user = userEvent.setup();
  const { signUps } = captureRequests();
  renderSignUp();

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByText("First Name is required."),
  ).toBeInTheDocument();
  expect(screen.getByText("Introduction is required.")).toBeInTheDocument();
  expect(signUps).toHaveLength(0);
});

test("signing up sends only the sign-up fields, then emails the sign-in link", async () => {
  const user = userEvent.setup();
  const { signUps, linkRequests } = captureRequests();
  renderSignUp();

  await fillRequiredFields(user);
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByRole("heading", { name: "Welcome, Jane!" }),
  ).toBeInTheDocument();
  expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  // Optional profile fields are omitted, not sent as "", so they stay NULL.
  expect(signUps).toEqual([
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      introduction: "Jane is a designer who loves mentoring.",
      referralSource: "",
    },
  ]);
  expect(linkRequests).toEqual([{ email: "jane@example.com" }]);
});

test("if the link can't be sent, the new member is sent on to log in", async () => {
  const user = userEvent.setup();
  server.use(http.post("/api/auth/request-link", () => rateLimitedResponse()));
  renderSignUp();

  await fillRequiredFields(user);
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("You're signed up!")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Go to log in" }));
  expect(
    await screen.findByText("login page for jane@example.com"),
  ).toBeInTheDocument();
});

test("an existing email offers to log in instead and sends no link", async () => {
  const user = userEvent.setup();
  const { linkRequests } = captureRequests();
  server.use(
    http.post("/api/members", () =>
      duplicateMemberResponse("jane@example.com"),
    ),
  );
  renderSignUp();

  await fillRequiredFields(user);
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByText(/an account with this email already exists/i),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Log in instead" }));
  expect(
    await screen.findByText("login page for jane@example.com"),
  ).toBeInTheDocument();
  await waitFor(() => expect(linkRequests).toHaveLength(0));
});

test("pre-fills an email handed over by login", async () => {
  renderWithProviders(<SignUpPage />, {
    route: { pathname: "/sign-up", state: { email: "jane@example.com" } },
  });

  expect(await screen.findByLabelText(/email address/i)).toHaveValue(
    "jane@example.com",
  );
});
