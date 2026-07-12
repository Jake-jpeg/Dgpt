"use client";

/**
 * Client matter hub — everything a client can see, in plain language:
 * status, the disclosure step, intake entry, requested items, uploads,
 * released documents, and the help option. Internal machinery (conflict
 * reasoning, drafts, notes) never appears here; the server would refuse it
 * anyway.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface Disclosure {
  version: string;
  title: string;
  paragraphs: string[];
  acknowledgeLabel: string;
}

interface ClientMatter {
  id: string;
  status: string;
  canProceed: boolean;
  requestedItems: { id: string; label: string; createdAt: string }[];
  helpAvailable: boolean;
  helpLabel: string;
}

interface ReleasedDoc {
  documentId: string;
  versionId: string;
  title: string;
  releasedAt: string;
}
interface UploadDoc {
  documentId: string;
  title: string;
  uploadedAt: string;
}

export default function ClientMatterPage() {
  const { me, loading } = useMe();
  const [matter, setMatter] = useState<ClientMatter | null>(null);
  const [ackDone, setAckDone] = useState<boolean | null>(null);
  const [disclosure, setDisclosure] = useState<Disclosure | null>(null);
  const [agree, setAgree] = useState(false); // never preselected
  const [released, setReleased] = useState<ReleasedDoc[]>([]);
  const [uploads, setUploads] = useState<UploadDoc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const matterId = me?.clientMatterId ?? null;

  const load = useCallback(async () => {
    if (!matterId) return;
    setErr(null);
    try {
      const m = (await api.get(`/api/matters/${matterId}`)) as { matter: ClientMatter };
      setMatter(m.matter);
      const consent = (await api.get(`/api/matters/${matterId}/consent`)) as {
        acknowledged: boolean;
      };
      setAckDone(consent.acknowledged);
      if (!consent.acknowledged) {
        const d = (await api.get("/api/disclosure")) as { disclosure: Disclosure };
        setDisclosure(d.disclosure);
      }
      const docs = (await api.get(`/api/matters/${matterId}/documents`)) as unknown as {
        released: ReleasedDoc[];
        uploads: UploadDoc[];
      };
      setReleased(docs.released ?? []);
      setUploads(docs.uploads ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load your matter");
    }
  }, [matterId]);

  useEffect(() => {
    // Mount-time load of the client's matter once identity resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function acknowledge() {
    if (!matterId || !disclosure) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/api/matters/${matterId}/consent`, {
        version: disclosure.version,
        acknowledge: true,
      });
      setAckDone(true);
      setInfo("Thank you — your acknowledgment has been recorded.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not record acknowledgment");
    } finally {
      setBusy(false);
    }
  }

  async function requestHelp() {
    if (!matterId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.post(`/api/matters/${matterId}/assistance`);
      setInfo(String(res.message ?? "The firm has been notified."));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send the request");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile() {
    if (!matterId || !file) return;
    setBusy(true);
    setErr(null);
    try {
      await api.upload(`/api/matters/${matterId}/documents`, file);
      setFile(null);
      setInfo("Your document was uploaded and is with the firm for review.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="My matter">
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4">{info}</div>}

      {!loading && me?.user?.role !== "CLIENT" && (
        <div className="notice notice-info">This page is for client accounts.</div>
      )}

      {!loading && me?.user?.role === "CLIENT" && !matterId && (
        <div className="panel">
          <h2>No matter linked yet</h2>
          <p className="panel-sub">
            Portal access begins with an invitation from the firm. If you have
            one, enter it now; if not, please contact the firm.
          </p>
          <Link className="btn btn-primary" href="/invite">
            Enter my invitation
          </Link>
        </div>
      )}

      {matterId && matter && (
        <>
          <div className="panel">
            <h2>Status</h2>
            <p className="text-[.95rem]">{matter.status}</p>
            {ackDone && matter.canProceed && (
              <Link className="btn btn-primary mt-3" href="/intake">
                Continue my intake
              </Link>
            )}
            {ackDone && !matter.canProceed && (
              <Link className="btn btn-quiet mt-3" href="/intake">
                Provide initial information
              </Link>
            )}
          </div>

          {ackDone === false && disclosure && (
            <div className="panel">
              <h2>{disclosure.title}</h2>
              <p className="panel-sub">
                Please read the following before continuing. Version{" "}
                {disclosure.version}.
              </p>
              <div className="space-y-3 text-[.93rem] leading-relaxed">
                {disclosure.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1"
                />
                {disclosure.acknowledgeLabel}
              </label>
              <button
                className="btn btn-primary mt-4"
                onClick={acknowledge}
                disabled={!agree || busy}
              >
                Record my acknowledgment
              </button>
            </div>
          )}

          {matter.requestedItems.length > 0 && (
            <div className="panel">
              <h2>Items the firm has asked for</h2>
              <ul className="list-disc space-y-1 pl-5 text-[.93rem]">
                {matter.requestedItems.map((r) => (
                  <li key={r.id}>
                    {r.label}{" "}
                    <span className="text-xs text-slate-500">
                      requested {fmtWhen(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="panel">
            <h2>Upload a requested document</h2>
            <p className="panel-sub">
              {matter.canProceed
                ? "PDF, Word, image, or text files. Uploads go to the firm for review."
                : "Document upload becomes available after the firm completes its review."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
                disabled={!matter.canProceed}
              />
              <button
                className="btn btn-primary"
                onClick={uploadFile}
                disabled={!file || busy || !matter.canProceed}
              >
                Upload
              </button>
            </div>
            {uploads.length > 0 && (
              <table className="tbl mt-4">
                <thead>
                  <tr>
                    <th>Your uploads</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.documentId}>
                      <td>{u.title}</td>
                      <td>{fmtWhen(u.uploadedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <h2>Documents from the firm</h2>
            <p className="panel-sub">
              Documents appear here once an attorney has approved and released
              them to you.
            </p>
            {released.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing has been released yet.</p>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Released</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {released.map((r) => (
                    <tr key={r.versionId}>
                      <td>{r.title}</td>
                      <td>{fmtWhen(r.releasedAt)}</td>
                      <td>
                        <a
                          className="btn btn-quiet"
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          href={`/api/document-versions/${r.versionId}/download`}
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {matter.helpAvailable && (
            <div className="panel">
              <h2>{matter.helpLabel}</h2>
              <p className="panel-sub">
                You do not need to give a reason. The firm will contact you and
                can complete this intake with you by phone, video, in person,
                or on paper.
              </p>
              <button className="btn btn-quiet" onClick={requestHelp} disabled={busy}>
                Ask the firm for help
              </button>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
