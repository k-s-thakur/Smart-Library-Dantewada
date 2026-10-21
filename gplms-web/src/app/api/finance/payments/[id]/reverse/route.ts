import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reversePayment } from "@/lib/services/finance.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "APPROVING_OFFICER"].includes(session.role)
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized. Approving Officer authorization required to reverse payments.",
        },
        { status: 403 }
      );
    }

    const { id: paymentId } = await params;
    const body = await req.json();
    const { reversalReason } = body;

    if (!reversalReason || reversalReason.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid reversalReason is required by library audit policies" },
        { status: 400 }
      );
    }

    const result = await reversePayment({
      paymentId,
      reversalReason,
      authorizedBy: session.name || session.email,
      operatorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reverse payment" }, { status: 400 });
  }
}
