/**
 * DivorceGPT UD-1 (Summons with Notice) PDF Generator
 * Version: 1.09
 * ====================================================
 * 
 * TWO-BOX LAYOUT:
 * - BOX 1 (Caption): TOP, RIGHT, BOTTOM borders (no left)
 * - BOX 2 (Metadata): LEFT border only
 * - Header: Left-aligned, Bold
 * 
 * County Logic:
 * - Accepts both 'county' and 'filingCounty' field names
 * - Automatically strips " County" suffix if present
 * - Uses qualifying party's county (plaintiff's if both apply)
 */

import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

// Page dimensions
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 72;
const MARGIN_RIGHT = 72;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 14;

// Box layout - no gap
const BOX1_LEFT_X = MARGIN_LEFT;
const BOX1_RIGHT_X = PAGE_WIDTH / 2;
const BOX2_LEFT_X = PAGE_WIDTH / 2;
const BOX2_RIGHT_X = PAGE_WIDTH - MARGIN_RIGHT;

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  county?: string;
  filingCounty?: string;  // Alternative field name
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
  dateFiled?: string;
}

function formatAddressLines(address: string): string[] {
  address = address.trim();
  
  const match1 = address.match(/,\s*([^,]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)$/);
  if (match1) {
    const cityStateZip = match1[1].trim();
    const street = address.slice(0, match1.index).trim();
    return [street, cityStateZip];
  }
  
  const match2 = address.match(/,\s*([A-Z]{2}\s+\d{5}(?:-\d{4})?)$/);
  if (match2) {
    const beforeState = address.slice(0, match2.index);
    const lastComma = beforeState.lastIndexOf(',');
    if (lastComma > 0) {
      const street = beforeState.slice(0, lastComma).trim();
      const cityStateZip = beforeState.slice(lastComma + 1).trim() + ', ' + match2[1].trim();
      return [street, cityStateZip];
    }
  }
  
  return [address];
}

function titleCase(str: string): string {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

async function generateUD1PDF(data: UD1Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  const black = rgb(0, 0, 0);
  
  // Extract data
  // Accept both 'county' and 'filingCounty', strip " County" suffix if present
  let countyName = (data.county || data.filingCounty || '').trim();
  countyName = countyName.replace(/\s+County$/i, '').trim();  // Remove " County" suffix
  const countyUpper = countyName.toUpperCase();
  const countyTitle = titleCase(countyName);
  const plaintiffName = data.plaintiffName.trim();
  const defendantName = data.defendantName.trim();
  const qualifyingParty = data.qualifyingParty;
  const qualifyingPartyLabel = qualifyingParty === 'plaintiff' ? 'Plaintiff' : 'Defendant';
  const qualifyingAddress = data.qualifyingAddress.trim();
  const plaintiffPhone = data.plaintiffPhone?.trim() || '';
  const plaintiffAddress = data.plaintiffAddress.trim();
  const dateFiled = data.dateFiled || '';
  
  const qualAddrLines = formatAddressLines(qualifyingAddress);
  const plaintiffAddrLines = formatAddressLines(plaintiffAddress);
  
  const displayDate = dateFiled || new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  
  const drawText = (text: string, x: number, yPos: number, font: PDFFont = timesRoman, size: number = 12) => {
    page.drawText(text, { x, y: yPos, font, size, color: black });
  };
  
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: black });
  };
  
  const drawUnderlinedText = (text: string, x: number, yPos: number, font: PDFFont = timesRoman, size: number = 12): number => {
    page.drawText(text, { x, y: yPos, font, size, color: black });
    const width = font.widthOfTextAtSize(text, size);
    drawLine(x, yPos - 2, x + width, yPos - 2);
    return width;
  };
  
  // =========================================================================
  // HEADER: Left aligned, Bold
  // =========================================================================
  drawText('SUPREME COURT OF THE STATE OF NEW YORK', MARGIN_LEFT, y, timesBold);
  y -= LINE_HEIGHT;
  drawText(`COUNTY OF ${countyUpper}`, MARGIN_LEFT, y, timesBold);
  
  y -= LINE_HEIGHT * 0.5;
  
  // =========================================================================
  // BOXES START
  // =========================================================================
  const boxesTopY = y;
  
  // BOX 2 CONTENT
  const box2ContentX = BOX2_LEFT_X + 8;
  const box2MaxWidth = BOX2_RIGHT_X - box2ContentX - 8;
  let y2 = boxesTopY - LINE_HEIGHT;
  
  drawText('Index No.:', box2ContentX, y2);
  y2 -= LINE_HEIGHT * 2;
  
  drawText('Date Summons filed:', box2ContentX, y2);
  y2 -= LINE_HEIGHT * 2;
  
  // Plaintiff designates line
  const part1 = 'Plaintiff designates ';
  const countyDisplay = `${countyTitle} County`;
  const part1b = ' as the place of trial';
  
  const fullWidth1 = timesRoman.widthOfTextAtSize(part1, 12) + 
                     timesRoman.widthOfTextAtSize(countyDisplay, 12) + 
                     timesRoman.widthOfTextAtSize(part1b, 12);
  
  if (fullWidth1 <= box2MaxWidth) {
    drawText(part1, box2ContentX, y2);
    let xPos = box2ContentX + timesRoman.widthOfTextAtSize(part1, 12);
    xPos += drawUnderlinedText(countyDisplay, xPos, y2);
    drawText(part1b, xPos, y2);
  } else {
    drawText(part1, box2ContentX, y2);
    const xPos = box2ContentX + timesRoman.widthOfTextAtSize(part1, 12);
    drawUnderlinedText(countyDisplay, xPos, y2);
    y2 -= LINE_HEIGHT;
    drawText('as the place of trial', box2ContentX, y2);
  }
  y2 -= LINE_HEIGHT;
  
  // Basis of venue line
  const venueP1 = 'The basis of the venue is: ';
  const venueP2 = `${qualifyingPartyLabel}'s address`;
  
  const fullWidth2 = timesRoman.widthOfTextAtSize(venueP1, 12) + 
                     timesRoman.widthOfTextAtSize(venueP2, 12);
  
  if (fullWidth2 <= box2MaxWidth) {
    drawText(venueP1, box2ContentX, y2);
    const xPos = box2ContentX + timesRoman.widthOfTextAtSize(venueP1, 12);
    drawUnderlinedText(venueP2, xPos, y2);
  } else {
    drawText(venueP1, box2ContentX, y2);
    y2 -= LINE_HEIGHT;
    drawUnderlinedText(venueP2, box2ContentX, y2);
  }
  y2 -= LINE_HEIGHT * 2;
  
  // SUMMONS WITH NOTICE (centered)
  const summonsText = 'SUMMONS WITH NOTICE';
  const summonsWidth = timesBold.widthOfTextAtSize(summonsText, 12);
  const box2CenterX = BOX2_LEFT_X + (BOX2_RIGHT_X - BOX2_LEFT_X) / 2;
  drawUnderlinedText(summonsText, box2CenterX - summonsWidth / 2, y2, timesBold);
  y2 -= LINE_HEIGHT * 2;
  
  // Resides at
  drawText(`${qualifyingPartyLabel} resides at:`, box2ContentX, y2);
  y2 -= LINE_HEIGHT;
  
  drawText(qualAddrLines[0] || '', box2ContentX, y2);
  if (qualAddrLines.length > 1) {
    y2 -= LINE_HEIGHT;
    drawText(qualAddrLines[1], box2ContentX, y2);
  }
  
  const boxesBottomY = y2 - 8;
  
  // BOX 1 CONTENT (Caption - vertically distributed)
  const box1ContentX = BOX1_LEFT_X + 8;
  const boxHeight = boxesTopY - boxesBottomY;
  
  const plaintiffY = boxesTopY - boxHeight * 0.2;
  const againstY = boxesTopY - boxHeight * 0.5;
  const defendantY = boxesTopY - boxHeight * 0.75;
  
  drawText(plaintiffName, box1ContentX, plaintiffY);
  drawText('-against-', box1ContentX + 40, againstY);
  drawText(defendantName, box1ContentX, defendantY);
  
  // DRAW BOX BORDERS
  // BOX 1: TOP, RIGHT, BOTTOM (no left)
  drawLine(BOX1_LEFT_X, boxesTopY, BOX1_RIGHT_X, boxesTopY);
  drawLine(BOX1_RIGHT_X, boxesTopY, BOX1_RIGHT_X, boxesBottomY);
  drawLine(BOX1_LEFT_X, boxesBottomY, BOX1_RIGHT_X, boxesBottomY);
  
  // BOX 2: LEFT only
  drawLine(BOX2_LEFT_X, boxesTopY, BOX2_LEFT_X, boxesBottomY);
  
  // =========================================================================
  // ACTION FOR A DIVORCE
  // =========================================================================
  y = boxesBottomY - LINE_HEIGHT * 1.5;
  
  const actionText = 'ACTION FOR A DIVORCE';
  const actionWidth = timesBold.widthOfTextAtSize(actionText, 12);
  drawText(actionText, (PAGE_WIDTH - actionWidth) / 2, y, timesBold);
  
  y -= LINE_HEIGHT * 1.5;
  drawText('To the above named Defendant:', MARGIN_LEFT, y, timesItalic);
  y -= LINE_HEIGHT * 1.5;
  
  // =========================================================================
  // YOU ARE HEREBY SUMMONED (bold) + rest justified
  // =========================================================================
  const boldPart = 'YOU ARE HEREBY SUMMONED ';
  drawText(boldPart, MARGIN_LEFT + 36, y, timesBold);
  const boldWidth = timesBold.widthOfTextAtSize(boldPart, 12);
  
  const restText = 'to serve a notice of appearance on the Plaintiff within twenty (20) days after the service of this summons, exclusive of the day of service (or within thirty (30) days after the service is complete if this summons is not personally delivered to you within the State of New York); and in case of your failure to appear, judgment will be taken against you by default for the relief demanded in the notice set forth below.';
  
  // Simple word wrap for the rest
  const words = restText.split(' ');
  let currentLine = '';
  let firstLine = true;
  let startX = MARGIN_LEFT + 36 + boldWidth;
  let maxWidth = CONTENT_WIDTH - 36 - boldWidth;
  
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testWidth = timesRoman.widthOfTextAtSize(testLine, 12);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        drawText(currentLine, startX, y);
        y -= LINE_HEIGHT;
      }
      currentLine = word;
      if (firstLine) {
        firstLine = false;
        startX = MARGIN_LEFT;
        maxWidth = CONTENT_WIDTH;
      }
    }
  }
  if (currentLine) {
    drawText(currentLine, startX, y);
    y -= LINE_HEIGHT;
  }
  
  // =========================================================================
  // Dated: and Signature Block
  // =========================================================================
  y -= LINE_HEIGHT * 2;
  
  drawText(`Dated: ${displayDate}`, MARGIN_LEFT, y);
  
  const sigX = BOX2_LEFT_X + 8;
  drawLine(sigX, y - 3, PAGE_WIDTH - MARGIN_RIGHT, y - 3);
  
  drawText(plaintiffName, sigX, y);
  y -= LINE_HEIGHT;
  
  drawText(plaintiffAddrLines[0] || '', sigX, y);
  y -= LINE_HEIGHT;
  
  if (plaintiffAddrLines.length > 1) {
    drawText(plaintiffAddrLines[1], sigX, y);
    y -= LINE_HEIGHT;
  }
  
  drawText(plaintiffPhone, sigX, y);
  
  // =========================================================================
  // NOTICE Section
  // =========================================================================
  y -= LINE_HEIGHT * 2;
  
  drawUnderlinedText('NOTICE:', MARGIN_LEFT, y, timesBold);
  
  const noticeIndent = MARGIN_LEFT + 72;
  drawText('The nature of this action is to dissolve the marriage between the parties, on the', noticeIndent, y);
  
  y -= LINE_HEIGHT;
  drawText('grounds: DRL§170 subd.7 – ', noticeIndent, y);
  
  const groundsX = noticeIndent + timesRoman.widthOfTextAtSize('grounds: DRL§170 subd.7 – ', 12);
  const groundsText = 'irretrievable breakdown in relationship for a';
  drawText(groundsText, groundsX, y, timesBold);
  drawLine(groundsX, y - 2, groundsX + timesBold.widthOfTextAtSize(groundsText, 12), y - 2);
  
  y -= LINE_HEIGHT;
  const groundsText2 = 'period at least six months';
  drawText(groundsText2, noticeIndent, y, timesBold);
  drawLine(noticeIndent, y - 2, noticeIndent + timesBold.widthOfTextAtSize(groundsText2, 12), y - 2);
  
  // =========================================================================
  // Relief Sought
  // =========================================================================
  y -= LINE_HEIGHT * 2;
  
  const reliefText = 'The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage between the parties in this action.';
  const reliefWords = reliefText.split(' ');
  let reliefLine = '';
  
  for (const word of reliefWords) {
    const testLine = reliefLine ? reliefLine + ' ' + word : word;
    if (timesRoman.widthOfTextAtSize(testLine, 12) <= CONTENT_WIDTH) {
      reliefLine = testLine;
    } else {
      drawText(reliefLine, MARGIN_LEFT, y);
      y -= LINE_HEIGHT;
      reliefLine = word;
    }
  }
  if (reliefLine) {
    drawText(reliefLine, MARGIN_LEFT, y);
    y -= LINE_HEIGHT;
  }
  
  // =========================================================================
  // Ancillary Relief
  // =========================================================================
  y -= LINE_HEIGHT;
  
  drawText('The nature of any ancillary or additional relief requested is:', MARGIN_LEFT, y);
  y -= LINE_HEIGHT * 2;
  
  drawText('NONE', MARGIN_LEFT, y, timesBold);
  const noneWidth = timesBold.widthOfTextAtSize('NONE', 12);
  drawText(' – I am not requesting any ancillary relief.', MARGIN_LEFT + noneWidth + 4, y);
  
  // =========================================================================
  // FOOTER
  // =========================================================================
  page.drawText('UD-1 (Summons with Notice)', {
    x: MARGIN_LEFT,
    y: MARGIN_BOTTOM - 20,
    font: timesRoman,
    size: 10,
    color: black
  });
  
  return pdfDoc.save();
}

export async function POST(req: Request): Promise<Response> {
  try {
    const data: UD1Data = await req.json();
    
    // Validate required fields (county OR filingCounty accepted)
    const required: (keyof UD1Data)[] = [
      'plaintiffName', 'defendantName',
      'qualifyingParty', 'qualifyingAddress', 'plaintiffAddress'
    ];
    
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check for county (either field name)
    if (!data.county && !data.filingCounty) {
      return NextResponse.json(
        { error: 'Missing required field: county (or filingCounty)' },
        { status: 400 }
      );
    }
    
    if (!data.plaintiffPhone) data.plaintiffPhone = '';
    
    const pdfBytes = await generateUD1PDF(data);
    
    const safeName = data.plaintiffName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `UD-1_Summons_${safeName}.pdf`;
    
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('UD-1 generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
