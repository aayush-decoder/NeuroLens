// src/app/api/adapt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  adaptContentAI, 
  adaptContentWithTimeThreshold,
  calculateMaxAvgReadingTime 
} from "@/lib/adaptation";
import { prisma } from "@/lib/prisma";

interface ParagraphTiming {
  index: number;
  dwellTimeMs: number;
}

export async function POST(req: NextRequest) {
  try {
    // Extract parameters
    const { 
      text, 
      strugglingParagraphs, 
      userId, 
      frictionType,
      paragraphTimings, // NEW: Array of {index, dwellTimeMs}
      useTimeThreshold // NEW: Whether to use time-based translation
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch user data: preferred language and reading history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const preferredLang = user.preferredLang || 'English';

    // ============================================
    // NEW: Time-based Translation Logic
    // ============================================
    if (useTimeThreshold && paragraphTimings && paragraphTimings.length > 0) {
      // Calculate user's max average reading time from history
      const maxAvgTimeMs = await calculateMaxAvgReadingTime(userId);
      
      console.log(`[ADAPT] User ${userId}: maxAvgTime=${maxAvgTimeMs}ms, preferredLang=${preferredLang}`);

      // Use smart time-based adaptation
      const modifiedText = await adaptContentWithTimeThreshold(
        text,
        paragraphTimings.map((timing: ParagraphTiming) => ({
          paragraphIndex: timing.index,
          dwellTimeMs: timing.dwellTimeMs
        })),
        maxAvgTimeMs,
        frictionType || 'LONG_PAUSE',
        preferredLang
      );

      return NextResponse.json({ 
        modifiedText,
        adaptationType: 'TIME_THRESHOLD',
        maxAvgTimeMs,
        paragraphsAdapted: paragraphTimings.length
      });
    }

    // ============================================
    // Legacy: Friction-based Adaptation
    // ============================================
    const modifiedText = await adaptContentAI(
      text,
      strugglingParagraphs || [],
      frictionType || 'LONG_PAUSE',
      preferredLang
    );

    return NextResponse.json({ 
      modifiedText,
      adaptationType: 'FRICTION_BASED'
    });

  } catch (error) {
    console.error("ADAPT ERROR:", error);
    return NextResponse.json({ error: "Adaptation failed" }, { status: 500 });
  }
}