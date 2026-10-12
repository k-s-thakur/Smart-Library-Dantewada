import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalTitles = await prisma.book.count();
    const totalCopies = await prisma.bookCopy.count();
    const availableCopies = await prisma.bookCopy.count({ where: { status: "AVAILABLE" } });
    const issuedCopies = await prisma.bookCopy.count({ where: { status: "ISSUED" } });
    const overdueCopies = await prisma.bookCopy.count({ where: { status: "OVERDUE" } });
    const lostCopies = await prisma.bookCopy.count({ where: { status: "LOST" } });

    const totalPatrons = await prisma.patron.count();
    const activePatrons = await prisma.patron.count({ where: { status: "ACTIVE" } });

    const currentlyInside = await prisma.gateSession.count({ where: { status: "OPEN" } });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysVisits = await prisma.gateSession.count({
      where: { entryTime: { gte: startOfToday } },
    });

    const todaysIssues = await prisma.loan.count({
      where: { issuedAt: { gte: startOfToday } },
    });

    const todaysReturns = await prisma.loan.count({
      where: { returnedAt: { gte: startOfToday } },
    });

    const recentLoans = await prisma.loan.findMany({
      take: 6,
      orderBy: { issuedAt: "desc" },
      include: {
        copy: { include: { book: true } },
        patron: true,
      },
    });

    const recentVisits = await prisma.gateSession.findMany({
      take: 6,
      orderBy: { entryTime: "desc" },
      include: { patron: true },
    });

    return NextResponse.json({
      metrics: {
        totalTitles,
        totalCopies,
        availableCopies,
        issuedCopies,
        overdueCopies,
        lostCopies,
        totalPatrons,
        activePatrons,
        currentlyInside,
        todaysVisits,
        todaysIssues,
        todaysReturns,
      },
      recentLoans,
      recentVisits,
    });
  } catch (err: unknown) {
    console.error("GET /api/analytics/dashboard error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate dashboard metrics." } },
      { status: 500 }
    );
  }
}
