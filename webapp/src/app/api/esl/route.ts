import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scanWordmap } from "../simplify/wordmap";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let text: string;

  try {
    const parsed = JSON.parse(rawBody);
    text = parsed?.text;
  } catch (parseErr) {
    console.error("[esl] Bad JSON body:", parseErr);
    return NextResponse.json({ error: "Invalid JSON body", words: [] }, { status: 400 });
  }

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required", words: [] }, { status: 400 });
  }

  const safeText = text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
    .slice(0, 4000);

  try {
    const prompt = `You are a Hindi-language reading assistant helping ESL (English as Second Language) learners who speak Hindi.

Given the paragraph below, identify up to 8 words or short phrases that would be hard for a Hindi-speaking student.
For each, provide a SHORT Hindi equivalent or explanation (max 5 Hindi words).

Return ONLY valid JSON. No markdown fences, no explanation.

Schema:
{
  "words": [
    { "original": "<exact word or phrase from text>", "meaning": "<short Hindi meaning>" }
  ]
}

Rules:
- "original" must appear verbatim in the paragraph.
- Provide Hindi script meanings, not transliterations.
- Skip very common English words (the, and, is, was, etc.).
- If no suitable words, return { "words": [] }.

Paragraph:
${safeText}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { words: Array<{ original: string; meaning: string }> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.warn("[esl] Gemini parse failed, falling back to wordmap");
      return NextResponse.json({ words: scanWordmap(text, "hindi"), source: "wordmap" });
    }

    if (!Array.isArray(parsed.words)) {
      return NextResponse.json({ words: scanWordmap(text, "hindi"), source: "wordmap" });
    }

    const words = parsed.words
      .filter((w) => w && typeof w.original === "string" && typeof w.meaning === "string")
      .map((w) => ({ original: w.original.trim(), meaning: w.meaning.trim() }));

    return NextResponse.json({ words, source: "ai" });
  } catch (error: unknown) {
    console.error("[esl] AI failed, falling back to wordmap:", error);
    const fallback = scanWordmap(text, "hindi");
    return NextResponse.json({ words: fallback, source: "wordmap" });
  }
}
