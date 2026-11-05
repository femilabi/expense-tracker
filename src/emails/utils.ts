/** A rendered email, ready to hand to the sender. */
export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

/** Escapes text before it goes in HTML. The renderer applies it to all content. */
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
