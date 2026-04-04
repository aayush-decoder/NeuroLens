import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, contentId } = await req.json();

    const session = await prisma.readingSession.create({
      data: {
        userId,
        contentId,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}