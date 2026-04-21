# Multi-Lingual Cognate Mapper Implementation

## Overview
The **Multi-Lingual Cognate Mapper** is a feature that detects when a user is repeatedly stalling on simplified English text and automatically translates it to their preferred language (defaults to Hindi) after 5 seconds of dwell time. This simulates ESL (English as Second Language) support.

## Architecture

### Key Components

#### 1. **useAutoTranslate Hook** (`src/hooks/reader/useAutoTranslate.ts`)
Core hook that manages the cognate mapping workflow:

**Features:**
- Tracks dwell time on adapted (simplified) paragraphs
- Automatically triggers translation after 5-second stall threshold
- Manages paragraph visibility to ensure only active content is translated
- Prevents duplicate translation requests
- Provides translated text to the UI

**Key Methods:**
- `onParagraphAdapted(index, text)` - Called when paragraph text is simplified
- `onParagraphVisible(index)` - Called when paragraph enters viewport
- `onParagraphHidden(index)` - Called when paragraph leaves viewport
- `getTranslatedText(index, adaptedText)` - Returns translated or original text
- `isTranslating(index)` - Check if translation is in progress

**State Management:**
- `translatedParagraphs` - Map of paragraph index → translated text
- Internal tracking of dwell times and translation status per paragraph

#### 2. **Translation API** (`src/app/api/translate/route.ts`)
REST API endpoint that handles text translation:

**Endpoint:** `POST /api/translate`

**Input:**
```json
{
  "text": "The simplified English text here...",
  "language": "hindi",
  "sourceLanguage": "English" (optional)
}
```

**Output:**
```json
{
  "translatedText": "सरलीकृत पाठ यहाँ है...",
  "language": "hindi",
  "sourceLanguage": "English",
  "originalLength": 42,
  "translatedLength": 28,
  "translationsApplied": 5
}
```

**Translation Engine:**
- Uses AWS Bedrock's Qwen model for Hindi translations
- Leverages existing `adaptParagraphTranslate` utility from `src/lib/ai.ts`
- Handles bracketed definitions (e.g., "photosynthesis (making food from sunlight)")

#### 3. **ReaderPage Integration** (`src/screens/ReaderPage.tsx`)
Main reader component that orchestrates the feature:

**Integration Points:**
1. **Hook Initialization:**
   ```tsx
   const { translatedParagraphs, onParagraphAdapted: onAutoTranslate, ... } 
     = useAutoTranslate(preferredLanguage, 5000);
   ```

2. **Preference Setting:**
   - Added `preferredLanguage` state (defaults to 'hindi')
   - Can be changed via UI controls

3. **Event Flow:**
   - When paragraph is adapted → `onAutoTranslate(index, adaptedText)` called
   - Hook tracks dwell time on that paragraph
   - After 5 seconds, translation API is called automatically
   - Translated text flows to UI via `translatedParagraphs` state

4. **Rendered Text Pipeline:**
   ```
   Original Text 
     ↓
   Simplified English (via /api/adapt)
     ↓
   (5 seconds of dwell)
     ↓
   Translated Text (via /api/translate) 
     ↓
   Display in UI
   ```

5. **Visibility Tracking:**
   - Combined callbacks for both gloss (useGloss) and translation (useAutoTranslate)
   - Ensures translation only happens when paragraph is actively visible

## Workflow

### User Journey

1. **User opens document** → Reading begins
2. **User stalls on complex word** → Paragraph detected as "struggling"
3. **AI simplifies text** → English definitions added (via /api/adapt)
4. **User continues stalling** (5+ seconds) → Translation triggered
5. **User sees translated version** → With definitions in Hindi

### Code Flow

```
ReaderPage 
  → detectFrictionWithPoints() [telemetry]
  → categorizedStruggles identified
  → adaptReaderText() called [/api/adapt]
  → onAutoTranslate() called [hook]
  ↓
useAutoTranslate
  → startDwellTracking()
  → 5-second timeout
  → triggerTranslation() [/api/translate]
  → setTranslatedParagraphs()
  ↓
ReaderPage (via state update)
  → renderedParagraphs updates
  → Paragraph component re-renders with translated text
```

## Console Logging

The feature includes detailed logging for debugging:

```
🌐 [Cognate Mapper] Translating paragraph 3 to hindi...
✅ [Cognate Mapper] Translation complete for paragraph 3
   Original: Some simplified English text...
   Translated: हिंदी में अनुवादित पाठ...
```

## Configuration

### Preferred Language
The feature defaults to Hindi but can be configured:

```tsx
const [preferredLanguage, setPreferredLanguage] = useState('hindi');
```

Supports any language code (e.g., 'french', 'spanish', 'urdu')

### Dwell Time Threshold
Currently set to 5 seconds. Can be adjusted:

```tsx
useAutoTranslate(preferredLanguage, 5000) // milliseconds
```

## Testing

### Manual Test Script
A test script is available at `webapp/test-adapt-translate-chain.js`:

```bash
node test-adapt-translate-chain.js        # Uses Hindi
node test-adapt-translate-chain.js french # Uses French
```

This tests the full adapt → translate pipeline.

### UI Testing Checklist
- [ ] Start reading → paragraph becomes visible in viewport
- [ ] Hover/stall on difficult words (5+ seconds)
- [ ] Paragraph should be simplified with inline definitions
- [ ] After additional 5 seconds → should see Hindi translation
- [ ] Scroll past paragraph → translation stops (visibility check)
- [ ] Scroll back → translation resumes if still needed

## Performance Considerations

1. **Debounced Requests:** Only one translation per paragraph
2. **Visibility-Based:** Stops tracking hidden paragraphs
3. **State Management:** Uses Map for O(1) lookup per paragraph
4. **Async Translation:** Non-blocking API calls with proper error handling

## Error Handling

- Translation API failures log errors but don't block reading
- Falls back to simplified English if translation fails
- Network timeouts don't break the reading experience
- Invalid language codes return graceful errors

## Future Enhancements

1. **Bilingual Display:** Show both English and translated text side-by-side
2. **Pronunciation:** Add audio pronunciation for translated terms
3. **User Preferences:** Allow users to set preferred languages
4. **Analytics:** Track which paragraphs need translation most often
5. **Caching:** Cache translations to reduce API calls
6. **Progressive Enhancement:** Fallback to synonyms if translation unavailable

## Files Modified

- `src/hooks/reader/useAutoTranslate.ts` ✓ Created
- `src/screens/ReaderPage.tsx` ✓ Modified
- `src/app/api/translate/route.ts` ✓ Already exists (leveraged)

## Status

✅ **Fully Implemented and Integrated**

The feature is now ready for testing. The dev server should be running on `http://localhost:3000`.
