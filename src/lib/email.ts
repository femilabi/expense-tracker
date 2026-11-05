import { Resend } from "resend";

import {
  emailChangeVerificationEmail,
  passwordResetEmail,
  verificationCodeEmail,
  welcomeEmail,
} from "@/emails";
import {
  EMAIL_CHANGE_TOKEN_TTL_MS,
  EMAIL_CHANGE_UNDO_TTL_MS,
  formatExpiry,
} from "@/lib/email-change-token";
import { SIGNUP_CODE_TTL_MS } from "@/lib/signup-code";
import { describeUserAgent } from "@/lib/user-agent";

// The emails below without a template from `@/emails` yet still build their
// own HTML. They move to templates as those are added.
const CONFIRMATION_SUBJECT = "Your Expense Tracker password was changed";
const ACCOUNT_DELETED_SUBJECT = "Your Expense Tracker account was deleted";
const EMAIL_CHANGED_SUBJECT = "Your Expense Tracker email was changed";
const EMAIL_RESTORED_SUBJECT = "Your Expense Tracker email was restored";
const EMAIL_REMOVED_SUBJECT =
  "This email was removed from an Expense Tracker account";
const EMAIL_CHANGE_COMPLETED_SUBJECT = "Your Expense Tracker email is updated";
const SIGN_IN_SUBJECT = "New sign-in to your Expense Tracker account";
const EXPIRY_MINUTES = 15;
const SIGNUP_CODE_MINUTES = SIGNUP_CODE_TTL_MS / 60_000;
const EMAIL_CHANGE_MINUTES = EMAIL_CHANGE_TOKEN_TTL_MS / 60_000;
const UNDO_DAYS = EMAIL_CHANGE_UNDO_TTL_MS / (24 * 60 * 60 * 1000);

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

function buildForgotPasswordLink(): string {
  return `${getAppUrl()}/forgot-password`;
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
  name: string,
): Promise<void> {
  const link = buildPasswordResetLink(token);

  await sendEmail({
    to,
    ...passwordResetEmail({
      name,
      resetUrl: link,
      expiresInMinutes: EXPIRY_MINUTES,
    }),
    developmentDetails: `Password reset link for ${to}: ${link}`,
  });
}

/** Sent after a password change and after a password reset. */
export async function sendPasswordChangedEmail(to: string): Promise<void> {
  const forgotLink = buildForgotPasswordLink();

  await sendEmail({
    to,
    subject: CONFIRMATION_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your password was changed</h1>
        <p>The password for your Expense Tracker account was just changed. Any other
          devices that were signed in to your account have been signed out.</p>
        <p>If this wasn't you, reset your password now:</p>
        <p>
          <a href="${forgotLink}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Reset password
          </a>
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker password was changed",
      "",
      "The password for your Expense Tracker account was just changed. Any other devices that were signed in to your account have been signed out.",
      "",
      `If this wasn't you, reset your password now: ${forgotLink}`,
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
        <p>Your Expense Tracker account and all of its data were permanently deleted,
          and you were signed out on every device. This can't be undone.</p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If this wasn't you, someone else knew your password. Change it on any other
          site where you use the same password.
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker account was deleted",
      "",
      "Your Expense Tracker account and all of its data were permanently deleted, and you were signed out on every device. This can't be undone.",
      "",
      "If this wasn't you, someone else knew your password. Change it on any other site where you use the same password.",
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
    ...emailChangeVerificationEmail({
      newEmail: to,
      confirmUrl: link,
      expiresInMinutes: EMAIL_CHANGE_MINUTES,
    }),
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
        <p>The email address on your Expense Tracker account was changed to
          ${safeNewEmail}, and you were signed out on all your devices.</p>
        <p>If this wasn't you, undo the change:</p>
        <p>
          <a href="${link}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Undo email change
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This link can only be used once and expires in ${UNDO_DAYS} days
          (${undoExpiresAt}).
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          If the button doesn't work, copy this link into your browser:<br />
          ${link}
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker email was changed",
      "",
      `The email address on your Expense Tracker account was changed to ${newEmail}, and you were signed out on all your devices.`,
      "",
      `If this wasn't you, undo the change: ${link}`,
      "",
      `This link can only be used once and expires in ${UNDO_DAYS} days (${undoExpiresAt}).`,
    ].join("\n"),
    developmentDetails: `Email change undo link for ${to}: ${link}`,
  });
}

/**
 * Sent to both addresses after an undo. Only the restored address gets a
 * reset link, the other one may belong to whoever made the change, so it
 * gets a separate message saying it was removed.
 */
export async function sendEmailRestoredEmail(
  to: string,
  restoredEmail: string,
  resetToken?: string,
): Promise<void> {
  if (!resetToken) {
    await sendEmail({
      to,
      subject: EMAIL_REMOVED_SUBJECT,
      html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">This email was removed from an account</h1>
        <p>A recent email change on an Expense Tracker account was undone, so this
          address is no longer used to log in to it.</p>
        <p style="color:#5b6b7f;font-size: 14px;">
          Every device signed in to that account was signed out.
        </p>
      </div>
    `,
      text: [
        "This email was removed from an Expense Tracker account",
        "",
        "A recent email change on an Expense Tracker account was undone, so this address is no longer used to log in to it.",
        "Every device signed in to that account was signed out.",
      ].join("\n"),
    });
    return;
  }

  const resetLink = buildPasswordResetLink(resetToken);
  const forgotLink = buildForgotPasswordLink();
  const safeRestoredEmail = escapeHtml(restoredEmail);

  await sendEmail({
    to,
    subject: EMAIL_RESTORED_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your email was restored</h1>
        <p>Your Expense Tracker account uses ${safeRestoredEmail} again, and you were
          signed out on all your devices.</p>
        <p>Whoever changed your email may know your password, so we recommend
          resetting it now:</p>
        <p>
          <a href="${resetLink}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Reset password
          </a>
        </p>
        <p style="color:#5b6b7f;font-size: 14px;">
          This link expires in ${EXPIRY_MINUTES} minutes. After that, you can request a
          new one at ${forgotLink}
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker email was restored",
      "",
      `Your Expense Tracker account uses ${restoredEmail} again, and you were signed out on all your devices.`,
      "Whoever changed your email may know your password, so we recommend resetting it now.",
      "",
      `Reset your password: ${resetLink}`,
      `This link expires in ${EXPIRY_MINUTES} minutes. After that, you can request a new one at ${forgotLink}`,
    ].join("\n"),
    developmentDetails: `Password reset link for ${to}: ${resetLink}`,
  });
}

/** Sent to the new address once the change is confirmed. */
export async function sendEmailChangeCompletedEmail(to: string): Promise<void> {
  const safeEmail = escapeHtml(to);

  await sendEmail({
    to,
    subject: EMAIL_CHANGE_COMPLETED_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">Your email is updated</h1>
        <p>Your Expense Tracker account now uses ${safeEmail}. Use this address the
          next time you log in.</p>
        <p style="color:#5b6b7f;font-size: 14px;">
          We've also emailed your previous address. The change can be undone from
          there for the next ${UNDO_DAYS} days.
        </p>
      </div>
    `,
    text: [
      "Your Expense Tracker email is updated",
      "",
      `Your Expense Tracker account now uses ${to}. Use this address the next time you log in.`,
      `We've also emailed your previous address. The change can be undone from there for the next ${UNDO_DAYS} days.`,
    ].join("\n"),
  });
}

/** Sent before the account exists. Returns whether the email went out. */
export async function sendSignupCodeEmail(
  to: string,
  code: string,
  name: string,
): Promise<boolean> {
  return sendEmail({
    to,
    ...verificationCodeEmail({
      name,
      code,
      expiresInMinutes: SIGNUP_CODE_MINUTES,
    }),
    developmentDetails: `Signup code for ${to}: ${code}`,
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmail({
    to,
    ...welcomeEmail({ name, dashboardUrl: `${getAppUrl()}/dashboard` }),
  });
}

export type SignInDetails = {
  signedInAt: Date;
  ip: string;
  userAgent: string;
};

export async function sendSignInNotificationEmail(
  to: string,
  { signedInAt, ip, userAgent }: SignInDetails,
): Promise<void> {
  const forgotLink = buildForgotPasswordLink();
  const when = formatExpiry(signedInAt);
  const device = describeUserAgent(userAgent);
  const safeIp = escapeHtml(ip);

  await sendEmail({
    to,
    subject: SIGN_IN_SUBJECT,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #14213d;">
        <h1 style="font-size: 20px;">New sign-in to your account</h1>
        <p>Someone just signed in to your Expense Tracker account.</p>
        <p style="color:#5b6b7f;font-size: 14px;">
          Time: ${when}<br />
          Device: ${device}<br />
          IP address: ${safeIp}
        </p>
        <p>If this was you, there's nothing you need to do.</p>
        <p>If it wasn't you, reset your password now. This will sign you out on
          every device.</p>
        <p>
          <a href="${forgotLink}" style="background:#0e8388;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Reset password
          </a>
        </p>
      </div>
    `,
    text: [
      "New sign-in to your Expense Tracker account",
      "",
      "Someone just signed in to your Expense Tracker account.",
      "",
      `Time: ${when}`,
      `Device: ${device}`,
      `IP address: ${ip}`,
      "",
      "If this was you, there's nothing you need to do.",
      `If it wasn't you, reset your password now. This will sign you out on every device: ${forgotLink}`,
    ].join("\n"),
  });
}
