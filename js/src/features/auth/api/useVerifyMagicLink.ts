import { Session, sessionQueryKey } from "@/features/auth/api/useSession";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Exchanges the raw token from the emailed link for a session. On success the
 * backend sets the session cookie; we also seed the session cache so guards
 * pass without a second round-trip.
 *
 * Modeled as a query (not a mutation) on purpose: the token is single-use and
 * this fires on mount, and StrictMode's simulated remount detaches a mutation
 * observer from its in-flight request — the component would never see the
 * result. A query keyed by the token is deduped across the double-mount (one
 * POST) and the remounted observer re-attaches to the cached entry.
 */
export function useVerifyMagicLink(token: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["auth", "verify", token],
    queryFn: async () => {
      const session = await apiFetch<Session>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      queryClient.setQueryData(sessionQueryKey, session);
      return session;
    },
    enabled: token !== null,
    retry: false,
    // Never refetch a consumed token: the entry stays fresh for the page's lifetime.
    staleTime: Infinity,
  });
}
