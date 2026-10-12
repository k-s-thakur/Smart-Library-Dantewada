import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, KeepTogether
from reportlab.lib import colors

def generate_pdf():
    pdf_path = r"e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\SMART LIBRARY APP\SMART_LIBRARY_PROJECT_PROPOSAL.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E40AF'),
        spaceBefore=14,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1F2937'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#111827'),
        backColor=colors.HexColor('#F3F4F6'),
        spaceBefore=4,
        spaceAfter=6
    )

    elements = []

    # Title Banner
    elements.append(Paragraph("Smart Library Management & Tracking System", title_style))
    elements.append(Paragraph("System Architecture, Hardware Tracking & Functional Project Specification", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=14))

    # Executive Summary
    elements.append(Paragraph("1. Executive Summary", h1_style))
    elements.append(Paragraph(
        "The <b>Smart Library Management & Tracking System (SLMTS)</b> is an IoT-connected, automated platform "
        "designed to overhaul traditional manual library operations. By integrating <b>High-Frequency RFID (ISO 15693 / 28560)</b>, "
        "anti-theft <b>Electronic Article Surveillance (EAS)</b> pedestals, self-checkout touch kiosks, 24/7 smart book return chutes, "
        "and real-time seat reservation with presence sensing, the system eliminates checkout queues, prevents book theft, "
        "and provides full transparency for students, faculty, and administrative staff.",
        body_style
    ))

    # Core Modules
    elements.append(Paragraph("2. Core System Modules", h1_style))
    
    elements.append(Paragraph("2.1 Book Inventory & Asset Tracking", h2_style))
    elements.append(Paragraph("&bull; <b>Dual Identification (RFID + Barcode):</b> HF RFID tags (13.56 MHz, ISO 15693 / 28560) allow non-line-of-sight scanning of multiple books simultaneously on reader pads.", bullet_style))
    elements.append(Paragraph("&bull; <b>Anti-Theft EAS Security Gates:</b> RFID tags carry an EAS/AFI security byte. When checked out legitimately, the kiosk deactivates this byte. Unauthorized passage triggers physical alarm gates and camera snapshots.", bullet_style))
    elements.append(Paragraph("&bull; <b>ISBN Auto-Enrichment:</b> Integrated with Google Books and OpenLibrary APIs to instantly pull title, author, cover image, and Dewey Decimal Classification upon barcode scan.", bullet_style))
    elements.append(Paragraph("&bull; <b>Handheld Audit Wand:</b> Enables library staff to scan whole shelf racks at 50+ books/sec to pinpoint misplaced or missing items.", bullet_style))

    elements.append(Paragraph("2.2 Student, Faculty & Staff Management", h2_style))
    elements.append(Paragraph("&bull; <b>Role-Based Access Control (RBAC):</b> Discrete permission boundaries for Super Admin, Librarians, Faculty, and Students.", bullet_style))
    elements.append(Paragraph("&bull; <b>Virtual Digital ID Card:</b> Mobile app generates dynamic, anti-screenshot QR codes and NFC card emulation for contactless gate entry and kiosk authentication.", bullet_style))
    elements.append(Paragraph("&bull; <b>Differentiated Borrowing Rules:</b> Configurable borrowing quotas (e.g. Undergrads: 4 books/14 days; Faculty: 15 books/90 days).", bullet_style))

    elements.append(Paragraph("2.3 Automated Circulation & Self-Service", h2_style))
    elements.append(Paragraph("&bull; <b>Self-Checkout Kiosk:</b> Patron authenticates, stacks up to 5 books on the multi-tag RFID pad, system validates loans in one atomic transaction, deactivates EAS bits, and emails receipts.", bullet_style))
    elements.append(Paragraph("&bull; <b>24/7 Smart Book Chute:</b> Exterior return drop box equipped with internal RFID reader automatically checks in returned books, reactivates EAS protection, and notifies the patron.", bullet_style))
    elements.append(Paragraph("&bull; <b>Automated Fine Engine:</b> Calculates late penalties on a per-day schedule, automatically exempting institutional holidays, weekends, and exam breaks.", bullet_style))

    elements.append(Paragraph("2.4 Smart Seat & Study Room Booking", h2_style))
    elements.append(Paragraph("&bull; <b>Interactive 2D Live Floor Map:</b> Real-time visualization of vacant, booked, and occupied carrels and discussion suites.", bullet_style))
    elements.append(Paragraph("&bull; <b>15-Minute No-Show Auto-Release:</b> Booked seats must be claimed via desk QR scan within 15 minutes, or the slot is auto-cancelled and freed.", bullet_style))
    elements.append(Paragraph("&bull; <b>IoT Smart Room Locks:</b> Electronic locks grant entry only during active, confirmed reservation windows.", bullet_style))

    # Page Break for clean layout
    elements.append(PageBreak())

    # Technology Stack Table
    elements.append(Paragraph("3. Recommended Technology Stack", h1_style))
    
    tech_data = [
        ["Layer", "Technology Selection", "Purpose / Advantage"],
        ["Web Portal", "Next.js 14+ / React / Tailwind CSS", "SEO-optimized public catalog and reactive staff portal"],
        ["Mobile App", "React Native (Expo) / Flutter", "Virtual student ID card, camera QR scanning, push alerts"],
        ["Kiosk Interface", "Electron / Flutter Desktop", "Direct low-level USB/Serial access to RFID pads & printers"],
        ["Backend Core", "Node.js (NestJS) / Python (FastAPI)", "Modular service architecture, WebSockets, REST APIs"],
        ["Primary DB", "PostgreSQL 16", "ACID guarantees for circulation loans and JSONB metadata"],
        ["Cache & Locks", "Redis", "Distributed locking for seat reservations and fast sessions"],
        ["Search Engine", "Meilisearch", "Sub-20ms typo-tolerant fuzzy catalog search"],
        ["Hardware / IoT", "ESP32 / Raspberry Pi / HF RFID", "Smart chute sensors, EAS gate alarms, smart door relays"]
    ]

    table_style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F9FAFB')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ])

    col_widths = [90, 180, 250]
    t = Table(tech_data, colWidths=col_widths, style=table_style)
    elements.append(t)
    elements.append(Spacer(1, 14))

    # Implementation Roadmap
    elements.append(Paragraph("4. Implementation Roadmap", h1_style))
    roadmap_data = [
        ["Phase", "Key Deliverables", "Focus Area"],
        ["Phase 1", "Database schema, RBAC Auth, Book Catalog CRUD with ISBN auto-fill", "Core Foundation"],
        ["Phase 2", "Circulation desk (Issue/Return), Fine calculator, Patron loan matrix", "Staff Workflows"],
        ["Phase 3", "Self-checkout kiosk, Smart drop chute, EAS gate alarm bridge (RFID)", "Hardware & IoT"],
        ["Phase 4", "Interactive 2D seat map, QR check-in auto-release, Mobile app", "Space & Patron App"]
    ]
    t_roadmap = Table(roadmap_data, colWidths=[60, 310, 150], style=table_style)
    elements.append(t_roadmap)
    elements.append(Spacer(1, 14))

    # Security & Compliance
    elements.append(Paragraph("5. Security, Privacy & Reliability", h1_style))
    elements.append(Paragraph("&bull; <b>Patron Privacy (FERPA / GDPR):</b> Historical borrowing logs are anonymized once items are returned and settled to safeguard user reading confidentiality.", bullet_style))
    elements.append(Paragraph("&bull; <b>Hardware Independence:</b> EAS security pedestals operate autonomously at the hardware level, sounding alarms even during network drops.", bullet_style))
    elements.append(Paragraph("&bull; <b>Offline Kiosk Operation:</b> Kiosks queue checkouts locally and synchronize with the central database when connection restores.", bullet_style))

    # Build the document
    doc.build(elements)
    print("PDF successfully generated at:", pdf_path)

if __name__ == "__main__":
    generate_pdf()
