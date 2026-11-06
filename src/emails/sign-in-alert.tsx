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

export type SignInAlertEmailInput = {
  name: string;
  /** When the sign-in happened, already formatted for display. */
  signedInAt: string;
  /** A readable device name, e.g. "Edge on Windows". */
  device: string;
  ipAddress: string;
  /** Absolute link to the forgot-password page. */
  resetUrl: string;
};

export function SignInAlertEmail({
  name,
  signedInAt,
  device,
  ipAddress,
  resetUrl,
}: SignInAlertEmailInput) {
  return (
    <EmailLayout>
      <Heading>New sign-in to your account</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, someone just signed in to your Expense Tracker
        account.
      </Paragraph>
      <Muted>
        Time: {signedInAt}
        <br />
        Device: {device}
        <br />
        IP address: {ipAddress}
      </Muted>
      <Paragraph>
        If this was you, there&apos;s nothing you need to do.
      </Paragraph>
      <Paragraph>
        If it wasn&apos;t you, reset your password now. This will sign you out
        on every device.
      </Paragraph>
      <Button href={resetUrl}>Reset password</Button>
      <LinkFallback href={resetUrl} />
    </EmailLayout>
  );
}

/** Sent after every successful sign-in. */
export function signInAlertEmail(input: SignInAlertEmailInput): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "New sign-in to your Expense Tracker account",
    html: renderEmail(<SignInAlertEmail {...input} />),
    text: [
      "New sign-in to your Expense Tracker account",
      "",
      `Hi ${firstName}, someone just signed in to your Expense Tracker account.`,
      "",
      `Time: ${input.signedInAt}`,
      `Device: ${input.device}`,
      `IP address: ${input.ipAddress}`,
      "",
      "If this was you, there's nothing you need to do.",
      `If it wasn't you, reset your password now. This will sign you out on every device: ${input.resetUrl}`,
    ].join("\n"),
  };
}
