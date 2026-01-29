// UD-1 (Summons with Notice) PDF Generator
// Clean layout matching official NYS form - no underlines except caption box

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

  // Parse address - keep it simple, one line or split by comma
  const qualifyingAddr = data.qualifyingAddress;
  const mailingAddr = data.plaintiffAddress;

  // Checkbox drawing - simple square with X
  const drawCheckbox = (x: number, y: number, checked: boolean = true) => {
    doc.setLineWidth(0.5);
    doc.rect(x, y - 6, 7, 7);
    if (checked) {
      doc.setFontSize(8);
      doc.text('X', x + 1.5, y);
    }
  };

  let y = 54;

  // ==================== HEADER SECTION ====================
  
  // Row 1: SUPREME COURT / Index No.
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('SUPREME COURT OF THE STATE OF NEW YORK', 72, y);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Index No.: _________________', 400, y);

  // Row 2: COUNTY OF / Date Summons filed
  y += 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('COUNTY OF ' + county, 72, y);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Date Summons filed: _________________', 400, y);

  // Row 3: Dashed line / Plaintiff designates
  y += 14;
  doc.setFontSize(10);
  doc.text('--------------------------------------------------------------------X', 72, y);
  doc.text('Plaintiff designates _________________', 400, y);

  // Row 4: County as place of trial
  y += 14;
  doc.text(county + ' County as the place of trial', 400, y);

  // Row 5: The basis of venue is
  y += 12;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('The basis of venue is:', 400, y);

  // Row 6: Venue party's address
  y += 11;
  doc.setFont('times', 'normal');
  doc.text(venueName + "'s", 400, y);
  y += 10;
  doc.text('address.', 400, y);

  // ==================== CAPTION - LEFT SIDE ====================
  
  // Plaintiff name (no underline)
  let captionY = 118;
  doc.setFontSize(11);
  doc.text(plaintiffName, 250, captionY);
  
  // "Plaintiff," label
  captionY += 18;
  doc.setFont('times', 'italic');
  doc.text('Plaintiff,', 310, captionY);

  // -against-
  captionY += 22;
  doc.setFont('times', 'normal');
  doc.text('-against-', 180, captionY);

  // Defendant name (no underline)
  captionY += 28;
  doc.text(defendantName, 250, captionY);

  // "Defendant." label
  captionY += 18;
  doc.setFont('times', 'italic');
  doc.text('Defendant.', 305, captionY);

  // Closing dashed line
  captionY += 14;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('--------------------------------------------------------------------X', 72, captionY);

  // ==================== CAPTION - RIGHT SIDE ====================
  
  // SUMMONS WITH NOTICE title (aligned with -against-)
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('SUMMONS WITH NOTICE', 420, 158);

  // Plaintiff/Defendant resides at:
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('Plaintiff/Defendant resides at:', 400, 172);

  // Address (no underlines, just the text)
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(qualifyingAddr, 400, 186);

  // ==================== ACTION FOR A DIVORCE ====================
  
  y = captionY + 24;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('ACTION FOR A DIVORCE', 220, y);

  // To the above named Defendant:
  y += 20;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text('To the above named Defendant:', 72, y);

  // ==================== YOU ARE HEREBY SUMMONED ====================
  
  y += 18;
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('YOU ARE HEREBY SUMMONED', 100, y);
  doc.setFont('times', 'normal');
  doc.text(' to serve a notice of appearance on the', 235, y);
  
  // Checkbox for Plaintiff
  drawCheckbox(430, y);
  doc.setFont('times', 'italic');
  doc.text(' Plaintiff', 440, y);

  y += 12;
  doc.setFont('times', 'normal');
  doc.text('within twenty (20) days after the service of this summons, exclusive of the day of service (or within', 72, y);
  
  y += 11;
  doc.text('thirty (30) days after the service is complete if this summons is not personally delivered to you within', 72, y);
  
  y += 11;
  doc.text('the State of New York); and in case of your failure to appear, judgment will be taken against you by', 72, y);
  
  y += 11;
  doc.text('default for the relief demanded in the notice set forth below.', 72, y);

  // ==================== DATED / SIGNATURE ====================
  
  y += 24;
  doc.setFontSize(10);
  doc.text('Dated ' + today, 72, y);

  // Plaintiff checkbox
  drawCheckbox(320, y);
  doc.setFont('times', 'italic');
  doc.text(' Plaintiff', 330, y);

  // Signature line with name
  y += 22;
  doc.setFont('times', 'normal');
  doc.text(plaintiffName, 320, y);

  // Phone
  y += 14;
  doc.setFontSize(9);
  doc.text('Phone No.: ' + (data.plaintiffPhone || ''), 320, y);

  // Address label and address
  y += 12;
  doc.text('Address: ' + mailingAddr, 320, y);

  // ==================== NOTICE SECTION ====================
  
  y += 24;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('NOTICE:', 72, y);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(' The nature of this action is to dissolve the marriage between the parties, on the', 110, y);

  y += 12;
  doc.text('grounds:  ', 72, y);
  doc.setFont('times', 'bold');
  doc.text('DRL §170 subd. 7 - irretrievable breakdown in relationship for a period of at least six months', 115, y);

  y += 16;
  doc.setFont('times', 'normal');
  doc.text('The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage', 72, y);
  
  y += 11;
  doc.text('between the parties in this action.', 72, y);

  // ==================== ANCILLARY RELIEF ====================
  
  y += 18;
  doc.text('The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:', 72, y);

  y += 16;
  drawCheckbox(72, y);
  doc.setFont('times', 'bold');
  doc.text(' NONE', 82, y);
  doc.setFont('times', 'normal');
  doc.text(' - I am not requesting any ancillary relief;', 110, y);

  y += 14;
  doc.setFont('times', 'bold');
  doc.text('AND', 72, y);
  doc.setFont('times', 'normal');
  doc.text(' any other relief the court deems fit and proper', 94, y);

  // ==================== FOOTER ====================
  
  doc.setFontSize(8);
  doc.text('(UD-1 Rev. 1/25/16)', 72, 760);

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
