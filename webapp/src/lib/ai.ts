import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
});

export async function simplifyParagraph(text: string) {
  try {
    const prompt = `
You are an educational assistant.

Task:
- Simplify the given paragraph for better understanding.
- Add SHORT inline explanations for difficult words in brackets.
- DO NOT change lines of paragraphs
- DO NOT change overall meaning.
- DO NOT make it too long.
- Keep it clean and readable.

Text:
${text}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return output;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text; // fallback
  }
}