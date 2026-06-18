// ═══════════════════════════════════════════════════════════════
// AI MODEL CONFIG — single source of truth for the Anthropic model.
//
// Flip the model via the ANTHROPIC_MODEL env var (Opus by default) —
// no code edits needed. All API routes import ANTHROPIC_MODEL from here.
//
// Default: claude-opus-4-8 (Claude Opus 4.8).
//   Verified at https://docs.claude.com/en/docs/about-claude/models
//   Pricing note: Opus 4.5/4.6/4.7/4.8 are all priced identically
//   ($5/MTok input, $25/MTok output), so 4.8 — the most capable —
//   is the best price-to-performance Opus. There is no cost saving
//   from pinning an older Opus version.
//
// An incorrect model string returns a runtime 404 from the API, so
// only change the default to a model ID confirmed on the docs page
// above (or override via the env var without touching this file).
// ═══════════════════════════════════════════════════════════════
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
