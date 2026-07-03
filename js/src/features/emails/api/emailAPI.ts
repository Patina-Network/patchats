import type {
  SendRequest,
  MessagePreview,
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
  body: SendRequest,
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
