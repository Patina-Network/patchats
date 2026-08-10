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

export const membersQueryKey = ["members"] as const;

/** Fetches every member for the admin members page. */
export function useMembers() {
  return useQuery({
    queryKey: membersQueryKey,
    queryFn: async () => {
      const response = await apiFetch<MembersResponse>("/members");
      return response.payload;
    },
  });
}
