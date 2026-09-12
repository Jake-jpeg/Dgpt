/**
 * NY Stipulation of Settlement — the parties' agreement, Article by Article.
 *
 * The one arithmetic in the packet: the DRL § 236(B)(6) guideline
 * maintenance recital (no-child formula, payor income capped) — statutory
 * arithmetic, not advice, and printed so the waiver that follows is a
 * KNOWING one. MAINTENANCE_CAP must track src/config/legal/ny-guidelines-
 * 2026.ts; the caps move every other year.
 *
 * Everything the intake did not supply prints as an ATTORNEY REVIEW
 * REQUIRED marker, never as an invented term.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, s, type WordForm, type WordPayload } from "../../engine";
import { countyName, pleadingDate, titleCase } from "../../text";
import { stipulationRecital } from "./children";
import { fileToken } from "./ud1";

export const MAINTENANCE_CAP = 241_000;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const S = { spacing: "single" as const };

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function parseIncome(v: string): number | null {
  const digits = v.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** DRL § 236(B)(6) no-child (higher) formula, payor income capped. */
export function guidelineMaintenance(payorIncome: number, payeeIncome: number): number {
  const capped = Math.min(payorIncome, MAINTENANCE_CAP);
  const a = 0.3 * capped - 0.2 * payeeIncome;
  const b = 0.4 * (capped + payeeIncome) - payeeIncome;
  return Math.max(0, Math.min(a, b));
}

function article(label: string, title: string): Paragraph {
  return para([r(`ARTICLE ${label} — ${title}`, { bold: true, underline: true })], { ...S, align: "center", before: 10, after: 8, keepNext: true });
}

function numbered(n: number, text: string): Paragraph {
  return para(`${n}. ${text}`, { firstLine: 0.35, align: "both" });
}

function bullets(text: string): Paragraph[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => para(`•  ${l}`, { ...S, left: 0.55, after: 3 }));
}

export function stipulation(p: WordPayload): WordForm {
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const county = countyName(s(p.county) || s(p.filingCounty));
  const pAddr = s(p.plaintiffAddress);
  const dAddr = s(p.defendantAddress);
  if (!plaintiff || !defendant) throw new Error("VALIDATION: Plaintiff and Defendant names are required");
  if (!county) throw new Error("VALIDATION: County is required");
  if (!pAddr || !dAddr) throw new Error("VALIDATION: Both party addresses are required");
  const marriageDate = pleadingDate(s(p.marriageDate)) || blank(20);
  const marriagePlace = s(p.marriagePlace) || blank(20);
  const indexNo = s(p.indexNumber);
  const assets = s(p.assetsSummary);
  const debts = s(p.debtsSummary);
  const division = s(p.divisionTerms);
  const nameRestore = s(p.nameRestoration);
  const waived = (s(p.maintenanceWaived) || "true").toLowerCase() !== "false";
  const dateSigned = s(p.dateSigned) || blank(20);
  const pInc = parseIncome(s(p.plaintiffIncome));
  const dInc = parseIncome(s(p.defendantIncome));
  const P = titleCase(plaintiff);
  const D = titleCase(defendant);

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "STIPULATION OF SETTLEMENT", indexNo }),
    body(
      `THIS STIPULATION OF SETTLEMENT is made and entered into by and between ${P}, residing at ${pAddr} (the “Plaintiff”), and ${D}, residing at ${dAddr} (the “Defendant”, and together with the Plaintiff, the “parties”).`,
      { firstLine: 0 }
    ),
    article(ROMAN[0], "RECITALS"),
    ...[
      `The parties were married on ${marriageDate}, in ${marriagePlace}.`,
      stipulationRecital(p),
      "The relationship between the parties has broken down irretrievably for a " +
        "period of at least six months (Domestic Relations Law § 170(7)), and an " +
        "action for divorce is pending or about to be commenced in the Supreme " +
        `Court, ${county} County.`,
      "Each party has made, and each party acknowledges receiving, a fair and " +
        "reasonable disclosure of the other's income, assets, and liabilities, and " +
        "each enters this Stipulation voluntarily, free of coercion or duress, " +
        "believing its terms to be fair and reasonable.",
      "Each party has had the opportunity to consult independent counsel of their " +
        "own choosing regarding this Stipulation and its legal consequences.",
    ].map((t, i) => numbered(i + 1, t)),
    article(ROMAN[1], "LIVING SEPARATE AND APART"),
    body(
      "From the date of this Stipulation, each party may live separate and apart " +
        "from the other, free from interference, molestation, or restraint by the " +
        "other, as fully as if unmarried.",
      { firstLine: 0 }
    ),
    article(ROMAN[2], "EQUITABLE DISTRIBUTION OF PROPERTY"),
    body(
      "The parties have agreed between themselves upon a complete division of " +
        "their marital property, and each acknowledges that the division set forth " +
        "below is fair and equitable within the meaning of Domestic Relations Law " +
        "§ 236(B)(5).",
      { firstLine: 0 }
    ),
    ...(assets ? [body("The parties' significant property consists of the following:", { firstLine: 0.35 }), ...bullets(assets)] : []),
    ...(division
      ? [body("The parties have agreed to divide their property as follows:", { firstLine: 0.35 }), ...bullets(division)]
      : [body("[ATTORNEY REVIEW REQUIRED — the parties' agreed division of property must be set forth here before execution.]", { firstLine: 0.35 })]),
    body(
      "Except as expressly provided above, each party shall retain, free of any " +
        "claim by the other, all property currently in that party's name or " +
        "possession, including bank accounts, personal effects, and vehicles titled " +
        "to that party. Each party waives any claim to the other's separate " +
        "property under Domestic Relations Law § 236(B)(1)(d).",
      { firstLine: 0 }
    ),
    article(ROMAN[3], "DEBTS AND LIABILITIES"),
    ...(debts ? [body("The parties' significant debts consist of the following:", { firstLine: 0.35 }), ...bullets(debts)] : []),
    body(
      "Except as expressly provided in this Stipulation or as the parties have " +
        "listed above with a contrary agreement, each party shall be solely " +
        "responsible for the debts in that party's own name, and each shall " +
        "indemnify and hold the other harmless from any claim arising from those " +
        "debts. Neither party shall hereafter incur any debt in the name of, or " +
        "chargeable to, the other.",
      { firstLine: 0 }
    ),
    article(ROMAN[4], "SPOUSAL MAINTENANCE"),
  ];

  if (pInc !== null && dInc !== null) {
    const [payorName, payorInc, payeeName, payeeInc] = pInc >= dInc ? [P, pInc, D, dInc] : [D, dInc, P, pInc];
    const g = guidelineMaintenance(payorInc, payeeInc);
    children.push(
      body(
        "For purposes of the Maintenance Guidelines Law (Domestic Relations Law " +
          `§ 236(B)(6)), the parties state that the annual gross income of ${P} is ` +
          `approximately ${money(pInc)} and the annual gross income of ${D} is ` +
          `approximately ${money(dInc)}. Applying the statutory formula (payor ` +
          `income capped at ${money(MAINTENANCE_CAP)}), the presumptive guideline ` +
          `amount of maintenance would be approximately ${money(g)} per year ` +
          `(${money(g / 12)} per month), payable by ${payorName} to ${payeeName}.`,
        { firstLine: 0 }
      )
    );
  } else {
    children.push(
      body(
        "For purposes of the Maintenance Guidelines Law (Domestic Relations Law " +
          "§ 236(B)(6)), the parties state that the annual gross income of the " +
          "Plaintiff is approximately $____________ and the annual gross income of " +
          "the Defendant is approximately $____________, and that the presumptive " +
          "guideline amount of maintenance would be approximately $____________ " +
          "per year. [ATTORNEY REVIEW REQUIRED — complete before execution.]",
        { firstLine: 0 }
      )
    );
  }
  children.push(
    body(
      waived
        ? "Each party has been advised of, and acknowledges, the guideline amount " +
            "of maintenance set forth above. Knowing that amount, and intending to " +
            "deviate from it, EACH PARTY KNOWINGLY, VOLUNTARILY, AND IRREVOCABLY " +
            "WAIVES, now and forever, any claim to spousal maintenance or support " +
            "from the other, past, present, and future. The parties agree this " +
            "deviation is fair and reasonable because each is self-supporting and " +
            "the parties have divided their property as set forth above."
        : "[ATTORNEY REVIEW REQUIRED — the parties have not waived maintenance; " +
            "counsel must set forth the agreed maintenance terms (amount, duration, " +
            "termination events) here before execution.]",
      { firstLine: 0 }
    ),
    article(ROMAN[5], "HEALTH INSURANCE"),
    body(
      "Each party acknowledges, pursuant to Domestic Relations Law § 255, that " +
        "upon entry of the judgment of divorce a party may no longer be eligible " +
        "for coverage under the other party's health insurance plan, and that each " +
        "party may be responsible for obtaining their own coverage, including any " +
        "right of continuation coverage under COBRA at that party's own expense.",
      { firstLine: 0 }
    )
  );

  let art = 6;
  if (nameRestore) {
    children.push(
      article(ROMAN[art], "RESTORATION OF FORMER NAME"),
      body(
        "The parties agree that the judgment of divorce may provide that the " +
          "party formerly known by that name may resume the use of the former " +
          `name ${titleCase(nameRestore)}, and neither party shall object.`,
        { firstLine: 0 }
      )
    );
    art += 1;
  }
  children.push(
    article(ROMAN[art], "GENERAL PROVISIONS"),
    ...[
      "Entire agreement. This Stipulation contains the parties' entire " +
        "agreement; it supersedes all prior discussions and may be modified " +
        "only by a writing signed and acknowledged by both parties.",
      "Incorporation without merger. This Stipulation shall be submitted to " +
        "the Court for incorporation into the judgment of divorce; it shall " +
        "survive and not merge into the judgment, and shall be enforceable " +
        "independently as a contract.",
      "Severability. If any provision is held invalid, the remaining provisions remain in full force.",
      "Governing law. This Stipulation is governed by the laws of the State of New York.",
      "Implementation. Each party shall sign any documents reasonably " +
        "necessary to carry out this Stipulation, including title transfers " +
        "and account designations.",
      "No other actions. Each party represents that no other matrimonial " +
        "action is pending between them in any other court.",
    ].map((t, i) => numbered(i + 1, t)),
    para("", S),
    body(`IN WITNESS WHEREOF, the parties have executed this Stipulation of Settlement on the date(s) set forth below. Dated: ${dateSigned}`, { firstLine: 0, keepNext: true }),
    para("", S)
  );
  for (const who of [P, D]) {
    children.push(para(blank(36), { ...S, keepNext: true }), para(who, { ...S, after: 18 }));
  }
  for (const who of [P, D]) {
    children.push(
      para(`STATE OF NEW YORK, COUNTY OF ${county.toUpperCase()}, ss.:`, { ...S, keepNext: true, keepLines: true }),
      para(
        `On the ____ day of ${blank(12)}, 20___, before me personally appeared ` +
          `${who}, personally known to me or proved to me on the basis of ` +
          "satisfactory evidence to be the individual whose name is subscribed " +
          "to the within instrument, and acknowledged to me that they executed the same.",
        { ...S, align: "both", keepNext: true, keepLines: true, after: 10 }
      ),
      para(blank(30), { ...S, keepNext: true }),
      para("Notary Public", { ...S, after: 16 })
    );
  }
  return { children, formLabel: "(Stipulation of Settlement)", filename: `NY_Stipulation_${fileToken(plaintiff)}.docx` };
}
