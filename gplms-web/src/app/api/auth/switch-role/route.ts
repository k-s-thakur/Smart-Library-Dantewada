import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SessionUser, UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, memberId } = body;

    let sessionUser: SessionUser | null = null;

    if (role === "MEMBER") {
      const member = memberId
        ? await prisma.member.findUnique({ where: { id: memberId } })
        : await prisma.member.findFirst({ where: { status: "ACTIVE" } });

      if (!member) {
        return NextResponse.json({ error: "No active member found" }, { status: 404 });
      }

      sessionUser = {
        id: member.id,
        email: member.email,
        name: member.fullName,
        role: "MEMBER",
        memberId: member.id,
        memberNo: member.memberNo,
      };
    } else {
      const staff = await prisma.staffUser.findFirst({
        where: { role: role as string },
      });

      if (!staff) {
        return NextResponse.json({ error: `Staff user with role ${role} not found` }, { status: 404 });
      }

      sessionUser = {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role as UserRole,
      };
    }

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set("gplms_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
