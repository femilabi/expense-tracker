import {
  Button,
  EmailLayout,
  Heading,
  LinkFallback,
  Muted,
  Paragraph,
} from "@/emails/components";
import { renderEmail } from "@/emails/render";
import type { EmailTemplate } from "@/emails/utils";

/**
 * There's no name greeting: this goes to an address the account doesn't use
 * yet, which may not belong to the account's owner.
 */
export type EmailChangeVerificationEmailInput = {
  /** The new address the user wants to switch to. */
  newEmail: string;
  /** Absolute link to the confirm page, including the token. */
  confirmUrl: string;
  /** How long the link stays valid. */
  expiresInMinutes: number;
};

export function EmailChangeVerificationEmail({
  newEmail,
  confirmUrl,
  expiresInMinutes,
}: EmailChangeVerificationEmailInput) {
  return (
    <EmailLayout>
      <Heading>Confirm your new email</Heading>
      <Paragraph>
        We received a request to change the email on an Expense Tracker account
        to <strong>{newEmail}</strong>.
      </Paragraph>
      <Paragraph>If that was you, confirm the change:</Paragraph>
      <Button href={confirmUrl}>Confirm new email</Button>
      <Muted>
        This link expires in {expiresInMinutes} minutes and can only be used
        once. Until you confirm, the account keeps using its current email.
      </Muted>
      <LinkFallback href={confirmUrl} />
      <Muted>
        If it wasn&apos;t you, you can safely ignore this email. Nothing will
        change.
      </Muted>
    </EmailLayout>
  );
}

/** Sent to the new address so the user can confirm the email change. */
export function emailChangeVerificationEmail(
  input: EmailChangeVerificationEmailInput,
): EmailTemplate {
  return {
    subject: "Confirm your new Expense Tracker email",
    html: renderEmail(<EmailChangeVerificationEmail {...input} />),
    text: [
      "Confirm your new Expense Tracker email",
      "",
      `We received a request to change the email on an Expense Tracker account to ${input.newEmail}.`,
      "",
      `If that was you, open this link to confirm: ${input.confirmUrl}`,
      "",
      `This link expires in ${input.expiresInMinutes} minutes and can only be used once.`,
      "Until you confirm, the account keeps using its current email.",
      "If it wasn't you, you can safely ignore this email. Nothing will change.",
    ].join("\n"),
  };
}
