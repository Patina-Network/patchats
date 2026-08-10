import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

/**
 * The current authenticated user.
 *
 * PLACEHOLDER: this lives in `lib/api` so the route guards have a session source
 * today. Once auth endpoints are wired, move this into a real `features/auth/api/`
 * and import it from there.
 */
export interface Session {
  id: string;
  name: string;
  isAdmin: boolean;
}

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => {
      // Authentication is not wired yet. Local development uses an admin
      // identity so guarded pages can be exercised; production still fails
      // closed when the session endpoint is unavailable.
      if (import.meta.env.DEV) {
        return Promise.resolve({
          id: "local-dev-admin",
          isAdmin: true,
          name: "Local admin",
        });
      }

      return apiFetch<Session>("/session");
    },
    retry: false,
    staleTime: Infinity,
  });
}
