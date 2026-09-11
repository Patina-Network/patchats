import { MemberProfile } from "@/features/member-profile/types";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateMemberStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ active, reason }: { active: boolean; reason?: string }) =>
      apiFetch<ApiResponder<MemberProfile>>(`/members/me/status`, {
        method: "PATCH",
        body: JSON.stringify({ active, reason }),
      }).then((res) => res.payload),
    onSuccess: (updated) =>
      queryClient.setQueryData(["member-profile", id], updated),
  });
}
