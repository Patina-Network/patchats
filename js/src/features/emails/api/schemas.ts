import { z } from "zod";

export const emailComposerSchema = z.object({
  templateName: z.string().min(1, "Email template is required"),
});

export type EmailComposerValues = z.infer<typeof emailComposerSchema>;
