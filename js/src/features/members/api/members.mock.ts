import { http, HttpResponse } from "msw";

export const membersHandlers = [
  http.get("/api/members", () =>
    HttpResponse.json({
      message: "Members retrieved successfully",
      payload: [
        {
          active: true,
          createdAt: "2026-01-15T14:30:00Z",
          email: "alex@example.com",
          extraNotes: null,
          firstName: "Alex",
          id: "50ecf8a0-6345-40f8-b59f-438c3f338b82",
          industryPref: "Technology",
          introduction: "I build community-focused software.",
          lastName: "Morgan",
          linkedInUrl: "https://www.linkedin.com/in/alex-morgan",
          matchPref: "Peer",
          referralSource: "Patina Network",
          rolePref: "Engineering",
          topics: "Community, Technology",
          updatedAt: "2026-01-15T14:30:00Z",
        },
        {
          active: false,
          createdAt: "2025-12-10T09:00:00Z",
          email: "jordan@example.com",
          extraNotes: "Prefers virtual chats.",
          firstName: "Jordan",
          id: "db827ce4-5ed1-4649-98ca-3e5fb538d22e",
          industryPref: "Design",
          introduction: "I am a product designer.",
          lastName: "Lee",
          linkedInUrl: null,
          matchPref: "Mentor",
          referralSource: null,
          rolePref: "Product design",
          topics: "Design systems",
          updatedAt: "2026-02-01T11:00:00Z",
        },
      ],
      success: true,
    }),
  ),
  http.patch("/api/members/:id/status", async ({ params, request }) => {
    const { active } = (await request.json()) as { active: boolean };
    return HttpResponse.json({
      message:
        active ?
          "Member reactivated successfully"
        : "Member deactivated successfully",
      payload: {
        active,
        createdAt: "2026-01-15T14:30:00Z",
        email: "alex@example.com",
        extraNotes: null,
        firstName: "Alex",
        id: params.id,
        industryPref: "Technology",
        introduction: "I build community-focused software.",
        lastName: "Morgan",
        linkedInUrl: "https://www.linkedin.com/in/alex-morgan",
        matchPref: "Peer",
        referralSource: "Patina Network",
        rolePref: "Engineering",
        topics: "Community, Technology",
        updatedAt: "2026-01-15T14:30:00Z",
      },
      success: true,
    });
  }),
];
