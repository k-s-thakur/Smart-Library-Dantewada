import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReceiptDetails } from "@/lib/services/finance.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const receipt = await getReceiptDetails(id);

    if (session.role === "MEMBER" && session.memberId) {
      if (receipt.memberId !== session.memberId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ receipt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Receipt not found" }, { status: 404 });
  }
}
