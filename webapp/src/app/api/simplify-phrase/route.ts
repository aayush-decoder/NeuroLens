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
    const { paragraph, phrase } = await req.json();

    if (!paragraph || typeof paragraph !== "string") {
      return NextResponse.json(
        { error: "paragraph is required" },
        { status: 400 }
      );
    }

    if (!phrase || typeof phrase !== "string") {
      return NextResponse.json(
        { error: "phrase is required" },
        { status: 400 }
      );
    }

    // Verify phrase exists in paragraph
    if (!paragraph.includes(phrase)) {
      return NextResponse.json(
        { error: "phrase not found in paragraph" },
        { status: 400 }
      );
    }

    console.log(`[simplify-phrase] Simplifying phrase (${phrase.length} chars) in paragraph (${paragraph.length} chars)`);

    // Try AI simplification with retry logic
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[simplify-phrase] Attempt ${attempt}/${MAX_RETRIES}`);

        const prompt = `You are a text simplification assistant. Simplify the given phrase while maintaining its meaning within the context of the paragraph.

CONTEXT PARAGRAPH:
${paragraph}

PHRASE TO SIMPLIFY:
"${phrase}"

REQUIREMENTS:
1. Simplify the phrase to make it easier to understand
2. Keep the simplified version approximately the same length (±20% of original)
3. Maintain the core meaning and context
4. Use simpler words and clearer structure
5. The simplified phrase should make sense in the context of the paragraph

Return ONLY valid JSON with no markdown fences, no explanation.

Schema:
{
  "originalPhrase": "${phrase}",
  "simplifiedPhrase": "<simplified version>",
  "explanation": "<brief explanation of what was simplified>"
}

Rules:
- Keep similar length to original phrase
- Use simpler vocabulary
- Maintain grammatical correctness
- Return ONLY the JSON object`;

        const command = new ConverseCommand({
          modelId: "qwen.qwen3-235b-a22b-2507-v1:0",
          messages: [
            {
              role: "user",
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: { maxTokens: 500, temperature: 0.3 },
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

        let parsed: {
          originalPhrase: string;
          simplifiedPhrase: string;
          explanation: string;
        };

        try {
          parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error(`[simplify-phrase] Attempt ${attempt}: JSON parse failed:`, parseErr);
          console.error("[simplify-phrase] Raw response:", raw);
          throw new Error(`JSON parse failed: ${parseErr}`);
        }

        if (!parsed.simplifiedPhrase) {
          throw new Error("Invalid response format: missing simplifiedPhrase");
        }

        console.log(`[simplify-phrase] Success on attempt ${attempt}`);
        console.log(`[simplify-phrase] Original: "${phrase}" (${phrase.length} chars)`);
        console.log(`[simplify-phrase] Simplified: "${parsed.simplifiedPhrase}" (${parsed.simplifiedPhrase.length} chars)`);

        return NextResponse.json({
          originalPhrase: phrase,
          simplifiedPhrase: parsed.simplifiedPhrase,
          explanation: parsed.explanation,
          source: "ai",
          originalLength: phrase.length,
          simplifiedLength: parsed.simplifiedPhrase.length,
        });
      } catch (error) {
        lastError = error as Error;
        console.error(`[simplify-phrase] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`[simplify-phrase] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed - return a basic fallback
    console.warn(`[simplify-phrase] All ${MAX_RETRIES} attempts failed. Last error:`, lastError);
    
    

    // Simple fallback: return the phrase as-is with a note
    return NextResponse.json({
      originalPhrase: phrase,
      simplifiedPhrase: phrase,
      explanation: "Unable to simplify at this time",
      source: "fallback",
      originalLength: phrase.length,
      simplifiedLength: phrase.length,
    });
  } catch (error: unknown) {
    console.error("[simplify-phrase] Error:", error);

    return NextResponse.json(
      { error: "Phrase simplification failed" },
      { status: 500 }
    );
  }
}
