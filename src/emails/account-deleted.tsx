import { EmailLayout, Heading, Muted, Paragraph } from "@/emails/components";
import { renderEmail } from "@/emails/render";
import { firstNameOf, type EmailTemplate } from "@/emails/utils";

export type AccountDeletedEmailInput = {
  name: string;
};

export function AccountDeletedEmail({ name }: AccountDeletedEmailInput) {
  return (
    <EmailLayout>
      <Heading>Your account was deleted</Heading>
      <Paragraph>
        Hi {firstNameOf(name)}, your Expense Tracker account and all of its data
        were permanently deleted, and you were signed out on every device. This
        can&apos;t be undone.
      </Paragraph>
      <Muted>
        If this wasn&apos;t you, someone else knew your password. Change it on
        any other site where you use the same password.
      </Muted>
    </EmailLayout>
  );
}

/** Sent once the account and all of its data are gone. */
export function accountDeletedEmail(
  input: AccountDeletedEmailInput,
): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Your Expense Tracker account was deleted",
    html: renderEmail(<AccountDeletedEmail {...input} />),
    text: [
      "Your Expense Tracker account was deleted",
      "",
      `Hi ${firstName}, your Expense Tracker account and all of its data were permanently deleted, and you were signed out on every device. This can't be undone.`,
      "",
      "If this wasn't you, someone else knew your password. Change it on any other site where you use the same password.",
    ].join("\n"),
  };
}
