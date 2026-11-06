import { EmailLayout, Heading, Muted, Paragraph } from "@/emails/components";
import { renderEmail } from "@/emails/render";
import type { EmailTemplate } from "@/emails/utils";

/**
 * There's no name greeting and no reset link: this address may belong to
 * whoever made the change that was undone.
 */
export function EmailRemovedEmail() {
  return (
    <EmailLayout>
      <Heading>This email was removed from an account</Heading>
      <Paragraph>
        A recent email change on an Expense Tracker account was undone, so this
        address is no longer used to log in to it.
      </Paragraph>
      <Muted>Every device signed in to that account was signed out.</Muted>
    </EmailLayout>
  );
}

/** Sent to the replaced address after an email change is undone. */
export function emailRemovedEmail(): EmailTemplate {
  return {
    subject: "This email was removed from an Expense Tracker account",
    html: renderEmail(<EmailRemovedEmail />),
    text: [
      "This email was removed from an Expense Tracker account",
      "",
      "A recent email change on an Expense Tracker account was undone, so this address is no longer used to log in to it.",
      "Every device signed in to that account was signed out.",
    ].join("\n"),
  };
}
