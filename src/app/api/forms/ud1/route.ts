// UD-1 (Summons with Notice) PDF Generator
// Uses jspdf - works reliably on Vercel serverless

import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
}

function generateUD1PDF(data: UD1Data): ArrayBuffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const county = data.qualifyingCounty.toUpperCase();
  const plaintiffName = data.plaintiffName;
  const defendantName = data.defendantName;
  const qualifying = data.qualifyingParty;
  const venueName = qualifying === 'plaintiff' ? plaintiffName : defendantName;
  
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  });

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

  // Helper functions
  const drawLine = (x1: number, y: number, x2: number) => {
    doc.setLineWidth(0.5);
    doc.line(x1, y, x2, y);
  };

  const drawCheckbox = (x: number, y: number, checked: boolean = true) => {
    doc.setLineWidth(0.5);
    doc.rect(x, y - 7, 8, 8);
    if (checked) {
      doc.setFontSize(7);
      doc.text('✓', x + 1.5, y - 1);
    }
  };

  let y = 50;

  // === ROW 1: SUPREME COURT / Index No. ===
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('SUPREME COURT OF THE STATE OF NEW YORK', 72, y);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Index No.:', 420, y);
  drawLine(470, y + 2, 560);

  // === ROW 2: COUNTY OF / Date Summons filed ===
  y += 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('COUNTY OF', 72, y);
  doc.setFont('times', 'normal');
  doc.text(county, 142, y);
  drawLine(140, y + 2, 220);
  
  doc.setFontSize(10);
  doc.text('Date Summons filed:', 420, y);
  drawLine(515, y + 2, 560);

  // === ROW 3: Dashed line / Plaintiff designates ===
  y += 14;
  doc.setFontSize(10);
  doc.text('--------------------------------------------------------------------X', 72, y);
  doc.text('Plaintiff designates', 420, y);
  drawLine(510, y + 2, 560);

  // === ROW 4: County as place of trial ===
  y += 14;
  doc.text(`${county} County as the place of trial`, 420, y);

  // === ROW 5: The basis of venue is ===
  y += 12;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('The basis of venue is:', 420, y);

  // === ROW 6-7: Venue name's address ===
  y += 11;
  doc.setFont('times', 'normal');
  doc.text(`${venueName}'s`, 420, y);
  y += 11;
  doc.text('address.', 420, y);

  // === PLAINTIFF NAME ===
  y += 25;
  doc.setFontSize(11);
  doc.text(plaintiffName, 200, y);

  y += 14;
  doc.setFont('times', 'italic');
  doc.text('Plaintiff,', 310, y);

  // === -against- ===
  y += 18;
  doc.setFont('times', 'normal');
  doc.text('-against-', 200, y);

  // === SUMMONS WITH NOTICE ===
  doc.setFont('times', 'bold');
  doc.text('SUMMONS WITH NOTICE', 420, y - 10);

  // === Plaintiff/Defendant resides at ===
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('Plaintiff/Defendant resides at:', 420, y + 4);
  
  // Address lines with underlines
  let addrY = y + 18;
  doc.setFont('times', 'normal');
  for (let i = 0; i < 3; i++) {
    drawLine(420, addrY + 2, 560);
    if (qualifyingAddr[i]) {
      doc.text(qualifyingAddr[i], 424, addrY);
    }
    addrY += 14;
  }

  // === DEFENDANT NAME ===
  y += 44;
  doc.setFontSize(11);
  doc.text(defendantName, 200, y);

  y += 14;
  doc.setFont('times', 'italic');
  doc.text('Defendant.', 305, y);

  // === Closing dashed line ===
  y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('--------------------------------------------------------------------X', 72, y);

  // === ACTION FOR A DIVORCE ===
  y += 22;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('ACTION FOR A DIVORCE', 230, y);

  // === To the above named Defendant ===
  y += 18;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text('To the above named Defendant:', 72, y);

  // === YOU ARE HEREBY SUMMONED paragraph ===
  y += 16;
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('YOU ARE HEREBY SUMMONED', 90, y);
  doc.setFont('times', 'normal');
  doc.text('to serve a notice of appearance on the', 228, y);
  
  // Checkbox for Plaintiff
  drawCheckbox(410, y);
  doc.setFont('times', 'italic');
  doc.text('Plaintiff', 422, y);

  y += 11;
  doc.setFont('times', 'normal');
  doc.text('within twenty (20) days after the service of this summons, exclusive of the day of service (or within thirty (30)', 72, y);
  
  y += 11;
  doc.text('days after the service is complete if this summons is not personally delivered to you within the State of New', 72, y);
  
  y += 11;
  doc.text('York); and in case of your failure to appear, judgment will be taken against you by default for the relief', 72, y);
  
  y += 11;
  doc.text('demanded in the notice set forth below.', 72, y);

  // === DATED / SIGNATURE SECTION ===
  y += 22;
  doc.setFontSize(10);
  doc.text('Dated', 72, y);
  doc.text(today, 102, y);
  drawLine(100, y + 2, 200);

  // Plaintiff checkbox
  drawCheckbox(320, y);
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('Plaintiff', 332, y);

  // Signature line
  y += 18;
  drawLine(320, y + 2, 540);
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(plaintiffName, 380, y);

  // Phone
  y += 14;
  doc.setFontSize(9);
  doc.text('Phone No.:', 320, y);
  doc.text(data.plaintiffPhone || '', 375, y);

  // Address
  y += 12;
  doc.text('Address:', 320, y);
  
  y += 11;
  for (const line of mailingAddr.slice(0, 2)) {
    doc.text(line, 370, y);
    y += 11;
  }

  // === NOTICE SECTION ===
  y += 8;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('NOTICE:', 72, y);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('The nature of this action is to dissolve the marriage between the parties, on the', 115, y);

  y += 11;
  doc.text('grounds:', 115, y);
  doc.setFont('times', 'bold');
  doc.text('DRL §170 subd. 7', 158, y);
  doc.text('— irretrievable breakdown in relationship for a period of at least six months.', 248, y);

  y += 16;
  doc.setFont('times', 'normal');
  doc.text('The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage between', 72, y);
  
  y += 11;
  doc.text('the parties in this action.', 72, y);

  // === ANCILLARY RELIEF ===
  y += 16;
  doc.text('The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:', 72, y);

  y += 14;
  drawCheckbox(72, y);
  doc.setFont('times', 'bold');
  doc.text('NONE', 84, y);
  doc.setFont('times', 'normal');
  doc.text('— I am not requesting any ancillary relief;', 115, y);

  y += 14;
  doc.setFont('times', 'bold');
  doc.text('AND', 72, y);
  doc.setFont('times', 'normal');
  doc.text('any other relief the court deems fit and proper', 95, y);

  // === FOOTER ===
  doc.setFontSize(8);
  doc.text('(UD-1 Rev. 1/25/16)', 72, 770);

  return doc.output('arraybuffer');
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
    
    const pdfBuffer = generateUD1PDF(data);
    
    return new Response(pdfBuffer, {
      status: 200,
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
