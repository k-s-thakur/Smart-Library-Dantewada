import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    const { bookId, barcode, rfidTagUid, shelfLocation } = body;

    if (!bookId || !barcode || !rfidTagUid) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "bookId, barcode, and rfidTagUid are required." } },
        { status: 400 }
      );
    }

    // Get current copies count for next copy number
    const count = await prisma.bookCopy.count({ where: { bookId } });

    const newCopy = await prisma.bookCopy.create({
      data: {
        bookId,
        copyNumber: count + 1,
        barcode: barcode.trim(),
        rfidTagUid: rfidTagUid.trim(),
        shelfLocation: shelfLocation?.trim() || "General Stacks",
        status: "AVAILABLE",
      },
      include: { book: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "COPY_CREATED",
        entityType: "BOOK_COPY",
        entityId: newCopy.id,
        metadataJson: JSON.stringify({
          bookId,
          barcode: newCopy.barcode,
          rfidTagUid: newCopy.rfidTagUid,
        }),
      },
    });

    return NextResponse.json({ success: true, copy: newCopy }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/copies error:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE_IDENTIFIER", message: "Barcode or RFID tag UID is already assigned to another copy." } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create book copy." } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "LIBRARIAN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Unauthorized. Staff access required." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status, shelfLocation, rfidTagUid } = body;

    if (!id) {
      return NextResponse.json(
        { error: { code: "MISSING_ID", message: "Copy ID is required." } },
        { status: 400 }
      );
    }

    const data: any = {};
    if (status) data.status = status;
    if (shelfLocation) data.shelfLocation = shelfLocation;
    if (rfidTagUid) data.rfidTagUid = rfidTagUid;

    const updated = await prisma.bookCopy.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, copy: updated });
  } catch (err: unknown) {
    console.error("PATCH /api/copies error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update copy." } },
      { status: 500 }
    );
  }
}
