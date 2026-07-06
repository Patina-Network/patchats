/**
 * Thin typed fetch wrapper over the backend API (proxied at `/api` in dev).
 *
 * Every backend response is wrapped in the ApiResponder envelope
 * (`{ success, message, payload }`); this is the single place that unwraps it,
 * so hooks receive typed payloads and errors carry the server's message.
 * Auth rides on an httpOnly session cookie, hence `credentials: "same-origin"`
 * (the SPA and API share an origin — the Vite proxy provides that in dev).
 *
 * CSRF: the backend sets a JS-readable `XSRF-TOKEN` cookie on every response;
 * state-changing requests must echo it back as an `X-XSRF-TOKEN` header
 * (double-submit pattern). The pre-auth endpoints (request-link, verify) are
 * exempt server-side, so a missing cookie on first visit is fine.
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

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function csrfHeader(method: string): Record<string, string> {
  if (method === "GET" || method === "HEAD") {
    return {};
  }
  const token = readCookie("XSRF-TOKEN");
  return token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {};
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeader(method),
      ...init?.headers,
    },
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
