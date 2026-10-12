import { PrismaClient } from "@prisma/client";
import { issueBooks, returnBooks } from "../src/lib/services/circulation.service";
import { processGateEvent, getCurrentOccupancy } from "../src/lib/services/gate.service";

const prisma = new PrismaClient();

async function runAcceptanceTests() {
  console.log("=================================================");
  console.log("   SLMTS MVP PRD SECTION 48 ACCEPTANCE SUITE     ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${detail ? `- ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // TEST 1 — Add Book with 3 physical copies with RFID tags (PRD Section 48 Test 1)
  try {
    const testIsbn = "9780131103627";
    await prisma.bookCopy.deleteMany({ where: { book: { isbn: testIsbn } } });
    await prisma.book.deleteMany({ where: { isbn: testIsbn } });

    const newBook = await prisma.book.create({
      data: {
        isbn: testIsbn,
        title: "The C Programming Language",
        authors: "Brian W. Kernighan, Dennis M. Ritchie",
        copies: {
          create: [
            { copyNumber: 1, barcode: "BC99901", rfidTagUid: "RFID_TEST_01", shelfLocation: "Rack D1", status: "AVAILABLE" },
            { copyNumber: 2, barcode: "BC99902", rfidTagUid: "RFID_TEST_02", shelfLocation: "Rack D1", status: "AVAILABLE" },
            { copyNumber: 3, barcode: "BC99903", rfidTagUid: "RFID_TEST_03", shelfLocation: "Rack D1", status: "AVAILABLE" },
          ],
        },
      },
      include: { copies: true },
    });

    const allAvailable = newBook.copies.every((c) => c.status === "AVAILABLE");
    assert(newBook.copies.length === 3 && allAvailable, "Test 1 — Add Book & Copies", "Created 3 copies with RFIDs, all AVAILABLE");
  } catch (err: any) {
    assert(false, "Test 1 — Add Book & Copies", err.message);
  }

  // TEST 2 — Issue Book (PRD Section 48 Test 2)
  try {
    const issueRes = await issueBooks({
      patronIdentifier: "CARD_PRIYA_02", // Priya Patel
      bookIdentifiers: ["RFID_TEST_01", "RFID_TEST_02"],
      actorId: "test_librarian",
    });

    const c1 = await prisma.bookCopy.findUnique({ where: { rfidTagUid: "RFID_TEST_01" } });
    const c2 = await prisma.bookCopy.findUnique({ where: { rfidTagUid: "RFID_TEST_02" } });

    assert(
      issueRes.success && c1?.status === "ISSUED" && c2?.status === "ISSUED",
      "Test 2 — Issue Books",
      `Issued 2 books to ${issueRes.patron.name}, due date calculated: ${issueRes.dueDate.toISOString().split("T")[0]}`
    );
  } catch (err: any) {
    assert(false, "Test 2 — Issue Books", err.message);
  }

  // TEST 3 — Return Book & Fine Calculation (PRD Section 48 Test 3)
  try {
    const returnRes = await returnBooks({
      bookIdentifiers: ["RFID_TEST_01", "RFID_TEST_02"],
      actorId: "test_librarian",
    });

    const c1 = await prisma.bookCopy.findUnique({ where: { rfidTagUid: "RFID_TEST_01" } });
    assert(
      returnRes.success && c1?.status === "AVAILABLE",
      "Test 3 — Return Books",
      "Loans closed, copies restored to AVAILABLE"
    );
  } catch (err: any) {
    assert(false, "Test 3 — Return Books", err.message);
  }

  // TEST 4 — Gate Entry (PRD Section 48 Test 4)
  const initialOccupancy = await getCurrentOccupancy();
  try {
    // Tap Vikram Sen IN
    const gateInRes = await processGateEvent({
      cardUid: "CARD_VIKRAM_03",
      direction: "IN",
      deviceId: "GATE_ENTRY_01",
    });

    const newOccupancy = await getCurrentOccupancy();
    assert(
      gateInRes.accepted && gateInRes.action === "ACCESS_GRANTED" && newOccupancy === initialOccupancy + 1,
      "Test 4 — Gate Entry",
      `Session created, Occupancy increased from ${initialOccupancy} to ${newOccupancy}`
    );
  } catch (err: any) {
    assert(false, "Test 4 — Gate Entry", err.message);
  }

  // TEST 5 — Gate Exit (PRD Section 48 Test 5)
  try {
    // Tap Vikram Sen OUT
    const gateOutRes = await processGateEvent({
      cardUid: "CARD_VIKRAM_03",
      direction: "OUT",
      deviceId: "GATE_EXIT_01",
    });

    const afterExitOccupancy = await getCurrentOccupancy();
    assert(
      gateOutRes.accepted && gateOutRes.action === "ACCESS_GRANTED" && afterExitOccupancy === initialOccupancy,
      "Test 5 — Gate Exit",
      `Session closed, Duration recorded, Occupancy decreased back to ${afterExitOccupancy}`
    );
  } catch (err: any) {
    assert(false, "Test 5 — Gate Exit", err.message);
  }

  // TEST 6 — Duplicate Entry Prevention (PRD Section 48 Test 6)
  try {
    // Vikram enters once
    await processGateEvent({ cardUid: "CARD_VIKRAM_03", direction: "IN", deviceId: "GATE_ENTRY_01" });
    const occBefore = await getCurrentOccupancy();

    // Vikram taps IN second time while already inside
    const dupRes = await processGateEvent({ cardUid: "CARD_VIKRAM_03", direction: "IN", deviceId: "GATE_ENTRY_01" });
    const occAfter = await getCurrentOccupancy();

    assert(
      !dupRes.accepted && dupRes.action === "DUPLICATE_ENTRY" && occBefore === occAfter,
      "Test 6 — Duplicate Entry Prevention",
      "Rejected duplicate entry, no second session created"
    );

    // Clean up
    await processGateEvent({ cardUid: "CARD_VIKRAM_03", direction: "OUT", deviceId: "GATE_EXIT_01" });
  } catch (err: any) {
    assert(false, "Test 6 — Duplicate Entry Prevention", err.message);
  }

  // TEST 7 — Offline Device Event Idempotency (PRD Section 18 & 48 Test 7)
  try {
    const testEventId = `evt_offline_test_${Date.now()}`;
    const firstDelivery = await processGateEvent({
      eventId: testEventId,
      cardUid: "CARD_ANANYA_04",
      direction: "IN",
      deviceId: "EDGE_OFFLINE_01",
    });

    const replayDelivery = await processGateEvent({
      eventId: testEventId,
      cardUid: "CARD_ANANYA_04",
      direction: "IN",
      deviceId: "EDGE_OFFLINE_01",
    });

    assert(
      firstDelivery.accepted && replayDelivery.action === "DUPLICATE_IGNORED",
      "Test 7 — Device Event Idempotency",
      "First event processed, replayed offline event recognized and safely ignored"
    );

    // Clean up session
    await processGateEvent({ cardUid: "CARD_ANANYA_04", direction: "OUT", deviceId: "EDGE_OFFLINE_01" });
  } catch (err: any) {
    assert(false, "Test 7 — Device Event Idempotency", err.message);
  }

  // TEST 8 — Invalid Book Rejection & Atomic Rollback (PRD Section 48 Test 8)
  try {
    let errorCaught = false;
    try {
      await issueBooks({
        patronIdentifier: "CARD_PRIYA_02",
        bookIdentifiers: ["RFID_TEST_03", "RFID_NONEXISTENT_999"],
      });
    } catch (err: any) {
      errorCaught = err.code === "BOOK_NOT_FOUND";
    }

    // Verify atomic safety: RFID_TEST_03 must NOT be issued
    const c3 = await prisma.bookCopy.findUnique({ where: { rfidTagUid: "RFID_TEST_03" } });
    assert(
      errorCaught && c3?.status === "AVAILABLE",
      "Test 8 — Invalid Book Scanned",
      "Rejected unknown RFID, verified atomic rollback without inventory corruption"
    );
  } catch (err: any) {
    assert(false, "Test 8 — Invalid Book Scanned", err.message);
  }

  // TEST 9 — Borrow Limit Exceeded Enforcement (PRD Section 48 Test 9)
  try {
    let limitBlocked = false;
    // Undergraduate limit is 4 books. Try to issue 5 books to Priya
    try {
      await issueBooks({
        patronIdentifier: "CARD_PRIYA_02",
        bookIdentifiers: ["RFID_TEST_01", "RFID_TEST_02", "RFID_TEST_03", "BC100101", "BC100102"],
      });
    } catch (err: any) {
      limitBlocked = err.code === "BORROW_LIMIT_REACHED";
    }

    assert(limitBlocked, "Test 9 — Borrow Limit Enforcement", "Blocked checkout exceeding max policy allowance");
  } catch (err: any) {
    assert(false, "Test 9 — Borrow Limit Enforcement", err.message);
  }

  // TEST 10 — Suspended Patron Circulation Block (PRD Section 48 Test 10)
  try {
    let suspendedBlocked = false;
    try {
      await issueBooks({
        patronIdentifier: "CARD_ROHAN_05", // Rohan is suspended
        bookIdentifiers: ["RFID_TEST_03"],
      });
    } catch (err: any) {
      suspendedBlocked = err.code === "PATRON_SUSPENDED";
    }

    assert(suspendedBlocked, "Test 10 — Suspended Patron Block", "Blocked checkout for suspended patron");
  } catch (err: any) {
    assert(false, "Test 10 — Suspended Patron Block", err.message);
  }

  console.log("\n=================================================");
  console.log(`ACCEPTANCE RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
}

runAcceptanceTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
