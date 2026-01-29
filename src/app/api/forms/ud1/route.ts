// UD-1 (Summons with Notice) Document Generator
// Generates HTML styled to match official NYS UD-1 form
// User prints to PDF from browser

import { NextResponse } from 'next/server';

interface UD1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
}

const generateUD1HTML = (data: UD1Data): string => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const county = data.qualifyingCounty.toUpperCase();
  const qualifyingPartyName = data.qualifyingParty === 'plaintiff' ? data.plaintiffName : data.defendantName;
  
  // Split addresses for display
  const qualifyingAddrLines = data.qualifyingAddress.split(',').map(s => s.trim());
  const mailingAddrLines = data.plaintiffAddress.split(',').map(s => s.trim());
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>UD-1 Summons with Notice - ${data.plaintiffName} v. ${data.defendantName}</title>
  <style>
    @page { 
      size: letter; 
      margin: 0.75in 0.75in 0.5in 0.75in; 
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: "Times New Roman", Times, serif; 
      font-size: 11pt; 
      line-height: 1.3;
      color: #000;
      padding: 20px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .header-left { width: 55%; }
    .header-right { width: 42%; font-size: 10pt; }
    .court-title { font-weight: bold; font-size: 12pt; }
    .county-line { font-weight: bold; font-size: 12pt; margin-top: 2px; }
    .county-name { font-weight: normal; border-bottom: 1px solid #000; padding: 0 10px; }
    .underline { border-bottom: 1px solid #000; display: inline-block; min-width: 120px; }
    .dashed-line { margin: 8px 0; font-size: 10pt; }
    
    .caption-area {
      display: flex;
      margin: 10px 0;
    }
    .caption-left { width: 55%; padding-right: 20px; }
    .caption-right { width: 42%; font-size: 10pt; }
    
    .party-block { margin: 15px 0; }
    .party-name { 
      border-bottom: 1px solid #000; 
      min-height: 20px; 
      margin-bottom: 3px;
      padding-left: 120px;
    }
    .party-label { font-style: italic; text-align: right; padding-right: 30px; }
    .versus { text-align: center; margin: 15px 0; }
    
    .summons-title { 
      font-weight: bold; 
      text-align: center; 
      font-size: 11pt;
      margin: 10px 0;
    }
    .addr-label { font-style: italic; font-size: 10pt; }
    .addr-line { 
      border-bottom: 1px solid #000; 
      min-height: 16px; 
      margin: 3px 0;
      font-size: 10pt;
    }
    
    .action-title {
      font-weight: bold;
      font-size: 13pt;
      text-align: center;
      margin: 20px 0 15px 0;
    }
    .to-defendant { font-style: italic; margin-bottom: 12px; }
    
    .summoned-para { 
      text-align: justify; 
      margin-bottom: 15px;
      font-size: 10pt;
    }
    .summoned-bold { font-weight: bold; }
    
    .checkbox { 
      display: inline-block; 
      width: 10px; 
      height: 10px; 
      border: 1px solid #000; 
      margin-right: 3px;
      position: relative;
      top: 1px;
    }
    .checkbox.checked::after {
      content: "✓";
      position: absolute;
      top: -3px;
      left: 1px;
      font-size: 10px;
    }
    
    .dated-section {
      display: flex;
      margin: 20px 0;
    }
    .dated-left { width: 45%; }
    .dated-right { width: 55%; }
    
    .signature-area { margin-top: 15px; }
    .sig-line { border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 3px; }
    .sig-label { font-size: 10pt; }
    
    .notice-section { margin-top: 20px; font-size: 10pt; }
    .notice-label { font-weight: bold; }
    .grounds-text { font-weight: bold; }
    
    .ancillary-section { margin-top: 15px; font-size: 10pt; }
    
    .footer { 
      margin-top: 30px; 
      font-size: 9pt; 
      color: #333;
    }
  </style>
</head>
<body>
  <!-- Header Row 1 -->
  <div class="header-row">
    <div class="header-left">
      <div class="court-title">SUPREME COURT OF THE STATE OF NEW YORK</div>
    </div>
    <div class="header-right">
      Index No.: <span class="underline"></span>
    </div>
  </div>
  
  <!-- Header Row 2 -->
  <div class="header-row">
    <div class="header-left">
      <div class="county-line">COUNTY OF <span class="county-name">${county}</span></div>
    </div>
    <div class="header-right">
      Date Summons filed: <span class="underline"></span>
    </div>
  </div>
  
  <!-- Header Row 3 -->
  <div class="header-row">
    <div class="header-left">
      <div class="dashed-line">--------------------------------------------------------------------X</div>
    </div>
    <div class="header-right">
      Plaintiff designates <span class="underline"></span>
    </div>
  </div>
  
  <!-- Header Row 4 -->
  <div class="header-row">
    <div class="header-left"></div>
    <div class="header-right">
      ${county} County as the place of trial
    </div>
  </div>
  
  <!-- Header Row 5 -->
  <div class="header-row">
    <div class="header-left"></div>
    <div class="header-right">
      <em>The basis of venue is:</em>
    </div>
  </div>
  
  <!-- Header Row 6 -->
  <div class="header-row">
    <div class="header-left"></div>
    <div class="header-right">
      ${qualifyingPartyName}'s<br>address.
    </div>
  </div>
  
  <!-- Caption Area -->
  <div class="caption-area">
    <div class="caption-left">
      <div class="party-block">
        <div class="party-name">${data.plaintiffName}</div>
        <div class="party-label">Plaintiff,</div>
      </div>
      
      <div class="versus">-against-</div>
      
      <div class="party-block">
        <div class="party-name">${data.defendantName}</div>
        <div class="party-label">Defendant.</div>
      </div>
      
      <div class="dashed-line">--------------------------------------------------------------------X</div>
    </div>
    
    <div class="caption-right">
      <div class="summons-title">SUMMONS WITH NOTICE</div>
      <div class="addr-label">Plaintiff/Defendant resides at:</div>
      <div class="addr-line">${qualifyingAddrLines[0] || ''}</div>
      <div class="addr-line">${qualifyingAddrLines[1] || ''}</div>
      <div class="addr-line">${qualifyingAddrLines.slice(2).join(', ') || ''}</div>
    </div>
  </div>
  
  <!-- Action Title -->
  <div class="action-title">ACTION FOR A DIVORCE</div>
  
  <!-- To Defendant -->
  <div class="to-defendant">To the above named Defendant:</div>
  
  <!-- Summoned Paragraph -->
  <div class="summoned-para">
    <span class="summoned-bold">YOU ARE HEREBY SUMMONED</span> to serve a notice of appearance on the 
    <span class="checkbox checked"></span> <em>Plaintiff</em>
    within twenty (20) days after the service of this summons, exclusive of the day of service (or within 
    thirty (30) days after the service is complete if this summons is not personally delivered to you within 
    the State of New York); and in case of your failure to appear, judgment will be taken against you by 
    default for the relief demanded in the notice set forth below.
  </div>
  
  <!-- Dated Section -->
  <div class="dated-section">
    <div class="dated-left">
      Dated <span class="underline" style="min-width: 150px;">${dateStr}</span>
    </div>
    <div class="dated-right">
      <span class="checkbox checked"></span> <em>Plaintiff</em>
    </div>
  </div>
  
  <!-- Signature Area -->
  <div class="signature-area" style="margin-left: 45%;">
    <div class="sig-line">${data.plaintiffName}</div>
    <div class="sig-label">Phone No.: ${data.plaintiffPhone}</div>
    <div class="sig-label">Address:</div>
    <div class="sig-label" style="padding-left: 20px;">${mailingAddrLines[0] || ''}</div>
    <div class="sig-label" style="padding-left: 20px;">${mailingAddrLines.slice(1).join(', ') || ''}</div>
  </div>
  
  <!-- Notice Section -->
  <div class="notice-section">
    <span class="notice-label">NOTICE:</span> The nature of this action is to dissolve the marriage between the parties, on the<br>
    grounds: <span class="grounds-text">DRL §170 subd. 7 — irretrievable breakdown in relationship for a period of at least six months.</span>
  </div>
  
  <div class="notice-section">
    The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage 
    between the parties in this action.
  </div>
  
  <!-- Ancillary Relief Section -->
  <div class="ancillary-section">
    The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:
  </div>
  
  <div class="ancillary-section">
    <span class="checkbox checked"></span> <strong>NONE</strong> — I am not requesting any ancillary relief;
  </div>
  
  <div class="ancillary-section">
    <strong>AND</strong> any other relief the court deems fit and proper
  </div>
  
  <!-- Footer -->
  <div class="footer">(UD-1 Rev. 1/25/16)</div>
  
  <script>
    // Auto-trigger print dialog
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
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

    // Default phone if not provided
    if (!data.plaintiffPhone) {
      data.plaintiffPhone = '';
    }
    
    const html = generateUD1HTML(data);
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('UD-1 generation error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
