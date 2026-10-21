import { NextRequest, NextResponse } from "next/server";
import { reserveBook } from "@/lib/services/circulation.service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required to reserve books" }, { status: 401 });
    }

    const body = await req.json();
    const { bookId } = body;
    const memberId = session.memberId || body.memberId;

    if (!bookId || !memberId) {
      return NextResponse.json({ error: "bookId and memberId are required" }, { status: 400 });
    }

    const result = await reserveBook({
      bookId,
      memberId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
