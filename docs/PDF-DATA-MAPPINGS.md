# PDF Data Mappings (deterministic; Part 3)

Source: `src/lib/pdf-service/mappings.ts`. Pure functions over SAVED
intake answers + the attorney's jurisdiction determination. Identical
answers ⇒ identical payload (fingerprint audited on every render).
Missing critical facts throw VALIDATION — fields are never invented.
OpenAI contributes nothing to these payloads.

## NY `ud1` (Summons with Notice)

| RL field | Source | Rule |
|---|---|---|
| plaintiffName / defendantName | identity answers | verbatim |
| plaintiffAddress / qualifyingAddress | `shared.identity.client_address` | combined string |
| filingCounty | `ny.case.county` | title case |
| qualifyingParty | — | fixed `plaintiff` |
| dateFiled | — | blank (court-stamped, never pre-filled) |

## Unresolved mappings (open, tracked)

- Adverse-party address — intentionally
  blank; attorney enters it at final form preparation. [COUNSEL REVIEW REQUIRED]
  fixed statutory template; the intake grounds facts inform the attorney,
  not the renderer. [COUNSEL REVIEW REQUIRED]
- NY SNW financial schedules are NOT rendered (form-version review
  outstanding: NY-SNW-FORM-001 remains flagged). UD-1 only in this proof.
- County/part-specific caption variations are out of scope. [COUNSEL REVIEW REQUIRED]

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
