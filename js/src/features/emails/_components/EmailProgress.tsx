import type { EmailProgress } from "@/features/emails/dto/emailDto";

import { StatusBadge } from "@/features/emails/_components/StatusBadge";
import {
  getProgress,
  resendEmail,
  triggerProcess,
} from "@/features/emails/api/emailAPI";
import {
  showEmailSuccess,
  showEmailError,
} from "@/features/emails/api/emailError";
import {
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface EmailProgressProps {
  requestId: string;
}

export function EmailProgress({ requestId }: EmailProgressProps) {
  const [isTerminal, setIsTerminal] = useState(false);
  const [isResending, setIsResending] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<EmailProgress>({
    queryKey: ["emailProgress", requestId],
    queryFn: () => getProgress(requestId),
    refetchInterval: (data) => {
      // Stop polling when batch is terminal (no pending or processing emails)
      if (data) {
        //&& data.pending + data.processing === 0
        setIsTerminal(true);
        return false; // stops polling
      }
      return 2000; // poll every 2 seconds
    },
    enabled: !!requestId,
  });

  const handleResend = async (emailId: string) => {
    setIsResending(emailId);
    try {
      await resendEmail(emailId);
      showEmailSuccess("Resend", `Email ${emailId} re-queued successfully`);
      // Trigger the runner to send it
      await triggerProcess();
      // Refetch to show updated status
      await refetch();
    } catch (err) {
      showEmailError(
        "Resend Failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsResending(null);
    }
  };

  if (isLoading) return <Text>Loading progress...</Text>;
  if (error)
    return <Text color="red">Error loading progress: {error.message}</Text>;
  if (!data) return <Text>No progress data</Text>;

  const rows = data.emails.map((email) => (
    <Table.Tr key={email.id}>
      <Table.Td>
        <Text size="sm">{email.recipients.join(", ")}</Text>
      </Table.Td>
      <Table.Td>
        <StatusBadge status={email.status} />
      </Table.Td>
      <Table.Td>
        <Text size="sm" c={email.error ? "red" : undefined}>
          {email.error || "—"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {email.sentAt ? new Date(email.sentAt).toLocaleString() : "—"}
        </Text>
      </Table.Td>
      <Table.Td>
        {email.status === "ERROR" && (
          <Tooltip label="Re-queue this email for sending">
            <ActionIcon
              size="sm"
              onClick={() => handleResend(email.id)}
              loading={isResending === email.id}
              color="red"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Title order={3}>
        Live Progress {isTerminal && <Badge color="green">Complete</Badge>}
      </Title>
      {/* Summary tiles */}
      <SimpleGrid cols={5} spacing="md">
        <div
          style={{
            padding: "12px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        >
          <Text size="xs" c="gray">
            Total
          </Text>
          <Text fw={700} size="lg">
            {data.total}
          </Text>
        </div>
        <div
          style={{
            padding: "12px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        >
          <Text size="xs" c="gray">
            Pending
          </Text>
          <Text fw={700} size="lg" c="gray">
            {data.pending}
          </Text>
        </div>
        <div
          style={{
            padding: "12px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        >
          <Text size="xs" c="gray">
            Processing
          </Text>
          <Text fw={700} size="lg" c="blue">
            {data.processing}
          </Text>
        </div>
        <div
          style={{
            padding: "12px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        >
          <Text size="xs" c="gray">
            Sent
          </Text>
          <Text fw={700} size="lg" c="green">
            {data.sent}
          </Text>
        </div>
        <div
          style={{
            padding: "12px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        >
          <Text size="xs" c="gray">
            Error
          </Text>
          <Text fw={700} size="lg" c="red">
            {data.error}
          </Text>
        </div>
      </SimpleGrid>
      {/* Per-email table */}
      <div>
        <Text size="sm" fw={600} mb="xs">
          Emails ({data.emails.length})
        </Text>
        <Table striped withTableBorder withColumnBorders stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Recipients</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Error</Table.Th>
              <Table.Th>Sent At</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </div>
    </Stack>
  );
}
