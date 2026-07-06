import { sessionQueryKey } from "@/features/auth/api/useSession";
import { apiFetch } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

/** Signs out: the backend invalidates the session and expires the cookie. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiFetch<null>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      navigate("/");
    },
  });
}
