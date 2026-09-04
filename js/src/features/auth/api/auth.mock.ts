import { Session } from "@/features/auth/api/useSession";
import { http, HttpResponse } from "msw";

/**
 * MSW handlers for the auth domain, envelope-shaped like the real backend.
 * Defaults: request-link succeeds, verify signs in a member, and
 * there is no session (401). Tests override per case with `server.use(...)`
 * and the exported fixtures.
 */

export const memberSession: Session = {
  id: "6f9a4f4e-0000-4000-8000-000000000001",
  name: "Ann Example",
  email: "ann@example.com",
  isAdmin: false,
};

/** Same member, but on the `admins` allowlist — exercises the admin-only routes. */
export const adminSession: Session = {
  ...memberSession,
  isAdmin: true,
};

export const invalidLinkResponse = () =>
  HttpResponse.json(
    {
      success: false,
      message:
        "This sign-in link is invalid or has expired. Request a new one.",
    },
    { status: 400 },
  );

export const unregisteredEmailResponse = () =>
  HttpResponse.json(
    {
      success: false,
      message: "We couldn't find an account for that email.",
    },
    { status: 404 },
  );

export const rateLimitedResponse = () =>
  HttpResponse.json(
    {
      success: false,
      message:
        "Too many sign-in requests. Please wait a few minutes and try again.",
    },
    { status: 429 },
  );

export const sessionResponse = (session: Session) =>
  HttpResponse.json({ success: true, message: "Signed in.", payload: session });

export const authHandlers = [
  http.post("/api/auth/request-link", () =>
    HttpResponse.json({
      success: true,
      message: "Check your email for a sign-in link.",
      payload: null,
    }),
  ),
  http.post("/api/auth/verify", () => sessionResponse(memberSession)),
  http.get("/api/session", () =>
    HttpResponse.json(
      { success: false, message: "Not signed in" },
      { status: 401 },
    ),
  ),
  http.post("/api/auth/logout", () =>
    HttpResponse.json({ success: true, message: "Signed out.", payload: null }),
  ),
];
