#!/usr/bin/env python3
"""
DivorceGPT UD-1 (Summons with Notice) PDF Generator
====================================================

LAYOUT:
- HEADER: Centered above both boxes
- BOX 1 (Caption): LEFT border only
- BOX 2 (Metadata): TOP, RIGHT, BOTTOM borders (no left)
- Boxes are symmetrical and side-by-side below header
"""

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
import re

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

# Box layout positions - no gap between boxes
BOX1_LEFT_X = MARGIN_LEFT
BOX1_RIGHT_X = PAGE_WIDTH / 2  # Left half

BOX2_LEFT_X = PAGE_WIDTH / 2   # Right half starts where left ends
BOX2_RIGHT_X = PAGE_WIDTH - MARGIN_RIGHT


def format_address_lines(address):
    """Format address into street / city-state-zip lines."""
    address = address.strip()
    
    match = re.search(r',\s*([^,]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)$', address)
    if match:
        city_state_zip = match.group(1).strip()
        street = address[:match.start()].strip()
        return [street, city_state_zip]
    
    match = re.search(r',\s*([A-Z]{2}\s+\d{5}(?:-\d{4})?)$', address)
    if match:
        before_state = address[:match.start()]
        last_comma = before_state.rfind(',')
        if last_comma > 0:
            street = before_state[:last_comma].strip()
            city_state_zip = before_state[last_comma+1:].strip() + ', ' + match.group(1).strip()
            return [street, city_state_zip]
    
    return [address]


def draw_underlined_text(c, text, x, y, font_name, font_size):
    """Draw text with underline."""
    c.setFont(font_name, font_size)
    c.drawString(x, y, text)
    text_width = c.stringWidth(text, font_name, font_size)
    c.line(x, y - 2, x + text_width, y - 2)
    return text_width


def draw_justified_paragraph(c, text, x, y, width, font_name="Times-Roman", font_size=12, first_line_indent=0):
    """Draw a justified paragraph. Returns the Y position after the paragraph."""
    words = text.split()
    lines = []
    current_line = []
    current_width = 0
    space_width = c.stringWidth(' ', font_name, font_size)
    
    c.setFont(font_name, font_size)
    
    for word in words:
        word_width = c.stringWidth(word, font_name, font_size)
        max_width = width - first_line_indent if len(lines) == 0 else width
        test_width = current_width + word_width + (space_width if current_line else 0)
        
        if test_width <= max_width:
            current_line.append(word)
            current_width = test_width
        else:
            if current_line:
                lines.append(current_line)
            current_line = [word]
            current_width = word_width
    
    if current_line:
        lines.append(current_line)
    
    for i, line_words in enumerate(lines):
        line_x = x + (first_line_indent if i == 0 else 0)
        line_width = width - (first_line_indent if i == 0 else 0)
        
        if i < len(lines) - 1 and len(line_words) > 1:
            total_word_width = sum(c.stringWidth(w, font_name, font_size) for w in line_words)
            total_space = line_width - total_word_width
            space_between = total_space / (len(line_words) - 1)
            
            current_x = line_x
            for word in line_words:
                c.drawString(current_x, y, word)
                current_x += c.stringWidth(word, font_name, font_size) + space_between
        else:
            c.drawString(line_x, y, ' '.join(line_words))
        
        y -= LINE_HEIGHT
    
    return y


def generate_ud1(data, output_path):
    """Generate UD-1 form PDF with two-box layout."""
    
    c = canvas.Canvas(output_path, pagesize=letter)
    
    # Extract dynamic variables
    county_name = data.get('county', '').strip()
    county_upper = county_name.upper()
    county_title = ' '.join(word.capitalize() for word in county_name.split())
    
    plaintiff_name = data.get('plaintiffName', '').strip()
    defendant_name = data.get('defendantName', '').strip()
    qualifying_party = data.get('qualifyingParty', 'plaintiff')
    qualifying_address = data.get('qualifyingAddress', '').strip()
    plaintiff_phone = data.get('plaintiffPhone', '').strip()
    plaintiff_address = data.get('plaintiffAddress', '').strip()
    date_filed = data.get('dateFiled', '')
    
    qualifying_party_label = "Plaintiff" if qualifying_party.lower() == 'plaintiff' else "Defendant"
    
    qual_addr_lines = format_address_lines(qualifying_address)
    plaintiff_addr_lines = format_address_lines(plaintiff_address)
    
    display_date = date_filed if date_filed else datetime.now().strftime("%B %d, %Y")
    
    y = PAGE_HEIGHT - MARGIN_TOP
    
    # =========================================================================
    # HEADER: Left aligned, Bold
    # =========================================================================
    c.setFont("Times-Bold", 12)
    
    header1 = "SUPREME COURT OF THE STATE OF NEW YORK"
    c.drawString(MARGIN_LEFT, y, header1)
    
    y -= LINE_HEIGHT
    header2 = f"COUNTY OF {county_upper}"
    c.drawString(MARGIN_LEFT, y, header2)
    
    # Space after header before boxes (shortened)
    y -= LINE_HEIGHT * 0.5
    
    # =========================================================================
    # BOXES START HERE
    # =========================================================================
    boxes_top_y = y
    
    # =========================================================================
    # BOX 2 CONTENT (Metadata) - draw first to determine box height
    # =========================================================================
    box2_content_x = BOX2_LEFT_X + 8
    box2_max_width = BOX2_RIGHT_X - box2_content_x - 8  # Stay within box with padding
    y2 = boxes_top_y - LINE_HEIGHT
    
    # Index No.:
    c.setFont("Times-Roman", 12)
    c.drawString(box2_content_x, y2, "Index No.:")
    
    # (space for user to fill in)
    y2 -= LINE_HEIGHT
    
    # Date Summons filed:
    y2 -= LINE_HEIGHT
    c.drawString(box2_content_x, y2, "Date Summons filed:")
    
    # (space for user to fill in)
    y2 -= LINE_HEIGHT
    
    # Plaintiff designates {County} County as the place of trial
    # Check if it fits on one line, wrap if needed
    y2 -= LINE_HEIGHT
    c.setFont("Times-Roman", 12)
    
    part1 = "Plaintiff designates "
    county_display = f"{county_title} County"
    part2 = " as the place of trial"
    
    full_line_width = (c.stringWidth(part1, "Times-Roman", 12) + 
                       c.stringWidth(county_display, "Times-Roman", 12) + 
                       c.stringWidth(part2, "Times-Roman", 12))
    
    if full_line_width <= box2_max_width:
        # Fits on one line
        c.drawString(box2_content_x, y2, part1)
        x_pos = box2_content_x + c.stringWidth(part1, "Times-Roman", 12)
        x_pos += draw_underlined_text(c, county_display, x_pos, y2, "Times-Roman", 12)
        c.setFont("Times-Roman", 12)
        c.drawString(x_pos, y2, part2)
    else:
        # Wrap to two lines
        c.drawString(box2_content_x, y2, part1)
        x_pos = box2_content_x + c.stringWidth(part1, "Times-Roman", 12)
        draw_underlined_text(c, county_display, x_pos, y2, "Times-Roman", 12)
        y2 -= LINE_HEIGHT
        c.setFont("Times-Roman", 12)
        c.drawString(box2_content_x, y2, "as the place of trial")
    
    # The basis of the venue is {qualifying party}'s address
    y2 -= LINE_HEIGHT
    
    part1 = "The basis of the venue is: "
    part2 = f"{qualifying_party_label}'s address"
    
    full_line_width = (c.stringWidth(part1, "Times-Roman", 12) + 
                       c.stringWidth(part2, "Times-Roman", 12))
    
    if full_line_width <= box2_max_width:
        # Fits on one line
        c.drawString(box2_content_x, y2, part1)
        x_pos = box2_content_x + c.stringWidth(part1, "Times-Roman", 12)
        draw_underlined_text(c, part2, x_pos, y2, "Times-Roman", 12)
    else:
        # Wrap to two lines
        c.drawString(box2_content_x, y2, part1)
        y2 -= LINE_HEIGHT
        draw_underlined_text(c, part2, box2_content_x, y2, "Times-Roman", 12)
    
    # Blank line before SUMMONS WITH NOTICE
    y2 -= LINE_HEIGHT
    
    # SUMMONS WITH NOTICE (bold, underlined, centered in box)
    y2 -= LINE_HEIGHT
    summons_text = "SUMMONS WITH NOTICE"
    summons_width = c.stringWidth(summons_text, "Times-Bold", 12)
    box2_center_x = BOX2_LEFT_X + (BOX2_RIGHT_X - BOX2_LEFT_X) / 2
    summons_x = box2_center_x - summons_width / 2
    draw_underlined_text(c, summons_text, summons_x, y2, "Times-Bold", 12)
    
    # Blank line after SUMMONS WITH NOTICE
    y2 -= LINE_HEIGHT
    
    # {qualifying party} resides at:
    y2 -= LINE_HEIGHT
    c.setFont("Times-Roman", 12)
    c.drawString(box2_content_x, y2, f"{qualifying_party_label} resides at:")
    
    # Address Line 1 (left indent)
    y2 -= LINE_HEIGHT
    c.drawString(box2_content_x, y2, qual_addr_lines[0] if qual_addr_lines else "")
    
    # City, State ZIP (left indent)
    if len(qual_addr_lines) > 1:
        y2 -= LINE_HEIGHT
        c.drawString(box2_content_x, y2, qual_addr_lines[1])
    
    boxes_bottom_y = y2 - 8
    
    # =========================================================================
    # BOX 1 CONTENT (Caption) - vertically distributed within box height
    # =========================================================================
    box1_content_x = BOX1_LEFT_X + 8
    box_height = boxes_top_y - boxes_bottom_y
    
    # Position plaintiff at top third, -against- at middle, defendant at bottom third
    plaintiff_y = boxes_top_y - box_height * 0.2
    against_y = boxes_top_y - box_height * 0.5
    defendant_y = boxes_top_y - box_height * 0.75
    
    c.setFont("Times-Roman", 12)
    c.drawString(box1_content_x, plaintiff_y, plaintiff_name)
    c.drawString(box1_content_x + 40, against_y, "-against-")
    c.drawString(box1_content_x, defendant_y, defendant_name)
    
    # =========================================================================
    # DRAW BOX BORDERS
    # =========================================================================
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(0.5)
    
    # BOX 1: TOP, RIGHT, BOTTOM borders (no left)
    c.line(BOX1_LEFT_X, boxes_top_y, BOX1_RIGHT_X, boxes_top_y)      # Top
    c.line(BOX1_RIGHT_X, boxes_top_y, BOX1_RIGHT_X, boxes_bottom_y)  # Right
    c.line(BOX1_LEFT_X, boxes_bottom_y, BOX1_RIGHT_X, boxes_bottom_y) # Bottom
    
    # BOX 2: LEFT border only (full height)
    c.line(BOX2_LEFT_X, boxes_top_y, BOX2_LEFT_X, boxes_bottom_y)
    
    # =========================================================================
    # ACTION FOR A DIVORCE (centered, below boxes)
    # =========================================================================
    y = boxes_bottom_y - LINE_HEIGHT * 1.5
    
    c.setFont("Times-Bold", 12)
    action_text = "ACTION FOR A DIVORCE"
    text_width = c.stringWidth(action_text, "Times-Bold", 12)
    c.drawString((PAGE_WIDTH - text_width) / 2, y, action_text)
    
    # To the above named Defendant:
    y -= LINE_HEIGHT * 1.5
    c.setFont("Times-Italic", 12)
    c.drawString(MARGIN_LEFT, y, "To the above named Defendant:")
    
    y -= LINE_HEIGHT * 1.5
    
    # =========================================================================
    # YOU ARE HEREBY SUMMONED paragraph (JUSTIFIED, starts with bold)
    # =========================================================================
    
    # Draw "YOU ARE HEREBY SUMMONED" in bold first
    c.setFont("Times-Bold", 12)
    bold_part = "YOU ARE HEREBY SUMMONED "
    c.drawString(MARGIN_LEFT + 36, y, bold_part)
    bold_width = c.stringWidth(bold_part, "Times-Bold", 12)
    
    # Continue with rest of text in regular font
    summoned_rest = (
        "to serve a notice of appearance on the Plaintiff "
        "within twenty (20) days after the service of this summons, exclusive of the day of service "
        "(or within thirty (30) days after the service is complete if this summons is not personally "
        "delivered to you within the State of New York); and in case of your failure to appear, "
        "judgment will be taken against you by default for the relief demanded in the notice set "
        "forth below."
    )
    
    # Draw the rest starting after the bold part on first line
    c.setFont("Times-Roman", 12)
    first_line_start = MARGIN_LEFT + 36 + bold_width
    first_line_width = CONTENT_WIDTH - 36 - bold_width
    
    # Word wrap the rest
    words = summoned_rest.split()
    lines = []
    current_line = []
    current_width = 0
    space_width = c.stringWidth(' ', "Times-Roman", 12)
    
    # First line has less space
    max_width = first_line_width
    for i, word in enumerate(words):
        word_width = c.stringWidth(word, "Times-Roman", 12)
        test_width = current_width + word_width + (space_width if current_line else 0)
        
        if test_width <= max_width:
            current_line.append(word)
            current_width = test_width
        else:
            if current_line:
                lines.append((current_line, first_line_start if len(lines) == 0 else MARGIN_LEFT))
            current_line = [word]
            current_width = word_width
            max_width = CONTENT_WIDTH  # Subsequent lines have full width
    
    if current_line:
        lines.append((current_line, first_line_start if len(lines) == 0 else MARGIN_LEFT))
    
    # Draw first partial line (after bold text)
    if lines:
        first_words, first_x = lines[0]
        c.drawString(first_x, y, ' '.join(first_words))
        y -= LINE_HEIGHT
    
    # Draw remaining lines justified
    for i, (line_words, line_x) in enumerate(lines[1:], 1):
        if i < len(lines) - 1 and len(line_words) > 1:
            # Justify
            total_word_width = sum(c.stringWidth(w, "Times-Roman", 12) for w in line_words)
            total_space = CONTENT_WIDTH - total_word_width
            space_between = total_space / (len(line_words) - 1)
            
            current_x = MARGIN_LEFT
            for word in line_words:
                c.drawString(current_x, y, word)
                current_x += c.stringWidth(word, "Times-Roman", 12) + space_between
        else:
            # Last line left-aligned
            c.drawString(MARGIN_LEFT, y, ' '.join(line_words))
        y -= LINE_HEIGHT
    
    # =========================================================================
    # Dated: and Signature Block
    # =========================================================================
    y -= LINE_HEIGHT * 2
    
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, y, f"Dated: {display_date}")
    
    sig_x = BOX2_LEFT_X + 8
    c.line(sig_x, y - 3, PAGE_WIDTH - MARGIN_RIGHT, y - 3)
    
    c.drawString(sig_x, y, plaintiff_name)
    y -= LINE_HEIGHT
    
    c.drawString(sig_x, y, plaintiff_addr_lines[0] if plaintiff_addr_lines else "")
    y -= LINE_HEIGHT
    
    if len(plaintiff_addr_lines) > 1:
        c.drawString(sig_x, y, plaintiff_addr_lines[1])
        y -= LINE_HEIGHT
    
    c.drawString(sig_x, y, plaintiff_phone)
    
    # =========================================================================
    # NOTICE Section
    # =========================================================================
    y -= LINE_HEIGHT * 2
    
    c.setFont("Times-Bold", 12)
    notice_label = "NOTICE:"
    draw_underlined_text(c, notice_label, MARGIN_LEFT, y, "Times-Bold", 12)
    
    notice_indent = MARGIN_LEFT + 72
    
    c.setFont("Times-Roman", 12)
    c.drawString(notice_indent, y, "The nature of this action is to dissolve the marriage between the parties, on the")
    
    y -= LINE_HEIGHT
    c.drawString(notice_indent, y, "grounds: DRL§170 subd.7 – ")
    
    grounds_x = notice_indent + c.stringWidth("grounds: DRL§170 subd.7 – ", "Times-Roman", 12)
    c.setFont("Times-Bold", 12)
    grounds_text = "irretrievable breakdown in relationship for a"
    c.drawString(grounds_x, y, grounds_text)
    text_width = c.stringWidth(grounds_text, "Times-Bold", 12)
    c.line(grounds_x, y - 2, grounds_x + text_width, y - 2)
    
    y -= LINE_HEIGHT
    grounds_text_2 = "period at least six months"
    c.drawString(notice_indent, y, grounds_text_2)
    text_width_2 = c.stringWidth(grounds_text_2, "Times-Bold", 12)
    c.line(notice_indent, y - 2, notice_indent + text_width_2, y - 2)
    
    # =========================================================================
    # Relief Sought Paragraph
    # =========================================================================
    y -= LINE_HEIGHT * 2
    
    relief_text = (
        "The relief sought is a judgment of absolute divorce in favor of the Plaintiff dissolving the "
        "marriage between the parties in this action."
    )
    y = draw_justified_paragraph(c, relief_text, MARGIN_LEFT, y, CONTENT_WIDTH, "Times-Roman", 12)
    
    # =========================================================================
    # Ancillary Relief Section
    # =========================================================================
    y -= LINE_HEIGHT
    
    c.setFont("Times-Roman", 12)
    c.drawString(MARGIN_LEFT, y, "The nature of any ancillary or additional relief requested is:")
    
    y -= LINE_HEIGHT * 2
    c.setFont("Times-Bold", 12)
    c.drawString(MARGIN_LEFT, y, "NONE")
    c.setFont("Times-Roman", 12)
    none_width = c.stringWidth("NONE", "Times-Bold", 12)
    c.drawString(MARGIN_LEFT + none_width + 4, y, " – I am not requesting any ancillary relief.")
    
    # =========================================================================
    # FOOTER
    # =========================================================================
    c.setFont("Times-Roman", 10)
    c.drawString(MARGIN_LEFT, MARGIN_BOTTOM - 20, "UD-1 (Summons with Notice)")
    
    c.save()
    return output_path


if __name__ == "__main__":
    test_data = {
        "plaintiffName": "JOHN DOE",
        "defendantName": "JANE DOE",
        "county": "Orange",
        "qualifyingParty": "plaintiff",
        "qualifyingAddress": "123 Main Street, Monroe, NY 10950",
        "plaintiffPhone": "(845) 555-1234",
        "plaintiffAddress": "123 Main Street, Monroe, NY 10950",
        "dateFiled": ""
    }
    
    output = generate_ud1(test_data, "/home/claude/test_ud1_output.pdf")
    print(f"Generated: {output}")
