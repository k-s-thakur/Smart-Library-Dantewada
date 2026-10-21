import { NextRequest, NextResponse } from "next/server";
import { searchCatalogue, createBookWithCopies, getBookDetails } from "@/lib/services/catalogue.service";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isbn = searchParams.get("isbn");

    if (id || isbn) {
      const book = await getBookDetails((id || isbn)!);
      return NextResponse.json({ book });
    }

    const query = searchParams.get("q") || undefined;
    const categoryCode = searchParams.get("category") || undefined;
    const ddcPrefix = searchParams.get("ddc") || undefined;
    const language = searchParams.get("language") || undefined;
    const availableOnly = searchParams.get("available") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await searchCatalogue({
      query,
      categoryCode,
      ddcPrefix,
      language,
      availableOnly,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Staff permissions required to add books." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      isbn,
      title,
      subtitle,
      edition,
      publicationYear,
      language,
      ddcCode,
      bookNumber,
      description,
      authorNames,
      publisherName,
      categoryName,
      categoryCode,
      initialCopiesCount,
      shelfLocation,
      acquisitionCost,
    } = body;

    if (!isbn || !title || !authorNames || !authorNames.length) {
      return NextResponse.json(
        { error: "Missing required fields: isbn, title, authorNames" },
        { status: 400 }
      );
    }

    const result = await createBookWithCopies({
      isbn,
      title,
      subtitle,
      edition,
      publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
      language,
      ddcCode,
      bookNumber,
      description,
      authorNames,
      publisherName,
      categoryName,
      categoryCode,
      initialCopiesCount: initialCopiesCount ? parseInt(initialCopiesCount, 10) : 1,
      shelfLocation,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
      actorId: session.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
