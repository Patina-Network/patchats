import { SelectableEmailTemplateName } from "@/features/emails/api/EmailTemplate";
import { getMockTemplateAudience } from "@/features/emails/api/mockTemplateAudience";
import { useQuery } from "@tanstack/react-query";

export const templateAudienceQueryKey = [
  "emails",
  "template-audience",
] as const;

export function useTemplateAudience(
  templateName: SelectableEmailTemplateName | undefined,
) {
  return useQuery({
    enabled: templateName !== undefined,
    queryKey: [...templateAudienceQueryKey, templateName],
    queryFn: () => {
      if (!templateName) {
        throw new Error("An email template must be selected");
      }

      return getMockTemplateAudience(templateName);
    },
    staleTime: Infinity,
  });
}
