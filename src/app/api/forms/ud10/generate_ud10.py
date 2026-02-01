#!/usr/bin/env python3
"""
DivorceGPT UD-10 (Findings of Fact and Conclusions of Law) PDF Generator
=========================================================================

Court findings and conclusions for uncontested divorce.
Simplified for DivorceGPT scope: no children, no assets, no maintenance.
Grounds: DRL §170(7) - irretrievable breakdown for 6+ months.
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


def check_page_break(c, y, needed_space):
    """Check if page break needed, return new y position."""
    if y < MARGIN_BOTTOM + needed_space:
        c.showPage()
        c.setFont("Times-Roman", 12)
        return PAGE_HEIGHT - MARGIN_TOP
    return y


def generate_ud10(data, output_path):
    """Generate UD-10 (Findings of Fact and Conclusions of Law) PDF."""
    
    c = canvas.Canvas(output_path, pagesize=letter)
    
    # Extract variables
    county_name = data.get('county', '').strip()
    county_upper = county_name.upper()
    
    plaintiff_name = data.get('plaintiffName', '').strip()
    defendant_name = data.get('defendantName', '').strip()
    index_number = data.get('indexNumber', '').strip()
    
    # Marriage info
    marriage_date = data.get('marriageDate', '').strip()
    marriage_place = data.get('marriagePlace', '').strip()
    religious_ceremony = data.get('religiousCeremony', False)
    
    # Residency type
    residency_type = data.get('residencyType', 'A')
    
    # Service info
    service_method = data.get('serviceMethod', 'personal')  # personal or mail
    defendant_appeared = data.get('defendantAppeared', True)
    
    # =========================================================================
    # PAGE 1
    # =========================================================================
    
    y = PAGE_HEIGHT - MARGIN_TOP
    
    # Header - for court use (left blank)
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, y, "At a term of the Supreme Court of the")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, "State of New York, held in and for the")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, f"County of {county_name}, at the Courthouse,")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, "on the _____ day of _____________, 20___")
    y -= LINE_HEIGHT * 1.5
    
    # PRESENT line with underline ending at BOX1_RIGHT_X
    hon_text = "PRESENT: Hon. "
    c.drawString(MARGIN_LEFT, y, hon_text)
    hon_width = c.stringWidth(hon_text, "Times-Roman", 12)
    c.line(MARGIN_LEFT + hon_width, y - 2, BOX1_RIGHT_X, y - 2)
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 80, y, "Justice/Referee")
    y -= LINE_HEIGHT * 2
    
    # Title
    c.setFont("Times-Bold", 12)
    center_x = PAGE_WIDTH / 2
    title = "CONCLUSIONS OF LAW"
    c.drawString(center_x - c.stringWidth(title, "Times-Bold", 12)/2, y, title)
    y -= LINE_HEIGHT * 2
    
    # Court header
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "SUPREME COURT OF THE STATE OF NEW YORK")
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT, y, f"COUNTY OF {county_upper}")
    y -= LINE_HEIGHT * 1.5
    
    # Caption box
    boxes_top_y = y
    box_height = LINE_HEIGHT * 8
    boxes_bottom_y = boxes_top_y - box_height
    
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
    
    # Intro paragraph
    c.setFont("Times-Roman", 12)
    intro = "The above-entitled uncontested action having been submitted to the undersigned on affidavits, and due deliberation having been had thereon, the undersigned hereby makes the following findings of fact and conclusions of law:"
    y = draw_wrapped_text(c, intro, MARGIN_LEFT, y, CONTENT_WIDTH)
    y -= LINE_HEIGHT * 1.5
    
    # FINDINGS OF FACT
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "FINDINGS OF FACT")
    y -= LINE_HEIGHT * 1.5
    c.setFont("Times-Roman", 12)
    
    # FIRST - Age
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "FIRST:")
    c.setFont("Times-Roman", 12)
    first_text = "Plaintiff and Defendant were both eighteen (18) years of age or over when this action was commenced."
    y = draw_wrapped_text(c, first_text, MARGIN_LEFT + 60, y, CONTENT_WIDTH - 60)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 8)
    
    # SECOND - Residency
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "SECOND:")
    c.setFont("Times-Roman", 12)
    
    residency_texts = {
        'A': "The Plaintiff has resided in New York State for a continuous period of at least one year immediately preceding the commencement of this divorce action and the parties were married in New York State.",
        'B': "The Plaintiff has resided in New York State for a continuous period of at least one year immediately preceding the commencement of this divorce action and the parties have resided as married persons in New York State.",
        'C': "The Plaintiff has resided in New York State for a continuous period of at least one year immediately preceding the commencement of this divorce action and the cause of action occurred in New York State.",
        'D': "The cause of action occurred in New York State and both parties were residents of New York State at the time of commencement of this action.",
        'E': "The parties were married in New York State and both parties were residents of New York State at the time of commencement of this action.",
        'F': "Either party has resided in New York State for a continuous period of at least two years immediately preceding the commencement of this divorce action."
    }
    
    residency_text = residency_texts.get(residency_type, residency_texts['A'])
    y = draw_wrapped_text(c, residency_text, MARGIN_LEFT + 70, y, CONTENT_WIDTH - 70)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # THIRD - Marriage
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "THIRD:")
    c.setFont("Times-Roman", 12)
    
    marriage_date_display = marriage_date if marriage_date else "_______________"
    marriage_place_display = marriage_place if marriage_place else "_________________________________"
    ceremony_type = "religious" if religious_ceremony else "civil"
    
    third_text = f"Plaintiff and Defendant were married on {marriage_date_display} in {marriage_place_display}, in a {ceremony_type} ceremony."
    y = draw_wrapped_text(c, third_text, MARGIN_LEFT + 55, y, CONTENT_WIDTH - 55)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # FOURTH - No other actions
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "FOURTH:")
    c.setFont("Times-Roman", 12)
    fourth_text = "There is no other action pending for divorce, annulment, or dissolution of marriage between the parties in this or any other jurisdiction."
    y = draw_wrapped_text(c, fourth_text, MARGIN_LEFT + 65, y, CONTENT_WIDTH - 65)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # FIFTH - Service
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "FIFTH:")
    c.setFont("Times-Roman", 12)
    
    if defendant_appeared:
        fifth_text = "Defendant appeared in this action and waived the statutory waiting period, consenting to have this matter placed on the uncontested calendar immediately."
    else:
        fifth_text = "Defendant was properly served and is in default for failure to appear in this action."
    y = draw_wrapped_text(c, fifth_text, MARGIN_LEFT + 50, y, CONTENT_WIDTH - 50)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # SIXTH - Grounds
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "SIXTH:")
    c.setFont("Times-Roman", 12)
    sixth_text = "The relationship between Plaintiff and Defendant has broken down irretrievably for a period of at least six (6) months. (DRL §170 subd. 7)"
    y = draw_wrapped_text(c, sixth_text, MARGIN_LEFT + 55, y, CONTENT_WIDTH - 55)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # SEVENTH - No children
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "SEVENTH:")
    c.setFont("Times-Roman", 12)
    seventh_text = "There are no unemancipated children of the marriage."
    y = draw_wrapped_text(c, seventh_text, MARGIN_LEFT + 75, y, CONTENT_WIDTH - 75)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # EIGHTH - Equitable distribution
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "EIGHTH:")
    c.setFont("Times-Roman", 12)
    eighth_text = "Equitable distribution is not in issue. Neither party is seeking equitable distribution."
    y = draw_wrapped_text(c, eighth_text, MARGIN_LEFT + 65, y, CONTENT_WIDTH - 65)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # NINTH - Maintenance
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "NINTH:")
    c.setFont("Times-Roman", 12)
    ninth_text = "Maintenance is not in issue. Neither party is seeking maintenance."
    y = draw_wrapped_text(c, ninth_text, MARGIN_LEFT + 55, y, CONTENT_WIDTH - 55)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 6)
    
    # TENTH - Barriers to remarriage (if religious)
    if religious_ceremony:
        c.setFont("Times-Bold", 12)
        c.drawString(MARGIN_LEFT, y, "TENTH:")
        c.setFont("Times-Roman", 12)
        tenth_text = "The requirements of DRL §253 (Removal of Barriers to Remarriage) have been satisfied."
        y = draw_wrapped_text(c, tenth_text, MARGIN_LEFT + 55, y, CONTENT_WIDTH - 55)
        y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 10)
    
    # CONCLUSIONS OF LAW
    y -= LINE_HEIGHT
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "CONCLUSIONS OF LAW")
    y -= LINE_HEIGHT * 1.5
    c.setFont("Times-Roman", 12)
    
    # FIRST conclusion
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "FIRST:")
    c.setFont("Times-Roman", 12)
    conc1 = "Residency as required by DRL §230 has been satisfied."
    y = draw_wrapped_text(c, conc1, MARGIN_LEFT + 55, y, CONTENT_WIDTH - 55)
    y -= LINE_HEIGHT
    
    # SECOND conclusion
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "SECOND:")
    c.setFont("Times-Roman", 12)
    conc2 = "Plaintiff is entitled to a judgment of divorce on the grounds of DRL §170 subd. (7) - irretrievable breakdown of the marriage relationship for a period of at least six months."
    y = draw_wrapped_text(c, conc2, MARGIN_LEFT + 70, y, CONTENT_WIDTH - 70)
    y -= LINE_HEIGHT
    
    y = check_page_break(c, y, LINE_HEIGHT * 8)
    
    # THIRD conclusion
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "THIRD:")
    c.setFont("Times-Roman", 12)
    conc3 = "The marriage between the parties should be dissolved."
    y = draw_wrapped_text(c, conc3, MARGIN_LEFT + 55, y, CONTENT_WIDTH - 55)
    y -= LINE_HEIGHT * 3
    
    # Signature lines for judge
    c.drawString(MARGIN_LEFT, y, "Dated: _______________")
    y -= LINE_HEIGHT * 3
    
    c.line(MARGIN_LEFT + 250, y, PAGE_WIDTH - MARGIN_RIGHT, y)
    y -= LINE_HEIGHT
    c.drawString(MARGIN_LEFT + 300, y, "J.S.C. / Referee")
    
    # Footer
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, MARGIN_BOTTOM - 20, "(Form UD-10)")
    
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
        "marriagePlace": "Monroe, Orange County, New York",
        "religiousCeremony": False,
        "residencyType": "A",
        "defendantAppeared": True,
    }
    
    output = generate_ud10(test_data, "/home/claude/test_ud10_civil.pdf")
    print(f"Generated CIVIL: {output}")
    
    # Test with religious ceremony
    test_data["religiousCeremony"] = True
    output = generate_ud10(test_data, "/home/claude/test_ud10_religious.pdf")
    print(f"Generated RELIGIOUS: {output}")
