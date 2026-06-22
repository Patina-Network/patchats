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
  matchingPreference: z.string(),
  industry: z.string(),
  role: z.string().max(200, "Role Preference must be 200 characters or fewer."),
  talkingPoints: z
    .string()
    .max(200, "Talking points must be 200 characters or fewer."),
  additionalInfo: z
    .string()
    .max(500, "Additional info must be 500 characters or fewer."),
});
