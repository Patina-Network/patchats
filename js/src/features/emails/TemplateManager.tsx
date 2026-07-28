import type {
  EmailTemplate,
  SendRequest,
  MessagePreview,
} from "@/features/emails/dto/emailDto";

import { EmailPreviewer } from "@/features/emails/_components/EmailPreviewer";
import {
  listTemplates,
  createTemplate,
  deleteTemplate,
  sendToLegacyPreviewApi,
} from "@/features/emails/api/emailAPI";
import {
  showEmailSuccess,
  showEmailError,
} from "@/features/emails/api/emailError";
import {
  Tabs,
  Stack,
  Table,
  Button,
  Modal,
  Text,
  TextInput,
  Textarea,
  Group,
  ActionIcon,
  Tooltip,
  Box,
  Flex,
} from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function TemplateManager() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", subject: "", body: "" });
  const [previewData, setPreviewData] = useState<MessagePreview[] | null>(null);

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["emailTemplates"],
    queryFn: () => listTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return await createTemplate({
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      showEmailSuccess(
        "Template Created",
        `"${formData.name}" created successfully`,
      );
      setFormData({ name: "", subject: "", body: "" });
      setShowCreateModal(false);
    },
    onError: (error) => {
      showEmailError(
        "Creation Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await deleteTemplate(templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      showEmailSuccess("Template Deleted", "Template removed successfully");
    },
    onError: (error) => {
      showEmailError(
        "Delete Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    },
  });

  const handlePreviewTemplate = async () => {
    if (!formData.subject || !formData.body) {
      showEmailError("Missing Fields", "Subject and body are required");
      return;
    }

    try {
      // Create fake messages with sample variabls to preview
      const request: SendRequest = {
        subject: formData.subject,
        body: formData.body,
        replyTo: null,
        messages: [
          {
            recipients: [
              {
                email: "sample@example.com",
                variableToValue: {
                  "per1.name": "Alice",
                  "per1.email": "alice@example.com",
                  "per2.name": "Bob",
                  "per2.email": "bob@example.com",
                },
              },
            ],
          },
        ],
      };

      const previews = await sendToLegacyPreviewApi(request);
      setPreviewData(previews || []);
    } catch (error) {
      showEmailError(
        "Preview Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const rows = (templates || []).map((template) => (
    <Table.Tr key={template.id}>
      <Table.Td>
        <Text size="sm" fw={600}>
          {template.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(template.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Tooltip label="Delete template">
          <ActionIcon
            size="sm"
            color="red"
            onClick={() => {
              if (confirm(`Delete template "${template.name}"?`)) {
                deleteMutation.mutate(template.id);
              }
            }}
            loading={deleteMutation.isPending}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Tabs defaultValue="list">
      <Tabs.List>
        <Tabs.Tab value="list">Templates ({templates?.length || 0})</Tabs.Tab>
        <Tabs.Tab value="create">Create New</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="list" pt="lg">
        <Stack gap="lg">
          <Group justify="space-between">
            <Text fw={600}>Available Templates</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              New Template
            </Button>
          </Group>
          {isLoading ?
            <Text>Loading templates...</Text>
          : (templates || []).length === 0 ?
            <Text c="dimmed">No templates yet. Create one to get started.</Text>
          : <Table striped withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          }
        </Stack>
      </Tabs.Panel>
      <Tabs.Panel value="create" pt="lg">
        <Flex gap="lg" align="flex-start">
          <Stack w="40%" gap="md">
            <Text fw={600}>Create New Template</Text>
            <TextInput
              label="Template Name"
              placeholder="e.g., Monthly Pairing"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.currentTarget.value,
                })
              }
            />
            <Textarea
              label="Subject (use ${variable} syntax)"
              placeholder="e.g., Meet ${per1.name} & ${per2.name}!"
              rows={3}
              value={formData.subject}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subject: e.currentTarget.value,
                })
              }
            />
            <Textarea
              label="Body (use ${variable} syntax)"
              placeholder="e.g., Hi ${per1.name}, meet your match ${per2.name}..."
              rows={6}
              value={formData.body}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  body: e.currentTarget.value,
                })
              }
            />
            <Box
              p="md"
              style={{ backgroundColor: "#f5f5f5", borderRadius: "4px" }}
            >
              <Text size="xs" fw={600} mb="xs" c="dimmed">
                AVAILABLE VARIABLES
              </Text>
              <Text
                size="xs"
                style={{ fontFamily: "monospace", lineHeight: 1.6 }}
              >
                {/* Per-side variables */}
                <Text>per1.name, per1.email, per1.bio</Text>
                <Text>per1.industry, per1.role, per1.topics</Text>
                <Text>per1.linkedUrl</Text>
                <Text mt="xs">per2.name, per2.email, per2.bio</Text>
                <Text>per2.industry, per2.role, per2.topics</Text>
                <Text>per2.linkedUrl</Text>
                <Text mt="xs">period, year, (shared vars)</Text>
              </Text>
            </Box>
            <Group>
              <Button onClick={handlePreviewTemplate} variant="light" fullWidth>
                Preview Template
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!formData.name || !formData.subject || !formData.body}
                loading={createMutation.isPending}
                fullWidth
              >
                Create Template
              </Button>
            </Group>
          </Stack>
          <Box w="60%">
            {previewData !== null && previewData.length > 0 && (
              <Stack>
                <Text fw={600} size="sm">
                  Preview
                </Text>
                <EmailPreviewer
                  previews={previewData}
                  setPreviews={setPreviewData}
                  request={null}
                />
              </Stack>
            )}
          </Box>
        </Flex>
      </Tabs.Panel>
      <Modal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Quick Create Template"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="e.g., Monthly Pairing"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.currentTarget.value,
              })
            }
          />
          <Textarea
            label="Subject"
            placeholder="e.g., Meet ${per1.name} & ${per2.name}!"
            rows={2}
            value={formData.subject}
            onChange={(e) =>
              setFormData({
                ...formData,
                subject: e.currentTarget.value,
              })
            }
          />
          <Textarea
            label="Body"
            placeholder="e.g., Hi ${per1.name}, meet your match..."
            rows={4}
            value={formData.body}
            onChange={(e) =>
              setFormData({
                ...formData,
                body: e.currentTarget.value,
              })
            }
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formData.name || !formData.subject || !formData.body}
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Tabs>
  );
}
