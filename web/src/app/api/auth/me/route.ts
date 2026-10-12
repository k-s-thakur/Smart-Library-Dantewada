import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      patronId: true,
      patron: {
        include: {
          cards: true,
          loans: {
            where: { status: { in: ["ACTIVE", "OVERDUE"] } },
            include: { copy: { include: { book: true } } },
          },
        },
      },
    },
  });

  return NextResponse.json({ user });
}
