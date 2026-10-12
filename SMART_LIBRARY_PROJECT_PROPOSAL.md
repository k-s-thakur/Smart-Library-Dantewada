# Smart Library Management & Tracking System (SLMTS)
### Comprehensive Project Proposal, System Architecture & Technical Specifications

---

## 1. Executive Summary

Traditional library management systems rely heavily on manual barcode scanning, paper slips, and physical desk checkouts. These legacy workflows suffer from long queues, inventory misplacement, book theft, inefficient space utilization, and lack of real-time asset visibility.

The **Smart Library Management & Tracking System (SLMTS)** is an IoT-enabled, event-driven next-generation platform designed for universities, colleges, and research institutions. By combining **High-Frequency RFID (ISO 15693 / ISO 28560)**, **anti-theft Electronic Article Surveillance (EAS)**, **self-service kiosks**, **automated return drop boxes**, and **real-time seat/study room booking**, this system provides complete end-to-end automation for books, students, and staff.

---

## 2. System Architecture

The platform follows a modern **Modular Monolith / Microservices** architecture with event-driven hardware integration.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Web Portal         |  | Mobile App           |  | Self-Checkout Kiosks      |  |
|  | (Next.js/Tailwind) |  | (React Native/Expo)  |  | (Electron / Touch UI)     |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                             API & IOT GATEWAY LAYER                               |
|  +-------------------------------------+  +------------------------------------+  |
|  | REST / GraphQL API Gateway (Nginx)  |  | MQTT / WebSocket Broker (Mosquitto)|  |
|  +-------------------------------------+  +------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                               CORE BACKEND SERVICES                               |
|  +------------------+  +--------------------+  +-------------------------------+  |
|  | Auth & RBAC      |  | Catalog & Metadata |  | Circulation & Kiosk Engine    |  |
|  +------------------+  +--------------------+  +-------------------------------+  |
|  +------------------+  +--------------------+  +-------------------------------+  |
|  | Smart Fine Engine|  | Seat & Room Booking|  | IoT & EAS Gate Alert Service  |  |
|  +------------------+  +--------------------+  +-------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                             DATA & PERSISTENCE LAYER                              |
|  +--------------------------+  +-----------------------+  +--------------------+  |
|  | PostgreSQL (ACID Data)   |  | Redis (Locks & Cache) |  | Meilisearch (Books)|  |
|  +--------------------------+  +-----------------------+  +--------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Functional Modules

### 3.1 Book Inventory & Tracking Management
* **Dual Identification (RFID + Barcode/QR)**:
  * **HF RFID (13.56 MHz, ISO 15693 / ISO 28560)** tags pasted onto the inside back cover of each book. Enables reading multiple stacked books at once without line-of-sight.
  * Standard Code 128 / QR codes printed on spine labels for hybrid optical scanning.
* **Auto-Cataloging via ISBN / APIs**:
  * Integrates with Google Books API and OpenLibrary API to automatically fetch title, author, publisher, cover image, synopsis, and Dewey Decimal Classification (DDC) upon entering an ISBN.
* **Smart Shelf & Misplacement Detection**:
  * Shelf antennas periodically sweep RFID tags to identify books placed on wrong shelves or bays.
* **Anti-Theft EAS (Electronic Article Surveillance) Gates**:
  * Each tag contains an **EAS / AFI** security bit.
  * When checked out properly at a desk or kiosk, the security bit is deactivated.
  * If an unissued book passes through the entrance/exit pedestals, an alarm sounds, an alert is dispatched, and a camera frame is logged.
* **Handheld Inventory Wand**:
  * Staff sweep an RFID wand across shelves to inventory up to 50 books per second, producing an instant variance report of missing or misplaced volumes.

---

### 3.2 Student, Faculty & Staff Management
* **Role-Based Access Control (RBAC)**:
  * **Super Admin**: System configuration, branch libraries, audit logs.
  * **Librarian / Circulation Staff**: Physical checkouts, inventory auditing, fee waivers, catalog editing.
  * **Student / Patron**: Catalog search, digital card, book reservations, seat booking, payment of fines.
  * **Faculty / Researcher**: Extended borrowing privileges (e.g., up to 15 books for 90 days).
* **Borrowing Rules Matrix**:
  | Role | Max Books Allowed | Loan Duration | Max Renewals | Grace Period |
  | :--- | :--- | :--- | :--- | :--- |
  | **Undergraduate** | 4 books | 14 days | 2 times | 24 hours |
  | **Postgraduate** | 8 books | 30 days | 2 times | 48 hours |
  | **Faculty / Staff** | 15 books | 90 days | 3 times | 5 days |
* **Virtual Digital Library Card**:
  * Mobile app provides a dynamic, time-rotating QR code or NFC Mifare card emulation to prevent credential sharing and screenshot misuse.

---

### 3.3 Automated Circulation & Self-Service
* **Self-Checkout Kiosk**:
  1. Patron scans their digital ID card or campus badge.
  2. Patron stacks 1 to 5 books onto the RFID pad.
  3. The system verifies borrower eligibility and creates loan records in a single ACID transaction.
  4. The kiosk automatically flips the EAS security bits to "Authorized".
  5. A digital receipt is dispatched via email and mobile push notification.
* **24/7 Smart Return Drop Box (Book Chute)**:
  * External or wall-mounted chute fitted with an internal RFID reader.
  * Student drops the book in $\rightarrow$ the reader detects the tag $\rightarrow$ the system marks the book as returned $\rightarrow$ the EAS bit is re-armed $\rightarrow$ an internal sorting flap drops the book into the designated trolley.
* **Automated Fine & Penalty Engine**:
  * Dynamic calculation per day overdue.
  * Automatically respects academic calendars, campus closures, and national holidays.
  * Integrated payment gateways (Stripe / Razorpay / UPI) allow patrons to clear fines instantly and auto-lift borrowing blocks.

---

### 3.4 Smart Seat & Study Room Booking
* **Interactive 2D Floor Plan**:
  * Real-time visual availability map of quiet study carrels, group discussion rooms, and computer stations.
* **Reservation Workflow & No-Show Auto-Release**:
  * Patrons reserve a desk for 1–4 hour slots.
  * **15-Minute Grace Period**: The user must scan the physical QR code on the desk or trigger BLE beacon verification within 15 minutes of slot start time.
  * If unconfirmed, the reservation is auto-cancelled and made available to other students.
* **IoT Smart Room Door Locks**:
  * Smart electronic locks on group study rooms unlock only when the registered student's badge or app is scanned during their reserved window.

---

## 4. Hardware & IoT Architecture

| Component | Standard / Model Specification | Purpose |
| :--- | :--- | :--- |
| **RFID Book Tags** | ISO 15693 / ISO 28560 (13.56 MHz HF) | Asset identification and anti-theft tracking |
| **Desktop RFID Pad** | Multi-tag HF Reader (Feig / Impinj / Nordic) | Simultaneous checkout/check-in of multiple books |
| **EAS Security Gates** | Dual-pedestal HF EAS antenna gates | Exit detection for unauthorized items |
| **Inventory Wand** | Portable HF/UHF Handheld Reader with Bluetooth | Rapid shelf audits and stocktaking |
| **Microcontrollers** | ESP32 / Raspberry Pi 4 | Drop box sensors, smart lock relays, environmental monitoring |
| **Desk QR Identifiers** | Laser-etched tamper-proof QR code plates | Individual study desk check-in confirmation |
| **Protocols** | 3M SIP2, NISO NCIP, MQTT, WebSockets | Compatibility with standard library hardware and IoT systems |

---

## 5. Database Schema (PostgreSQL)

```sql
-- Users & Roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'LIBRARIAN', 'ADMIN')),
    rfid_card_uid VARCHAR(64) UNIQUE,
    max_borrow_limit INT DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Master Book Catalog
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(150),
    publication_year INT,
    ddc_classification VARCHAR(50),
    cover_image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Physical Book Copies
CREATE TABLE book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    barcode VARCHAR(64) UNIQUE NOT NULL,
    rfid_tag_uid VARCHAR(64) UNIQUE,
    call_number VARCHAR(50) NOT NULL,
    shelf_location VARCHAR(50),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'MAINTENANCE')),
    eas_bit_active BOOLEAN DEFAULT TRUE
);

-- Circulation Loans
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    copy_id UUID REFERENCES book_copies(id),
    borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE'))
);

-- Overdue Fines
CREATE TABLE fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'WAIVED')),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Study Desks & Rooms
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_identifier VARCHAR(20) UNIQUE NOT NULL,
    room_name VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    has_power_outlet BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE'))
);

-- Seat Reservations
CREATE TABLE seat_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    seat_id UUID REFERENCES seats(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED'))
);
```

---

## 6. Implementation Roadmap

```
+-----------------------------------------------------------------------------+
| Phase 1: Core Foundation & Catalog                                          |
| - PostgreSQL database schema & migration setup                              |
| - Authentication service with Role-Based Access Control                     |
| - Book catalog management with ISBN auto-fill (Google Books API)            |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| Phase 2: Circulation Engine & Staff Portal                                  |
| - Manual desk checkout & check-in with Barcode / QR                         |
| - Dynamic fine calculation engine with academic calendar awareness          |
| - Patron management & borrowing limit policies                              |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| Phase 3: Hardware Integration & Self-Service Kiosks                         |
| - RFID Reader Pad driver integration (ISO 15693 / 28560)                    |
| - Anti-theft EAS bit toggle logic & exit gate alarm bridge                  |
| - Self-checkout kiosk interface & smart book drop chute                     |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| Phase 4: Space Utilization & Mobile Ecosystem                               |
| - Interactive 2D library floor map for seat & room reservations             |
| - 15-minute auto-release check-in workflow via QR code                      |
| - Mobile app (Virtual student badge, book search, push notifications)       |
+-----------------------------------------------------------------------------+
```

---

## 7. Security, Privacy & Compliance
* **Reader Privacy (FERPA / GDPR)**: Historical loan records are automatically anonymized after books are returned and fines are settled to protect reader confidentiality.
* **Tamper Resistance**: Exit security gates operate autonomously at the hardware level, sounding an alarm even if the local network is disconnected.
* **Resilient Offline Mode**: Self-checkout kiosks store pending transactions in local encrypted storage and sync automatically when internet connectivity resumes.
