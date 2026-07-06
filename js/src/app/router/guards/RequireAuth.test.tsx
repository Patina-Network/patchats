import { RequireAuth } from "@/app/router/guards/RequireAuth";
import { memberSession, sessionResponse } from "@/features/auth/api/auth.mock";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { http } from "msw";
import { Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";

function renderGuarded() {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/private" element={<div>private page</div>} />
      </Route>
      <Route path="/login" element={<div>login page</div>} />
    </Routes>,
    { initialEntries: ["/private"] },
  );
}

test("signed-out visitors are redirected to the login page", async () => {
  renderGuarded();

  expect(await screen.findByText("login page")).toBeInTheDocument();
});

test("a signed-in member sees the guarded page", async () => {
  server.use(http.get("/api/session", () => sessionResponse(memberSession)));

  renderGuarded();

  expect(await screen.findByText("private page")).toBeInTheDocument();
});
