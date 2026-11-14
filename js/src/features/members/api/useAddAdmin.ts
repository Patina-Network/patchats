import { Admin, adminsQueryKey } from "@/features/members/api/useAdmins";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddAdminVariables {
  email: string;
  note?: string;
}

export function useAddAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, note }: AddAdminVariables) =>
      apiFetch<ApiResponder<Admin>>("/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email, note }),
      }).then((res) => res.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKey });
    },
  });
}
