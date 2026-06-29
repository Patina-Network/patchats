import type {
  SendRequest,
  MessagePreview,
} from "@/features/emails/dto/EmailDto";

export async function sendToEmailApi(body: unknown) {
  const response = await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
  // The backend wraps the result in ApiResponder: { success, message, payload: { previews: [...] } }.
  // Unwrap to the MessagePreview[] that EmailPreview expects.
  const json = (await response.json()) as {
    payload: { previews: MessagePreview[] };
  };
  return json.payload.previews;
}
