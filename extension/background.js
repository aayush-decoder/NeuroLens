const WEBAPP_BASE = "https://aleta-stairless-nguyet.ngrok-free.dev"; // Next.js webapp


// ── Auth token ────────────────────────────────────────────────────────────────
async function getToken() {
    const data = await chrome.storage.local.get("ar_token");
    return data.ar_token || null;
}

async function authHeaders() {
    const token = await getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

// ── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("[AR:background] Message received:", msg.type, msg);

    if (msg.type === "ADAPT_PARAGRAPH") {
        handleAdapt(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] ADAPT_PARAGRAPH error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }

    if (msg.type === "TRANSLATE_PARAGRAPH") {
        handleTranslate(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] TRANSLATE_PARAGRAPH error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }

    if (msg.type === "CATEGORIZE_WORDS") {
        handleCategorize(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] CATEGORIZE_WORDS error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }

    if (msg.type === "SESSION_SAVE") {
        handleSessionSave(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] SESSION_SAVE error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }

    if (msg.type === "SESSION_RESTORE") {
        handleSessionRestore(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] SESSION_RESTORE error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }

    if (msg.type === "GENERATE_REVIEW") {
        handleReview(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] GENERATE_REVIEW error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }

    if (msg.type === "SIMPLIFY_PARAGRAPH") {        handleSimplify(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] SIMPLIFY_PARAGRAPH error:", err);
            sendResponse({ words: [] });
        });
        return true;
    }

    if (msg.type === "ESL_PARAGRAPH") {
        handleEsl(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] ESL_PARAGRAPH error:", err);
            sendResponse({ words: [] });
        });
        return true;
    }

    if (msg.type === "TELEMETRY") {
        // fire-and-forget — don't await
        handleTelemetry(msg).catch(err =>
            console.error("[AR:background] TELEMETRY error:", err)
        );
        sendResponse({ ok: true });
        return false;
    }

    if (msg.type === "SAVE_TO_BUCKET") {
        handleSaveToBucket(msg).then(sendResponse).catch(err => {
            console.error("[AR:background] SAVE_TO_BUCKET error:", err);
            sendResponse({ error: err.message });
        });
        return true;
    }
});

// ── /api/adapt ────────────────────────────────────────────────────────────────
async function handleAdapt(msg) {
    const payload = {
        text: msg.text,
        strugglingParagraphs: [msg.paragraph_index ?? 0]
    };

    console.log("[AR:background] /api/adapt → sending payload:", payload);
    const t0 = Date.now();

    const res = await fetch(`${WEBAPP_BASE}/api/adapt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("[AR:background] /api/adapt HTTP error:", res.status, errText);
        throw new Error(`adapt HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(
        `[AR:background] /api/adapt ← response in ${Date.now() - t0}ms`,
        data
    );
    return data;
}

// ── /api/translate ────────────────────────────────────────────────────────────
async function handleTranslate(msg) {
    const payload = {
        text: msg.text,
        language: msg.language || "hindi"
    };

    console.log("[AR:background] /api/translate → sending payload:", payload);
    const t0 = Date.now();

    const res = await fetch(`${WEBAPP_BASE}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("[AR:background] /api/translate HTTP error:", res.status, errText);
        throw new Error(`translate HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(
        `[AR:background] /api/translate ← response in ${Date.now() - t0}ms`,
        `language: ${data.language}, translations: ${data.translationsApplied}`
    );
    return data;
}

// ── /api/categorize ───────────────────────────────────────────────────────────
async function handleCategorize(msg) {
    const payload = {
        words: msg.words || []
    };

    console.log("[AR:background] /api/categorize → sending", payload.words.length, "words");
    const t0 = Date.now();

    const res = await fetch(`${WEBAPP_BASE}/api/categorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("[AR:background] /api/categorize HTTP error:", res.status, errText);
        throw new Error(`categorize HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(
        `[AR:background] /api/categorize ← response in ${Date.now() - t0}ms`,
        `source: ${data.source}, processed: ${data.wordsProcessed}`
    );
    return data;
}

// ── /api/session/save ─────────────────────────────────────────────────────────
async function handleSessionSave(msg) {
    console.log("[AR:background] /api/session/save → skipped (no webapp endpoint)");
    return { saved: true };
}

// ── /api/session/restore ──────────────────────────────────────────────────────
async function handleSessionRestore(msg) {
    console.log("[AR:background] /api/session/restore → skipped (no webapp endpoint)");
    return { found: false };
}

// ── /api/review ───────────────────────────────────────────────────────────────
async function handleReview(msg) {
    const payload = {
        session_id: msg.session_id || null,
        paragraphs: msg.paragraphs || [],
        language: msg.language || null,
    };

    console.log("[AR:background] /api/review → sending", payload.paragraphs.length, "paragraphs");
    const t0 = Date.now();

    // Try the extension-backend first, fall back to webapp API
    const BACKEND_BASE = "https://enfinity-hackathon-backend.onrender.com";
    const endpoints = [
        `${BACKEND_BASE}/api/review`,
        `${WEBAPP_BASE}/api/review`,
    ];

    for (const url of endpoints) {
        try {
            const headers = { "Content-Type": "application/json" };
            const token = await getToken();
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                console.warn(`[AR:background] /api/review ${url} → HTTP ${res.status}`);
                continue;
            }

            const data = await res.json();
            console.log(`[AR:background] /api/review ← ${Date.now() - t0}ms from ${url}`, "items:", data.items?.length);
            return data;
        } catch (err) {
            console.warn(`[AR:background] /api/review ${url} failed:`, err.message);
        }
    }

    console.warn("[AR:background] /api/review all endpoints failed — returning empty");
    return { items: [] };
}

// ── /api/telemetry ────────────────────────────────────────────────────────────
async function handleTelemetry(msg) {
    console.log("[AR:background] /api/telemetry → event:", msg.event, "(logged locally only)");
    // No webapp endpoint - just log locally
}

// ── /api/simplify (webapp) ────────────────────────────────────────────────────
async function handleSimplify(msg) {
    // Sanitize: strip control chars and lone backslashes before sending
    const rawText = (msg.text || "").trim();
    const safeText = rawText
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
        .slice(0, 4000);

    if (!safeText) return { words: [] };

    console.log("[AR:background] /api/simplify → para length:", safeText.length);
    const t0 = Date.now();

    const res = await fetch(`${WEBAPP_BASE}/api/simplify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: safeText })
    });

    console.log("[AR:background] /api/simplify → response:", res);

    if (!res.ok) {
        const errText = await res.text();
        console.error("[AR:background] /api/simplify HTTP error:", res.status, errText);
        return { words: [] };
    }

    const data = await res.json();
    console.log(
        `[AR:background] /api/simplify ← in ${Date.now() - t0}ms`,
        "words found:", data.words?.length,
        data
    );
    return data;
}

// ── /api/esl (webapp) ─────────────────────────────────────────────────────────
async function handleEsl(msg) {
    const rawText = (msg.text || "").trim();
    const safeText = rawText
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
        .slice(0, 4000);

    if (!safeText) return { words: [] };

    console.log("[AR:background] /api/esl → para length:", safeText.length);
    const t0 = Date.now();

    const res = await fetch(`${WEBAPP_BASE}/api/esl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: safeText })
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("[AR:background] /api/esl HTTP error:", res.status, errText);
        return { words: [] };
    }

    const data = await res.json();
    console.log(
        `[AR:background] /api/esl ← in ${Date.now() - t0}ms`,
        "words found:", data.words?.length,
        "source:", data.source,
        data
    );
    return data;
}

// ── Save to Bucket ────────────────────────────────────────────────────────────
async function handleSaveToBucket(msg) {
    const payload = {
        url: msg.url,
        title: msg.title,
        text: msg.text,
        revisionMarkdown: msg.revisionMarkdown,
        conceptSvg: msg.conceptSvg
    };

    console.log("[AR:background] Saving to bucket via /api/extension/save...");
    const res = await fetch(`${WEBAPP_BASE}/api/extension/save`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Bucket save failed (${res.status}): ${txt}`);
    }

    return await res.json();
}