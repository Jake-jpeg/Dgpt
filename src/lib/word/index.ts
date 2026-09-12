/**
 * The Word renderer — the in-app replacement for the ReportLab PDF service.
 *
 * `renderWord(state, form, payload)` is the ONLY entry point. It dispatches
 * strictly by the allowlisted (state, form) pair to a generator, builds the
 * document, and returns bytes + a filename. Nothing here is reachable by
 * the AI layer; the payload arrives from the deterministic mappings.
 */
import { createHash } from "node:crypto";
import { buildDocx, type WordForm, type WordPayload } from "./engine";
import { NY_FORMS } from "./forms/ny";
import { NJ_FORMS } from "./forms/nj";

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface WordRenderResult {
  bytes: Uint8Array;
  filename: string;
  sha256: string;
  latencyMs: number;
}

const REGISTRY: Record<string, Record<string, (p: WordPayload) => WordForm>> = {
  ny: NY_FORMS,
  nj: NJ_FORMS,
};

export function wordFormExists(state: string, form: string): boolean {
  return Boolean(REGISTRY[state]?.[form]);
}

export async function renderWord(state: string, form: string, payload: WordPayload): Promise<WordRenderResult> {
  const gen = REGISTRY[state]?.[form];
  if (!gen) throw new Error("VALIDATION: unsupported state/form pair");
  const started = Date.now();
  const built = gen(payload);
  const bytes = await buildDocx(built.children, { formLabel: built.formLabel, title: built.filename });
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { bytes, filename: built.filename, sha256, latencyMs: Date.now() - started };
}
