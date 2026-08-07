import { z } from "zod";

export const memberProfileSchema = z.object({
  firstName: z.string().min(1, "First Name is required."),
  lastName: z.string().min(1, "Last Name is required."),
  email: z
    .string()
    .min(1, "Email Address is required.")
    .email("Enter a valid email address."),
  linkedInUrl: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("https://linkedin.com/in/") ||
        value.startsWith("https://www.linkedin.com/in/"),
      {
        message:
          "Enter a LinkedIn profile URL in the format linkedin.com/in/your-profile.",
      },
    ),
  introduction: z
    .string()
    .min(1, "Introduction is required.")
    .max(300, "Introduction must be 300 characters or fewer."),
  referralSource: z
    .string()
    .max(200, "Referral source must be 200 characters or fewer."),
  matchPref: z.string(),
  industryPref: z.string(),
  rolePref: z
    .string()
    .max(200, "Role Preference must be 200 characters or fewer."),
  topics: z.string().max(200, "Topics must be 200 characters or fewer."),
  extraNotes: z
    .string()
    .max(500, "Extra notes must be 500 characters or fewer."),
});
