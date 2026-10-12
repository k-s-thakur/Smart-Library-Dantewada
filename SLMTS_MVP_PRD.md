# Smart Library Management & Tracking System — MVP PRD

**Product Name:** Smart Library Management & Tracking System  
**Abbreviation:** SLMTS  
**Version:** 1.0 — MVP  
**Status:** Engineering-Ready Draft  
**Product Type:** Institutional B2B Web Application + RFID/IoT Edge Devices  
**Primary Platform:** Responsive Web Application  
**Hardware:** RFID desk reader + optional gate readers  
**Primary Users:** Library administrators, librarians/staff, students/patrons  
**Deployment:** Cloud/server-based institutional application

---

## 1. Executive Summary

SLMTS MVP is a modern library management and tracking platform designed to replace manual library operations with a centralized digital system.

The MVP focuses on five core problems:

1. Managing books and individual book copies.
2. Managing students/patrons and their borrowing permissions.
3. Issuing and returning books efficiently using RFID.
4. Recording library entry/exit using RFID/NFC cards.
5. Providing administrators with basic operational and occupancy analytics.

The system will be designed so that advanced hardware capabilities can be added later without redesigning the core software architecture.

---

## 2. Product Vision

Create a library operating system where:

> **Every patron, every book copy, every circulation transaction, and every library visit has a reliable digital record.**

The MVP should make routine library operations:

- faster,
- more accurate,
- auditable,
- easier to manage,
- less dependent on manual registers,
- and ready for future automation.

---

## 3. MVP Goals

### G1 — Digital Library Inventory

Maintain a reliable digital inventory of:

- books,
- individual copies,
- ISBN,
- authors,
- publishers,
- editions,
- DDC,
- shelf/rack locations,
- barcode,
- RFID tag.

### G2 — Digital Patron Management

Maintain:

- student/patron identity,
- institutional ID,
- department,
- batch,
- contact information,
- membership status,
- borrowing limits.

### G3 — RFID-Based Circulation

Allow staff to:

- issue one book,
- issue multiple books,
- return books,
- identify books through RFID,
- automatically calculate due dates,
- calculate overdue fines.

### G4 — Library Entry/Exit

Allow patrons to tap their institutional RFID/NFC card to:

- enter,
- exit,
- create a visit session,
- calculate visit duration,
- calculate current occupancy.

### G5 — Operational Dashboard

Provide administrators with:

- books issued,
- books returned,
- overdue books,
- active patrons,
- current occupancy,
- daily visits,
- basic circulation statistics.

---

## 4. MVP Non-Goals

The following are explicitly excluded from MVP:

- AI recommendations
- AI book summaries
- AI chatbot
- facial recognition
- predictive analytics
- physical EAS/anti-theft pedestal integration
- complex multi-branch library support
- student study-time leaderboards
- eBook/audiobook distribution
- online fine payment
- full Koha feature parity
- advanced reservations/renewals unless separately approved

The software architecture should leave room for these capabilities later without making them MVP release blockers.

---

## 5. Target Users

### 5.1 Super Admin

Responsible for:

- system configuration,
- roles,
- permissions,
- circulation policies,
- fine rules,
- hardware devices,
- reports.

### 5.2 Librarian / Staff

Responsible for:

- cataloging,
- RFID tagging,
- issuing books,
- returning books,
- managing patrons,
- collecting fines,
- viewing operational dashboard.

### 5.3 Student / Patron

Can:

- search books,
- view availability,
- view current loans,
- view due dates,
- view fines,
- view personal library visits.

### 5.4 Hardware Device

Machine-to-machine actor responsible for:

- RFID scans,
- gate events,
- circulation reader events.

---

## 6. Core User Journeys

### Journey 1 — Add Book

**Admin → Books → Add Book**

1. Enter ISBN.
2. System attempts metadata lookup.
3. Staff reviews metadata.
4. Staff creates book record.
5. Staff adds individual copy.
6. Copy receives:
   - barcode,
   - RFID UID,
   - shelf location.
7. Copy status becomes `AVAILABLE`.

#### Acceptance Criteria

- ISBN may be manually entered if metadata lookup fails.
- Duplicate ISBN must not automatically create duplicate book records.
- Multiple physical copies must be supported.
- Every physical copy must have a unique identifier.

---

## 7. Book Data Model

Separate **bibliographic information** from **physical copies**.

### Book

Represents the intellectual work/edition.

Fields:

- `id`
- `isbn`
- `title`
- `subtitle`
- `authors`
- `publisher`
- `edition`
- `publication_year`
- `language`
- `category`
- `ddc_code`
- `cover_image_url`
- `created_at`
- `updated_at`

### Book Copy

Represents an individual physical copy.

Fields:

- `id`
- `book_id`
- `copy_number`
- `barcode`
- `rfid_tag_uid`
- `shelf_location`
- `status`
- `created_at`
- `updated_at`

Possible statuses:

```text
AVAILABLE
ISSUED
OVERDUE
LOST
DAMAGED
WITHDRAWN
PROCESSING
```

---

## 8. Patron Management

### Required Fields

```text
id
institutional_id
full_name
email
phone
department
program
batch
patron_type
status
card_uid
created_at
updated_at
```

### Patron Types

MVP supports configurable patron types:

```text
UNDERGRADUATE
POSTGRADUATE
FACULTY
STAFF
OTHER
```

Borrowing rules must **not be hard-coded** into application logic.

Instead:

```text
Patron Type
    ↓
Borrowing Policy
    ↓
Maximum Books
Loan Duration
Grace Period
Fine Rate
Renewal Limit
```

Example:

| Patron Type | Max Books | Loan Period |
|---|---:|---:|
| Undergraduate | 4 | 14 days |
| Postgraduate | 8 | 30 days |
| Faculty | 15 | 90 days |

---

## 9. RFID Card Management

### Card Binding

Staff can bind an institutional card to a patron.

Workflow:

```text
Open Patron
    ↓
Bind Card
    ↓
Tap RFID/NFC Card
    ↓
Read UID
    ↓
Check UID uniqueness
    ↓
Confirm
    ↓
Card linked to patron
```

### Security Requirement

**RFID UID must not be treated as a cryptographically secure identity credential.**

It identifies the card but should not be considered equivalent to a password or cryptographic authentication.

The system must support:

- active/inactive cards,
- lost-card blocking,
- replacement cards,
- card reassignment,
- audit logging.

---

## 10. Circulation Module

This is the **heart of the MVP**.

### 10.1 Issue Book

Workflow:

```text
Select/Tap Patron
        ↓
Read Book RFID Tags
        ↓
Validate Each Copy
        ↓
Validate Patron Eligibility
        ↓
Create Loan Transaction
        ↓
Set Book Status = ISSUED
        ↓
Display Confirmation
```

### Validation Rules

Before issuing:

- patron must be active,
- card must be valid,
- book must exist,
- book must be available,
- patron must not exceed borrowing limit,
- patron must not be blocked by configured policy,
- RFID tag must belong to the scanned copy.

---

## 11. Return Book

Workflow:

```text
Place Book(s) on RFID Reader
        ↓
Detect RFID Tags
        ↓
Find Active Loans
        ↓
Calculate Overdue
        ↓
Calculate Fine
        ↓
Close Loan
        ↓
Book Status = AVAILABLE
        ↓
Show Result
```

### Return Edge Cases

The system must handle:

1. Unknown RFID tag.
2. Book already returned.
3. Book marked lost.
4. Book not currently issued.
5. RFID tag assigned to another copy.
6. Multiple books where some are valid and some invalid.
7. Network failure during return.
8. Duplicate scan.

---

## 12. Transaction Atomicity

An issue/return operation must be treated as a **single transaction**.

Example:

```text
5 books scanned
    ↓
4 valid
1 invalid
```

Recommended default:

> **Validate the entire transaction first, then commit it.**

If validation fails:

```text
Validation Failed
    ↓
No database changes
    ↓
Show exact reason
```

This prevents inventory corruption.

---

## 13. Fine Management

Fine calculation must be policy-driven.

Required configuration:

```text
fine_rate_per_day
grace_period_days
maximum_fine
fine_start_rule
```

Example:

```text
Due Date: 10 Oct
Grace Period: 2 days
Fine: ₹2/day

Fine begins: 13 Oct
```

Fine calculation must be deterministic and reproducible.

The system should store the calculated amount rather than relying only on a future recalculation.

---

## 14. Gate Attendance

### MVP Hardware

One logical entry reader and one logical exit reader.

Architecture:

```text
RFID/NFC Reader
      ↓
Edge Controller
      ↓
HTTPS API
      ↓
Backend
      ↓
Database
      ↓
Dashboard
```

---

## 15. Gate Entry Logic

When a card is tapped:

1. Identify card.
2. Find patron.
3. Check:
   - card exists,
   - patron active,
   - patron already inside.
4. If not inside, create:

```text
gate_session
entry_time = server/event time
status = OPEN
```

5. Increase occupancy.

---

## 16. Gate Exit Logic

When a card is tapped:

1. Identify patron.
2. Find active session.
3. Record exit.
4. Calculate duration.
5. Close session.
6. Decrease occupancy.

---

## 17. Gate Edge Cases

The system must handle:

### Duplicate Entry

If patron is already inside:

```text
Do not create second session.
```

### Exit Without Entry

System should:

```text
record anomalous event
do not create negative occupancy
log for staff
```

### Lost Card

Card can be deactivated.

### Unknown Card

Gate must deny access.

### Network Failure

Edge device stores events locally.

---

## 18. Offline Edge Processing

Hardware devices may temporarily buffer events.

Architecture:

```text
Local Event Queue
      ↓
Persistent Storage
      ↓
Retry
      ↓
Server Acknowledgement
      ↓
Mark Delivered
```

Every hardware event must contain:

```text
event_id
device_id
event_type
card_uid
device_timestamp
sequence_number
```

### Idempotency Requirement

The backend must be **idempotent**.

If the same event arrives twice, for example:

```text
event_id = ABC123
```

the backend must process it only once.

---

## 19. Time Synchronization

The system must store:

```text
device_timestamp
server_received_at
```

Devices should synchronize time using NTP where available.

Server time remains authoritative for business logic unless an explicitly defined offline reconciliation rule applies.

---

## 20. RFID Circulation Reader

The MVP should support **one validated RFID desk reader model**.

Do not design the MVP around multiple reader technologies simultaneously.

Create a hardware abstraction:

```text
RFIDReader Interface
        ↓
Reader Driver
        ↓
Application
```

The application receives normalized events such as:

```json
{
  "reader_id": "DESK_PAD_01",
  "tag_uid": "E004010045612341"
}
```

The business layer should not depend on a specific physical reader.

---

## 21. Hardware Simulator

Before connecting physical hardware, engineering must have a simulator.

The simulator should support:

- virtual card tap,
- virtual book scan,
- virtual gate entry,
- virtual gate exit,
- network failure,
- duplicate event,
- delayed event.

This allows most backend development without physical hardware.

---

## 22. Student Portal

### Dashboard

- current loans,
- due dates,
- fines,
- borrowing limit,
- current library visit,
- personal visit history.

### Catalog

Search:

- title,
- author,
- ISBN,
- category,
- availability.

### Book Detail

Display:

```text
Title
Author
ISBN
Edition
Availability
Number of copies
Shelf location
```

---

## 23. OPAC

Public catalog search should not require authentication unless the institution chooses otherwise.

Search filters:

- Title
- Author
- ISBN
- Category
- Availability

---

## 24. Administrator Dashboard

### KPI Cards

```text
Total Books
Total Copies
Available Copies
Books Issued
Overdue Books
Registered Patrons
Currently Inside
Today's Visits
```

### Charts

- Daily visits
- Circulation
- Current occupancy
- Peak occupancy/time

Keep MVP analytics operational rather than predictive.

---

## 25. Privacy-Safe Analytics

Students can see:

> **My library visits**

Administrators can see:

> **Aggregated occupancy and visit statistics**

Individual student study-duration analytics should require explicit institutional policy.

### No leaderboard in MVP.

RFID-based identity-linked attendance is still personal-data processing even without facial recognition.

---

## 26. Audit Logging

Every sensitive administrative operation must generate an audit record.

Examples:

```text
BOOK_CREATED
BOOK_UPDATED
COPY_CREATED
RFID_BOUND
CARD_BOUND
LOAN_CREATED
LOAN_RETURNED
FINE_MODIFIED
PATRON_SUSPENDED
PATRON_UPDATED
ADMIN_LOGIN
PERMISSION_CHANGED
DEVICE_REGISTERED
```

Audit record:

```text
id
actor_id
action
entity_type
entity_id
timestamp
metadata
ip_address
```

Audit logs should be append-only from the normal administrative interface.

---

## 27. Roles & Permissions

Authorization must be enforced server-side.

| Capability | Admin | Librarian | Student |
|---|---:|---:|---:|
| View catalog | ✓ | ✓ | ✓ |
| Add book | ✓ | ✓ | — |
| Edit book | ✓ | ✓ | — |
| Issue book | ✓ | ✓ | — |
| Return book | ✓ | ✓ | — |
| Manage patrons | ✓ | ✓ | — |
| Configure policies | ✓ | — | — |
| View admin analytics | ✓ | ✓ | — |
| View own loans | — | — | ✓ |
| View own visits | — | — | ✓ |

---

## 28. Authentication

MVP must provide:

- secure login,
- session management,
- password hashing if local accounts are used,
- logout,
- password reset,
- role-based authorization.

Institutional SSO can be added later.

---

## 29. Security Requirements

Minimum requirements:

- HTTPS in production.
- Never store plaintext passwords.
- Server-side authorization on every protected endpoint.
- Authenticated hardware APIs.
- Server-side input validation.
- Rate limiting for login, public APIs, hardware endpoints, and sensitive operations.
- Audit logging for sensitive actions.

---

## 30. Hardware Authentication

Each hardware device receives:

```text
device_id
device_secret / credential
```

The backend validates:

```text
device_id
credential
device status
```

A card UID must never be sufficient to authenticate a hardware device.

---

## 31. Database

### Production

**PostgreSQL**

### Development/Test

SQLite may be used for local development where convenient.

---

## 32. Core Database Entities

```text
users
roles
permissions

patrons
patron_cards

books
book_copies

loans
fine_transactions

gate_sessions
gate_events

devices
device_events

borrowing_policies

audit_logs
```

---

## 33. Important Relationships

```text
BOOK
  │
  └── BOOK_COPY
          │
          └── LOAN
                  │
                  └── PATRON

PATRON
  │
  ├── PATRON_CARD
  │
  └── GATE_SESSION
          │
          └── GATE_EVENT

DEVICE
  │
  └── DEVICE_EVENT
```

---

## 34. ISBN/Data Modeling Rule

Do not assume:

```text
ISBN = unique physical book
```

An ISBN identifies a bibliographic edition/format, while multiple physical copies can share the same ISBN.

Therefore:

```text
BOOK
  ↓
many BOOK_COPIES
```

Each copy gets its own:

```text
barcode
rfid_tag_uid
copy_number
```

---

## 35. API Design

Base:

```text
/api/v1
```

### Authentication

```http
POST /auth/login
POST /auth/logout
POST /auth/refresh
```

### Books

```http
GET    /books
POST   /books
GET    /books/:id
PATCH  /books/:id
DELETE /books/:id
```

### Copies

```http
POST  /books/:id/copies
PATCH /copies/:id
POST  /copies/:id/bind-rfid
```

### Patrons

```http
GET   /patrons
POST  /patrons
GET   /patrons/:id
PATCH /patrons/:id
POST  /patrons/:id/bind-card
```

### Circulation

```http
POST /circulation/issue
POST /circulation/return
GET  /circulation/active
GET  /circulation/overdue
```

### Gate

```http
POST /gate/events
```

### Devices

```http
POST /devices/register
GET  /devices
PATCH /devices/:id
```

### Analytics

```http
GET /analytics/dashboard
GET /analytics/visits
GET /analytics/circulation
```

---

## 36. Hardware Event API

Use a generic device event API rather than coupling the API to a particular reader.

```http
POST /api/v1/device-events
```

Example:

```json
{
  "event_id": "evt_01J...",
  "device_id": "GATE_ENTRY_01",
  "event_type": "CARD_TAP",
  "card_uid": "E28011702000208169A1B2C3",
  "direction": "IN",
  "device_timestamp": "2026-10-08T10:30:00Z",
  "sequence_number": 1842
}
```

Response:

```json
{
  "accepted": true,
  "event_id": "evt_01J...",
  "action": "ACCESS_GRANTED"
}
```

---

## 37. Error Handling

Every API must return machine-readable errors.

Example:

```json
{
  "error": {
    "code": "PATRON_BORROW_LIMIT_REACHED",
    "message": "Patron has reached the maximum borrowing limit."
  }
}
```

Recommended error codes:

```text
PATRON_NOT_FOUND
PATRON_SUSPENDED
CARD_NOT_REGISTERED
CARD_DISABLED
BOOK_NOT_FOUND
BOOK_NOT_AVAILABLE
RFID_NOT_REGISTERED
BORROW_LIMIT_REACHED
INVALID_DEVICE
DUPLICATE_EVENT
NETWORK_ERROR
PERMISSION_DENIED
```

---

## 38. Offline Behavior

### Web Application

The web application does not promise full offline operation in MVP.

If the server is unavailable:

```text
Show system unavailable state.
Do not pretend transaction succeeded.
```

### Hardware

Hardware devices may temporarily buffer events.

The system must distinguish:

```text
RECEIVED
PROCESSED
FAILED
RETRYING
```

Never silently discard an event.

---

## 39. Observability

### Application Logs

Track:

- API errors,
- authentication failures,
- transaction failures,
- hardware failures.

### Hardware Status

```text
ONLINE
OFFLINE
DEGRADED
```

### Metrics

Track:

```text
API latency
API error rate
RFID scan failures
duplicate events
offline device duration
circulation failures
gate failures
```

---

## 40. Backup & Recovery

Production must include:

- automated PostgreSQL backup,
- backup retention policy,
- database restoration procedure,
- recovery testing.

Initial MVP targets:

```text
RPO: ≤ 24 hours
RTO: ≤ 4 hours
```

---

## 41. Non-Functional Requirements

### Performance

Target:

> p95 API response < 500 ms for normal database operations under defined MVP load.

### Search

Target:

> p95 catalog search < 500 ms under normal expected institutional load.

### RFID Circulation

The selected RFID reader/tag combination should successfully identify five compatible tags within 3 seconds in controlled test conditions, with an agreed read-success rate.

This is a hardware acceptance target, not an unconditional software guarantee.

### Gate Performance

Connected mode:

> p95 backend decision latency ≤ 400 ms from server receipt to decision response.

End-to-end hardware UX:

> target ≤ 1 second under normal network conditions.

---

## 42. Reliability

Initial production target:

```text
Availability ≥ 99.5%
```

excluding planned maintenance.

Hardware connectivity must be visible to administrators.

---

## 43. Accessibility

Target:

> WCAG 2.1 AA principles where practical for MVP.

Minimum:

- keyboard navigation,
- readable contrast,
- semantic labels,
- form validation,
- visible error states,
- screen-reader-compatible major workflows.

---

## 44. Privacy

The system processes personal information and library usage information.

Requirements:

### Data Minimization

Only collect information required for library operations.

### Access Control

Users access only data they are authorized to view.

### Student Privacy

Students cannot view other students':

- loans,
- fines,
- visit history,
- study duration.

### Retention

Institution configures retention policies for:

- gate sessions,
- audit logs,
- circulation history.

### Privacy Position

The product must not claim to be "privacy-preserving" solely because it avoids facial recognition. RFID-based identity-linked attendance remains personal-data processing.

---

## 45. Metadata Integration

ISBN metadata lookup is useful but non-critical.

Workflow:

```text
ISBN entered
     ↓
Metadata provider queried
     ↓
Metadata found?
   /       \
 Yes        No
 ↓          ↓
Prefill    Manual entry
```

External metadata failure must never prevent cataloging.

---

## 46. Dashboard Metrics

### Inventory

```text
Total Titles
Total Copies
Available
Issued
Overdue
Lost
Damaged
```

### Circulation

```text
Today's Issues
Today's Returns
Current Loans
Overdue Loans
```

### Attendance

```text
Today's Visitors
Currently Inside
Peak Occupancy
Average Visit Duration
```

---

## 47. Success Metrics

| Metric | MVP Target |
|---|---:|
| Successful issue transactions | ≥99% |
| Successful return transactions | ≥99% |
| Duplicate circulation transactions | 0 |
| Duplicate gate sessions caused by duplicate events | 0 |
| Catalog search p95 | ≤500 ms |
| API availability | ≥99.5% |
| RFID 5-book controlled test | ≤3 sec target |
| Device event loss | 0 after successful reconciliation |
| Manual attendance entries | Substantial reduction after deployment |
| Inventory discrepancy | Measured during pilot |

All metrics must have a defined measurement method and reporting period before production sign-off.

---

## 48. MVP Acceptance Criteria

### Test 1 — Add Book

```text
Create book
→ Create 3 copies
→ Assign 3 RFID tags
→ All copies appear as AVAILABLE
```

### Test 2 — Issue

```text
Tap patron card
→ Scan 3 books
→ Validate
→ Create 3 loans
→ Copies become ISSUED
```

### Test 3 — Return

```text
Scan 3 books
→ Find active loans
→ Close loans
→ Calculate fine
→ Copies become AVAILABLE
```

### Test 4 — Gate Entry

```text
Tap valid card
→ Create session
→ Occupancy +1
```

### Test 5 — Gate Exit

```text
Tap valid card
→ Close session
→ Calculate duration
→ Occupancy -1
```

### Test 6 — Duplicate Entry

```text
Tap same card twice
→ Only one active session
```

### Test 7 — Offline Hardware

```text
Disconnect network
→ Tap card
→ Event stored locally
→ Reconnect
→ Event uploaded
→ Backend processes exactly once
```

### Test 8 — Invalid Book

```text
Scan unknown RFID
→ Transaction rejected
→ No inventory corruption
```

### Test 9 — Borrow Limit

```text
Patron at maximum limit
→ Attempt another issue
→ Transaction rejected
```

### Test 10 — Suspended Patron

```text
Suspended patron
→ Attempt issue
→ Transaction rejected
```

---

## 49. Recommended Technical Architecture

```text
                 ┌─────────────────────┐
                 │   Student Web App   │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │   Admin Web App     │
                 └──────────┬──────────┘
                            │
                     HTTPS / REST
                            │
                 ┌──────────▼──────────┐
                 │     Backend API     │
                 │ Authentication      │
                 │ Circulation Engine  │
                 │ Policy Engine       │
                 │ Analytics            │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │    PostgreSQL       │
                 └─────────────────────┘

                            ▲
                            │
                      Device API
                            │
             ┌──────────────┴──────────────┐
             │                             │
      ┌──────▼──────┐              ┌──────▼──────┐
      │ RFID Desk   │              │ Gate Edge   │
      │ Reader      │              │ Controller  │
      └─────────────┘              └──────┬──────┘
                                          │
                                  RFID/NFC Reader
```

---

## 50. Suggested Technology Stack

### Frontend

```text
Next.js
TypeScript
React
Tailwind CSS
```

### Backend

Recommended for MVP:

```text
Next.js + TypeScript
```

provided clean service/domain boundaries are maintained.

A separate NestJS/Node.js backend can be introduced if backend scale or team structure justifies it.

### Database

```text
PostgreSQL
```

### ORM

```text
Prisma
```

### Authentication

Institution-controlled authentication with secure sessions.

### Hardware

```text
ESP32
+
selected production RFID reader
```

The business layer must remain independent of ESP32-specific APIs.

---

## 51. Development Phases

Do not commit the MVP to an arbitrary 21-day production deadline before hardware validation.

### Phase 0 — Architecture & Hardware Validation

Deliver:

- selected RFID reader,
- selected RFID tags,
- card technology,
- hardware simulator,
- reader protocol validation,
- read-range testing,
- stacked-book testing.

### Phase 1 — Software Foundation

Build:

- authentication,
- roles,
- database,
- books,
- copies,
- patrons,
- policies,
- audit logs.

### Phase 2 — Circulation

Build:

- issue,
- return,
- RFID binding,
- fines,
- transaction history,
- error handling.

### Phase 3 — Gate Attendance

Build:

- device registration,
- gate events,
- entry,
- exit,
- occupancy,
- offline buffering,
- reconciliation.

### Phase 4 — Student Portal

Build:

- OPAC,
- loans,
- fines,
- personal visit history.

### Phase 5 — Dashboard & Pilot

Build:

- operational dashboard,
- reports,
- monitoring,
- backup,
- deployment,
- pilot testing.

---

## 52. MVP Hardware Strategy

Do not purchase large quantities of hardware before validation.

Initial pilot:

```text
1 RFID desk reader
1 gate-entry reader
1 gate-exit reader
20–50 RFID book tags
10–20 RFID cards
1 ESP32/edge controller
```

Test:

- different book sizes,
- metal components,
- stacked books,
- tag placement,
- reader distance,
- orientation,
- interference,
- false reads,
- missed reads.

Scale procurement only after validation.

---

## 53. Future Roadmap

### V1.1

- reservations,
- renewals,
- email/SMS notifications,
- better reports,
- bulk import/export.

### V1.2

- EAS integration,
- automated security gates,
- multi-branch libraries,
- advanced hardware monitoring.

### V2

- advanced analytics,
- recommendation engine,
- mobile application,
- SSO,
- payment integration.

### V3

- AI assistant,
- semantic search,
- predictive analytics,
- advanced inventory tracking.

---

## 54. Major Product Decision

The product should be positioned as:

> **Library Operations + RFID Automation Platform**

not:

> **AI Smart Library**

The actual MVP differentiator is reliable operational automation.

---

## 55. MVP Release Definition

### Software

- [ ] Authentication works
- [ ] RBAC works
- [ ] Books work
- [ ] Book copies work
- [ ] Patrons work
- [ ] RFID binding works
- [ ] Issue works
- [ ] Return works
- [ ] Fine calculation works
- [ ] Gate entry works
- [ ] Gate exit works
- [ ] Occupancy works
- [ ] Offline event reconciliation works
- [ ] Audit logging works
- [ ] Dashboard works
- [ ] Student portal works

### Hardware

- [ ] RFID reader selected
- [ ] RFID tags validated
- [ ] Card technology validated
- [ ] Reader reliability tested
- [ ] Edge controller tested
- [ ] Offline buffering tested
- [ ] Duplicate events tested
- [ ] Hardware failure tested

### Security

- [ ] HTTPS
- [ ] Authentication
- [ ] Authorization
- [ ] Device authentication
- [ ] Input validation
- [ ] Audit logging
- [ ] Backup
- [ ] Recovery test

### Product

- [ ] Library staff pilot completed
- [ ] Inventory migrated
- [ ] Staff trained
- [ ] Error workflows tested
- [ ] Performance benchmark completed
- [ ] Privacy policy approved by institution

---

## 56. Final Product Verdict

The original PRD had a strong product concept but attempted to combine library management, RFID, IoT, anti-theft, attendance, analytics, privacy, hardware, and automation into one release.

The MVP should instead focus on:

> **Books → Copies → Patrons → RFID Circulation → Gate Visits → Dashboard**

These six areas should be made reliable before expanding the system.

### MVP Readiness

**Product concept:** Strong  
**MVP feasibility:** High after hardware validation  
**Engineering clarity:** High  
**Hardware risk:** Manageable  
**Scope:** Controlled  
**Future extensibility:** High

---

## 57. Minimum Changes Before Sprint 1

1. **Freeze MVP scope.**
2. **Select one RFID book-reader technology and one card technology.**
3. **Validate actual RFID hardware before committing to performance targets.**
4. **Finalize PostgreSQL schema and transaction boundaries.**
5. **Define authentication/RBAC.**
6. **Define device authentication and event idempotency.**
7. **Create hardware simulator.**
8. **Create acceptance tests for issue, return, gate entry, gate exit, and offline reconciliation.**
9. **Define privacy/data-retention policy with the institution.**
10. **Define production backup and recovery procedures.**
11. **Build the software foundation before scaling hardware procurement.**
12. **Run a controlled library pilot before declaring the MVP production-ready.**

---

**Document status:** MVP Engineering-Ready Draft  
**Next artifact:** Technical Design Document (TDD) + Database ERD + API Contract + UI/UX Screen Specification + Hardware Integration Specification
