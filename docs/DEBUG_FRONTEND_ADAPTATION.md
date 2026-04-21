# Frontend Adaptation Not Displaying - Debug Guide

## Issue Summary
✅ Telemetry is detecting struggles (long stalls, short pauses)  
✅ AWS Bedrock is being called  
✅ Text is being stored as "adapted" in state  
❌ But the frontend is NOT displaying the adapted text visually

## Root Cause Analysis

### Potential Issues Found:

**Issue 1: AWS Region Mismatch** ✅ FIXED
- Old: Region set to `ap-south-1`
- Problem: Claude 3.5 Sonnet not available in ap-south-1
- Fix: Changed to `us-east-1` where Claude is available

**Issue 2: AWS Response Format** ✅ FIXED
- Old: Using Qwen model with unclear response format
- New: Using Claude 3.5 Sonnet with better system prompt instruction
- Added explicit "return ONLY the adapted text" instruction

**Issue 3: Possible Component Re-render Issue**
- React key includes `isAdapted` status
- But might need to verify it's actually updating

---

## Testing Steps

### Step 1: Check Console Output
Open DevTools (F12) → Console tab and look for:

```
📤 Sending to AWS Bedrock: "..."
📥 AWS Bedrock Response: "..."
✅ PARAGRAPH X ADAPTED: { original: "...", adapted: "..." }
🎨 RENDERING PARA X: { hasAdapted: true, ... }
📖 PARAGRAPH X is ADAPTED, showing: "..."
```

**If you see all of these**: The system is working end-to-end ✅  
**If you see adapted but NOT rendering**: Jump to "Issue: Rendering Not Updating"  
**If you see NO bedrock logs**: Jump to "Issue: AWS Not Responding"

---

### Step 2: Use Debug Button
A purple **🐛 Show State** button now appears at bottom-left of reader page.

Click it and check console for:
```
🔍 DEBUG STATE: {
  adaptedParagraphsCount: 3,
  adaptedParagraphs: { 0: "adapted text...", 1: "adapted text...", ... },
  pendingCount: 0,
  longStalls: [0, 1],
  shortPauses: []
}

💾 STORED STATE: {
  adaptedCount: 3,
  adaptedParagraphs: { ... }
}
```

**Good sign**: If `adaptedParagraphsCount > 0` and adaptedParagraphs contains text with definitions

---

### Step 3: Manual Verification

1. **Find an adapted paragraph** (from console logs)
2. **Look at the actual page** and compare:
   - **Original**: "The ubiquitous paradigm..."
   - **Expected Adapted**: "The ubiquitous (found everywhere) paradigm..."

If they look the same, the adapted text isn't being shown.

---

## Common Issues & Solutions

### ❌ Issue: "No struggling paragraphs found" keeps appearing

**Symptoms**:
```
No struggling paragraphs found {
  longStalls: Array(2),
  shortPauses: Array(0),
  adaptedCount: 3
}
```

**Cause**: Paragraphs 0 and 1 are already adapted, so `findIndex` skips them and finds no other struggling paragraphs to adapt next.

**Is this a problem?** 
- NO, if those 2 paragraphs are displaying adapted text ✅
- YES, if they're not displaying adapted text ❌

---

### ❌ Issue: AWS Not Responding / 500 Errors

**Console shows**:
```
🔴 AWS ERROR TYPE: ...
🔴 AWS ERROR MESSAGE: ...
```

**Solutions**:
1. Check AWS credentials in `.env`:
   ```
   AWS_ACCESS_KEY_ID=... (must not be empty)
   AWS_SECRET_ACCESS_KEY=... (must not be empty)
   ```

2. Verify credentials have Bedrock access in us-east-1 region

3. Check if credentials are valid (test in AWS console)

4. Review AWS error message for specifics (rate limit, auth, etc.)

---

### ❌ Issue: AWS Returning Wrong Format

**Before Fix**:
```
AWS Bedrock Returned: [Response json (a format for organizing data) {...}]
```

**This means**: The response object itself is being logged, not the text content.

**After Fix**: Should show:
```
AWS Bedrock Response: "The ubiquitous (found everywhere) paradigm (a typical example)..."
```

If still seeing old format:
1. Hard refresh: `Ctrl+Shift+R`
2. Clear cache: Run in console: `localStorage.clear()`
3. Restart dev server: Kill `npm run dev` and restart

---

### ❌ Issue: Text Stored But Not Rendering

**Symptoms**:
- Console shows: `✅ PARAGRAPH X ADAPTED: { ... }`
- Console shows: `🎨 RENDERING PARA X: { hasAdapted: true, ... }`
- Console shows: `📖 PARAGRAPH X is ADAPTED, showing: "..."`
- **BUT** page displays original text unchanged

**This means**: State has adapted text, component receives it, but display is wrong.

**Causes & Solutions**:
1. **CSS hiding the text?**
   - Check if `.reader-text` has `display: none` or `visibility: hidden`
   - Open DevTools → Inspector → click on paragraph → check styles

2. **Text color matches background?**
   - Check if text color is white/light on light background
   - Try dark mode (press Escape to toggle peek mode, or check settings)

3. **Component not using `text` prop correctly?**
   - This is unlikely since it worked before
   - Check if `renderText()` function returns empty

---

## Advanced Debugging

### Check if Memoization is Stale

Paste in console:
```javascript
// Check if renderedParagraphs has adapted text
const stored = JSON.parse(localStorage.getItem('reader_session_xyz'));
const adaptedCount = Object.keys(stored.adaptedParagraphs).length;
console.log('Paragraphs with adapted text:', adaptedCount);
```

Should show: `2` (or however many were adapted)

---

### Force Re-render

If text is stored but not displaying:
```javascript
// In console:
localStorage.clear();
location.reload();
```

This forces a fresh load of the session.

---

## What the Fixes Changed

### File: `src/lib/ai.ts`
✅ Changed AWS region from `ap-south-1` to `us-east-1` (Claude availability)  
✅ Changed model from Qwen to Claude 3.5 Sonnet  
✅ Improved system prompt to explicitly request "return ONLY adapted text"  
✅ Added better logging for debugging

### File: `src/screens/ReaderPage.tsx`
✅ Enhanced `renderedParagraphs` logging  
✅ Added debug button to inspect state  
✅ Added logging in effect that stores adapted text

### File: `src/components/Reader/Paragraph.tsx`
✅ Added logging when receiving adapted text

---

## Next Steps

1. **Refresh browser** and read slowly again
2. **Open console** and read the logs
3. **Click debug button** to see current state
4. **Compare visually** - does adapted text show?

---

## Expected Console Output (Success Case)

When you read slowly and trigger adaptation:
```
🎯 Found struggling paragraph 2
📤 Sending to AWS Bedrock: "The ubiquitous paradigm..."
📥 AWS Bedrock Response: "The ubiquitous (found everywhere) paradigm..."
✅ PARAGRAPH 2 ADAPTED: {
  original: "The ubiquitous paradigm...",
  adapted: "The ubiquitous (found everywhere) paradigm...",
  fullAdapted: "The ubiquitous (found everywhere) paradigm is a typical example..."
}
🎨 RENDERING PARA 2: { hasAdapted: true, originalLen: 45, adaptedLen: 95 }
📖 PARAGRAPH 2 is ADAPTED, showing: "The ubiquitous (found everywhere)..."
```

**Then at the bottom left**: Click 🐛 debug button and see adapted paragraphs listed.

**And on the page**: Paragraph 2 now shows definitions in parentheses.

---

## If Still Not Working

Share these details:
1. Screenshot of console logs (highlight key parts)
2. Output from clicking 🐛 debug button
3. Screenshot of the paragraph that should have adapted text
4. Any red errors in console

With this information, I can pinpoint the exact issue!
