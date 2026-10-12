import prisma from "../prisma";

export interface IssueRequest {
  patronIdentifier: string; // institutionalId, patronId, or cardUid
  bookIdentifiers: string[]; // barcode, rfidTagUid, or copyId
  actorId?: string;
}

export interface ReturnRequest {
  bookIdentifiers: string[]; // barcode, rfidTagUid, or copyId
  actorId?: string;
}

export async function issueBooks({ patronIdentifier, bookIdentifiers, actorId }: IssueRequest) {
  if (!patronIdentifier) {
    throw { code: "PATRON_REQUIRED", message: "Patron identifier is required." };
  }
  if (!bookIdentifiers || bookIdentifiers.length === 0) {
    throw { code: "BOOKS_REQUIRED", message: "At least one book must be scanned or selected." };
  }

  // 1. Find patron by ID, institutional ID, or Card UID
  let patron = await prisma.patron.findFirst({
    where: {
      OR: [
        { id: patronIdentifier },
        { institutionalId: patronIdentifier },
        { cards: { some: { cardUid: patronIdentifier } } },
      ],
    },
    include: {
      cards: true,
      loans: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
      },
    },
  });

  if (!patron) {
    throw { code: "PATRON_NOT_FOUND", message: `Patron '${patronIdentifier}' could not be found.` };
  }

  if (patron.status === "SUSPENDED") {
    throw {
      code: "PATRON_SUSPENDED",
      message: `Patron '${patron.fullName}' is currently suspended. Circulation is blocked.`,
    };
  }

  if (patron.status !== "ACTIVE") {
    throw {
      code: "PATRON_INACTIVE",
      message: `Patron status is '${patron.status}'. Only active patrons can borrow.`,
    };
  }

  // Check card status if scanned via card
  const matchedCard = patron.cards.find((c) => c.cardUid === patronIdentifier);
  if (matchedCard && matchedCard.status !== "ACTIVE") {
    throw {
      code: "CARD_DISABLED",
      message: `Card '${matchedCard.cardUid}' is marked as ${matchedCard.status}. Access denied.`,
    };
  }

  // 2. Lookup policy for patronType
  const policy = await prisma.borrowingPolicy.findUnique({
    where: { patronType: patron.patronType },
  });

  const maxBooks = policy?.maxBooks ?? 4;
  const loanDays = policy?.loanDurationDays ?? 14;

  const currentBorrowed = patron.loans.length;
  const requestedCount = bookIdentifiers.length;

  if (currentBorrowed + requestedCount > maxBooks) {
    throw {
      code: "BORROW_LIMIT_REACHED",
      message: `Borrowing limit reached. Patron has ${currentBorrowed} active loan(s), limit is ${maxBooks}. Cannot issue ${requestedCount} more.`,
    };
  }

  // 3. Find and validate every book copy
  const copies = await prisma.bookCopy.findMany({
    where: {
      OR: [
        { id: { in: bookIdentifiers } },
        { barcode: { in: bookIdentifiers } },
        { rfidTagUid: { in: bookIdentifiers } },
      ],
    },
    include: { book: true },
  });

  // Verify all requested books exist
  if (copies.length < requestedCount) {
    const foundIds = new Set([
      ...copies.map((c) => c.id),
      ...copies.map((c) => c.barcode),
      ...copies.map((c) => c.rfidTagUid),
    ]);
    const missing = bookIdentifiers.filter((id) => !foundIds.has(id));
    throw {
      code: "BOOK_NOT_FOUND",
      message: `The following book copy could not be found: ${missing.join(", ")}`,
    };
  }

  // Check availability
  for (const copy of copies) {
    if (copy.status !== "AVAILABLE") {
      throw {
        code: "BOOK_NOT_AVAILABLE",
        message: `Book '${copy.book.title}' (Barcode: ${copy.barcode}, RFID: ${copy.rfidTagUid}) is currently ${copy.status}.`,
      };
    }
  }

  // 4. Atomic transaction (PRD Section 12)
  const now = new Date();
  const dueDate = new Date(now.getTime() + loanDays * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const createdLoans = [];

    for (const copy of copies) {
      // Create loan
      const loan = await tx.loan.create({
        data: {
          copyId: copy.id,
          patronId: patron!.id,
          issuedAt: now,
          dueDate,
          status: "ACTIVE",
        },
      });

      // Update copy status
      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: "ISSUED" },
      });

      createdLoans.push(loan);
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: actorId || "system",
        action: "LOANS_ISSUED",
        entityType: "CIRCULATION",
        entityId: patron!.id,
        metadataJson: JSON.stringify({
          patronId: patron!.id,
          copiesCount: copies.length,
          dueDate,
          copyBarcodes: copies.map((c) => c.barcode),
        }),
      },
    });

    return createdLoans;
  });

  return {
    success: true,
    patron: {
      id: patron.id,
      name: patron.fullName,
      institutionalId: patron.institutionalId,
      patronType: patron.patronType,
    },
    dueDate,
    issuedCopies: copies.map((c) => ({
      id: c.id,
      title: c.book.title,
      barcode: c.barcode,
      rfidTagUid: c.rfidTagUid,
      shelfLocation: c.shelfLocation,
    })),
    loans: result,
  };
}

export async function returnBooks({ bookIdentifiers, actorId }: ReturnRequest) {
  if (!bookIdentifiers || bookIdentifiers.length === 0) {
    throw { code: "BOOKS_REQUIRED", message: "At least one book must be scanned or specified for return." };
  }

  // Find matching copies
  const copies = await prisma.bookCopy.findMany({
    where: {
      OR: [
        { id: { in: bookIdentifiers } },
        { barcode: { in: bookIdentifiers } },
        { rfidTagUid: { in: bookIdentifiers } },
      ],
    },
    include: {
      book: true,
      loans: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        include: {
          patron: true,
        },
      },
    },
  });

  if (copies.length === 0) {
    throw {
      code: "BOOK_NOT_FOUND",
      message: `No matching books found for identifiers: ${bookIdentifiers.join(", ")}`,
    };
  }

  const now = new Date();
  const processedItems = [];

  // Fetch policies for fine calculations
  const policies = await prisma.borrowingPolicy.findMany();
  const policyMap = new Map(policies.map((p) => [p.patronType, p]));

  for (const copy of copies) {
    const activeLoan = copy.loans[0];
    if (!activeLoan) {
      processedItems.push({
        barcode: copy.barcode,
        rfidTagUid: copy.rfidTagUid,
        title: copy.book.title,
        status: "NOT_ISSUED",
        message: "Book copy is not currently recorded as issued.",
      });
      continue;
    }

    const patron = activeLoan.patron;
    const policy = policyMap.get(patron.patronType);
    const graceDays = policy?.gracePeriodDays ?? 2;
    const fineRate = policy?.fineRatePerDay ?? 2.0;
    const maxFine = policy?.maxFine ?? 200.0;

    let fineAmount = 0;
    let overdueDays = 0;

    if (now > activeLoan.dueDate) {
      const overdueMs = now.getTime() - activeLoan.dueDate.getTime();
      overdueDays = Math.ceil(overdueMs / (1000 * 60 * 60 * 24));
      if (overdueDays > graceDays) {
        const billableDays = overdueDays - graceDays;
        fineAmount = Math.min(billableDays * fineRate, maxFine);
      }
    }

    // Atomic return for this copy
    await prisma.$transaction(async (tx) => {
      // Close loan
      await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          returnedAt: now,
          status: "RETURNED",
        },
      });

      // Update copy status
      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: "AVAILABLE" },
      });

      // Record fine if applicable
      if (fineAmount > 0) {
        await tx.fineTransaction.create({
          data: {
            loanId: activeLoan.id,
            patronId: patron.id,
            amount: fineAmount,
            status: "UNPAID",
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: actorId || "system",
          action: "LOAN_RETURNED",
          entityType: "CIRCULATION",
          entityId: activeLoan.id,
          metadataJson: JSON.stringify({
            copyId: copy.id,
            barcode: copy.barcode,
            overdueDays,
            fineAmount,
            patronId: patron.id,
          }),
        },
      });
    });

    processedItems.push({
      copyId: copy.id,
      title: copy.book.title,
      barcode: copy.barcode,
      rfidTagUid: copy.rfidTagUid,
      patronName: patron.fullName,
      status: "RETURNED",
      overdueDays,
      fineAmount,
    });
  }

  return {
    success: true,
    returns: processedItems,
  };
}
