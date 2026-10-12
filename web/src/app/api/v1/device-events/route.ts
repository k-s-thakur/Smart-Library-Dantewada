import { NextRequest, NextResponse } from "next/server";
import { processGateEvent } from "@/lib/services/gate.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, device_id, event_type, card_uid, direction, device_timestamp, sequence_number } = body;

    if (!card_uid) {
      return NextResponse.json(
        { accepted: false, error: { code: "MISSING_CARD_UID", message: "card_uid is required" } },
        { status: 400 }
      );
    }

    const dir = direction ? direction.toUpperCase() : event_type?.includes("EXIT") ? "OUT" : "IN";

    const result = await processGateEvent({
      eventId: event_id,
      deviceId: device_id || "HARDWARE_EDGE_01",
      direction: dir as "IN" | "OUT",
      cardUid: card_uid,
      deviceTimestamp: device_timestamp,
      sequenceNumber: sequence_number,
    });

    return NextResponse.json({
      accepted: result.accepted,
      event_id,
      action: result.action,
      reason: (result as any).reason,
      message: (result as any).message,
    });
  } catch (err: any) {
    console.error("POST /api/v1/device-events error:", err);
    return NextResponse.json(
      {
        accepted: false,
        error: { code: err.code || "DEVICE_EVENT_FAILED", message: err.message || "Failed processing event." },
      },
      { status: 400 }
    );
  }
}
