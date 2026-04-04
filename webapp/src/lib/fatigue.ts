export function calculateFatigue(startTime: Date) {
  const now = new Date();
  const durationMs = now.getTime() - new Date(startTime).getTime();

  const minutes = durationMs / (1000 * 60);

  // Define thresholds
  if (minutes < 5) {
    return {
      level: "LOW",
      settings: {
        theme: "light",
        fontWeight: 400,
        lineHeight: 1.5,
        contrast: "normal",
      },
    };
  }

  if (minutes < 15) {
    return {
      level: "MEDIUM",
      settings: {
        theme: "soft",
        fontWeight: 450,
        lineHeight: 1.6,
        contrast: "medium",
      },
    };
  }

  if (minutes < 30) {
    return {
      level: "HIGH",
      settings: {
        theme: "dark",
        fontWeight: 500,
        lineHeight: 1.7,
        contrast: "high",
      },
    };
  }

  //  Very long sessions
  return {
    level: "EXTREME",
    settings: {
      theme: "dark",
      fontWeight: 600,
      lineHeight: 1.8,
      contrast: "very-high",
    },
  };
}