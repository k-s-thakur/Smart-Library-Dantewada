import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const loans = await prisma.loan.findMany({
      where: { status: { in: ["ACTIVE", "OVERDUE"] } },
      include: {
        copy: { include: { book: true } },
        patron: true,
        fines: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ loans });
  } catch (err: unknown) {
    console.error("GET /api/circulation/active error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch active circulation loans." } },
      { status: 500 }
    );
  }
}
