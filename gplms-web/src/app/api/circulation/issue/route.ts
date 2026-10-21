import { NextRequest, NextResponse } from "next/server";
import { issueBook } from "@/lib/services/circulation.service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Librarian access required to issue books." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { memberIdentifier, copyIdentifier } = body;

    if (!memberIdentifier || !copyIdentifier) {
      return NextResponse.json(
        { error: "Both memberIdentifier (Member No/ID) and copyIdentifier (QR / Accession No) are required." },
        { status: 400 }
      );
    }

    const result = await issueBook({
      memberIdentifier,
      copyIdentifier,
      actorId: session.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
