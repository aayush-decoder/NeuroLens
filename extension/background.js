const BASE = "https://enfinity-hackathon-backend.onrender.com";
const BASE_WEBAPP = "https://aleta-stairless-nguyet.ngrok-free.dev"; // Next.js webapp

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

    if (msg.type === "SIMPLIFY_PARAGRAPH") {
        handleSimplify(msg).then(sendResponse).catch(err => {
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
        paragraph: msg.text,
        paragraph_index: msg.paragraph_index,
        url: msg.url,
        dwell_ms: msg.dwell_ms,
        rescroll_count: msg.rescroll_count,
        session_elapsed_min: msg.session_elapsed_min,
        language: msg.language || null
    };

    console.log("[AR:background] /api/adapt → sending payload:", payload);
    const t0 = Date.now();

    const res = await fetch(`${BASE}/api/adapt`, {
        method: "POST",
        headers: await authHeaders(),
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
        "cache_hit:", data.cache_hit,
        "replacements:", data.replacements?.length,
        data
    );
    return data;
}

// ── /api/session/save ─────────────────────────────────────────────────────────
async function handleSessionSave(msg) {
    const payload = {
        session_id: msg.session_id,
        url: msg.url,
        scroll_pct: msg.scroll_pct,
        adapted_indices: msg.adapted_indices,
        struggled_indices: msg.struggled_indices,
        dwell_map: msg.dwell_map,
        rescroll_map: msg.rescroll_map,
        session_elapsed_min: msg.session_elapsed_min,
        language: msg.language || null
    };

    console.log("[AR:background] /api/session/save → payload:", payload);

    const res = await fetch(`${BASE}/api/session/save`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("[AR:background] /api/session/save ← response:", data);
    return data;
}

// ── /api/session/restore ──────────────────────────────────────────────────────
async function handleSessionRestore(msg) {
    console.log("[AR:background] /api/session/restore → url:", msg.url);

    const res = await fetch(`${BASE}/api/session/restore`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ url: msg.url })
    });

    const data = await res.json();
    console.log("[AR:background] /api/session/restore ← response:", data);
    return data;
}

// ── /api/review ───────────────────────────────────────────────────────────────
async function handleReview(msg) {
    const payload = {
        session_id: msg.session_id,
        paragraphs: msg.paragraphs,
        language: msg.language || null
    };

    console.log("[AR:background] /api/review → payload:", payload);
    const t0 = Date.now();

    const res = await fetch(`${BASE}/api/review`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(`[AR:background] /api/review ← in ${Date.now() - t0}ms`, data);
    return data;
}

// ── /api/telemetry ────────────────────────────────────────────────────────────
async function handleTelemetry(msg) {
    const payload = {
        session_id: msg.session_id,
        url: msg.url,
        event: msg.event,
        paragraph_index: msg.paragraph_index ?? null,
        dwell_ms: msg.dwell_ms ?? null,
        rescroll_count: msg.rescroll_count ?? null,
        session_elapsed_min: msg.session_elapsed_min ?? null
    };

    console.log("[AR:background] /api/telemetry → event:", payload.event, payload);

    await fetch(`${BASE}/api/telemetry`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload)
    });
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

    const res = await fetch(`${BASE_WEBAPP}/api/simplify`, {
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

    const res = await fetch(`${BASE_WEBAPP}/api/esl`, {
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
    const res = await fetch(`${BASE_WEBAPP}/api/extension/save`, {
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