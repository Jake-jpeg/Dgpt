/**
 * Deployment-stage awareness (APP_STAGE). Three stages exist; anything
 * unrecognized or unset is treated as LOCAL — the most restrictive posture
 * for real-data handling and the only stage where the development login can
 * exist (src/lib/auth/test-login.ts).
 *
 *   local        — developer machine, synthetic data only
 *   staging      — invitation-only synthetic test deployment
 *   closed_pilot — closed Jake Kim Law Firm pilot (invited clients only)
 */
import { operatingFirmName } from "@/config/branding";

export type AppStage = "local" | "staging" | "closed_pilot";

export function appStage(): AppStage {
  const raw = (process.env.APP_STAGE ?? "").trim().toLowerCase();
  if (raw === "staging") return "staging";
  if (raw === "closed_pilot") return "closed_pilot";
  return "local";
}

export function isLocalStage(): boolean {
  return appStage() === "local";
}

/** Stage-aware public status copy (landing page). */
export function stageStatusCopy(stage: AppStage = appStage()): string {
  switch (stage) {
    case "local":
      return "Local development environment. No real client information may be entered.";
    case "staging":
      return "Invitation-only test environment. Not available for public use.";
    case "closed_pilot":
      return (
        `DivorceGPT is not available for public self-service. Access is limited ` +
        `to invited clients of ${operatingFirmName()} and authorized legal ` +
        `personnel. Legal services are provided only under a separate written ` +
        `engagement agreement with the firm.`
      );
  }
}
