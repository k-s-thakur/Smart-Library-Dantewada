import { NextRequest, NextResponse } from "next/server";
import { renewLoan } from "@/lib/services/circulation.service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { loanId } = body;

    if (!loanId) {
      return NextResponse.json({ error: "loanId is required" }, { status: 400 });
    }

    const result = await renewLoan({
      loanId,
      actorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
