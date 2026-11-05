import {
  CodeBox,
  EmailLayout,
  Heading,
  Muted,
  Paragraph,
} from "@/emails/components";
import { renderEmail } from "@/emails/render";
import { firstNameOf, type EmailTemplate } from "@/emails/utils";

export type VerificationCodeEmailInput = {
  name: string;
  /** The one-time code, e.g. "482913". */
  code: string;
  /** How long the code stays valid. */
  expiresInMinutes: number;
};

export function VerificationCodeEmail({
  name,
  code,
  expiresInMinutes,
}: VerificationCodeEmailInput) {
  return (
    <EmailLayout>
      <Heading>Verify your email</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, enter this code to finish creating your Expense
        Tracker account:
      </Paragraph>
      <CodeBox code={code} />
      <Muted>
        This code expires in {expiresInMinutes} minutes and can only be used
        once.
      </Muted>
      <Muted>
        Never share this code with anyone. Expense Tracker will never ask you
        for it.
      </Muted>
      <Muted>
        If you didn&apos;t try to sign up, you can safely ignore this email.
      </Muted>
    </EmailLayout>
  );
}

/** Sends the user a one-time code to verify their email address. */
export function verificationCodeEmail(
  input: VerificationCodeEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: `${input.code} is your Expense Tracker verification code`,
    html: renderEmail(<VerificationCodeEmail {...input} />),
    text: [
      "Verify your Expense Tracker email",
      "",
      `Hi ${firstName}, enter this code to finish creating your account:`,
      "",
      input.code,
      "",
      `This code expires in ${input.expiresInMinutes} minutes and can only be used once.`,
      "Never share this code with anyone. Expense Tracker will never ask you for it.",
      "If you didn't try to sign up, you can safely ignore this email.",
    ].join("\n"),
  };
}
