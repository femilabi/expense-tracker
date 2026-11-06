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

export type PasswordResetEmailInput = {
  name: string;
  /** Absolute link to the reset page, including the token. */
  resetUrl: string;
  /** How long the link stays valid. */
  expiresInMinutes: number;
};

export function PasswordResetEmail({
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput) {
  return (
    <EmailLayout>
      <Heading>Reset your password</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, we received a request to reset the password for
        your Expense Tracker account.
      </Paragraph>
      <Button href={resetUrl}>Choose a new password</Button>
      <Muted>
        This link expires in {expiresInMinutes} minutes and can only be used
        once. After you reset your password, you will be signed out on every
        device.
      </Muted>
      <LinkFallback href={resetUrl} />
      <Muted>
        If you didn&apos;t ask to reset your password, you can safely ignore
        this email. Your password won&apos;t change.
      </Muted>
    </EmailLayout>
  );
}

/** Sent when the user asks to reset a forgotten password. */
export function passwordResetEmail(
  input: PasswordResetEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Reset your Expense Tracker password",
    html: renderEmail(<PasswordResetEmail {...input} />),
    text: [
      "Reset your Expense Tracker password",
      "",
      `Hi ${firstName}, we received a request to reset the password for your Expense Tracker account.`,
      "",
      `Open this link to choose a new password: ${input.resetUrl}`,
      "",
      `This link expires in ${input.expiresInMinutes} minutes and can only be used once.`,
      "After you reset your password, you will be signed out on every device.",
      "If you didn't ask to reset your password, you can safely ignore this email. Your password won't change.",
    ].join("\n"),
  };
}
