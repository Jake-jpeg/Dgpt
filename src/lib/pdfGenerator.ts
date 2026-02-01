// Client-side PDF generation using pdf-lib
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface FormData {
  plaintiffName: string;
  defendantName: string;
  county: string;
  indexNumber: string;
  plaintiffAddress: string;
  defendantAddress: string;
  marriageDate: string;
  marriageCity: string;
  marriageState: string;
  breakdownDate: string;
  religiousCeremony: boolean;
}

// Helper to draw text with word wrap
function drawWrappedText(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontSize: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font });
      currentY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }
  
  if (line) {
    page.drawText(line, { x, y: currentY, size: fontSize, font });
    currentY -= lineHeight;
  }
  
  return currentY;
}

// Generate UD-10 (Findings of Fact and Conclusions of Law)
export async function generateUD10(data: FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page.getSize();
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const margin = 72;
  let y = height - margin;
  
  // Header
  page.drawText(`SUPREME COURT OF THE STATE OF NEW YORK`, {
    x: margin, y, size: 12, font: timesBold
  });
  y -= 16;
  page.drawText(`COUNTY OF ${data.county.toUpperCase()}`, {
    x: margin, y, size: 12, font: timesBold
  });
  y -= 24;
  
  // Caption box
  page.drawText(`${data.plaintiffName},`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 14;
  page.drawText(`Plaintiff,`, { x: margin + 40, y, size: 12, font: timesRoman });
  y -= 20;
  page.drawText(`-against-`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 20;
  page.drawText(`${data.defendantName},`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 14;
  page.drawText(`Defendant.`, { x: margin + 40, y, size: 12, font: timesRoman });
  
  // Index number on right
  page.drawText(`Index No.: ${data.indexNumber || '_____________'}`, {
    x: 400, y: height - margin - 40, size: 12, font: timesRoman
  });
  
  y -= 30;
  
  // Title
  page.drawText(`FINDINGS OF FACT AND CONCLUSIONS OF LAW`, {
    x: 150, y, size: 14, font: timesBold
  });
  y -= 30;
  
  // Body text
  const bodyText = `The above-entitled action having duly come before this Court, and the Plaintiff having appeared pro se, and the Defendant having failed to appear or answer, and the Court having examined the pleadings and proof submitted, the Court makes the following:`;
  
  y = drawWrappedText(page, bodyText, margin, y, 468, timesRoman, 12, 20);
  y -= 20;
  
  // Findings of Fact header
  page.drawText(`FINDINGS OF FACT`, { x: 250, y, size: 12, font: timesBold });
  y -= 24;
  
  // Finding 1
  page.drawText(`FIRST:`, { x: margin, y, size: 12, font: timesBold });
  const finding1 = `The parties were married on ${data.marriageDate || '_____________'} in ${data.marriageCity || '_____________'}, ${data.marriageState || '_____________'}.`;
  y = drawWrappedText(page, finding1, margin + 60, y, 408, timesRoman, 12, 20);
  y -= 10;
  
  // Finding 2
  page.drawText(`SECOND:`, { x: margin, y, size: 12, font: timesBold });
  const finding2 = `The relationship between the parties has broken down irretrievably for a period of at least six months.`;
  y = drawWrappedText(page, finding2, margin + 70, y, 398, timesRoman, 12, 20);
  y -= 10;
  
  // Finding 3
  page.drawText(`THIRD:`, { x: margin, y, size: 12, font: timesBold });
  y = drawWrappedText(page, `There are no children of the marriage under the age of 21.`, margin + 55, y, 413, timesRoman, 12, 20);
  y -= 10;
  
  // Finding 4
  page.drawText(`FOURTH:`, { x: margin, y, size: 12, font: timesBold });
  y = drawWrappedText(page, `There are no issues of maintenance, equitable distribution, or counsel fees.`, margin + 70, y, 398, timesRoman, 12, 20);
  y -= 30;
  
  // Conclusions header
  page.drawText(`CONCLUSIONS OF LAW`, { x: 240, y, size: 12, font: timesBold });
  y -= 24;
  
  page.drawText(`FIRST:`, { x: margin, y, size: 12, font: timesBold });
  y = drawWrappedText(page, `The Plaintiff is entitled to a judgment of divorce pursuant to DRL §170(7).`, margin + 60, y, 408, timesRoman, 12, 20);
  y -= 20;
  
  // Signature lines
  y -= 40;
  page.drawText(`Dated: _____________________`, { x: margin, y, size: 12, font: timesRoman });
  y -= 30;
  page.drawText(`_________________________________`, { x: 350, y, size: 12, font: timesRoman });
  y -= 14;
  page.drawText(`J.S.C. / Referee`, { x: 400, y, size: 12, font: timesRoman });
  
  // Footer
  page.drawText(`(Form UD-10)`, { x: 280, y: 40, size: 10, font: timesRoman });
  
  return pdfDoc.save();
}

// Generate UD-11 (Judgment of Divorce)
export async function generateUD11(data: FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const margin = 72;
  let y = height - margin;
  
  // Header
  page.drawText(`SUPREME COURT OF THE STATE OF NEW YORK`, {
    x: margin, y, size: 12, font: timesBold
  });
  y -= 16;
  page.drawText(`COUNTY OF ${data.county.toUpperCase()}`, {
    x: margin, y, size: 12, font: timesBold
  });
  y -= 30;
  
  // Caption
  page.drawText(`${data.plaintiffName}, Plaintiff`, { x: margin + 20, y, size: 12, font: timesRoman });
  page.drawText(`Index No.: ${data.indexNumber || '_____________'}`, { x: 400, y, size: 12, font: timesRoman });
  y -= 20;
  page.drawText(`-against-`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 20;
  page.drawText(`${data.defendantName}, Defendant`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 30;
  
  // Title
  page.drawText(`JUDGMENT OF DIVORCE`, { x: 220, y, size: 14, font: timesBold });
  y -= 30;
  
  // Body
  const intro = `The above-entitled action having come before this Court, and all papers having been filed and the requirements of the CPLR and DRL having been complied with, it is hereby`;
  y = drawWrappedText(page, intro, margin, y, 468, timesRoman, 12, 20);
  y -= 20;
  
  page.drawText(`ORDERED AND ADJUDGED`, { x: margin, y, size: 12, font: timesBold });
  y -= 20;
  
  const judgment = `that the marriage between ${data.plaintiffName}, Plaintiff, and ${data.defendantName}, Defendant, is hereby dissolved pursuant to DRL §170(7), and that both parties are free to marry again as if never married.`;
  y = drawWrappedText(page, judgment, margin, y, 468, timesRoman, 12, 20);
  
  // Signature
  y -= 60;
  page.drawText(`Dated: _____________________`, { x: margin, y, size: 12, font: timesRoman });
  y -= 14;
  const enterY = y + 30;
  page.drawText(`ENTER:`, { x: 400, y: enterY, size: 12, font: timesBold });
  page.drawText(`_________________________________`, { x: 350, y, size: 12, font: timesRoman });
  y -= 14;
  page.drawText(`J.S.C. / Referee`, { x: 400, y, size: 12, font: timesRoman });
  
  page.drawText(`(Form UD-11)`, { x: 280, y: 40, size: 10, font: timesRoman });
  
  return pdfDoc.save();
}

// Generate UD-12 (Part 130 Certification)
export async function generateUD12(data: FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const margin = 72;
  let y = height - margin;
  
  // Header
  page.drawText(`SUPREME COURT OF THE STATE OF NEW YORK`, { x: margin, y, size: 12, font: timesBold });
  y -= 16;
  page.drawText(`COUNTY OF ${data.county.toUpperCase()}`, { x: margin, y, size: 12, font: timesBold });
  y -= 30;
  
  // Caption
  page.drawText(`${data.plaintiffName}, Plaintiff`, { x: margin + 20, y, size: 12, font: timesRoman });
  page.drawText(`Index No.: ${data.indexNumber || '_____________'}`, { x: 400, y, size: 12, font: timesRoman });
  y -= 20;
  page.drawText(`-against-`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 20;
  page.drawText(`${data.defendantName}, Defendant`, { x: margin + 20, y, size: 12, font: timesRoman });
  y -= 30;
  
  // Title and body
  page.drawText(`CERTIFICATION`, { x: margin, y, size: 12, font: timesBold });
  const certText = ` Pursuant to 22 NYCRR 130-1.1(c), I hereby certify that to the best of my knowledge, information and belief, formed after an inquiry reasonable under the circumstances, the presentation of the papers herein and the contentions therein are not frivolous.`;
  y = drawWrappedText(page, certText, margin + 100, y, 368, timesRoman, 12, 20);
  
  // Signature
  y -= 50;
  page.drawText(`Dated: _____________________`, { x: margin, y, size: 12, font: timesRoman });
  y -= 40;
  page.drawText(`_________________________________`, { x: margin, y, size: 12, font: timesRoman });
  y -= 14;
  page.drawText(`Signature`, { x: margin + 50, y, size: 12, font: timesRoman });
  y -= 30;
  page.drawText(`Print Name: ${data.plaintiffName}`, { x: margin, y, size: 12, font: timesRoman });
  
  page.drawText(`(Form UD-12)`, { x: 280, y: 40, size: 10, font: timesRoman });
  
  return pdfDoc.save();
}

// Bundle multiple PDFs into a zip or generate all and download
export async function generatePhase2Package(data: FormData): Promise<{ name: string; bytes: Uint8Array }[]> {
  const forms: { name: string; bytes: Uint8Array }[] = [];
  
  // Generate each form
  forms.push({ name: 'UD-10_Findings_of_Fact.pdf', bytes: await generateUD10(data) });
  forms.push({ name: 'UD-11_Judgment_of_Divorce.pdf', bytes: await generateUD11(data) });
  forms.push({ name: 'UD-12_Part_130_Certification.pdf', bytes: await generateUD12(data) });
  
  // TODO: Add UD-5, UD-6, UD-7, UD-9
  // TODO: Add UD-4 if religiousCeremony
  
  return forms;
}

// Download a single PDF
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes) as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
