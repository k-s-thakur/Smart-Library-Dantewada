import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, demoRole } = body;

    let user;

    // Fast demo switcher shortcut for testing
    if (demoRole) {
      user = await prisma.user.findFirst({
        where: { role: demoRole.toUpperCase() },
        include: { patron: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: { code: "DEMO_USER_NOT_FOUND", message: `Demo user for role ${demoRole} not found.` } },
          { status: 404 }
        );
      }
    } else {
      if (!email || !password) {
        return NextResponse.json(
          { error: { code: "MISSING_CREDENTIALS", message: "Email and password are required." } },
          { status: 400 }
        );
      }

      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { patron: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
          { status: 401 }
        );
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
          { status: 401 }
        );
      }
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "LIBRARIAN" | "STUDENT",
      patronId: user.patronId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patron: user.patron,
      },
    });

    response.cookies.set("slmts_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred during login." } },
      { status: 500 }
    );
  }
}
