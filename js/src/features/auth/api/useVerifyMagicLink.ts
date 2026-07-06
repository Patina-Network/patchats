import { Session, sessionQueryKey } from "@/features/auth/api/useSession";
import { apiFetch } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Exchanges the raw token from the emailed link for a session. On success the
 * backend sets the session cookie and we seed the session cache so guards
 * pass without a second round-trip.
 */
export function useVerifyMagicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      apiFetch<Session>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}
