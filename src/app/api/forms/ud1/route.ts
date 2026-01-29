// UD-1 (Summons with Notice) PDF Generator
// Generates official NYS UD-1 form (Rev. 1/25/16)
// NO red reference numbers, Pro Se only, DRL §170(7) pre-filled

import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y: number, x2: number) {
  doc.moveTo(x1, y).lineTo(x2, y).stroke();
}

function drawCheckbox(doc: PDFKit.PDFDocument, x: number, y: number, checked: boolean = false) {
  doc.rect(x, y, 8, 8).stroke();
  if (checked) {
    doc.fontSize(8).text('✓', x + 1, y - 1, { width: 8 });
  }
}

async function generateUD1PDF(data: UD1Data): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 72, right: 36 }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const county = data.qualifyingCounty.toUpperCase();
    const plaintiffName = data.plaintiffName;
    const defendantName = data.defendantName;
    const qualifying = data.qualifyingParty;
    const venueName = qualifying === 'plaintiff' ? plaintiffName : defendantName;

    const today = new Date().toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });

    let y = 50;

    // ===== HEADER ROW 1 =====
    doc.font('Times-Bold').fontSize(12);
    doc.text('SUPREME COURT OF THE STATE OF NEW YORK', 72, y);
    
    doc.font('Times-Roman').fontSize(11);
    doc.text('Index No.:', 400, y);
    drawLine(doc, 452, y + 12, 576);

    // ===== HEADER ROW 2 =====
    y += 14;
    doc.font('Times-Bold').fontSize(12);
    doc.text('COUNTY OF', 72, y);
    doc.font('Times-Roman');
    doc.text(county, 140, y);
    drawLine(doc, 138, y + 12, 240);
    
    doc.fontSize(11);
    doc.text('Date Summons filed:', 400, y);
    drawLine(doc, 500, y + 12, 576);

    // ===== HEADER ROW 3 =====
    y += 14;
    doc.font('Times-Roman').fontSize(12);
    doc.text('-'.repeat(56) + 'X', 72, y);
    
    doc.fontSize(11);
    doc.text('Plaintiff designates', 400, y);
    drawLine(doc, 492, y + 12, 576);

    // ===== HEADER ROW 4 =====
    y += 14;
    doc.text(`${county} County as the place of trial`, 400, y);

    // ===== HEADER ROW 5 =====
    y += 14;
    doc.font('Times-Italic').fontSize(10);
    doc.text('The basis of venue is:', 400, y);

    // ===== HEADER ROW 6 =====
    y += 12;
    doc.font('Times-Roman').fontSize(10);
    doc.text(`${venueName}'s`, 400, y);
    y += 12;
    doc.text('address.', 400, y);

    // ===== SUMMONS WITH NOTICE =====
    y += 18;
    doc.font('Times-Bold').fontSize(11);
    doc.text('SUMMONS WITH NOTICE', 400, y, { width: 176, align: 'center' });

    y += 14;
    doc.font('Times-Italic').fontSize(10);
    doc.text('Plaintiff/Defendant resides at:', 400, y);

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

    doc.font('Times-Roman').fontSize(11);
    for (const line of addrLines) {
      y += 14;
      drawLine(doc, 400, y + 10, 576);
      if (line) doc.text(line, 404, y);
    }

    // ===== PLAINTIFF NAME =====
    let yLeft = 160;
    drawLine(doc, 72, yLeft + 12, 350);
    doc.font('Times-Roman').fontSize(12);
    doc.text(plaintiffName, 180, yLeft);

    yLeft += 18;
    doc.font('Times-Italic');
    doc.text('Plaintiff,', 300, yLeft, { width: 50, align: 'right' });

    yLeft += 20;
    doc.font('Times-Roman');
    doc.text('-against-', 180, yLeft);

    // ===== DEFENDANT NAME =====
    yLeft += 30;
    drawLine(doc, 72, yLeft + 12, 350);
    doc.text(defendantName, 180, yLeft);

    yLeft += 18;
    doc.font('Times-Italic');
    doc.text('Defendant.', 290, yLeft, { width: 60, align: 'right' });

    yLeft += 8;
    doc.font('Times-Roman');
    doc.text('-'.repeat(56) + 'X', 72, yLeft);

    // ===== ACTION FOR A DIVORCE =====
    yLeft += 26;
    doc.font('Times-Bold').fontSize(14);
    doc.text('ACTION FOR A DIVORCE', 72, yLeft, { width: 468, align: 'center' });

    yLeft += 22;
    doc.font('Times-Italic').fontSize(11);
    doc.text('To the above named Defendant:', 72, yLeft);

    // ===== YOU ARE HEREBY SUMMONED =====
    yLeft += 18;
    doc.font('Times-Bold').fontSize(10);
    doc.text('YOU ARE HEREBY SUMMONED', 100, yLeft, { continued: true });
    doc.font('Times-Roman');
    doc.text(' to serve a notice of appearance on the', { continued: false });

    // Plaintiff checkbox (checked)
    drawCheckbox(doc, 468, yLeft - 1, true);
    doc.font('Times-Italic').fontSize(10);
    doc.text('Plaintiff', 479, yLeft);

    yLeft += 12;
    doc.font('Times-Roman').fontSize(10);
    doc.text('within twenty (20) days after the service of this summons, exclusive of the day of service (or within', 72, yLeft);

    yLeft += 12;
    doc.text('thirty (30) days after the service is complete if this summons is not personally delivered to you within', 72, yLeft);

    yLeft += 12;
    doc.text('the State of New York); and in case of your failure to appear, judgment will be taken against you by', 72, yLeft);

    yLeft += 12;
    doc.text('default for the relief demanded in the notice set forth below.', 72, yLeft);

    // ===== DATED / SIGNATURE =====
    yLeft += 26;
    doc.font('Times-Roman').fontSize(11);
    doc.text('Dated', 72, yLeft);
    doc.text(today, 103, yLeft);
    drawLine(doc, 100, yLeft + 12, 220);

    // Plaintiff checkbox (checked)
    drawCheckbox(doc, 300, yLeft - 1, true);
    doc.font('Times-Italic').fontSize(10);
    doc.text('Plaintiff', 311, yLeft);

    yLeft += 20;
    drawLine(doc, 300, yLeft + 12, 540);
    doc.font('Times-Roman').fontSize(11);
    doc.text(plaintiffName, 380, yLeft);

    yLeft += 16;
    doc.text('Phone No.:', 300, yLeft);
    doc.text(data.plaintiffPhone || '', 355, yLeft);

    yLeft += 14;
    doc.text('Address:', 300, yLeft);

    // Mailing address
    const mailParts = data.plaintiffAddress.split(',').map(p => p.trim());
    yLeft += 12;
    for (const part of mailParts.slice(0, 3)) {
      doc.text(part, 355, yLeft);
      yLeft += 12;
    }

    // ===== NOTICE SECTION =====
    yLeft += 10;
    doc.font('Times-Bold').fontSize(11);
    doc.text('NOTICE:', 72, yLeft, { continued: true });
    doc.font('Times-Roman').fontSize(10);
    doc.text(' The nature of this action is to dissolve the marriage between the parties, on the', { continued: false });

    yLeft += 12;
    doc.text('grounds:', 118, yLeft, { continued: true });
    doc.font('Times-Bold');
    doc.text(' DRL §170 subd. 7', { continued: true });
    doc.font('Times-Roman');
    doc.text(' —', { continued: true });
    doc.font('Times-Bold');
    doc.text('irretrievable breakdown in relationship for a period of', { continued: false });

    yLeft += 12;
    doc.text('at least six months.', 118, yLeft);

    yLeft += 18;
    doc.font('Times-Roman').fontSize(10);
    doc.text('The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage', 72, yLeft);

    yLeft += 12;
    doc.text('between the parties in this action.', 72, yLeft);

    // ===== ANCILLARY RELIEF =====
    yLeft += 18;
    doc.text('The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:', 72, yLeft);

    yLeft += 16;
    drawCheckbox(doc, 72, yLeft - 1, true);
    doc.font('Times-Bold').fontSize(10);
    doc.text('NONE', 84, yLeft, { continued: true });
    doc.font('Times-Roman');
    doc.text(' — I am not requesting any ancillary relief;', { continued: false });

    yLeft += 14;
    doc.font('Times-Bold');
    doc.text('AND', 72, yLeft, { continued: true });
    doc.font('Times-Roman');
    doc.text(' any other relief the court deems fit and proper', { continued: false });

    // ===== FOOTER =====
    doc.font('Times-Roman').fontSize(9);
    doc.text('(UD-1 Rev. 1/25/16)', 72, 756);

    doc.end();
  });
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
    
    const pdfBuffer = await generateUD1PDF(data);
    
    return new NextResponse(pdfBuffer, {
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
