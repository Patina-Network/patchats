import type { EmailRequestSummary } from "@/features/emails/dto/emailDto";

import { EmailProgress } from "@/features/emails/_components/EmailProgress";
import { listRequests } from "@/features/emails/api/emailAPI";
import { Table, Text, Title, Badge, Stack, Group } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface EmailHistoryProps {
  detailRequestId?: string | null;
  onSelectRequest?: (requestId: string) => void;
  onBack?: () => void;
}

export function EmailHistory({
  detailRequestId,
  onSelectRequest,
  onBack,
}: EmailHistoryProps = {}) {
  const [localSelectedRequestId, setLocalSelectedRequestId] = useState<
    string | null
  >(null);
  const selectedRequestId = detailRequestId ?? localSelectedRequestId;

  const handleSelectRequest =
    onSelectRequest ??
    ((requestId: string) => setLocalSelectedRequestId(requestId));
  const handleBack = onBack ?? (() => setLocalSelectedRequestId(null));

  const {
    data: requests,
    isLoading,
    error,
  } = useQuery<EmailRequestSummary[]>({
    queryKey: ["emailRequests"],
    queryFn: () => listRequests(),
  });

  if (isLoading) return <Text>Loading history...</Text>;

  if (selectedRequestId) {
    return (
      <Stack gap="lg">
        <Group>
          <Title order={3}>Batch Details</Title>
          <Badge
            onClick={handleBack}
            style={{ cursor: "pointer" }}
            variant="light"
          >
            ← Back to history
          </Badge>
        </Group>
        <EmailProgress requestId={selectedRequestId} />
      </Stack>
    );
  }

  const rows = (requests || []).map((req) => (
    <Table.Tr
      key={req.id}
      onClick={() => handleSelectRequest(req.id)}
      style={{ cursor: "pointer" }}
      className="hover:bg-gray-50"
    >
      <Table.Td>
        <Text size="sm">{new Date(req.createdAt).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Badge size="sm" variant="light">
          {req.source}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{req.total}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Badge size="sm" color="green" variant="light">
            Sent: {req.sent}
          </Badge>
          <Badge size="sm" color="red" variant="light">
            Error: {req.error}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge size="sm" color={req.terminal ? "blue" : "gray"} variant="light">
          {req.terminal ? "Complete" : "In Progress"}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Title order={3}>Email History</Title>
      {error || (requests && requests.length === 0) ?
        <Text c="dimmed">No email history yet.</Text>
      : <>
          <Text size="sm" c="dimmed">
            Click a row to view batch details
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Created</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Results</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </>
      }
    </Stack>
  );
}
