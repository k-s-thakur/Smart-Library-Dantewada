import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const availableOnly = searchParams.get("available") === "true";

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { authors: { contains: q } },
        { isbn: { contains: q } },
        { category: { contains: q } },
      ];
    }

    if (category) {
      where.category = { contains: category };
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        copies: {
          select: {
            id: true,
            copyNumber: true,
            barcode: true,
            rfidTagUid: true,
            shelfLocation: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map summary stats
    const result = books
      .map((b) => {
        const totalCopies = b.copies.length;
        const availableCopies = b.copies.filter((c) => c.status === "AVAILABLE").length;
        return {
          ...b,
          totalCopies,
          availableCopies,
        };
      })
      .filter((b) => (!availableOnly ? true : b.availableCopies > 0));

    return NextResponse.json({ books: result });
  } catch (err: unknown) {
    console.error("GET /api/books error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch books." } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "LIBRARIAN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Unauthorized. Staff access required." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      isbn,
      title,
      subtitle,
      authors,
      publisher,
      edition,
      publicationYear,
      category,
      ddcCode,
      coverImageUrl,
      copies, // array of { barcode, rfidTagUid, shelfLocation }
    } = body;

    if (!isbn || !title || !authors) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "ISBN, title, and authors are required." } },
        { status: 400 }
      );
    }

    const cleanIsbn = isbn.replace(/[-\s]/g, "").trim();

    // Check duplicate ISBN
    const existing = await prisma.book.findUnique({
      where: { isbn: cleanIsbn },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_ISBN",
            message: `Book with ISBN '${cleanIsbn}' already exists. Please add copies to the existing book.`,
          },
        },
        { status: 409 }
      );
    }

    // Prepare copies
    const copyData = Array.isArray(copies)
      ? copies.map((c: any, index: number) => ({
          copyNumber: index + 1,
          barcode: c.barcode || `BC-${cleanIsbn}-${index + 1}`,
          rfidTagUid: c.rfidTagUid || `RFID-${cleanIsbn}-${index + 1}`,
          shelfLocation: c.shelfLocation || "General Stacks",
          status: "AVAILABLE",
        }))
      : [];

    const newBook = await prisma.book.create({
      data: {
        isbn: cleanIsbn,
        title: title.trim(),
        subtitle: subtitle?.trim(),
        authors: authors.trim(),
        publisher: publisher?.trim(),
        edition: edition?.trim(),
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
        category: category?.trim(),
        ddcCode: ddcCode?.trim(),
        coverImageUrl:
          coverImageUrl || `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`,
        copies: {
          create: copyData,
        },
      },
      include: { copies: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "BOOK_CREATED",
        entityType: "BOOK",
        entityId: newBook.id,
        metadataJson: JSON.stringify({
          isbn: newBook.isbn,
          title: newBook.title,
          copiesCount: copyData.length,
        }),
      },
    });

    return NextResponse.json({ success: true, book: newBook }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/books error:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE_VALUE", message: "A book copy barcode or RFID UID must be unique." } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message || "Failed to create book." } },
      { status: 500 }
    );
  }
}
