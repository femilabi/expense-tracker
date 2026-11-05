import { describe, expect, it } from "vitest";

import {
  emailChangeVerificationEmail,
  passwordResetEmail,
  verificationCodeEmail,
  welcomeEmail,
} from "@/emails";

describe("email templates", () => {
  it("renders the welcome email with the first name and dashboard link", () => {
    const email = welcomeEmail({
      name: "Ayanda Dlokova",
      dashboardUrl: "https://app.test/dashboard",
    });

    expect(email.subject).toBe("Welcome to Expense Tracker");
    expect(email.html).toContain(
      '<h1 style="font-size:20px">Welcome, Ayanda!</h1>',
    );
    expect(email.html).toContain('href="https://app.test/dashboard"');
    expect(email.html).toContain("<li><strong>Add your income</strong> so you");
    expect(email.html).toContain("line-height:1.6");
    expect(email.html).toContain("border-radius:999px");
    expect(email.text).toContain("Welcome to Expense Tracker, Ayanda!");
  });

  it("escapes user input in the HTML", () => {
    const email = emailChangeVerificationEmail({
      name: "<script>alert(1)</script>",
      newEmail: 'x"@evil.test',
      confirmUrl: 'https://app.test/confirm?token=a&b="c"',
      expiresInMinutes: 60,
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).toContain("x&quot;@evil.test");
    expect(email.html).toContain(
      'href="https://app.test/confirm?token=a&amp;b=&quot;c&quot;"',
    );
  });

  it("shows the verification code in the subject, HTML and text", () => {
    const email = verificationCodeEmail({
      name: "Ayanda",
      code: "482913",
      expiresInMinutes: 10,
    });

    expect(email.subject).toContain("482913");
    expect(email.html).toContain(">482913</p>");
    expect(email.html).toContain("expires in 10 minutes");
    expect(email.text).toContain("482913");
  });

  it("renders void elements and the password reset link", () => {
    const email = passwordResetEmail({
      name: "",
      resetUrl: "https://app.test/reset-password?token=abc",
      expiresInMinutes: 15,
    });

    expect(email.html).toContain("Hi there,");
    expect(email.html).toContain("<br />");
    expect(email.html).toContain(
      'href="https://app.test/reset-password?token=abc"',
    );
    expect(email.text).toContain("expires in 15 minutes");
  });
});
