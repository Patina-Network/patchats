import { z } from "zod";

export const signUpFormSchema = z.object({
  fullName: z.string().min(1, "Full Name is required."),
  email: z
    .string()
    .min(1, "Email Address is required.")
    .email("Enter a valid email address."),
  linkedin: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("https://linkedin.com/in/") ||
        value.startsWith("https://www.linkedin.com/in/"),
      {
        message:
          "Enter a url starting with https://linkedin.com/in/ or https://www.linkedin.com/in/.",
      },
    ),
  introduction: z
    .string()
    .min(1, "Introduction is required.")
    .max(300, "Introduction must be 300 characters or fewer."),
  referralSource: z
    .string()
    .max(200, "Referral source must be 200 characters or fewer."),
  matchingPreference: z.string().min(1, "Matching Preference is required."),
  industry: z.string().min(1, "Industry Preference is required."),
  role: z
    .string()
    .min(1, "Role Preference is required.")
    .max(200, "Role Preference must be 200 characters or fewer.")
    .optional(),
  talkingPoints: z
    .string()
    .max(200, "Talking points must be 200 characters or fewer.")
    .optional(),
  additionalInfo: z
    .string()
    .max(500, "Additional info must be 500 characters or fewer."),
});
