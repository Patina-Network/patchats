import { QueryClient } from "@tanstack/react-query";

/**
 * The single QueryClient for the app. Created at module scope so it is never
 * re-created across renders. Tune defaults (retries, staleTime, etc.) here.
 */
export const queryClient = new QueryClient();
