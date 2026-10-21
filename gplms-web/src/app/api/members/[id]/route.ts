import { NextRequest, NextResponse } from "next/server";
import { getMemberDetails } from "@/lib/services/member.service";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // Member can only view own profile
    if (session.role === "MEMBER" && session.memberId && session.memberId !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const member = await getMemberDetails(id);
    return NextResponse.json({ member });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
