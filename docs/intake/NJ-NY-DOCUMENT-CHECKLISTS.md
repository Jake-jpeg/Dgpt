# NJ/NY Deterministic Document Checklists

Generated from the shipped intake configuration (schema version
`2026.07.1`) by `scripts/generate-intake-docs.ts` — do not
hand-edit; regenerate after config changes. Facts are collected from
clients in plain language; legal conclusions are attorney determinations.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.

The checklist is derived from the versioned schema + the client's factual
answers by `deriveChecklist` — never by a model. Clients see plain-language
requests for applicable items only. Staff can mark received/incomplete;
waiving an item is an ATTORNEY-ONLY determination. The checklist is the
AUTHORITATIVE document list; the AI document-gap report is commentary that
can never modify it.


## NJ_FM_DIVORCE_UNCONTESTED

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `nj.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `nj.cis.insurance_detail` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `nj.dv.active_fv_docket` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | triggered by `nj.cis.docs_request` |
| Judgment of divorce / existing NJ orders | baseline for this workflow |

## NJ_FM_DIVORCE_CONTESTED

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `nj.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `nj.cis.insurance_detail` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `nj.dv.active_fv_docket` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | triggered by `nj.cis.docs_request` |
| Judgment of divorce / existing NJ orders | baseline for this workflow |

## NJ_FM_POST_JUDGMENT

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro` |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `nj.cis.insurance_detail` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | triggered by `nj.cis.docs_request` |
| Judgment of divorce / existing NJ orders | triggered by `nj.pj.judgment_date` |

## NJ_FD_CUSTODY_PARENTING

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `nj.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `nj.dv.active_fv_docket` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | baseline for this workflow |
| Judgment of divorce / existing NJ orders | baseline for this workflow |

## NJ_FD_SUPPORT_PARENTAGE

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `nj.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `nj.dv.active_fv_docket` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | baseline for this workflow |
| Judgment of divorce / existing NJ orders | baseline for this workflow |

## NJ_UCCJEA_INTERSTATE

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `nj.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | baseline for this workflow |
| Judgment of divorce / existing NJ orders | baseline for this workflow |

## NJ_EMERGENCY_OR_DV_ESCALATION

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro` |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `nj.dv.active_fv_docket` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| CIS supporting documents | baseline for this workflow |
| Judgment of divorce / existing NJ orders | baseline for this workflow |

## NY_SUPREME_UNCONTESTED_JOINT

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `ny.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `ny.snw.health_coverage` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `ny.fo.existing_case` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | triggered by `ny.snw.docs_request` |
| Settlement / separation agreement | triggered by `ny.case.signed_agreement` |
| Judgment of divorce / existing NY orders | baseline for this workflow |

## NY_SUPREME_UNCONTESTED

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `ny.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `ny.snw.health_coverage` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `ny.fo.existing_case` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | triggered by `ny.snw.docs_request` |
| Settlement / separation agreement | triggered by `ny.case.signed_agreement` |
| Judgment of divorce / existing NY orders | baseline for this workflow |

## NY_SUPREME_CONTESTED

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `ny.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `ny.snw.health_coverage` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `ny.fo.existing_case` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | triggered by `ny.snw.docs_request` |
| Settlement / separation agreement | triggered by `ny.case.signed_agreement` |
| Judgment of divorce / existing NY orders | baseline for this workflow |

## NY_SUPREME_POST_JUDGMENT

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro` |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records`; `ny.snw.health_coverage` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | triggered by `ny.snw.docs_request` |
| Settlement / separation agreement | baseline for this workflow |
| Judgment of divorce / existing NY orders | triggered by `ny.pj.judgment_date` |

## NY_FAMILY_COURT_CUSTODY_VISITATION

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `ny.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `ny.fo.existing_case` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | baseline for this workflow |
| Settlement / separation agreement | baseline for this workflow |
| Judgment of divorce / existing NY orders | baseline for this workflow |

## NY_FAMILY_COURT_SUPPORT_PARENTAGE

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `ny.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `ny.fo.existing_case` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | baseline for this workflow |
| Settlement / separation agreement | baseline for this workflow |
| Judgment of divorce / existing NY orders | baseline for this workflow |

## NY_UCCJEA_INTERSTATE

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro`; `ny.uccjea.other_state_orders` (if shared.children.any is yes/answered) |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | baseline for this workflow |
| Settlement / separation agreement | baseline for this workflow |
| Judgment of divorce / existing NY orders | baseline for this workflow |

## NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION

| Document | Requested when |
|---|---|
| Marriage / civil union certificate | triggered by `shared.relationship.marriage_date` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]); `shared.documents.marriage_certificate` (if shared.relationship.status_kind ∈ ["MARRIAGE","CIVIL_UNION","DOMESTIC_PARTNERSHIP"]) |
| Prenuptial / separation / settlement agreements | triggered by `shared.relationship.written_agreements` |
| Court pleadings, judgments & orders | triggered by `shared.priors.records`; `shared.priors.support_orders`; `shared.priors.custody_orders`; `shared.children.parentage_docs` (if shared.children.any is yes/answered); `shared.retirement.existing_dro` |
| Tax returns (last 3 years) | triggered by `shared.income.sources`; `shared.income.history`; `shared.taxes.filing_status`; `shared.documents.tax_returns` |
| Pay records | triggered by `shared.income.employers`; `shared.income.sources`; `shared.documents.pay_records` |
| Bank statements | triggered by `shared.assets.records`; `shared.property.tracing_docs`; `shared.documents.bank_statements` |
| Retirement / pension statements | triggered by `shared.retirement.records` |
| Investment account statements | triggered by `shared.assets.records` |
| Deeds & mortgage statements | triggered by `shared.assets.records`; `shared.assets.real_estate_any`; `shared.property.tracing_docs` |
| Appraisals / valuations | triggered by `shared.assets.real_estate_any`; `shared.business.financials` (if shared.business.any is yes/answered) |
| Business records | triggered by `shared.business.records` (if shared.business.any is yes/answered); `shared.business.financials` (if shared.business.any is yes/answered) |
| Insurance policies / cards | triggered by `shared.children.insurance` (if shared.children.any is yes/answered); `shared.insurance.records` |
| Children's school records | triggered by `shared.children.records` (if shared.children.any is yes/answered) |
| Medical records (children, if relevant) | triggered by `shared.children.special_needs` (if shared.children.any is yes/answered) |
| Proof of childcare costs | triggered by `shared.expenses.childcare` (if shared.children.any is yes/answered) |
| Relevant communications | baseline for this workflow |
| Photographs | baseline for this workflow |
| Police reports | triggered by `shared.priors.criminal_safety` |
| Protective / restraining orders | triggered by `shared.safety.current_protective_order`; `shared.safety.prior_protective_order`; `ny.fo.existing_case` |
| Bankruptcy filings | triggered by `shared.priors.bankruptcy` |
| Immigration documents (only if requested) | baseline for this workflow |
| Statement of Net Worth supporting documents | baseline for this workflow |
| Settlement / separation agreement | baseline for this workflow |
| Judgment of divorce / existing NY orders | baseline for this workflow |
