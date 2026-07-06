import { rateLimitedResponse } from "@/features/auth/api/auth.mock";
import LoginPage from "@/features/auth/Login.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
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
