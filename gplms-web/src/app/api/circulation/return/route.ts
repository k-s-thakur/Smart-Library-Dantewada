import { NextRequest, NextResponse } from "next/server";
import { returnBook } from "@/lib/services/circulation.service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Librarian access required to process book returns." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { copyIdentifier } = body;

    if (!copyIdentifier) {
      return NextResponse.json(
        { error: "copyIdentifier (QR Code or Accession No) is required." },
        { status: 400 }
      );
    }

    const result = await returnBook({
      copyIdentifier,
      actorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
