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

    const session = await prisma.readingSession.create({
      data: {
        userId,
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
    console.error("SESSION START ERROR:", error);
    return NextResponse.json({
      sessionId: `local:${crypto.randomUUID()}`,
      contentId: null,
      offline: true,
      error: process.env.NODE_ENV === "production" ? "Failed to start session" : message,
    });
  }
}