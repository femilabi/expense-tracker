import { escapeHtml, firstNameOf, type EmailTemplate } from "@/emails/utils";

export type WelcomeEmailInput = {
  name: string;
  /** Absolute link to the dashboard, e.g. https://app.example.com/dashboard */
  dashboardUrl: string;
};

/** Welcomes the user after they sign in for the first time. */
export function welcomeEmail({
  name,
  dashboardUrl,
}: WelcomeEmailInput): EmailTemplate {
  const firstName = firstNameOf(name);
  const safeFirstName = escapeHtml(firstName);

  return {
    subject: "Welcome to Expense Tracker",
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Welcome, ${safeFirstName}!</h1>
        <p>Thanks for signing in to Expense Tracker. Here is how to get started:</p>
        <ul style="padding-left: 20px; line-height: 1.6;">
          <li><strong>Add your income</strong> so you can see what is left to spend.</li>
          <li><strong>Log your expenses</strong> and sort them into categories.</li>
          <li><strong>Set monthly budgets</strong> per category and track your progress.</li>
          <li><strong>Pick your currency</strong> in your profile settings.</li>
        </ul>
        <p>
          <a href="${dashboardUrl}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Go to your dashboard
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If the button does not work, copy this link into your browser:<br />
          ${dashboardUrl}
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If you did not create this account, reset your password or contact support.
        </p>
      </div>
    `,
    text: [
      `Welcome to Expense Tracker, ${firstName}!`,
      "",
      "Thanks for signing in. Here is how to get started:",
      "- Add your income so you can see what is left to spend.",
      "- Log your expenses and sort them into categories.",
      "- Set monthly budgets per category and track your progress.",
      "- Pick your currency in your profile settings.",
      "",
      `Go to your dashboard: ${dashboardUrl}`,
      "",
      "If you did not create this account, reset your password or contact support.",
    ].join("\n"),
  };
}
