import { redirect } from "next/navigation";

/**
 * 2026-10-31: the "Better intake. Cleaner files." institutional landing is
 * retired (operator: "nuke that whole page"). DivorceGPT has one front door
 * — /portal — and, until PUBLIC_LAUNCH, the access gate in front of it.
 */
export default function Home() {
  redirect("/portal");
}
