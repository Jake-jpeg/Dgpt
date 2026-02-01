#!/usr/bin/env python3
"""
DivorceGPT UD-11 (Judgment of Divorce) PDF Generator
=====================================================

The actual judgment signed by the court dissolving the marriage.
Simplified for DivorceGPT scope: no children, no assets, no maintenance.
Grounds: DRL §170(7) - irretrievable breakdown for 6+ months.

This is the court's official judgment - prepared by plaintiff, signed by judge.
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


def check_page_break(c, y, needed_space):
    """Check if page break needed, return new y position."""
    if y < MARGIN_BOTTOM + needed_space:
        c.showPage()
        c.setFont("Times-Roman", 12)
        return PAGE_HEIGHT - MARGIN_TOP
    return y


def generate_ud11(data, output_path):
    """Generate UD-11 (Judgment of Divorce) PDF."""
    
    c = canvas.Canvas(output_path, pagesize=letter)
    
    # Extract variables
    county_name = data.get('county', '').strip()
    county_upper = county_name.upper()
    
    plaintiff_name = data.get('plaintiffName', '').strip()
    defendant_name = data.get('defendantName', '').strip()
    index_number = data.get('indexNumber', '').strip()
    
    # Marriage info
    marriage_date = data.get('marriageDate', '').strip()
    religious_ceremony = data.get('religiousCeremony', False)
    
    # Addresses
    plaintiff_address = data.get('plaintiffAddress', '').strip()
    defendant_address = data.get('defendantAddress', '').strip()
    
    # Prior surname restoration (optional)
    plaintiff_prior_surname = data.get('plaintiffPriorSurname', '').strip()
    defendant_prior_surname = data.get('defendantPriorSurname', '').strip()
    
    # =========================================================================
    # PAGE 1
    # =========================================================================
    
    y = PAGE_HEIGHT - MARGIN_TOP
    
    # Header - match UD-10 format
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, y, "At the Matrimonial/IAS Part _____")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, "of New York State Supreme Court at")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, f"the Courthouse, {county_name}")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, "County, on ___________________.")
    y -= LINE_HEIGHT * 1.5
    
    c.drawString(MARGIN_LEFT, y, "Present:")
    y -= LINE_HEIGHT
    hon_text = "Hon. "
    c.drawString(MARGIN_LEFT, y, hon_text)
    hon_width = c.stringWidth(hon_text, "Times-Roman", 12)
    c.line(MARGIN_LEFT + hon_width, y - 2, MARGIN_LEFT + 200, y - 2)
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 30, y, "Justice/Referee")
    y -= LINE_HEIGHT * 2
    
    # Court header - Bold (matches UD-10)
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "SUPREME COURT OF THE STATE OF NEW YORK")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, f"COUNTY OF {county_upper}")
    y -= LINE_HEIGHT * 1.5
    
    # Caption box - match UD-10 format
    c.setFont("Times-Roman", 12)
    box_top = y
    box_left = MARGIN_LEFT
    box_right = MARGIN_LEFT + 230
    box_height = LINE_HEIGHT * 8
    box_bottom = box_top - box_height
    
    # Draw box borders (no left side - only top, right, bottom)
    c.setLineWidth(0.5)
    c.line(box_left, box_top, box_right, box_top)
    c.line(box_right, box_top, box_right, box_bottom)
    c.line(box_left, box_bottom, box_right, box_bottom)
    
    # Party names inside box with proper spacing
    inner_y = box_top - LINE_HEIGHT * 1.5
    c.drawString(box_left + 10, inner_y, f"{plaintiff_name},")
    inner_y -= LINE_HEIGHT
    c.setFont("Times-Italic", 12)
    c.drawString(box_left + 30, inner_y, "Plaintiff,")
    
    inner_y -= LINE_HEIGHT * 1.5  # Space after Plaintiff
    
    c.setFont("Times-Roman", 12)
    c.drawString(box_left + 50, inner_y, "-against-")
    
    inner_y -= LINE_HEIGHT * 1.5  # Space after -against-
    
    c.drawString(box_left + 10, inner_y, f"{defendant_name},")
    inner_y -= LINE_HEIGHT
    c.setFont("Times-Italic", 12)
    c.drawString(box_left + 30, inner_y, "Defendant.")
    
    # Right side - Index No., Calendar No., and Document Title
    right_x = box_right + 20
    right_y = box_top - LINE_HEIGHT * 1.5
    
    c.setFont("Times-Roman", 12)
    if index_number:
        c.drawString(right_x, right_y, f"Index No.: {index_number}")
    else:
        c.drawString(right_x, right_y, "Index No.: _______________")
    right_y -= LINE_HEIGHT * 1.2
    
    c.drawString(right_x, right_y, "Calendar No.: ___________")
    right_y -= LINE_HEIGHT * 1.5
    
    # Document title on right side
    c.setFont("Times-Bold", 12)
    c.drawString(right_x, right_y, "JUDGMENT OF DIVORCE")
    
    y = box_bottom - LINE_HEIGHT * 1.5
    
    # Intro paragraph
    c.setFont("Times-Roman", 12)
    intro = "The Findings of Fact and Conclusions of Law signed by the undersigned having been filed with the Clerk of this Court, and application having been made by Plaintiff for judgment pursuant thereto."
    y = draw_wrapped_text(c, intro, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    # NOW paragraph
    now_text = "NOW, on motion of the Plaintiff, it is"
    c.drawString(MARGIN_LEFT, y, now_text)
    y -= LINE_HEIGHT * 1.5
    
    # ORDERED AND ADJUDGED - Marriage dissolved
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "ORDERED AND ADJUDGED,")
    c.setFont("Times-Roman", 12)
    ordered1 = f" that the marriage between {plaintiff_name}, Plaintiff, and {defendant_name}, Defendant, is hereby dissolved by reason of the Irretrievable Breakdown of the marriage relationship for a period of at least six (6) months pursuant to DRL §170(7); and it is further"
    # Draw the rest after the bold part
    bold_width = c.stringWidth("ORDERED AND ADJUDGED,", "Times-Bold", 12)
    
    # Need to wrap this properly
    full_text = f"ORDERED AND ADJUDGED, that the marriage between {plaintiff_name}, Plaintiff, and {defendant_name}, Defendant, is hereby dissolved by reason of the Irretrievable Breakdown of the marriage relationship for a period of at least six (6) months pursuant to DRL §170(7); and it is further"
    y = draw_wrapped_text(c, full_text, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # ORDERED AND ADJUDGED - No children
    text2 = "ORDERED AND ADJUDGED, that there are no children of the marriage; and it is further"
    y = draw_wrapped_text(c, text2, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # ORDERED AND ADJUDGED - No maintenance
    text3 = "ORDERED AND ADJUDGED, that no award of maintenance is made to either party, neither party having requested maintenance; and it is further"
    y = draw_wrapped_text(c, text3, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # ORDERED AND ADJUDGED - No equitable distribution
    text4 = "ORDERED AND ADJUDGED, that equitable distribution of marital property is not in issue, there being no marital property to distribute; and it is further"
    y = draw_wrapped_text(c, text4, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # ORDERED AND ADJUDGED - Barriers to remarriage
    if religious_ceremony:
        text5 = "ORDERED AND ADJUDGED, that Plaintiff has complied with DRL §253 by filing a sworn statement that Plaintiff has taken all steps within his or her power to remove all barriers to Defendant's remarriage; and it is further"
    else:
        text5 = "ORDERED AND ADJUDGED, that compliance with DRL §253 regarding removal of barriers to remarriage is not required as the parties were married in a civil ceremony; and it is further"
    y = draw_wrapped_text(c, text5, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 8)
    
    # ORDERED AND ADJUDGED - No settlement agreement
    text6 = "ORDERED AND ADJUDGED, that there is no Settlement Agreement entered into between the parties; and it is further"
    y = draw_wrapped_text(c, text6, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 10)
    
    # ORDERED AND ADJUDGED - Applications for modification
    text7 = "ORDERED AND ADJUDGED, that any applications to enforce or modify the provisions of this Judgment shall be brought in a County wherein one of the parties resides; and it is further"
    y = draw_wrapped_text(c, text7, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 8)
    
    # ORDERED AND ADJUDGED - DRL 255 compliance
    text8 = "ORDERED AND ADJUDGED, that the parties have been provided notice pursuant to DRL §255 regarding health care coverage continuation, tax consequences, and other rights affected by this judgment; and it is further"
    y = draw_wrapped_text(c, text8, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 8)
    
    # Prior surname restoration (if applicable)
    if plaintiff_prior_surname or defendant_prior_surname:
        if plaintiff_prior_surname and defendant_prior_surname:
            text9 = f"ORDERED AND ADJUDGED, that Plaintiff is authorized to resume use of the prior surname \"{plaintiff_prior_surname}\" and Defendant is authorized to resume use of the prior surname \"{defendant_prior_surname}\"; and it is further"
        elif plaintiff_prior_surname:
            text9 = f"ORDERED AND ADJUDGED, that Plaintiff is authorized to resume use of the prior surname \"{plaintiff_prior_surname}\"; and it is further"
        else:
            text9 = f"ORDERED AND ADJUDGED, that Defendant is authorized to resume use of the prior surname \"{defendant_prior_surname}\"; and it is further"
        y = draw_wrapped_text(c, text9, MARGIN_LEFT, y, CONTENT_WIDTH)
        y -= LINE_HEIGHT
        y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # Final ORDERED AND ADJUDGED
    text_final = "ORDERED AND ADJUDGED, that this judgment shall be entered and that the marriage of the parties is dissolved as of the date of entry of this judgment."
    y = draw_wrapped_text(c, text_final, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT * 2
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # Signature section
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, y, "Dated: _______________")
    y -= LINE_HEIGHT * 2
    
    c.drawString(MARGIN_LEFT + 300, y, "ENTER:")
    y -= LINE_HEIGHT * 2
    
    c.line(MARGIN_LEFT + 250, y, PAGE_WIDTH - MARGIN_RIGHT, y)
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 300, y, "J.S.C./Referee")
    
    # Form identifier at bottom
    c.drawString(MARGIN_LEFT, MARGIN_BOTTOM - 10, "(Form UD-11)")
    
    c.save()
    return output_path


if __name__ == "__main__":
    # Test with civil ceremony
    test_data = {
        "plaintiffName": "JANE DOE",
        "defendantName": "JOHN DOE",
        "county": "Orange",
        "indexNumber": "12345/2027",
        "marriageDate": "June 15, 2015",
        "religiousCeremony": False,
        "plaintiffAddress": "123 Main St, Monroe, NY 10950",
        "defendantAddress": "456 Oak Ave, Goshen, NY 10924",
        "plaintiffPriorSurname": "Smith",
        "defendantPriorSurname": "",
    }
    
    output = generate_ud11(test_data, "/home/claude/test_ud11_civil.pdf")
    print(f"Generated CIVIL: {output}")
    
    # Test with religious ceremony
    test_data["religiousCeremony"] = True
    output = generate_ud11(test_data, "/home/claude/test_ud11_religious.pdf")
    print(f"Generated RELIGIOUS: {output}")
