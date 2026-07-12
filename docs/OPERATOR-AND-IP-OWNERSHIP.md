# Operator & IP Ownership — DivorceGPT 2.0

Rule applied throughout this pass: **ownership facts are never invented.**
Where existing source material does not clearly establish a fact, it is
marked `[OWNER CONFIRMATION REQUIRED]` here (internal documentation only —
the token never renders publicly; public copy OMITS unconfirmed statements).

## Identity fields (configurable — src/config/branding.ts)

| Field | Accessor | Default | Status |
|---|---|---|---|
| Legal-services provider | `legalServicesProvider()` | Jake Kim Law Firm (= operating firm) | FIXED PRODUCT RULE — the client-facing application always identifies Jake Kim Law Firm as the legal-services provider; not separately configurable |
| Portal operator | `portalOperator()` / NEXT_PUBLIC_PORTAL_OPERATOR | operating firm | Consistent with existing copy ("workflow software used by {firm}"); [OWNER CONFIRMATION REQUIRED] whether a different entity should be named the operator |
| Software owner | `softwareOwner()` / NEXT_PUBLIC_SOFTWARE_OWNER | "" (omitted publicly) | **[OWNER CONFIRMATION REQUIRED]** — not clearly established in existing source material |
| Copyright owner | `copyrightOwner()` / NEXT_PUBLIC_COPYRIGHT_OWNER | June Guided Solutions, LLC | Carries forward the footer statement that pre-dates this pass; [OWNER CONFIRMATION REQUIRED] to confirm it remains correct |

## Every current statement concerning ownership or operation

1. **Landing footer (src/app/page.tsx):** "© {year} June Guided Solutions,
   LLC." — pre-existing statement (present on `main` before this branch);
   now rendered via `copyrightOwner()`. [OWNER CONFIRMATION REQUIRED] to
   confirm continued accuracy.
2. **Landing footer:** "DivorceGPT.com is an independent project and is not
   affiliated with, sponsored by, or endorsed by OpenAI." — pre-existing
   non-affiliation statement; retained verbatim (required).
3. **Landing footer + portal shell footer (src/components/shell.tsx):**
   "DivorceGPT is workflow software used by Jake Kim Law Firm. Legal
   services … are provided by the firm and its attorneys — never by the
   software itself." — operation statement; consistent with the build
   directives. Establishes USE, not ownership.
4. **Client disclosure (src/config/disclosure.ts):** "{firm} is the provider
   of legal services… DivorceGPT is workflow software used by {firm}…" —
   operation + provider statement; [COUNSEL REVIEW REQUIRED] for final
   wording (already marked in source).
5. **README.md (institutional-pilot section):** "DivorceGPT by June Guided
   Solutions, LLC" — pre-existing README statement. Left as prior material;
   [OWNER CONFIRMATION REQUIRED] whether "by June Guided Solutions, LLC"
   states development, ownership, or both.
6. **AGENTS.md:** describes the repo as owned/operated by Jake Kim
   (attorney) with the public GitHub repo under `Jake-jpeg` — historical
   context material, not client-facing.

## Unresolved questions for the owner (do not guess)

- Who owns the DivorceGPT software and IP: June Guided Solutions, LLC, Jake
  Kim Law Firm, Jake Kim personally, or some combination?
  **[OWNER CONFIRMATION REQUIRED]**
- What is the formal relationship between June Guided Solutions, LLC and
  Jake Kim Law Firm (license? internal tool? affiliate)?
  **[OWNER CONFIRMATION REQUIRED]**
- Should public copy name a software owner at all during the closed pilot?
  Until confirmed, public copy names only: the firm as legal-services
  provider/operator, and the pre-existing copyright line.

## What the application will and will not say

- ALWAYS: Jake Kim Law Firm is the legal-services provider; the software is
  not a law firm and provides no legal advice; representation is governed by
  a separate written engagement agreement.
- NEVER (until confirmed): any new claim about who owns the software or the
  relationship among the entities above.
