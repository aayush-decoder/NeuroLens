/**
 * POST /api/auth/extension/register
 * Used by the browser extension to create a new account.
 * Creates user in Postgres, returns a signed JWT immediately.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "change-me"
);

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: "email, password and username required" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashed },
    });

    const token = await new SignJWT({ sub: user.id, email: user.email, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json(
      {
        access_token: token,
        token_type: "bearer",
        user_id: user.id,
        username: user.username,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[extension/register] Error:", err instanceof Error ? err.message : err);
    console.error("[extension/register] Full error:", err);
    
    if (err instanceof Error) {
      // Check for specific error types
      if (err.message.includes("unique constraint")) {
        return NextResponse.json({ error: "Email or username already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
