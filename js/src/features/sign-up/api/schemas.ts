import { memberProfileSchema } from "@/features/member-profile/api/schemas";
import { z } from "zod";

/** Sign-up asks only for these; the rest is asked after the first login. */
export const signUpSchema = memberProfileSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  introduction: true,
  referralSource: true,
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
