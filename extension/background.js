chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "ADAPT_PARAGRAPH") {
        adaptParagraph(msg.text, msg.language).then(sendResponse);
        return true;
    }
    if (msg.type === "GENERATE_REVIEW") {
        generateReview(msg.paragraphs).then(sendResponse);
        return true;
    }
});

async function getApiKey() {
    const data = await chrome.storage.sync.get("apiKey");
    return data.apiKey || "";
}

async function adaptParagraph(text, language) {
    const apiKey = await getApiKey();
    if (!apiKey) return { error: "no_key" };

    const langLine = language
        ? `After each [definition], also add the ${language} equivalent in (parentheses).`
        : "";

    const prompt = `You are a reading assistant. Rewrite the paragraph below for a 7th-grade reader.
Rules:
1. Keep the same meaning and all facts.
2. Replace any word harder than 9th-grade with a simpler synonym inline.
3. For every technical term or jargon word, wrap it like this:
   <span class="ar-def" title="ORIGINAL_WORD">SIMPLER_WORD [definition]</span>
4. For every acronym (2–5 uppercase letters), expand it like:
   <span class="ar-acronym">ACRONYM (full expansion)</span>
5. ${langLine}
6. Return ONLY the rewritten paragraph as plain HTML — no markdown, no extra tags, no explanation.

Paragraph:
${text}`;

    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await res.json();
        const adapted = data.content?.[0]?.text?.trim() || "";
        // Strip any accidental markdown fences
        const clean = adapted.replace(/^```html?\n?/, "").replace(/\n?```$/, "").trim();
        return { adapted: clean };
    } catch (e) {
        return { error: e.message };
    }
}

async function generateReview(paragraphs) {
    const apiKey = await getApiKey();
    if (!apiKey) return { items: [] };

    const combined = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n");

    const prompt = `From the paragraphs below (which a reader found difficult), generate a review sheet.
Return a JSON array of {"term": "...", "definition": "..."} objects covering the key concepts.
Return ONLY valid JSON — no markdown, no fences, no explanation.

${combined}`;

    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await res.json();
        const raw = data.content?.[0]?.text?.trim() || "[]";
        const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
        return { items: JSON.parse(clean) };
    } catch {
        return { items: [] };
    }
}