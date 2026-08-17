import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export interface Member {
  active: boolean;
  createdAt: string;
  email: string;
  extraNotes: string | null;
  firstName: string;
  id: string;
  industryPref: string | null;
  introduction: string;
  lastName: string;
  linkedInUrl: string | null;
  matchPref: string | null;
  referralSource: string | null;
  rolePref: string | null;
  topics: string | null;
  updatedAt: string;
}

interface MembersResponse {
  message: string;
  payload: Member[];
  success: boolean;
}

export interface MemberFilters {
  active?: string;
  email?: string;
  firstName?: string;
  industryPref?: string;
  lastName?: string;
  matchPref?: string;
  page?: string;
  pageSize?: string;
  rolePref?: string;
  topics?: string;
}

export const membersQueryKey = ["members"] as const;

/** Fetches members matching the supplied filters for the admin members page. */
export function useMembers(filters: MemberFilters = {}) {
  return useQuery({
    queryKey: [...membersQueryKey, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([name, value]) => {
        if (value !== undefined) {
          searchParams.set(name, value);
        }
      });

      const query = searchParams.toString();
      const path = query ? `/members?${query}` : "/members";
      const response = await apiFetch<MembersResponse>(path);
      return response.payload;
    },
  });
}
