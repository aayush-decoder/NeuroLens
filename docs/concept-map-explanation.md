# Concept Map/Graph - How It Works

## Overview
The concept map is a visual knowledge graph that appears in the "Review & End" modal when a reading session ends. It categorizes and visualizes all the hard words the user encountered during their reading session.

## When It Appears
1. User clicks "Review & End" button in the extension toolbar
2. Modal opens with 3 tabs: **Smart Review**, **Concept Map**, **Revision Sheet**
3. Click on "Concept Map" tab to see the visualization

## How It Works

### Step 1: Data Collection
During the reading session, the extension tracks all hard words that were:
- Glossed with definitions (words with `.ar-hard-word` class)
- Adapted by the `/api/adapt` endpoint
- Manually annotated by the wordmap dictionary

```javascript
// Collects all glossed words from the session
var glossedWords = [];
document.querySelectorAll("#ar-column .ar-hard-word").forEach(function(span) {
    var w = (span.textContent || "").trim().toLowerCase();
    if (w && !glossedWords.includes(w)) glossedWords.push(w);
});
```

### Step 2: Word Categorization
Words are automatically categorized into 5 predefined categories:

#### Categories & Colors:
1. **Political** (Blue `#5c6bc0`)
   - Examples: sovereignty, diplomatic, sanctions, jurisdiction
   
2. **Military** (Red `#e53935`)
   - Examples: paramilitary, militia, combat, insurgency
   
3. **Geographic** (Teal `#00897b`)
   - Examples: archipelago, coastal, maritime, disputed
   
4. **Humanitarian** (Orange `#f57c00`)
   - Examples: misery, harassment, vulnerability, resilience
   
5. **Legal** (Purple `#8e24aa`)
   - Examples: extrajudicial, impunity, jurisdiction, coercion

6. **Other** (Gray `#78909c`)
   - Words that don't fit any category

```javascript
var WORD_CATEGORIES = {
    Political:    ["sovereignty","diplomatic","unilateral",...],
    Military:     ["paramilitary","militia","guerilla",...],
    Geographic:   ["archipelago","coastal","maritime",...],
    Humanitarian: ["misery","harassment","intimidated",...],
    Legal:        ["extrajudicial","impunity","jurisdiction",...]
};
```

### Step 3: Graph Layout Algorithm

The visualization uses a **radial/hub-and-spoke layout**:

```
                    [Word]
                   /
        [Category Hub] ---- [Word]
              |  \
              |   [Word]
              |
         [Center Node]
         "Hard Words"
              |
        [Category Hub] ---- [Word]
              |  \
              |   [Word]
                   \
                    [Word]
```

#### Layout Calculation:

1. **Center Node**: Placed at canvas center (cx, cy)
   - Labeled "Hard Words"
   - Dark gray circle

2. **Category Hubs**: Arranged in a circle around center
   - Angle: `(2π × categoryIndex / totalCategories) - π/2`
   - Radius: `28% of canvas size`
   - Color-coded by category
   - Connected to center with lines

3. **Word Nodes**: Arranged around each category hub
   - Angle: Spread around hub based on word index
   - Radius: `90-100px` from hub (randomized slightly)
   - Connected to hub with lines
   - Labeled with capitalized word

### Step 4: SVG Generation

The graph is rendered as inline SVG:

```javascript
container.innerHTML =
    '<svg width="560" height="420" viewBox="0 0 560 420">' +
    svgLines.join("") +    // Connection lines
    svgNodes.join("") +    // Circles (nodes)
    svgLabels.join("") +   // Text labels
    '</svg>';
```

#### SVG Elements:
- **Lines**: Connect center → hubs → words
- **Circles**: Represent nodes (center, hubs, words)
- **Text**: Labels for all nodes

## Visual Example

```
                sovereignty
                    |
            [Political Hub]
           /       |        \
    diplomatic  sanctions  rhetoric
           \       |       /
            -------+-------
                   |
              [Center]
             Hard Words
                   |
            -------+-------
           /       |       \
    archipelago [Geographic] coastal
                    |
                maritime
```

## Edge Cases

### No Hard Words
If no words were glossed during the session:
```
"No hard words were annotated this session.
Read for longer to see the concept map."
```

### Empty Categories
Categories with no words are automatically removed from the visualization.

### Word Positioning
- Words are clamped to SVG bounds (40px margin)
- Slight randomization prevents overlap
- Positioned using polar coordinates (angle + radius)

## Code Location

**File**: `extension/content/overlay.js`

**Function**: `buildConceptGraph(container)`

**Called from**: `endSession()` when user clicks "Review & End"

## Data Structures

### Word Categories Dictionary
```javascript
WORD_CATEGORIES = {
    Political: [array of political terms],
    Military: [array of military terms],
    ...
}
```

### Category Colors Map
```javascript
CATEGORY_COLORS = {
    Political: "#5c6bc0",
    Military: "#e53935",
    ...
}
```

### Runtime Data
```javascript
wordsByCategory = {
    Political: ["sovereignty", "diplomatic"],
    Military: ["militia", "combat"],
    Geographic: ["archipelago"],
    ...
}
```

## Styling

- **Hub circles**: 28px radius, 92% opacity
- **Word circles**: 18px radius, 18% opacity with colored stroke
- **Center circle**: 22px radius, dark gray
- **Lines**: 1-1.5px width, 30-45% opacity
- **Text**: 9-10px font, sans-serif, color-coded

## Future Enhancements

Potential improvements:
1. **Dynamic categorization** using AI instead of hardcoded lists
2. **Interactive nodes** - click to see definition
3. **Relationship lines** between related words
4. **Zoom/pan** for large graphs
5. **Export** as image or PDF
6. **Difficulty levels** - color intensity based on word complexity
7. **Time-based** - show when each word was encountered
8. **Clustering** - group related words automatically

## Technical Notes

- Pure JavaScript (no external graph libraries)
- SVG for scalability and performance
- Trigonometry for circular layout (sin/cos)
- Responsive to container width
- No external dependencies
- Renders in <100ms for typical sessions

## Example Output

For a session where the user encountered:
- 3 political terms
- 2 military terms  
- 1 geographic term

The graph would show:
- Center node labeled "Hard Words"
- 3 category hubs arranged in a triangle
- Each hub connected to its words
- All color-coded and labeled
- Total ~10 nodes, ~9 connections
