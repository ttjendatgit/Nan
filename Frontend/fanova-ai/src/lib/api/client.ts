const API_BASE_URL =
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
      if (body?.message) message = body.message;
      else if (Array.isArray(body?.errors) && body.errors.length > 0) {
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
