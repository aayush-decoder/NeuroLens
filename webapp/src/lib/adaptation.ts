// src/lib/adaptation.ts
import { adaptParagraphSupport } from "./ai"; // Updated to the new AI function

/**
 * Adapts content based on the level of friction detected in specific paragraphs.
 * * @param fullText The original document text
 * @param strugglingParagraphs Array of indices where the user is stalling
 * @param frictionType 'LONG_PAUSE' for native cognates, 'SHORT_PAUSE' for English-only
 * @param preferredLang The user's target language from the Prisma User model
 */
export async function adaptContentAI(
  fullText: string,
  strugglingParagraphs: number[],
  frictionType: 'LONG_PAUSE' | 'SHORT_PAUSE',
  preferredLang: string = 'English'
) {
  const paragraphs = fullText.split("\n");

  const updatedParagraphs = await Promise.all(
    paragraphs.map(async (para, index) => {
      // Only adapt if the paragraph index is in the struggling list
      if (strugglingParagraphs.includes(index)) {
        /**
         * Logic: 
         * 1. If LONG_PAUSE: Use preferredLang for cognates/definitions.
         * 2. If SHORT_PAUSE (or highlights/slow scroll): Use English-only descriptions.
         */
        const targetLanguage = frictionType === 'LONG_PAUSE' ? preferredLang : 'English';
        
        return await adaptParagraphSupport(para, targetLanguage, frictionType === 'LONG_PAUSE');
      }
      return para;
    })
  );

  return updatedParagraphs.join("\n");
}