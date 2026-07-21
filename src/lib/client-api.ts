export async function apiRequest<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Ошибка запроса: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
