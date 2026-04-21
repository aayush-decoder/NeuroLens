import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectFrictionWithPoints, getStrugglingParagraphs } from "@/lib/friction";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    const events = await prisma.telemetryEvent.findMany({
      where: { sessionId },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const paragraphScores = detectFrictionWithPoints(events);

    const strugglingParagraphs = getStrugglingParagraphs(paragraphScores);

    return NextResponse.json({
      paragraphScores,
      strugglingParagraphs
    });

  } catch (error) {
    console.error("ANALYZE ERROR:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}