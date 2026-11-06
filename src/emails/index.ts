export type { EmailTemplate } from "@/emails/utils";
export { renderEmail } from "@/emails/render";
export {
  WelcomeEmail,
  welcomeEmail,
  type WelcomeEmailInput,
} from "@/emails/welcome";
export {
  VerificationCodeEmail,
  verificationCodeEmail,
  type VerificationCodeEmailInput,
} from "@/emails/verification-code";
export {
  EmailChangeVerificationEmail,
  emailChangeVerificationEmail,
  type EmailChangeVerificationEmailInput,
} from "@/emails/email-change-verification";
export {
  PasswordResetEmail,
  passwordResetEmail,
  type PasswordResetEmailInput,
} from "@/emails/password-reset";
export {
  PasswordChangedEmail,
  passwordChangedEmail,
  type PasswordChangedEmailInput,
} from "@/emails/password-changed";
export {
  AccountDeletedEmail,
  accountDeletedEmail,
  type AccountDeletedEmailInput,
} from "@/emails/account-deleted";
export {
  EmailChangedEmail,
  emailChangedEmail,
  type EmailChangedEmailInput,
} from "@/emails/email-changed";
export {
  EmailChangeCompletedEmail,
  emailChangeCompletedEmail,
  type EmailChangeCompletedEmailInput,
} from "@/emails/email-change-completed";
export {
  EmailRestoredEmail,
  emailRestoredEmail,
  type EmailRestoredEmailInput,
} from "@/emails/email-restored";
export { EmailRemovedEmail, emailRemovedEmail } from "@/emails/email-removed";
export {
  SignInAlertEmail,
  signInAlertEmail,
  type SignInAlertEmailInput,
} from "@/emails/sign-in-alert";
