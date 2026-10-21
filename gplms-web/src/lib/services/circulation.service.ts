import { prisma } from "../prisma";

export interface IssueBookParams {
  memberIdentifier: string; // memberNo or memberId
  copyIdentifier: string;   // qrCodeToken or accessionNo or copyId
  actorId: string;
}

export interface ReturnBookParams {
  copyIdentifier: string;   // qrCodeToken or accessionNo or copyId
  actorId: string;
}

export interface RenewLoanParams {
  loanId: string;
  actorId: string;
}

export interface ReserveBookParams {
  memberId: string;
  bookId: string;
}

export async function issueBook(params: IssueBookParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Identify and validate member
    const member = await tx.member.findFirst({
      where: {
        OR: [{ id: params.memberIdentifier }, { memberNo: params.memberIdentifier }],
      },
      include: {
        loans: { where: { status: "ACTIVE" } },
        feeCharges: { where: { status: { in: ["OUTSTANDING", "PARTIALLY_PAID"] } } },
      },
    });

    if (!member) {
      throw new Error(`Member "${params.memberIdentifier}" not found.`);
    }

    if (member.status !== "ACTIVE") {
      throw new Error(`Member is not in ACTIVE status (current: ${member.status}). Circulation blocked.`);
    }

    if (new Date(member.expiryDate) < new Date()) {
      throw new Error(`Membership expired on ${new Date(member.expiryDate).toLocaleDateString()}. Please renew membership.`);
    }

    // 2. Fetch borrowing policy for member's category
    const policy = await tx.libraryPolicy.findUnique({
      where: { category: member.category },
    }) || {
      loanDurationDays: 14,
      maxBooks: member.maxBooks || 3,
      gracePeriodDays: 2,
      fineRatePerDay: 2.0,
      maxFine: 150.0,
      allowRenewal: true,
      renewalLimit: 2,
    };

    if (member.loans.length >= policy.maxBooks) {
      throw new Error(
        `Borrowing limit reached: Member has ${member.loans.length} active loan(s), maximum permitted is ${policy.maxBooks}.`
      );
    }

    // Check excessive outstanding dues (e.g. over ₹100 dues blocks borrowing)
    const totalDues = member.feeCharges.reduce((acc, c) => acc + c.balance, 0);
    if (totalDues > 200.0) {
      throw new Error(
        `Circulation blocked: Member has ₹${totalDues.toFixed(2)} in outstanding dues. Please clear dues at the accounts desk.`
      );
    }

    // 3. Identify and validate physical copy
    const copy = await tx.bookCopy.findFirst({
      where: {
        OR: [
          { id: params.copyIdentifier },
          { accessionNo: params.copyIdentifier },
          { qrCodeToken: params.copyIdentifier },
        ],
      },
      include: {
        book: {
          include: {
            reservations: {
              where: { status: { in: ["PENDING", "READY_FOR_PICKUP"] } },
              orderBy: { queuePosition: "asc" },
            },
          },
        },
      },
    });

    if (!copy) {
      throw new Error(`Book copy "${params.copyIdentifier}" not found.`);
    }

    if (copy.status !== "AVAILABLE") {
      if (copy.status === "RESERVED") {
        // If reserved, only the top reserving member can take it
        const topRes = copy.book.reservations[0];
        if (topRes && topRes.memberId !== member.id) {
          throw new Error(`This copy is currently held on reservation for another member.`);
        }
      } else {
        throw new Error(`Book copy is not available for circulation (Current status: ${copy.status}).`);
      }
    }

    // 4. Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + policy.loanDurationDays);

    // 5. Create loan
    const loan = await tx.loan.create({
      data: {
        copyId: copy.id,
        memberId: member.id,
        dueDate,
        status: "ACTIVE",
        issuedBy: params.actorId,
      },
    });

    // 6. Update copy status
    await tx.bookCopy.update({
      where: { id: copy.id },
      data: { status: "ISSUED" },
    });

    // 7. Fulfill reservation if applicable
    const existingRes = copy.book.reservations.find((r) => r.memberId === member.id);
    if (existingRes) {
      await tx.reservation.update({
        where: { id: existingRes.id },
        data: { status: "FULFILLED" },
      });
    }

    // 8. Audit log
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "LOAN_ISSUED",
        entityType: "Loan",
        entityId: loan.id,
        metadataJson: JSON.stringify({
          memberNo: member.memberNo,
          accessionNo: copy.accessionNo,
          title: copy.book.title,
          dueDate: dueDate.toISOString(),
        }),
      },
    });

    return {
      loan,
      member: {
        id: member.id,
        memberNo: member.memberNo,
        name: member.fullName,
      },
      book: {
        title: copy.book.title,
        accessionNo: copy.accessionNo,
        shelfLocation: copy.shelfLocation,
      },
      dueDate,
    };
  });
}

export async function returnBook(params: ReturnBookParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Locate copy
    const copy = await tx.bookCopy.findFirst({
      where: {
        OR: [
          { id: params.copyIdentifier },
          { accessionNo: params.copyIdentifier },
          { qrCodeToken: params.copyIdentifier },
        ],
      },
      include: {
        book: {
          include: {
            reservations: {
              where: { status: "PENDING" },
              orderBy: { queuePosition: "asc" },
            },
          },
        },
      },
    });

    if (!copy) {
      throw new Error(`Book copy "${params.copyIdentifier}" not found.`);
    }

    // 2. Locate active loan
    const activeLoan = await tx.loan.findFirst({
      where: {
        copyId: copy.id,
        status: "ACTIVE",
      },
      include: {
        member: true,
      },
    });

    if (!activeLoan) {
      throw new Error(`No active loan found for copy "${copy.accessionNo}". Copy is currently "${copy.status}".`);
    }

    const returnTimestamp = new Date();
    const isOverdue = returnTimestamp > activeLoan.dueDate;
    let assessedFineAmount = 0;
    let feeChargeRecord = null;

    // 3. Fine calculation
    if (isOverdue) {
      const policy = await tx.libraryPolicy.findUnique({
        where: { category: activeLoan.member.category },
      }) || {
        gracePeriodDays: 2,
        fineRatePerDay: 2.0,
        maxFine: 150.0,
      };

      const diffTime = returnTimestamp.getTime() - activeLoan.dueDate.getTime();
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (overdueDays > policy.gracePeriodDays) {
        const chargeableDays = overdueDays - policy.gracePeriodDays;
        assessedFineAmount = Math.min(policy.maxFine, Number((chargeableDays * policy.fineRatePerDay).toFixed(2)));

        if (assessedFineAmount > 0) {
          feeChargeRecord = await tx.feeCharge.create({
            data: {
              memberId: activeLoan.memberId,
              loanId: activeLoan.id,
              chargeType: "LATE_FINE",
              description: `Overdue return fine (${overdueDays} days late; ${chargeableDays} days charged @ ₹${policy.fineRatePerDay}/day)`,
              amount: assessedFineAmount,
              balance: assessedFineAmount,
              paidAmount: 0.0,
              status: "OUTSTANDING",
            },
          });
        }
      }
    }

    // 4. Close the loan
    const closedLoan = await tx.loan.update({
      where: { id: activeLoan.id },
      data: {
        status: "RETURNED",
        returnedAt: returnTimestamp,
        returnedBy: params.actorId,
      },
    });

    // 5. Check reservations for this book
    let newCopyStatus = "AVAILABLE";
    const pendingRes = copy.book.reservations[0];
    if (pendingRes) {
      newCopyStatus = "RESERVED";
      const pickupDeadline = new Date();
      pickupDeadline.setDate(pickupDeadline.getDate() + 3); // 3 days pickup window

      await tx.reservation.update({
        where: { id: pendingRes.id },
        data: {
          status: "READY_FOR_PICKUP",
          expiresAt: pickupDeadline,
        },
      });
    }

    // 6. Update copy status
    await tx.bookCopy.update({
      where: { id: copy.id },
      data: { status: newCopyStatus },
    });

    // 7. Audit Log
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "LOAN_RETURNED",
        entityType: "Loan",
        entityId: closedLoan.id,
        metadataJson: JSON.stringify({
          memberNo: activeLoan.member.memberNo,
          accessionNo: copy.accessionNo,
          isOverdue,
          assessedFineAmount,
        }),
      },
    });

    return {
      loan: closedLoan,
      member: {
        id: activeLoan.member.id,
        memberNo: activeLoan.member.memberNo,
        name: activeLoan.member.fullName,
      },
      book: {
        title: copy.book.title,
        accessionNo: copy.accessionNo,
      },
      isOverdue,
      assessedFineAmount,
      feeCharge: feeChargeRecord,
      newCopyStatus,
    };
  });
}

export async function renewLoan(params: RenewLoanParams) {
  return await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: params.loanId },
      include: {
        member: true,
        copy: {
          include: {
            book: {
              include: {
                reservations: { where: { status: "PENDING" } },
              },
            },
          },
        },
      },
    });

    if (!loan || loan.status !== "ACTIVE") {
      throw new Error("Active loan not found for renewal.");
    }

    if (loan.copy.book.reservations.length > 0) {
      throw new Error("Renewal blocked: This book has pending reservations from other citizens.");
    }

    const policy = await tx.libraryPolicy.findUnique({
      where: { category: loan.member.category },
    }) || {
      loanDurationDays: 14,
      renewalLimit: 2,
    };

    if (loan.renewalCount >= policy.renewalLimit) {
      throw new Error(`Renewal limit reached (${policy.renewalLimit} times maximum). Please return the book.`);
    }

    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + policy.loanDurationDays);

    const updated = await tx.loan.update({
      where: { id: loan.id },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "LOAN_RENEWED",
        entityType: "Loan",
        entityId: loan.id,
        metadataJson: JSON.stringify({
          newDueDate: newDueDate.toISOString(),
          renewalCount: updated.renewalCount,
        }),
      },
    });

    return {
      success: true,
      loan: updated,
      newDueDate,
    };
  });
}

export async function reserveBook(params: ReserveBookParams) {
  return await prisma.$transaction(async (tx) => {
    const member = await tx.member.findUnique({ where: { id: params.memberId } });
    if (!member || member.status !== "ACTIVE") {
      throw new Error("Only active library members can reserve books.");
    }

    const book = await tx.book.findUnique({
      where: { id: params.bookId },
      include: {
        copies: true,
        reservations: { where: { status: { in: ["PENDING", "READY_FOR_PICKUP"] } } },
      },
    });

    if (!book) {
      throw new Error("Book not found.");
    }

    // Check if member already has active reservation
    const existing = book.reservations.find((r) => r.memberId === member.id);
    if (existing) {
      throw new Error("You already have an active reservation for this title.");
    }

    const queuePosition = book.reservations.length + 1;

    const reservation = await tx.reservation.create({
      data: {
        bookId: book.id,
        memberId: member.id,
        queuePosition,
        status: "PENDING",
      },
    });

    return reservation;
  });
}
