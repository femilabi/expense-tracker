import {
  Button,
  EmailLayout,
  Heading,
  LinkFallback,
  Paragraph,
} from "@/emails/components";
import { renderEmail } from "@/emails/render";
import { firstNameOf, type EmailTemplate } from "@/emails/utils";

export type PasswordChangedEmailInput = {
  name: string;
  /** Absolute link to the forgot-password page. */
  resetUrl: string;
};

export function PasswordChangedEmail({
  name,
  resetUrl,
}: PasswordChangedEmailInput) {
  return (
    <EmailLayout>
      <Heading>Your password was changed</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, the password for your Expense Tracker account
        was just changed. Any other devices that were signed in to your account
        have been signed out.
      </Paragraph>
      <Paragraph>If this wasn&apos;t you, reset your password now:</Paragraph>
      <Button href={resetUrl}>Reset password</Button>
      <LinkFallback href={resetUrl} />
    </EmailLayout>
  );
}

/** Sent after a password change and after a password reset. */
export function passwordChangedEmail(
  input: PasswordChangedEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Your Expense Tracker password was changed",
    html: renderEmail(<PasswordChangedEmail {...input} />),
    text: [
      "Your Expense Tracker password was changed",
      "",
      `Hi ${firstName}, the password for your Expense Tracker account was just changed. Any other devices that were signed in to your account have been signed out.`,
      "",
      `If this wasn't you, reset your password now: ${input.resetUrl}`,
    ].join("\n"),
  };
}
