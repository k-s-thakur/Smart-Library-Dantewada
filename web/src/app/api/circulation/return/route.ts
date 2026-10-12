import { NextRequest, NextResponse } from "next/server";
import { returnBooks } from "@/lib/services/circulation.service";
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
    const { bookIdentifiers } = body;

    const result = await returnBooks({
      bookIdentifiers,
      actorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/circulation/return error:", err);
    const code = err.code || "CIRCULATION_ERROR";
    const message = err.message || "Failed to return books.";
    const status = code === "BOOK_NOT_FOUND" ? 404 : 400;

    return NextResponse.json({ error: { code, message } }, { status });
  }
}
