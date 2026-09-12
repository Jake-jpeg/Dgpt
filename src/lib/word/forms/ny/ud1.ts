/**
 * NY UD-1 — Summons with Notice. The official boxed summons layout: the
 * caption box on the left (parties), the metadata box on the right (index
 * number, date filed, venue designation, the title, and where the
 * qualifying party resides), then the summons text.
 */
import { Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign } from "docx";
import { para, r, blank, heading, body, signatureBlock, s, type WordForm } from "../../engine";
import { countyName, formatAddressLines, titleCase } from "../../text";
import type { WordPayload } from "../../engine";

const CONTENT_W = 9360;

export function ud1(p: WordPayload): WordForm {
  const d = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, s(v)])) as Record<string, string>;
  const county = countyName(d.county || d.filingCounty || "");
  if (!county) throw new Error("VALIDATION: County is required");
  const plaintiff = (d.plaintiffName ?? "").trim();
  const defendant = (d.defendantName ?? "").trim();
  if (!plaintiff) throw new Error("VALIDATION: Plaintiff name is required");
  if (!defendant) throw new Error("VALIDATION: Defendant name is required");
  const qualifying = (d.qualifyingParty ?? "").trim().toLowerCase();
  if (!qualifying) throw new Error("VALIDATION: Qualifying party is required");
  const qLabel = qualifying === "plaintiff" ? "Plaintiff" : "Defendant";
  const qAddr = (d.qualifyingAddress ?? "").trim();
  if (!qAddr) throw new Error("VALIDATION: Qualifying address is required");
  const pAddr = (d.plaintiffAddress ?? "").trim();
  if (!pAddr) throw new Error("VALIDATION: Plaintiff address is required");
  const phone = (d.plaintiffPhone ?? "").trim();
  const dateFiled = (d.dateFiled ?? "").trim() || blank(19);

  const S = { spacing: "single" as const };
  const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const LINE = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
  const half = CONTENT_W / 2;

  const left = [
    para("", S),
    para(`${plaintiff.toUpperCase()},`, S),
    para("", S),
    para("", S),
    para("-against-", { ...S, left: 0.6 }),
    para("", S),
    para("", S),
    para(`${defendant.toUpperCase()}.`, S),
    para("", S),
  ];
  const right = [
    para("Index No.:", S),
    para("", S),
    para("Date Summons filed:", S),
    para("", S),
    para([r("Plaintiff designates "), r(`${county} County`, { underline: true }), r(" as the place of trial")], S),
    para([r("The basis of the venue is: "), r(`${qLabel}'s address`, { underline: true })], S),
    para("", S),
    para([r("SUMMONS WITH NOTICE", { bold: true, underline: true })], { ...S, align: "center" }),
    para("", S),
    para(`${qLabel} resides at:`, S),
    ...formatAddressLines(qAddr).map((l) => para(l, S)),
  ];
  const box = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [half, half],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: left,
            width: { size: half, type: WidthType.DXA },
            borders: { top: LINE, bottom: LINE, right: LINE, left: NONE },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          }),
          new TableCell({
            children: right,
            width: { size: half, type: WidthType.DXA },
            borders: { top: NONE, bottom: NONE, right: NONE, left: LINE },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          }),
        ],
      }),
    ],
  });

  const children: (Paragraph | Table)[] = [
    para([r("SUPREME COURT OF THE STATE OF NEW YORK", { bold: true })], S),
    para([r(`COUNTY OF ${county.toUpperCase()}`, { bold: true })], { ...S, after: 4 }),
    box,
    heading("ACTION FOR A DIVORCE"),
    para([r("To the above named Defendant:", { italic: true })], S),
    body("", { spacing: "single" }),
    para(
      [
        r("YOU ARE HEREBY SUMMONED ", { bold: true }),
        r(
          "to serve a notice of appearance on the Plaintiff within twenty (20) days " +
            "after the service of this summons, exclusive of the day of service (or within " +
            "thirty (30) days after the service is complete if this summons is not personally " +
            "delivered to you within the State of New York); and in case of your failure to " +
            "appear, judgment will be taken against you by default for the relief demanded " +
            "in the notice set forth below."
        ),
      ],
      { firstLine: 0.5, align: "both" }
    ),
    ...signatureBlock([titleCase(plaintiff), ...formatAddressLines(pAddr), ...(phone ? [phone] : [])], {
      dated: `Dated: ${dateFiled}`,
    }),
    para("", S),
    para(
      [
        r("NOTICE:", { bold: true, underline: true }),
        r("\tThe nature of this action is to dissolve the marriage between the parties, on the grounds: DRL§170 subd.7 – "),
        r("irretrievable breakdown in relationship for a period at least six months", { bold: true, underline: true }),
      ],
      { ...S, left: 1.0, hanging: 1.0, tabs: [{ pos: 1.0 }], align: "both" }
    ),
    para("", S),
    body(
      "The relief sought is a judgment of absolute divorce in favor of the Plaintiff " +
        "dissolving the marriage between the parties in this action.",
      { firstLine: 0 }
    ),
    body("The nature of any ancillary or additional relief requested is:", { firstLine: 0 }),
    para([r("NONE", { bold: true }), r(" – I am not requesting any ancillary relief.")], S),
  ];
  return { children, formLabel: "(Form UD-1)", filename: `NY_UD1_${fileToken(plaintiff)}.docx` };
}

export function fileToken(name: string): string {
  return (name.split(/\s+/).pop() ?? "Party").replace(/[^A-Za-z0-9]+/g, "") || "Party";
}
