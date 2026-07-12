/**
 * Upload policy: MIME allowlist + size limits. Enforced server-side on
 * every upload path.
 */
import { HttpError } from "@/lib/auth/rbac";

export const ALLOWED_UPLOAD_MIMES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/plain": ".txt",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? "15");
  return (Number.isFinite(mb) && mb > 0 ? mb : 15) * 1024 * 1024;
}

export function assertUploadAllowed(mime: string, sizeBytes: number): void {
  if (!ALLOWED_UPLOAD_MIMES[mime]) {
    throw new HttpError(415, "This file type is not accepted");
  }
  if (sizeBytes <= 0) throw new HttpError(400, "VALIDATION: empty file");
  if (sizeBytes > maxUploadBytes()) {
    throw new HttpError(413, "This file is larger than the allowed upload size");
  }
}

/** Original filenames are metadata only — normalize to a safe display string. */
export function sanitizeDisplayFilename(name: string): string {
  return name.replace(/[\\/\0]/g, "_").replace(/\s+/g, " ").trim().slice(0, 200) || "upload";
}
