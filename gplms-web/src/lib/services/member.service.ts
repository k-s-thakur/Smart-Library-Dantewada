import { prisma } from "../prisma";

export interface RegisterMemberInput {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  category: "GENERAL_CITIZEN" | "STUDENT" | "SENIOR_CITIZEN" | "RESEARCHER" | "GOVT_STAFF";
  actorId: string;
}

export async function listMembers(search?: string, category?: string, status?: string) {
  const where: any = {};
  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { fullName: { contains: s } },
      { memberNo: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
    ];
  }
  if (category) where.category = category;
  if (status) where.status = status;

  return await prisma.member.findMany({
    where,
    include: {
      loans: { where: { status: "ACTIVE" } },
      feeCharges: { where: { status: { in: ["OUTSTANDING", "PARTIALLY_PAID"] } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMemberDetails(memberNoOrId: string) {
  const member = await prisma.member.findFirst({
    where: {
      OR: [{ id: memberNoOrId }, { memberNo: memberNoOrId }, { email: memberNoOrId }],
    },
    include: {
      loans: {
        include: {
          copy: {
            include: { book: true },
          },
        },
        orderBy: { issuedAt: "desc" },
      },
      reservations: {
        include: { book: true },
        orderBy: { reservedAt: "desc" },
      },
      feeCharges: {
        include: {
          allocations: {
            include: { payment: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: { receipt: true },
        orderBy: { createdAt: "desc" },
      },
      receipts: {
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!member) {
    throw new Error(`Member "${memberNoOrId}" not found`);
  }

  const activeLoans = member.loans.filter((l) => l.status === "ACTIVE");
  const overdueLoans = member.loans.filter((l) => l.status === "ACTIVE" && new Date(l.dueDate) < new Date());
  const totalOutstandingDues = member.feeCharges.reduce((acc, c) => acc + c.balance, 0);

  return {
    ...member,
    activeLoansCount: activeLoans.length,
    overdueLoansCount: overdueLoans.length,
    totalOutstandingDues: Number(totalOutstandingDues.toFixed(2)),
  };
}

export async function registerMember(input: RegisterMemberInput) {
  return await prisma.$transaction(async (tx) => {
    // Check email uniqueness
    const existing = await tx.member.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new Error(`Email "${input.email}" is already registered.`);
    }

    // Generate unique sequential member number: GPL-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = await tx.member.count();
    const memberNo = `GPL-${year}-${String(count + 1).padStart(5, "0")}`;

    // Expiry: 1 year from registration
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const maxBooks = input.category === "RESEARCHER" ? 6 : input.category === "SENIOR_CITIZEN" ? 4 : 3;

    const member = await tx.member.create({
      data: {
        memberNo,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
        address: input.address || null,
        category: input.category,
        status: "ACTIVE",
        expiryDate,
        maxBooks,
      },
    });

    // Optionally assess registration charge per library rules (e.g. ₹50 for general citizen)
    const registrationFee = input.category === "SENIOR_CITIZEN" ? 0 : 50.0;
    if (registrationFee > 0) {
      await tx.feeCharge.create({
        data: {
          memberId: member.id,
          chargeType: "MEMBERSHIP_FEE",
          description: "New Citizen Annual Registration Fee",
          amount: registrationFee,
          balance: registrationFee,
          paidAmount: 0.0,
          status: "OUTSTANDING",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "MEMBER_REGISTERED",
        entityType: "Member",
        entityId: member.id,
        metadataJson: JSON.stringify({
          memberNo,
          name: member.fullName,
          category: member.category,
          fee: registrationFee,
        }),
      },
    });

    return member;
  });
}
