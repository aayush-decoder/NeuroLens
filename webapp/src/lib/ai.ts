// src/lib/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function adaptParagraphSupport(
  text: string, 
  targetLang: string, 
  isLongStall: boolean
) {
  try {
    const prompt = isLongStall 
      ? `The user is struggling heavily with this paragraph. 
         Rewrite the paragraph in English, but for every complex word, 
         add its COGNATE or a short definition in ${targetLang} in brackets next to it.
         Example: "The ubiquitous [ubicuo] nature of technology..."
         Text: "${text}"`
      : `The user is slightly struggling with this paragraph. 
         Keep the text in English.
         - Simplify the given paragraph for better understanding.
          - Add SHORT inline explanations for difficult words in brackets.
          - DO NOT change lines of paragraphs
          - DO NOT change overall meaning.
          - DO NOT make it too long.
          - Keep it clean and readable.
         Text: "${text}"`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("AI Adaptation Error:", error);
    return text; // Fallback to original
  }
}


