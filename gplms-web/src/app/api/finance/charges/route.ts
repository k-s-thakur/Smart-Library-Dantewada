import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assessCharge } from "@/lib/services/finance.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const status = searchParams.get("status");

    // If member, only view own charges
    if (session.role === "MEMBER" && session.memberId) {
      if (memberId && memberId !== session.memberId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const where: any = {};
    if (memberId) where.memberId = memberId;
    if (status) where.status = status;

    const charges = await prisma.feeCharge.findMany({
      where,
      include: {
        member: {
          select: { id: true, fullName: true, memberNo: true },
        },
        allocations: {
          include: {
            payment: {
              select: { id: true, paymentMethod: true, status: true, createdAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ charges });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR"].includes(session.role)
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Staff permissions required to assess charges." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { memberId, chargeType, amount, description, loanId } = body;

    if (!memberId || !chargeType || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: memberId, chargeType, amount" },
        { status: 400 }
      );
    }

    const charge = await assessCharge({
      memberId,
      chargeType,
      amount: Number(amount),
      description,
      loanId,
      actorId: session.id,
    });

    return NextResponse.json({ charge }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
