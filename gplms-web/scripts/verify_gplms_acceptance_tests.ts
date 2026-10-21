import { prisma } from "../src/lib/prisma";
import { searchCatalogue, getBookDetails } from "../src/lib/services/catalogue.service";
import { issueBook, returnBook, renewLoan, reserveBook } from "../src/lib/services/circulation.service";
import { assessCharge, postPayment, reversePayment, getReceiptDetails, getDailyCollectionReport } from "../src/lib/services/finance.service";

async function runGplmsAcceptanceTests() {
  console.log("==================================================================");
  console.log("   GPLMS FULL ACCEPTANCE TEST SUITE (PRD 16 OCT SECTION 9)       ");
  console.log("   VERIFYING AT-01 THROUGH AT-10 & CONCURRENCY CONSTRAINTS       ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${testName} ${detail ? `- ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // TEST 1 — AT-01: Public OPAC Search without login
  try {
    const opacRes = await searchCatalogue({ query: "Wings of Fire" });
    const book = opacRes.items[0];
    const hasCopyData = book && book.availableCopies !== undefined;
    assert(
      opacRes.items.length > 0 && hasCopyData,
      "AT-01",
      "Search catalogue without login",
      `Found "${book?.title}" with ${book?.availableCopies}/${book?.totalCopies} copies available`
    );
  } catch (err: any) {
    assert(false, "AT-01", "Search catalogue without login", err.message);
  }

  // TEST 2 — AT-02: Scan valid book QR code / Accession No
  try {
    const copy = await prisma.bookCopy.findUnique({
      where: { accessionNo: "ACC-2026-0002" },
      include: { book: true },
    });
    assert(
      copy !== null && copy.qrCodeToken === "QR-GPLMS-ACC-2026-0002" && copy.status === "AVAILABLE",
      "AT-02",
      "Scan a valid book QR Code / Accession No",
      `Identified copy ACC-2026-0002 on "${copy?.shelfLocation}"`
    );
  } catch (err: any) {
    assert(false, "AT-02", "Scan a valid book QR Code / Accession No", err.message);
  }

  // TEST 3 — AT-03: Two staff attempt to issue the same copy (Atomic Locking)
  try {
    const memberA = await prisma.member.findUnique({ where: { memberNo: "GPL-2026-0002" } }); // Priya
    const memberB = await prisma.member.findUnique({ where: { memberNo: "GPL-2026-0003" } }); // Dr. Sen

    let successCount = 0;
    let failCount = 0;

    const [resA, resB] = await Promise.allSettled([
      issueBook({
        memberIdentifier: memberA!.id,
        copyIdentifier: "ACC-2026-0002",
        actorId: "staff_op_1",
      }),
      issueBook({
        memberIdentifier: memberB!.id,
        copyIdentifier: "ACC-2026-0002",
        actorId: "staff_op_2",
      }),
    ]);

    if (resA.status === "fulfilled") successCount++; else failCount++;
    if (resB.status === "fulfilled") successCount++; else failCount++;

    const updatedCopy = await prisma.bookCopy.findUnique({ where: { accessionNo: "ACC-2026-0002" } });

    assert(
      successCount === 1 && failCount === 1 && updatedCopy?.status === "ISSUED",
      "AT-03",
      "Two staff attempt to issue same copy concurrently",
      "Exactly one issue succeeded; second was rejected with conflict protection"
    );
  } catch (err: any) {
    assert(false, "AT-03", "Two staff attempt to issue same copy concurrently", err.message);
  }

  // TEST 4 — AT-04: Issue to expired or suspended member
  try {
    const expiredMember = await prisma.member.create({
      data: {
        memberNo: "GPL-EXP-9999",
        fullName: "Expired Citizen",
        email: "expired.citizen@example.gov.in",
        category: "GENERAL_CITIZEN",
        status: "ACTIVE",
        expiryDate: new Date("2020-01-01"), // Expired
      },
    });

    let caught = false;
    try {
      await issueBook({
        memberIdentifier: expiredMember.id,
        copyIdentifier: "ACC-2026-0004",
        actorId: "librarian",
      });
    } catch {
      caught = true;
    }

    assert(
      caught,
      "AT-04",
      "Issue to expired member",
      "Transaction properly rejected due to expired membership validity"
    );
  } catch (err: any) {
    assert(false, "AT-04", "Issue to expired member", err.message);
  }

  // TEST 5 — AT-05: Return overdue book & verify fine calculation
  try {
    // Create simulated overdue loan
    const testCopy = await prisma.bookCopy.findUnique({ where: { accessionNo: "ACC-2026-0004" } });
    const member = await prisma.member.findUnique({ where: { memberNo: "GPL-2026-0001" } });

    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 10); // 10 days overdue

    const overdueLoan = await prisma.loan.create({
      data: {
        copyId: testCopy!.id,
        memberId: member!.id,
        issuedAt: new Date(Date.now() - 25 * 86400000),
        dueDate: pastDueDate,
        status: "ACTIVE",
        issuedBy: "librarian",
      },
    });

    await prisma.bookCopy.update({
      where: { id: testCopy!.id },
      data: { status: "ISSUED" },
    });

    const returnRes = await returnBook({
      copyIdentifier: testCopy!.accessionNo,
      actorId: "librarian",
    });

    assert(
      returnRes.isOverdue && returnRes.assessedFineAmount > 0 && returnRes.feeCharge !== null,
      "AT-05",
      "Return overdue book",
      `Assessed fine of ₹${returnRes.assessedFineAmount} based on policy rate & grace period`
    );
  } catch (err: any) {
    assert(false, "AT-05", "Return overdue book", err.message);
  }

  // TEST 6 — AT-06: Post partial cash payment & verify remaining balance
  let paymentRecord: any;
  let assessedCharge: any;
  try {
    const member = await prisma.member.findUnique({ where: { memberNo: "GPL-2026-0001" } });
    assessedCharge = await assessCharge({
      memberId: member!.id,
      chargeType: "DAMAGED_BOOK",
      amount: 200.0,
      description: "Water damage assessment on reference manual",
      actorId: "librarian",
    });

    const payRes = await postPayment({
      memberId: member!.id,
      amount: 75.0, // Partial payment
      paymentMethod: "CASH",
      idempotencyKey: "PAY-AT06-KEY",
      operatorId: "operator_accounts",
      allocations: [{ chargeId: assessedCharge.id, amount: 75.0 }],
    });

    paymentRecord = payRes.payment;
    const updatedCharge = await prisma.feeCharge.findUnique({ where: { id: assessedCharge.id } });

    assert(
      payRes.receipt !== null &&
        updatedCharge?.paidAmount === 75.0 &&
        updatedCharge?.balance === 125.0 &&
        updatedCharge?.status === "PARTIALLY_PAID",
      "AT-06",
      "Post partial cash payment",
      `Paid ₹75 against ₹200; remaining balance ₹125; Receipt #${payRes.receipt?.receiptNo}`
    );
  } catch (err: any) {
    assert(false, "AT-06", "Post partial cash payment", err.message);
  }

  // TEST 7 — AT-07: Idempotent replay of identical payment request
  try {
    const member = await prisma.member.findUnique({ where: { memberNo: "GPL-2026-0001" } });
    const replayRes = await postPayment({
      memberId: member!.id,
      amount: 75.0,
      paymentMethod: "CASH",
      idempotencyKey: "PAY-AT06-KEY", // identical key
      operatorId: "operator_accounts",
      allocations: [{ chargeId: assessedCharge.id, amount: 75.0 }],
    });

    const payCount = await prisma.payment.count({ where: { idempotencyKey: "PAY-AT06-KEY" } });
    assert(
      replayRes.idempotentReplay === true && payCount === 1,
      "AT-07",
      "Retry identical payment request",
      "Safely returned existing receipt without creating double charges or duplicate receipts"
    );
  } catch (err: any) {
    assert(false, "AT-07", "Retry identical payment request", err.message);
  }

  // TEST 8 — AT-08: Force failure / invalid allocation (Rollback Verification)
  try {
    const prePayments = await prisma.payment.count();
    const preReceipts = await prisma.receipt.count();
    let thrown = false;

    try {
      await postPayment({
        memberId: assessedCharge.memberId,
        amount: 50.0,
        paymentMethod: "CASH",
        operatorId: "op",
        allocations: [{ chargeId: "non_existent_charge_id_999", amount: 50.0 }],
      });
    } catch {
      thrown = true;
    }

    const postPayments = await prisma.payment.count();
    const postReceipts = await prisma.receipt.count();

    assert(
      thrown && prePayments === postPayments && preReceipts === postReceipts,
      "AT-08",
      "Force receipt-generation failure / invalid allocation",
      "Atomicity confirmed: zero partial payments or orphaned receipts generated"
    );
  } catch (err: any) {
    assert(false, "AT-08", "Force receipt-generation failure / invalid allocation", err.message);
  }

  // TEST 9 — Concurrency-Safe Sequential Receipt Numbers
  try {
    const member = await prisma.member.findUnique({ where: { memberNo: "GPL-2026-0003" } });
    const ch1 = await assessCharge({ memberId: member!.id, chargeType: "OTHER_FEE", amount: 15, actorId: "admin" });
    const ch2 = await assessCharge({ memberId: member!.id, chargeType: "OTHER_FEE", amount: 15, actorId: "admin" });

    const [p1, p2] = await Promise.all([
      postPayment({
        memberId: member!.id,
        amount: 15,
        paymentMethod: "CASH",
        operatorId: "op_1",
        allocations: [{ chargeId: ch1.id, amount: 15 }],
      }),
      postPayment({
        memberId: member!.id,
        amount: 15,
        paymentMethod: "CASH",
        operatorId: "op_2",
        allocations: [{ chargeId: ch2.id, amount: 15 }],
      }),
    ]);

    const r1 = p1.receipt?.receiptNo || "";
    const r2 = p2.receipt?.receiptNo || "";
    assert(
      r1 !== "" && r2 !== "" && r1 !== r2,
      "AT-09",
      "Concurrent receipt numbering safety",
      `Unique sequential numbers generated: ${r1}, ${r2}`
    );
  } catch (err: any) {
    assert(false, "AT-09", "Concurrent receipt numbering safety", err.message);
  }

  // TEST 10 — AT-10: Payment reversal with Approving Officer reason
  try {
    const revRes = await reversePayment({
      paymentId: paymentRecord.id,
      reversalReason: "Cash incorrectly received at counter; citizen issued official refund",
      authorizedBy: "Chief Librarian Smt. Sunita Mukherjee",
      operatorId: "accounts_operator",
    });

    const restoredCharge = await prisma.feeCharge.findUnique({ where: { id: assessedCharge.id } });
    const receipt = await getReceiptDetails(paymentRecord.id);

    assert(
      revRes.success &&
        restoredCharge?.balance === 200.0 &&
        restoredCharge?.status === "OUTSTANDING" &&
        receipt.status === "CANCELLED",
      "AT-10",
      "Authorized payment reversal",
      "Restored charge balance to ₹200 and marked receipt as CANCELLED with audit trail"
    );
  } catch (err: any) {
    assert(false, "AT-10", "Authorized payment reversal", err.message);
  }

  console.log("\n==================================================================");
  console.log(`   GPLMS SUITE COMPLETED: ${passed} PASSED / ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) process.exit(1);
}

runGplmsAcceptanceTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
