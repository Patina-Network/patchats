import { Member, membersQueryKey } from "@/features/members/api/useMembers";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateMemberStatusVariables {
  active: boolean;
  id: string;
}

/** Deactivates or reactivates a member from the admin members page. */
export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: UpdateMemberStatusVariables) =>
      apiFetch<ApiResponder<Member>>(`/members/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      }).then((res) => res.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
    },
  });
}
