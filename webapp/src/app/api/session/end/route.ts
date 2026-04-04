import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    const session = await prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        status: "completed",
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}