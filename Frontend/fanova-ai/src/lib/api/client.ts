/** Exported for server-side helpers that need the raw HTTP status apiFetch doesn't expose (e.g.
 * lib/api/publicContent.ts telling a 404 apart from a 5xx). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      const hasSpecificErrors = Array.isArray(body?.errors) && body.errors.length > 0;
      // FluentValidation failures all share the same generic top-level message
      // ("Validation failed.") -- the actual field-level reason lives in `errors`,
      // so prefer that whenever it's present instead of the uninformative bucket text.
      if (hasSpecificErrors && (!body?.message || body.message === "Validation failed.")) {
        message = body.errors.join(" ");
      } else if (body?.message) {
        message = body.message;
      } else if (hasSpecificErrors) {
        message = body.errors[0];
      }
    } catch {
      // ignore JSON parse errors on error responses
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function getAuthHeaders(token?: string): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
