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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, password } = body as Record<string, unknown>;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    console.log("[extension/login] Email:", email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("[extension/login] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (!user.password) {
      console.log("[extension/login] No password stored");
      return NextResponse.json(
        { error: "This account uses a different sign-in method" },
        { status: 401 }
      );
    }

    console.log("[extension/login] Comparing passwords...");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    console.log("[extension/login] Passwords match. Creating payload...");
    const jwtPayload = {
      sub: user.id ?? "",
      email: user.email ?? "",
      username: user.username ?? "",
    };

    console.log("[extension/login] Signing JWT with payload...");
    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    console.log("[extension/login] JWT Created. Returning response...");
    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user_id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[extension/login] Unexpected error! Message:", error?.message);
    console.error("[extension/login] Stack trace:", error?.stack);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

