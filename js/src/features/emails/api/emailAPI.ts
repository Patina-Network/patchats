import type {
  SendAsyncRequest,
  SendRequest,
  MessagePreview,
  EnqueueEmailRequest,
  EnqueueEmailResponse,
  EmailProgress,
  EmailRequestSummary,
  EmailTemplate,
  MatchingSendRequest,
} from "@/features/emails/dto/emailDto";

export async function sendToEmailApi(body: unknown) {
  const response = await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Email API failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

export async function sendToPreviewApi(
  body: SendAsyncRequest,
): Promise<MessagePreview[] | null> {
  const response = await fetch("/api/email/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Preview API failed: ${response.status} ${response.statusText}`,
    );
  }
  // The backend wraps the result in ApiResponder: { success, message, payload: { previews: [...] } }.
  // Unwrap to the MessagePreview[] that EmailPreview expects.
  const json = (await response.json()) as {
    payload: { previews: MessagePreview[] };
  };
  return json.payload.previews;
}

export async function sendToLegacyPreviewApi(
  body: SendRequest,
): Promise<MessagePreview[] | null> {
  const response = await fetch("/api/email/preview/legacy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Legacy preview API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: { previews: MessagePreview[] };
  };
  return json.payload.previews;
}

// Async email API functions

export async function enqueueEmails(
  body: EnqueueEmailRequest,
): Promise<EnqueueEmailResponse> {
  const response = await fetch("/api/email/send/async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Enqueue API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: EnqueueEmailResponse;
  };
  return json.payload;
}

export async function getProgress(requestId: string): Promise<EmailProgress> {
  const response = await fetch(`/api/email/progress?requestId=${requestId}`);
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
  const response = await fetch("/api/email/requests");
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
  const response = await fetch(`/api/email/${emailId}/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Resend API failed: ${response.status} ${response.statusText}`,
    );
  }
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch("/api/email/templates");
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
  const response = await fetch("/api/email/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Process API failed: ${response.status} ${response.statusText}`,
    );
  }
}

export async function sendMatchingEmails(
  body: MatchingSendRequest,
): Promise<EnqueueEmailResponse> {
  const response = await fetch("/api/email/matching/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Matching send API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: EnqueueEmailResponse;
  };
  return json.payload;
}

export async function createTemplate(body: {
  name: string;
  subject: string;
  body: string;
}): Promise<EmailTemplate> {
  const response = await fetch("/api/email/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Create template API failed: ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as {
    payload: EmailTemplate;
  };
  return json.payload;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`/api/email/templates/${templateId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(
      `Delete template API failed: ${response.status} ${response.statusText}`,
    );
  }
}
