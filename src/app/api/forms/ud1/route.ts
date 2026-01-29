// UD-1 (Summons with Notice) PDF Generator
// Uses embedded template + pdf-lib to overlay user data
// This approach guarantees correct layout

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

// Base64 encoded blank UD-1 template (created with reportlab, exact court format)
const UD1_TEMPLATE_BASE64 = `JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgaHR0cDovL3d3dy5yZXBvcnRsYWIuY29tCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIgL0Y0IDUgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0Jhc2VGb250IC9UaW1lcy1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9UaW1lcy1Sb21hbiAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjMgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9CYXNlRm9udCAvVGltZXMtSXRhbGljIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GNCAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0NvbnRlbnRzIDEwIDAgUiAvTWVkaWFCb3ggWyAwIDAgNjEyIDc5MiBdIC9QYXJlbnQgOSAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNyAwIG9iago8PAovUGFnZU1vZGUgL1VzZU5vbmUgL1BhZ2VzIDkgMCBSIC9UeXBlIC9DYXRhbG9nCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9BdXRob3IgKGFub255bW91cykgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDEyOTA1MTgxMiswMCcwMCcpIC9DcmVhdG9yIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSB3d3cucmVwb3J0bGFiLmNvbSkgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwMTI5MDUxODEyKzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSB3d3cucmVwb3J0bGFiLmNvbSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyA2IDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTU1OQo+PgpzdHJlYW0KR2F1MENnTVoiQSY6TDFTVzQsSyVKYlRgITQ+REM4Qkk9QEJaYTVkPUJsRi87Wi8nNiolRVtMR0ZnaihOPUFITl8lOHBfUXBTaCojO2hZWXJJVmV0NFIvaFVGaVZNKzBnT1g7SVtiKDNxcXVPXylNblxZMUQ8cSg6Z0giLSIkXSdmRio9cSUnaSp1RVQwSEshXGlGX1g/JTpPOGJpUz4mV0A2WWEzMEI7ImVHYV8+K1w6aj5mS1lObEMwJWNKRVk1bjp1WCRlJismVWYzYkRnc285QmAjJTZQKElWUXBEY2A+biFMLW1BdE5aJz1ySkpjTzJFPlVnNmM3SzBIXzZlPWU2bSRRKj1eUE5OL0JCNHJXZjBSLFYsZlsqRl1rQmE8P2NsVGIxQVgwSV8+blY8TDkxaDNSJDZyXkk3TUQhKCUtZS9PbGkkO1dXYiI4LW1iOyVdLkgoKURKT2NYRS5DaCdjSF5mUVUoN2NPMSc0bTZUTlg1MG1pKzdyNl02QS9NUmFlWE9CZDU3YzpqT2EhKmVBKk1uNi5gcE4tNiF1VTlLTTthTSc+Nl5Dbko9Oz0wOFhlNlArS1wxTj9FV2I4TGYwNjVFIV9bRSc3UEFDYyY7OztYNGUkLGwzI3JkSFZvXzlZdScjTkpCOFxmIUQhTzI8QGJXLSU5TTVaXWUlOD1CUUtNLipAYWFqMEpMOzYyPjxIXFEmO0c4QldYSEhuMCFyUC50RSMyLko2Szt1XkglZUI/ZzFcPlYmZDo8WnBQOj8tNDBgI2lHWGJxLzQtYEFsNSJoOEZ1WkpbZU8uN24xVUFUWjNBbSpvVWw8V1RXO2xJNGYrcVU2VkMlQiUsNDpMSyZoMywkZV8lUCRLPjBCNDFTNV9dRD5TaFxea0FAblsrT0FwWCRQbyZXI2ooWEdQXShjbTBXJllsMFtYMSdkYjUxXWtWOkRtXEkzOildUEBgaTZuZWZqOG9vLSdBPWdoYyZlPUovP1JwUy8rciI6NEVNTThnZlc2ZFAnJkxnJXQwMiVDPWU2RSQmPWlTIV9dQWFFJiNNJXFwXyMvY2wwR1lTdWxoVnFPKV5bQnJbdFlgPz40UTJDO2svTCwvUDVVRDFDNzg4LFlwdU9eWiM2TU9nO2IoYCwqM1pyODA5ckdRZ0lZR0dbaGBIOVMzUUdpSV8uSWVhRkQpP0dTOThZZ2ZnUTM9OHBNZlVFXFp0dWMtJEBfKmEzbDEjKU5BdVhyNHNTQjFLZ0hxP184VTIiRWUxOjU3PEN1aDMuaHIpJkpPQGk8QVFIdEcjXCczW3U0RlY8NTRpPE9ASUlnOWghNkg0NjhYPVNiSXBRN2FMYEhvU0A5JzYoQFAnQ0VIPlFvdUpSLl07UD8rY1dtJS0kWyh0KFM3TzJCQERjJT9JUWRUS0tcSjpjbEM0SlArYlIybUZwJGN0Uj08RSlnVTpJXD01KyQ2PDJxUF0vUF9UTDZgbjZWWE9OJXRhXmFbWDxAUzplXC1mP1hUOm1ZT2VDO2cxTGw+MjFLSlMmUyI7O0xVaG8nT2VFO1BObSFgOTNccSdFZ2FxPyxsP2Y8Sz5PT25nMjlAcywyMCNzaVFeVUg+YztPZ3EoRjNUQnA4PEJpQUU7NkolTmdaZ0M3OGgoWz1bLiVdPjtoQF5sZmFGSUFBPUkxaFFjYkhGLnE7Z0BUQixmb1BIITJ0QStNM2QkXUsrZDNZSlw8KEo8N1ZlLWlvT1c5X1A4Q2JpbFVvcF9JLi08SkZSTUd0TCotbkN1WCQ5aiFLWGJ0Z1YuO21gJCZxdT5PUy5saC0tdDNPVWAvIU9ecUtHW1wkNChDXFVyXUhuYjZmOjJUYnJZbFBFQGcyaFFHMG40LzYpWms7M19lUF0zTyZlTEojJylAc0kjSzRBLkcpUm5TXkUhby0jJmo7b3FhJlBtbEw8MFNcPjllU0gnI2I0MisjZERaRSVzPGw8Qk41VktmQz5KKCElJE49R0BLQi1ML1dgVlQ3SW1FOXMkNzFMNFJoZisrZWUpQytqM2EkSW4nLkdfREpeMzlFaTQuJ0JINWYmZTohNTxbbkosfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNzMgMDAwMDAgbiAKMDAwMDAwMDEzNCAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDAzNDkgMDAwMDAgbiAKMDAwMDAwMDQ1OCAwMDAwMCBuIAowMDAwMDAwNTY4IDAwMDAwIG4gCjAwMDAwMDA3NjIgMDAwMDAgbiAKMDAwMDAwMDgzMCAwMDAwMCBuIAowMDAwMDAxMTI2IDAwMDAwIG4gCjAwMDAwMDExODUgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8Y2NmZDM1NGQyODM0MjhhODU4ZTliMWQ3M2VlNDQ5ZDM+PGNjZmQzNTRkMjgzNDI4YTg1OGU5YjFkNzNlZTQ0OWQzPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKGh0dHA6Ly93d3cucmVwb3J0bGFiLmNvbSkKCi9JbmZvIDggMCBSCi9Sb290IDcgMCBSCi9TaXplIDExCj4+CnN0YXJ0eHJlZgoyODM2CiUlRU9GCg==`;

async function generateUD1PDF(data: UD1Data): Promise<Uint8Array> {
  // Load the template - use Buffer for Node.js compatibility
  const templateBytes = Buffer.from(UD1_TEMPLATE_BASE64, 'base64');
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  // Get the first page
  const pages = pdfDoc.getPages();
  const page = pages[0];
  
  // Embed font for user data
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const black = rgb(0, 0, 0);
  
  // Extract data
  const county = data.qualifyingCounty.toUpperCase();
  const plaintiff = data.plaintiffName;
  const defendant = data.defendantName;
  const qualifying = data.qualifyingParty;
  const venueName = qualifying === 'plaintiff' ? plaintiff : defendant;
  const qualifyingAddr = data.qualifyingAddress;
  const phone = data.plaintiffPhone || '';
  const mailingAddr = data.plaintiffAddress;
  
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  });

  // Split address into lines
  const addrParts = qualifyingAddr.split(',').map(p => p.trim());
  
  // Draw user data at specific coordinates (y from bottom)
  // COUNTY NAME (after "COUNTY OF")
  page.drawText(county, { x: 145, y: 730, size: 11, font: timesBold, color: black });
  
  // COUNTY (place of trial, before "County as the place of trial")
  page.drawText(county, { x: 460, y: 716, size: 10, font: timesRoman, color: black });
  
  // VENUE PARTY NAME (before "'s")
  page.drawText(venueName, { x: 460, y: 678, size: 9, font: timesRoman, color: black });
  
  // PLAINTIFF NAME (caption)
  page.drawText(plaintiff, { x: 180, y: 680, size: 11, font: timesRoman, color: black });
  
  // DEFENDANT NAME (caption)  
  page.drawText(defendant, { x: 180, y: 610, size: 11, font: timesRoman, color: black });
  
  // ADDRESS LINES (right side)
  let addrY = 618;
  for (let i = 0; i < Math.min(addrParts.length, 3); i++) {
    page.drawText(addrParts[i], { x: 404, y: addrY, size: 9, font: timesRoman, color: black });
    addrY -= 12;
  }
  
  // DATE
  page.drawText(today, { x: 105, y: 437, size: 10, font: timesRoman, color: black });
  
  // SIGNATURE (plaintiff name)
  page.drawText(plaintiff, { x: 380, y: 421, size: 10, font: timesRoman, color: black });
  
  // PHONE
  page.drawText(phone, { x: 358, y: 405, size: 9, font: timesRoman, color: black });
  
  // MAILING ADDRESS
  page.drawText(mailingAddr, { x: 348, y: 393, size: 9, font: timesRoman, color: black });
  
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
    
    return new Response(pdfBytes, {
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
