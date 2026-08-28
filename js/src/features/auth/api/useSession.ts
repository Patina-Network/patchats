import { ApiError, apiFetch, ApiResponder } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

/**
 * The current authenticated member. Members are created exclusively by the
 * sign-up form, so a session always carries a complete profile.
 */
export interface Session {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export const sessionQueryKey = ["session"] as const;

/**
 * Fetches the session from the cookie-backed backend. A 401 resolves to
 * `null` — "signed out" is data, not an error, so guards can branch on it.
 */
export function useSession() {
  return useQuery<Session | null>({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return (await apiFetch<ApiResponder<Session>>("/session")).payload;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
}
