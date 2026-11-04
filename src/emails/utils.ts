/** A rendered email, ready to hand to the sender. */
export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

/** User input (names, email addresses) is escaped before it goes in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** First word of the user's name, or a friendly fallback. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}
