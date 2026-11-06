import { EmailLayout, Heading, Muted, Paragraph } from "@/emails/components";
import { renderEmail } from "@/emails/render";
import { firstNameOf, type EmailTemplate } from "@/emails/utils";

export type EmailChangeCompletedEmailInput = {
  name: string;
  /** The address the account uses now. */
  newEmail: string;
  /** How long the previous address can undo the change. */
  undoExpiresInDays: number;
};

export function EmailChangeCompletedEmail({
  name,
  newEmail,
  undoExpiresInDays,
}: EmailChangeCompletedEmailInput) {
  return (
    <EmailLayout>
      <Heading>Your email is updated</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, your Expense Tracker account now uses{" "}
        <strong>{newEmail}</strong>. Use this address the next time you log in.
      </Paragraph>
      <Muted>
        We&apos;ve also emailed your previous address. The change can be undone
        from there for the next {undoExpiresInDays} days.
      </Muted>
    </EmailLayout>
  );
}

/** Sent to the new address once the email change is confirmed. */
export function emailChangeCompletedEmail(
  input: EmailChangeCompletedEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Your Expense Tracker email is updated",
    html: renderEmail(<EmailChangeCompletedEmail {...input} />),
    text: [
      "Your Expense Tracker email is updated",
      "",
      `Hi ${firstName}, your Expense Tracker account now uses ${input.newEmail}. Use this address the next time you log in.`,
      `We've also emailed your previous address. The change can be undone from there for the next ${input.undoExpiresInDays} days.`,
    ].join("\n"),
  };
}
