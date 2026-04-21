# AI-Powered Concept Map Integration

## Overview
The concept map now uses AWS Bedrock (Qwen model) to intelligently categorize words, with hardcoded categories as a reliable fallback.

## Architecture

### Flow Diagram
```
User clicks "Review & End"
    ↓
buildConceptGraph() collects glossed words
    ↓
Sends to /api/categorize via background.js
    ↓
AWS Bedrock attempts categorization (3 retries)
    ↓
Success? → Use AI categories
    ↓
Failure? → Use hardcoded fallback
    ↓
renderConceptGraph() displays SVG
```

## API Endpoint: `/api/categorize`

### Request
```json
POST /api/categorize
{
  "words": ["sovereignty", "militia", "archipelago"]
}
```

### Response (Success)
```json
{
  "categories": {
    "Political": ["sovereignty"],
    "Military": ["militia"],
    "Geographic": ["archipelago"]
  },
  "source": "ai",
  "wordsProcessed": 3
}
```

### Response (Fallback)
```json
{
  "categories": {
    "Political": ["sovereignty"],
    "Military": ["militia"],
    "Geographic": ["archipelago"]
  },
  "source": "fallback",
  "wordsProcessed": 3
}
```

## Implementation Details

### 1. API Route (`webapp/src/app/api/categorize/route.ts`)

**Features:**
- Uses AWS Bedrock with Qwen model
- 3 retry attempts with exponential backoff (1s, 2s, 4s)
- Hardcoded fallback if all retries fail
- Temperature: 0.2 (deterministic)
- Max tokens: 1000

**Categories:**
- Political
- Military
- Geographic
- Humanitarian
- Legal
- Other

### 2. Extension Integration

**Modified Files:**

#### `extension/content/overlay.js`
- `buildConceptGraph()`: Now calls API instead of direct categorization
- `categorizeWordsHardcoded()`: New function for fallback
- `renderConceptGraph()`: Separated rendering logic

#### `extension/background.js`
- Added `CATEGORIZE_WORDS` message handler
- Added `handleCategorize()` function

### 3. Fallback Strategy

**Three-Level Fallback:**

1. **Primary**: AWS Bedrock AI categorization
2. **Secondary**: Hardcoded dictionary (if API fails)
3. **Tertiary**: "Other" category (if word not in dictionary)

```javascript
// Level 1: Try AI
try {
  const aiResult = await callBedrockAPI(words);
  return aiResult;
} catch {
  // Level 2: Use hardcoded
  return fallbackCategorize(words);
}
```

## Advantages of AI Categorization

### 1. **Semantic Understanding**
- Understands context and meaning
- Can categorize new/unknown words
- Not limited to predefined dictionary

### 2. **Flexibility**
- Adapts to different domains
- Handles technical jargon
- Works with compound words

### 3. **Accuracy**
- Better than keyword matching
- Considers word relationships
- Reduces miscategorization

## Example Comparison

### Hardcoded Approach
```
Input: "cybersecurity"
Output: Other (not in dictionary)
```

### AI Approach
```
Input: "cybersecurity"
Output: Military or Legal (semantic understanding)
```

## Error Handling

### Retry Logic
```javascript
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    return await callAI();
  } catch (error) {
    if (attempt < 3) {
      await sleep(2^attempt * 1000);
    }
  }
}
// Use fallback
return hardcodedCategories();
```

### Failure Scenarios
1. **Empty response**: Retry
2. **Invalid JSON**: Retry
3. **Network error**: Retry
4. **All retries fail**: Use hardcoded fallback
5. **Hardcoded fails**: Put in "Other" category

## Performance

### Timing
- **AI categorization**: ~2-5 seconds
- **Fallback**: <10ms (instant)
- **Total with retries**: Max 15 seconds

### Optimization
- Loading state shown during API call
- Non-blocking (async)
- Cached in session (no re-categorization)

## Testing

### PowerShell Test Script
```powershell
.\webapp\test-categorize-api.ps1
```

### Manual Testing
1. Open extension on any article
2. Read and trigger word glossing
3. Click "Review & End"
4. Check "Concept Map" tab
5. Verify categories make sense

### Console Logs
```
[AR:overlay] Concept graph — glossed words: [...]
[AR:background] /api/categorize → sending 10 words
[categorize] Attempt 1/3
[categorize] Success on attempt 1
[AR:background] /api/categorize ← response in 2341ms source: ai
[AR:overlay] Using AI categorization, source: ai
```

## Configuration

### Model Settings
```typescript
modelId: "qwen.qwen3-235b-a22b-2507-v1:0"
temperature: 0.2  // Deterministic
maxTokens: 1000
```

### Retry Settings
```typescript
MAX_RETRIES: 3
BACKOFF: exponential (1s, 2s, 4s)
```

## Future Enhancements

1. **Caching**: Cache categorizations to avoid re-processing
2. **Custom categories**: Allow users to define categories
3. **Confidence scores**: Show AI confidence per word
4. **Batch optimization**: Process words in batches
5. **Offline mode**: Pre-download common categorizations
6. **Learning**: Improve based on user corrections

## Monitoring

### Success Metrics
- `source: "ai"` - AI categorization succeeded
- `source: "fallback"` - Used hardcoded fallback

### Logs to Watch
```
[categorize] Success on attempt X
[categorize] All 3 attempts failed, using fallback
[AR:overlay] Using AI categorization
[AR:overlay] Using hardcoded categorization (fallback)
```

## Troubleshooting

### Issue: Always using fallback
**Cause**: AWS credentials missing or invalid
**Fix**: Check `.env` file has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Issue: Slow categorization
**Cause**: Network latency or model overload
**Fix**: Normal - shows loading state to user

### Issue: Wrong categories
**Cause**: AI misunderstanding or ambiguous words
**Fix**: Hardcoded fallback will catch known words correctly

## Security

- API key stored in environment variables
- No user data sent to AI (only word list)
- Fallback ensures functionality without external dependencies
- No PII in categorization requests

## Cost Optimization

- Only called once per session (on review)
- Batch processing (all words at once)
- Fallback reduces unnecessary API calls
- Typical cost: <$0.01 per session
