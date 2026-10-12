import { NextRequest, NextResponse } from "next/server";
import { processGateEvent, getCurrentOccupancy } from "@/lib/services/gate.service";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const occupancy = await getCurrentOccupancy();
    const recentEvents = await prisma.gateEvent.findMany({
      take: 20,
      orderBy: { rawTimestamp: "desc" },
      include: {
        session: {
          include: { patron: true },
        },
      },
    });

    const activeSessions = await prisma.gateSession.findMany({
      where: { status: "OPEN" },
      include: { patron: true },
      orderBy: { entryTime: "desc" },
    });

    return NextResponse.json({
      occupancy,
      activeSessions,
      recentEvents,
    });
  } catch (err: unknown) {
    console.error("GET /api/gate/events error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch gate events." } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardUid, direction, deviceId, eventId } = body;

    if (!cardUid || !direction) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "cardUid and direction (IN/OUT) are required." } },
        { status: 400 }
      );
    }

    const result = await processGateEvent({
      cardUid: cardUid.trim(),
      direction: direction.toUpperCase() as "IN" | "OUT",
      deviceId: deviceId || "GATE_TERMINAL",
      eventId,
    });

    const occupancy = await getCurrentOccupancy();

    return NextResponse.json({
      ...result,
      occupancy,
    });
  } catch (err: any) {
    console.error("POST /api/gate/events error:", err);
    const code = err.code || "GATE_ERROR";
    const message = err.message || "Failed to process gate event.";
    return NextResponse.json({ error: { code, message } }, { status: 400 });
  }
}
