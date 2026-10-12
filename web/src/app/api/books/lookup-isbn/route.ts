import { NextRequest, NextResponse } from "next/server";
import { lookupIsbnMetadata } from "@/lib/services/isbn.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isbn = searchParams.get("isbn");

  if (!isbn) {
    return NextResponse.json(
      { error: { code: "MISSING_ISBN", message: "ISBN parameter is required." } },
      { status: 400 }
    );
  }

  const metadata = await lookupIsbnMetadata(isbn);
  if (!metadata) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No metadata found for provided ISBN. Manual entry available." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ metadata });
}
