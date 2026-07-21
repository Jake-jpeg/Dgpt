/**
 * Metadata-only audit helpers for the render pipeline (Part 3).
 * Never form-field values, never document bytes, never the service token.
 */
import { createHash } from "node:crypto";
import { recordAudit } from "@/lib/db/repo";
import type { RenderPayload } from "./types";

/** Deterministic fingerprint of the confirmed form data (order-stable). */
export function payloadFingerprint(payload: RenderPayload): string {
  const stable = JSON.stringify(Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))));
  return createHash("sha256").update(stable).digest("hex").slice(0, 16);
}

export async function auditFormDataConfirmed(opts: {
  matterId: string;
  userId: string;
  state: string;
  form: string;
  payload: RenderPayload;
}): Promise<void> {
  (await recordAudit(
        opts.matterId,
        "FORM_DATA_CONFIRMED",
        `state=${opts.state} form=${opts.form} fields=${Object.keys(opts.payload).length} fingerprint=${payloadFingerprint(opts.payload)}`,
        opts.userId
      ));
}

export async function auditPdfRendered(opts: {
  matterId: string;
  userId: string;
  state: string;
  form: string;
  versionId: string;
  sha256: string;
  sizeBytes: number;
  latencyMs: number;
  retried: boolean;
}): Promise<void> {
  (await recordAudit(
        opts.matterId,
        "PDF_RENDERED",
        `state=${opts.state} form=${opts.form} version=${opts.versionId} sha=${opts.sha256.slice(0, 16)} bytes=${opts.sizeBytes} latencyMs=${opts.latencyMs}${opts.retried ? " retried=1" : ""}`,
        opts.userId
      ));
}
