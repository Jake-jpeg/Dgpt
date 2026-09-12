/**
 * The Word engine — "retire ReportLab as the technology, not the determinism."
 *
 * Every court form the product produces is built here, as a real .docx,
 * from the SAME validated RenderPayload the PDF service used to receive
 * (src/lib/pdf-service/mappings.ts is untouched: same answers → same
 * payload → same fingerprint in the audit log). What changed is the pen:
 * ReportLab placed ink by coordinate; this places PARAGRAPHS with styles,
 * and Word does the layout. A notary block is a notary block, a caption
 * is a caption, and the body is double-spaced because 22 NYCRR 202.5(a)
 * says so — as a style, not as arithmetic.
 *
 * Design rules:
 *  - Letter, 1" margins, Times New Roman 12, body double-spaced. Captions,
 *    signature blocks, jurats and address blocks are single-spaced blocks.
 *  - Nothing here knows about intake answers. Generators receive a flat
 *    string payload and return a document. No model output enters.
 *  - Blanks stay blanks ("____"). The engine never invents a date, a
 *    docket number, or a signature.
 *  - Every generator's text is pinned by tests/word-parity.test.ts against
 *    the text the ReportLab generators produced on the same fixtures.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
  type IParagraphOptions,
  type ITableCellOptions,
} from "docx";

export const FONT = "Times New Roman";
const SIZE = 24; // half-points → 12pt
const SMALL = 20; // 10pt (footers)
const INCH = 1440; // twips
const PAGE_W = 12240; // 8.5in
const MARGIN = INCH;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9360 twips = 6.5in
const HALF = Math.floor(CONTENT_W / 2);
export const DOUBLE = 480; // line spacing "auto" units: 240 = single
export const SINGLE = 240;

export interface RunOpts {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
}

/** A styled run. */
export function r(text: string, o: RunOpts = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: o.size ?? SIZE,
    bold: o.bold,
    italics: o.italic,
    underline: o.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

export interface ParaOpts extends RunOpts {
  align?: "left" | "center" | "right" | "both";
  /** Line spacing: "double" (default for body) or "single" (blocks). */
  spacing?: "double" | "single";
  /** First-line indent in inches. */
  firstLine?: number;
  /** Left indent in inches. */
  left?: number;
  /** Hanging indent in inches (for labeled paragraphs). */
  hanging?: number;
  /** Space after, in points. */
  after?: number;
  before?: number;
  keepNext?: boolean;
  keepLines?: boolean;
  tabs?: { pos: number; type?: "left" | "right" | "center" }[];
  pageBreakBefore?: boolean;
}

const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  both: AlignmentType.BOTH,
} as const;

function paraOptions(o: ParaOpts): Omit<IParagraphOptions, "children"> {
  return {
    alignment: ALIGN[o.align ?? "left"],
    spacing: {
      line: o.spacing === "single" ? SINGLE : DOUBLE,
      after: Math.round((o.after ?? 0) * 20),
      before: Math.round((o.before ?? 0) * 20),
    },
    indent: {
      firstLine: o.firstLine ? Math.round(o.firstLine * INCH) : undefined,
      left: o.left ? Math.round(o.left * INCH) : undefined,
      hanging: o.hanging ? Math.round(o.hanging * INCH) : undefined,
    },
    keepNext: o.keepNext,
    keepLines: o.keepLines,
    pageBreakBefore: o.pageBreakBefore,
    tabStops: o.tabs?.map((t) => ({
      position: Math.round(t.pos * INCH),
      type: t.type === "right" ? TabStopType.RIGHT : t.type === "center" ? TabStopType.CENTER : TabStopType.LEFT,
    })),
  };
}

/** A paragraph from a string or pre-built runs. */
export function para(content: string | TextRun[], o: ParaOpts = {}): Paragraph {
  const children = typeof content === "string" ? [r(content, o)] : content;
  return new Paragraph({ ...paraOptions(o), children });
}

/** Underscore fill line of roughly `chars` characters. */
export function blank(chars = 20): string {
  return "_".repeat(chars);
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const RULE = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const DASHED = { style: BorderStyle.DASHED, size: 6, color: "000000" };

type CellOpts = { w: number } & Pick<Partial<ITableCellOptions>, "borders" | "verticalAlign" | "margins">;

function cell(children: (Paragraph | Table)[], o: CellOpts): TableCell {
  return new TableCell({
    children,
    width: { size: o.w, type: WidthType.DXA },
    borders: o.borders ?? { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
    verticalAlign: o.verticalAlign ?? VerticalAlign.TOP,
    margins: o.margins ?? { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

/** Two borderless columns (used for signature blocks, side-by-side text). */
export function columns(left: (Paragraph | Table)[], right: (Paragraph | Table)[], leftWidth = HALF): Table {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [leftWidth, CONTENT_W - leftWidth],
    rows: [
      new TableRow({
        children: [cell(left, { w: leftWidth }), cell(right, { w: CONTENT_W - leftWidth })],
      }),
    ],
  });
}

/* ── captions ─────────────────────────────────────────────────────────── */

export interface NyCaption {
  county: string;
  plaintiff: string;
  defendant: string;
  title: string;
  indexNo?: string;
  calendar?: boolean;
  defendantLabel?: string;
  subtitle?: string;
}

/**
 * The standard NY Supreme Court litigation caption, drawn the way the
 * operator files them (his own exemplar, 2026-08-04): court and county
 * bold at the top; the party box exactly as wide as the header, ruled top
 * and bottom, closed on the right (the "X" of a typed caption); names flush
 * left with their labels centered beneath; "-against-" centered with a full
 * blank line of air on each side; Index No. and the underlined title in the
 * right column.
 */
export function nyCaption(c: NyCaption): (Paragraph | Table)[] {
  const leftW = Math.round(CONTENT_W * 0.58);
  const rightW = CONTENT_W - leftW;
  const S = { spacing: "single" as const };
  const left: Paragraph[] = [
    para(`${c.plaintiff.toUpperCase()},`, S),
    para("Plaintiff,", { ...S, align: "center", italic: true }),
    para("", S),
    para("-against-", { ...S, align: "center" }),
    para("", S),
    para(`${c.defendant.toUpperCase()},`, S),
    para(c.defendantLabel ?? "Defendant.", { ...S, align: "center", italic: true }),
  ];
  const right: Paragraph[] = [
    para(`Index No.: ${c.indexNo || blank(15)}`, { ...S, left: 0.2 }),
    ...(c.calendar ? [para(`Calendar No.: ${blank(10)}`, { ...S, left: 0.2 })] : []),
    para("", S),
    para("", S),
    para([r(c.title, { bold: true, underline: true })], { ...S, align: "center" }),
    ...(c.subtitle ? [para(c.subtitle, { ...S, align: "center" })] : []),
  ];
  const box = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows: [
      new TableRow({
        children: [
          cell(left, { w: leftW, borders: { top: DASHED, bottom: DASHED, left: NO_BORDER, right: RULE } }),
          cell(right, { w: rightW, verticalAlign: VerticalAlign.CENTER }),
        ],
      }),
    ],
  });
  return [
    para([r("SUPREME COURT OF THE STATE OF NEW YORK", { bold: true })], S),
    para([r(`COUNTY OF ${c.county.toUpperCase()}`, { bold: true })], { ...S, after: 4 }),
    box,
    para("", S),
  ];
}

export interface NjCaption {
  county: string;
  plaintiff: string;
  defendant: string;
  /** Title lines, e.g. ["CERTIFICATION OF VERIFICATION", "AND NON-COLLUSION"]. */
  title: string[];
  docketNo?: string;
  /** "CIVIL ACTION" line above the title (the Summons carries it). */
  civilAction?: boolean;
  /** The pro-se block above the box: name, "Plaintiff, Pro-Se", address, phone. */
  proSe?: { name: string; address: string; cityStateZip: string; phone: string };
}

/**
 * The NJ Superior Court, Chancery Division, Family Part caption — the
 * pro-se filer's block above it (as the New Jersey rules expect), then the
 * two-column box: parties on the left, court / county / docket / title on
 * the right, the columns divided by the rule of a typed colon caption.
 */
export function njCaption(c: NjCaption): (Paragraph | Table)[] {
  const leftW = Math.round(CONTENT_W * 0.5);
  const rightW = CONTENT_W - leftW;
  const S = { spacing: "single" as const };
  const left: Paragraph[] = [
    para("", S),
    para(`${c.plaintiff.toUpperCase()},`, S),
    para("Plaintiff,", S),
    para("", S),
    para("vs.", { ...S, left: 0.5 }),
    para("", S),
    para("", S),
    para(`${c.defendant.toUpperCase()},`, S),
    para("Defendant.", S),
    para("", S),
  ];
  const right: Paragraph[] = [
    para("", S),
    para("SUPERIOR COURT OF NEW JERSEY", { ...S, align: "center" }),
    para("CHANCERY DIVISION- FAMILY PART", { ...S, align: "center" }),
    para(`${c.county.toUpperCase()} COUNTY`, { ...S, align: "center" }),
    para("", S),
    para(`DOCKET NO.:  ${c.docketNo || "FM-"}`, { ...S, left: 0.1 }),
    para("", S),
    ...(c.civilAction ? [para("CIVIL ACTION", { ...S, align: "center" }), para("", S)] : []),
    ...c.title.map((t) => para([r(t, { bold: true })], { ...S, align: "center" })),
  ];
  const box = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows: [
      new TableRow({
        children: [
          cell(left, { w: leftW, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: RULE } }),
          cell(right, { w: rightW }),
        ],
      }),
    ],
  });
  const pro = c.proSe;
  return [
    ...(pro
      ? [
          para(pro.name, S),
          para("Plaintiff, Pro-Se", S),
          para(pro.address, S),
          para(pro.cityStateZip, S),
          para(`Phone: ${pro.phone}`, { ...S, after: 6 }),
        ]
      : []),
    box,
    para("", S),
  ];
}

/* ── pleading paragraphs, blocks ──────────────────────────────────────── */

/** "FIRST: That the parties..." — double-spaced, hanging label. */
export function pleading(label: string, text: string, o: ParaOpts = {}): Paragraph {
  return para([r(`${label}: `, { bold: o.bold ?? true }), r(text)], { firstLine: 0.5, align: "both", ...o });
}

/** A labeled body paragraph where the label is a run, not a pleading number. */
export function labeled(label: string, text: string, o: ParaOpts = {}): Paragraph {
  return para([r(label, { bold: true }), r(text)], { firstLine: 0.5, align: "both", ...o });
}

/** Body paragraph, double-spaced, first-line indent. */
export function body(text: string, o: ParaOpts = {}): Paragraph {
  return para(text, { firstLine: 0.5, align: "both", ...o });
}

/** Centered bold heading, single-spaced with air around it. */
export function heading(text: string, o: ParaOpts = {}): Paragraph {
  return para([r(text, { bold: true, underline: o.underline })], {
    align: "center",
    spacing: "single",
    before: 8,
    after: 8,
    keepNext: true,
    ...o,
    underline: undefined,
  });
}

/** Right-half signature block: rule line, then the given lines beneath. */
export function signatureBlock(lines: string[], opts: { dated?: string; leftLines?: string[] } = {}): (Paragraph | Table)[] {
  const S = { spacing: "single" as const };
  const left = [para(opts.dated ?? "", S), ...(opts.leftLines ?? []).map((l) => para(l, S))];
  const right = [
    para(blank(34), S),
    ...lines.map((l) => para(l, S)),
  ];
  return [para("", S), columns(left, right)];
}

/** A New York notary jurat (acknowledgment before a notary public). */
export function nyJurat(county = "", opts: { affiant?: string } = {}): Paragraph[] {
  const S = { spacing: "single" as const };
  return [
    para("", S),
    para(`STATE OF NEW YORK\t)`, { ...S, tabs: [{ pos: 2.6 }] }),
    para(`\t) ss.:`, { ...S, tabs: [{ pos: 2.6 }] }),
    para(`COUNTY OF ${county ? county.toUpperCase() : blank(14)}\t)`, { ...S, tabs: [{ pos: 2.6 }] }),
    para("", S),
    para(
      `On the ${blank(6)} day of ${blank(14)}, 20${blank(3)}, before me personally came ` +
        `${opts.affiant ? opts.affiant : blank(28)}, to me known and known to me to be the ` +
        `individual described in and who executed the foregoing instrument, and duly acknowledged to me that ` +
        `he/she executed the same.`,
      { ...S, align: "both" }
    ),
    para("", S),
    para(`\t${blank(34)}`, { ...S, tabs: [{ pos: 3.5 }] }),
    para(`\tNotary Public`, { ...S, tabs: [{ pos: 3.5 }] }),
  ];
}

/** Explicit page break. */
export function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

/* ── the document ─────────────────────────────────────────────────────── */

export interface BuildOpts {
  /** Footer label, e.g. "(Form UD-1)". */
  formLabel: string;
  title?: string;
}

/** Assemble and serialize. */
export async function buildDocx(children: (Paragraph | Table)[], o: BuildOpts): Promise<Uint8Array> {
  const doc = new Document({
    creator: "DivorceGPT",
    title: o.title ?? o.formLabel,
    styles: {
      default: { document: { run: { font: FONT, size: SIZE } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: 15840 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
                children: [
                  r(o.formLabel, { size: SMALL }),
                  new TextRun({ text: "\tPage ", font: FONT, size: SMALL }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SMALL }),
                  new TextRun({ text: " of ", font: FONT, size: SMALL }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: SMALL }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

/* ── generator contract ───────────────────────────────────────────────── */

/** What every form generator returns; index.ts turns it into bytes. */
export interface WordForm {
  children: (Paragraph | Table)[];
  /** Footer label, e.g. "(Form UD-1)". */
  formLabel: string;
  filename: string;
}

/** Generator input: the flat RenderPayload, plus (for the child-relief
 *  forms) structured child facts. Read through `s()` / `obj()`. */
export type WordPayload = Record<string, unknown>;

export function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : v === true ? "true" : "";
}
export function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
export function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>) : [];
}
