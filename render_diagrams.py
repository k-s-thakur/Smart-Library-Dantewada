import os
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "C:\\Windows\\Fonts\\segoeui.ttf"
FONT_BOLD_PATH = "C:\\Windows\\Fonts\\segoeuib.ttf"

def get_font(size, bold=False):
    path = FONT_BOLD_PATH if bold else FONT_PATH
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def draw_arrow(draw, start, end, color="#2563EB", width=3):
    x1, y1 = start
    x2, y2 = end
    draw.line([x1, y1, x2, y2], fill=color, width=width)
    # Arrow head
    if y2 > y1: # downward
        draw.polygon([(x2 - 6, y2 - 8), (x2 + 6, y2 - 8), (x2, y2 + 2)], fill=color)
    elif y2 < y1: # upward
        draw.polygon([(x2 - 6, y2 + 8), (x2 + 6, y2 + 8), (x2, y2 - 2)], fill=color)
    elif x2 > x1: # rightward
        draw.polygon([(x2 - 8, y2 - 6), (x2 - 8, y2 + 6), (x2 + 2, y2)], fill=color)
    elif x2 < x1: # leftward
        draw.polygon([(x2 + 8, y2 - 6), (x2 + 8, y2 + 6), (x2 - 2, y2)], fill=color)

def generate_architecture_diagram():
    W, H = 1600, 1180
    img = Image.new("RGB", (W, H), "#F8FAFC")
    draw = ImageDraw.Draw(img)

    # Main Card
    draw_rounded_rect(draw, (30, 25, W - 30, H - 25), radius=16, fill="#FFFFFF", outline="#E2E8F0", width=2)

    # Top Header
    draw_rounded_rect(draw, (30, 25, W - 30, 120), radius=16, fill="#1E3A8A")
    draw.rectangle([30, 100, W - 30, 120], fill="#1E3A8A") # square bottom of header
    
    title_font = get_font(26, bold=True)
    subtitle_font = get_font(14, bold=False)
    draw.text((60, 45), "Smart Library System Architecture Overview", font=title_font, fill="#FFFFFF")
    draw.text((60, 82), "End-to-End Client Applications, API Gateway, Core Business Microservices, Storage & IoT Hardware Layer", font=subtitle_font, fill="#93C5FD")

    # Layer 1: Client Layer
    y_l1 = 145
    draw_rounded_rect(draw, (60, y_l1, W - 60, y_l1 + 140), radius=12, fill="#EFF6FF", outline="#BFDBFE", width=2)
    draw.text((80, y_l1 + 12), "1. CLIENT & USER INTERACTION LAYER", font=get_font(13, bold=True), fill="#1E40AF")
    
    clients = [
        ("Web Portal (Patrons & Staff)", "Next.js 14, React, Tailwind CSS, shadcn/ui", "#DBEAFE"),
        ("Mobile App (Virtual ID)", "React Native / Flutter (NFC & Camera QR)", "#DBEAFE"),
        ("Self-Checkout & Return Kiosk", "Electron / Touch UI (Serial & USB RFID)", "#DBEAFE"),
        ("Handheld Audit Wand App", "Android RFID Wand (Bluetooth / Wi-Fi)", "#DBEAFE")
    ]
    box_w = 345
    for i, (title, sub, bg) in enumerate(clients):
        bx = 80 + i * (box_w + 18)
        by = y_l1 + 40
        draw_rounded_rect(draw, (bx, by, bx + box_w, by + 80), radius=8, fill="#FFFFFF", outline="#93C5FD", width=1)
        draw.text((bx + 14, by + 16), title, font=get_font(13, bold=True), fill="#1E3A8A")
        draw.text((bx + 14, by + 44), sub, font=get_font(10.5, bold=False), fill="#4B5563")

    # Down Arrow 1
    draw_arrow(draw, (W//2, y_l1 + 140), (W//2, y_l1 + 175), color="#3B82F6", width=3)

    # Layer 2: API & Gateway Layer
    y_l2 = y_l1 + 175
    draw_rounded_rect(draw, (60, y_l2, W - 60, y_l2 + 130), radius=12, fill="#F0FDF4", outline="#BBF7D0", width=2)
    draw.text((80, y_l2 + 12), "2. API GATEWAY, REALTIME & IOT INGESTION LAYER", font=get_font(13, bold=True), fill="#166534")

    gateways = [
        ("REST & GraphQL API Gateway", "Traefik / Nginx (SSL, Rate-Limiting, Load Balancing)", "#DCFCE7"),
        ("MQTT Message Broker", "Mosquitto / EMQX (Low-Latency IoT Gate & Sensor Feeds)", "#DCFCE7"),
        ("WebSocket Server", "Socket.io (Real-Time Seat Occupancy & Chute Alerts)", "#DCFCE7")
    ]
    gw_w = 465
    for i, (title, sub, bg) in enumerate(gateways):
        bx = 80 + i * (gw_w + 22)
        by = y_l2 + 40
        draw_rounded_rect(draw, (bx, by, bx + gw_w, by + 72), radius=8, fill="#FFFFFF", outline="#86EFAC", width=1)
        draw.text((bx + 16, by + 15), title, font=get_font(13, bold=True), fill="#14532D")
        draw.text((bx + 16, by + 40), sub, font=get_font(10.5, bold=False), fill="#4B5563")

    # Down Arrow 2
    draw_arrow(draw, (W//2, y_l2 + 130), (W//2, y_l2 + 165), color="#22C55E", width=3)

    # Layer 3: Core Application Services
    y_l3 = y_l2 + 165
    draw_rounded_rect(draw, (60, y_l3, W - 60, y_l3 + 220), radius=12, fill="#FAF5FF", outline="#E9D5FF", width=2)
    draw.text((80, y_l3 + 12), "3. APPLICATION CORE SERVICES & ENGINES (NestJS / FastAPI / Go)", font=get_font(13, bold=True), fill="#6B21A8")

    services = [
        ("Auth & IAM Service", "SSO, OAuth2, JWT & Role-Based Access Control"),
        ("Catalog & Inventory", "ISBN Auto-Enrichment, MARC21, DDC Classification"),
        ("Circulation Engine", "Atomic Loans, Returns, Holds & SIP2 Protocol Adapter"),
        ("Dynamic Fine Engine", "Daily Overdue Matrix, Academic Holiday Exclusions"),
        ("Seat & Room Booking", "2D Interactive Floor Plan & 15-Min Auto-Release"),
        ("IoT Hardware Manager", "AFI/EAS Bit Toggling, Gate Alarms & Sensor Drivers")
    ]
    srv_w = 465
    for i, (title, sub) in enumerate(services):
        col = i % 3
        row = i // 3
        bx = 80 + col * (srv_w + 22)
        by = y_l3 + 42 + row * 82
        draw_rounded_rect(draw, (bx, by, bx + srv_w, by + 70), radius=8, fill="#FFFFFF", outline="#D8B4FE", width=1)
        draw.text((bx + 16, by + 14), title, font=get_font(13, bold=True), fill="#581C87")
        draw.text((bx + 16, by + 39), sub, font=get_font(10.5, bold=False), fill="#4B5563")

    # Down Arrow 3
    draw_arrow(draw, (450, y_l3 + 220), (450, y_l3 + 255), color="#A855F7", width=3)
    draw_arrow(draw, (1150, y_l3 + 220), (1150, y_l3 + 255), color="#A855F7", width=3)

    # Layer 4: Storage & Search
    y_l4 = y_l3 + 255
    draw_rounded_rect(draw, (60, y_l4, 715, y_l4 + 140), radius=12, fill="#FFFBEB", outline="#FDE68A", width=2)
    draw.text((80, y_l4 + 12), "4. DATA & PERSISTENCE LAYER", font=get_font(13, bold=True), fill="#92400E")

    storages = [
        ("PostgreSQL 16", "ACID Loans, Users, Fines, Book Copies"),
        ("Redis Cluster", "Distributed Seat Locks, Active Sessions"),
        ("Meilisearch", "Typo-Tolerant Fast Catalog Search (<20ms)")
    ]
    st_w = 210
    for i, (title, sub) in enumerate(storages):
        bx = 80 + i * (st_w + 18)
        by = y_l4 + 40
        draw_rounded_rect(draw, (bx, by, bx + st_w, by + 80), radius=8, fill="#FFFFFF", outline="#FCD34D", width=1)
        draw.text((bx + 12, by + 15), title, font=get_font(12, bold=True), fill="#78350F")
        draw.text((bx + 12, by + 38), sub, font=get_font(9.5, bold=False), fill="#4B5563")

    # Layer 5: Physical IoT & Hardware
    draw_rounded_rect(draw, (805, y_l4, W - 60, y_l4 + 140), radius=12, fill="#FEF2F2", outline="#FECACA", width=2)
    draw.text((825, y_l4 + 12), "5. PHYSICAL IOT & RFID HARDWARE LAYER", font=get_font(13, bold=True), fill="#991B1B")

    hardwares = [
        ("RFID Checkout Pad", "HF 13.56 MHz (ISO 15693 / 28560)"),
        ("EAS Security Gates", "AFI/EAS Bit Exit Alarm Detection"),
        ("Smart Return Chute", "Internal Antenna + Auto-Sorter Flap"),
        ("Seat Presence Sensors", "ESP32 / BLE Beacons / QR Badges")
    ]
    hw_w = 164
    for i, (title, sub) in enumerate(hardwares):
        bx = 825 + i * (hw_w + 14)
        by = y_l4 + 40
        draw_rounded_rect(draw, (bx, by, bx + hw_w, by + 80), radius=8, fill="#FFFFFF", outline="#FCA5A5", width=1)
        draw.text((bx + 10, by + 14), title, font=get_font(11, bold=True), fill="#7F1D1D")
        draw.text((bx + 10, by + 38), sub, font=get_font(9.2, bold=False), fill="#4B5563")

    # Bottom watermark/legend
    draw.text((60, H - 42), "Smart Library Management & Tracking System | Enterprise Architecture Blueprint", font=get_font(11, bold=False), fill="#94A3B8")

    out_path = r"e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\SMART LIBRARY APP\system_architecture_overview.png"
    img.save(out_path, "PNG", quality=95)
    print("Saved:", out_path)

def generate_erd_diagram():
    W, H = 1600, 1280
    img = Image.new("RGB", (W, H), "#F8FAFC")
    draw = ImageDraw.Draw(img)

    # Main Card
    draw_rounded_rect(draw, (30, 25, W - 30, H - 25), radius=16, fill="#FFFFFF", outline="#E2E8F0", width=2)

    # Top Header
    draw_rounded_rect(draw, (30, 25, W - 30, 120), radius=16, fill="#065F46")
    draw.rectangle([30, 100, W - 30, 120], fill="#065F46") # square bottom
    
    title_font = get_font(26, bold=True)
    subtitle_font = get_font(14, bold=False)
    draw.text((60, 45), "Smart Library Database Schema Blueprint", font=title_font, fill="#FFFFFF")
    draw.text((60, 82), "Relational Entity-Relationship Diagram (ERD): Users, Books, Copies, RFID Tags, Loans, Fines & Seats", font=subtitle_font, fill="#A7F3D0")

    def draw_table_card(x, y, w, title, header_bg, fields):
        row_h = 24
        header_h = 36
        card_h = header_h + len(fields) * row_h + 12
        # Card container
        draw_rounded_rect(draw, (x, y, x + w, y + card_h), radius=10, fill="#FFFFFF", outline="#CBD5E1", width=1)
        # Header
        draw_rounded_rect(draw, (x, y, x + w, y + header_h), radius=10, fill=header_bg)
        draw.rectangle([x, y + header_h - 10, x + w, y + header_h], fill=header_bg)
        draw.text((x + 14, y + 9), title, font=get_font(13, bold=True), fill="#FFFFFF")
        
        # Fields
        for idx, (f_name, f_type, tag) in enumerate(fields):
            fy = y + header_h + 8 + idx * row_h
            # Draw tag badge if any
            if tag == "PK":
                draw_rounded_rect(draw, (x + 12, fy - 1, x + 36, fy + 17), radius=4, fill="#FEE2E2")
                draw.text((x + 16, fy + 1), "PK", font=get_font(9.5, bold=True), fill="#991B1B")
                tx = x + 44
            elif tag == "FK":
                draw_rounded_rect(draw, (x + 12, fy - 1, x + 36, fy + 17), radius=4, fill="#DBEAFE")
                draw.text((x + 16, fy + 1), "FK", font=get_font(9.5, bold=True), fill="#1E40AF")
                tx = x + 44
            elif tag == "UK":
                draw_rounded_rect(draw, (x + 12, fy - 1, x + 36, fy + 17), radius=4, fill="#FEF3C7")
                draw.text((x + 16, fy + 1), "UK", font=get_font(9.5, bold=True), fill="#92400E")
                tx = x + 44
            else:
                tx = x + 18
            
            draw.text((tx, fy + 1), f_name, font=get_font(11, bold=True), fill="#1E293B")
            draw.text((x + w - 110, fy + 1), f_type, font=get_font(10.5, bold=False), fill="#64748B")

        return card_h

    # Layout: 3 Columns
    # Col 1: USERS, FINES, SEAT_BOOKINGS
    # Col 2: LOANS, SEATS
    # Col 3: BOOKS, BOOK_COPIES, RFID_TAGS

    c1_x = 60
    c2_x = 570
    c3_x = 1080
    cw = 460

    # USERS
    users_fields = [
        ("id", "UUID", "PK"),
        ("roll_number", "VARCHAR(50)", "UK"),
        ("full_name", "VARCHAR(100)", ""),
        ("email", "VARCHAR(100)", "UK"),
        ("role", "ENUM", ""),
        ("rfid_card_uid", "VARCHAR(64)", "UK"),
        ("max_borrow_limit", "INT", ""),
        ("is_active", "BOOLEAN", ""),
        ("created_at", "TIMESTAMP", "")
    ]
    u_h = draw_table_card(c1_x, 150, cw, "USERS (Patrons & Staff)", "#1E3A8A", users_fields)

    # FINES
    fines_fields = [
        ("id", "UUID", "PK"),
        ("loan_id", "UUID", "FK"),
        ("user_id", "UUID", "FK"),
        ("amount", "NUMERIC(10,2)", ""),
        ("status", "ENUM", ""),
        ("paid_at", "TIMESTAMP", "")
    ]
    f_h = draw_table_card(c1_x, 150 + u_h + 30, cw, "FINES (Penalties & Fees)", "#B45309", fines_fields)

    # SEAT_BOOKINGS
    seat_bk_fields = [
        ("id", "UUID", "PK"),
        ("user_id", "UUID", "FK"),
        ("seat_id", "UUID", "FK"),
        ("start_time", "TIMESTAMP", ""),
        ("end_time", "TIMESTAMP", ""),
        ("checked_in_at", "TIMESTAMP", ""),
        ("status", "ENUM", "")
    ]
    draw_table_card(c1_x, 150 + u_h + 30 + f_h + 30, cw, "SEAT_BOOKINGS (Space Reservations)", "#4338CA", seat_bk_fields)

    # LOANS
    loans_fields = [
        ("id", "UUID", "PK"),
        ("user_id", "UUID", "FK"),
        ("copy_id", "UUID", "FK"),
        ("borrowed_at", "TIMESTAMP", ""),
        ("due_date", "TIMESTAMP", ""),
        ("returned_at", "TIMESTAMP", ""),
        ("status", "ENUM", "")
    ]
    l_h = draw_table_card(c2_x, 150, cw, "LOANS (Active & Past Circulation)", "#0F766E", loans_fields)

    # SEATS
    seats_fields = [
        ("id", "UUID", "PK"),
        ("seat_identifier", "VARCHAR(20)", "UK"),
        ("room_name", "VARCHAR(50)", ""),
        ("floor_number", "INT", ""),
        ("has_power_outlet", "BOOLEAN", ""),
        ("qr_code_identifier", "VARCHAR(100)", "UK"),
        ("status", "ENUM", "")
    ]
    draw_table_card(c2_x, 150 + l_h + 40, cw, "SEATS (Study Desks & Rooms)", "#7C3AED", seats_fields)

    # BOOKS
    books_fields = [
        ("id", "UUID", "PK"),
        ("isbn", "VARCHAR(20)", "UK"),
        ("title", "VARCHAR(255)", ""),
        ("author", "VARCHAR(255)", ""),
        ("publisher", "VARCHAR(150)", ""),
        ("publication_year", "INT", ""),
        ("ddc_classification", "VARCHAR(50)", ""),
        ("cover_image_url", "TEXT", "")
    ]
    b_h = draw_table_card(c3_x, 150, cw, "BOOKS (Master Title Catalog)", "#047857", books_fields)

    # BOOK_COPIES
    copies_fields = [
        ("id", "UUID", "PK"),
        ("book_id", "UUID", "FK"),
        ("barcode", "VARCHAR(64)", "UK"),
        ("rfid_tag_uid", "VARCHAR(64)", "UK"),
        ("call_number", "VARCHAR(50)", ""),
        ("shelf_location", "VARCHAR(50)", ""),
        ("status", "ENUM", ""),
        ("eas_bit_active", "BOOLEAN", "")
    ]
    cp_h = draw_table_card(c3_x, 150 + b_h + 30, cw, "BOOK_COPIES (Physical Inventory)", "#0E7490", copies_fields)

    # RFID_TAGS
    rfid_fields = [
        ("id", "UUID", "PK"),
        ("epc_or_uid", "VARCHAR(64)", "UK"),
        ("copy_id", "UUID", "FK"),
        ("eas_security_bit", "BOOLEAN", ""),
        ("last_scanned_at", "TIMESTAMP", "")
    ]
    draw_table_card(c3_x, 150 + b_h + 30 + cp_h + 30, cw, "RFID_TAGS (Hardware Asset Binding)", "#BE185D", rfid_fields)

    # Connector Lines & Relationship Legend
    # Users -> Loans
    draw.line([c1_x + cw, 220, c2_x, 220], fill="#0284C7", width=2)
    draw.text((c1_x + cw + 15, 200), "1 : N (borrows)", font=get_font(10, bold=True), fill="#0369A1")

    # Book -> Book_copies
    draw.line([c3_x + cw//2, 150 + b_h, c3_x + cw//2, 150 + b_h + 30], fill="#059669", width=2)
    draw.text((c3_x + cw//2 + 8, 150 + b_h + 8), "1 : N (contains)", font=get_font(10, bold=True), fill="#047857")

    # Copies -> Loans
    draw.line([c3_x, 150 + b_h + 70, c2_x + cw, 240], fill="#0284C7", width=2)
    draw.text((c2_x + cw + 15, 230), "1 : N (issued in)", font=get_font(10, bold=True), fill="#0369A1")

    # Copies -> RFID_Tags
    draw.line([c3_x + cw//2, 150 + b_h + 30 + cp_h, c3_x + cw//2, 150 + b_h + 30 + cp_h + 30], fill="#DB2777", width=2)
    draw.text((c3_x + cw//2 + 8, 150 + b_h + 30 + cp_h + 8), "1 : 1 (bound to)", font=get_font(10, bold=True), fill="#BE185D")

    # Seats -> Seat_Bookings
    draw.line([c2_x, 150 + l_h + 100, c1_x + cw, 150 + u_h + 30 + f_h + 80], fill="#7C3AED", width=2)
    draw.text((c1_x + cw + 15, 150 + u_h + 30 + f_h + 60), "1 : N (allocated)", font=get_font(10, bold=True), fill="#6D28D9")

    # Legend at bottom
    draw.text((60, H - 42), "Database Engine: PostgreSQL 16 | ACID Enforced | Keys: PK = Primary Key, FK = Foreign Key, UK = Unique Key", font=get_font(11, bold=False), fill="#64748B")

    out_path = r"e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\SMART LIBRARY APP\database_schema_blueprint.png"
    img.save(out_path, "PNG", quality=95)
    print("Saved:", out_path)

if __name__ == "__main__":
    generate_architecture_diagram()
    generate_erd_diagram()
