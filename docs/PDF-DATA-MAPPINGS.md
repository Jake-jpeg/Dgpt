# PDF Data Mappings (deterministic; Part 3)

Source: `src/lib/pdf-service/mappings.ts`. Pure functions over SAVED
intake answers + the attorney's jurisdiction determination. Identical
answers ⇒ identical payload (fingerprint audited on every render).
Missing critical facts throw VALIDATION — fields are never invented.
OpenAI contributes nothing to these payloads.

## NJ `verification` (Certification of Verification and Non-Collusion)

| RL field | Source | Rule |
|---|---|---|
| plaintiffName | `shared.identity.client_name` | verbatim |
| defendantName | `shared.identity.other_name` | verbatim |
| plaintiffAddress | `shared.identity.client_address` | `line1, city, ST zip` (RL splits) |
| plaintiffPhone | — | deliberately blank (sensitive contact data) |
| filingCounty | `nj.case.county` | option value → title case (`BERGEN`→`Bergen`) |
| docketNumber | — | blank pre-filing |
| (required) | name/other/address/county | else VALIDATION |

## NJ `complaint` (Complaint for Divorce)

Adds to the base fields:

| RL field | Source | Rule |
|---|---|---|
| marriageDate | `shared.relationship.marriage_date` | required |
| marriageCity / marriageState | `shared.relationship.marriage_place` (city part) / `marriage_state` | RL derives ceremonyLocation |
| ceremonyType | `shared.relationship.ceremony_type` | `RELIGIOUS`→religious else civil |
| residencyParty | — | fixed `plaintiff` (client is filing party in this proof) |
| defendantAddress | — | blank: adverse-party address is attorney-entered at form prep |

## NY `ud1` (Summons with Notice)

| RL field | Source | Rule |
|---|---|---|
| plaintiffName / defendantName | identity answers | verbatim |
| plaintiffAddress / qualifyingAddress | `shared.identity.client_address` | combined string |
| filingCounty | `ny.case.county` | title case |
| qualifyingParty | — | fixed `plaintiff` |
| dateFiled | — | blank (court-stamped, never pre-filled) |

## Unresolved mappings (open, tracked)

- Adverse-party address (NJ complaint `defendantAddress`) — intentionally
  blank; attorney enters it at final form preparation. [COUNSEL REVIEW REQUIRED]
- Grounds narrative paragraphs on the NJ complaint use the generator's
  fixed statutory template; the intake grounds facts inform the attorney,
  not the renderer. [COUNSEL REVIEW REQUIRED]
- NY SNW financial schedules are NOT rendered (form-version review
  outstanding: NY-SNW-FORM-001 remains flagged). UD-1 only in this proof.
- County/part-specific caption variations are out of scope. [COUNSEL REVIEW REQUIRED]

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
