import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not logged in" } }, { status: 401 });
    }

    // Find patron record linked to user, or fallback to first student for demo
    let patron = null;
    if (session.patronId) {
      patron = await prisma.patron.findUnique({
        where: { id: session.patronId },
        include: {
          cards: true,
          loans: {
            include: {
              copy: { include: { book: true } },
              fines: true,
            },
            orderBy: { dueDate: "asc" },
          },
          fines: {
            include: { loan: { include: { copy: { include: { book: true } } } } },
            orderBy: { createdAt: "desc" },
          },
          gateSessions: {
            orderBy: { entryTime: "desc" },
            take: 15,
          },
        },
      });
    } else {
      // Fallback for student demo
      patron = await prisma.patron.findFirst({
        where: { institutionalId: "CS-2023-042" }, // Aarav Sharma
        include: {
          cards: true,
          loans: {
            include: {
              copy: { include: { book: true } },
              fines: true,
            },
            orderBy: { dueDate: "asc" },
          },
          fines: {
            include: { loan: { include: { copy: { include: { book: true } } } } },
            orderBy: { createdAt: "desc" },
          },
          gateSessions: {
            orderBy: { entryTime: "desc" },
            take: 15,
          },
        },
      });
    }

    if (!patron) {
      return NextResponse.json({ error: { code: "PATRON_NOT_FOUND", message: "No patron profile found" } }, { status: 404 });
    }

    // Lookup policy
    const policy = await prisma.borrowingPolicy.findUnique({
      where: { patronType: patron.patronType },
    });

    const activeLoans = patron.loans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE");
    const currentSession = patron.gateSessions.find((s) => s.status === "OPEN");
    const unpaidFinesTotal = patron.fines
      .filter((f) => f.status === "UNPAID")
      .reduce((sum, f) => sum + f.amount, 0);

    return NextResponse.json({
      patron: {
        id: patron.id,
        fullName: patron.fullName,
        institutionalId: patron.institutionalId,
        department: patron.department,
        program: patron.program,
        batch: patron.batch,
        patronType: patron.patronType,
        card: patron.cards.find((c) => c.status === "ACTIVE")?.cardUid,
      },
      policy: {
        maxBooks: policy?.maxBooks ?? 4,
        loanDurationDays: policy?.loanDurationDays ?? 14,
        gracePeriodDays: policy?.gracePeriodDays ?? 2,
        fineRatePerDay: policy?.fineRatePerDay ?? 2.0,
      },
      activeLoans,
      unpaidFinesTotal,
      fines: patron.fines,
      currentSession,
      visitHistory: patron.gateSessions,
    });
  } catch (err: unknown) {
    console.error("GET /api/student/dashboard error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load student dashboard data." } },
      { status: 500 }
    );
  }
}
