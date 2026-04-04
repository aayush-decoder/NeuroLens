chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "ADAPT_PARAGRAPH") {
        adaptParagraph(msg.text, msg.language).then(sendResponse);
        return true; // keep channel open for async
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
    if (!apiKey) return { error: "No API key set" };

    const langInstruction = language
        ? ` Also add the ${language} translation in (parentheses) immediately after each bracketed definition.`
        : "";

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{ text: `Rewrite this paragraph at a 7th-grade reading level. Add inline definitions in [brackets] for any word above 9th-grade reading level.${langInstruction} Return ONLY the rewritten paragraph, no preamble.\n\n${text}` }]
            }]
        })
    });

    const data = await res.json();
    return { adapted: data.candidates?.[0]?.content?.parts?.[0]?.text || text };
}

async function generateReview(paragraphs) {
    const apiKey = await getApiKey();
    if (!apiKey) return { error: "No API key set" };

    const combined = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{ text: `From these paragraphs the reader struggled with, generate a review sheet as a JSON array of {"term": "", "definition": ""} objects. Return ONLY valid JSON, no markdown fences.\n\n${combined}` }]
            }]
        })
    });

    const data = await res.json();
    try {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        return { items: JSON.parse(text) };
    } catch {
        return { items: [] };
    }
}