# NY Official Form-Family Mappings (facts → form fields)

Generated from the shipped intake configuration (schema version
`2026.07.1`) by `scripts/generate-intake-docs.ts` — do not
hand-edit; regenerate after config changes. Facts are collected from
clients in plain language; legal conclusions are attorney determinations.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.

No court form is generated or filed by this system. These mappings power the
attorney-only form-readiness report: they say which collected FACT feeds
which official form family, so the attorney can see what is present and what
is missing before preparing the official form outside this system. County/
part-specific variations are NOT captured. Nothing here is "ready to file";
filing readiness is a separate attorney exact-version approval.


## NY Statement of Net Worth (UCS Rev. 1/1/24)

| Form field | Fed by item | Type |
|---|---|---|
| I. Family Data | `ny.snw.family_data_confirm` | yes_no |
| II. Expenses | `ny.snw.expenses_confirm` | yes_no |
| III. Gross Income | `ny.snw.income_confirm` | yes_no |
| IV. Assets | `ny.snw.assets_confirm` | yes_no |
| V. Liabilities | `ny.snw.liabilities_confirm` | yes_no |
