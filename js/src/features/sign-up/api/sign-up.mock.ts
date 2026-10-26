import { http, HttpResponse } from "msw";

/**
 * MSW handlers for the sign-up domain, envelope-shaped like the real backend.
 * Default: sign-up succeeds. Tests override per case with `server.use(...)`.
 */

export const duplicateMemberResponse = (email: string) =>
  HttpResponse.json(
    {
      success: false,
      message: `Member with email ${email} already exists`,
    },
    { status: 409 },
  );

export const signUpHandlers = [
  http.post("/api/members", () =>
    HttpResponse.json({
      success: true,
      message: "Member created successfully",
      payload: null,
    }),
  ),
];
