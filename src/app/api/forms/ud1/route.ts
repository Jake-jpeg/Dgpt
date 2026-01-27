// UD-1 (Summons with Notice) Document Generator
// Generates a downloadable HTML document (can be printed/saved as PDF)

import { NextResponse } from 'next/server';

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffAddress: string;
}

const generateUD1HTML = (data: UD1Data): string => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const qualifyingPartyName = data.qualifyingParty === 'plaintiff' ? data.plaintiffName : data.defendantName;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>UD-1 Summons with Notice - ${data.plaintiffName} v. ${data.defendantName}</title>
  <style>
    @page { size: letter; margin: 1in; }
    body { 
      font-family: "Times New Roman", Times, serif; 
      font-size: 12pt; 
      line-height: 1.4;
      max-width: 6.5in;
      margin: 0 auto;
      padding: 20px;
    }
    .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
    .caption { display: flex; border: 1px solid black; margin: 20px 0; }
    .caption-left { flex: 1; padding: 15px; border-right: 1px solid black; }
    .caption-right { width: 250px; padding: 15px; font-size: 11pt; }
    .caption-line { border-top: 1px solid black; margin: 5px 0; }
    .party-name { font-weight: bold; margin: 10px 0; }
    .party-role { font-style: italic; }
    .versus { text-align: center; margin: 15px 0; }
    .section-title { font-weight: bold; text-align: center; margin: 25px 0 15px 0; }
    .to-defendant { font-style: italic; margin: 15px 0; }
    .main-text { text-align: justify; margin: 15px 0; }
    .dated { margin: 25px 0 15px 0; }
    .signature-block { margin-left: 50%; margin-top: 20px; }
    .signature-line { border-top: 1px solid black; width: 200px; margin-bottom: 5px; }
    .notice { margin-top: 30px; }
    .notice-label { font-weight: bold; }
    .underline-bold { font-weight: bold; text-decoration: underline; }
    .form-id { margin-top: 50px; font-size: 10pt; color: #666; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    SUPREME COURT OF THE STATE OF NEW YORK<br>
    COUNTY OF ${data.qualifyingCounty.toUpperCase()}
  </div>
  
  <div class="caption">
    <div class="caption-left">
      <div class="caption-line"></div>
      <div class="party-name">${data.plaintiffName}</div>
      <div class="party-role">Plaintiff,</div>
      <div class="versus">-against-</div>
      <div class="party-name">${data.defendantName}</div>
      <div class="party-role">Defendant.</div>
      <div class="caption-line"></div>
    </div>
    <div class="caption-right">
      Index No.: ______________<br><br>
      Date Summons Filed:<br>
      ${dateStr}<br><br>
      Plaintiff designates<br>
      <strong>${data.qualifyingCounty} County</strong><br>
      as the place of trial<br><br>
      The basis of the venue is<br>
      ${qualifyingPartyName}'s<br>
      address.<br><br>
      <div style="text-align: center; font-weight: bold; text-decoration: underline;">SUMMONS WITH NOTICE</div><br>
      ${qualifyingPartyName}<br>
      resides at:<br><br>
      ${data.qualifyingAddress}
    </div>
  </div>
  
  <div class="section-title">ACTION FOR A DIVORCE</div>
  
  <div class="to-defendant">To the above named Defendant:</div>
  
  <div class="main-text">
    YOU ARE HEREBY SUMMONED to serve a notice of appearance on the Plaintiff within twenty (20) days after the service of this summons, exclusive of the day of service (or within thirty (30) days after the service is complete if this summons is not personally delivered to you within the State of New York); and in case of your failure to appear, judgment will be taken against you by default for the relief demanded in the notice set forth below.
  </div>
  
  <div class="dated">Dated: ${dateStr}</div>
  
  <div class="signature-block">
    <div class="signature-line"></div>
    ${data.plaintiffName}<br>
    ${data.plaintiffAddress}
  </div>
  
  <div class="notice">
    <span class="notice-label">NOTICE:</span> The nature of this action is to dissolve the marriage between the parties, on the grounds: DRL §170 subd. 7 — <span class="underline-bold">irretrievable breakdown in relationship for a period of at least six months</span>.
  </div>
  
  <div class="main-text">
    The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage between the parties in this action.
  </div>
  
  <div class="main-text">
    The nature of any ancillary or additional relief requested is:
  </div>
  
  <div class="main-text">
    <strong>NONE</strong> — I am not requesting any ancillary relief.
  </div>
  
  <div class="form-id">UD-1 (Summons With Notice)</div>
</body>
</html>`;
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
    
    const html = generateUD1HTML(data);
    
    // Return as downloadable HTML file
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="UD-1_Summons_${data.plaintiffName.replace(/\s+/g, '_')}.html"`,
      },
    });
  } catch (error) {
    console.error('UD-1 generation error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
