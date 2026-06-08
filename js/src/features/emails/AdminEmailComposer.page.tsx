import {
  buildEmailRequest,
  countRecipients,
  getMessageVariables,
  renderTemplate,
  SendEmailResponse,
} from "@/features/emails/api/buildEmailRequest";
import {
  getTemplate,
  isSelectableEmailTemplateName,
  selectableEmailTemplateNames,
} from "@/features/emails/api/EmailTemplate";
import {
  emailComposerSchema,
  EmailComposerValues,
} from "@/features/emails/api/schemas";
import { useSendAdminEmail } from "@/features/emails/api/useSendAdminEmail";
import { useTemplateAudience } from "@/features/emails/api/useTemplateAudience";
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconEyeCheck,
  IconFileText,
  IconMail,
  IconSend,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import { zodResolver } from "mantine-form-zod-resolver";
import { useMemo, useState } from "react";

const initialValues: EmailComposerValues = {
  templateName: "",
};

function formatCount(value: number) {
  return value.toLocaleString();
}

function getRecipientLabel(audience: "all-users" | "matched-pairs") {
  return audience === "all-users" ? "All users" : "Matched users";
}

function getRecipientIcon(audience: "all-users" | "matched-pairs") {
  return audience === "all-users" ?
      <IconUsers size={18} />
    : <IconUserCheck size={18} />;
}

function getFailedResults(sendResult: SendEmailResponse | null) {
  return sendResult?.results.filter((result) => !result.sent) ?? [];
}

export default function AdminEmailComposerPage() {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [sendResult, setSendResult] = useState<SendEmailResponse | null>(null);
  const form = useForm<EmailComposerValues>({
    initialValues,
    validate: zodResolver(emailComposerSchema),
  });
  const selectedTemplateName =
    isSelectableEmailTemplateName(form.values.templateName) ?
      form.values.templateName
    : undefined;
  const selectedTemplate =
    selectedTemplateName ? getTemplate(selectedTemplateName) : undefined;
  const {
    data: templateAudience,
    error: templateAudienceError,
    isError: isTemplateAudienceError,
    isPending: isTemplateAudienceQueryPending,
  } = useTemplateAudience(selectedTemplateName);
  const isTemplateAudiencePending =
    selectedTemplateName !== undefined && isTemplateAudienceQueryPending;
  const sendEmail = useSendAdminEmail();

  const emailRequest = useMemo(
    () =>
      selectedTemplate && templateAudience ?
        buildEmailRequest(selectedTemplate, templateAudience)
      : undefined,
    [selectedTemplate, templateAudience],
  );
  const previewMessage = emailRequest?.messages[0];
  const previewVariables =
    previewMessage ? getMessageVariables(previewMessage) : undefined;
  const previewSubject =
    selectedTemplate && previewVariables ?
      renderTemplate(selectedTemplate.subject, previewVariables)
    : "Subject";
  const previewBody =
    selectedTemplate && previewVariables ?
      renderTemplate(selectedTemplate.body, previewVariables)
    : "Plain text body";
  const recipientCount =
    emailRequest ? countRecipients(emailRequest.messages) : 0;
  const recipientLabel =
    templateAudience ?
      getRecipientLabel(templateAudience.audience)
    : "Recipients";
  const failedResults = getFailedResults(sendResult);

  const openConfirmation = () => {
    const validation = form.validate();

    if (!validation.hasErrors && emailRequest) {
      setIsConfirmationOpen(true);
    }
  };

  const handleTemplateChange = (templateName: string | null) => {
    form.setFieldValue("templateName", templateName ?? "");
    setSendResult(null);
  };

  const confirmSend = async () => {
    if (!emailRequest) {
      return;
    }

    const result = await sendEmail.mutateAsync(emailRequest);

    setIsConfirmationOpen(false);
    setSendResult(result);
    notifications.show({
      color: result.failed > 0 ? "yellow" : "green",
      icon: <IconCheck size={18} />,
      message: `Sent ${result.sent}, failed ${result.failed}`,
      title: "Email send complete",
    });
  };

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>Emails</Title>
            <Text c="dimmed">Composer</Text>
          </Stack>
          {sendResult ?
            <Badge
              color={sendResult.failed > 0 ? "yellow" : "green"}
              leftSection={<IconCheck size={12} />}
            >
              Sent
            </Badge>
          : null}
        </Group>
        {sendResult ?
          <Alert
            color={sendResult.failed > 0 ? "yellow" : "green"}
            icon={<IconCheck size={18} />}
            title={
              sendResult.failed > 0 ?
                "Email send completed with failures"
              : "Email send complete"
            }
          >
            <Stack gap="xs">
              <Text>
                Sent {sendResult.sent}, failed {sendResult.failed}
              </Text>
              {failedResults.length > 0 ?
                <Stack gap={4}>
                  <Text fw={600}>Failed recipients</Text>
                  {failedResults.map((result) => (
                    <Text component="code" key={result.recipients.join(",")}>
                      {result.recipients.join(", ")}
                      {result.error ? `: ${result.error}` : ""}
                    </Text>
                  ))}
                </Stack>
              : null}
            </Stack>
          </Alert>
        : null}
        {sendEmail.isError ?
          <Alert color="red" title="Email send failed">
            {sendEmail.error.message}
          </Alert>
        : null}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" verticalSpacing="lg">
          <Card>
            <Stack gap="md">
              <Stack gap={6}>
                <Group gap="xs">
                  <IconFileText size={18} />
                  <Text fw={700}>Email template</Text>
                </Group>
                <Select
                  data={selectableEmailTemplateNames}
                  error={form.errors.templateName}
                  label="Email template"
                  placeholder="Select email template"
                  required
                  value={form.values.templateName}
                  onChange={handleTemplateChange}
                />
              </Stack>
              {isTemplateAudiencePending ?
                <Group gap="sm">
                  <Loader size="sm" />
                  <Text c="dimmed" size="sm">
                    Loading recipients
                  </Text>
                </Group>
              : null}
              {isTemplateAudienceError ?
                <Alert color="red" title="Recipients unavailable">
                  {templateAudienceError.message}
                </Alert>
              : null}
              {templateAudience && emailRequest ?
                <Group
                  justify="space-between"
                  gap="sm"
                  p="sm"
                  style={{
                    border: "1px solid var(--mantine-color-dark-4)",
                    borderRadius: "var(--mantine-radius-sm)",
                  }}
                >
                  <Group gap="sm">
                    {getRecipientIcon(templateAudience.audience)}
                    <Stack gap={2}>
                      <Text fw={600}>{recipientLabel}</Text>
                      <Text c="dimmed" size="sm">
                        {emailRequest.messages.length} messages
                      </Text>
                    </Stack>
                  </Group>
                  <Badge color="patina" size="lg">
                    {formatCount(recipientCount)}
                  </Badge>
                </Group>
              : null}
              <Divider />
              <TextInput
                label="Subject"
                readOnly
                value={selectedTemplate?.subject ?? ""}
              />
              <Textarea
                autosize
                label="Plain text body"
                minRows={12}
                readOnly
                value={selectedTemplate?.body ?? ""}
              />
              <Group justify="flex-end">
                <Button
                  disabled={
                    isTemplateAudiencePending ||
                    (selectedTemplateName !== undefined && !emailRequest)
                  }
                  leftSection={<IconEyeCheck size={18} />}
                  onClick={openConfirmation}
                >
                  Review send
                </Button>
              </Group>
            </Stack>
          </Card>
          <Card>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={700}>Preview</Text>
                <IconMail size={20} />
              </Group>
              <Stack gap="xs">
                <Text c="dimmed" size="sm">
                  To
                </Text>
                <Text fw={600}>{recipientLabel}</Text>
                {emailRequest ?
                  <Text c="dimmed" size="sm">
                    {formatCount(recipientCount)} recipients
                  </Text>
                : null}
              </Stack>
              <Divider />
              <Stack gap="xs">
                <Text c="dimmed" size="sm">
                  Reply-to
                </Text>
                <Text fw={600}>
                  {selectedTemplate?.replyTo ?? "Default sender"}
                </Text>
              </Stack>
              <Stack gap="xs">
                <Text c="dimmed" size="sm">
                  Subject
                </Text>
                <Text fw={600}>{previewSubject}</Text>
              </Stack>
              <Divider />
              <Text
                component="pre"
                ff="inherit"
                m={0}
                style={{
                  minHeight: 280,
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                }}
              >
                {previewBody}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
      <Modal
        centered
        onClose={() => setIsConfirmationOpen(false)}
        opened={isConfirmationOpen}
        title="Confirm send"
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text c="dimmed">Recipient type</Text>
            <Text fw={700}>{recipientLabel}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">Estimated count</Text>
            <Text fw={700}>{formatCount(recipientCount)}</Text>
          </Group>
          <Group justify="space-between" align="flex-start">
            <Text c="dimmed">Subject</Text>
            <Text fw={700} ta="right">
              {previewSubject}
            </Text>
          </Group>
          <Divider />
          <Group justify="flex-end">
            <Button
              color="gray"
              disabled={sendEmail.isPending}
              onClick={() => setIsConfirmationOpen(false)}
              variant="subtle"
            >
              Cancel
            </Button>
            <Button
              leftSection={<IconSend size={18} />}
              loading={sendEmail.isPending}
              onClick={() => void confirmSend()}
            >
              Send email
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
