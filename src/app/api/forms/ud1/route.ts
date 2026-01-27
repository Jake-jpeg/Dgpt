// UD-1 (Summons with Notice) Document Generator

import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
         AlignmentType, BorderStyle, WidthType, VerticalAlign } from 'docx';

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffAddress: string;
}

const createUD1Document = (data: UD1Data): Document => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const qualifyingPartyName = data.qualifyingParty === 'plaintiff' ? data.plaintiffName : data.defendantName;
  
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 }, // 12pt
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
        },
      },
      children: [
        // Court Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'SUPREME COURT OF THE STATE OF NEW YORK', bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `COUNTY OF ${data.qualifyingCounty.toUpperCase()}`, bold: true, size: 24 }),
          ],
        }),
        
        // Caption Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [5500, 3860],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 5500, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: '─'.repeat(30), size: 20 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: data.plaintiffName, bold: true, size: 24 })],
                    }),
                    new Paragraph({
                      spacing: { before: 100 },
                      children: [new TextRun({ text: 'Plaintiff,', italics: true, size: 24 })],
                    }),
                    new Paragraph({
                      spacing: { before: 200 },
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: '-against-', size: 24 })],
                    }),
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [new TextRun({ text: data.defendantName, bold: true, size: 24 })],
                    }),
                    new Paragraph({
                      spacing: { before: 100 },
                      children: [new TextRun({ text: 'Defendant.', italics: true, size: 24 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: '─'.repeat(30), size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders,
                  width: { size: 3860, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'Index No.: ______________', size: 22 })],
                    }),
                    new Paragraph({
                      spacing: { before: 150 },
                      children: [new TextRun({ text: `Date Summons Filed:`, size: 22 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `${dateStr}`, size: 22 })],
                    }),
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [new TextRun({ text: `Plaintiff designates`, size: 22 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `${data.qualifyingCounty} County`, bold: true, size: 22 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `as the place of trial`, size: 22 })],
                    }),
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [new TextRun({ text: `The basis of the venue is`, size: 22 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `${qualifyingPartyName}&#x2019;s`, size: 22 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `address.`, size: 22 })],
                    }),
                    new Paragraph({
                      spacing: { before: 200 },
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'SUMMONS WITH NOTICE', bold: true, underline: {}, size: 24 })],
                    }),
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [new TextRun({ text: `${qualifyingPartyName}`, size: 22 })],
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `resides at:`, size: 22 })],
                    }),
                    new Paragraph({
                      spacing: { before: 100 },
                      children: [new TextRun({ text: data.qualifyingAddress, size: 22 })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        // Action Title
        new Paragraph({
          spacing: { before: 400 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'ACTION FOR A DIVORCE', bold: true, size: 24 })],
        }),
        
        // To Defendant
        new Paragraph({
          spacing: { before: 300 },
          children: [new TextRun({ text: 'To the above named Defendant:', italics: true, size: 24 })],
        }),
        
        // Main Text
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ 
              text: 'YOU ARE HEREBY SUMMONED to serve a notice of appearance on the Plaintiff within twenty (20) days after the service of this summons, exclusive of the day of service (or within thirty (30) days after the service is complete if this summons is not personally delivered to you within the State of New York); and in case of your failure to appear, judgment will be taken against you by default for the relief demanded in the notice set forth below.',
              size: 24,
            }),
          ],
        }),
        
        // Dated
        new Paragraph({
          spacing: { before: 300 },
          children: [new TextRun({ text: `Dated: ${dateStr}`, size: 24 })],
        }),
        
        // Plaintiff Signature Block
        new Paragraph({
          spacing: { before: 200, left: 4320 }, // Indent right
          children: [new TextRun({ text: '________________________________', size: 24 })],
        }),
        new Paragraph({
          indent: { left: 4320 },
          children: [new TextRun({ text: data.plaintiffName, size: 24 })],
        }),
        new Paragraph({
          indent: { left: 4320 },
          children: [new TextRun({ text: data.plaintiffAddress, size: 22 })],
        }),
        
        // Notice Section
        new Paragraph({
          spacing: { before: 400 },
          children: [
            new TextRun({ text: 'NOTICE: ', bold: true, size: 24 }),
            new TextRun({ 
              text: 'The nature of this action is to dissolve the marriage between the parties, on the grounds: DRL §170 subd. 7 — ',
              size: 24,
            }),
            new TextRun({ 
              text: 'irretrievable breakdown in relationship for a period of at least six months',
              bold: true,
              underline: {},
              size: 24,
            }),
            new TextRun({ text: '.', size: 24 }),
          ],
        }),
        
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ 
              text: 'The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage between the parties in this action.',
              size: 24,
            }),
          ],
        }),
        
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ 
              text: 'The nature of any ancillary or additional relief requested is:',
              size: 24,
            }),
          ],
        }),
        
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ text: 'NONE', bold: true, size: 24 }),
            new TextRun({ text: ' — I am not requesting any ancillary relief.', size: 24 }),
          ],
        }),
        
        // Form ID Footer
        new Paragraph({
          spacing: { before: 600 },
          children: [new TextRun({ text: 'UD-1 (Summons With Notice)', size: 18, color: '666666' })],
        }),
      ],
    }],
  });
};

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
    
    const doc = createUD1Document(data);
    const buffer = await Packer.toBuffer(doc);
    
    // Return as downloadable DOCX
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="UD-1_Summons_${data.plaintiffName.replace(/\s+/g, '_')}.docx"`,
      },
    });
  } catch (error) {
    console.error('UD-1 generation error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
