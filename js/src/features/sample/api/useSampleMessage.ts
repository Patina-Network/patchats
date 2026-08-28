import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export interface SampleMessage {
  message: string;
}

export const sampleMessageQueryKey = ["sample", "message"] as const;

/** Domain-owned query hook: fetches the sample message from the backend. */
export function useSampleMessage() {
  return useQuery({
    queryKey: sampleMessageQueryKey,
    queryFn: async () =>
      (await apiFetch<ApiResponder<SampleMessage>>("/sample/message")).payload,
  });
}
