import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, type, value, meta } = await req.json();

    const event = await prisma.telemetryEvent.create({
      data: {
        sessionId,
        type,
        value,
        meta,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "Telemetry failed" }, { status: 500 });
  }
}