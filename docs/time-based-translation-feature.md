# Reading Time-Based Translation Feature

## Overview
This feature automatically translates paragraphs to the user's preferred language when they spend more time reading than their personal average, helping users overcome comprehension barriers.

## Feature Flow

```
User Reading Session
    ↓
[Telemetry Engine] Tracks dwell time per paragraph
    ↓
User Exceeds Max Avg Time on Paragraph?
    ├─ YES → [API: /adapt] Triggers Translation
    │         ↓
    │      [Calculate Max Avg] Query historical data
    │         ↓
    │      [Translate] Full translation to preferred language
    │         ↓
    │      Return translated paragraph
    │
    └─ NO → [Standard Adaptation] Cognates or simplification
            ↓
         Return adapted paragraph
```

## Architecture

### 1. **Telemetry Tracking** (`src/engines/telemetryEngine.ts`)
- Already tracks `dwellTimeMs` per paragraph
- Records hesitation count and scroll velocity
- Data stored in `TelemetryEvent` table

### 2. **Max Average Calculation** (`src/lib/adaptation.ts`)
New function: `calculateMaxAvgReadingTime(userId: string, lookbackSessions: number = 10)`
- Queries user's last 10 reading sessions
- Extracts dwell times from `TelemetryEvent` with type `PARAGRAPH_DWELL`
- Calculates average time per paragraph
- Returns max average × 1.5 as threshold (to account for normal variation)
- Default fallback: 15 seconds if no history

**Logic:**
```
For each paragraph across all sessions:
  avg_time = sum(dwell_times) / count
Max threshold = highest_avg × 1.5
Return threshold (default 15000ms if insufficient data)
```

### 3. **Time-Based Adaptation** (`src/lib/adaptation.ts`)
New function: `adaptContentWithTimeThreshold(...)`
- Takes paragraph timings and max average threshold
- For each paragraph:
  - If **exceeds max average** → **TRANSLATE** to preferred language
  - If **70-100% of max average** → Apply standard adaptation (cognates/simplification)
  - If **below 70%** → No adaptation needed

### 4. **Translation Function** (`src/lib/ai.ts`)
New function: `adaptParagraphTranslate(text: string, targetLang: string)`
- Uses Gemini AI to translate paragraph to user's language
- Simple, direct translation (preserves meaning and structure)
- Fallback to original if translation fails or language is English

### 5. **Updated API Endpoint** (`src/app/api/adapt/route.ts`)
**Request:**
```json
{
  "text": "Full document text",
  "userId": "user_id",
  "frictionType": "LONG_PAUSE",
  "preferredLang": "Spanish",
  "paragraphTimings": [
    { "index": 2, "dwellTimeMs": 18000 },
    { "index": 5, "dwellTimeMs": 22000 }
  ],
  "useTimeThreshold": true
}
```

**Response:**
```json
{
  "modifiedText": "Adapted/translated content",
  "adaptationType": "TIME_THRESHOLD",
  "maxAvgTimeMs": 15000,
  "paragraphsAdapted": 2
}
```

## Implementation Integration Points

### From Reading Component
After detecting paragraph dwell times, send to `/api/adapt`:

```typescript
// example-reader.tsx
import { enterParagraph, recordHesitation } from '@/engines/telemetryEngine';

const onParagraphBlur = async (paragraphIndex: number) => {
  const currentDwellTime = Date.now() - telemetryState.paragraphEntryTime;
  
  // Send to adaptation API with timing data
  const response = await fetch('/api/adapt', {
    method: 'POST',
    body: JSON.stringify({
      text: fullText,
      userId: user.id,
      frictionType: 'LONG_PAUSE', // Detected from scroll speed, hesitations, etc.
      useTimeThreshold: true,
      paragraphTimings: [
        { index: paragraphIndex, dwellTimeMs: currentDwellTime }
      ]
    })
  });

  const { modifiedText, adaptationType, maxAvgTimeMs } = await response.json();
  
  if (adaptationType === 'TIME_THRESHOLD') {
    console.log(`Paragraph exceeded max avg (${maxAvgTimeMs}ms), translated to user language`);
  }
  
  // Replace paragraph with adapted version
  updateParagraphContent(paragraphIndex, modifiedText);
};
```

## Thresholds & Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Lookback Sessions | 10 | Number of past sessions to analyze for average |
| Default Max Avg Time | 15000ms (15s) | Used if user has no history |
| Time Multiplier | 1.5× | Threshold = avg × 1.5 to account for variation |
| Friction Band | 70% of max | 0.7 × maxAvg triggers standard adaptation |
| Default Dwell Threshold | 8000ms | Existing telemetry constant |

## Database Updates

### TelemetryEvent Table
Ensure telemetry events are logged with:
- `type: 'PARAGRAPH_DWELL'`
- `meta: { paragraphIndex: number }`
- `value: dwellTimeMs`

### Adaptation Table (Optional)
Store adaptations for analytics:
```sql
INSERT INTO Adaptation (sessionId, paragraph, type, original, modified)
VALUES (?, ?, 'TIME_TRANSLATION', ?, ?)
```

## Fallback Strategy

1. **No history** → Use 15 second default
2. **Translation API fails** → Return original text
3. **Preferred language is English** → Skip translation
4. **Missing paragraph timing** → Use standard friction adaptation

## Performance Considerations

- **calculateMaxAvgReadingTime**: Runs once per session, queries DB (consider caching)
- **adaptParagraphTranslate**: Called only when user exceeds threshold (1-2 times per session typically)
- **API calls**: Batch send paragraph timings once user leaves paragraph

## Testing Checklist

- [ ] User with no reading history gets 15s default threshold
- [ ] User with history: max avg is calculated correctly
- [ ] Paragraph > max avg gets translated
- [ ] Paragraph 70-100% of max avg gets standard adaptation
- [ ] Paragraph < 70% of max avg has no adaptation
- [ ] Non-English preferences trigger translation
- [ ] English preference skips translation
- [ ] Translation fails gracefully
- [ ] Multiple paragraphs processed correctly
- [ ] Response includes correct adaptationType

## Future Enhancements

1. **ML-based threshold refinement** - Learn per-user optimal thresholds
2. **Language-specific adjustments** - Different thresholds for different target languages
3. **Vocabulary difficulty scoring** - Adjust translation vs. simplification based on word complexity
4. **A/B testing** - Compare translation vs. cognates in user engagement
5. **Caching** - Cache user's max avg time for faster API response
