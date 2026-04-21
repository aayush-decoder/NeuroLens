// src/app/api/session/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      contentId,
      title,
      body,
      startedAt,
      difficulty = "medium",
      language = "en",
    } = await req.json();

    if (!userId || !contentId) {
      return NextResponse.json(
        { error: "userId and contentId are required" },
        { status: 400 }
      );
    }

    // 1. Upsert the User
    // We must provide 'username' and 'password' because they are required in the schema!
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `user-${userId}@neurolens.local`,
        username: `guest-${userId}`,       // 👈 FIX: Added missing required field
        password: "stub-password-12345",   // 👈 FIX: Added missing required field
      },
    });

    // 2. Upsert the Content
    const content = await prisma.content.upsert({
      where: { id: contentId },
      create: {
        id: contentId,
        title: title || contentId,
        body: body || "",
        difficulty,
        language,
      },
      update: {
        title: title || undefined,
        body: body || undefined,
        difficulty,
        language,
      },
    });

    // 3. Create the Session
    // We must pass BOTH userId and contentId!
    const session = await prisma.readingSession.create({
      data: {
        userId: user.id, // 👈 FIX: We must pass the userId to satisfy the schema relation
        contentId: content.id,
        startTime: startedAt ? new Date(startedAt) : undefined,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      contentId: content.id,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("🔥 SESSION START ERROR:", error);
    
    // Return a local offline fallback if database completely fails
    return NextResponse.json({
      sessionId: `local:${crypto.randomUUID()}`,
      contentId: null,
      offline: true,
      error: process.env.NODE_ENV === "production" ? "Failed to start session" : message,
    });
  }
}