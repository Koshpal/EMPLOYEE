/** Server-provided message from an axios-style error, or `fallback` when there isn't one. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: unknown } } } | null)?.response?.data?.message;
  if (typeof msg === 'string' && msg) return msg;
  if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
  return fallback;
}
