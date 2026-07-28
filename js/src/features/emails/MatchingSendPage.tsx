import type {
  MatchingSendRequest,
  Pair,
  SelectedPair,
} from "@/features/emails/dto/emailDto";

import { PairingCsvUpload } from "@/features/emails/_components/CsvUploader";
import { EmailProgress } from "@/features/emails/_components/EmailProgress";
import { TemplateSelector } from "@/features/emails/_components/TemplateSelector";
import {
  sendMatchingEmails,
  triggerProcess,
} from "@/features/emails/api/emailAPI";
import {
  showEmailSuccess,
  showEmailError,
} from "@/features/emails/api/emailError";
import {
  Stack,
  Button,
  Table,
  Checkbox,
  Box,
  Group,
  Text,
  Tabs,
  Badge,
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function MatchingSendPage() {
  const [selectedTab, setSelectedTab] = useState<string | null>("select");
  const [pairingFile, setPairingFile] = useState<File | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set());
  const [requestId, setRequestId] = useState<string | null>(null);
  const [sharedVars] = useState<Record<string, string>>({});

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplateId) throw new Error("Template not selected");
      if (selectedPairs.size === 0) throw new Error("No pairs selected");

      const selectedPairsList: SelectedPair[] = Array.from(selectedPairs).map(
        (idx) => {
          const pair = pairs[idx];
          return {
            matchesId: undefined, // TODO: get from CSV if available
            per1: {
              name: pair.fullNameA,
              email: pair.emailA,
            },
            per2: {
              name: pair.fullNameB,
              email: pair.emailB,
            },
          };
        },
      );

      const request: MatchingSendRequest = {
        templateId: selectedTemplateId, // TODO: validate UUID format
        replyTo: null,
        pairs: selectedPairsList,
        sharedVariables: sharedVars,
      };

      const response = await sendMatchingEmails(request);
      await triggerProcess();
      return response;
    },
    onSuccess: (response) => {
      showEmailSuccess(
        "Pairing Emails Queued",
        `Accepted ${response.accepted} pairing emails`,
      );
      setRequestId(response.requestId);
      setSelectedTab("progress");
    },
    onError: (error) => {
      showEmailError(
        "Send Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPairs(new Set(pairs.map((_, i) => i)));
    } else {
      setSelectedPairs(new Set());
    }
  };

  const handleSelectPair = (index: number) => {
    const newSelected = new Set(selectedPairs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPairs(newSelected);
  };

  const rows = pairs.map((pair, index) => {
    const isSelected = selectedPairs.has(index);
    return (
      <Table.Tr key={index} style={{ opacity: isSelected ? 1 : 0.6 }}>
        <Table.Td>
          <Checkbox
            checked={isSelected}
            onChange={() => handleSelectPair(index)}
          />
        </Table.Td>
        <Table.Td>
          <Text size="sm">{pair.fullNameA}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{pair.emailA}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{pair.fullNameB}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{pair.emailB}</Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Tabs value={selectedTab} onChange={setSelectedTab}>
      <Tabs.List>
        <Tabs.Tab value="select">Select Pairs</Tabs.Tab>
        {requestId && <Tabs.Tab value="progress">Live Progress</Tabs.Tab>}
      </Tabs.List>
      <Tabs.Panel value="select" pt="lg">
        <Stack gap="lg">
          {/* Template & CSV upload */}
          <Box>
            <Stack gap="md">
              <TemplateSelector
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                label="Pairing Email Template"
              />
              <PairingCsvUpload
                pairFile={pairingFile}
                setPairFile={setPairingFile}
                setPairs={setPairs}
              />
            </Stack>
          </Box>
          {/* Pair selection table */}
          {pairs.length > 0 && (
            <Box>
              <Group justify="space-between" mb="md">
                <Text fw={600}>
                  Pairs ({selectedPairs.size} of {pairs.length} selected)
                </Text>
              </Group>
              <Table striped withTableBorder withColumnBorders stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 40 }}>
                      <Checkbox
                        checked={selectedPairs.size === pairs.length}
                        indeterminate={
                          selectedPairs.size > 0 &&
                          selectedPairs.size < pairs.length
                        }
                        onChange={(e) =>
                          handleSelectAll(e.currentTarget.checked)
                        }
                      />
                    </Table.Th>
                    <Table.Th>Name (A)</Table.Th>
                    <Table.Th>Email (A)</Table.Th>
                    <Table.Th>Name (B)</Table.Th>
                    <Table.Th>Email (B)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Box>
          )}
          {/* Send button */}
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={selectedPairs.size === 0 || !selectedTemplateId}
            loading={sendMutation.isPending}
            fullWidth
          >
            Send {selectedPairs.size} Pairing Email
            {selectedPairs.size !== 1 ? "s" : ""}
          </Button>
        </Stack>
      </Tabs.Panel>
      {requestId && (
        <Tabs.Panel value="progress" pt="lg">
          <Stack gap="lg">
            <Group justify="space-between">
              <Text fw={600}>Batch {requestId}</Text>
              <Badge>Matching</Badge>
            </Group>
            <EmailProgress requestId={requestId} />
          </Stack>
        </Tabs.Panel>
      )}
    </Tabs>
  );
}
