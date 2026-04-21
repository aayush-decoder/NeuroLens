import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { text, language = "hindi" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // Extract all bracketed content [like this] or (like this)
    const bracketPattern = /[\[\(]([^\]\)]+)[\]\)]/g;
    const matches = Array.from(text.matchAll(bracketPattern));

    if (matches.length === 0) {
      // No brackets found, return original text
      console.log("[translate] No brackets or parentheses found");
      return NextResponse.json({ translatedText: text, language, translationsApplied: 0 });
    }

    console.log(`[translate] Found ${matches.length} bracketed phrases`);

    // Extract unique phrases to translate, but skip long phrases (5+ words)
    const phrasesToTranslate = [...new Set(
      matches
        .map(m => m[1])
        .filter(phrase => {
          const wordCount = phrase.trim().split(/\s+/).length;
          return wordCount < 9; // Only translate phrases with less than 7 words
        })
    )];

    if (phrasesToTranslate.length === 0) {
      // All phrases were too long, return original text
      console.log("[translate] All phrases too long (5+ words), skipping translation");
      return NextResponse.json({ translatedText: text, language, translationsApplied: 0 });
    }

    const prompt = `You are a translation assistant. Translate the following English phrases to ${language}.

Return ONLY valid JSON with no markdown fences, no explanation, no extra text.

Schema:
{
  "translations": [
    { "english": "<original phrase>", "translated": "<${language} translation>" }
  ]
}

Rules:
- Provide accurate ${language} translations
- Keep translations concise (similar length to original)
- Use native script (e.g., Devanagari for Hindi, not transliteration)
- Maintain the same meaning and tone
- Return ONLY the JSON object, nothing else

Phrases to translate:
${phrasesToTranslate.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;

    console.log(`[translate] Translating ${phrasesToTranslate.length} phrases to ${language}`);
    console.log("[translate] Phrases:", phrasesToTranslate);

    // Retry logic for LLM JSON parsing failures
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[translate] Attempt ${attempt}/${MAX_RETRIES}`);

        const command = new ConverseCommand({
          modelId: "qwen.qwen3-235b-a22b-2507-v1:0",
          messages: [
            {
              role: "user",
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: { maxTokens: 1000, temperature: 0.3 },
        });

        const response = await client.send(command);
        const raw = response.output?.message?.content?.[0]?.text || "";

        if (!raw) {
          throw new Error("Empty response from Bedrock");
        }

        // Strip potential markdown code fences
        const jsonStr = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        let parsed: { translations: Array<{ english: string; translated: string }> };
        try {
          parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error(`[translate] Attempt ${attempt}: Failed to parse JSON:`, parseErr);
          console.error("[translate] Raw response:", raw);
          throw new Error(`JSON parse failed: ${parseErr}`);
        }

        if (!Array.isArray(parsed.translations)) {
          throw new Error("Invalid translation format: translations is not an array");
        }

        // Build translation map
        const translationMap = new Map<string, string>();
        parsed.translations.forEach(t => {
          if (t.english && t.translated) {
            translationMap.set(t.english.trim(), t.translated.trim());
          }
        });

        // Replace brackets/parentheses with translated versions
        let translatedText = text;
        matches.forEach(match => {
          const originalPhrase = match[1];
          const translated = translationMap.get(originalPhrase);
          if (translated) {
            // Replace (original) or [original] with translated version
            // Preserve the original bracket type
            const fullMatch = match[0]; // includes brackets/parentheses
            const openChar = fullMatch[0]; // ( or [
            const closeChar = openChar === "(" ? ")" : "]";
            translatedText = translatedText.replace(
              `${openChar}${originalPhrase}${closeChar}`,
              `${openChar}${translated}${closeChar}`
            );
          }
        });

        console.log(`[translate] Success on attempt ${attempt}: Translated ${translationMap.size} phrases to ${language}`);

        return NextResponse.json({
          translatedText,
          language,
          translationsApplied: translationMap.size,
        });
      } catch (error) {
        lastError = error as Error;
        console.error(`[translate] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

        if (attempt < MAX_RETRIES) {
          // Wait before retrying (exponential backoff: 1s, 2s, 4s)
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`[translate] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    console.error(`[translate] All ${MAX_RETRIES} attempts failed. Last error:`, lastError);
    return NextResponse.json(
      { error: "Translation failed after retries", translatedText: text, language, translationsApplied: 0 },
      { status: 500 }
    );

  } catch (error: unknown) {
    console.error("[translate] Error:", error);
    return NextResponse.json(
      { error: "Translation failed", translatedText: req.body },
      { status: 500 }
    );
  }
}
