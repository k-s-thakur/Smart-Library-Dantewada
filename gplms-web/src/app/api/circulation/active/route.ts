import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const where: any = { status: "ACTIVE" };
    if (memberId) where.memberId = memberId;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        member: {
          select: { id: true, memberNo: true, fullName: true, phone: true, category: true },
        },
        copy: {
          include: {
            book: {
              select: { id: true, title: true, isbn: true, ddcCode: true, coverImageUrl: true },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ loans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
