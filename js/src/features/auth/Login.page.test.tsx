import {
  rateLimitedResponse,
  unregisteredEmailResponse,
} from "@/features/auth/api/auth.mock";
import LoginPage from "@/features/auth/Login.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes, useLocation } from "react-router-dom";
import { expect, test } from "vitest";

test("rejects an invalid email without calling the API", async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  await user.type(screen.getByLabelText(/email/i), "not-an-email");
  await user.click(
    screen.getByRole("button", { name: /email me a sign-in link/i }),
  );

  expect(
    await screen.findByText("Enter a valid email address"),
  ).toBeInTheDocument();
});

test("offers sign-up and a retry when the email has no account", async () => {
  server.use(
    http.post("/api/auth/request-link", () => unregisteredEmailResponse()),
  );
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  await user.type(screen.getByLabelText(/email/i), "stranger@example.com");
  await user.click(
    screen.getByRole("button", { name: /email me a sign-in link/i }),
  );

  expect(
    await screen.findByText("No account for that email"),
  ).toBeInTheDocument();
  expect(screen.getByText("stranger@example.com")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /complete the sign-up form/i }),
  ).toHaveAttribute("href", "/sign-up");

  await user.click(
    screen.getByRole("button", { name: /try a different email/i }),
  );

  expect(await screen.findByLabelText(/email/i)).toHaveValue(
    "stranger@example.com",
  );
});

test("shows the generic check-your-email panel after submitting", async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  await user.type(screen.getByLabelText(/email/i), "ann@example.com");
  await user.click(
    screen.getByRole("button", { name: /email me a sign-in link/i }),
  );

  expect(await screen.findByText("Check your email")).toBeInTheDocument();
  expect(screen.getByText("ann@example.com")).toBeInTheDocument();
});

test("surfaces the server's message when rate limited", async () => {
  server.use(http.post("/api/auth/request-link", () => rateLimitedResponse()));
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  await user.type(screen.getByLabelText(/email/i), "ann@example.com");
  await user.click(
    screen.getByRole("button", { name: /email me a sign-in link/i }),
  );

  expect(
    await screen.findByText(
      "Too many sign-in requests. Please wait a few minutes and try again.",
    ),
  ).toBeInTheDocument();
});

test("pre-fills an email handed over by sign-up", async () => {
  renderWithProviders(<LoginPage />, {
    route: { pathname: "/login", state: { email: "jane@example.com" } },
  });

  expect(await screen.findByLabelText(/email/i)).toHaveValue(
    "jane@example.com",
  );
});

/** Sign-up probe that echoes the email handed over in router state. */
function SignUpProbe() {
  const state = useLocation().state as { email?: string } | null;
  return <div>sign-up page for {state?.email ?? "nobody"}</div>;
}

test("the sign-up link carries over an email that has no account", async () => {
  server.use(
    http.post("/api/auth/request-link", () => unregisteredEmailResponse()),
  );
  const user = userEvent.setup();
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpProbe />} />
    </Routes>,
    { route: "/login" },
  );

  await user.type(screen.getByLabelText(/email/i), "stranger@example.com");
  await user.click(
    screen.getByRole("button", { name: /email me a sign-in link/i }),
  );
  await user.click(
    await screen.findByRole("link", { name: /complete the sign-up form/i }),
  );

  expect(
    await screen.findByText("sign-up page for stranger@example.com"),
  ).toBeInTheDocument();
});

const ok = () =>
  HttpResponse.json({ success: true, message: "ok", payload: null });

/** Answers link requests in order (the last answer repeats) and records them. */
function respondInOrder(...answers: (() => Response)[]) {
  const requests: unknown[] = [];
  server.use(
    http.post("/api/auth/request-link", async ({ request }) => {
      requests.push(await request.json());
      return answers[Math.min(requests.length, answers.length) - 1]();
    }),
  );
  return requests;
}

/** Requests a link, then clicks "Send another link" on the check-email card. */
async function requestThenResend(user: ReturnType<typeof userEvent.setup>) {
  renderWithProviders(<LoginPage />);
  await user.type(screen.getByLabelText(/email/i), "ann@example.com");
  await user.click(
    screen.getByRole("button", { name: /email me a sign-in link/i }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Send another link" }),
  );
}

test("requesting another link resends it on the same screen", async () => {
  const requests = respondInOrder(ok);

  await requestThenResend(userEvent.setup());

  expect(
    await screen.findByText("Another link is on its way."),
  ).toBeInTheDocument();
  expect(screen.getByText("Check your email")).toBeInTheDocument();
  expect(requests).toEqual([
    { email: "ann@example.com" },
    { email: "ann@example.com" },
  ]);
});

test("a rate-limited resend says why", async () => {
  respondInOrder(ok, rateLimitedResponse);

  await requestThenResend(userEvent.setup());

  expect(await screen.findByText(/too many requests/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "try again" })).toBeInTheDocument();
  expect(screen.getByText("Check your email")).toBeInTheDocument();
});
