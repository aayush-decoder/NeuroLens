// src/lib/adaptation.ts
import { adaptParagraphSupport, adaptParagraphTranslate } from "./ai";
import { prisma } from "./prisma";

interface ParagraphReadingTiming {
  paragraphIndex: number;
  dwellTimeMs: number;
}

/**
 * Calculate user's max average reading time per paragraph based on historical data.
 * This serves as the threshold: if user exceeds this, trigger translation.
 * 
 * @param userId The user's unique identifier
 * @param lookbackSessions Number of past sessions to analyze (default: 10)
 * @returns Max average dwell time in milliseconds, or 15000ms default if no history
 */
export async function calculateMaxAvgReadingTime(
  userId: string,
  lookbackSessions: number = 10
): Promise<number> {
  try {
    // Get recent reading sessions for this user
    const sessions = await prisma.readingSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: lookbackSessions,
      include: { telemetryEvents: true }
    });

    if (sessions.length === 0) {
      // Default: 15 seconds per paragraph if no history
      return 15000;
    }

    // Extract dwell times from telemetry events
    const paragraphTimings: Map<number, number[]> = new Map();

    sessions.forEach(session => {
      session.telemetryEvents
        .filter(event => event.type === 'PARAGRAPH_DWELL')
        .forEach(event => {
          const meta = event.meta as { paragraphIndex: number } | null;
          const paragraphIndex = meta?.paragraphIndex || 0;
          const dwellTime = event.value || 0;

          if (!paragraphTimings.has(paragraphIndex)) {
            paragraphTimings.set(paragraphIndex, []);
          }
          paragraphTimings.get(paragraphIndex)!.push(dwellTime);
        });
    });

    // Calculate average for each paragraph, then find the max
    let maxAvg = 15000; // Default fallback
    paragraphTimings.forEach(timings => {
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
      // Use 1.5x the average as threshold to detect struggling
      const adjustedThreshold = avg * 1.5;
      maxAvg = Math.max(maxAvg, adjustedThreshold);
    });

    return Math.round(maxAvg);
  } catch (error) {
    console.error("Error calculating max reading time:", error);
    return 15000; // Safe default
  }
}

/**
 * Check if current reading time exceeds user's max average.
 * @param currentDwellTimeMs Time spent on current paragraph
 * @param maxAvgTimeMs User's max average reading time
 * @returns true if user is stuck beyond max average
 */
export function checkIfExceedsMaxAvg(
  currentDwellTimeMs: number,
  maxAvgTimeMs: number
): boolean {
  return currentDwellTimeMs > maxAvgTimeMs;
}

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

/**
 * Adapts content with smart time-based translation.
 * If user spends more time than their max average, translate to preferred language.
 * Otherwise, use standard friction-based adaptation (cognates or simplification).
 * 
 * @param fullText The original document text
 * @param paragraphTimings Array of {paragraphIndex, dwellTimeMs}
 * @param maxAvgTimeMs User's max average reading time
 * @param frictionType 'LONG_PAUSE' or 'SHORT_PAUSE'
 * @param preferredLang User's preferred language
 * @returns Adapted text
 */
export async function adaptContentWithTimeThreshold(
  fullText: string,
  paragraphTimings: ParagraphReadingTiming[],
  maxAvgTimeMs: number,
  frictionType: 'LONG_PAUSE' | 'SHORT_PAUSE',
  preferredLang: string = 'English'
) {
  const paragraphs = fullText.split("\n");
  const timingMap = new Map(paragraphTimings.map(t => [t.paragraphIndex, t.dwellTimeMs]));

  const updatedParagraphs = await Promise.all(
    paragraphs.map(async (para, index) => {
      const dwellTime = timingMap.get(index) || 0;

      // If user exceeded max average time: TRANSLATE to preferred language
      if (checkIfExceedsMaxAvg(dwellTime, maxAvgTimeMs) && preferredLang.toLowerCase() !== 'english') {
        console.log(`[ADAPT] Paragraph ${index} exceeded max avg (${dwellTime}ms > ${maxAvgTimeMs}ms) - translating to ${preferredLang}`);
        return await adaptParagraphTranslate(para, preferredLang);
      }

      // Otherwise: use standard adaptation (cognates or simplification)
      if (dwellTime > (maxAvgTimeMs * 0.7)) {
        // User is showing friction, apply standard adaptation
        const targetLanguage = frictionType === 'LONG_PAUSE' ? preferredLang : 'English';
        return await adaptParagraphSupport(para, targetLanguage, frictionType === 'LONG_PAUSE');
      }

      // Normal reading pace - no adaptation needed
      return para;
    })
  );

  return updatedParagraphs.join("\n");
}