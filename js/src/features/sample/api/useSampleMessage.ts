import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

export interface SampleMessage {
  message: string;
}

export const sampleMessageQueryKey = ["sample", "message"] as const;

/** Domain-owned query hook: fetches the sample message from the backend. */
export function useSampleMessage() {
  return useQuery({
    queryKey: sampleMessageQueryKey,
    queryFn: () => apiFetch<SampleMessage>("/sample/message"),
  });
}
