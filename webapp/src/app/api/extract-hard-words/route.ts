import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { scanWordmap } from "@/lib/wordmap";

const client = new BedrockRuntimeClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    console.log(`[extract-hard-words] Extracting hard words from text (length: ${text.length})`);

    // Try AI extraction with retry logic
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[extract-hard-words] Attempt ${attempt}/${MAX_RETRIES}`);

        const prompt = `You are a vocabulary difficulty analyzer. Identify all difficult/advanced words in the following text that a typical reader might struggle with.

Focus on:
- Technical terms
- Academic vocabulary
- Uncommon words
- Domain-specific jargon
- Words above high school reading level

Return ONLY valid JSON with no markdown fences, no explanation.

Schema:
{
  "hardWords": ["word1", "word2", "word3"]
}

Rules:
- Return words in their original form (as they appear in text)
- Include only genuinely difficult words (not common words)
- Minimum 4 letters per word
- Return ONLY the JSON object
- If no hard words found, return empty array

Text to analyze:
${text}`;

        const command = new ConverseCommand({
          modelId: "qwen.qwen3-235b-a22b-2507-v1:0",
          messages: [
            {
              role: "user",
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: { maxTokens: 500, temperature: 0.2 },
        });

        const response = await client.send(command);
        const raw = response.output?.message?.content?.[0]?.text || "";

        if (!raw) {
          throw new Error("Empty response from Bedrock");
        }

        // Strip markdown fences
        const jsonStr = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        let parsed: { hardWords: string[] };
        try {
          parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error(`[extract-hard-words] Attempt ${attempt}: JSON parse failed:`, parseErr);
          throw new Error(`JSON parse failed: ${parseErr}`);
        }

        if (!Array.isArray(parsed.hardWords)) {
          throw new Error("Invalid response format: hardWords is not an array");
        }

        // Deduplicate and normalize
        const uniqueWords = [...new Set(parsed.hardWords.map(w => w.toLowerCase()))];

        console.log(`[extract-hard-words] Success on attempt ${attempt}: found ${uniqueWords.length} hard words`);

        return NextResponse.json({
          hardWords: uniqueWords,
          source: "ai",
          count: uniqueWords.length,
        });
      } catch (error) {
        lastError = error as Error;
        console.error(`[extract-hard-words] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`[extract-hard-words] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed - use wordmap fallback
    console.warn(`[extract-hard-words] All ${MAX_RETRIES} attempts failed, using wordmap fallback. Last error:`, lastError);
    const fallbackWords = scanWordmap(text);
    const uniqueWords = [...new Set(fallbackWords.map(w => w.original.toLowerCase()))];

    return NextResponse.json({
      hardWords: uniqueWords,
      source: "fallback",
      count: uniqueWords.length,
    });
  } catch (error: unknown) {
    console.error("[extract-hard-words] Error:", error);

    // Final fallback - try wordmap
    try {
      const { text } = await req.json();
      if (text && typeof text === "string") {
        const fallbackWords = scanWordmap(text);
        const uniqueWords = [...new Set(fallbackWords.map(w => w.original.toLowerCase()))];
        return NextResponse.json({
          hardWords: uniqueWords,
          source: "fallback",
          count: uniqueWords.length,
        });
      }
    } catch {}

    return NextResponse.json(
      { error: "Hard word extraction failed", hardWords: [] },
      { status: 500 }
    );
  }
}
