import { queryClient } from "@/lib/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
