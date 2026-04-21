import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let requestBody;
  try {
    requestBody = await req.json();
    const { sessionId, type, value, meta } = requestBody;

    if (!sessionId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId or type" }, 
        { status: 400 }
      );
    }

    const event = await prisma.telemetryEvent.create({
      data: {
        sessionId,
        type,
        value: value ?? null,
        meta: meta && Object.keys(meta).length > 0 ? meta : undefined,
      },
    });

    return NextResponse.json(event);
    
  } catch (error: any) {
    // 🛑 HANDLE THE FOREIGN KEY ERROR GRACEFULLY
    if (error.code === 'P2003') {
      console.warn(`⚠️ Telemetry dropped: Session [${requestBody?.sessionId}] does not exist in DB yet.`);
      // Return a 200 or 404 so the frontend doesn't panic, but we stop the crash
      return NextResponse.json({ 
        ignored: true, 
        reason: "Session not found" 
      }, { status: 200 }); 
    }

    console.error("🔥 TELEMETRY API ERROR:", error);
    return NextResponse.json(
      { error: "Telemetry failed", details: error.message }, 
      { status: 500 }
    );
  }
}
