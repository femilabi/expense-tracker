export { generateResetToken as generateEmailChangeToken } from "@/lib/reset-token";
export { hashResetToken as hashEmailChangeToken } from "@/lib/reset-token";

/** How long the verification link sent to the new address works. */
export const EMAIL_CHANGE_TOKEN_TTL_MS = 60 * 60 * 1000;

/** How long the old address can undo the change. */
export const EMAIL_CHANGE_UNDO_TTL_MS = 3 * 24 * 60 * 60 * 1000;

export function getEmailChangeExpiry(): Date {
  return new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS);
}

export function getEmailChangeUndoExpiry(): Date {
  return new Date(Date.now() + EMAIL_CHANGE_UNDO_TTL_MS);
}

/** Formats a date for emails and messages, e.g. "Thu, 5 Nov 2026, 14:00 UTC". */
export function formatExpiry(date: Date): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date)} UTC`;
}
