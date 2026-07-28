"use client";

/**
 * The forms rail — TurboTax-style, for the lawyer (operator directive,
 * 2026-07-27, "for Claude" doc + sketch):
 *
 *   "Actually let them exactly know where the case is on the side. No
 *    complications — just WHICH DOCUMENTS have been generated. …
 *    Let them click on it -> it drops down -> download of the form
 *    available in WORD."
 *
 * One rail, three phase groups, one row per court form. A row is either
 * generated (✓ — click to expand for Word/PDF downloads and regenerate) or
 * not (○ — generate it right there). The phase-advance control lives
 * between the groups, because the phase fence is what opens the client's
 * next question set — deleting the old "Case phase & court forms" panel
 * without rehoming it would have stranded every case in Phase 1.
 *
 * Word first where a Word build exists (DOCX_FORMS — Phase-1 forms today);
 * generating those forms produces BOTH files in two sequential requests so
 * no single request flirts with the 30-second gateway timeout. Every
 * generated version still lands ATTORNEY_REVIEW_REQUIRED server-side —
 * that machinery is unchanged, it just no longer has its own panel.
 */
import { useCallback, useEffect, useState } from "react";
import { api, fmtWhen } from "@/lib/ui/client-api";
import { ErrorNotice } from "@/components/shell";
import { ALLOWED_RENDERS, docxAvailable, renderLabel } from "@/lib/pdf-service/types";
import { guidelineYearSummary } from "@/config/legal/ny-guidelines-2026";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface RailVersion {
  id: string;
  mime: string;
  createdAt: string;
}
interface RailDoc {
  id: string;
  title: string;
  docKind: string;
  versions: RailVersion[];
}

const PHASE_FORMS: { phase: 1 | 2 | 3; title: string; forms: string[] }[] = [
  { phase: 1, title: "Phase 1 · Commencement", forms: ["ud1", "complaint"] },
  {
    phase: 2,
    title: "Phase 2 · Settlement packet",
    forms: ["stipulation", "ud5", "ud6", "ud7", "ud9", "ud10", "ud11", "ud12", "ud4"],
  },
  { phase: 3, title: "Phase 3 · Finalization", forms: ["ud14", "ud15"] },
];

/** Short row label: "UD-1 Summons with Notice" (the "NY " prefix is noise here). */
function shortLabel(form: string): string {
  return renderLabel("ny", form).replace(/^NY /, "");
}

export default function FormsRail({
  matterId,
  isAttorney,
  docs,
  onChanged,
}: {
  matterId: string;
  isAttorney: boolean;
  docs: RailDoc[];
  onChanged: () => void | Promise<void>;
}) {
  const [phase, setPhase] = useState<number | null>(null);
  const [busyForm, setBusyForm] = useState<string | null>(null);
  const [busyPhase, setBusyPhase] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadPhase = useCallback(async () => {
    try {
      const r = (await api.get(`/api/matters/${matterId}/phase`)) as { phase: number };
      setPhase(r.phase);
    } catch {
      setPhase(null);
    }
  }, [matterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhase();
  }, [loadPhase]);

  /** Latest rendered version of a form in each format, from the doc list. */
  function generated(form: string): { pdf: RailVersion | null; docx: RailVersion | null; when: string | null } {
    const label = renderLabel("ny", form);
    const versions = docs
      .filter((d) => d.docKind === "RENDERED_FORM" && d.title.startsWith(label))
      .flatMap((d) => d.versions)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const pdf = versions.find((v) => v.mime === "application/pdf") ?? null;
    const docx = versions.find((v) => v.mime === DOCX_MIME) ?? null;
    return { pdf, docx, when: versions[0]?.createdAt ?? null };
  }

  async function generate(form: string) {
    setBusyForm(form);
    setErr(null);
    try {
      // Word first when a Word build exists, then PDF — two bounded
      // requests, never one long one (the 30s gateway landmine).
      if (docxAvailable("ny", form)) {
        await api.post(`/api/matters/${matterId}/render-pdf`, {
          state: "ny",
          form,
          confirmFormData: true,
          format: "docx",
        });
      }
      await api.post(`/api/matters/${matterId}/render-pdf`, {
        state: "ny",
        form,
        confirmFormData: true,
      });
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The form could not be generated");
    } finally {
      setBusyForm(null);
    }
  }

  async function movePhase(next: 1 | 2 | 3) {
    setBusyPhase(true);
    setErr(null);
    try {
      const r = (await api.post(`/api/matters/${matterId}/phase`, { phase: next })) as {
        phase: number;
      };
      setPhase(r.phase);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change the phase");
    } finally {
      setBusyPhase(false);
    }
  }

  const guide = guidelineYearSummary();
  const doneCount = ALLOWED_RENDERS.filter((r) => generated(r.form).when !== null).length;

  return (
    <aside className="panel" style={{ position: "sticky", top: 16, padding: "16px 16px 12px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <p style={{ fontWeight: 700, letterSpacing: "-.01em", margin: 0 }}>Where this case is</p>
        <span className="text-xs text-slate-500" style={{ marginLeft: "auto" }}>
          {doneCount}/{ALLOWED_RENDERS.length} generated
        </span>
      </div>
      <ErrorNotice message={err} />

      {PHASE_FORMS.map((g) => {
        const current = phase === g.phase;
        return (
          <div key={g.phase} style={{ marginTop: 14, opacity: phase !== null && phase < g.phase ? 0.75 : 1 }}>
            <div
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: current ? "var(--ink, #0f172a)" : "#64748b", display: "flex", gap: 6, alignItems: "center" }}
            >
              {current && <span aria-hidden>▸</span>}
              {g.title}
              {current && <span className="badge" style={{ marginLeft: "auto" }}>current</span>}
            </div>

            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
              {g.forms.map((form) => {
                const gen = generated(form);
                const isDone = gen.when !== null;
                const busy = busyForm === form;
                return (
                  <li key={form} style={{ borderTop: "1px solid var(--line, #e2e8f0)" }}>
                    <details>
                      <summary
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 2px", cursor: "pointer", fontSize: ".88rem" }}
                      >
                        <span aria-hidden style={{ color: isDone ? "#15803d" : "#94a3b8" }}>
                          {isDone ? "✓" : "○"}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>{shortLabel(form)}</span>
                      </summary>
                      <div style={{ padding: "2px 2px 10px 22px", fontSize: ".85rem" }}>
                        {isDone ? (
                          <>
                            <p className="text-xs text-slate-500" style={{ margin: "0 0 6px" }}>
                              Generated {fmtWhen(gen.when)}
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {gen.docx && (
                                <a className="btn btn-primary" style={{ padding: "4px 12px", fontSize: ".8rem" }} href={`/api/document-versions/${gen.docx.id}/download`}>
                                  ⬇ Word
                                </a>
                              )}
                              {gen.pdf && (
                                <a className="btn btn-quiet" style={{ padding: "4px 12px", fontSize: ".8rem" }} href={`/api/document-versions/${gen.pdf.id}/download`}>
                                  ⬇ PDF
                                </a>
                              )}
                              {isAttorney && (
                                <button className="btn btn-quiet" style={{ padding: "4px 12px", fontSize: ".8rem" }} disabled={busyForm !== null} onClick={() => generate(form)}>
                                  {busy ? "Regenerating…" : "Regenerate"}
                                </button>
                              )}
                            </div>
                            {!gen.docx && docxAvailable("ny", form) && (
                              <p className="text-xs text-slate-500" style={{ margin: "6px 0 0" }}>
                                Regenerate to get the Word version.
                              </p>
                            )}
                          </>
                        ) : isAttorney ? (
                          <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: ".8rem" }} disabled={busyForm !== null} onClick={() => generate(form)}>
                            {busy ? "Generating…" : `Generate${docxAvailable("ny", form) ? " (Word + PDF)" : " (PDF)"}`}
                          </button>
                        ) : (
                          <p className="text-xs text-slate-500" style={{ margin: 0 }}>Not generated yet — attorney action.</p>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>

            {isAttorney && phase !== null && g.phase === phase + 1 && (
              <button
                className="btn btn-quiet"
                style={{ marginTop: 8, width: "100%", fontSize: ".82rem" }}
                disabled={busyPhase}
                onClick={() => movePhase(g.phase)}
              >
                {busyPhase
                  ? "Moving…"
                  : g.phase === 2
                    ? "Move to Phase 2 — opens the settlement questions for the client"
                    : "Move to Phase 3 — finalization (asks the client nothing new)"}
              </button>
            )}
            {isAttorney && phase !== null && g.phase === phase - 1 && (
              <button
                className="btn btn-quiet"
                style={{ marginTop: 8, fontSize: ".75rem", padding: "3px 10px" }}
                disabled={busyPhase}
                onClick={() => movePhase(g.phase as 1 | 2 | 3)}
              >
                ← Back to Phase {g.phase} (narrows what is asked; answers are kept)
              </button>
            )}
          </div>
        );
      })}

      <p className="text-xs text-slate-500" style={{ marginTop: 14, borderTop: "1px solid var(--line, #e2e8f0)", paddingTop: 8 }}>
        {guide.maintenance} {guide.childSupport}
      </p>
    </aside>
  );
}
