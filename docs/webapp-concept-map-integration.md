# Webapp Reader Concept Map Integration

## Overview
The webapp reader now builds the concept map incrementally as paragraphs enter the viewport, using LLM to extract ALL hard words from each paragraph (not just hardcoded wordmap). This provides comprehensive concept map building with AI-powered word identification.

## Key Changes

### New Logic (Current)
- Paragraphs in viewport on page load → immediately extract hard words using LLM
- New paragraph enters viewport → immediately extract hard words using LLM
- LLM identifies ALL difficult words (not limited to wordmap)
- Categorize extracted words using LLM
- No waiting for adaptation (20s dwell)
- Concept map builds as user scrolls

### Old Logic (Previous)
- Only extract words from hardcoded wordmap (limited vocabulary)
- Wait 20s dwell time → adapt paragraph
- Extract words from adapted HTML
- Concept map builds slowly

## Implementation

### Files Modified
- `webapp/src/screens/ReaderPage.tsx`

### Changes Made

#### 1. State Management
```typescript
// Concept map state (incremental)
const conceptMapWords = useRef<Record<string, number[]>>({});
const conceptMapCategories = useRef<Record<string, string[]>>({});
const categorizedParagraphs = useRef(new Set<number>());
```

#### 2. Categorization from Original Text (LLM-powered)
```typescript
const categorizeParagraphFromOriginal = useCallback(async (paraIndex: number) => {
  // Skip if already categorized
  if (categorizedParagraphs.current.has(paraIndex)) return;
  
  const originalText = paragraphs[paraIndex];
  
  // Step 1: Extract hard words using LLM
  const extractRes = await fetch('/api/extract-hard-words', {
    method: 'POST',
    body: JSON.stringify({ text: originalText }),
  });
  
  const extractData = await extractRes.json();
  const hardWords = extractData.hardWords || [];
  
  // Step 2: Categorize the hard words using LLM
  const categorizeRes = await fetch('/api/categorize', {
    method: 'POST',
    body: JSON.stringify({ words: hardWords }),
  });
  
  // Merge categories into global state
  categorizedParagraphs.current.add(paraIndex);
}, [paragraphs]);
```

#### 3. Hook into Paragraph Visibility
```typescript
// Wrap onParagraphVisible to trigger categorization
const onParagraphVisible = useCallback((index: number, text: string) => {
  originalOnParagraphVisible(index, text);
  // Categorize this paragraph when it enters viewport
  void categorizeParagraphFromOriginal(index);
}, [originalOnParagraphVisible, categorizeParagraphFromOriginal]);
```

#### 4. Categorize Initially Visible Paragraphs
```typescript
useEffect(() => {
  if (!storageReady || !file || paragraphs.length === 0) return;
  
  // Wait for layout to settle
  setTimeout(() => {
    paragraphs.forEach((_, index) => {
      const paraElement = document.querySelector(`[data-index="${index}"]`);
      if (paraElement) {
        const rect = paraElement.getBoundingClientRect();
        const isVisible = rect.top < viewportHeight && rect.bottom > 0;
        if (isVisible) {
          void categorizeParagraphFromOriginal(index);
        }
      }
    });
  }, 500);
}, [storageReady, file, paragraphs, categorizeParagraphFromOriginal]);
```

#### 3. Translation Function
```typescript
const translateParagraph = useCallback(async (paraIndex: number, adaptedText: string) => {
  // Check if already translating
  if (pendingTranslations.current.has(paraIndex)) return;
  
  pendingTranslations.current.add(paraIndex);
  
  // Get user's preferred language (default: hindi)
  const language = 'hindi';
  
  // Call /api/translate
  const res = await fetch('/api/translate', {
    method: 'POST',
    body: JSON.stringify({ text: adaptedText, language }),
  });
  
  // Update adapted paragraph with translated version
  setAdaptedParagraphs(current => ({ ...current, [paraIndex]: data.translatedText }));
  
  pendingTranslations.current.delete(paraIndex);
}, []);
```

#### 4. Call After Adaptation
```typescript
// In the adaptation useEffect, after extractAndCategorizeWords:
setTimeout(() => {
  translateParagraph(targetIndex, adapted);
}, 10000); // 10 seconds after adaptation
```

## Flow

### Webapp Reader Timeline
```
Page loads
    ↓
Identify paragraphs in viewport
    ↓
For each visible paragraph:
  → Call /api/extract-hard-words (LLM identifies ALL hard words)
  → Call /api/categorize (LLM categorizes words)
    ↓
Concept map starts building immediately
    ↓
User scrolls → new paragraph enters viewport
    ↓
Call /api/extract-hard-words (LLM)
    ↓
Call /api/categorize (LLM)
    ↓
Concept map grows incrementally
    ↓
(Optional: 20s dwell → /api/adapt → translation)
    ↓
User opens review modal
    ↓
Concept map already complete → instant render!
```

No waiting required - concept map builds as user reads!
LLM identifies ALL hard words, not limited to hardcoded wordmap!

## Comparison: Extension vs Webapp

### Extension
- **Trigger**: 10 seconds dwell time
- **State**: `window._arConceptMapCategories`
- **Location**: `extension/content/telemetry.js`
- **Render**: `extension/content/overlay.js`

### Webapp
- **Trigger**: Paragraph enters viewport (immediate)
- **Extraction**: `/api/extract-hard-words` (LLM identifies ALL hard words)
- **Categorization**: `/api/categorize` (LLM categorizes words)
- **Fallback**: Wordmap if LLM fails
- **Adaptation**: `/api/adapt` called after 20s dwell (optional)
- **Translation**: `/api/translate` called 10s after adaptation (optional)
- **State**: `conceptMapCategories.current`, `categorizedParagraphs`
- **Location**: `webapp/src/screens/ReaderPage.tsx`
- **Render**: `webapp/src/components/Review/ReviewModal.tsx` (future)

## Console Logs

### Expected Output
```
[Reader] Initial categorization for para 0 (in viewport)
[Reader] Para 0: extracting hard words from original text (length: 245)
[Reader] Para 0: found 8 hard words (source: ai): ["technological", "organizations", "continuously", "efficiency", "innovation", "artificial", "intelligence", "transforming"]
[Reader] Para 0: categorization success (source: ai)
[Reader] Concept map updated. Total categories: 3
[Reader] Initial categorization for para 1 (in viewport)
[Reader] Para 1: extracting hard words from original text (length: 198)
[Reader] Para 1: found 5 hard words (source: ai): ["sovereignty", "diplomatic", "jurisdiction", "bilateral", "mediation"]
[Reader] Para 1: categorization success (source: ai)
[Reader] Concept map updated. Total categories: 4
(User scrolls down)
[Reader] Para 2: extracting hard words from original text (length: 312)
[Reader] Para 2: found 6 hard words (source: ai): ["militia", "combat", "casualties", "insurgency", "armistice", "retaliation"]
[Reader] Para 2: categorization success (source: ai)
[Reader] Concept map updated. Total categories: 5
```

## Usage

### Access Concept Map Data
```typescript
// In any component that needs the concept map
const categories = conceptMapCategories.current;
const words = conceptMapWords.current;

// Example: Show in review modal
<ConceptMap categories={categories} words={words} />
```

### Check Current State
```javascript
// In browser console
console.log(window.conceptMapCategories);
console.log(window.conceptMapWords);
```

## Benefits

### 1. Comprehensive Word Coverage
- LLM identifies ALL hard words, not just hardcoded wordmap
- Adapts to any domain or topic
- No manual vocabulary maintenance required

### 2. Instant Concept Map
- No waiting for adaptation (20s dwell)
- Categorization happens as user scrolls
- Concept map ready when review modal opens

### 3. Better User Experience
- Immediate feedback
- No blocking operations
- Smooth, progressive building

### 4. AI-Powered Intelligence
- LLM understands context and difficulty
- Accurate categorization
- Fallback to wordmap if LLM fails

### 5. Minimal Changes
- Only one file modified
- Uses existing refs pattern
- No new dependencies

## Future Enhancements

### 1. Review Modal Integration
Add concept map visualization to `ReviewModal.tsx`:
```typescript
<ReviewModal 
  conceptMapCategories={conceptMapCategories.current}
  conceptMapWords={conceptMapWords.current}
/>
```

### 2. Real-time Visualization
Show concept map building in sidebar as user reads

### 3. Export Functionality
Allow users to download concept map as JSON or image

### 4. Persistence
Save concept map to session state for restoration

## Testing

### Manual Test
1. Open webapp reader with any document
2. Check console immediately - should see hard word extraction for visible paragraphs
3. Verify LLM identifies words beyond hardcoded wordmap
4. Scroll down to reveal new paragraphs
5. Check console - should see extraction + categorization for each new paragraph
6. Verify concept map builds incrementally
7. Check `conceptMapCategories.current` in console
8. (Optional) Wait 20s on a paragraph to see adaptation
9. (Optional) Wait 10 more seconds to see translation

### Test New Endpoint
Run the test script:
```powershell
.\webapp\test-extract-hard-words.ps1
```

Expected output:
- Source: "ai" (or "fallback" if LLM fails)
- Count: number of hard words found
- List of hard words identified by LLM

### Verify API Calls
1. Open Network tab in DevTools
2. Filter for `/api/`
3. Load the reader page
4. Verify sequence for each visible paragraph:
   - `/api/extract-hard-words` (LLM extracts hard words)
   - `/api/categorize` (LLM categorizes words)
5. Scroll down
6. Verify same sequence for each new paragraph entering viewport
7. (Optional) Wait 20s to see `/api/adapt` → (10s) → `/api/translate`

## Integration Status

✅ State management added  
✅ LLM-powered hard word extraction (`/api/extract-hard-words`)  
✅ LLM-powered categorization (`/api/categorize`)  
✅ Hook into paragraph visibility  
✅ Categorize initially visible paragraphs on mount  
✅ Categorize new paragraphs as they enter viewport  
✅ Track categorized paragraphs to avoid duplicates  
✅ Categories merged incrementally  
✅ Wordmap fallback if LLM fails  
✅ Console logging added  
✅ Adaptation still works (20s dwell, optional)  
✅ Translation still works (10s after adapt, optional)  
⏳ Review modal visualization (future)  
⏳ Persistence to session state (future)  

## Summary

The webapp reader now builds the concept map immediately as paragraphs enter the viewport, using LLM to identify ALL hard words (not limited to hardcoded wordmap). The flow is: viewport entry → `/api/extract-hard-words` (LLM) → `/api/categorize` (LLM) → concept map updated. This provides comprehensive, AI-powered concept map building that adapts to any content domain.
