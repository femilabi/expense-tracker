import {
  Button,
  EmailLayout,
  Heading,
  LinkFallback,
  Muted,
  Paragraph,
} from "@/emails/components";
import { renderEmail } from "@/emails/render";
import { firstNameOf, type EmailTemplate } from "@/emails/utils";

export type EmailChangedEmailInput = {
  name: string;
  /** The address the account uses now. */
  newEmail: string;
  /** Absolute link to the undo page, including the token. */
  undoUrl: string;
  /** How long the undo link stays valid. */
  undoExpiresInDays: number;
  /** When the undo link stops working, already formatted for display. */
  undoExpiresAt: string;
};

export function EmailChangedEmail({
  name,
  newEmail,
  undoUrl,
  undoExpiresInDays,
  undoExpiresAt,
}: EmailChangedEmailInput) {
  return (
    <EmailLayout>
      <Heading>Your email was changed</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, the email address on your Expense Tracker
        account was changed to <strong>{newEmail}</strong>, and you were signed
        out on all your devices.
      </Paragraph>
      <Paragraph>If this wasn&apos;t you, undo the change:</Paragraph>
      <Button href={undoUrl}>Undo email change</Button>
      <Muted>
        This link can only be used once and expires in {undoExpiresInDays} days
        ({undoExpiresAt}).
      </Muted>
      <LinkFallback href={undoUrl} />
    </EmailLayout>
  );
}

/** Sent to the previous address after an email change, with the undo link. */
export function emailChangedEmail(
  input: EmailChangedEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Your Expense Tracker email was changed",
    html: renderEmail(<EmailChangedEmail {...input} />),
    text: [
      "Your Expense Tracker email was changed",
      "",
      `Hi ${firstName}, the email address on your Expense Tracker account was changed to ${input.newEmail}, and you were signed out on all your devices.`,
      "",
      `If this wasn't you, undo the change: ${input.undoUrl}`,
      "",
      `This link can only be used once and expires in ${input.undoExpiresInDays} days (${input.undoExpiresAt}).`,
    ].join("\n"),
  };
}
