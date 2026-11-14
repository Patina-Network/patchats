import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export interface Admin {
  email: string;
  note: string | null;
  createdAt: string;
}

export const adminsQueryKey = ["admins"] as const;

export function useAdmins() {
  return useQuery({
    queryKey: adminsQueryKey,
    queryFn: async () => {
      const response = await apiFetch<ApiResponder<Admin[]>>("/admin/admins");
      return response.payload;
    },
  });
}
