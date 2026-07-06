/**
 * Thin typed fetch wrapper over the backend API (proxied at `/api` in dev).
 *
 * Every backend response is wrapped in the ApiResponder envelope
 * (`{ success, message, payload }`); this is the single place that unwraps it,
 * so hooks receive typed payloads and errors carry the server's message.
 * Auth rides on an httpOnly session cookie, hence `credentials: "same-origin"`
 * (the SPA and API share an origin — the Vite proxy provides that in dev).
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  payload?: T;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const envelope = (await response.json().catch(() => undefined)) as
    | ApiEnvelope<T>
    | undefined;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      envelope?.message ?? `Request to ${path} failed`,
    );
  }

  return envelope?.payload as T;
}
