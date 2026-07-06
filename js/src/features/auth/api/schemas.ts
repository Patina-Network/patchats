import { z } from "zod";

/** Login form: just an email — magic links are the only sign-in method. */
export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
