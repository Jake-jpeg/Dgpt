// UD-1 (Summons with Notice) PDF Generator
// Uses pdf-lib (pure JS, works on Vercel serverless)
// Generates official NYS UD-1 form (Rev. 1/25/16)

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
  
  const { height } = page.getSize();
  const black = rgb(0, 0, 0);
  
  const county = data.qualifyingCounty.toUpperCase();
  const plaintiffName = data.plaintiffName;
  const defendantName = data.defendantName;
  const qualifying = data.qualifyingParty;
  const venueName = qualifying === 'plaintiff' ? plaintiffName : defendantName;
  
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  });

  // Helper to draw text
  const drawText = (text: string, x: number, y: number, font = timesRoman, size = 11) => {
    page.drawText(text, { x, y: height - y, size, font, color: black });
  };
  
  // Helper to draw line
  const drawLine = (x1: number, y: number, x2: number) => {
    page.drawLine({
      start: { x: x1, y: height - y },
      end: { x: x2, y: height - y },
      thickness: 0.5,
      color: black,
    });
  };
  
  // Helper to draw checkbox (checked)
  const drawCheckbox = (x: number, y: number) => {
    page.drawRectangle({
      x, y: height - y - 8,
      width: 8, height: 8,
      borderColor: black,
      borderWidth: 0.5,
    });
    page.drawText('✓', { x: x + 1, y: height - y - 6, size: 8, font: timesRoman, color: black });
  };

  let y = 50;

  // ===== ROW 1: SUPREME COURT / Index No. =====
  drawText('SUPREME COURT OF THE STATE OF NEW YORK', 72, y, timesBold, 12);
  drawText('Index No.:', 400, y);
  drawLine(455, y + 2, 576);

  // ===== ROW 2: COUNTY OF / Date Summons filed =====
  y += 14;
  drawText('COUNTY OF', 72, y, timesBold, 12);
  drawText(county, 143, y, timesRoman, 12);
  drawLine(140, y + 2, 240);
  drawText('Date Summons filed:', 400, y);
  drawLine(502, y + 2, 576);

  // ===== ROW 3: Dashed line / Plaintiff designates =====
  y += 14;
  drawText('-'.repeat(56) + 'X', 72, y, timesRoman, 12);
  drawText('Plaintiff designates', 400, y);
  drawLine(495, y + 2, 576);

  // ===== ROW 4: County as place of trial =====
  y += 14;
  drawText(`${county} County as the place of trial`, 400, y);

  // ===== ROW 5: The basis of venue is =====
  y += 14;
  drawText('The basis of venue is:', 400, y, timesItalic, 10);

  // ===== ROW 6: [Name]'s address =====
  y += 12;
  drawText(`${venueName}'s`, 400, y, timesRoman, 10);
  y += 12;
  drawText('address.', 400, y, timesRoman, 10);

  // ===== SUMMONS WITH NOTICE =====
  y += 18;
  drawText('SUMMONS WITH NOTICE', 420, y, timesBold, 11);

  y += 14;
  drawText('Plaintiff/Defendant resides at:', 400, y, timesItalic, 10);

  // Address lines
  const address = data.qualifyingAddress;
  const addrParts = address.split(',').map(p => p.trim());
  let addrLines: string[];
  if (addrParts.length >= 3) {
    addrLines = [addrParts[0], addrParts[1], addrParts.slice(2).join(', ')];
  } else if (addrParts.length === 2) {
    addrLines = [addrParts[0], addrParts[1], ''];
  } else {
    addrLines = [address, '', ''];
  }

  for (const line of addrLines) {
    y += 14;
    drawLine(400, y + 2, 576);
    if (line) drawText(line, 404, y);
  }

  // ===== PLAINTIFF NAME =====
  let yLeft = 160;
  drawLine(72, yLeft + 2, 350);
  drawText(plaintiffName, 180, yLeft, timesRoman, 12);

  yLeft += 18;
  drawText('Plaintiff,', 305, yLeft, timesItalic, 12);

  yLeft += 22;
  drawText('-against-', 190, yLeft, timesRoman, 12);

  // ===== DEFENDANT NAME =====
  yLeft += 32;
  drawLine(72, yLeft + 2, 350);
  drawText(defendantName, 180, yLeft, timesRoman, 12);

  yLeft += 18;
  drawText('Defendant.', 295, yLeft, timesItalic, 12);

  yLeft += 10;
  drawText('-'.repeat(56) + 'X', 72, yLeft, timesRoman, 12);

  // ===== ACTION FOR A DIVORCE =====
  yLeft += 28;
  drawText('ACTION FOR A DIVORCE', 220, yLeft, timesBold, 14);

  yLeft += 24;
  drawText('To the above named Defendant:', 72, yLeft, timesItalic, 11);

  // ===== YOU ARE HEREBY SUMMONED =====
  yLeft += 20;
  drawText('YOU ARE HEREBY SUMMONED', 100, yLeft, timesBold, 10);
  drawText('to serve a notice of appearance on the', 250, yLeft, timesRoman, 10);
  
  // Plaintiff checkbox
  drawCheckbox(480, yLeft);
  drawText('Plaintiff', 492, yLeft, timesItalic, 10);

  yLeft += 14;
  drawText('within twenty (20) days after the service of this summons, exclusive of the day of service (or within', 72, yLeft, timesRoman, 10);

  yLeft += 12;
  drawText('thirty (30) days after the service is complete if this summons is not personally delivered to you within', 72, yLeft, timesRoman, 10);

  yLeft += 12;
  drawText('the State of New York); and in case of your failure to appear, judgment will be taken against you by', 72, yLeft, timesRoman, 10);

  yLeft += 12;
  drawText('default for the relief demanded in the notice set forth below.', 72, yLeft, timesRoman, 10);

  // ===== DATED / SIGNATURE =====
  yLeft += 28;
  drawText('Dated', 72, yLeft);
  drawText(today, 105, yLeft);
  drawLine(102, yLeft + 2, 220);

  // Plaintiff checkbox
  drawCheckbox(300, yLeft);
  drawText('Plaintiff', 312, yLeft, timesItalic, 10);

  yLeft += 22;
  drawLine(300, yLeft + 2, 540);
  drawText(plaintiffName, 380, yLeft);

  yLeft += 16;
  drawText('Phone No.:', 300, yLeft);
  drawText(data.plaintiffPhone || '', 358, yLeft);

  yLeft += 14;
  drawText('Address:', 300, yLeft);

  // Mailing address
  const mailParts = data.plaintiffAddress.split(',').map(p => p.trim());
  yLeft += 12;
  for (const part of mailParts.slice(0, 3)) {
    drawText(part, 358, yLeft);
    yLeft += 12;
  }

  // ===== NOTICE SECTION =====
  yLeft += 12;
  drawText('NOTICE:', 72, yLeft, timesBold, 11);
  drawText('The nature of this action is to dissolve the marriage between the parties, on the', 120, yLeft, timesRoman, 10);

  yLeft += 14;
  drawText('grounds:', 120, yLeft, timesRoman, 10);
  drawText('DRL §170 subd. 7', 168, yLeft, timesBold, 10);
  drawText('—', 255, yLeft, timesRoman, 10);
  drawText('irretrievable breakdown in relationship for a period of', 268, yLeft, timesBold, 10);

  yLeft += 12;
  drawText('at least six months.', 120, yLeft, timesBold, 10);

  yLeft += 18;
  drawText('The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage', 72, yLeft, timesRoman, 10);

  yLeft += 12;
  drawText('between the parties in this action.', 72, yLeft, timesRoman, 10);

  // ===== ANCILLARY RELIEF =====
  yLeft += 20;
  drawText('The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:', 72, yLeft, timesRoman, 10);

  yLeft += 16;
  drawCheckbox(72, yLeft);
  drawText('NONE', 84, yLeft, timesBold, 10);
  drawText('— I am not requesting any ancillary relief;', 118, yLeft, timesRoman, 10);

  yLeft += 16;
  drawText('AND', 72, yLeft, timesBold, 10);
  drawText('any other relief the court deems fit and proper', 100, yLeft, timesRoman, 10);

  // ===== FOOTER =====
  drawText('(UD-1 Rev. 1/25/16)', 72, 760, timesRoman, 9);

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

    // Default phone if not provided
    if (!data.plaintiffPhone) {
      data.plaintiffPhone = '';
    }
    
    const pdfBytes = await generateUD1PDF(data);
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="UD-1_Summons_${data.plaintiffName.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('UD-1 generation error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
