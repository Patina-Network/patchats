import type { EmailTemplate } from "@/features/emails/dto/emailDto";

import { listTemplates } from "@/features/emails/api/emailAPI";
import { Select, Stack, Text, Badge, Box, Spoiler } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

interface TemplateSelectorProps {
  value: string | null;
  onChange: (templateId: string | null) => void;
  label?: string;
  error?: string;
}

export function TemplateSelector({
  value,
  onChange,
  label = "Select Template",
  error,
}: TemplateSelectorProps) {
  const {
    data: templates,
    isLoading,
    error: queryError,
  } = useQuery<EmailTemplate[]>({
    queryKey: ["emailTemplates"],
    queryFn: () => listTemplates(),
  });

  const selectedTemplate = templates?.find((t) => t.id === value);

  return (
    <Stack gap="xxs">
      <Select
        label={label}
        placeholder="Choose a template"
        data={
          templates?.map((t) => ({
            value: t.id,
            label: t.name,
          })) || []
        }
        value={value}
        onChange={onChange}
        disabled={isLoading}
        error={error || queryError?.message}
        searchable
        clearable
      />
      <Spoiler maxHeight={0} showLabel="Preview Template" hideLabel="Hide">
        {selectedTemplate && (
          <Box
            p="md"
            style={{
              border: "1px solid white",
              borderRadius: "4px",
              backgroundColor: "white",
            }}
          >
            <Stack gap="xs">
              <div>
                <Text size="xs" c="gray" fw={600}>
                  SUBJECT
                </Text>
                <Text
                  size="xs"
                  c="black"
                  style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                >
                  {selectedTemplate.subject}
                </Text>
              </div>
              <div>
                <Text size="xs" c="gray" fw={600}>
                  BODY
                </Text>
                <Text
                  size="xs"
                  c="black"
                  style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                >
                  {selectedTemplate.body}
                </Text>
              </div>
              <div>
                <Badge size="xs">
                  Created{" "}
                  {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </Stack>
          </Box>
        )}
      </Spoiler>
    </Stack>
  );
}
