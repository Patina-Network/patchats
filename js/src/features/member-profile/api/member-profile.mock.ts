import { memberSession } from "@/features/auth/api/auth.mock";
import { MemberProfile } from "@/features/member-profile/types";
import { http, HttpResponse } from "msw";

/** The signed-in member's own profile (same id as `memberSession`). */
export const memberProfile: MemberProfile = {
  id: memberSession.id,
  active: true,
  firstName: "Ann",
  lastName: "Example",
  email: "ann@example.com",
  linkedInUrl: "https://www.linkedin.com/in/ann-example",
  introduction: "Ann is a designer who loves mentoring.",
  referralSource: "Patina Network",
  matchPref: "Peer",
  industryPref: "Technology",
  rolePref: "Design",
  topics: "Community",
  extraNotes: "",
  createdAt: "2026-01-15T14:30:00Z",
  updatedAt: "2026-01-15T14:30:00Z",
};

export const memberProfileResponse = (profile: MemberProfile) =>
  HttpResponse.json({
    success: true,
    message: "Member retrieved successfully",
    payload: profile,
  });

export const memberProfileHandlers = [
  http.get("/api/members/:id", ({ params }) =>
    memberProfileResponse({ ...memberProfile, id: String(params.id) }),
  ),
  http.patch("/api/members/me/status", async ({ request }) => {
    const { active, deactivationReason } = (await request.json()) as {
      active: boolean;
      deactivationReason?: string;
    };
    return HttpResponse.json({
      success: true,
      message:
        active ?
          "Membership reactivated successfully"
        : "Membership deactivated successfully",
      payload: { ...memberProfile, active, deactivationReason },
    });
  }),
];
