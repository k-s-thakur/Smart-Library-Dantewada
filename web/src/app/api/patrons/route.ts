import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: any = {};
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { institutionalId: { contains: q } },
        { email: { contains: q } },
        { department: { contains: q } },
        { cards: { some: { cardUid: { contains: q } } } },
      ];
    }
    if (type) where.patronType = type;
    if (status) where.status = status;

    const patrons = await prisma.patron.findMany({
      where,
      include: {
        cards: true,
        loans: {
          where: { status: { in: ["ACTIVE", "OVERDUE"] } },
          include: { copy: { include: { book: true } } },
        },
        fines: {
          where: { status: "UNPAID" },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const policies = await prisma.borrowingPolicy.findMany();
    const policyMap = new Map(policies.map((p) => [p.patronType, p]));

    const result = patrons.map((p) => {
      const policy = policyMap.get(p.patronType);
      const totalUnpaidFine = p.fines.reduce((sum, f) => sum + f.amount, 0);
      return {
        ...p,
        activeLoanCount: p.loans.length,
        maxBorrowLimit: policy?.maxBooks ?? 4,
        loanDurationDays: policy?.loanDurationDays ?? 14,
        totalUnpaidFine,
      };
    });

    return NextResponse.json({ patrons: result });
  } catch (err: unknown) {
    console.error("GET /api/patrons error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch patrons." } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "LIBRARIAN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Unauthorized. Staff access required." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { institutionalId, fullName, email, phone, department, program, batch, patronType, cardUid } = body;

    if (!institutionalId || !fullName || !email) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "Institutional ID, full name, and email are required." } },
        { status: 400 }
      );
    }

    const patron = await prisma.patron.create({
      data: {
        institutionalId: institutionalId.trim(),
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        department: department?.trim(),
        program: program?.trim(),
        batch: batch?.trim(),
        patronType: patronType || "UNDERGRADUATE",
        status: "ACTIVE",
        cards: cardUid
          ? {
              create: {
                cardUid: cardUid.trim(),
                status: "ACTIVE",
              },
            }
          : undefined,
      },
      include: { cards: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "PATRON_CREATED",
        entityType: "PATRON",
        entityId: patron.id,
        metadataJson: JSON.stringify({
          institutionalId: patron.institutionalId,
          fullName: patron.fullName,
          patronType: patron.patronType,
        }),
      },
    });

    return NextResponse.json({ success: true, patron }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/patrons error:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE_PATRON", message: "Institutional ID, email, or Card UID is already registered." } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create patron." } },
      { status: 500 }
    );
  }
}
