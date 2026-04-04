/**
 * POST /api/auth/extension/login
 * Used by the browser extension to authenticate.
 * Checks credentials against Postgres, returns a signed JWT.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "change-me"
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await new SignJWT({ sub: user.id, email: user.email, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user_id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("[extension/login]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
