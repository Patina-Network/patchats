import { z } from "zod";

export const memberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  linkedInUrl: z.string().trim(),
  introduction: z.string().trim().min(1, "Introduction is required"),
  referralSource: z.string().trim(),
  matchPref: z.string().trim(),
  industryPref: z.string().trim(),
  rolePref: z.string().trim(),
  topics: z.string().trim(),
  extraNotes: z.string().trim(),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
