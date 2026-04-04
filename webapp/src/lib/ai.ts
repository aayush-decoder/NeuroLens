// src/lib/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function simplifyParagraph(text: string) {
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

/**
 * Translate paragraph to user's preferred language when they exceed max reading time.
 * Used when user spends significantly more time than their personal average on a paragraph.
 * 
 * @param text The paragraph to translate
 * @param targetLang User's preferred language (e.g., 'Spanish', 'French')
 * @returns Translated paragraph in target language
 */
export async function adaptParagraphTranslate(
  text: string,
  targetLang: string
) {
  if (targetLang.toLowerCase() === 'english') {
    return text; // No translation needed
  }

  try {
    const prompt = `Translate the following paragraph to ${targetLang}. 
         Keep the meaning and structure intact.
         Provide only the translated text, nothing else.
         Text: "${text}"`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("AI Translation Error:", error);
    return text; // Fallback to original
  }
}


