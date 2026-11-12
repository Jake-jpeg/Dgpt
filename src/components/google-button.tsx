"use client";

/**
 * The one client sign-in button (2026-11-12: Google is the only client
 * door). Laid out the way Google's sign-in branding guidelines ask: a white
 * button, the mark on the left, "Continue with Google" in a medium weight.
 *
 * The mark is Google's own artwork, supplied by the operator (2026-11-12)
 * and stored at public/brand/google-g.webp — scaled down to button size,
 * otherwise untouched. It is never drawn in code. If the file fails to load
 * a neutral glyph stands in, so the button never renders a broken image.
 */
import { useState } from "react";

export const GOOGLE_MARK_SRC = "/brand/google-g.webp";

function NeutralMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 19.5c1.2-3.4 4-5.2 7.5-5.2s6.3 1.8 7.5 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function GoogleButton({
  onClick,
  label,
  disabled,
  block = true,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  block?: boolean;
}) {
  const [markOk, setMarkOk] = useState(true);
  return (
    <button type="button" className={`g-btn${block ? " g-btn-block" : ""}`} onClick={onClick} disabled={disabled}>
      <span className="g-btn-mark">
        {markOk ? (
          // eslint-disable-next-line @next/next/no-img-element -- a 18px static mark; next/image adds nothing here
          <img src={GOOGLE_MARK_SRC} alt="" width={18} height={18} onError={() => setMarkOk(false)} />
        ) : (
          <NeutralMark />
        )}
      </span>
      <span className="g-btn-label">{label}</span>
    </button>
  );
}
