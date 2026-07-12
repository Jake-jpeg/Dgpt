# New Jersey Intake Map

Generated from the shipped intake configuration (schema version
`2026.07.1`) by `scripts/generate-intake-docs.ts` — do not
hand-edit; regenerate after config changes. Facts are collected from
clients in plain language; legal conclusions are attorney determinations.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.

## NJ_FM_DIVORCE_UNCONTESTED

Sections: 23 · items: 165 (shared core 135, state 30) · attorney determinations: 12

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.case.grounds_facts` *(required)* | multi_select | CLIENT | always | NJ-DIVORCE-GROUNDS-001 (N.J.S.A. 2A:34-2) |
| `nj.case.grounds_dates` | long_text | CLIENT | if nj.case.grounds_facts answered | NJ-DIVORCE-GROUNDS-001 (N.J.S.A. 2A:34-2) |
| `nj.case.civil_union` | yes_no | CLIENT | always | NJ-CIVILUNION-DISSOLUTION-001 (N.J.S.A. 2A:34-2.1) |
| `nj.case.agreement_posture` *(required)* | single_select | CLIENT | always | — (purely factual) |
| `nj.case.service_facts` | short_text | CLIENT | always | NJ-DIVORCE-PROCESS-001 (n/a) |
| `nj.case.custody_facts_confirm` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-CUSTODY-001 (N.J.S.A. 9:2-4); NJ-DOCKETS-001 (n/a) |
| `nj.case.support_existing` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.); NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.dv.active_fv_docket` | yes_no | CLIENT | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.); NJ-DOCKETS-001 (n/a) |
| `nj.dv.tro_fro_status` | short_text | CLIENT | if nj.dv.active_fv_docket is yes/answered | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |
| `nj.cis.part_a_case` | short_text | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.income_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.budget_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.assets_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.insurance_detail` | long_text | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.docs_request` | document_request | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.clis.confidential_ack` *(required)* | yes_no | CLIENT | always | NJ-CLIS-FORM-001 (CN 10486) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.grounds` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-GROUNDS-001 (N.J.S.A. 2A:34-2) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.alimony_posture` | attorney_determination | ATTORNEY | always | NJ-ALIMONY-001 (N.J.S.A. 2A:34-23 (see also 2A:34-23.1)) |
| `nj.det.ed_posture` | attorney_determination | ATTORNEY | always | NJ-EQUITABLE-DISTRIBUTION-001 (N.J.S.A. 2A:34-23 / 2A:34-23.1) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.grounds` — Which N.J.S.A. 2A:34-2 cause(s) will be pleaded? [NJ-DIVORCE-GROUNDS-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.alimony_posture` — Alimony posture under N.J.S.A. 2A:34-23 (type, duration analysis). [NJ-ALIMONY-001]
- `nj.det.ed_posture` — Equitable-distribution issues requiring analysis (2A:34-23 family; 23.1 [needs cite check]). [NJ-EQUITABLE-DISTRIBUTION-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]

## NJ_FM_DIVORCE_CONTESTED

Sections: 23 · items: 165 (shared core 135, state 30) · attorney determinations: 12

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.case.grounds_facts` *(required)* | multi_select | CLIENT | always | NJ-DIVORCE-GROUNDS-001 (N.J.S.A. 2A:34-2) |
| `nj.case.grounds_dates` | long_text | CLIENT | if nj.case.grounds_facts answered | NJ-DIVORCE-GROUNDS-001 (N.J.S.A. 2A:34-2) |
| `nj.case.civil_union` | yes_no | CLIENT | always | NJ-CIVILUNION-DISSOLUTION-001 (N.J.S.A. 2A:34-2.1) |
| `nj.case.agreement_posture` *(required)* | single_select | CLIENT | always | — (purely factual) |
| `nj.case.service_facts` | short_text | CLIENT | always | NJ-DIVORCE-PROCESS-001 (n/a) |
| `nj.case.custody_facts_confirm` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-CUSTODY-001 (N.J.S.A. 9:2-4); NJ-DOCKETS-001 (n/a) |
| `nj.case.support_existing` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.); NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.dv.active_fv_docket` | yes_no | CLIENT | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.); NJ-DOCKETS-001 (n/a) |
| `nj.dv.tro_fro_status` | short_text | CLIENT | if nj.dv.active_fv_docket is yes/answered | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |
| `nj.cis.part_a_case` | short_text | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.income_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.budget_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.assets_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.insurance_detail` | long_text | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.docs_request` | document_request | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.clis.confidential_ack` *(required)* | yes_no | CLIENT | always | NJ-CLIS-FORM-001 (CN 10486) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.grounds` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-GROUNDS-001 (N.J.S.A. 2A:34-2) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.alimony_posture` | attorney_determination | ATTORNEY | always | NJ-ALIMONY-001 (N.J.S.A. 2A:34-23 (see also 2A:34-23.1)) |
| `nj.det.ed_posture` | attorney_determination | ATTORNEY | always | NJ-EQUITABLE-DISTRIBUTION-001 (N.J.S.A. 2A:34-23 / 2A:34-23.1) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.grounds` — Which N.J.S.A. 2A:34-2 cause(s) will be pleaded? [NJ-DIVORCE-GROUNDS-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.alimony_posture` — Alimony posture under N.J.S.A. 2A:34-23 (type, duration analysis). [NJ-ALIMONY-001]
- `nj.det.ed_posture` — Equitable-distribution issues requiring analysis (2A:34-23 family; 23.1 [needs cite check]). [NJ-EQUITABLE-DISTRIBUTION-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]

## NJ_FM_POST_JUDGMENT

Sections: 23 · items: 159 (shared core 135, state 24) · attorney determinations: 11

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.case.civil_union` | yes_no | CLIENT | always | NJ-CIVILUNION-DISSOLUTION-001 (N.J.S.A. 2A:34-2.1) |
| `nj.cis.part_a_case` | short_text | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.income_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.budget_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.assets_confirm` *(required)* | yes_no | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.insurance_detail` | long_text | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.cis.docs_request` | document_request | CLIENT | always | NJ-CIS-FORM-001 (Rules of Court Appendix V; form CN 10482) |
| `nj.clis.confidential_ack` *(required)* | yes_no | CLIENT | always | NJ-CLIS-FORM-001 (CN 10486) |
| `nj.pj.judgment_date` *(required)* | date | CLIENT | always | NJ-POSTJUDGMENT-KIT-001 (CN 10483) |
| `nj.pj.relief` *(required)* | single_select | CLIENT | always | NJ-POSTJUDGMENT-KIT-001 (CN 10483) |
| `nj.pj.changed_circumstances` *(required)* | long_text | CLIENT | always | NJ-POSTJUDGMENT-KIT-001 (CN 10483) |
| `nj.pj.compliance` | long_text | CLIENT | if nj.pj.relief = "ENFORCE" | — (purely factual) |
| `nj.pj.counsel_fees` | yes_no | CLIENT | always | NJ-ALIMONY-001 (N.J.S.A. 2A:34-23 (see also 2A:34-23.1)) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.alimony_posture` | attorney_determination | ATTORNEY | always | NJ-ALIMONY-001 (N.J.S.A. 2A:34-23 (see also 2A:34-23.1)) |
| `nj.det.ed_posture` | attorney_determination | ATTORNEY | always | NJ-EQUITABLE-DISTRIBUTION-001 (N.J.S.A. 2A:34-23 / 2A:34-23.1) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.alimony_posture` — Alimony posture under N.J.S.A. 2A:34-23 (type, duration analysis). [NJ-ALIMONY-001]
- `nj.det.ed_posture` — Equitable-distribution issues requiring analysis (2A:34-23 family; 23.1 [needs cite check]). [NJ-EQUITABLE-DISTRIBUTION-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]

## NJ_FD_CUSTODY_PARENTING

Sections: 23 · items: 153 (shared core 135, state 18) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.fd.relief_sought` *(required)* | multi_select | CLIENT | always | NJ-FD-NONDISSOLUTION-001 (n/a); NJ-DOCKETS-001 (n/a) |
| `nj.fd.parentage_status` | yes_no | CLIENT | always | NJ-FD-NONDISSOLUTION-001 (n/a) |
| `nj.case.custody_facts_confirm` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-CUSTODY-001 (N.J.S.A. 9:2-4); NJ-DOCKETS-001 (n/a) |
| `nj.case.support_existing` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.); NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.dv.active_fv_docket` | yes_no | CLIENT | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.); NJ-DOCKETS-001 (n/a) |
| `nj.dv.tro_fro_status` | short_text | CLIENT | if nj.dv.active_fv_docket is yes/answered | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |
| `nj.clis.confidential_ack` *(required)* | yes_no | CLIENT | always | NJ-CLIS-FORM-001 (CN 10486) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]

## NJ_FD_SUPPORT_PARENTAGE

Sections: 23 · items: 154 (shared core 135, state 19) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.fd.relief_sought` *(required)* | multi_select | CLIENT | always | NJ-FD-NONDISSOLUTION-001 (n/a); NJ-DOCKETS-001 (n/a) |
| `nj.fd.parentage_status` | yes_no | CLIENT | always | NJ-FD-NONDISSOLUTION-001 (n/a) |
| `nj.case.custody_facts_confirm` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-CUSTODY-001 (N.J.S.A. 9:2-4); NJ-DOCKETS-001 (n/a) |
| `nj.case.support_existing` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.); NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.uifsa.out_of_state_party` | short_text | CLIENT | always | NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.dv.active_fv_docket` | yes_no | CLIENT | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.); NJ-DOCKETS-001 (n/a) |
| `nj.dv.tro_fro_status` | short_text | CLIENT | if nj.dv.active_fv_docket is yes/answered | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |
| `nj.clis.confidential_ack` *(required)* | yes_no | CLIENT | always | NJ-CLIS-FORM-001 (CN 10486) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]

## NJ_UCCJEA_INTERSTATE

Sections: 23 · items: 147 (shared core 135, state 12) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.); NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.uifsa.out_of_state_party` | short_text | CLIENT | always | NJ-UIFSA-001 (N.J.S.A. 2A:4-30.123 et seq. (verified: 2A:4-30.133)) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]

## NJ_EMERGENCY_OR_DV_ESCALATION

Sections: 23 · items: 146 (shared core 135, state 11) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `nj.case.resident_now` *(required)* | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.resident_since` | date | CLIENT | if nj.case.resident_now is yes/answered | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.spouse_resident` | yes_no | CLIENT | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.case.county` *(required)* | single_select | CLIENT | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.dv.active_fv_docket` | yes_no | CLIENT | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.); NJ-DOCKETS-001 (n/a) |
| `nj.dv.tro_fro_status` | short_text | CLIENT | if nj.dv.active_fv_docket is yes/answered | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |
| `nj.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NJ-DIVORCE-JURISDICTION-001 (N.J.S.A. 2A:34-8; 2A:34-10) |
| `nj.det.venue` | attorney_determination | ATTORNEY | always | NJ-COURT-RULES-PART5-001 (Part V; Appendices V, IX) |
| `nj.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-UCCJEA-001 (N.J.S.A. 2A:34-53 et seq.) |
| `nj.det.support_guidelines` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NJ-CS-GUIDELINES-001 (Appendix IX-A, IX-B (and annual updating orders)) |
| `nj.det.dv_escalation` | attorney_determination | ATTORNEY | always | NJ-DV-PDVA-001 (N.J.S.A. 2C:25-17 et seq.) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `nj.det.residence_satisfied` — Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts? [NJ-DIVORCE-JURISDICTION-001]
- `nj.det.venue` — Proper county/venue for filing. [NJ-COURT-RULES-PART5-001]
- `nj.det.uccjea` — UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.). [NJ-UCCJEA-001]
- `nj.det.support_guidelines` — Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets. [NJ-CS-GUIDELINES-001]
- `nj.det.dv_escalation` — PDVA escalation / protective steps required? [NJ-DV-PDVA-001]
