// src/lib/adaptation.ts
import { adaptParagraphSupport } from "./ai";

export async function adaptContentAI(
  fullText: string,
  strugglingParagraphs: number[],
  frictionType: 'LONG_PAUSE' | 'SHORT_PAUSE' = 'SHORT_PAUSE',
  preferredLang: string = 'English'
) {
  const paragraphs = fullText.split("\n");

  const updatedParagraphs = await Promise.all(
    paragraphs.map(async (para, index) => {
      // Only adapt if the paragraph index is in the struggling list
      if (strugglingParagraphs.includes(index)) {
        
        // If it's a long pause, we use their preferred language for translations. 
        // If it's a short pause, we just stick to English synonyms.
        const targetLanguage = frictionType === 'LONG_PAUSE' ? preferredLang : 'English';
        
        // Call the new AWS Bedrock function we created!
        return await adaptParagraphSupport(para, targetLanguage, frictionType === 'LONG_PAUSE');
      }
      
      // If they aren't struggling here, return the original text
      return para;
    })
  );

  return updatedParagraphs.join("\n");
}