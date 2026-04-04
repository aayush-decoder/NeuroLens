// src/lib/friction.ts

export function detectFrictionWithPoints(events: any[]) {
  let paragraphMap: Record<number, { points: number; maxPause: number }> = {};

  for (let e of events) {
    const para = e.meta?.paragraph;
    if (para === undefined || para === null) continue;

    if (!paragraphMap[para]) {
      paragraphMap[para] = { points: 0, maxPause: 0 };
    }

    if (e.type === "pause") {
      if (e.value > 2) paragraphMap[para].points += 2;
      // Track the longest pause to identify "Heavy Struggling"
      if (e.value > paragraphMap[para].maxPause) {
        paragraphMap[para].maxPause = e.value;
      }
    }

    if (e.type === "scroll" && e.value < 0.3) {
      paragraphMap[para].points += 1;
    }

    if (e.type === "highlight") {
      paragraphMap[para].points += 2;
    }
  }

  return paragraphMap;
}

export function getCategorizedStruggles(scores: Record<number, { points: number; maxPause: number }>) {
  let longStalls: number[] = [];
  let shortPauses: number[] = [];

  for (let para in scores) {
    const { points, maxPause } = scores[para];
    
    if (points >= 5) {
      // Logic: If they spent a long time (e.g., > 10s) on one spot, it's a Long Stall
      if (maxPause > 10) {
        longStalls.push(Number(para));
      } else {
        shortPauses.push(Number(para));
      }
    }
  }

  return { longStalls, shortPauses };
}