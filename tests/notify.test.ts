/**
 * Firm notification email — env gating and message content.
 * The transport itself is not exercised (no network in tests); what matters
 * is that an unconfigured system SKIPS silently and the message says exactly
 * what the operator specified.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  clientRegisteredEmail,
  firmNotifyConfigured,
  notifyClientRegistered,
} from "@/lib/notify/firm-email";

describe("firm notification email", () => {
  beforeEach(() => {
    delete process.env.SMTP_URL;
    delete process.env.FIRM_NOTIFY_EMAIL;
    delete process.env.FIRM_NOTIFY_FROM;
  });

  it("is unconfigured when env rows are empty — and skips instead of failing", async () => {
    expect(firmNotifyConfigured()).toBe(false);
    await expect(
      notifyClientRegistered({ email: "client@example.com", name: "Test Client" })
    ).resolves.toBe("SKIPPED_UNCONFIGURED");
  });

  it("is configured when both SMTP_URL and FIRM_NOTIFY_EMAIL are set", () => {
    process.env.SMTP_URL = "smtps://u:p@smtp.example.com:465";
    process.env.FIRM_NOTIFY_EMAIL = "lawyer@example.com";
    expect(firmNotifyConfigured()).toBe(true);
  });

  it("the registration notice carries the operator's exact instructions", () => {
    const mail = clientRegisteredEmail({ email: "client@example.com", name: "Jane Doe" });
    expect(mail.subject).toContain("New client registered");
    expect(mail.text).toContain("Jane Doe (client@example.com)");
    expect(mail.text).toContain('Go to "Connect the client" on your portal under the client\'s name.');
    expect(mail.text).toContain('Click "Connect to this matter"');
    expect(mail.text).toContain("after verifying the client's email address");
    // No client content beyond name + email; no legal language.
    expect(mail.text.length).toBeLessThan(600);
  });

  it("falls back to the bare email when the client has no display name", () => {
    const mail = clientRegisteredEmail({ email: "client@example.com" });
    expect(mail.text).toContain("client@example.com just registered");
  });
});
