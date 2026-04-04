export function detectFrictionWithPoints(events: any[]) {
  let paragraphMap: Record<number, number> = {};

  for (let e of events) {
    const para = e.meta?.paragraph;

    if (para === undefined || para === null) continue;

    // initialize
    if (!paragraphMap[para]) {
      paragraphMap[para] = 0;
    }

    // scoring logic
    if (e.type === "pause" && e.value > 2) {
      paragraphMap[para] += 2;
    }

    if (e.type === "scroll" && e.value < 0.3) {
      paragraphMap[para] += 1;
    }

    if (e.type === "highlight") {
      paragraphMap[para] += 2;
    }
  }

  return paragraphMap;
}

export function getStrugglingParagraphs(scores: Record<number, number>) {
  let result: number[] = [];

  for (let para in scores) {
    if (scores[para] >= 5) {
      result.push(Number(para));
    }
  }

  return result;
}