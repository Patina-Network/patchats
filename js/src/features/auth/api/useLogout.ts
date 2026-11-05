import { apiFetch } from "@/lib/api/client";
import { ApiResponder } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";

/**
 * Signs out: the backend invalidates the session and expires the cookie, then
 * a full page load to the home page resets the app. The reload (rather than a
 * client-side navigate) also drops every cached query from the signed-in user.
 */
export function useLogout() {
  return useMutation({
    mutationFn: () =>
      apiFetch<ApiResponder<null>>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      window.location.assign("/");
    },
  });
}
