import { describe, expect, it } from "vitest";

import {
  accountDeletedEmail,
  emailChangeCompletedEmail,
  emailChangedEmail,
  emailRemovedEmail,
  emailRestoredEmail,
  passwordChangedEmail,
  signInAlertEmail,
} from "@/emails";

describe("account notification templates", () => {
  it("renders the password changed email with a reset button", () => {
    const email = passwordChangedEmail({
      name: "Ayanda Dlokova",
      resetUrl: "https://app.test/forgot-password",
    });

    expect(email.subject).toBe("Your Expense Tracker password was changed");
    expect(email.html).toContain("Hi Ayanda, the password for your");
    expect(email.html).toContain('href="https://app.test/forgot-password"');
    expect(email.html).toContain("Any other devices");
    expect(email.text).toContain(
      "reset your password now: https://app.test/forgot-password",
    );
  });

  it("renders the account deleted email", () => {
    const email = accountDeletedEmail({ name: "Ayanda" });

    expect(email.subject).toBe("Your Expense Tracker account was deleted");
    expect(email.html).toContain("Hi Ayanda, your Expense Tracker account");
    expect(email.html).toContain("can&#39;t be undone");
    expect(email.html).not.toContain("support");
    expect(email.text).toContain("This can't be undone.");
  });

  it("renders the email changed notice with the undo link and expiry", () => {
    const email = emailChangedEmail({
      name: "Ayanda",
      newEmail: "new@example.com",
      undoUrl: "https://app.test/undo-email-change?token=abc",
      undoExpiresInDays: 3,
      undoExpiresAt: "Sun, 8 Nov 2026, 12:00 UTC",
    });

    expect(email.subject).toBe("Your Expense Tracker email was changed");
    expect(email.html).toContain("<strong>new@example.com</strong>");
    expect(email.html).toContain(
      'href="https://app.test/undo-email-change?token=abc"',
    );
    expect(email.html).toContain(
      "expires in 3 days (Sun, 8 Nov 2026, 12:00 UTC)",
    );
    expect(email.text).toContain("expires in 3 days");
  });

  it("renders the email updated notice for the new address", () => {
    const email = emailChangeCompletedEmail({
      name: "Ayanda",
      newEmail: "new@example.com",
      undoExpiresInDays: 3,
    });

    expect(email.subject).toBe("Your Expense Tracker email is updated");
    expect(email.html).toContain(
      "now uses <strong>new@example.com</strong>. Use this address",
    );
    expect(email.html).toContain("for the next 3 days");
  });

  it("gives the restored address a reset link", () => {
    const email = emailRestoredEmail({
      name: "Ayanda",
      restoredEmail: "old@example.com",
      resetUrl: "https://app.test/reset-password?token=abc",
      resetExpiresInMinutes: 15,
      forgotPasswordUrl: "https://app.test/forgot-password",
    });

    expect(email.subject).toBe("Your Expense Tracker email was restored");
    expect(email.html).toContain("uses <strong>old@example.com</strong> again");
    expect(email.html).toContain(
      'href="https://app.test/reset-password?token=abc"',
    );
    expect(email.html).toContain("expires in 15 minutes");
  });

  it("tells the removed address nothing about the account", () => {
    const email = emailRemovedEmail();

    expect(email.subject).toBe(
      "This email was removed from an Expense Tracker account",
    );
    expect(email.html).not.toContain("Hi ");
    expect(email.html).not.toContain("href=");
    expect(email.text).not.toContain("http");
  });

  it("shows the sign-in time, device and IP, escaped", () => {
    const email = signInAlertEmail({
      name: "Ayanda",
      signedInAt: "Fri, 6 Nov 2026, 09:30 UTC",
      device: "Edge on Windows",
      ipAddress: "<b>203.0.113.7</b>",
      resetUrl: "https://app.test/forgot-password",
    });

    expect(email.subject).toBe("New sign-in to your Expense Tracker account");
    expect(email.html).toContain("Hi Ayanda, someone just signed in");
    expect(email.html).toContain(
      "Time: Fri, 6 Nov 2026, 09:30 UTC<br />Device: Edge on Windows<br />",
    );
    expect(email.html).toContain("IP address: &lt;b&gt;203.0.113.7&lt;/b&gt;");
    expect(email.html).not.toContain("<b>");
    expect(email.text).toContain("Device: Edge on Windows");
  });
});
