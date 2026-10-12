import { NextRequest, NextResponse } from "next/server";
import { issueBooks } from "@/lib/services/circulation.service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "LIBRARIAN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Unauthorized. Staff circulation access required." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { patronIdentifier, bookIdentifiers } = body;

    const result = await issueBooks({
      patronIdentifier,
      bookIdentifiers,
      actorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/circulation/issue error:", err);
    const code = err.code || "CIRCULATION_ERROR";
    const message = err.message || "Failed to issue books.";
    const status = code === "PATRON_NOT_FOUND" || code === "BOOK_NOT_FOUND" ? 404 : 400;

    return NextResponse.json({ error: { code, message } }, { status });
  }
}
