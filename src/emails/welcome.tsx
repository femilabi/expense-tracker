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

export type WelcomeEmailInput = {
  name: string;
  /** Absolute link to the dashboard, e.g. https://app.example.com/dashboard */
  dashboardUrl: string;
};

const steps = [
  ["Add your income", "so you can see what is left to spend."],
  ["Log your expenses", "and sort them into categories."],
  ["Set monthly budgets", "per category and track your progress."],
  ["Pick your currency", "in your profile settings."],
] as const;

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailInput) {
  return (
    <EmailLayout>
      <Heading>Welcome, {firstNameOf(name)}!</Heading>
      <Paragraph>
        Thanks for signing up for Expense Tracker. Here&apos;s how to get
        started:
      </Paragraph>
      <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
        {steps.map(([title, rest]) => (
          <li key={title}>
            <strong>{title}</strong> {rest}
          </li>
        ))}
      </ul>
      <Button href={dashboardUrl}>Go to your dashboard</Button>
      <LinkFallback href={dashboardUrl} />
      <Muted>
        If you didn&apos;t create this account, reset its password with
        &quot;Forgot password?&quot; on the login page.
      </Muted>
    </EmailLayout>
  );
}

/** Welcomes the user once their email is verified and the account exists. */
export function welcomeEmail(input: WelcomeEmailInput): EmailTemplate {
  const firstName = firstNameOf(input.name);

  return {
    subject: "Welcome to Expense Tracker",
    html: renderEmail(<WelcomeEmail {...input} />),
    text: [
      `Welcome to Expense Tracker, ${firstName}!`,
      "",
      "Thanks for signing up. Here's how to get started:",
      ...steps.map(([title, rest]) => `- ${title} ${rest}`),
      "",
      `Go to your dashboard: ${input.dashboardUrl}`,
      "",
      'If you didn\'t create this account, reset its password with "Forgot password?" on the login page.',
    ].join("\n"),
  };
}
