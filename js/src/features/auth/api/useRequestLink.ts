import { apiFetch } from "@/lib/api/client";
import { ApiResponder } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";

/**
 * Asks the backend to email a sign-in link. The response is intentionally
 * identical whether or not the email has an account.
 */
export function useRequestLink() {
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<ApiResponder<null>>("/auth/request-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });
}
