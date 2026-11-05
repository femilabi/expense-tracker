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

export type EmailChangeVerificationEmailInput = {
  name: string;
  /** The new address the user wants to switch to. */
  newEmail: string;
  /** Absolute link to the confirm page, including the token. */
  confirmUrl: string;
  /** How long the link stays valid. */
  expiresInMinutes: number;
};

export function EmailChangeVerificationEmail({
  name,
  newEmail,
  confirmUrl,
  expiresInMinutes,
}: EmailChangeVerificationEmailInput) {
  return (
    <EmailLayout>
      <Heading>Confirm your new email</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, you asked to change the email of your Expense
        Tracker account to <strong>{newEmail}</strong>.
      </Paragraph>
      <Paragraph>Confirm the change to start using this address:</Paragraph>
      <Button href={confirmUrl}>Confirm new email</Button>
      <Muted>
        This link expires in {expiresInMinutes} minutes and can only be used
        once. Until you confirm, your account keeps using your current email.
      </Muted>
      <LinkFallback href={confirmUrl} />
      <Muted>
        If you did not ask for this you can safely ignore this email.
      </Muted>
    </EmailLayout>
  );
}

/** Sent to the new address so the user can confirm the email change. */
export function emailChangeVerificationEmail(
  input: EmailChangeVerificationEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Confirm your new Expense Tracker email",
    html: renderEmail(<EmailChangeVerificationEmail {...input} />),
    text: [
      "Confirm your new Expense Tracker email",
      "",
      `Hi ${firstName}, you asked to change the email of your Expense Tracker account to ${input.newEmail}.`,
      "",
      `Open this link to confirm: ${input.confirmUrl}`,
      "",
      `This link expires in ${input.expiresInMinutes} minutes and can only be used once.`,
      "Until you confirm, your account keeps using your current email.",
      "If you did not ask for this you can safely ignore this email.",
    ].join("\n"),
  };
}
