import { MemberProfile } from "@/features/member-profile/types";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

/** Domain-owned query hook: fetches the member profile from the backend. */
export function useMemberProfile(id: string) {
  return useQuery({
    queryKey: ["member-profile", id] as const,
    queryFn: () => apiFetch<ApiResponder<MemberProfile>>(`/members/${id}`).then(res => res.payload),
  });
}
