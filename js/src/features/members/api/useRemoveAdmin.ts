import { adminsQueryKey } from "@/features/members/api/useAdmins";
import { apiFetch } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch(`/admin/admins/${encodeURIComponent(email)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKey });
    },
  });
}
