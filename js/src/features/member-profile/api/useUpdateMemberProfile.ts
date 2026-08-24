import { MemberProfile, MemberProfileValues } from "@/features/member-profile/types";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Domain-owned query hook: fetches the member profile from the backend. */
export function useUpdateMemberProfile(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: MemberProfileValues) => apiFetch<ApiResponder<MemberProfile>>(`/members/${id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
        }).then(res => res.payload),
        onSuccess: (updated) => {
            queryClient.setQueryData(["member-profile", id], updated);
        }
    });
}
