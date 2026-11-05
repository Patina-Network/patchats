import { sessionQueryKey } from "@/features/auth/api/useSession";
import { apiFetch } from "@/lib/api/client";
import { ApiResponder } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Signs out: the backend invalidates the session and expires the cookie, then
 * a full page load to the home page resets the app. The client cache is
 * cleared first so a page restored from the back/forward cache holds a
 * signed-out session, and `replace` keeps the signed-in page out of history.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<ApiResponder<null>>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.clear();
      window.location.replace("/");
    },
  });
}
