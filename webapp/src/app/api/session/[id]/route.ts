import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.readingSession.findUnique({
      where: { id },
      include: {
        telemetryEvents: true,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Session not found" }, { status: 500 });
  }
}