/**
 * Chat widget backend — default POST `/api/chat`.
 * Override with `VITE_CHAT_API_URL` (full URL) when not using same-origin /api (e.g. edge function URL).
 */
export function getChatApiUrl(): string {
  const raw = import.meta.env.VITE_CHAT_API_URL?.trim();
  if (raw) return raw;
  return '/api/chat';
}
