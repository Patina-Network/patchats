import { AppLayout } from "@/app/layouts/AppLayout";
import { memberSession, sessionResponse } from "@/features/auth/api/auth.mock";
import HomePage from "@/features/home/Home.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { http } from "msw";
import { Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";

/** Rendered inside the app layout, so the navbar shows when the session has loaded. */
function renderHome() {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
      </Route>
    </Routes>,
  );
}

test("invites signed-out visitors to sign up", async () => {
  renderHome();

  expect(await screen.findByRole("link", { name: "Sign up" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
});

test("doesn't invite a signed-in member to sign up", async () => {
  server.use(http.get("/api/session", () => sessionResponse(memberSession)));

  renderHome();

  expect(
    await screen.findByRole("button", { name: "Logout" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Sign up" })).toBeNull();
});
