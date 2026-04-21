# Incremental Concept Map Building

## Overview
The concept map is now built **incrementally** as the user reads, with each adapted paragraph contributing words to the map in real-time.

## How It Works

### Old Approach (Batch)
```
User reads entire article
    ↓
Clicks "Review & End"
    ↓
Collects ALL words at once
    ↓
Categorizes ALL words (one API call)
    ↓
Renders concept map
```

### New Approach (Incremental)
```
User reads paragraph (10s)
    ↓
/api/adapt called → paragraph simplified
    ↓
Extract hard words from THIS paragraph
    ↓
/api/categorize called for THESE words
    ↓
Merge into global concept map state
    ↓
(Repeat for each paragraph)
    ↓
User clicks "Review & End"
    ↓
Use pre-built categories → instant render!
```

## Implementation

### 1. State Management (telemetry.js)

**New Global State:**
```javascript
window._arConceptMapWords = {};
// Structure: { "word": [para_idx1, para_idx2, ...] }
// Tracks which paragraphs each word appeared in

window._arConceptMapCategories = {};
// Structure: { "Political": ["word1", "word2"], "Military": [...] }
// Incrementally built categories
```

### 2. Word Extraction (telemetry.js)

**After each paragraph is adapted:**
```javascript
function extractAndCategorizeWords(para, idx) {
    // 1. Find all .ar-hard-word spans in paragraph
    const hardWords = [];
    para.querySelectorAll(".ar-hard-word").forEach(span => {
        hardWords.push(span.textContent.toLowerCase());
    });
    
    // 2. Call /api/categorize for these words
    chrome.runtime.sendMessage({
        type: "CATEGORIZE_WORDS",
        words: hardWords,
        paragraph_index: idx
    }, response => {
        // 3. Merge categories into global state
        mergeCategories(response.categories);
    });
}
```

### 3. Category Merging

**Merge logic:**
```javascript
// For each category in response
Object.keys(response.categories).forEach(category => {
    if (!window._arConceptMapCategories[category]) {
        window._arConceptMapCategories[category] = [];
    }
    
    // Add words (avoid duplicates)
    response.categories[category].forEach(word => {
        if (!window._arConceptMapCategories[category].includes(word)) {
            window._arConceptMapCategories[category].push(word);
        }
    });
});
```

### 4. Rendering (overlay.js)

**Check for incremental data first:**
```javascript
function buildConceptGraph(container) {
    // Priority 1: Use incrementally built data
    if (window._arConceptMapCategories && 
        Object.keys(window._arConceptMapCategories).length > 0) {
        renderConceptGraph(container, window._arConceptMapCategories);
        return;
    }
    
    // Priority 2: Collect from DOM and categorize
    // (fallback for edge cases)
    const words = collectWordsFromDOM();
    categorizeAndRender(words);
}
```

## Timeline Example

### User Reading Session:

**0:00** - User starts reading  
**0:10** - Para 0 adapted → Extract ["sovereignty", "diplomatic"]  
**0:11** - /api/categorize → Political: ["sovereignty", "diplomatic"]  
**0:20** - Para 0 translated  
**0:30** - Para 1 adapted → Extract ["militia", "combat"]  
**0:31** - /api/categorize → Military: ["militia", "combat"]  
**0:40** - Para 1 translated  
**1:00** - Para 2 adapted → Extract ["archipelago"]  
**1:01** - /api/categorize → Geographic: ["archipelago"]  
**1:10** - Para 2 translated  
**1:30** - User clicks "Review & End"  
**1:30** - Concept map renders **instantly** (data already built!)

## Benefits

### 1. **Faster Review**
- No waiting for categorization at the end
- Map renders instantly when user clicks "Review & End"

### 2. **Better UX**
- Categorization happens in background while user reads
- No blocking operations during review

### 3. **Distributed Load**
- API calls spread across reading session
- Not all at once at the end

### 4. **Paragraph Tracking**
- Know which paragraphs each word came from
- Can show "word appeared in paragraphs 2, 5, 7"

### 5. **Progressive Enhancement**
- Map builds as user reads
- Can show partial map even if session interrupted

## API Call Pattern

### Old Pattern (Batch)
```
Session: 10 paragraphs, 30 unique words
API calls: 1 (at end, with 30 words)
```

### New Pattern (Incremental)
```
Session: 10 paragraphs, 30 unique words
API calls: 10 (one per paragraph, ~3 words each)
Total words categorized: 30 (same)
```

## Fallback Strategy

### Three-Level Fallback:

**Level 1: Incremental AI (Best)**
- Words categorized as paragraphs are read
- Uses `window._arConceptMapCategories`

**Level 2: Batch AI (Good)**
- Collect all words from DOM at review time
- Call `/api/categorize` once with all words

**Level 3: Hardcoded (Reliable)**
- Use `WORD_CATEGORIES` dictionary
- Always works, even offline

## Performance

### API Calls
- **Frequency**: Once per adapted paragraph
- **Size**: 2-5 words per call (small)
- **Timing**: During reading (non-blocking)

### Memory
- **Words map**: ~1KB per 100 words
- **Categories map**: ~500 bytes per 50 words
- **Total**: <10KB for typical session

### Network
- **Bandwidth**: ~500 bytes per request
- **Total**: ~5KB for 10 paragraphs
- **Spread**: Over entire reading session

## Telemetry

### New Event
```javascript
sendTelemetry("concept_map_updated", {
    paragraph_index: 2,
    words_added: 3,
    total_words: 15,
    total_categories: 4
});
```

### Console Logs
```
[AR:telemetry] Para 0: categorizing 3 words: ["sovereignty", "diplomatic", "sanctions"]
[AR:telemetry] Para 0: categorization success, source: ai
[AR:telemetry] Concept map updated. Total categories: 2
[AR:telemetry] Para 1: categorizing 2 words: ["militia", "combat"]
[AR:telemetry] Para 1: categorization success, source: ai
[AR:telemetry] Concept map updated. Total categories: 3
...
[AR:overlay] Using incrementally built concept map from session
[AR:overlay] Categories: Political, Military, Geographic
[AR:overlay] Total words: 15
```

## Edge Cases

### 1. No Adapted Paragraphs
- Falls back to DOM collection
- Works like old approach

### 2. API Failures
- Individual failures don't break entire map
- Successful categorizations still used
- Fallback to hardcoded for failed words

### 3. Session Interrupted
- Partial map still available
- Shows what was categorized so far

### 4. Duplicate Words
- Automatically deduplicated
- Tracks all paragraphs word appeared in

## Future Enhancements

1. **Real-time visualization**: Show map building as user reads
2. **Word frequency**: Size nodes by occurrence count
3. **Paragraph links**: Click word to see which paragraphs
4. **Category confidence**: Show AI confidence scores
5. **User corrections**: Allow manual recategorization
6. **Export data**: Save concept map as JSON

## Testing

### Verify Incremental Building
1. Open extension on article
2. Read paragraph for 10+ seconds
3. Check console: `[AR:telemetry] Para 0: categorizing X words`
4. Wait for: `[AR:telemetry] Concept map updated`
5. Read another paragraph (10+ seconds)
6. Check console: `Total categories` should increase
7. Click "Review & End"
8. Check console: `Using incrementally built concept map`
9. Verify map renders instantly (no loading delay)

### Console Commands
```javascript
// Check current concept map state
console.log(window._arConceptMapCategories);
console.log(window._arConceptMapWords);

// Check how many words categorized
Object.keys(window._arConceptMapWords).length;

// Check how many categories
Object.keys(window._arConceptMapCategories).length;
```

## Summary

The concept map now builds **paragraph by paragraph** as the user reads, making the final review instant and providing better insights into the reading session. Each adapted paragraph triggers categorization of its hard words, which are merged into a global state that's ready when the user clicks "Review & End".
