# **Product Requirements Document (PRD)**

## **Government Public Library Management System**

# **Government Public Library Management System**

Version 1.0 · Functional, Technical & Security Requirements

Single Public Library

Primary Users

Citizens, Librarians, Admin

Catalogue

Public OPAC

Finance

Cash & Manual Entry

Deployment

Government-approved Hosting / NIC

## **1\. Executive Summary**

The Government Public Library Management System (GPLMS) is a centralized digital platform for managing the complete operations of a single public library. It will provide a public Online Public Access Catalogue (OPAC), book classification and inventory management, member registration, QR-based circulation, fee and fine management, payment receipts, reporting, and administrative controls.

The system will replace manual registers and disconnected spreadsheets with a searchable catalogue, controlled workflows, auditable financial records, and reliable reports.

### **1.1 Project Objectives**

1. Digitize the library catalogue and accession register.  
2. Enable citizens to search books and check availability online.  
3. Maintain accurate records for every physical book copy.  
4. Automate book issue, return, renewal, reservation and overdue calculations.  
5. Manage membership fees, fines, other approved charges, cash collections and receipts.  
6. Enforce role-based access, financial accountability and audit trails.  
7. Deploy the application on infrastructure approved by the relevant government department/NIC.

### **1.2 Project Scope**

In scope

* Public OPAC and library information website.  
* Staff authentication and internal dashboard.  
* Book, author, publisher, category and copy management.  
* DDC Classification, Book Number and Accession Number.  
* QR Code generation, label printing and camera scanning.  
* Member management and circulation.  
* Fee rules, fines, cash/manual payments, receipts and reversals.  
* Reports, Excel import/export, PDF generation and audit logs.  
* Security testing, backup/restore and User Acceptance Testing (UAT).

Out of scope for Version 1.0

* Multi-branch library administration.  
* Online payment gateway integration.  
* RFID hardware integration.  
* Automated integration with external government identity systems.  
* Automated procurement or accounting-system integration unless separately approved.

## **2\. Existing Implementation Status**

Based on the implementation checklist supplied by the project owner:

Reported task completion

## **17 / 19**

This reflects the supplied checklist, not an independent code or production audit.

Pending: Atomic Payment Allocation & Receipt Generation

Implement and test transactional payment posting, allocation validation, unique receipt numbering and safe reversal.

Pending: NIC Hosting, Backup/Restore & UAT

Complete the approved deployment, recovery testing and formal user acceptance process.

The PRD therefore describes the complete target system while identifying these two items as the reported outstanding work.

## **3\. User Roles and Access Control**

| Role | Responsibilities |
| ----- | ----- |
| Super Admin | Configure system, users, roles, security and global settings |
| Library Admin | Manage catalogue, members, policies, reports and operational approvals |
| Librarian | Manage books, accession records, issue/return, renewals and reservations |
| Accounts Operator | Record payments, allocate charges, print receipts and reconcile collections |
| Approving Officer | Approve authorized waivers, refunds, cancellations and exceptional transactions |
| Registered Member | View own loans, due dates, dues and eligible reservations |
| Public Visitor | Search the public catalogue and view library information |

All permissions must be enforced by the server and database, not only by hiding interface elements. Users must not approve their own exceptional transactions when segregation of duties is required by policy.

## **4\. Functional Requirements**

### **FR-01: Public OPAC**

The public website shall provide searchable access to the library catalogue.

* Search by title, author, ISBN, subject, publisher and language.  
* Filter by category, DDC classification, publication year and availability.  
* Display book title, authors, edition, publisher, description and shelf location.  
* Display copy availability based on the actual copy and loan records.  
* Provide pagination, sorting and search result counts.  
* Display library timings, address, rules and contact information.  
* Allow authenticated members to reserve eligible books, if reservation rules permit.  
* Prevent access to member contact details, payment history and staff-only records.  
* Use rate limiting and input validation to protect public search endpoints.

Acceptance criteria: A visitor can search a book without logging in and see accurate availability. Unavailable copies must not be presented as available.

### **FR-02: Book Catalogue and Classification**

The system shall separate the bibliographic record from the physical copy record.

Bibliographic information

* Title, subtitle, ISBN, edition and publication year.  
* Author(s), publisher, subject/category and language.  
* DDC Classification Number and Book Number.  
* Description, cover image and acquisition information.

Physical copy information

* Unique Accession Number.  
* Copy number and unique QR identifier.  
* Shelf, rack or location code.  
* Acquisition date, acquisition cost and condition.  
* Current status: Available, Issued, Reserved/Hold, Reference Only, Lost, Damaged, Missing or Withdrawn.

Additional requirements:

* Support multiple authors and multiple copies per title.  
* Prevent duplicate accession numbers.  
* Provide Excel/CSV import with validation and an error report.  
* Generate printable QR labels for individual copies.  
* Maintain stock verification and inventory adjustment history.  
* Retain transaction history when a book is withdrawn or deactivated.  
* Avoid deleting historical records through ordinary CRUD operations.

### **FR-03: Member Management**

The system shall maintain member registration and membership eligibility.

* Generate unique Member Numbers.  
* Support configurable member categories.  
* Record name, required contact information, registration date and expiry.  
* Track active, expired, suspended and closed membership status.  
* Configure borrowing limits and loan periods by membership category.  
* Support membership renewal and authorized changes.  
* Display current loans, overdue books, outstanding charges and historical transactions to authorized staff.  
* Allow members to view their own records through authenticated access.

Membership rules must be configurable and must not assume that every public library charges a registration fee.

### **FR-04: QR Scanner and Circulation**

The circulation module shall support camera-based scanning and manual identifier entry as a fallback.

Book issue

1. Authenticate the staff member.  
2. Identify the member by Member Number or QR Code.  
3. Scan the physical book's QR Code.  
4. Validate membership status, copy status, loan limit and any blocking policy.  
5. Create the loan and calculate the due date.  
6. Record the issuing staff member and timestamp.  
7. Show the transaction confirmation.

Book return

1. Scan the book's QR Code.  
2. Find the active loan.  
3. Record the return timestamp and authorized staff member.  
4. Calculate overdue fine using the applicable policy version.  
5. Update the copy's status and reservation queue.  
6. Display any resulting outstanding charge.

Renewal and reservation

* Renew only when policy allows and no conflicting reservation or other restriction applies.  
* Maintain a reservation queue with timestamps and status.  
* Apply configurable pickup deadlines and expiry rules.  
* Prevent duplicate active reservations where prohibited.  
* Use database transactions and locking to prevent two staff members from issuing the same copy simultaneously.

Acceptance criteria: A physical copy cannot have more than one active loan. An unsuccessful transaction must not leave the copy, loan and member records in contradictory states.

### **FR-05: Fee and Fine Management**

The system shall support configurable charges.

| Charge type | Requirement |
| ----- | ----- |
| Membership fee | Apply the configured fee to eligible registrations |
| Renewal fee | Apply the approved renewal rule |
| Late fine | Calculate based on overdue days and the applicable policy |
| Lost book | Record an approved replacement or recovery charge |
| Damaged book | Record an authorized assessment |
| Other fee | Support configurable, approved fee categories |
| Waiver/discount | Require permission, reason and audit history |

The system shall maintain charge amount, paid amount, outstanding balance, status and creation history.

Fine calculations must support configurable grace periods, daily rates, caps and rules for holidays or closed days. Policy changes must not silently rewrite historical charges.

### **FR-06: Cash and Manual Payment Management**

Online payment gateway integration is excluded from Version 1.0.

* Record cash and other explicitly approved manual payment methods.  
* Capture amount, date, payment method, operator and reference where applicable.  
* Allow payment against one or multiple eligible outstanding charges.  
* Support partial payments where permitted.  
* Prevent over-allocation beyond the valid outstanding balance.  
* Use a database transaction for payment posting and charge allocation.  
* Support idempotency to prevent duplicate posting after retries.  
* Provide daily collection and reconciliation reports.  
* Record discrepancies and authorized adjustments.  
* Do not treat an unverified bank/UPI reference as proof of successful receipt.

### **FR-07: Receipt Generation**

Each successfully posted payment must generate an auditable receipt.

Receipt requirements:

* Unique, sequential receipt number within the approved numbering scheme.  
* Library name and approved address/logo, if provided.  
* Member identifier and receipt date.  
* Charge descriptions and amounts.  
* Total paid, payment method and reference, where applicable.  
* Receiving operator and receipt status.  
* Printable format and PDF export.  
* Receipt reprint history where required.  
* Controlled cancellation and reversal with reason and authorization.

Critical acceptance criterion: Payment, allocations, receipt numbering and audit event must commit atomically. If any step fails, no partial successful payment or receipt must remain. Receipt numbers must not be duplicated under concurrent requests.

### **FR-08: Reports and Analytics**

The dashboard shall provide:

* Total catalogue titles and physical copies.  
* Available, issued, reserved, lost and damaged copies.  
* Active, expired and suspended members.  
* Current loans, overdue books and pending reservations.  
* Daily/monthly issue and return registers.  
* Accession register and stock verification reports.  
* Fee assessments, outstanding dues and waived charges.  
* Daily cash collection, receipts, reversals and reconciliation.  
* Category-wise, language-wise and DDC-wise inventory.  
* Staff activity and security audit reports.

Reports must support appropriate date filters and authorized CSV/Excel/PDF exports.

### **FR-09: Administration and Audit**

* Manage staff accounts, roles and permissions.  
* Configure library details and circulation policies.  
* Configure fee rules, receipt numbering and membership categories.  
* Maintain audit events for sensitive actions.  
* Record who performed an action, what changed and when.  
* Support backup, restoration and operational monitoring.  
* Provide controlled configuration changes with effective dates.  
* Ensure financial records and audit logs cannot be altered through normal user workflows.

## **5\. Database Design**

The database shall use PostgreSQL with UUID primary keys, foreign keys, unique constraints, indexes and appropriate `CHECK` constraints.

| Table | Important fields and purpose |
| ----- | ----- |
| `staff_users` | Identity, role, status, timestamps |
| `members` | Member number, name, category, expiry, status |
| `authors` | Author master |
| `publishers` | Publisher master |
| `categories` | Subject and category hierarchy |
| `books` | Title, ISBN, edition, publisher, DDC, book number |
| `book_authors` | Many-to-many relationship between books and authors |
| `book_copies` | Accession number, QR token, location, status |
| `library_policies` | Loan duration, limits, fine rules and effective dates |
| `loans` | Member, copy, issue/due/return timestamps and staff |
| `reservations` | Member, title/copy, queue position and status |
| `fee_charges` | Charge type, assessed amount, outstanding balance |
| `payments` | Payment amount, method, status, operator, idempotency key |
| `payment_allocations` | Payment-to-charge allocation amounts |
| `receipts` | Receipt number, payment, issue date and status |
| `audit_logs` | Actor, action, entity, timestamp and change details |

Additional tables may be introduced for `receipt_sequences`, `refunds`, `policy_versions` or approval requests if required by the detailed implementation.

### **5.1 Essential Constraints**

* Unique `member_no`, `accession_no` and `receipt_no`.  
* Unique QR token per physical copy.  
* One active loan per physical copy, enforced with a partial unique index.  
* Nonnegative charge and payment amounts.  
* Allocated amount must be positive and cannot exceed the applicable payment or charge balance.  
* Use `NUMERIC`, not floating-point types, for monetary values.  
* Enforce valid status transitions and foreign-key relationships.  
* Use indexes on title, ISBN, accession number, member number, loan status and due date.  
* Keep a separate immutable transaction history for payments, reversals and receipts.

The exact schema must be validated against the existing application before migrations are applied to a live database.

## **6\. Security, RLS and Backend Functions**

### **6.1 Row Level Security (RLS)**

Database access policies shall follow least privilege.

| Data | Public | Librarian | Accounts | Admin |
| ----- | ----- | ----- | ----- | ----- |
| Public catalogue | Read published records | Read/write as permitted | Read | Full permitted access |
| Member records | No access | Operational access | Minimum necessary | Authorized access |
| Loans | No access | Manage circulation | Read as required for billing | Authorized access |
| Charges | No access | Assess approved fines | Manage payments | Configure policies |
| Payments/receipts | No access | No financial write access unless assigned | Manage permitted transactions | Authorized oversight |
| Audit logs | No access | Restricted | Restricted | Authorized audit access |

RLS implementation depends on the selected authentication architecture. If PostgreSQL is hosted directly on approved government infrastructure, the application API must establish a trusted user identity and enforce permissions without exposing database credentials to browsers. If Supabase is approved, equivalent restrictive RLS policies must be configured.

### **6.2 Required Transactional SQL Functions**

| Function | Responsibility |
| ----- | ----- |
| `issue_book(...)` | Validate member/copy, lock the copy, create loan |
| `return_book(...)` | Close active loan, calculate fine and update copy |
| `renew_loan(...)` | Validate renewal policy and extend due date |
| `reserve_book(...)` | Create eligible reservation and queue entry |
| `assess_charge(...)` | Record approved membership fee, fine or other charge |
| `post_payment(...)` | Validate payment, allocate charges and create receipt atomically |
| `reverse_payment(...)` | Reverse a posted payment using authorization and audit trail |
| `calculate_overdue_fine(...)` | Calculate fine from the applicable policy |
| `get_collection_report(...)` | Return authorized financial summaries |

Sensitive functions must have tightly controlled execution permissions. If `SECURITY DEFINER` is used, the function owner, `search_path`, object references and execution grants must be explicitly secured.

### **6.3 Atomic Payment Posting**

The `post_payment(...)` operation must:

1. Authenticate and authorize the Accounts Operator.  
2. Validate the amount, method and idempotency key.  
3. Lock the relevant outstanding charges.  
4. Verify outstanding balances and allocation totals.  
5. Insert the payment record.  
6. Insert all payment allocations.  
7. Generate a unique receipt number using a concurrency-safe mechanism.  
8. Insert the receipt and audit event.  
9. Commit all changes in a single transaction.

If any operation fails, the transaction must roll back. Retrying the same idempotency key must not create another payment or receipt.

## **7\. Non-Functional Requirements**

| Area | Requirement |
| ----- | ----- |
| Performance | Target common OPAC searches within 2 seconds at the 95th percentile under the agreed test load |
| Availability | Agree on a service target with the hosting authority before production |
| Security | HTTPS, least privilege, secure sessions, validation and approved security testing |
| Privacy | Collect only necessary member information and restrict access by role |
| Accessibility | Responsive design, keyboard navigation and accessible labels |
| Compatibility | Current supported desktop/mobile browsers; camera permissions required for QR scanning |
| Data Integrity | Transactions, constraints, foreign keys and consistent balances |
| Auditability | Traceable administrative, circulation and financial actions |
| Backup | Approved backup schedule, retention and tested restore process |
| Recovery | Define Recovery Point Objective (RPO) and Recovery Time Objective (RTO) with the department |
| Maintainability | Version-controlled migrations, automated tests and deployment documentation |
| Localization | Support English and Hindi labels where required |
| Hosting | Government-approved/NIC infrastructure and security requirements |

The performance targets and recovery objectives must be confirmed during deployment planning rather than assumed to be guaranteed.

## **8\. Implementation and Delivery Plan**

The project owner has reported the following completed areas; they still require final verification against the repository and target environment.

Phase 1 — Foundation

Reported complete

React/Javascript/Vite, PostgreSQL migrations, staff login, role permissions, audit logging and error handling.

Phase 2 — Catalogue & OPAC

Reported complete

Book CRUD, classification, accession register, QR labels, public search and availability.

Phase 3 — Members & Circulation

Reported complete

Member registration, camera scanning, issue/return, renewal, reservations and overdue fine.

Phase 4 — Finance Finalization

1 task pending

Complete atomic payment allocation, receipt generation, idempotency and failure/retry tests. Verify the existing refund and collection workflows.

Phase 5 — Production Readiness

1 task pending

NIC deployment, backup/restore, security review, final UAT, operational documentation and sign-off.

### **Phase 4 — Finance Completion Tasks**

1. Review the current payment, fee, allocation and receipt tables.  
2. Add idempotency and concurrency-safe receipt numbering.  
3. Implement or finalize the atomic `post_payment(...)` function.  
4. Implement authorized payment reversal without deleting history.  
5. Add automated tests for partial payments, duplicate requests, invalid allocations, transaction failures and concurrent receipt creation.  
6. Verify receipt printing, collection totals and reconciliation.

### **Phase 5 — Deployment and UAT Tasks**

1. Confirm the approved hosting environment, domain, SSL and database access.  
2. Prepare production environment configuration and secrets management.  
3. Run database migrations against a staging environment.  
4. Verify staff permissions, public OPAC access and camera scanning.  
5. Test backup restoration and document recovery procedures.  
6. Conduct UAT with the Librarian, Accounts Operator and approving authority.  
7. Resolve critical/high-severity issues and obtain formal sign-off.  
8. Deploy to production only after the required government approvals.

## **9\. Testing and Acceptance Criteria**

The system will be accepted only when the following scenarios pass in the agreed test environment.

| Test ID | Scenario | Expected Result |
| ----- | ----- | ----- |
| AT-01 | Search catalogue without login | Public catalogue appears without private data |
| AT-02 | Scan a valid book QR Code | Correct copy record is identified |
| AT-03 | Two staff attempt to issue the same copy | Only one issue succeeds |
| AT-04 | Issue to expired member | Rejected according to configured policy |
| AT-05 | Return overdue book | Fine is calculated using the applicable policy |
| AT-06 | Post partial cash payment | Correct outstanding balance remains |
| AT-07 | Retry identical payment request | No duplicate payment or receipt |
| AT-08 | Force receipt-generation failure | Payment and allocations roll back |
| AT-09 | Unauthorized Accounts access | Financial write is denied |
| AT-10 | Reverse payment | Authorized reversal and complete audit history |
| AT-11 | Restore database backup | Data and application integrity are verified |
| AT-12 | Complete UAT | Authorized users approve documented workflows |

### **Definition of Done**

A feature is considered complete only when:

* Implementation and required migrations are committed.  
* Server-side authorization and validation are in place.  
* Automated tests pass.  
* Error and recovery scenarios are tested.  
* Reports and receipts match database transactions.  
* Documentation is updated.  
* No unresolved critical security or data-integrity defects remain.

## **10\. Project Deliverables**

The development team must provide:

1. Approved PRD and final UI designs.  
2. Source code and version-controlled database migrations.  
3. Database schema, constraints, indexes and transactional functions.  
4. Authentication, role permissions and RLS/API authorization rules.  
5. Public OPAC and internal staff dashboard.  
6. QR scanning, accession labels and circulation workflows.  
7. Fee, payment, receipt and reversal functionality.  
8. Reports and Excel/PDF export functionality.  
9. Automated tests and UAT test results.  
10. Deployment guide, environment configuration template and backup/restore guide.  
11. Security review results and production handover documentation.

## **11\. Assumptions and Decisions Requiring Approval**

The following policies must be approved by the library or relevant department before production:

* Membership eligibility, fees and renewal rules.  
* Loan periods, maximum books, grace periods and overdue fine rates.  
* Lost/damaged book recovery policy.  
* Waiver, refund and receipt cancellation approval rules.  
* Receipt numbering format and accounting/reconciliation procedures.  
* Personal data retention and privacy requirements.  
* Government hosting, identity provider, security and backup standards.  
* UAT sign-off authority and production go-live approval.

These are configurable business policies, not values the development team should invent.

## **12\. Final Project Success Criteria**

The project will be considered production-ready when citizens can reliably search the catalogue, librarians can manage books and circulation, authorized operators can collect and reconcile payments, receipts are uniquely identifiable and auditable, and the application passes security, recovery and UAT checks on approved infrastructure.

Current priority: Finish and verify atomic payment posting and receipt generation first, then complete NIC hosting, backup/restore testing and formal UAT.

