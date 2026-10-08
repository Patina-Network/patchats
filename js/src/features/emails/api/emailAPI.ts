import type {
  SendAsyncRequest,
  MessagePreview,
  EnqueueEmailRequest,
  EnqueueEmailResponse,
  EmailProgress,
  EmailRequestSummary,
  EmailTemplate,
} from "@/features/emails/dto/emailDto";

import { apiFetch, ApiResponder } from "@/lib/api/client";

interface SendEmailResponse {
  sent: number;
  failed: number;
}

export async function sendToEmailApi(
  body: unknown,
): Promise<ApiResponder<SendEmailResponse>> {
  return apiFetch<ApiResponder<SendEmailResponse>>("/admin/email/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Used in main email flow to preview emails with CSV data before sending.
 * @param body- The request body containing templateId, sample variables, and CSV data for the email preview.
 * @returns  preview of the email messages generated from the template ID with CSV data, or null if no previews are generated.
 * @throws Error if the API request fails or returns a non-OK response.
 */
export async function sendToPreviewApi(
  body: SendAsyncRequest,
): Promise<MessagePreview[] | null> {
  const response = await apiFetch<ApiResponder<{ previews: MessagePreview[] }>>(
    "/admin/email/preview",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return response.payload.previews;
}

// Async email API functions

export async function enqueueEmails(
  body: EnqueueEmailRequest,
): Promise<EnqueueEmailResponse> {
  const response = await apiFetch<ApiResponder<EnqueueEmailResponse>>(
    "/admin/email/send/async",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return response.payload;
}

export async function getProgress(requestId: string): Promise<EmailProgress> {
  const response = await fetch(
    `/api/admin/email/progress?requestId=${requestId}`,
  );
  if (!response.ok) {
    throw new Error(
      `Progress API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: EmailProgress;
  };
  return json.payload;
}

export async function listRequests(): Promise<EmailRequestSummary[]> {
  const response = await fetch("/api/admin/email/requests");
  if (!response.ok) {
    throw new Error(
      `Requests API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: EmailRequestSummary[];
  };
  return json.payload;
}

export async function resendEmail(emailId: string): Promise<void> {
  await apiFetch<ApiResponder<null>>(`/admin/email/${emailId}/resend`, {
    method: "POST",
  });
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch("/api/admin/email/templates");
  if (!response.ok) {
    throw new Error(
      `Templates API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: EmailTemplate[];
  };
  return json.payload;
}

export async function triggerProcess(): Promise<void> {
  await apiFetch<ApiResponder<null>>("/admin/email/process", {
    method: "POST",
  });
}

export async function createTemplate(body: {
  name: string;
  subject: string;
  body: string;
}): Promise<EmailTemplate> {
  const response = await apiFetch<ApiResponder<EmailTemplate>>(
    "/admin/email/templates",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return response.payload;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await apiFetch<ApiResponder<null>>(`/admin/email/templates/${templateId}`, {
    method: "DELETE",
  });
}
