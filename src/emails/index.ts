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
