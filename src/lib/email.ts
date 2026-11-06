import { Resend } from "resend";

import {
  accountDeletedEmail,
  emailChangeCompletedEmail,
  emailChangedEmail,
  emailChangeVerificationEmail,
  emailRemovedEmail,
  emailRestoredEmail,
  passwordChangedEmail,
  passwordResetEmail,
  signInAlertEmail,
  verificationCodeEmail,
  welcomeEmail,
  type EmailTemplate,
} from "@/emails";
import {
  EMAIL_CHANGE_TOKEN_TTL_MS,
  EMAIL_CHANGE_UNDO_TTL_MS,
  formatExpiry,
} from "@/lib/email-change-token";
import { SIGNUP_CODE_TTL_MS } from "@/lib/signup-code";
import { describeUserAgent } from "@/lib/user-agent";

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

type EmailInput = EmailTemplate & {
  to: string;
  /** Only used for the development fallback, never logged in production. */
  developmentDetails?: string;
};

/**
 * Sends an email and reports whether it went out. Failures are logged, never
 * thrown. In development without an API key the details are logged instead,
 * which counts as sent so the flows can be used locally.
 *
 * The HTML and text come from the templates in `@/emails`, which escape
 * everything they're given.
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
export async function sendPasswordChangedEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmail({
    to,
    ...passwordChangedEmail({ name, resetUrl: buildForgotPasswordLink() }),
  });
}

export async function sendAccountDeletedEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmail({ to, ...accountDeletedEmail({ name }) });
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
  name: string,
): Promise<void> {
  const link = buildEmailChangeUndoLink(undoToken);

  await sendEmail({
    to,
    ...emailChangedEmail({
      name,
      newEmail,
      undoUrl: link,
      undoExpiresInDays: UNDO_DAYS,
      undoExpiresAt,
    }),
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
  name = "",
): Promise<void> {
  if (!resetToken) {
    await sendEmail({ to, ...emailRemovedEmail() });
    return;
  }

  const resetLink = buildPasswordResetLink(resetToken);

  await sendEmail({
    to,
    ...emailRestoredEmail({
      name,
      restoredEmail,
      resetUrl: resetLink,
      resetExpiresInMinutes: EXPIRY_MINUTES,
      forgotPasswordUrl: buildForgotPasswordLink(),
    }),
    developmentDetails: `Password reset link for ${to}: ${resetLink}`,
  });
}

/** Sent to the new address once the change is confirmed. */
export async function sendEmailChangeCompletedEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmail({
    to,
    ...emailChangeCompletedEmail({
      name,
      newEmail: to,
      undoExpiresInDays: UNDO_DAYS,
    }),
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
  name: string,
): Promise<void> {
  await sendEmail({
    to,
    ...signInAlertEmail({
      name,
      signedInAt: formatExpiry(signedInAt),
      device: describeUserAgent(userAgent),
      ipAddress: ip,
      resetUrl: buildForgotPasswordLink(),
    }),
  });
}
