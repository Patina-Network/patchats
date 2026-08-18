import { EmailProgress } from "@/features/emails/_components/EmailProgress";
import { Stack, Group, Text, Button } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";

export function EmailProgressPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  if (!requestId) {
    return (
      <Text c="dimmed">
        No Email Sending Session in progress. Please select a batch from history
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text fw={600}>Batch {requestId}</Text>
        <Button variant="subtle" onClick={() => navigate("../send")} size="xs">
          New Send
        </Button>
      </Group>
      <EmailProgress requestId={requestId} />
    </Stack>
  );
}
