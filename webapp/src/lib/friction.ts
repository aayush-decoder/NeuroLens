import type { JsonValue } from "@prisma/client/runtime/library";

interface TelemetryEvent {
  type: string;
  value: number;
  meta?: JsonValue;
}

export function detectFrictionWithPoints(events: TelemetryEvent[]) {
  const paragraphMap: Record<number, number> = {};

  for (const e of events) {
    const para = e.meta && typeof e.meta === 'object' && !Array.isArray(e.meta)
      ? (e.meta as { paragraph?: number }).paragraph
      : undefined;
    if (para === undefined || para === null) continue;

    if (!paragraphMap[para]) paragraphMap[para] = 0;

    if (e.type === "pause" && e.value > 2) paragraphMap[para] += 2;
    if (e.type === "scroll" && e.value < 0.3) paragraphMap[para] += 1;
    if (e.type === "highlight") paragraphMap[para] += 2;
  }

  return paragraphMap;
}

export function getStrugglingParagraphs(scores: Record<number, number>) {
  const result: number[] = [];
  for (const para in scores) {
    if (scores[para] >= 5) result.push(Number(para));
  }
  return result;
}
