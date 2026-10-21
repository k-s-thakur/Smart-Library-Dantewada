import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDailyCollectionReport } from "@/lib/services/finance.service";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "LIBRARY_ADMIN", "ACCOUNTS_OPERATOR"].includes(session.role)
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Financial permissions required to view collection reports." },
        { status: 403 }
      );
    }

    const report = await getDailyCollectionReport();
    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate report" }, { status: 500 });
  }
}
