# Dynamic Text Adaptation - Debugging Guide

## Problems Fixed ✅

### 1. **React Re-rendering Issue**
**Problem**: The `Paragraph` component used `key={index}`, which never changes. React wouldn't detect the `text` prop change and re-render the component.

**Fix**: Changed the key to include adaptation status:
```tsx
key={`${index}-${adaptedParagraphs[index] ? 'adapted' : 'original'}`}
```
Now React will create a new component instance when text becomes adapted, forcing a fresh render.

---

### 2. **Double Adaptation Processing**
**Problem**: The backend (AWS Bedrock) already adapts text by adding inline definitions:
- Input: "The ubiquitous paradigm is ephemeral"
- Output: "The ubiquitous (found everywhere) paradigm (a typical example or pattern) is ephemeral (lasting for a very short time)"

But the `Paragraph` component was trying to adapt it AGAIN, causing conflicts.

**Fix**: 
- Added `isAdapted` prop to `Paragraph` component
- When `isAdapted={true}`, the component skips local adaptation and renders the text directly
- This prevents double-processing of backend-adapted text

```tsx
<Paragraph
  isAdapted={!!adaptedParagraphs[index]}  // New prop
  text={text}
  // ... other props
/>
```

---

## Debugging Steps 📋

### Step 1: Check Console Logs
Open your browser DevTools (F12) and look for these logs:

**✅ If adaptation is working, you should see:**
```
🧠 AWS Bedrock Returned: "The ubiquitous (found everywhere) paradigm..."
✅ PARAGRAPH 2 ADAPTED: {
  original: "The ubiquitous paradigm...",
  adapted: "The ubiquitous (found everywhere)...",
  fullAdapted: "..."
}
```

**❌ If nothing is being adapted, you'll see:**
```
📊 No struggling paragraphs found {
  longStalls: [],
  shortPauses: [],
  adaptedCount: 0,
  totalParagraphs: 12
}
```

---

### Step 2: Verify Telemetry is Detecting Struggles
The adaptation engine only triggers when the user shows reading friction (slow reading).

**Telemetry Detection Happens When:**
- ✅ User spends > threshold time on a paragraph (dwell time)
- ✅ User re-scrolls back to the same paragraph (rescroll)
- ✅ User hovers/hesitates while reading

**To trigger manually for testing:**
1. Read slowly (pause for 5+ seconds on a paragraph)
2. Scroll up and down on the same paragraph
3. Highlight/select text while reading
4. Hover over words for 600ms+

---

### Step 3: Check Network Tab
1. Open DevTools → **Network** tab
2. Look for `POST /api/adapt` requests
3. Click on the request and check:
   - **Request body**: Should contain the paragraph text
   - **Response**: Should return `{ modifiedText: "..." }`
   - **Status**: Should be 200

If getting 500 errors, check that AWS credentials in `.env` are correct:
```env
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

### Step 4: Verify State Updates
Add this to your browser console to check if adapted text is in state:

```javascript
// Open DevTools Console and paste:
console.log("Adapted Paragraphs:", window.__adaptedParagraphs);
```

Or add a temporary debug button to ReaderPage:
```tsx
<button 
  onClick={() => console.log('Adapted:', adaptedParagraphs)} 
  className="fixed bottom-4 right-4 bg-red-500 p-2 text-white"
>
  Debug State
</button>
```

---

## Testing Checklist ✅

- [ ] **Telemetry Working?**: Do you see logs showing detected struggling paragraphs?
- [ ] **API Responding?**: Do you see `/api/adapt` requests returning successfully?
- [ ] **State Updating?**: Does `adaptedParagraphs` contain the modified text?
- [ ] **Text Rendering?**: Does the Paragraph component display the adapted text?

---

## Common Issues & Solutions

### Issue: "No struggling paragraphs found"
**Cause**: User isn't showing reading friction
**Solution**: 
- Slow down reading artificially (hover over words, pause)
- Or test with very low thresholds (temporarily adjust telemetry engine)

### Issue: API returns 500 error
**Cause**: AWS credentials missing or invalid
**Solution**:
- Check `.env` has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Verify credentials in AWS console
- Check AWS Bedrock region is set to `ap-south-1`

### Issue: Text shows original, not adapted
**Cause**: Could be any of the above issues, OR React key still cached
**Solution**:
- Hard refresh (Ctrl+Shift+R)
- Clear localStorage: `localStorage.clear()`
- Check console logs above

---

## Architecture Overview 🏗️

```
User Reading (with friction indicators)
          ↓
   useTelemetry hook (tracks dwell, rescroll, hesitation)
          ↓
   categorizedStruggles (ReaderPage identifies struggling paragraph)
          ↓
   adaptReaderText API call (POST /api/adapt)
          ↓
   Backend: adaptContentAI → adaptParagraphSupport → AWS Bedrock
          ↓
   Returns modifiedText with inline definitions
          ↓
   Store in adaptedParagraphs state
          ↓
   Pass to <Paragraph isAdapted={true} text={modifiedText} />
          ↓
   Paragraph renders adapted text directly (skips local adaptation)
          ↓
   🎉 User sees: "ubiquitous (found everywhere)"
```

---

## Next Steps 🚀

1. **Test in browser**: Read slowly on a paragraph and watch the console logs
2. **Monitor Network tab**: See the `/api/adapt` request
3. **Check localStorage**: View the persisted `adaptedParagraphs`
4. **Verify rendering**: See if the text actually appears adapted in the reader

If it still doesn't work, share the console logs and network request details!
