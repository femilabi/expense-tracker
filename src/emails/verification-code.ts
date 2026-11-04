import { escapeHtml, firstNameOf, type EmailTemplate } from "@/emails/utils";

export type VerificationCodeEmailInput = {
  name: string;
  /** The one-time code, e.g. "482913". */
  code: string;
  /** How long the code stays valid. */
  expiresInMinutes: number;
};

/** Sends the user a one-time code to verify their email address. */
export function verificationCodeEmail({
  name,
  code,
  expiresInMinutes,
}: VerificationCodeEmailInput): EmailTemplate {
  const firstName = firstNameOf(name);
  const safeFirstName = escapeHtml(firstName);
  const safeCode = escapeHtml(code);

  return {
    subject: `${code} is your Expense Tracker verification code`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Verify your email</h1>
        <p>Hi ${safeFirstName}, enter this code to verify your Expense Tracker account:</p>
        <p style="font-size: 32px;font-weight: bold;letter-spacing: 8px;font-family: 'Courier New', Courier, monospace;background:#f0f4f8;border-radius:12px;padding:16px 24px;display:inline-block;margin: 8px 0;">
          ${safeCode}
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This code expires in ${expiresInMinutes} minutes and can only be used once.
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          Never share this code with anyone. Expense Tracker will never ask you for it.
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If you did not create an account you can safely ignore this email.
        </p>
      </div>
    `,
    text: [
      "Verify your Expense Tracker email",
      "",
      `Hi ${firstName}, enter this code to verify your account:`,
      "",
      code,
      "",
      `This code expires in ${expiresInMinutes} minutes and can only be used once.`,
      "Never share this code with anyone. Expense Tracker will never ask you for it.",
      "If you did not create an account you can safely ignore this email.",
    ].join("\n"),
  };
}
