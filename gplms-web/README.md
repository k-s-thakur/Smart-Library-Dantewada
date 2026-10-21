# Government Public Library Management System (GPLMS) v1.0
### सार्वजनिक ई-पुस्तकालय प्रबंधन प्रणाली (NIC & National Digital Library Compliant)

A centralized web portal and administrative operating system engineered strictly according to the **Product Requirements Document (PRD 16 Oct)**.

---

## 🌟 Key Architecture & Features

1. **Citizen Public OPAC (Online Public Access Catalogue)**:
   - Search books by Title, Author, ISBN, Subject, and Dewey Decimal Classification (DDC).
   - Real-time physical copy counters (Available vs Issued vs Reference Only).
   - Stack shelf location guides (e.g. `Aisle 1, Rack B, Shelf 2`).
   - Book reservation queue for checked-out titles.
   - Library Timings, Entitlements & Citizen Helpdesk board.

2. **Accession Register & Classification (परिग्रहण पंजी)**:
   - AACR2 & DDC classification standards (DDC Class Code + Cutter Book Number).
   - Strict separation of Bibliographic Records from Physical Copy Records.
   - Unique sequential Accession Numbers (`ACC-YYYY-XXXX`).
   - Printable QR Spine & Cover Label generator.

3. **QR & Accession Circulation Desk**:
   - Fast Issue workflow: Scan/type Member No + Book QR/Accession token with atomic validation of member status, borrowing limits, and outstanding dues.
   - Fast Return workflow: Scan/type Book QR token with automatic overdue calculation and late fine creation per policy.
   - Live Active Loans Monitor with online renewals.

4. **Finance & Cash Receipts Engine (Phase 4)**:
   - Fee charges assessment (Membership fee, renewal fee, late fines, damaged/lost book charges).
   - Atomic cash/manual payment posting with allocation validation and idempotency keys.
   - Concurrency-safe unique sequential receipt generator (`RCP-YYYYMM-XXXXX`).
   - Official printable government receipt vouchers.
   - Authorized payment reversals with Approving Officer reason and immutable audit trails.
   - Daily cash collection and reconciliation register.

5. **Member Directory & Citizen Self-Service**:
   - Citizen registration with configurable quotas (`GENERAL_CITIZEN`, `STUDENT`, `SENIOR_CITIZEN`, `RESEARCHER`, `GOVT_STAFF`).
   - Digital Library Membership Card with barcode/QR.
   - Self-service dashboard for active loans, countdown to due dates, and receipts archive.

---

## 🚀 Quick Start Guide

### 1. Run Development Server
```bash
cd gplms-web
npm run dev
# Or on port 3001:
npx next dev -p 3001
```

### 2. Run Database Seed (Already seeded with rich data)
```bash
npx tsx src/lib/seed.ts
```

### 3. Run Acceptance Test Suite (AT-01 to AT-10)
```bash
npx tsx scripts/verify_gplms_acceptance_tests.ts
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 👥 Demo Role Credentials & Testing Switcher

The top navigation bar includes an instant one-click demo role switcher:
* **Super Admin**: System governance and administrative controls.
* **Librarian**: Circulation desk (issue/return), accession register, book cataloguing.
* **Accounts Operator**: Cash collections, charge allocations, and receipt issuance.
* **Approving Officer**: Authorized payment reversals and waiver oversight.
* **Citizen (Rahul Verma)**: Personal library card, active loans, and reservation queue.
