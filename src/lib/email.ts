import { Resend } from "resend";

const RESET_SUBJECT = "Reset your Expense Tracker password";
const CONFIRMATION_SUBJECT = "Your Expense Tracker password was changed";
const ACCOUNT_DELETED_SUBJECT = "Your Expense Tracker account was deleted";
const EMAIL_CHANGE_VERIFY_SUBJECT = "Confirm your new Expense Tracker email";
const EMAIL_CHANGED_SUBJECT = "Your Expense Tracker email was changed";
const EMAIL_RESTORED_SUBJECT = "Your Expense Tracker email was restored";
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

export function buildEmailChangeConfirmLink(token: string): string {
  return `${getAppUrl()}/confirm-email-change?token=${encodeURIComponent(token)}`;
}

export function buildEmailChangeUndoLink(token: string): string {
  return `${getAppUrl()}/undo-email-change?token=${encodeURIComponent(token)}`;
}

/** Email addresses are user input, so they are escaped before going in HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Only used for the development fallback, never logged in production. */
  developmentDetails?: string;
};

/**
 * Sends an email and reports whether it went out. Failures are logged, never
 * thrown. In development without an API key the details are logged instead,
 * which counts as sent so the flows can be used locally.
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
  developmentDetails,
}: EmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] RESEND_API_KEY is missing, email not sent.");
      return false;
    }
    console.warn(
      `[email] RESEND_API_KEY is missing, email not sent. ${developmentDetails ?? ""}`,
    );
    return true;
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
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] Failed to send "${subject}".`, error);
    return false;
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

/** Sent to the new address. Returns whether the email went out. */
export async function sendEmailChangeVerificationEmail(
  to: string,
  token: string,
): Promise<boolean> {
  const link = buildEmailChangeConfirmLink(token);

  return sendEmail({
    to,
    subject: EMAIL_CHANGE_VERIFY_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Confirm your new email</h1>
        <p>Someone asked to use this address for an Expense Tracker account.</p>
        <p>
          <a href="${link}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Confirm new email
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This link expires in 1 hour and can only be used once.
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If the button does not work, copy this link into your browser:<br />
          ${link}
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If you did not ask for this you can safely ignore this email.
        </p>
      </div>
    `,
    text: [
      "Confirm your new Expense Tracker email",
      "",
      "Someone asked to use this address for an Expense Tracker account.",
      "",
      `Open this link to confirm: ${link}`,
      "",
      "This link expires in 1 hour and can only be used once.",
      "If you did not ask for this you can safely ignore this email.",
    ].join("\n"),
    developmentDetails: `Email change link for ${to}: ${link}`,
  });
}

/** Sent to the old address after the change, with the undo link. */
export async function sendEmailChangedNoticeEmail(
  to: string,
  newEmail: string,
  undoToken: string,
  undoExpiresAt: string,
): Promise<void> {
  const link = buildEmailChangeUndoLink(undoToken);
  const safeNewEmail = escapeHtml(newEmail);

  await sendEmail({
    to,
    subject: EMAIL_CHANGED_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your email was changed</h1>
        <p>The email of your Expense Tracker account was changed to ${safeNewEmail}.
          All sessions were signed out.</p>
        <p>If this was not you, undo the change:</p>
        <p>
          <a href="${link}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Undo email change
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This link works once and expires on ${undoExpiresAt}.
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If the button does not work, copy this link into your browser:<br />
          ${link}
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker email was changed",
      "",
      `The email of your account was changed to ${newEmail} and all sessions were signed out.`,
      "",
      `If this was not you, undo the change: ${link}`,
      "",
      `This link works once and expires on ${undoExpiresAt}.`,
    ].join("\n"),
    developmentDetails: `Email change undo link for ${to}: ${link}`,
  });
}

/**
 * Sent to both addresses after an undo. Only the restored address gets a
 * reset link, the other one may belong to whoever made the change.
 */
export async function sendEmailRestoredEmail(
  to: string,
  restoredEmail: string,
  resetToken?: string,
): Promise<void> {
  const resetLink = resetToken ? buildPasswordResetLink(resetToken) : null;
  const forgotLink = `${getAppUrl()}/forgot-password`;
  const safeRestoredEmail = escapeHtml(restoredEmail);

  await sendEmail({
    to,
    subject: EMAIL_RESTORED_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your email was restored</h1>
        <p>The email of your Expense Tracker account was changed back to
          ${safeRestoredEmail} and all sessions were signed out.</p>
        <p>We recommend resetting your password now.</p>
        ${
          resetLink
            ? `<p>
          <a href="${resetLink}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Reset password
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This link expires in ${EXPIRY_MINUTES} minutes. After that, request a new one at
          ${forgotLink}
        </p>`
            : ""
        }
      </div>
    `,
    text: [
      "Your Expense Tracker email was restored",
      "",
      `The email of your account was changed back to ${restoredEmail} and all sessions were signed out.`,
      "We recommend resetting your password now.",
      ...(resetLink
        ? [
            "",
            `Reset your password: ${resetLink}`,
            `This link expires in ${EXPIRY_MINUTES} minutes. After that, request a new one at ${forgotLink}`,
          ]
        : []),
    ].join("\n"),
    developmentDetails: resetLink
      ? `Password reset link for ${to}: ${resetLink}`
      : undefined,
  });
}
