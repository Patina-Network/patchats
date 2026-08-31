import { RequireAdmin } from "@/app/router/guards/RequireAdmin";
import { RequireAuth } from "@/app/router/guards/RequireAuth";
import {
  adminSession,
  memberSession,
  sessionResponse,
} from "@/features/auth/api/auth.mock";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { http } from "msw";
import { Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";

/**
 * Nested under RequireAuth exactly as the real route tree mounts it: RequireAdmin
 * has no pending state of its own, relying on RequireAuth to hold rendering until
 * the session query resolves.
 */
function renderGuarded() {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<div>admin page</div>} />
        </Route>
      </Route>
      <Route path="/" element={<div>home page</div>} />
    </Routes>,
    { route: "/admin" },
  );
}

test("a member who is not on the admin allowlist is sent home", async () => {
  server.use(http.get("/api/session", () => sessionResponse(memberSession)));

  renderGuarded();

  expect(await screen.findByText("home page")).toBeInTheDocument();
});

test("an admin sees the guarded page", async () => {
  server.use(http.get("/api/session", () => sessionResponse(adminSession)));

  renderGuarded();

  expect(await screen.findByText("admin page")).toBeInTheDocument();
});
