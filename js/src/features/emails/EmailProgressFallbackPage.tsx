import { Text } from "@mantine/core";

export function EmailProgressFallbackPage() {
  return (
    <Text c="dimmed">
      No Email Sending Session in progress. Please select a batch from history
    </Text>
  );
}
