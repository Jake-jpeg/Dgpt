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

## NY `complaint` (Verified Complaint — Action for Divorce, Phase 1)

RL generator: `states/new_york/generate_complaint.py`. Every payload field
traces to a pleading paragraph (spec: project doc
`claude/PHASE1-verified-complaint-spec.md`).

| RL field | Source | Rule |
|---|---|---|
| plaintiffName / defendantName | identity answers | verbatim (caption, ¶SIXTH, verification) |
| county | `ny.case.county` | title case (caption + venue) |
| plaintiffAddress | `shared.identity.client_address` | combined string (¶SIXTH) |
| defendantAddress | `shared.identity.other_address` | combined string (¶SIXTH) |
| residentParty | — | fixed `plaintiff` (¶FIRST, DRL § 230(5) two-year ground — the only automated pass) |
| marriageDate / marriagePlace | `shared.relationship.marriage_date` / `marriage_place` (+ `marriage_state` when not redundant) | ¶THIRD |
| ceremonyType | `shared.relationship.ceremony_type` | `civil` \| `religious` — drives the ¶FOURTH DRL § 253 branch |
| unemancipatedChildren | — | fixed `"0"`: the children gate STOPS child cases pre-render; the generator renders an [ATTORNEY REVIEW REQUIRED] paragraph as backstop |

## NY `ud14` / `ud15` (Phase 3 — finalization, post-judgment)

RL generators: `generate_ud14.py` (Notice of Entry), `generate_ud15.py`
(Affirmation of Service by Mail of the JOD).

| RL field | Source | Rule |
|---|---|---|
| plaintiffName / defendantName | identity answers | verbatim (caption) |
| county | `ny.case.county` | title case |
| indexNumber | `ny.case.index_number` | verbatim; blank if not yet recorded |
| plaintiffAddress | `shared.identity.client_address` | combined string (ud14) |
| defendantAddress / defendantCurrentAddress | `shared.identity.other_address` | combined string; required for service forms |
| judgmentEntryDate | — | blank (clerk-stamped; attorney completes at service) |
| server identity / mailing date (ud15) | — | blank (third-party server ≥18, completed by the firm at execution) |

## Unresolved mappings (open, tracked)

- Adverse-party address — intentionally
  blank; attorney enters it at final form preparation. [COUNSEL REVIEW REQUIRED]
  fixed statutory template; the intake grounds facts inform the attorney,
  not the renderer. [COUNSEL REVIEW REQUIRED]
- NY SNW financial schedules are NOT rendered (form-version review
  outstanding: NY-SNW-FORM-001 remains flagged). UD-1 only in this proof.
- County/part-specific caption variations are out of scope. [COUNSEL REVIEW REQUIRED]

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
