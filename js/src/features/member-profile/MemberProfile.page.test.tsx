import { MemberProfilePage } from "@/features/member-profile/MemberProfile.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";

// The self-service endpoint always acts on the signed-in user, so a toggle here would
// let an admin deactivate their own account while looking at someone else's profile.
test("does not offer the self-service opt-out when viewing a member's profile", async () => {
  renderWithProviders(
    <Routes>
      <Route path="/admin/members/:id" element={<MemberProfilePage />} />
    </Routes>,
    { route: "/admin/members/b3a1c2d4-0000-4000-8000-000000000002" },
  );

  expect(await screen.findByDisplayValue("Ann")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Deactivate" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Reactivate" }),
  ).not.toBeInTheDocument();
});
