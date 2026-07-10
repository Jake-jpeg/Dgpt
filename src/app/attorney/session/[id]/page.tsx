"use client";

/**
 * Attorney review view for one completed intake.
 *
 * The "Generate MSA draft" button is the Stage-2 affordance required by the
 * acceptance criteria: visible, DISABLED, and wired to nothing — there is no
 * drafting endpoint anywhere in Stage 1.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Review {
  session: {
    id: string;
    tier: string | null;
    county: string | null;
    initiatedBy: string;
    qdroFlag: boolean;
    attorneyFlags: string[];
    createdAt: string;
    updatedAt: string;
  };
  identity: {
    clientParty: { fullLegalName: string; priorNames: string[] };
    adverseParty: { fullLegalName: string; priorNames: string[] };
  } | null;
  sections: { id: string; title: string; fields: { id: string; label: string; value: unknown }[] }[];
  branch: { branch_assets: string | null; branch_alimony: string | null };
  audit: { event: string; detail: string | null; created_at: string }[];
  botLog: { direction: string; kind: string; content_id: string; created_at: string }[];
  stage2: { draftingAvailable: boolean };
}

function fmt(v: unknown): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return JSON.stringify(v, null, 1);
  return String(v);
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Review | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/attorney/sessions/${params.id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Failed to load");
        setData(d);
      })
      .catch((e) => setErr(e.message));
  }, [params?.id]);

  if (err) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        <a href="/attorney" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Back</a>
      </main>
    );
  }
  if (!data) return <main className="p-10 text-sm text-slate-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <a href="/attorney" className="text-sm text-blue-600 hover:underline">← Back to dashboard</a>
      <h1 className="mt-2 text-2xl font-bold">
        Intake review — {data.identity?.clientParty.fullLegalName ?? "(unknown)"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {data.session.tier} · {data.session.county} County · initiated by {data.session.initiatedBy}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.session.qdroFlag && (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            QDRO needed — in scope, attorney to handle
          </span>
        )}
        {data.session.attorneyFlags.map((f) => (
          <span key={f} className="rounded bg-slate-200 px-2 py-1 text-xs">{f}</span>
        ))}
      </div>

      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Parties (conflict-cleared)</h2>
        {data.identity && (
          <dl className="mt-2 grid gap-1 text-sm">
            <div>
              <dt className="inline font-medium">Client:</dt>{" "}
              <dd className="inline">
                {data.identity.clientParty.fullLegalName}
                {data.identity.clientParty.priorNames.length > 0 &&
                  ` (prior: ${data.identity.clientParty.priorNames.join(", ")})`}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Adverse party:</dt>{" "}
              <dd className="inline">
                {data.identity.adverseParty.fullLegalName}
                {data.identity.adverseParty.priorNames.length > 0 &&
                  ` (prior: ${data.identity.adverseParty.priorNames.join(", ")})`}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {data.sections.map((sec) => (
        <section key={sec.id} className="mt-4 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">{sec.title}</h2>
          <dl className="mt-2 grid gap-2 text-sm">
            {sec.fields.map((f) => (
              <div key={f.id} className="grid grid-cols-2 gap-2">
                <dt className="text-slate-600">{f.label}</dt>
                <dd className="whitespace-pre-wrap font-medium">{fmt(f.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="mt-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Audit trail</h2>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {data.audit.map((a, i) => (
            <li key={i}>
              <span className="font-mono">{a.created_at}</span> — {a.event}
              {a.detail ? ` (${a.detail})` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Bot interaction log (content IDs only — UPL record)</h2>
        {data.botLog.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">The client never used the assistant.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {data.botLog.map((b, i) => (
              <li key={i}>
                <span className="font-mono">{b.created_at}</span> — {b.direction}: {b.kind} → {b.content_id}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 p-5">
        <h2 className="font-semibold text-slate-500">Stage 2 (not available)</h2>
        <button
          disabled
          aria-disabled="true"
          title="Stage 2 — document drafting is not built yet. This button is intentionally wired to nothing."
          className="mt-2 cursor-not-allowed rounded-lg bg-slate-300 px-5 py-2 text-slate-500"
        >
          Generate MSA draft (Stage 2)
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Document drafting is out of scope for Stage 1. No drafting endpoint
          exists in this application.
        </p>
      </section>
    </main>
  );
}
