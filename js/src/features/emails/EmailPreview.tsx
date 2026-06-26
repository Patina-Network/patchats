import type { MessagePreview } from "@/features/emails/api/parseCSV";

import { Alert, Box, Divider, Stack, Text } from "@mantine/core";

/**
 * Displays the rendered emails returned by the /api/email/preview endpoint.
 *
 * Note: this takes the *rendered* previews (MessagePreview[]), not the raw object from combineData.
 * combineData returns a SendEmailRequest whose subject/body still contain unresolved ${...} placeholders;
 * passing that here would show literal template syntax. Render it first via previewEmails(request), then
 * pass the result in so the user sees exactly what will be sent.
 */
export function EmailPreview({
  previews,
}: {
  previews: MessagePreview[] | null;
}) {
  if (previews === null)
    return <Text c="dimmed">Upload a CSV and click Preview.</Text>;

  if (previews.length === 0)
    return <Text c="dimmed">No emails to preview.</Text>;

  return (
    <Stack gap="md">
      <Text size="md" c="dimmed">
        {previews.length} email{previews.length === 1 ? "" : "s"} to send
      </Text>
      {previews.map((preview, index) => (
        <EmailPreviewCard key={index} preview={preview} />
      ))}
    </Stack>
  );
}

function EmailPreviewCard({ preview }: { preview: MessagePreview }) {
  const hasError = preview.error !== null;

  return (
    <Box
      p="sm"
      style={{
        borderLeft: `3px solid var(--mantine-color-${hasError ? "red" : "green"}-6)`,
        backgroundColor: "var(--mantine-color-gray-0)",
        borderRadius: 4,
      }}
    >
      <Text size="sm" c="dimmed">
        To: {preview.recipients.join(", ")}
      </Text>
      {hasError ?
        <Alert color="red" title="Render error" mt="xs">
          {preview.error}
        </Alert>
      : <>
          <Text fw={600} mt="xs" c="dimmed">
            {preview.subject}
          </Text>
          <Divider my="xs" />
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }} c="dimmed">
            {preview.body}
          </Text>
        </>
      }
    </Box>
  );
}
