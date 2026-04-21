# Translation Integration in Chrome Extension

## Overview
The Chrome extension now automatically translates simplified definitions from English to the user's preferred language (default: Hindi) after a paragraph has been adapted.

## Flow

### Timeline
```
User reads paragraph
    ↓
10 seconds dwell time
    ↓
/api/adapt called → Paragraph simplified with English definitions
    ↓
10 seconds delay (AR_TRANSLATE_DELAY_MS)
    ↓
/api/translate called → Definitions translated to target language
```

### Example Transformation

**Original:**
```
Artificial intelligence is transforming industries.
```

**After /api/adapt (10s):**
```
Artificial intelligence (technology that acts like human thinking) is transforming (changing) industries (business sectors).
```

**After /api/translate (20s total):**
```
Artificial intelligence (तकनीक जो मानव सोच की तरह काम करती है) is transforming (बदल रहा है) industries (व्यापार क्षेत्र).
```

## Configuration

### Thresholds (in telemetry.js)
```javascript
// TODO: Make these thresholds configurable via settings panel
const AR_ADAPT_DWELL_THRESHOLD_MS = 10000;  // 10 seconds before adapt
const AR_TRANSLATE_DELAY_MS = 10000;        // 10 seconds after adapt
```

### Language Selection
The translation language is read from Chrome storage:
- Default: `"hindi"`
- Configurable via extension popup settings
- Stored in: `chrome.storage.sync.get("language")`

## Implementation Details

### Files Modified

1. **extension/content/telemetry.js**
   - Added `AR_TRANSLATE_DELAY_MS` constant
   - Added `window._arTranslatingSet` to track translation state
   - Added `triggerTranslation()` function
   - Modified `triggerAdaptation()` to schedule translation after adapt

2. **extension/background.js**
   - Added `TRANSLATE_PARAGRAPH` message handler
   - Added `handleTranslate()` function to call `/api/translate`

### Message Flow

```javascript
// Content script → Background script
chrome.runtime.sendMessage({
    type: "TRANSLATE_PARAGRAPH",
    text: adaptedText,
    language: "hindi",
    paragraph_index: 0
}, callback);

// Background script → Webapp API
fetch('/api/translate', {
    method: 'POST',
    body: JSON.stringify({
        text: adaptedText,
        language: "hindi"
    })
});
```

### State Management

- `window._arAdaptingSet`: Tracks paragraphs being adapted
- `window._arTranslatingSet`: Tracks paragraphs being translated
- Prevents duplicate translation requests
- Checks if paragraph still exists before translating

### CSS Classes

- `.ar-adapted`: Applied after /api/adapt completes
- `.ar-translated`: Applied after /api/translate completes

## Telemetry Events

New event added:
```javascript
sendTelemetry("translation_shown", {
    paragraph_index: Number(idx),
    language: language,
    translations_applied: res.translationsApplied || 0
});
```

## Error Handling

- If translation fails, paragraph keeps the adapted (English) version
- Translation is skipped if:
  - Paragraph no longer exists
  - Paragraph is no longer adapted
  - Translation already in progress

## Future Improvements (TODO)

1. Make thresholds configurable via settings panel
2. Add visual indicator during translation (loading state)
3. Allow users to toggle auto-translation on/off
4. Support multiple language preferences
5. Add retry logic for translation failures
6. Cache translations to avoid re-translating same content

## Testing

Run the extension and:
1. Navigate to any article
2. Read a paragraph for 10+ seconds
3. Observe English definitions appear
4. Wait another 10 seconds
5. Observe definitions translate to Hindi (or selected language)

Check console logs:
```
[AR:telemetry] Para 0: adapt success, replacing paragraph
[AR:telemetry] Para 0: scheduling translation in 10000ms
[AR:telemetry] Para 0: translating to hindi
[AR:telemetry] Para 0: translation success, applied 5 translations
```
