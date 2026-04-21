import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scanWordmap } from "./wordmap";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface SimplifyResult {
  words: Array<{
    original: string;
    meaning: string;
  }>;
}

export async function POST(req: NextRequest) {
  // Use req.text() first so malformed JSON gives us a clean 400, not a 500
  const rawBody = await req.text();
  let text = "";

  try {
    try {
      const parsed = JSON.parse(rawBody);
      text = parsed?.text || "";
    } catch (parseErr) {
      console.error("[simplify] Bad JSON body:", parseErr, "| raw:", rawBody.slice(0, 200));
      return NextResponse.json({ error: "Invalid JSON body", words: [] }, { status: 400 });
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required", words: [] }, { status: 400 });
    }

    // Sanitize: remove control characters (except \n \t) that break Gemini's JSON output
    /* eslint-disable no-control-regex */
    const safeText = text
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
      /* eslint-enable no-control-regex */
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      .slice(0, 4000);


    const prompt = `You are a reading-comprehension assistant.

Given the paragraph below, identify up to 8 words or short phrases that a non-native English speaker or student might find difficult.
For each, provide a SHORT, plain-English meaning (max 5 words).

Return ONLY valid JSON. No markdown fences, no explanation.

Schema:
{
  "words": [
    { "original": "<exact word or phrase from text>", "meaning": "<short plain meaning>" }
  ]
}

Rules:
- "original" must appear verbatim in the paragraph (case-sensitive match preferred, but case-insensitive acceptable).
- Skip very common words (the, and, is, was, etc.).
- Prefer technical, academic, or uncommon words.
- If no hard words exist, return { "words": [] }.

Paragraph:
${safeText}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip potential markdown code fences the model sometimes adds despite instructions
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: SimplifyResult;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.warn("[simplify] Gemini parse failed, falling back to wordmap");
      return NextResponse.json({ words: scanWordmap(text, "meaning"), source: "wordmap" });
    }

    // Validate shape
    if (!Array.isArray(parsed.words)) {
      return NextResponse.json({ words: scanWordmap(text, "meaning"), source: "wordmap" });
    }

    const words = parsed.words
      .filter(
        (w) =>
          w &&
          typeof w.original === "string" &&
          typeof w.meaning === "string" &&
          w.original.trim() &&
          w.meaning.trim()
      )
      .map((w) => ({ original: w.original.trim(), meaning: w.meaning.trim() }));

    return NextResponse.json({ words, source: "ai" });
  } catch (error: unknown) {
    console.error("[simplify] AI failed, falling back to wordmap:", error);
    const fallback = scanWordmap(text, "meaning");
    return NextResponse.json({ words: fallback, source: "wordmap" });
  }
}
