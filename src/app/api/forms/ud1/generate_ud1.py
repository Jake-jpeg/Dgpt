#!/usr/bin/env python3
"""
DivorceGPT UD-1 Generator
Generates a pixel-perfect NYS UD-1 (Summons with Notice) form
Based on official NYS form (UD-1 Rev. 1/25/16)

CLEAN VERSION:
- NO red reference numbers
- NO Attorney options (pro se only)
- Pre-filled: DRL §170(7) and "NONE" ancillary relief
"""

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

PAGE_WIDTH, PAGE_HEIGHT = letter  # 612 x 792 points


def draw_line(c, x1, y, x2):
    """Draw a horizontal line"""
    c.line(x1, y, x2, y)


def generate_ud1(data, output_path):
    """
    Generate UD-1 form with provided data
    
    Required data:
    - plaintiffName: str
    - defendantName: str  
    - county: str (e.g., "Orange")
    - qualifyingParty: "plaintiff" or "defendant"
    - qualifyingAddress: str (full address with ZIP)
    - plaintiffPhone: str
    - plaintiffAddress: str (mailing address)
    """
    
    c = canvas.Canvas(output_path, pagesize=letter)
    county = data.get('county', '').upper()
    plaintiff_name = data.get('plaintiffName', '')
    defendant_name = data.get('defendantName', '')
    qualifying = data.get('qualifyingParty', 'plaintiff')
    
    # ===================================================================
    # ROW 1: SUPREME COURT / Index No.
    # ===================================================================
    
    y = 752
    c.setFont("Times-Bold", 12)
    c.drawString(72, y, "SUPREME COURT OF THE STATE OF NEW YORK")
    
    c.setFont("Times-Roman", 11)
    c.drawString(400, y, "Index No.:")
    draw_line(c, 452, y - 2, 576)
    
    # ===================================================================
    # ROW 2: COUNTY OF / Date Summons filed
    # ===================================================================
    
    y -= 14
    c.setFont("Times-Bold", 12)
    c.drawString(72, y, "COUNTY OF")
    c.setFont("Times-Roman", 12)
    c.drawString(140, y, county)
    draw_line(c, 138, y - 2, 240)
    
    c.setFont("Times-Roman", 11)
    c.drawString(400, y, "Date Summons filed:")
    draw_line(c, 500, y - 2, 576)
    
    # ===================================================================
    # ROW 3: Dashed line / Plaintiff designates
    # ===================================================================
    
    y -= 14
    c.setFont("Times-Roman", 12)
    c.drawString(72, y, "-" * 56 + "X")
    
    c.setFont("Times-Roman", 11)
    c.drawString(400, y, "Plaintiff designates")
    draw_line(c, 492, y - 2, 576)
    
    # ===================================================================
    # ROW 4: (blank left) / [County] County as the place of trial
    # ===================================================================
    
    y -= 14
    c.drawString(400, y, f"{county} County as the place of trial")
    
    # ===================================================================
    # ROW 5: (blank left) / The basis of venue is:
    # ===================================================================
    
    y -= 14
    c.setFont("Times-Italic", 10)
    c.drawString(400, y, "The basis of venue is:")
    
    # ===================================================================
    # ROW 6: (blank left) / [Name]'s address
    # ===================================================================
    
    y -= 12
    c.setFont("Times-Roman", 10)
    if qualifying == 'plaintiff':
        venue_name = plaintiff_name
    else:
        venue_name = defendant_name
    c.drawString(400, y, f"{venue_name}'s")
    
    y -= 12
    c.drawString(400, y, "address.")
    
    # ===================================================================
    # SUMMONS WITH NOTICE (right side) - positioned after venue
    # ===================================================================
    
    y -= 18
    c.setFont("Times-Bold", 11)
    c.drawCentredString(488, y, "SUMMONS WITH NOTICE")
    
    y_right = y - 14
    c.setFont("Times-Italic", 10)
    c.drawString(400, y_right, "Plaintiff/Defendant resides at:")
    
    # ===================================================================
    # ADDRESS LINES (3 lines)
    # ===================================================================
    
    address = data.get('qualifyingAddress', '')
    # Split address into parts
    if ',' in address:
        parts = [p.strip() for p in address.split(',')]
        if len(parts) >= 3:
            addr_lines = [parts[0], parts[1], ', '.join(parts[2:])]
        elif len(parts) == 2:
            addr_lines = [parts[0], parts[1], '']
        else:
            addr_lines = [address, '', '']
    else:
        addr_lines = [address, '', '']
    
    y_right -= 14
    c.setFont("Times-Roman", 11)
    for line in addr_lines:
        draw_line(c, 400, y_right - 2, 576)
        if line:
            c.drawString(404, y_right, line)
        y_right -= 14
    
    # ===================================================================
    # PLAINTIFF NAME LINE
    # ===================================================================
    
    y_left = 678
    draw_line(c, 72, y_left, 350)
    c.setFont("Times-Roman", 12)
    c.drawString(180, y_left + 3, plaintiff_name)
    
    # ===================================================================
    # "Plaintiff," label
    # ===================================================================
    
    y_left -= 18
    c.setFont("Times-Italic", 12)
    c.drawRightString(350, y_left, "Plaintiff,")
    
    # ===================================================================
    # "-against-"
    # ===================================================================
    
    y_left -= 20
    c.setFont("Times-Roman", 12)
    c.drawCentredString(210, y_left, "-against-")
    
    # ===================================================================
    # DEFENDANT NAME LINE
    # ===================================================================
    
    y_left = 598
    draw_line(c, 72, y_left, 350)
    c.setFont("Times-Roman", 12)
    c.drawString(180, y_left + 3, defendant_name)
    
    # ===================================================================
    # "Defendant." label
    # ===================================================================
    
    y_left -= 18
    c.setFont("Times-Italic", 12)
    c.drawRightString(350, y_left, "Defendant.")
    
    # ===================================================================
    # Closing dashed line
    # ===================================================================
    
    y_left -= 8
    c.setFont("Times-Roman", 12)
    c.drawString(72, y_left, "-" * 56 + "X")
    
    # ===================================================================
    # ACTION FOR A DIVORCE
    # ===================================================================
    
    y = y_left - 28
    c.setFont("Times-Bold", 14)
    c.drawCentredString(PAGE_WIDTH / 2, y, "ACTION FOR A DIVORCE")
    
    # ===================================================================
    # To the above named Defendant:
    # ===================================================================
    
    y -= 22
    c.setFont("Times-Italic", 11)
    c.drawString(72, y, "To the above named Defendant:")
    
    # ===================================================================
    # YOU ARE HEREBY SUMMONED paragraph
    # ===================================================================
    
    y -= 18
    c.setFont("Times-Bold", 10)
    c.drawString(100, y, "YOU ARE HEREBY SUMMONED")
    c.setFont("Times-Roman", 10)
    c.drawString(242, y, "to serve a notice of appearance on the")
    
    # Checkbox - Plaintiff (checked)
    c.rect(468, y - 1, 8, 8, stroke=1, fill=0)
    c.setFont("Times-Bold", 8)
    c.drawString(469.5, y, "✓")
    c.setFont("Times-Italic", 10)
    c.drawString(479, y, "Plaintiff")
    
    y -= 12
    c.setFont("Times-Roman", 10)
    c.drawString(72, y, "within twenty (20) days after the service of this summons, exclusive of the day of service (or within")
    
    y -= 12
    c.drawString(72, y, "thirty (30) days after the service is complete if this summons is not personally delivered to you within")
    
    y -= 12
    c.drawString(72, y, "the State of New York); and in case of your failure to appear, judgment will be taken against you by")
    
    y -= 12
    c.drawString(72, y, "default for the relief demanded in the notice set forth below.")
    
    # ===================================================================
    # DATED / PLAINTIFF SIGNATURE
    # ===================================================================
    
    y -= 26
    c.setFont("Times-Roman", 11)
    c.drawString(72, y, "Dated")
    today = datetime.now().strftime("%B %d, %Y")
    c.drawString(103, y, today)
    draw_line(c, 100, y - 2, 220)
    
    # Checkbox - Plaintiff (checked)
    c.rect(300, y - 1, 8, 8, stroke=1, fill=0)
    c.setFont("Times-Bold", 8)
    c.drawString(301.5, y, "✓")
    c.setFont("Times-Italic", 10)
    c.drawString(311, y, "Plaintiff")
    
    # ===================================================================
    # Signature line
    # ===================================================================
    
    y -= 20
    draw_line(c, 300, y, 540)
    c.setFont("Times-Roman", 11)
    # Name printed on signature line
    c.drawString(380, y + 3, plaintiff_name)
    
    # ===================================================================
    # Phone No.
    # ===================================================================
    
    y -= 14
    c.drawString(300, y, "Phone No.:")
    phone = data.get('plaintiffPhone', '')
    c.drawString(355, y, phone)
    
    # ===================================================================
    # Address (mailing)
    # ===================================================================
    
    y -= 14
    c.drawString(300, y, "Address:")
    
    mailing = data.get('plaintiffAddress', '')
    if ',' in mailing:
        mail_parts = [p.strip() for p in mailing.split(',')]
    else:
        mail_parts = [mailing]
    
    y -= 12
    for part in mail_parts[:3]:
        c.drawString(355, y, part)
        y -= 12
    
    # ===================================================================
    # NOTICE SECTION
    # ===================================================================
    
    y -= 10
    c.setFont("Times-Bold", 11)
    c.drawString(72, y, "NOTICE:")
    c.setFont("Times-Roman", 10)
    c.drawString(118, y, "The nature of this action is to dissolve the marriage between the parties, on the")
    
    y -= 12
    c.drawString(118, y, "grounds:")
    c.setFont("Times-Bold", 10)
    c.drawString(160, y, "DRL §170 subd. 7")
    c.setFont("Times-Roman", 10)
    c.drawString(245, y, "—")
    c.setFont("Times-Bold", 10)
    c.drawString(255, y, "irretrievable breakdown in relationship for a period of")
    
    y -= 12
    c.setFont("Times-Bold", 10)
    c.drawString(118, y, "at least six months.")
    
    y -= 18
    c.setFont("Times-Roman", 10)
    c.drawString(72, y, "The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the marriage")
    
    y -= 12
    c.drawString(72, y, "between the parties in this action.")
    
    # ===================================================================
    # ANCILLARY RELIEF SECTION
    # ===================================================================
    
    y -= 18
    c.drawString(72, y, "The nature of any ancillary or additional relief requested (see p.14 of Instructions) is:")
    
    y -= 16
    # NONE checkbox (checked)
    c.rect(72, y - 1, 8, 8, stroke=1, fill=0)
    c.setFont("Times-Bold", 8)
    c.drawString(73.5, y, "✓")
    c.setFont("Times-Bold", 10)
    c.drawString(84, y, "NONE")
    c.setFont("Times-Roman", 10)
    c.drawString(115, y, "— I am not requesting any ancillary relief;")
    
    y -= 14
    c.setFont("Times-Bold", 10)
    c.drawString(72, y, "AND")
    c.setFont("Times-Roman", 10)
    c.drawString(97, y, "any other relief the court deems fit and proper")
    
    # ===================================================================
    # FOOTER
    # ===================================================================
    
    c.setFont("Times-Roman", 9)
    c.drawString(72, 36, "(UD-1 Rev. 1/25/16)")
    
    c.save()
    return output_path


if __name__ == "__main__":
    test_data = {
        "plaintiffName": "Jake Kim",
        "defendantName": "Jane Doe",
        "county": "Orange",
        "qualifyingParty": "plaintiff",
        "qualifyingAddress": "74 Fitzgerald Court, Monroe, NY 10950",
        "plaintiffPhone": "(845) 555-1234",
        "plaintiffAddress": "74 Fitzgerald Court, Monroe, NY 10950"
    }
    
    output = generate_ud1(test_data, "/home/claude/divorcegpt_src/test_ud1_clean.pdf")
    print(f"Generated: {output}")
