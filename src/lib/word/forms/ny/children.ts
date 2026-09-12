/**
 * Children of the marriage — ONE source of truth for every NY generator.
 * Ported line-for-line from RL states/new_york/children.py (2026-09-12).
 *
 * WHY THIS MODULE EXISTS. Five generators once asserted the ABSENCE of
 * children as a hardcoded string while the complaint named one — sworn
 * affidavits and a Judgment of Divorce reciting that a real child did not
 * exist. Every child-bearing paragraph now asks THIS module, which reads
 * the payload.
 *
 * WHAT IT WILL AND WILL NOT DO. It states the TRUE facts it has (count,
 * names, dates of birth) and it carries the official UD-10 / UD-11 child
 * relief structure (rev. 3/1/26). It NEVER invents a value: anything the
 * payload does not supply prints as the form's own blank and is named in a
 * completion marker at the end of that paragraph. A childless matter
 * renders with none of these paragraphs at all.
 *
 * ⚠ CSSA_COMBINED_INCOME_CAP is printed in the official UD-10 text and
 * must track src/config/legal/ny-guidelines-2026.ts `combinedIncomeCap`.
 */

export const ATTORNEY_COMPLETION =
  "[ATTORNEY COMPLETION REQUIRED — child-related relief (custody, parenting " +
  "time, and child support under DRL 240(1-b)) must be completed by counsel " +
  "on the OCA packet for cases with children under 21.]";

export const CSSA_COMBINED_INCOME_CAP = 193_000; // DRL 240(1-b)(c)(2), eff. 3/1/2026

export const BLANK = "__________";

type Dict = Record<string, unknown>;

function dict(v: unknown): Dict {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Dict) : {};
}
function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

export interface ChildRow {
  name: string;
  dob: string;
}

/** Normalized child records: {name, dateOfBirth|dob}; unnamed rows are dropped. */
export function childRows(data: Dict): ChildRow[] {
  const rows = (data.children ?? data.childrenRecords ?? []) as unknown;
  const out: ChildRow[] = [];
  if (Array.isArray(rows)) {
    for (const rr of rows) {
      const r = dict(rr);
      const name = str(r.name);
      const dob = str(r.dateOfBirth ?? r.dob);
      if (name) out.push({ name, dob });
    }
  }
  return out;
}

/** How many unemancipated children the payload asserts (explicit count wins when no detail). */
export function childCount(data: Dict): number {
  const rows = childRows(data);
  if (rows.length) return rows.length;
  const raw = data.unemancipatedChildren ?? data.childCount ?? 0;
  const n = parseInt(str(raw) || "0", 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function hasChildren(data: Dict): boolean {
  return childCount(data) > 0;
}

/** "Aaron Doe, born March 4, 2019; Mia Doe, born July 9, 2021" — or the pre-formatted childrenDetail. */
export function childrenDetail(data: Dict): string {
  const parts = childRows(data).map((r) => (r.dob ? `${r.name}, born ${r.dob}` : r.name));
  if (parts.length) return parts.join("; ");
  return str(data.childrenDetail);
}

function plural(n: number): string {
  return n === 1 ? "is one child" : `are ${n} children`;
}

/** UD-6 para 4 / UD-7 para 7 — the sworn recital of children under 21. */
export function affidavitClause(data: Dict, number: string): string {
  const n = childCount(data);
  if (n === 0) return `${number} There are no children of the marriage under the age of 21.`;
  const detail = childrenDetail(data);
  let body = `${number} There ${plural(n)} of the marriage under the age of 21`;
  body += detail
    ? `, namely: ${detail}.`
    : ". [ATTORNEY COMPLETION REQUIRED — the name and date of birth of each child must be stated.]";
  return body + " " + ATTORNEY_COMPLETION;
}

/** UD-6 para 6c — the DRL 170(7) economic-resolution recital. */
export function ud6EconomicClause(data: Dict): string {
  const base =
    "6c. Since the grounds alleged are DRL §170(7), all economic issues of " +
    "equitable distribution of marital property, the payment or waiver of " +
    "spousal support have been resolved by the parties";
  if (!hasChildren(data)) return base + " and there are no children of the marriage.";
  return (
    base +
    ", and the custody and support of the child(ren) of the marriage " +
    "have been resolved as set forth in the parties' agreement. " +
    ATTORNEY_COMPLETION
  );
}

/** UD-10 — the findings paragraph identifying the children. */
export function findingsClause(data: Dict): string {
  const n = childCount(data);
  if (n === 0) return "There are no children of the marriage.";
  const detail = childrenDetail(data);
  if (detail) return `There ${plural(n)} of the marriage, namely: ${detail}.`;
  return (
    `There ${plural(n)} of the marriage. [ATTORNEY COMPLETION REQUIRED — the name and ` +
    "date of birth of each child must be stated.]"
  );
}

/** UD-11 — the recital clause identifying the children. */
export function judgmentClause(data: Dict): string {
  const n = childCount(data);
  if (n === 0) return "that there are no children of the marriage; and it is further";
  const detail = childrenDetail(data);
  let subject = `there ${plural(n)} of the marriage`;
  subject += detail
    ? `, namely: ${detail}`
    : " [ATTORNEY COMPLETION REQUIRED — the name and date of birth of each child must be stated]";
  return `that ${subject}; and it is further`;
}

/** Verified Complaint, paragraph FIFTH. */
export function complaintClause(data: Dict): string {
  const n = childCount(data);
  if (n === 0) return "There are no unemancipated children of this marriage.";
  const word = n === 1 ? "is one unemancipated child" : `are ${n} unemancipated children`;
  const detail = childrenDetail(data);
  if (detail) return `There ${word} of this marriage, namely: ${detail}. ${ATTORNEY_COMPLETION}`;
  return `There ${word} of this marriage. ${ATTORNEY_COMPLETION}`;
}

/** Stipulation of Settlement — the recital about children. */
export function stipulationRecital(data: Dict): string {
  const n = childCount(data);
  if (n === 0) return "There are no unemancipated children of the marriage, and none are expected.";
  const detail = childrenDetail(data);
  let recital = `There ${plural(n)} of the marriage`;
  if (detail) recital += `, namely: ${detail}`;
  return `${recital}. ${ATTORNEY_COMPLETION}`;
}

/* ── CHILD RELIEF — UD-10 findings and UD-11 decretal paragraphs ───────── */

const FREQUENCIES = ["per week", "bi-weekly", "semi-monthly", "per month"];

/** Fills a form blank from the payload, or records that it is still blank. */
class Fill {
  missing: string[] = [];
  f(value: unknown, label: string, blank = BLANK): string {
    const s = str(value);
    if (s) return s;
    if (!this.missing.includes(label)) this.missing.push(label);
    return blank;
  }
  get complete(): boolean {
    return this.missing.length === 0;
  }
  marker(): string {
    if (this.complete) return "";
    return " [ATTORNEY COMPLETION REQUIRED — " + this.missing.join("; ") + ".]";
  }
}

function section(data: Dict, key: string): Dict {
  return dict(data[key]);
}

/** 'plaintiff' -> 'Plaintiff'. A third party prints its name, per the form. */
function partyLabel(value: unknown, thirdPartyName: unknown = "", dflt = ""): string {
  const s = str(value).toLowerCase();
  if (s === "plaintiff" || s === "p") return "Plaintiff";
  if (s === "defendant" || s === "d") return "Defendant";
  if (s === "third_party" || s === "third party" || s === "thirdparty") return str(thirdPartyName);
  return dflt;
}

function frequency(value: unknown, dflt = ""): string {
  const s = str(value).toLowerCase().replace(/_/g, "-").replace("biweekly", "bi-weekly");
  for (const f of FREQUENCIES) {
    if (s === f || s === f.replace("per ", "") || s === f.replace("-", " ")) return f;
  }
  return dflt;
}

/** '1234.5' -> '$1,234.50'. Anything already carrying a $ is left alone. */
function money(value: unknown): string {
  const s = str(value);
  if (!s) return "";
  if (s.startsWith("$")) return s;
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isFinite(n)) return s;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(value: unknown): string {
  const s = str(value);
  if (!s) return "";
  return s.endsWith("%") ? s : `${s}%`;
}

/** 'Aaron Kim (d.o.b. March 4, 2019)' joined — UD-10 SEVENTH / UD-11 custody. */
function childTable(data: Dict): string {
  const rows = childRows(data);
  if (!rows.length) return "";
  return rows.map((r) => `${r.name} (d.o.b. ${r.dob || BLANK})`).join("; ");
}

/* --- UD-10 findings ------------------------------------------------------- */

/** UD-10 ELEVENTH — residence, custody, visitation, DV allegations. */
export function custodyFindings(data: Dict): string {
  const cu = section(data, "custody");
  const f = new Fill();
  let body: string;

  if (cu.childrenOutsideNY) {
    body = "No award of custody is made, the minor child(ren) of the marriage not residing in New York State.";
  } else {
    const resides = f.f(partyLabel(cu.residesWith, cu.residesWithName), "the party the child(ren) reside with");
    const custodian = f.f(partyLabel(cu.custodian, cu.custodianName), "the party entitled to custody");
    body = `The minor child(ren) of the marriage now reside with ${resides}. ${custodian} is entitled to custody.`;
    const other = str(cu.arrangement);
    if (other) body += ` Other custody arrangement: ${other}.`;

    if (cu.visitationNotApplicable) {
      body += " Visitation is not applicable.";
    } else {
      const visitor = f.f(partyLabel(cu.visitationParty, cu.visitationPartyName), "the party entitled to visitation");
      body += ` ${visitor} is entitled to visitation away from the custodial residence`;
      if (cu.visitationPerAgreement) {
        body += " in accordance with the parties' settlement agreement.";
      } else {
        const sched = f.f(cu.visitationSchedule, "the visitation schedule", "_".repeat(40));
        body += ` according to the following schedule: ${sched}.`;
      }
    }
  }

  if (cu.dvAllegations === undefined || cu.dvAllegations === null) {
    f.f("", "whether allegations of domestic violence and/or child abuse were made");
    body += ` Allegations of domestic violence and/or child abuse ${BLANK} made in this case.`;
  } else if (cu.dvAllegations) {
    body += " Allegations of domestic violence and/or child abuse were made in this case.";
    if (cu.dvSupported === undefined || cu.dvSupported === null) {
      f.f("", "the Court's finding on the domestic-violence allegations");
      body += ` The Court has found that they ${BLANK} supported by a preponderance of the evidence.`;
    } else if (cu.dvSupported) {
      body +=
        " The Court has found that they were supported by a preponderance of " +
        "the evidence, and has set forth on the record or in writing how such " +
        "findings, facts and circumstances were factored into the custody or " +
        "visitation direction.";
    } else {
      body += " The Court has found that they were not supported by a preponderance of the evidence.";
    }
  } else {
    body += " Allegations of domestic violence and/or child abuse were not made in this case.";
  }

  return body + f.marker();
}

function supportExistingOrder(cs: Dict, f: Fill): string {
  const court = f.f(cs.orderCourt, "the court that issued the existing support order");
  const county = f.f(cs.orderCounty, "the county of the existing support order");
  const number = f.f(cs.orderIndex, "the index/docket number of the existing support order");
  const date = f.f(cs.orderDate, "the date of the existing support order");
  const payor = f.f(partyLabel(cs.payor), "the party directed to pay support");
  const amount = f.f(money(cs.orderAmount), "the amount of the existing support order");
  const freq = f.f(frequency(cs.orderFrequency), "the payment frequency of the existing order");
  return (
    `By order of ${court} Court, ${county} County, Index/Docket No. ${number}, ` +
    `dated ${date}, ${payor} was directed to pay the sum of ${amount} ${freq} for ` +
    "child support. Said Order shall continue."
  );
}

function supportCssa(cs: Dict, f: Fill): string {
  const cap = "$" + CSSA_COMBINED_INCOME_CAP.toLocaleString("en-US");
  const pIncome = f.f(money(cs.plaintiffAdjustedIncome), "Plaintiff's adjusted gross income");
  const dIncome = f.f(money(cs.defendantAdjustedIncome), "Defendant's adjusted gross income");
  const combined = f.f(money(cs.combinedIncome), "the combined parental annual income");
  const pRole = f.f(cs.plaintiffRole, "whether Plaintiff is the custodial or non-custodial parent");
  const dRole = f.f(cs.defendantRole, "whether Defendant is the custodial or non-custodial parent");
  const pc = f.f(pct(cs.percentage), "the applicable child support percentage");
  const basic = f.f(money(cs.basicObligationUpToCap), `the combined basic child support obligation on income up to ${cap}`);
  const over = f.f(money(cs.basicObligationOverCap), `the combined obligation on income over ${cap}`);
  const pRata = f.f(pct(cs.plaintiffProRata), "Plaintiff's pro rata share of combined income");
  const dRata = f.f(pct(cs.defendantProRata), "Defendant's pro rata share of combined income");
  const ncpUp = f.f(money(cs.ncpShareUpToCap), `the non-custodial parent's pro rata share of the obligation up to ${cap}`);
  const ncpOver = f.f(money(cs.ncpShareOverCap), `the non-custodial parent's pro rata share of the obligation over ${cap}`);
  const healthPct = f.f(pct(cs.uncoveredHealthPct), "the non-custodial parent's pro rata share of uncovered health care expenses");
  const care = f.f(money(cs.childCareAmount) || pct(cs.childCarePct), "the non-custodial parent's share of reasonable child care expenses");
  const edu = f.f(money(cs.educationAmount) || pct(cs.educationPct), "the non-custodial parent's share of educational or extraordinary expenses");
  return (
    `The adjusted gross income of the Plaintiff, who is the ${pRole} parent, is ` +
    `${pIncome} per year, and the adjusted gross income of the Defendant, who is ` +
    `the ${dRole} parent, is ${dIncome} per year, and the combined parental annual ` +
    `income is ${combined}. The gross incomes of the parties have been adjusted to ` +
    "deduct maintenance paid to, and to add maintenance received by, a party spouse. " +
    `The applicable child support percentage is ${pc}. The combined basic child ` +
    `support obligation attributable to both parents is ${basic} per year on combined ` +
    `income up to ${cap} as adjusted for low income if applicable, and ${over} per year ` +
    `on income over ${cap}. The Plaintiff's pro rata share of the combined parental ` +
    `income is ${pRata} and the Defendant's pro rata share of the combined parental ` +
    `income is ${dRata}. The non-custodial parent's pro rata share of the child ` +
    `support obligation on combined income up to ${cap} is ${ncpUp} per year. The ` +
    "non-custodial parent's pro rata share of the child support obligation on combined " +
    `income over ${cap} is ${ncpOver} per year. The non-custodial parent's pro rata ` +
    `share of future health care expenses not covered by insurance is ${healthPct}. ` +
    `The non-custodial parent's share of reasonable child care expenses is ${care}. ` +
    "The non-custodial parent's share of educational or extraordinary expenses for " +
    `the children, if any, is ${edu}.`
  );
}

function supportStipulation(cs: Dict, f: Fill): string {
  const cap = "$" + CSSA_COMBINED_INCOME_CAP.toLocaleString("en-US");
  const date = f.f(cs.agreementDate, "the date of the parties' stipulation or agreement");
  const payor = f.f(partyLabel(cs.payor), "the party who agrees to pay child support");
  const amount = f.f(money(cs.amount), "the agreed child support amount");
  const freq = f.f(frequency(cs.frequency), "the agreed payment frequency");
  const payee = f.f(partyLabel(cs.payee, cs.payeeName), "the party to whom child support is paid");
  const route = cs.throughSCU ? "through the Support Collection Unit" : "directly";
  const cssaOver = cs.waiveOverCap ? "waive" : "apply";
  const presumptive = f.f(money(cs.presumptiveAmount), "the presumptive amount of child support attributable to the non-custodial parent");
  const uncovered = f.f(pct(cs.uncoveredHealthPct), "the agreed share of uncovered health care expenses");
  const care = f.f(money(cs.childCareAmount) || pct(cs.childCarePct), "the agreed share of reasonable child care expenses");
  const edu = f.f(money(cs.educationAmount) || pct(cs.educationPct), "the agreed share of educational and extraordinary expenses");

  let body =
    `The parties entered into a stipulation/agreement on ${date}, wherein ${payor} ` +
    `agrees to pay ${amount} ${freq} child support ${route} to ${payee}. The parties ` +
    `agree to ${cssaOver} the Child Support Standards Act to combined income over ` +
    `${cap}. The parties have agreed that health care expenses not covered by ` +
    `insurance shall be paid in the amount of ${uncovered} of the uncovered expenses; ` +
    `that reasonable child care expenses shall be paid in the amount of ${care}; and ` +
    `that educational and extraordinary expenses shall be paid in the amount of ${edu}. ` +
    "Said agreement recites, in compliance with DRL §240(1-b)(h): the parties have " +
    "been advised of the Child Support Standards Act; the basic child support " +
    "obligation presumptively results in the correct amount of child support; and the " +
    "unrepresented party, if any, has received a copy of the Child Support Standards " +
    "Chart promulgated by the Commissioner of Social Services pursuant to Social " +
    "Services Law §111-i. The presumptive amount of child support attributable to the " +
    `non-custodial parent is ${presumptive}.`;

  if (cs.conformsToGuideline === false) {
    const reasons = f.f(cs.deviationReasons, "the parties' stated reasons for deviating from the basic child support obligation", "_".repeat(40));
    const courtReasons = f.f(cs.courtDeviationReasons, "the Court's reasons for finding the deviation just and appropriate", "_".repeat(40));
    body +=
      " The amount of child support agreed to deviates from the non-custodial " +
      `parent's basic child support obligation for the following reasons: ${reasons}. ` +
      "The court finds said amount to be just and appropriate for the following " +
      `reasons: ${courtReasons}.`;
  } else if (cs.conformsToGuideline) {
    body += " The amount of child support agreed to conforms with the non-custodial parent's basic child support obligation.";
  } else {
    f.f("", "whether the agreed amount conforms with or deviates from the basic child support obligation");
    body += ` The amount of child support agreed to ${BLANK} with the non-custodial parent's basic child support obligation.`;
  }
  return body;
}

/** UD-10 THIRTEENTH — the basis of the child support award. */
export function childSupportFindings(data: Dict): string {
  const cs = section(data, "childSupport");
  const f = new Fill();
  const table = childTable(data) || f.f("", "the name and date of birth of each child entitled to receive support");
  const head = `The unemancipated children of the marriage entitled to receive support are: ${table}.`;
  const basis = str(cs.basis).toLowerCase();
  let body: string;
  if (["existing_order", "existing", "order"].includes(basis)) body = supportExistingOrder(cs, f);
  else if (["cssa", "computation", "court"].includes(basis)) body = supportCssa(cs, f);
  else if (["stipulation", "agreement"].includes(basis)) body = supportStipulation(cs, f);
  else {
    f.f("", "the basis of the child support award — an existing order, a CSSA computation, or the parties' stipulation");
    body =
      "The award of child support is based upon " + BLANK + ": an existing order " +
      "of another court, a computation under the Child Support Standards Act, or " +
      "the parties' stipulation.";
  }
  return `${head} ${body}${f.marker()}`;
}

/** UD-10 FOURTEENTH — group health plans and the responsible relative. */
export function childHealthFindings(data: Dict): string {
  const hi = section(data, "childHealthInsurance");
  const f = new Fill();
  let plans: string;
  if (hi.noPlansAvailable) {
    plans = "There are no health plans available to the parties through their employment.";
  } else {
    const p = section(hi, "plaintiffPlan");
    const d = section(hi, "defendantPlan");
    const pName = f.f(p.planName, "Plaintiff's group health plan");
    const dName = f.f(d.planName, "Defendant's group health plan");
    plans = `The parties are covered by the following group health plans through their employment: Plaintiff — ${pName}; Defendant — ${dName}.`;
  }
  const who = f.f(partyLabel(hi.responsibleRelative), "the party who shall be the legally responsible relative for the child(ren)'s health insurance");
  const source = hi.byAgreement ? "The parties have agreed or stipulated" : "The court has determined";
  const enrol =
    `${source} that ${who} shall be the legally responsible relative and that the ` +
    "unemancipated child(ren) shall be enrolled in his or her group health plan as " +
    "specified above until the age of 21 years or until the child(ren) is or are " +
    "sooner emancipated.";
  return `${plans} ${enrol}${f.marker()}`;
}

/** The child findings UD-10 adds, in order. Empty when there are no children. */
export function ud10ChildFindings(data: Dict): [string, string][] {
  if (!hasChildren(data)) return [];
  return [
    ["SIXTEENTH:", custodyFindings(data)],
    ["SEVENTEENTH:", childSupportFindings(data)],
    ["EIGHTEENTH:", childHealthFindings(data)],
  ];
}

/* --- UD-11 decretal paragraphs ------------------------------------------- */

/** The ORDERED AND ADJUDGED bodies UD-11 adds when there are children. */
export function ud11ChildDecrees(data: Dict): string[] {
  if (!hasChildren(data)) return [];
  const cu = section(data, "custody");
  const cs = section(data, "childSupport");
  const hi = section(data, "childHealthInsurance");
  const out: string[] = [];

  // Custody
  {
    const f = new Fill();
    const table = childTable(data) || f.f("", "the name and date of birth of each child");
    if (cu.childrenOutsideNY) {
      out.push(`that no award of custody is made, the minor child(ren) of the marriage, i.e.: ${table}, not residing in New York State` + f.marker());
    } else {
      const custodian = f.f(partyLabel(cu.custodian, cu.custodianName), "the party who shall have custody");
      out.push(`that ${custodian} shall have custody of the minor child(ren) of the marriage, i.e.: ${table}` + f.marker());
    }
  }

  // Visitation
  {
    const f = new Fill();
    if (cu.visitationNotApplicable) {
      out.push("that visitation is not applicable");
    } else {
      const visitor = f.f(partyLabel(cu.visitationParty, cu.visitationPartyName), "the party who shall have visitation");
      const tail = cu.visitationPerAgreement
        ? "in accordance with the parties' settlement agreement"
        : "according to the following schedule: " + f.f(cu.visitationSchedule, "the visitation schedule", "_".repeat(40));
      out.push(`that ${visitor} shall have visitation with the minor child(ren) of the marriage ${tail}` + f.marker());
    }
  }

  // Continuation of existing custody / visitation orders
  {
    const ex = section(cu, "existingOrder");
    if (Object.keys(ex).length) {
      const f = new Fill();
      const county = f.f(ex.county, "the county of the existing custody/visitation order");
      const court = f.f(ex.court, "the court of the existing custody/visitation order");
      const num = f.f(ex.number, "the index/docket number of the existing order");
      const subject = f.f(ex.subject, "whether the existing order is as to custody or visitation");
      out.push(`that the existing ${county} County, ${court} Court order under No. ${num} as to ${subject} shall continue` + f.marker());
    } else {
      out.push("that there are no court orders with regard to custody or visitation to be continued");
    }
  }

  // Child support
  {
    const f = new Fill();
    const basis = str(cs.basis).toLowerCase();
    if (["existing_order", "existing", "order"].includes(basis)) {
      const payor = f.f(partyLabel(cs.payor), "the party who shall pay child support");
      const payee = f.f(partyLabel(cs.payee, cs.payeeName), "the party to whom child support shall be paid");
      const amount = f.f(money(cs.orderAmount), "the amount of the existing support order");
      const freq = f.f(frequency(cs.orderFrequency), "the frequency of the existing order");
      const county = f.f(cs.orderCounty, "the county of the existing support order");
      const court = f.f(cs.orderCourt, "the court of the existing support order");
      const num = f.f(cs.orderIndex, "the index/docket number of the existing support order");
      out.push(
        `that ${payor} shall pay to ${payee}, as and for the support of the parties' ` +
          `unemancipated children of the marriage, the sum of ${amount} ${freq}, pursuant ` +
          `to an existing order issued by the ${county} County, ${court} Court, under ` +
          `No. ${num}, the terms of which are hereby continued` + f.marker()
      );
    } else {
      const payor = f.f(partyLabel(cs.payor), "the party who shall pay child support");
      const payee = f.f(partyLabel(cs.payee, cs.payeeName), "the party to whom child support shall be paid");
      const amount = f.f(money(cs.amount), "the child support amount");
      const freq = f.f(frequency(cs.frequency), "the payment frequency");
      const commencing = f.f(cs.commencing, "the commencement date of child support");
      const table = childTable(data) || f.f("", "the name and date of birth of each child");
      const route = cs.throughSCU
        ? "through the NYS Child Support Processing Center, PO Box 15363, Albany, NY 12212-5363"
        : `directly to ${payee}`;
      const source = ["stipulation", "agreement"].includes(basis) ? "the parties' Settlement Agreement" : "the Court's decision";
      out.push(
        `that ${payor} shall pay to ${payee}, as and for the support of the parties' ` +
          `unemancipated child(ren) of the marriage, namely: ${table}, the sum of ` +
          `${amount} ${freq}, commencing on ${commencing}, and to be paid ${route}, ` +
          "together with such dollar amounts or percentages for child care, education " +
          `and health care as set forth below in accordance with ${source}` + f.marker()
      );
    }
  }

  // DRL 240(1-b) adjustment on termination of maintenance — boilerplate, no blank.
  out.push(
    "that, if maintenance is to be paid pursuant to this Judgment of Divorce, then, " +
      "subject to the terms of DRL §240(1-b), upon termination of the maintenance award, " +
      "the amount of child support payable shall be adjusted, without prejudice to " +
      "either party's right to seek a modification pursuant to DRL §236(B)(9)(2)"
  );

  // Child care
  {
    const f = new Fill();
    if (cs.childCareNotApplicable) {
      out.push("that reasonable child care expenses are not applicable");
    } else {
      const payor = f.f(partyLabel(cs.payor), "the party who shall pay child care expenses");
      const payee = f.f(partyLabel(cs.payee, cs.payeeName), "the party to whom child care expenses shall be paid");
      const care = f.f(money(cs.childCareAmount) || pct(cs.childCarePct), "the child care amount or percentage");
      const basisTxt = cs.childCareByAgreement === false ? "the court's decision" : "written agreement of the parties";
      out.push(`that ${payor} shall pay to ${payee}, as and for reasonable child care expenses pursuant to ${basisTxt}, ${care}` + f.marker());
    }
  }

  // Health care expenses and insurance premiums
  {
    const f = new Fill();
    const uncovered = f.f(pct(cs.uncoveredHealthPct), "the non-custodial parent's pro rata share of uncovered health care expenses");
    const covering = str(hi.coveringParty).toLowerCase();
    let premiumTxt: string;
    if (covering === "custodial" || covering === "custodial parent") {
      const premium = f.f(money(hi.nonCustodialProRataPremium), "the non-custodial parent's pro rata share of the children's health insurance premiums");
      premiumTxt =
        "the custodial parent provides the health insurance for the children, and the " +
        "non-custodial parent's pro rata share of health insurance premiums for the " +
        `children is ${premium}`;
    } else if (["non-custodial", "noncustodial", "non custodial", "non-custodial parent"].includes(covering)) {
      const premium = f.f(money(hi.custodialProRataPremium), "the custodial parent's pro rata share of the children's health insurance premiums");
      premiumTxt =
        "the non-custodial parent provides the health insurance for the children, and " +
        "the custodial parent's pro rata share of health insurance premiums for the " +
        `children, ${premium}, will be deducted from the child support obligation`;
    } else {
      f.f("", "which parent provides health insurance for the children");
      premiumTxt = `${BLANK} provides the health insurance for the children, and the other parent's pro rata share of the premiums is ${BLANK}`;
    }
    const payor = f.f(partyLabel(cs.payor), "the party who shall pay health care expenses");
    const payee = f.f(partyLabel(cs.payee, cs.payeeName), "the party to whom health care expenses shall be paid");
    let health =
      `that ${payor} shall pay to ${payee}, as and for the non-custodial parent's pro ` +
      `rata share of future health care expenses not covered by insurance, ${uncovered} ` +
      `of such expenses; and that ${premiumTxt}`;
    if (hi.stateSponsored) {
      const who = f.f(partyLabel(hi.stateSponsoredApplicant), "the party who shall apply for state-sponsored health insurance");
      health += `; and that ${who} shall apply to the state sponsored health insurance plan for coverage for the unemancipated children of the marriage`;
    }
    out.push(health + f.marker());
  }

  // Education and extraordinary expenses
  {
    const f = new Fill();
    if (cs.educationNotApplicable) {
      out.push("that education or extraordinary expenses of the children are not applicable");
    } else {
      const payor = f.f(partyLabel(cs.payor), "the party who shall pay education expenses");
      const payee = f.f(partyLabel(cs.payee, cs.payeeName), "the party to whom education expenses shall be paid");
      const edu = f.f(money(cs.educationAmount) || pct(cs.educationPct), "the education or extraordinary expense amount or percentage");
      const basisTxt = cs.educationByAgreement === false ? "the court's decision" : "written agreement of the parties";
      out.push(`that ${payor} shall pay to ${payee}, for education or extraordinary expenses of the children, ${edu}, pursuant to ${basisTxt}` + f.marker());
    }
  }

  // QMCSO
  out.push(
    hi.qmcso
      ? "that a separate Qualified Medical Child Support Order shall be issued simultaneously herewith"
      : "that a separate Qualified Medical Child Support Order is not applicable"
  );

  return out;
}
