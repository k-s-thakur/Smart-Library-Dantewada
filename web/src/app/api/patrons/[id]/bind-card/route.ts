import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { cardUid } = body;

    if (!cardUid || !cardUid.trim()) {
      return NextResponse.json(
        { error: { code: "MISSING_CARD_UID", message: "Card UID is required." } },
        { status: 400 }
      );
    }

    const cleanCardUid = cardUid.trim();

    // Verify patron exists
    const patron = await prisma.patron.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!patron) {
      return NextResponse.json(
        { error: { code: "PATRON_NOT_FOUND", message: "Patron not found." } },
        { status: 404 }
      );
    }

    // Check if card is already assigned to someone else
    const existingCard = await prisma.patronCard.findUnique({
      where: { cardUid: cleanCardUid },
      include: { patron: true },
    });

    if (existingCard && existingCard.patronId !== patron.id) {
      return NextResponse.json(
        {
          error: {
            code: "CARD_ALREADY_ASSIGNED",
            message: `Card '${cleanCardUid}' is already bound to another patron (${existingCard.patron.fullName}).`,
          },
        },
        { status: 409 }
      );
    }

    // Deactivate previous cards for this patron
    await prisma.patronCard.updateMany({
      where: { patronId: patron.id },
      data: { status: "INACTIVE" },
    });

    // Create or activate the new card
    const card = await prisma.patronCard.upsert({
      where: { cardUid: cleanCardUid },
      create: {
        patronId: patron.id,
        cardUid: cleanCardUid,
        status: "ACTIVE",
      },
      update: {
        patronId: patron.id,
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "CARD_BOUND",
        entityType: "PATRON_CARD",
        entityId: card.id,
        metadataJson: JSON.stringify({
          patronId: patron.id,
          cardUid: cleanCardUid,
        }),
      },
    });

    return NextResponse.json({ success: true, card, patronName: patron.fullName });
  } catch (err: unknown) {
    console.error("POST /api/patrons/[id]/bind-card error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to bind card." } },
      { status: 500 }
    );
  }
}
