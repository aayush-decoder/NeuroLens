import { NextRequest, NextResponse } from "next/server";
import { adaptContentAI } from "@/lib/adaptation";

export async function POST(req: NextRequest) {
  try {
    const { text, strugglingParagraphs } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const modifiedText = await adaptContentAI(
      text,
      strugglingParagraphs || []
    );

    return NextResponse.json({ modifiedText });

  } catch (error) {
    console.error("ADAPT ERROR:", error);
    return NextResponse.json(
      { error: "Adaptation failed" },
      { status: 500 }
    );
  }
}