#!/usr/bin/env python3
"""
DivorceGPT UD-9 (Note of Issue) PDF Generator
==============================================

Puts the case on the court calendar.
For uncontested divorces - no children under 18.
"""

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = letter  # 612 x 792 points
MARGIN_LEFT = 72   # 1 inch
MARGIN_RIGHT = 72
MARGIN_TOP = 72
MARGIN_BOTTOM = 72

# Content area
CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT  # 468 points

# Line height
LINE_HEIGHT = 14

# Box layout positions
BOX1_LEFT_X = MARGIN_LEFT
BOX1_RIGHT_X = PAGE_WIDTH / 2

BOX2_LEFT_X = PAGE_WIDTH / 2
BOX2_RIGHT_X = PAGE_WIDTH - MARGIN_RIGHT


def draw_wrapped_text(c, text, x, y, max_width, font_name="Times-Roman", font_size=12):
    """Draw text that wraps within max_width. Returns final Y position."""
    c.setFont(font_name, font_size)
    words = text.split()
    lines = []
    current_line = []
    current_width = 0
    space_width = c.stringWidth(' ', font_name, font_size)
    
    for word in words:
        word_width = c.stringWidth(word, font_name, font_size)
        test_width = current_width + word_width + (space_width if current_line else 0)
        
        if test_width <= max_width:
            current_line.append(word)
            current_width = test_width
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
            current_width = word_width
    
    if current_line:
        lines.append(' '.join(current_line))
    
    for line in lines:
        c.drawString(x, y, line)
        y -= LINE_HEIGHT
    
    return y


def generate_ud9(data, output_path):
    """Generate UD-9 (Note of Issue) PDF."""
    
    c = canvas.Canvas(output_path, pagesize=letter)
    
    # Extract variables
    county_name = data.get('county', '').strip()
    county_upper = county_name.upper()
    
    plaintiff_name = data.get('plaintiffName', '').strip()
    defendant_name = data.get('defendantName', '').strip()
    index_number = data.get('indexNumber', '').strip()
    
    # Dates
    date_summons_filed = data.get('dateSummonsFiled', '').strip()
    date_summons_served = data.get('dateSummonsServed', '').strip()
    
    # Issue type: "waiver" (UD-7 signed), "default", or "stipulation"
    issue_type = data.get('issueType', 'waiver').lower()
    
    # Plaintiff contact info (pro se)
    plaintiff_address = data.get('plaintiffAddress', '').strip()
    plaintiff_phone = data.get('plaintiffPhone', '').strip()
    
    # =========================================================================
    # PAGE 1
    # =========================================================================
    
    y = PAGE_HEIGHT - MARGIN_TOP
    
    # For Use of Clerk (right aligned)
    c.setFont("Times-Roman", 10)
    c.drawRightString(PAGE_WIDTH - MARGIN_RIGHT, y, "For Use of Clerk")
    y -= LINE_HEIGHT
    c.drawRightString(PAGE_WIDTH - MARGIN_RIGHT, y, "Calendar No.: ____________")
    y -= LINE_HEIGHT * 1.5
    
    # Header - centered
    c.setFont("Times-Bold", 12)
    center_x = PAGE_WIDTH / 2
    title = "NOTE OF ISSUE"
    c.drawString(center_x - c.stringWidth(title, "Times-Bold", 12)/2, y, title)
    y -= LINE_HEIGHT
    subtitle = "UNCONTESTED DIVORCE"
    c.drawString(center_x - c.stringWidth(subtitle, "Times-Bold", 12)/2, y, subtitle)
    y -= LINE_HEIGHT * 2
    
    # Court header
    c.drawString(MARGIN_LEFT, y, "SUPREME COURT OF THE STATE OF NEW YORK")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, f"COUNTY OF {county_upper}")
    y -= LINE_HEIGHT * 1.5
    
    # Caption box
    boxes_top_y = y
    box_height = LINE_HEIGHT * 8
    boxes_bottom_y = boxes_top_y - box_height
    
    # Draw box borders
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(0.5)
    
    c.line(BOX1_LEFT_X, boxes_top_y, BOX1_RIGHT_X, boxes_top_y)
    c.line(BOX1_RIGHT_X, boxes_top_y, BOX1_RIGHT_X, boxes_bottom_y)
    c.line(BOX1_LEFT_X, boxes_bottom_y, BOX1_RIGHT_X, boxes_bottom_y)
    c.line(BOX2_LEFT_X, boxes_top_y, BOX2_LEFT_X, boxes_bottom_y)
    
    # Left box - Caption
    box1_x = BOX1_LEFT_X + 8
    caption_y = boxes_top_y - LINE_HEIGHT * 1.5
    
    c.setFont("Times-Roman", 12)
    c.drawString(box1_x, caption_y, f"{plaintiff_name},")
    caption_y -= LINE_HEIGHT
    c.setFont("Times-Italic", 12)
    c.drawString(box1_x + 40, caption_y, "Plaintiff,")
    caption_y -= LINE_HEIGHT * 1.5
    c.setFont("Times-Roman", 12)
    c.drawString(box1_x + 40, caption_y, "-against-")
    caption_y -= LINE_HEIGHT * 1.5
    c.drawString(box1_x, caption_y, f"{defendant_name}.")
    caption_y -= LINE_HEIGHT
    c.setFont("Times-Italic", 12)
    c.drawString(box1_x + 40, caption_y, "Defendant.")
    
    # Right box - Index number
    box2_x = BOX2_LEFT_X + 8
    title_y = boxes_top_y - LINE_HEIGHT * 1.5
    
    c.setFont("Times-Roman", 12)
    if index_number:
        c.drawString(box2_x, title_y, f"Index No.: {index_number}")
    else:
        c.drawString(box2_x, title_y, "Index No.: _______________")
    
    # Body content
    y = boxes_bottom_y - LINE_HEIGHT * 2
    
    # Trial type
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, y, "TRIAL: [ ] Jury    [X] Non-Jury (No Trial)")
    y -= LINE_HEIGHT * 2
    
    # Filed by section
    c.drawString(MARGIN_LEFT, y, "Filed by:")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "[X] Plaintiff")
    c.drawString(MARGIN_LEFT + 150, y, "[ ] Defendant")
    y -= LINE_HEIGHT * 2
    
    # Date Summons Filed
    date_filed_display = date_summons_filed if date_summons_filed else "_______________"
    c.drawString(MARGIN_LEFT, y, f"Date Summons Filed: {date_filed_display}")
    y -= LINE_HEIGHT * 1.5
    
    # Date Summons Served
    date_served_display = date_summons_served if date_summons_served else "_______________"
    c.drawString(MARGIN_LEFT, y, f"Date Summons Served: {date_served_display}")
    y -= LINE_HEIGHT * 2
    
    # Issue Joined / Not Joined
    c.drawString(MARGIN_LEFT, y, "ISSUE:")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "[ ] JOINED")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "[X] NOT JOINED -")
    
    # Issue type checkboxes
    waiver_box = "[X]" if issue_type == "waiver" else "[ ]"
    default_box = "[X]" if issue_type == "default" else "[ ]"
    stipulation_box = "[X]" if issue_type == "stipulation" else "[ ]"
    
    c.drawString(MARGIN_LEFT + 130, y, f"{waiver_box} Waiver")
    c.drawString(MARGIN_LEFT + 220, y, f"{default_box} Default")
    c.drawString(MARGIN_LEFT + 310, y, f"{stipulation_box} Stipulation")
    y -= LINE_HEIGHT * 2
    
    # Nature of action
    c.drawString(MARGIN_LEFT, y, "NATURE OF ACTION: Uncontested Divorce")
    y -= LINE_HEIGHT * 1.5
    
    # Relief sought
    c.drawString(MARGIN_LEFT, y, "RELIEF SOUGHT: Judgment of Absolute Divorce")
    y -= LINE_HEIGHT * 2
    
    # Check page break
    if y < MARGIN_BOTTOM + LINE_HEIGHT * 12:
        c.showPage()
        y = PAGE_HEIGHT - MARGIN_TOP
        c.setFont("Times-Roman", 12)
    
    # Attorney/Pro Se for Plaintiff
    c.drawString(MARGIN_LEFT, y, "ATTORNEY FOR PLAINTIFF:")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "[X] Self-Represented (Pro Se)")
    y -= LINE_HEIGHT * 1.5
    
    # Plaintiff contact info
    c.drawString(MARGIN_LEFT + 20, y, f"Name: {plaintiff_name}")
    y -= LINE_HEIGHT
    
    if plaintiff_address:
        # Split address if it's long
        if len(plaintiff_address) > 50:
            y = draw_wrapped_text(c, f"Address: {plaintiff_address}", MARGIN_LEFT + 20, y, CONTENT_WIDTH - 20)
        else:
            c.drawString(MARGIN_LEFT + 20, y, f"Address: {plaintiff_address}")
            y -= LINE_HEIGHT
    else:
        c.drawString(MARGIN_LEFT + 20, y, "Address: _____________________________________________")
        y -= LINE_HEIGHT
    
    if plaintiff_phone:
        c.drawString(MARGIN_LEFT + 20, y, f"Phone: {plaintiff_phone}")
    else:
        c.drawString(MARGIN_LEFT + 20, y, "Phone: ___________________")
    y -= LINE_HEIGHT * 2
    
    # Attorney for Defendant
    c.drawString(MARGIN_LEFT, y, "ATTORNEY FOR DEFENDANT:")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "[X] Self-Represented (Pro Se) / Not Appearing")
    y -= LINE_HEIGHT * 1.5
    
    c.drawString(MARGIN_LEFT + 20, y, f"Name: {defendant_name}")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "Address: _____________________________________________")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 20, y, "Phone: ___________________")
    y -= LINE_HEIGHT * 2
    
    # Check page break before signature
    if y < MARGIN_BOTTOM + LINE_HEIGHT * 6:
        c.showPage()
        y = PAGE_HEIGHT - MARGIN_TOP
        c.setFont("Times-Roman", 12)
    
    # Date and signature
    c.drawString(MARGIN_LEFT, y, "Dated: _______________")
    y -= LINE_HEIGHT * 2
    
    c.line(MARGIN_LEFT, y, MARGIN_LEFT + 250, y)
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, plaintiff_name)
    y -= LINE_HEIGHT
    c.setFont("Times-Italic", 12)
    c.drawString(MARGIN_LEFT, y, "Plaintiff (Pro Se)")
    
    # Footer
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, MARGIN_BOTTOM - 20, "(Form UD-9)")
    
    c.save()
    return output_path


if __name__ == "__main__":
    # Test with waiver (UD-7 signed)
    test_data = {
        "plaintiffName": "JANE DOE",
        "defendantName": "JOHN DOE",
        "county": "Orange",
        "indexNumber": "12345/2027",
        "dateSummonsFiled": "January 10, 2027",
        "dateSummonsServed": "January 15, 2027",
        "issueType": "waiver",  # UD-7 signed
        "plaintiffAddress": "74 Fitzgerald Court, Monroe, NY 10950",
        "plaintiffPhone": "(845) 555-1234",
    }
    
    output = generate_ud9(test_data, "/home/claude/test_ud9_waiver.pdf")
    print(f"Generated WAIVER: {output}")
    
    # Test with default
    test_data["issueType"] = "default"
    output = generate_ud9(test_data, "/home/claude/test_ud9_default.pdf")
    print(f"Generated DEFAULT: {output}")
