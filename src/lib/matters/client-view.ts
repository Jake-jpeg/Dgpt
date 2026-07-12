/**
 * Client-facing matter language — plain, neutral, non-advisory,
 * non-accusatory. Internal conflict machinery is NEVER exposed: every
 * pending/intermediate screening state reads identically.
 *
 * [COUNSEL REVIEW REQUIRED] — final wording of these statuses should be
 * approved by the supervising attorney before live client use. (Marker is
 * source-documentation only; the strings below are what users see.)
 */
import type { MatterRow } from "@/lib/db/matters";

export function clientMatterStatus(m: MatterRow): string {
  if (m.conflictStatus === "NOT_STARTED") {
    return "Your matter is set up. The next step is to provide the initial information the firm has requested.";
  }
  if (m.conflictStatus === "CLEARED") {
    return "Your matter is active. You can continue with the steps shown below.";
  }
  if (m.conflictStatus === "DECLINED") {
    return "The firm is unable to proceed through this portal. The firm will contact you regarding the next step.";
  }
  // Any pending/intermediate screening state reads the same to the client.
  return "Your information has been submitted for review. The firm will contact you regarding the next step.";
}
