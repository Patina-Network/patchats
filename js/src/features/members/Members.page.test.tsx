import MembersPage from "@/features/members/Members.page";
import { renderWithProviders, screen } from "@/lib/test/render";
import { server } from "@/lib/test/server";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";

test("renders every member returned by the API", async () => {
  renderWithProviders(<MembersPage />);

  expect(await screen.findByText("Alex Morgan")).toBeInTheDocument();
  expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
  expect(screen.getByText("2 members")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("Inactive")).toBeInTheDocument();
});

test("renders an empty state when there are no members", async () => {
  server.use(
    http.get("/api/members", () =>
      HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [],
        success: true,
      }),
    ),
  );

  renderWithProviders(<MembersPage />);

  expect(await screen.findByText("No members found.")).toBeInTheDocument();
  expect(screen.getByText("0 members")).toBeInTheDocument();
});

test("forwards URL parameters to the members API", async () => {
  let requestedUrl: URL | undefined;
  server.use(
    http.get("/api/members", ({ request }) => {
      requestedUrl = new URL(request.url);
      return HttpResponse.json({
        message: "Members retrieved successfully",
        payload: [],
        success: true,
      });
    }),
  );

  renderWithProviders(<MembersPage />, {
    route:
      "/admin/members?firstName=Alex&lastName=Morgan&email=alex%40example.com&active=true&matchPref=Peer&industryPref=Technology&rolePref=Engineering&topics=Community%20building&ignored=value",
  });

  expect(await screen.findByText("No members found.")).toBeInTheDocument();
  expect(requestedUrl?.searchParams.get("firstName")).toBe("Alex");
  expect(requestedUrl?.searchParams.get("lastName")).toBe("Morgan");
  expect(requestedUrl?.searchParams.get("email")).toBe("alex@example.com");
  expect(requestedUrl?.searchParams.get("active")).toBe("true");
  expect(requestedUrl?.searchParams.get("matchPref")).toBe("Peer");
  expect(requestedUrl?.searchParams.get("industryPref")).toBe("Technology");
  expect(requestedUrl?.searchParams.get("rolePref")).toBe("Engineering");
  expect(requestedUrl?.searchParams.get("topics")).toBe("Community building");
  expect(requestedUrl?.searchParams.has("ignored")).toBe(false);
});
