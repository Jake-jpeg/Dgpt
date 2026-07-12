# New York Intake Map

Generated from the shipped intake configuration (schema version
`2026.07.1`) by `scripts/generate-intake-docs.ts` — do not
hand-edit; regenerate after config changes. Facts are collected from
clients in plain language; legal conclusions are attorney determinations.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.

## NY_SUPREME_UNCONTESTED_JOINT

Sections: 23 · items: 166 (shared core 135, state 31) · attorney determinations: 12

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.married_in_ny` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.lived_in_ny_as_spouses` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.case.grounds_facts` *(required)* | multi_select | CLIENT | always | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.case.grounds_dates` | long_text | CLIENT | if ny.case.grounds_facts answered | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.case.agreement_posture` *(required)* | single_select | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.case.signed_agreement` | yes_no | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.case.index_number` | short_text | CLIENT | always | NY-CONTESTED-PROCESS-001 (n/a) |
| `ny.case.service_facts` | short_text | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)); NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.fo.existing_case` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fo.order_detail` | short_text | CLIENT | if ny.fo.existing_case is yes/answered | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.snw.family_data_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)); NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.snw.expenses_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.income_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.assets_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.liabilities_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.docs_request` | document_request | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.health_coverage` | long_text | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.grounds` | attorney_determination | ATTORNEY | always | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.maintenance_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.ed_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.grounds` — Which DRL § 170 ground(s) will be pleaded? [NY-DIVORCE-GROUNDS-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.maintenance_posture` — Maintenance posture under DRL § 236(B)(5-a)/(6). No calculator implemented; use official UCS tools. [NY-ED-MAINTENANCE-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.ed_posture` — Equitable-distribution issues requiring analysis (DRL § 236(B)(5)). [NY-ED-MAINTENANCE-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_SUPREME_UNCONTESTED

Sections: 23 · items: 166 (shared core 135, state 31) · attorney determinations: 12

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.married_in_ny` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.lived_in_ny_as_spouses` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.case.grounds_facts` *(required)* | multi_select | CLIENT | always | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.case.grounds_dates` | long_text | CLIENT | if ny.case.grounds_facts answered | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.case.agreement_posture` *(required)* | single_select | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.case.signed_agreement` | yes_no | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.case.index_number` | short_text | CLIENT | always | NY-CONTESTED-PROCESS-001 (n/a) |
| `ny.case.service_facts` | short_text | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)); NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.fo.existing_case` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fo.order_detail` | short_text | CLIENT | if ny.fo.existing_case is yes/answered | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.snw.family_data_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)); NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.snw.expenses_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.income_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.assets_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.liabilities_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.docs_request` | document_request | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.health_coverage` | long_text | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.grounds` | attorney_determination | ATTORNEY | always | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.maintenance_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.ed_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.grounds` — Which DRL § 170 ground(s) will be pleaded? [NY-DIVORCE-GROUNDS-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.maintenance_posture` — Maintenance posture under DRL § 236(B)(5-a)/(6). No calculator implemented; use official UCS tools. [NY-ED-MAINTENANCE-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.ed_posture` — Equitable-distribution issues requiring analysis (DRL § 236(B)(5)). [NY-ED-MAINTENANCE-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_SUPREME_CONTESTED

Sections: 23 · items: 166 (shared core 135, state 31) · attorney determinations: 12

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.married_in_ny` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.lived_in_ny_as_spouses` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.case.grounds_facts` *(required)* | multi_select | CLIENT | always | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.case.grounds_dates` | long_text | CLIENT | if ny.case.grounds_facts answered | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.case.agreement_posture` *(required)* | single_select | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.case.signed_agreement` | yes_no | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.case.index_number` | short_text | CLIENT | always | NY-CONTESTED-PROCESS-001 (n/a) |
| `ny.case.service_facts` | short_text | CLIENT | always | NY-UNCONTESTED-FORMS-001 (UD-1 … UD-15) |
| `ny.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)); NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.fo.existing_case` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fo.order_detail` | short_text | CLIENT | if ny.fo.existing_case is yes/answered | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.snw.family_data_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)); NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.snw.expenses_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.income_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.assets_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.liabilities_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.docs_request` | document_request | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.health_coverage` | long_text | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.grounds` | attorney_determination | ATTORNEY | always | NY-DIVORCE-GROUNDS-001 (DRL § 170) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.maintenance_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.ed_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.grounds` — Which DRL § 170 ground(s) will be pleaded? [NY-DIVORCE-GROUNDS-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.maintenance_posture` — Maintenance posture under DRL § 236(B)(5-a)/(6). No calculator implemented; use official UCS tools. [NY-ED-MAINTENANCE-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.ed_posture` — Equitable-distribution issues requiring analysis (DRL § 236(B)(5)). [NY-ED-MAINTENANCE-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_SUPREME_POST_JUDGMENT

Sections: 23 · items: 160 (shared core 135, state 25) · attorney determinations: 11

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.married_in_ny` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.lived_in_ny_as_spouses` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.case.index_number` | short_text | CLIENT | always | NY-CONTESTED-PROCESS-001 (n/a) |
| `ny.snw.family_data_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)); NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.snw.expenses_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.income_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.assets_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.liabilities_confirm` *(required)* | yes_no | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.docs_request` | document_request | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.snw.health_coverage` | long_text | CLIENT | always | NY-SNW-FORM-001 (UCS matrimonial form (Rev. 1/1/24)) |
| `ny.pj.judgment_date` *(required)* | date | CLIENT | always | NY-CONTESTED-PROCESS-001 (n/a) |
| `ny.pj.relief` *(required)* | single_select | CLIENT | always | — (purely factual) |
| `ny.pj.changed_circumstances` *(required)* | long_text | CLIENT | always | — (purely factual) |
| `ny.pj.compliance` | long_text | CLIENT | if ny.pj.relief = "ENFORCE" | — (purely factual) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.maintenance_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.ed_posture` | attorney_determination | ATTORNEY | always | NY-ED-MAINTENANCE-001 (DRL § 236(B), incl. B(5), B(5-a), B(6)) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.maintenance_posture` — Maintenance posture under DRL § 236(B)(5-a)/(6). No calculator implemented; use official UCS tools. [NY-ED-MAINTENANCE-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.ed_posture` — Equitable-distribution issues requiring analysis (DRL § 236(B)(5)). [NY-ED-MAINTENANCE-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_FAMILY_COURT_CUSTODY_VISITATION

Sections: 23 · items: 151 (shared core 135, state 16) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.fc.relief_sought` *(required)* | multi_select | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fc.parentage_status` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fc.existing_supreme` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)); NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.fo.existing_case` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fo.order_detail` | short_text | CLIENT | if ny.fo.existing_case is yes/answered | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_FAMILY_COURT_SUPPORT_PARENTAGE

Sections: 23 · items: 152 (shared core 135, state 17) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.fc.relief_sought` *(required)* | multi_select | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fc.parentage_status` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fc.existing_supreme` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)); NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.uifsa.out_of_state_party` | short_text | CLIENT | always | NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.fo.existing_case` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fo.order_detail` | short_text | CLIENT | if ny.fo.existing_case is yes/answered | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_UCCJEA_INTERSTATE

Sections: 23 · items: 147 (shared core 135, state 12) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.uccjea.child_home_state_facts` | long_text | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.uccjea.other_state_orders` | yes_no | CLIENT | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)); NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.uifsa.out_of_state_party` | short_text | CLIENT | always | NY-UIFSA-001 (FCA Art. 5-B; § 580-201) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]

## NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION

Sections: 23 · items: 146 (shared core 135, state 11) · attorney determinations: 9

### State-specific items

| Item | Type | Audience | Shown | Authority mapping |
|---|---|---|---|---|
| `ny.case.resident_now` *(required)* | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.resident_since` | date | CLIENT | if ny.case.resident_now is yes/answered | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.spouse_resident` | yes_no | CLIENT | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.case.county` *(required)* | short_text | CLIENT | always | NY-MATRIMONIAL-RULES-001 (22 NYCRR 202.16 family) |
| `ny.fo.existing_case` | yes_no | CLIENT | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.fo.order_detail` | short_text | CLIENT | if ny.fo.existing_case is yes/answered | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.residence_satisfied` | attorney_determination | ATTORNEY | always | NY-DIVORCE-RESIDENCE-001 (DRL § 230) |
| `ny.det.court_selection` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |
| `ny.det.uccjea` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-UCCJEA-001 (DRL §§ 75, 76, 77-g (Art. 5-A)) |
| `ny.det.cssa_posture` | attorney_determination | ATTORNEY | if shared.children.any is yes/answered | NY-CSSA-001 (FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check])); NY-MAINT-CS-TOOLS-001 (n/a) |
| `ny.det.fo_escalation` | attorney_determination | ATTORNEY | always | NY-FC-JURISDICTION-001 (FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812) |

### Attorney determinations (never client-visible)

- `shared.det.jurisdiction` — Which state's courts should this matter proceed in, based on the residence and case-history facts? 
- `shared.det.parentage` — Are there parentage issues requiring resolution? 
- `shared.det.property_character` — Preliminary characterization questions on property (marital/separate/commingled) requiring analysis. 
- `shared.det.safety_escalation` — Does the safety screen require immediate escalation / protective steps? 
- `ny.det.residence_satisfied` — Which DRL § 230 residence pathway (if any) is satisfied on these facts? [NY-DIVORCE-RESIDENCE-001]
- `ny.det.court_selection` — Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8). [NY-FC-JURISDICTION-001]
- `ny.det.uccjea` — UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A). [NY-UCCJEA-001]
- `ny.det.cssa_posture` — CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). No calculator implemented; use official worksheets. [NY-CSSA-001, NY-MAINT-CS-TOOLS-001]
- `ny.det.fo_escalation` — Family-offense escalation / protective steps required (FCA Art. 8)? [NY-FC-JURISDICTION-001]
