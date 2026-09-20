export class ApiError extends Error {}

async function errorMessage(res: Response): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  const message = (data as { error?: unknown } | null)?.error;
  return typeof message === "string" ? message : `Request failed (${res.status})`;
}

export async function submitRecord<T>(url: string, method: "POST" | "PUT", body: T): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(await errorMessage(res));
  return (await res.json()) as T;
}

export async function deleteRecord(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new ApiError(await errorMessage(res));
}
