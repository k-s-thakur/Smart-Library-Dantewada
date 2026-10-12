import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            loans: {
              where: { status: { in: ["ACTIVE", "OVERDUE"] } },
              include: { patron: true },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: { code: "BOOK_NOT_FOUND", message: "Book not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ book });
  } catch (err: unknown) {
    console.error("GET /api/books/[id] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch book." } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "LIBRARIAN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Unauthorized. Staff access required." } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.book.update({
      where: { id },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        authors: body.authors,
        publisher: body.publisher,
        edition: body.edition,
        publicationYear: body.publicationYear ? parseInt(body.publicationYear, 10) : undefined,
        category: body.category,
        ddcCode: body.ddcCode,
        coverImageUrl: body.coverImageUrl,
      },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (err: unknown) {
    console.error("PATCH /api/books/[id] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update book." } },
      { status: 500 }
    );
  }
}
