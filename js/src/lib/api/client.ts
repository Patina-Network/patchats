/**
 * Thin typed fetch wrapper over the backend API (proxied at `/api` in dev).
 *
 * This is the single place to handle JSON parsing, error mapping, and (later)
 * auth headers. Once `schema.d.ts` is generated from the OpenAPI spec, the
 * generics here can be tightened against `paths`.
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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed`);
  }

  return response.json() as Promise<T>;
}
