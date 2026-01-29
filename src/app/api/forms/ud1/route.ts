// UD-1 (Summons with Notice) PDF Generator
// Uses pdf-lib - direct PDF download
// Matches official NYS UD-1 form (Rev. 1/25/16)

import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
}

async function generateUD1PDF(data: UD1Data): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  const black = rgb(0, 0, 0);
  
  const county = data.qualifyingCounty.toUpperCase();
  const plaintiffName = data.plaintiffName;
  const defendantName = data.defendantName;
  const qualifying = data.qualifyingParty;
  const venueName = qualifying === 'plaintiff' ? plaintiffName : defendantName;
  
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  });

  // Helper functions - Y is from bottom in PDF coordinates
  const drawText = (text: string, x: number, y: number, options: { font?: typeof timesRoman, size?: number } = {}) => {
    const font = options.font || timesRoman;
    const size = options.size || 10;
    page.drawText(text, { x, y, size, font, color: black });
  };
  
  const drawLine = (x1: number, y: number, x2: number) => {
    page.drawLine({
      start: { x: x1, y },
      end: { x: x2, y },
      thickness: 0.5,
      color: black,
    });
  };

  // Parse address into lines
  const parseAddress = (addr: string): string[] => {
    const parts = addr.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      return [parts[0], parts[1], parts.slice(2).join(', ')];
    } else if (parts.length === 2) {
      return [parts[0], parts[1]];
    }
    return [addr];
  };

  const qualifyingAddr = parseAddress(data.qualifyingAddress);
  const mailingAddr = parseAddress(data.plaintiffAddress);

  // ============ PAGE LAYOUT (from top, so subtract from 792) ============
  
  let y = 752; // Start near top

  // === ROW 1: SUPREME COURT / Index No. ===
  drawText('SUPREME COURT OF THE STATE OF NEW YORK', 72, y, { font: timesBold, size: 11 });
  drawText('Index No.:', 420, y, { size: 10 });
  drawLine(472, y - 2, 560);

  // === ROW 2: COUNTY OF / Date Summons filed ===
  y -= 14;
  drawText('COUNTY OF', 72, y, { font: timesBold, size: 11 });
  drawText(county, 142, y, { size: 11 });
  drawLine(140, y - 2, 220);
  drawText('Date Summons filed:', 420, y, { size: 10 });
  drawLine(515, y - 2, 560);

  // === ROW 3: Dashed line / Plaintiff designates ===
  y -= 14;
  drawText('--------------------------------------------------------------------X', 72, y, { size: 10 });
  drawText('Plaintiff designates', 420, y, { size: 10 });
  drawLine(510, y - 2, 560);

  // === ROW 4: County as place of trial ===
  y -= 14;
  drawText(`${county} County as the place of trial`, 420, y, { size: 10 });

  // === ROW 5: The basis of venue is ===
  y -= 12;
  drawText('The basis of venue is:', 420, y, { font: timesItalic, size: 9 });

  // === ROW 6-7: Venue name's address ===
  y -= 11;
  drawText(`${venueName}'s`, 420, y, { size: 9 });
  y -= 11;
  drawText('address.', 420, y, { size: 9 });

  // === PLAINTIFF NAME (left side) ===
  y -= 25;
  drawText(plaintiffName, 200, y, { size: 11 });

  y -= 14;
  drawText('Plaintiff,', 310, y, { font: timesItalic, size: 11 });

  // === -against- ===
  y -= 18;
  drawText('-against-', 200, y, { size: 11 });

  // === SUMMONS WITH NOTICE (right side, aligned with -against-) ===
  drawText('SUMMONS WITH NOTICE', 420, y + 8, { font: timesBold, size: 11 });

  // === Plaintiff/Defendant resides at ===
  y -= 14;
  drawText('Plaintiff/Defendant resides at:', 420, y + 10, { font: timesItalic, size: 9 });
  
  // Address lines with underlines
  let addrY = y - 2;
  for (let i = 0; i < 3; i++) {
    drawLine(420, addrY, 560);
    if (qualifyingAddr[i]) {
      drawText(qualifyingAddr[i], 424, addrY + 3, { size: 9 });
    }
    addrY -= 14;
  }

  // === DEFENDANT NAME ===
  y -= 30;
  drawText(defendantName, 200, y, { size: 11 });

  y -= 14;
  drawText('Defendant.', 305, y, { font: timesItalic, size: 11 });

  // === Closing dashed line ===
  y -= 10;
  drawText('--------------------------------------------------------------------X', 72, y, { size: 10 });

  // === ACTION FOR A DIVORCE ===
  y -= 22;
  drawText('ACTION FOR A DIVORCE', 230, y, { font: timesBold, size: 12 });

  // === To the above named Defendant ===
  y -= 18;
  drawText('To the above named Defendant:', 72, y, { font: timesItalic, size: 10 });

  // === YOU ARE HEREBY SUMMONED paragraph ===
  y -= 16;
  drawText('YOU ARE HEREBY SUMMONED', 90, y, { font: timesBold, size: 9 });
  drawText('to serve a notice of appearance on the', 228, y, { size: 9 });
  
  // Checkbox for Plaintiff
  page.drawRectangle({ x: 410, y: y - 2, width: 8, height: 8, borderColor: black, borderWidth: 0.5 });
  drawText('✓', 411, y - 1, { size: 7 });
  drawText('Plaintiff', 422, y, { font: timesItalic, size: 9 });

  y -= 11;
  drawText('within twenty (20) days after the service of this summons, exclusive of the day of service (or within thirty (30)', 72, y, { size: 9 });
  
  y -= 11;
  drawText('days after the service is complete if this summons is not personally delivered to you within the State of New', 72, y, { size: 9 });
  
  y -= 11;
  drawText('York); and in case of your failure to appear, judgment will be taken against you by default for the relief', 72, y, { size: 9 });
  
  y -= 11;
  drawText('demanded in the notice set forth below.', 72, y, { size: 9 });

  // === DATED / SIGNATURE SECTION ===
  y -= 22;
  drawText('Dated', 72, y, { size: 10 });
  drawText(today, 102, y, { size: 10 });
  drawLine(100, y - 2, 200);

  // Plaintiff checkbox
  page.drawRectangle({ x: 320, y: y - 2, width: 8, height: 8, borderColor: black, borderWidth: 0.5 });
  drawText('✓', 321, y - 1, { size: 7 });
  drawText('Plaintiff', 332, y, { font: timesItalic, size: 9 });

  // Signature line
  y -= 18;
  drawLine(320, y, 540);
  drawText(plaintiffName, 380, y + 3, { size: 10 });

  // Phone
  y -= 14;
  drawText('Phone No.:', 320, y, { size: 9 });
  drawText(data.plaintiffPhone || '', 375, y, { size: 9 });

  // Address
  y -= 12;
  drawText('Address:', 320, y, { size: 9 });
  
  y -= 11;
  for (const line of mailingAddr.slice(0, 2)) {
    drawText(line, 370, y, { size: 9 });
    y -= 11;
  }

  // === NOTICE SECTION ===
  y -= 8;
  drawText('NOTICE:', 72, y, { font: timesBold, size: 10 });
  drawText('The nature of this action is to dissolve the marriage between the parties, on the', 115, y, { size: 9 });

  y -= 11;
  drawText('grounds:', 115, y, { size: 9 });
  drawText('DRL §170 subd. 7', 158, y, { font: timesBold, size: 9 });
  drawText('— irretrievable breakdown in relationship for a period of at least six months.', 248, y, { font: timesBold, size: 9 });

  y -= 16;
  drawText('The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage between', 72, y, { size: 9 });
  
  y -= 11;
  drawText('the parties in this action.', 72, y, { size: 9 });

  // === ANCILLARY RELIEF ===
  y -= 16;
  drawText('The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:', 72, y, { size: 9 });

  y -= 14;
  page.drawRectangle({ x: 72, y: y - 2, width: 8, height: 8, borderColor: black, borderWidth: 0.5 });
  drawText('✓', 73, y - 1, { size: 7 });
  drawText('NONE', 84, y, { font: timesBold, size: 9 });
  drawText('— I am not requesting any ancillary relief;', 115, y, { size: 9 });

  y -= 14;
  drawText('AND', 72, y, { font: timesBold, size: 9 });
  drawText('any other relief the court deems fit and proper', 95, y, { size: 9 });

  // === FOOTER ===
  drawText('(UD-1 Rev. 1/25/16)', 72, 30, { size: 8 });

  return pdfDoc.save();
}

export async function POST(req: Request) {
  try {
    const data: UD1Data = await req.json();
    
    // Validate required fields
    const required = ['plaintiffName', 'defendantName', 'qualifyingCounty', 'qualifyingParty', 'qualifyingAddress', 'plaintiffAddress'];
    for (const field of required) {
      if (!data[field as keyof UD1Data]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (!data.plaintiffPhone) {
      data.plaintiffPhone = '';
    }
    
    const pdfBytes = await generateUD1PDF(data);
    
    // Convert Uint8Array to Buffer for Response
    const buffer = Buffer.from(pdfBytes);
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="UD-1_Summons_${data.plaintiffName.replace(/\s+/g, '_')}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('UD-1 generation error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
