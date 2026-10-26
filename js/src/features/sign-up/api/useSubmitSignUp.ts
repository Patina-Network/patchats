import { SignUpFormValues } from "@/features/sign-up/api/schemas";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";

/** Creates the member. Fields not sent are stored as NULL ("never asked"). */
export function useSubmitSignUp() {
  return useMutation({
    mutationFn: (values: SignUpFormValues) =>
      apiFetch<ApiResponder<unknown>>("/members", {
        method: "POST",
        body: JSON.stringify(values),
      }),
  });
}
