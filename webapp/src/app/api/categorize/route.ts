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

// Fallback categories (expanded with more diversity)
const FALLBACK_CATEGORIES = {
  Political: ["sovereignty", "diplomatic", "unilateral", "assertions", "rhetoric", "sanctions", "bureaucracy", "intervention", "jurisdiction", "arbitration", "paramountcy", "assertiveness", "advocates", "entitlements", "governance", "policy", "democracy", "legislation"],
  Military: ["paramilitary", "militia", "guerilla", "combat", "casualties", "insurgency", "armistice", "militarization", "interdiction", "espionage", "retaliation", "retribution", "subversion", "hostile", "fortification", "warfare", "defense", "battalion", "strategic"],
  Geographic: ["archipelago", "coastal", "maritime", "oceanic", "navigation", "reclamation", "annexed", "disputed", "displacement", "transnational", "occupation", "expropriation", "terrain", "topography", "peninsula", "continental", "territorial"],
  Humanitarian: ["misery", "harassment", "intimidated", "adversity", "vulnerability", "resilience", "displacement", "oblivion", "detention", "precarious", "vexation", "abduction", "fatalities", "evacuated", "refugee", "asylum", "persecution", "suffering"],
  Legal: ["extrajudicial", "impunity", "jurisdiction", "insubordination", "penalized", "infringement", "deterrent", "obstruction", "deterrence", "collateral", "negotiation", "coercion", "cooperation", "litigation", "statute", "constitutional", "judicial"],
  Economic: ["commerce", "trade", "fiscal", "monetary", "investment", "capital", "revenue", "expenditure", "inflation", "recession", "prosperity", "subsidy", "tariff", "commodity", "market", "financial", "economic"],
  Scientific: ["hypothesis", "empirical", "methodology", "analysis", "synthesis", "theoretical", "experimental", "quantitative", "qualitative", "research", "innovation", "discovery", "paradigm", "phenomenon"],
  Social: ["community", "societal", "cultural", "demographic", "ethnicity", "diversity", "inclusion", "inequality", "stratification", "cohesion", "integration", "marginalization", "solidarity"],
  Environmental: ["ecosystem", "biodiversity", "sustainability", "conservation", "pollution", "deforestation", "renewable", "climate", "ecological", "habitat", "endangered", "preservation"],
  Medical: ["diagnosis", "treatment", "therapeutic", "pathology", "syndrome", "epidemic", "pandemic", "vaccination", "pharmaceutical", "clinical", "prognosis", "symptom"],
  Educational: ["pedagogy", "curriculum", "literacy", "academia", "scholarship", "tuition", "enrollment", "graduation", "accreditation", "certification"],
  Technological: ["digital", "algorithm", "automation", "artificial", "intelligence", "computing", "software", "hardware", "innovation", "cybersecurity", "infrastructure"],
  Cultural: ["heritage", "tradition", "customs", "folklore", "ritual", "ceremony", "artistic", "aesthetic", "indigenous", "multicultural"],
  Historical: ["chronological", "archival", "legacy", "antiquity", "medieval", "colonial", "revolutionary", "contemporary", "prehistoric"],
  Philosophical: ["ethics", "morality", "metaphysical", "epistemology", "ontology", "existential", "ideology", "doctrine", "principle"],
};

function fallbackCategorize(words: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  words.forEach((word) => {
    const lowerWord = word.toLowerCase();
    let found = false;

    for (const [category, categoryWords] of Object.entries(FALLBACK_CATEGORIES)) {
      if (categoryWords.includes(lowerWord)) {
        if (!result[category]) result[category] = [];
        result[category].push(word);
        found = true;
        break;
      }
    }

    if (!found) {
      if (!result["Other"]) result["Other"] = [];
      result["Other"].push(word);
    }
  });

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { words } = await req.json();

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: "words array is required" },
        { status: 400 }
      );
    }

    console.log(`[categorize] Categorizing ${words.length} words`);

    // Try AI categorization with retry logic
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[categorize] Attempt ${attempt}/${MAX_RETRIES}`);

        const prompt = `You are a semantic categorization assistant. Categorize the following words into thematic categories.

Available categories:
- Political: government, diplomacy, policy, authority, governance
- Military: warfare, defense, armed forces, combat, weapons
- Geographic: location, territory, land, navigation, places
- Humanitarian: human welfare, suffering, aid, rights, relief
- Legal: law, justice, courts, regulations, rights
- Economic: finance, trade, business, commerce, markets
- Scientific: research, technology, innovation, discovery, analysis
- Social: community, culture, relationships, society, behavior
- Environmental: nature, climate, ecology, conservation, sustainability
- Medical: health, disease, treatment, medicine, healthcare
- Educational: learning, teaching, knowledge, academia, training
- Technological: digital, computing, software, hardware, innovation
- Cultural: arts, traditions, heritage, customs, beliefs
- Historical: past events, legacy, heritage, chronology, archives
- Philosophical: ethics, morality, reasoning, wisdom, ideology
- Other: words that don't fit above categories

Return ONLY valid JSON with no markdown fences, no explanation.

Schema:
{
  "categories": {
    "Political": ["word1", "word2"],
    "Military": ["word3"],
    "Geographic": ["word4", "word5"],
    "Humanitarian": ["word6"],
    "Legal": ["word7"],
    "Economic": ["word8"],
    "Scientific": ["word9"],
    "Social": ["word10"],
    "Environmental": ["word11"],
    "Medical": ["word12"],
    "Educational": ["word13"],
    "Technological": ["word14"],
    "Cultural": ["word15"],
    "Historical": ["word16"],
    "Philosophical": ["word17"],
    "Other": ["word18"]
  }
}

Rules:
- Each word must appear in exactly one category
- Use the exact word spelling from input
- Empty categories can be omitted
- Return ONLY the JSON object

Words to categorize:
${words.map((w, i) => `${i + 1}. ${w}`).join("\n")}`;

        const command = new ConverseCommand({
          modelId: "qwen.qwen3-235b-a22b-2507-v1:0",
          messages: [
            {
              role: "user",
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: { maxTokens: 1000, temperature: 0.2 },
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

        let parsed: { categories: Record<string, string[]> };
        try {
          parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error(`[categorize] Attempt ${attempt}: JSON parse failed:`, parseErr);
          throw new Error(`JSON parse failed: ${parseErr}`);
        }

        if (!parsed.categories || typeof parsed.categories !== "object") {
          throw new Error("Invalid response format: missing categories object");
        }

        console.log(`[categorize] Success on attempt ${attempt}`);

        return NextResponse.json({
          categories: parsed.categories,
          source: "ai",
          wordsProcessed: words.length,
        });
      } catch (error) {
        lastError = error as Error;
        console.error(`[categorize] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`[categorize] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed - use fallback
    console.warn(`[categorize] All ${MAX_RETRIES} attempts failed, using fallback. Last error:`, lastError);
    const fallbackResult = fallbackCategorize(words);

    return NextResponse.json({
      categories: fallbackResult,
      source: "fallback",
      wordsProcessed: words.length,
    });
  } catch (error: unknown) {
    console.error("[categorize] Error:", error);

    // Final fallback
    const { words } = await req.json().catch(() => ({ words: [] }));
    if (Array.isArray(words) && words.length > 0) {
      const fallbackResult = fallbackCategorize(words);
      return NextResponse.json({
        categories: fallbackResult,
        source: "fallback",
        wordsProcessed: words.length,
      });
    }

    return NextResponse.json(
      { error: "Categorization failed", categories: {} },
      { status: 500 }
    );
  }
}
