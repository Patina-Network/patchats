import type {
  MessagePreview,
  SendRequest,
} from "@/features/emails/dto/emailDto";

import { sendToPreviewApi } from "@/features/emails/api/emailAPI";
import { Carousel } from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import { Alert, Flex, Box, Divider, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Displays the rendered emails returned by the /api/email/preview endpoint.
 *
 * Note: this takes the *rendered* previews (MessagePreview[]), not the raw object from combineData.
 * combineData returns a SendEmailRequest whose subject/body still contain unresolved ${...} placeholders;
 * passing that here would show literal template syntax. Render it first via previewEmails(request), then
 * pass the result in so the user sees exactly what will be sent.
 */
export function EmailPreviewer({
  previews,
  setPreviews,
  request,
}: {
  previews: MessagePreview[] | null;
  setPreviews: React.Dispatch<React.SetStateAction<MessagePreview[] | null>>;
  request: SendRequest | null;
}) {
  const { data, status } = useQuery({
    queryKey: ["preview", request],
    queryFn: async () => {
      if (!request) throw new Error("Request required");
      return sendToPreviewApi(request);
    },
    enabled: !!request,
  });

  useEffect(() => {
    if (status === "success") {
      setPreviews(data);
      notifications.show({
        color: "green",
        title: `${status}`,
        message: "Email previews loaded",
      });
    }
    // handle other statuses
  }, [status, data, setPreviews]);

  return (
    <Stack gap="md">
      <Flex direction="column" gap="md" mr="xl">
        {previews === null ?
          <Text c="dimmed">Upload a CSV and click Preview.</Text>
        : previews.length === 0 ?
          <Text c="dimmed">No emails to preview.</Text>
        : <>
            <Text size="md" c="dimmed">
              {previews.length} email{previews.length === 1 ? "" : "s"} to send
            </Text>
            <Carousel
              slideSize="100%"
              withIndicators
              emblaOptions={{ loop: true }}
              px="xl"
              controlsOffset="xxs"
            >
              {previews.map((preview, index) => (
                <Carousel.Slide key={index}>
                  <EmailPreviewCard preview={preview} />
                </Carousel.Slide>
              ))}
            </Carousel>
          </>
        }
      </Flex>
    </Stack>
  );
}

function EmailPreviewCard({ preview }: { preview: MessagePreview }) {
  const hasError = preview.error !== null;

  return (
    <Box
      p="sm"
      style={{
        borderLeft: `3px solid ${hasError ? "red" : "green"}`,
        backgroundColor: "white",
        borderRadius: 4,
      }}
    >
      <Text size="sm" c="black">
        To: {preview.recipients.join(", ")}
      </Text>
      {hasError ?
        <Alert color="red" title="Render error" mt="xs">
          {preview.error}
        </Alert>
      : <>
          <Text fw={600} mt="xs" c="black">
            {preview.subject}
          </Text>
          <Divider my="xs" />
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }} c="black">
            {preview.body}
          </Text>
        </>
      }
    </Box>
  );
}
