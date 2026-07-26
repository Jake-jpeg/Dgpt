/**
 * Firm notification email — "EMAIL THE LAWYER TO CLEAR THE CLIENT."
 *
 * Operator directive (Claude 3.05, 2026-07-26): when a client registers at
 * sign-in and lands in the waiting room, the lawyer gets an email telling
 * them a client is waiting and exactly what to do about it. Short.
 *
 * Design rules:
 *   - ENV-GATED, FAIL-SAFE. Unconfigured SMTP means the notification is
 *     skipped (and audited as skipped) — a login NEVER fails or blocks
 *     because email is down. This is a courtesy signal, not a system of
 *     record: the registration itself is already in the DB and on the
 *     matter page's "Connect the client" panel.
 *   - NO CLIENT CONTENT beyond name + email. The lawyer verifies the email
 *     address themselves before connecting — the message says so.
 *   - The message builder is PURE and exported for tests; transport I/O is
 *     isolated in sendFirmEmail.
 *
 * Env (operator sets on DO; see .env.example):
 *   SMTP_URL          e.g. smtps://user:app-password@smtp.gmail.com:465
 *   FIRM_NOTIFY_EMAIL the lawyer's inbox (the To:)
 *   FIRM_NOTIFY_FROM  optional From: header; defaults to FIRM_NOTIFY_EMAIL
 */
import { envOptional } from "@/lib/env";
import { operatingFirmName } from "@/config/branding";

export function firmNotifyConfigured(): boolean {
  return Boolean(envOptional("SMTP_URL") && envOptional("FIRM_NOTIFY_EMAIL"));
}

export interface FirmEmail {
  subject: string;
  text: string;
}

/**
 * The registration notice, in the operator's own words: "Go to 'Connect
 * Client' on your portal under the client's name. Click 'Connect to this
 * matter' — do so after verifying the client's email address."
 */
export function clientRegisteredEmail(client: { email: string; name?: string }): FirmEmail {
  const who = client.name ? `${client.name} (${client.email})` : client.email;
  return {
    subject: "New client registered — waiting to be connected",
    text:
      `${who} just registered at divorcegpt.com and is waiting to be connected.\n\n` +
      `Go to "Connect the client" on your portal under the client's name. ` +
      `Click "Connect to this matter" — do so after verifying the client's ` +
      `email address.\n\n` +
      `— DivorceGPT, ${operatingFirmName()}`,
  };
}

/**
 * Transport I/O. Throws on failure — callers decide whether that matters.
 * Timeouts are tight: this runs inside the login flow's wake, and a dead
 * SMTP host must cost seconds, not minutes.
 */
export async function sendFirmEmail(mail: FirmEmail): Promise<void> {
  const url = envOptional("SMTP_URL");
  const to = envOptional("FIRM_NOTIFY_EMAIL");
  if (!url || !to) throw new Error("VALIDATION: firm email is not configured");
  const { createTransport } = await import("nodemailer");
  const transport = createTransport(url, {
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 8_000,
  });
  try {
    await transport.sendMail({
      from: envOptional("FIRM_NOTIFY_FROM") || to,
      to,
      subject: mail.subject,
      text: mail.text,
    });
  } finally {
    transport.close();
  }
}

export type NotifyOutcome = "SENT" | "SKIPPED_UNCONFIGURED" | "FAILED";

/** Never throws. The caller audits the outcome and moves on. */
export async function notifyClientRegistered(client: {
  email: string;
  name?: string;
}): Promise<NotifyOutcome> {
  if (!firmNotifyConfigured()) return "SKIPPED_UNCONFIGURED";
  try {
    await sendFirmEmail(clientRegisteredEmail(client));
    return "SENT";
  } catch {
    return "FAILED";
  }
}
