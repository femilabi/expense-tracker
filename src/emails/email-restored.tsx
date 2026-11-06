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

export type EmailRestoredEmailInput = {
  name: string;
  /** The original address the account uses again. */
  restoredEmail: string;
  /** Absolute link to the reset page, including the token. */
  resetUrl: string;
  /** How long the reset link stays valid. */
  resetExpiresInMinutes: number;
  /** Absolute link to the forgot-password page, for when the link expires. */
  forgotPasswordUrl: string;
};

export function EmailRestoredEmail({
  name,
  restoredEmail,
  resetUrl,
  resetExpiresInMinutes,
  forgotPasswordUrl,
}: EmailRestoredEmailInput) {
  return (
    <EmailLayout>
      <Heading>Your email was restored</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, your Expense Tracker account uses{" "}
        <strong>{restoredEmail}</strong> again, and you were signed out on all
        your devices.
      </Paragraph>
      <Paragraph>
        Whoever changed your email may know your password, so we recommend
        resetting it now:
      </Paragraph>
      <Button href={resetUrl}>Reset password</Button>
      <Muted>
        This link expires in {resetExpiresInMinutes} minutes. After that, you
        can request a new one at {forgotPasswordUrl}
      </Muted>
      <LinkFallback href={resetUrl} />
    </EmailLayout>
  );
}

/** Sent to the restored address after an email change is undone. */
export function emailRestoredEmail(
  input: EmailRestoredEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Your Expense Tracker email was restored",
    html: renderEmail(<EmailRestoredEmail {...input} />),
    text: [
      "Your Expense Tracker email was restored",
      "",
      `Hi ${firstName}, your Expense Tracker account uses ${input.restoredEmail} again, and you were signed out on all your devices.`,
      "Whoever changed your email may know your password, so we recommend resetting it now.",
      "",
      `Reset your password: ${input.resetUrl}`,
      `This link expires in ${input.resetExpiresInMinutes} minutes. After that, you can request a new one at ${input.forgotPasswordUrl}`,
    ].join("\n"),
  };
}
