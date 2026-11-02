import { Resend } from "resend";

const RESET_SUBJECT = "Reset your Expense Tracker password";
const CONFIRMATION_SUBJECT = "Your Expense Tracker password was changed";
const ACCOUNT_DELETED_SUBJECT = "Your Expense Tracker account was deleted";
const EXPIRY_MINUTES = 15;

function getAppUrl(): string {
  const configured = process.env.APP_URL?.trim();
  const base =
    configured && configured.length > 0 ? configured : "http://localhost:3000";

  return base.replace(/\/+$/, "");
}

function getSender(): string {
  const configured = process.env.RESEND_FROM?.trim();

  return configured && configured.length > 0
    ? configured
    : "Expense Tracker <onboarding@resend.dev>";
}

export function buildPasswordResetLink(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Only used for the development fallback, never logged in production. */
  developmentDetails?: string;
};

async function sendEmail({
  to,
  subject,
  html,
  text,
  developmentDetails,
}: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] RESEND_API_KEY is missing, email not sent.");
    } else {
      console.warn(
        `[email] RESEND_API_KEY is missing, email not sent. ${developmentDetails ?? ""}`,
      );
    }
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getSender(),
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(`[email] Failed to send "${subject}": ${error.message}`);
    }
  } catch (error) {
    console.error(`[email] Failed to send "${subject}".`, error);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = buildPasswordResetLink(token);

  await sendEmail({
    to,
    subject: RESET_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Reset your password</h1>
        <p>We received a request to reset the password of your Expense Tracker account.</p>
        <p>
          <a href="${link}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Choose a new password
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This link expires in ${EXPIRY_MINUTES} minutes and can only be used once.
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If the button does not work, copy this link into your browser:<br />
          ${link}
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If you did not request a password reset you can safely ignore this email.
        </p>
      </div>
    `,
    text: [
      "Reset your Expense Tracker password",
      "",
      "We received a request to reset the password of your Expense Tracker account.",
      "",
      `Open this link to choose a new password: ${link}`,
      "",
      `This link expires in ${EXPIRY_MINUTES} minutes and can only be used once.`,
      "If you did not request a password reset you can safely ignore this email.",
    ].join("\n"),
    developmentDetails: `Password reset link for ${to}: ${link}`,
  });
}

export async function sendPasswordChangedEmail(to: string): Promise<void> {
  await sendEmail({
    to,
    subject: CONFIRMATION_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your password was changed</h1>
        <p>The password of your Expense Tracker account was just changed.</p>
        <p style="color:#5b6b7f;font-size: 14px;">
          All other sessions were signed out. If this was not you, reset your password
          immediately and contact support.
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker password was changed",
      "",
      "The password of your account was just changed and all other sessions were signed out.",
      "If this was not you, reset your password immediately and contact support.",
    ].join("\n"),
  });
}

export async function sendAccountDeletedEmail(to: string): Promise<void> {
  await sendEmail({
    to,
    subject: ACCOUNT_DELETED_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your account was deleted</h1>
        <p>Your Expense Tracker account and all of its data were permanently deleted.</p>
        <p style="color:#5b6b7f;font-size: 14px;">
          You were signed out on every device. If this was not you, contact support
          immediately.
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker account was deleted",
      "",
      "Your account and all of its data were permanently deleted and you were signed out on every device.",
      "If this was not you, contact support immediately.",
    ].join("\n"),
  });
}
