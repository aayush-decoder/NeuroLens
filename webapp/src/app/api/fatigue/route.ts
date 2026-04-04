import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateFatigue } from "@/lib/fatigue";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 }
      );
    }

    const session = await prisma.readingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const fatigue = calculateFatigue(session.startTime);

    return NextResponse.json(fatigue);

  } catch (error) {
    console.error("FATIGUE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to calculate fatigue" },
      { status: 500 }
    );
  }
}