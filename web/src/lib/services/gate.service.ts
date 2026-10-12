import prisma from "../prisma";

export interface GateEventPayload {
  eventId?: string;
  deviceId: string;
  direction: "IN" | "OUT";
  cardUid: string;
  deviceTimestamp?: string;
  sequenceNumber?: number;
}

export async function processGateEvent(payload: GateEventPayload) {
  const { eventId, deviceId, direction, cardUid } = payload;

  if (!cardUid) {
    throw { code: "CARD_REQUIRED", message: "Card UID is required." };
  }

  // 1. Idempotency Check (PRD Section 18)
  if (eventId) {
    const existing = await prisma.deviceEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      return {
        accepted: true,
        eventId,
        action: "DUPLICATE_IGNORED",
        message: "Event was already processed previously.",
      };
    }

    // Record incoming device event
    await prisma.deviceEvent.create({
      data: {
        eventId,
        deviceId: deviceId || "UNKNOWN",
        eventType: `GATE_${direction}`,
        cardUid,
        payloadJson: JSON.stringify(payload),
        processedStatus: "PROCESSED",
      },
    });
  }

  // 2. Identify Card and Patron
  const card = await prisma.patronCard.findUnique({
    where: { cardUid },
    include: { patron: true },
  });

  const now = new Date();

  if (!card) {
    await prisma.gateEvent.create({
      data: {
        deviceId: deviceId || "GATE",
        eventType: direction === "IN" ? "ENTRY" : "EXIT",
        cardUid,
        rawTimestamp: now,
        status: "REJECTED",
        reason: "CARD_NOT_REGISTERED",
      },
    });

    return {
      accepted: false,
      action: "ACCESS_DENIED",
      reason: "CARD_NOT_REGISTERED",
      message: `Card '${cardUid}' is not registered in the system.`,
    };
  }

  if (card.status !== "ACTIVE") {
    await prisma.gateEvent.create({
      data: {
        deviceId: deviceId || "GATE",
        eventType: direction === "IN" ? "ENTRY" : "EXIT",
        cardUid,
        rawTimestamp: now,
        status: "REJECTED",
        reason: `CARD_${card.status}`,
      },
    });

    return {
      accepted: false,
      action: "ACCESS_DENIED",
      reason: `CARD_${card.status}`,
      message: `Card '${cardUid}' is marked as ${card.status}.`,
    };
  }

  const patron = card.patron;
  if (patron.status !== "ACTIVE") {
    await prisma.gateEvent.create({
      data: {
        deviceId: deviceId || "GATE",
        eventType: direction === "IN" ? "ENTRY" : "EXIT",
        cardUid,
        rawTimestamp: now,
        status: "REJECTED",
        reason: "PATRON_NOT_ACTIVE",
      },
    });

    return {
      accepted: false,
      action: "ACCESS_DENIED",
      reason: "PATRON_NOT_ACTIVE",
      message: `Patron '${patron.fullName}' is currently ${patron.status}.`,
    };
  }

  // 3. Find active open session
  const openSession = await prisma.gateSession.findFirst({
    where: {
      patronId: patron.id,
      status: "OPEN",
    },
    orderBy: { entryTime: "desc" },
  });

  if (direction === "IN") {
    // Duplicate Entry check (PRD Section 17)
    if (openSession) {
      await prisma.gateEvent.create({
        data: {
          sessionId: openSession.id,
          deviceId: deviceId || "GATE_ENTRY_01",
          eventType: "ENTRY",
          cardUid,
          rawTimestamp: now,
          status: "REJECTED",
          reason: "DUPLICATE_ENTRY_ALREADY_INSIDE",
        },
      });

      return {
        accepted: false,
        action: "DUPLICATE_ENTRY",
        reason: "ALREADY_INSIDE",
        patronName: patron.fullName,
        message: `${patron.fullName} is already recorded as inside the library.`,
      };
    }

    // Create new open session
    const session = await prisma.gateSession.create({
      data: {
        patronId: patron.id,
        entryTime: now,
        status: "OPEN",
      },
    });

    await prisma.gateEvent.create({
      data: {
        sessionId: session.id,
        deviceId: deviceId || "GATE_ENTRY_01",
        eventType: "ENTRY",
        cardUid,
        rawTimestamp: now,
        status: "ACCEPTED",
      },
    });

    return {
      accepted: true,
      action: "ACCESS_GRANTED",
      direction: "IN",
      patronName: patron.fullName,
      patronId: patron.id,
      institutionalId: patron.institutionalId,
      department: patron.department,
      entryTime: now,
    };
  } else {
    // Direction OUT
    if (!openSession) {
      // Exit without Entry anomaly (PRD Section 17)
      await prisma.gateEvent.create({
        data: {
          deviceId: deviceId || "GATE_EXIT_01",
          eventType: "EXIT",
          cardUid,
          rawTimestamp: now,
          status: "ACCEPTED",
          reason: "EXIT_WITHOUT_ENTRY_ANOMALY",
        },
      });

      return {
        accepted: true,
        action: "ACCESS_GRANTED",
        direction: "OUT",
        patronName: patron.fullName,
        warning: "Exit recorded without corresponding entry session.",
      };
    }

    // Close open session
    const durationMs = now.getTime() - openSession.entryTime.getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    await prisma.gateSession.update({
      where: { id: openSession.id },
      data: {
        exitTime: now,
        durationMinutes,
        status: "CLOSED",
      },
    });

    await prisma.gateEvent.create({
      data: {
        sessionId: openSession.id,
        deviceId: deviceId || "GATE_EXIT_01",
        eventType: "EXIT",
        cardUid,
        rawTimestamp: now,
        status: "ACCEPTED",
      },
    });

    return {
      accepted: true,
      action: "ACCESS_GRANTED",
      direction: "OUT",
      patronName: patron.fullName,
      patronId: patron.id,
      institutionalId: patron.institutionalId,
      durationMinutes,
    };
  }
}

export async function getCurrentOccupancy() {
  const count = await prisma.gateSession.count({
    where: { status: "OPEN" },
  });
  return count;
}
