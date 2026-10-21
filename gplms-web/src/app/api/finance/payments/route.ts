import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { postPayment } from "@/lib/services/finance.service";
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

    if (session.role === "MEMBER" && session.memberId) {
      if (memberId && memberId !== session.memberId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const where: any = {};
    if (memberId) where.memberId = memberId;
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        receipt: true,
        reversal: true,
        member: {
          select: { id: true, fullName: true, memberNo: true },
        },
        allocations: {
          include: {
            charge: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "LIBRARY_ADMIN", "ACCOUNTS_OPERATOR"].includes(session.role)
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized. Accounts Operator or Administrator permission required to record payments.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { memberId, amount, paymentMethod, referenceNumber, idempotencyKey, allocations } = body;

    if (!memberId || amount === undefined || !paymentMethod || !allocations) {
      return NextResponse.json(
        {
          error: "Missing required fields: memberId, amount, paymentMethod, allocations",
        },
        { status: 400 }
      );
    }

    const result = await postPayment({
      memberId,
      amount: Number(amount),
      paymentMethod,
      referenceNumber,
      idempotencyKey,
      operatorId: session.id,
      allocations,
    });

    return NextResponse.json(result, { status: result.idempotentReplay ? 200 : 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to post payment" }, { status: 400 });
  }
}
