import { simplifyParagraph } from "./ai";

export async function adaptContentAI(
  fullText: string,
  strugglingParagraphs: number[]
) {
  const paragraphs = fullText.split("\n");

  const updatedParagraphs = await Promise.all(
    paragraphs.map(async (para, index) => {
      if (strugglingParagraphs.includes(index)) {
        return await simplifyParagraph(para);
      }
      return para;
    })
  );

  return updatedParagraphs.join("\n");
}