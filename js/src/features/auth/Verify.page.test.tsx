import { invalidLinkResponse } from "@/features/auth/api/auth.mock";
import VerifyPage from "@/features/auth/Verify.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { http } from "msw";
import { Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";

/** Mounts the verify page plus probe routes so navigation can be asserted. */
function renderVerify(url: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/verify" element={<VerifyPage />} />
      <Route path="/" element={<div>home page</div>} />
    </Routes>,
    { initialEntries: [url] },
  );
}

test("a verified member lands on the home page", async () => {
  renderVerify("/auth/verify?token=good-token");

  expect(await screen.findByText("home page")).toBeInTheDocument();
});

test("an invalid or expired link shows the server message and a retry path", async () => {
  server.use(http.post("/api/auth/verify", () => invalidLinkResponse()));

  renderVerify("/auth/verify?token=spent-token");

  expect(
    await screen.findByText(
      "This sign-in link is invalid or has expired. Request a new one.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /request a new link/i }),
  ).toBeInTheDocument();
});

test("a missing token shows the error state without calling the API", async () => {
  renderVerify("/auth/verify");

  expect(await screen.findByText("Sign-in link problem")).toBeInTheDocument();
});
