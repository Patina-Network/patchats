import { SignUpFormValues } from "@/features/sign-up/api/schemas";
import { apiFetch, ApiResponder } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";

/**
 * Creates the member. The rest of the profile is saved as "" until it's
 * answered after the first login.
 */
export function useSubmitSignUp() {
  return useMutation({
    mutationFn: (values: SignUpFormValues) =>
      apiFetch<ApiResponder<unknown>>("/members", {
        method: "POST",
        body: JSON.stringify({
          linkedInUrl: "",
          matchPref: "",
          industryPref: "",
          rolePref: "",
          topics: "",
          extraNotes: "",
          ...values,
        }),
      }),
  });
}
