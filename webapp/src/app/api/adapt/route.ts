// src/app/api/adapt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adaptContentAI } from "@/lib/adaptation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract new parameters: userId and frictionType
    const { text, strugglingParagraphs, userId, frictionType } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 2. Fetch the user's preferred language for the "Multi-Lingual Cognate Mapper"
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true }
    });

    // 3. Pass all context to the adaptation logic
    const modifiedText = await adaptContentAI(
      text,
      strugglingParagraphs || [],
      frictionType, // 'LONG_PAUSE' or 'SHORT_PAUSE'
      user?.preferredLang || 'English'
    );

    return NextResponse.json({ modifiedText });

  } catch (error) {
    console.error("ADAPT ERROR:", error);
    return NextResponse.json({ error: "Adaptation failed" }, { status: 500 });
  }
}