// ── Module-level state ────────────────────────────────────────────────────────
// These are initialised by initTelemetry() but declared here so
// persistence.js can pre-populate them before initTelemetry runs.
window._arDwellMap = window._arDwellMap || {};
window._arRescrollMap = window._arRescrollMap || {};
window._arStruggledParagraphs = window._arStruggledParagraphs || [];
window._arAdaptingSet = window._arAdaptingSet || new Set();
window._arSessionId = window._arSessionId || crypto.randomUUID();
window._arSessionStart = window._arSessionStart || Date.now();

console.log("[AR:telemetry] Module loaded. Session ID:", window._arSessionId);

// ── Helpers ───────────────────────────────────────────────────────────────────
function elapsedMin() {
    return (Date.now() - window._arSessionStart) / 60000;
}

function sendTelemetry(event, extra = {}) {
    const payload = {
        type: "TELEMETRY",
        session_id: window._arSessionId,
        url: location.href,
        event,
        session_elapsed_min: elapsedMin(),
        ...extra
    };
    console.log("[AR:telemetry] Firing event:", event, payload);
    chrome.runtime.sendMessage(payload);
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initTelemetry(container) {
    console.log("[AR:telemetry] initTelemetry() called. Container:", container.id);

    const entryTimes = {};

    // ── IntersectionObserver: paragraph dwell time ────────────────────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const idx = entry.target.dataset.index;
            if (idx === undefined) return;

            if (entry.isIntersecting) {
                entryTimes[idx] = Date.now();
                console.log(`[AR:telemetry] Para ${idx} entered viewport`);
            } else {
                if (entryTimes[idx]) {
                    const dwell = Date.now() - entryTimes[idx];
                    window._arDwellMap[idx] = (window._arDwellMap[idx] || 0) + dwell;
                    delete entryTimes[idx];

                    console.log(
                        `[AR:telemetry] Para ${idx} exited viewport.`,
                        `Dwell this pass: ${dwell}ms,`,
                        `Total dwell: ${window._arDwellMap[idx]}ms,`,
                        `Rescrolls: ${window._arRescrollMap[idx] || 0}`
                    );

                    checkStruggle(idx);
                }
            }
        });
    }, { root: container, threshold: 0.6 });

    function observeAll() {
        const paras = document.querySelectorAll("#ar-column p");
        paras.forEach(p => observer.observe(p));
        console.log("[AR:telemetry] Observing", paras.length, "paragraphs");
    }
    observeAll();
    window._arObserveParagraphs = observeAll;

    // ── Scroll: re-scroll (upward scroll = confusion signal) ──────────────────
    let lastY = container.scrollTop;
    let scrollSaveDebounce;

    container.addEventListener("scroll", () => {
        const y = container.scrollTop;

        if (y < lastY - 40) {
            // Meaningful upward scroll
            const para = getTopmostVisible(container);
            if (para) {
                const idx = para.dataset.index;
                window._arRescrollMap[idx] = (window._arRescrollMap[idx] || 0) + 1;

                console.log(
                    `[AR:telemetry] Upward scroll detected on para ${idx}.`,
                    `Rescroll count now: ${window._arRescrollMap[idx]}`,
                    `Current dwell: ${window._arDwellMap[idx] || 0}ms`
                );

                checkStruggle(idx);
            }
        }

        lastY = y;

        // Debounced session save
        clearTimeout(scrollSaveDebounce);
        scrollSaveDebounce = setTimeout(() => {
            if (typeof saveSession === "function") saveSession();
        }, 2000);
    });

    // ── Struggle check + decision log ─────────────────────────────────────────
    function checkStruggle(idx) {
        const para = document.querySelector(`#ar-column p[data-index="${idx}"]`);
        if (!para) return;
        if (para.classList.contains("ar-adapted")) {
            console.log(`[AR:telemetry] Para ${idx}: already adapted, skip check`);
            return;
        }
        if (window._arAdaptingSet.has(idx)) {
            console.log(`[AR:telemetry] Para ${idx}: adaptation in-flight, skip`);
            return;
        }

        const dwell = window._arDwellMap[idx] || 0;
        const rescroll = window._arRescrollMap[idx] || 0;
        const dwellFlag = dwell > 2000;   // [TEST] was 8000ms
        const rescrollFlag = rescroll >= 1; // [TEST] was 2

        console.log(
            `[AR:telemetry] Struggle check para ${idx}:`,
            `dwell=${dwell}ms (threshold 2000ms → ${dwellFlag ? "FAIL" : "ok"}),`,
            `rescroll=${rescroll} (threshold 1 → ${rescrollFlag ? "FAIL" : "ok"}),`,
            `decision: ${(dwellFlag || rescrollFlag) ? "STRUGGLE → trigger adaptation" : "no struggle yet"}`
        );

        if (dwellFlag || rescrollFlag) {
            window._arAdaptingSet.add(idx);

            sendTelemetry("struggle_detected", {
                paragraph_index: Number(idx),
                dwell_ms: dwell,
                rescroll_count: rescroll
            });

            // Fire both in parallel — simplify does NOT depend on adaptation
            const originalText = para.textContent.trim();
            triggerSimplify(para, idx, originalText);
            triggerAdaptation(para, idx, dwell, rescroll);
        }
    }
}

// ── Adaptation call ───────────────────────────────────────────────────────────
function triggerAdaptation(para, idx, dwellMs, rescrollCount) {
    const originalText = para.textContent.trim();

    console.log(
        `[AR:telemetry] triggerAdaptation() para ${idx}:`,
        `text length=${originalText.length},`,
        `dwell=${dwellMs}ms, rescroll=${rescrollCount},`,
        `elapsed=${elapsedMin().toFixed(2)}min`
    );

    // No visual dimming — paragraph stays fully readable while AI works

    chrome.storage.sync.get("language", (data) => {
        const language = data.language || null;
        console.log(`[AR:telemetry] Para ${idx}: language pref =`, language);

        chrome.runtime.sendMessage(
            {
                type: "ADAPT_PARAGRAPH",
                text: originalText,
                paragraph_index: Number(idx),
                url: location.href,
                dwell_ms: dwellMs,
                rescroll_count: rescrollCount,
                session_elapsed_min: elapsedMin(),
                language
            },
            (res) => {
                if (chrome.runtime.lastError) {
                    console.error(`[AR:telemetry] Para ${idx}: runtime error:`, chrome.runtime.lastError);
                    para.style.opacity = "1";
                    window._arAdaptingSet.delete(idx);
                    return;
                }

                if (!res || res.error) {
                    console.error(`[AR:telemetry] Para ${idx}: adapt error:`, res?.error);
                    window._arAdaptingSet.delete(idx);
                    return;
                }

                console.log(
                    `[AR:telemetry] Para ${idx}: adaptation received.`,
                    `cache_hit=${res.cache_hit},`,
                    `replacements=${res.replacements?.length || 0}`
                );

                if (res.adapted_html) {
                    injectAdaptedHTML(para, idx, res.adapted_html, res.replacements || [], originalText);

                    sendTelemetry("adaptation_shown", {
                        paragraph_index: Number(idx),
                        dwell_ms: dwellMs,
                        rescroll_count: rescrollCount
                    });
                } else {
                    console.warn(`[AR:telemetry] Para ${idx}: no adapted_html in response`);
                    window._arAdaptingSet.delete(idx);
                }
            }
        );
    });
}

// ── DOM injection of adapted HTML ─────────────────────────────────────────────
function injectAdaptedHTML(para, idx, adaptedHtml, replacements, originalText) {
    console.log(`[AR:telemetry] injectAdaptedHTML para ${idx}:`);
    replacements.forEach(r => {
        console.log(
            `  → "${r.original}" → simplified: "${r.simplified}"`,
            r.esl_equiv ? `ESL: "${r.esl_equiv}"` : "",
            `offset: ${r.char_offset}`
        );
    });

    para.innerHTML = adaptedHtml;
    para.classList.add("ar-adapted");
    para.style.opacity = "1";

    // Store for review sheet
    if (!window._arStruggledParagraphs.find(p => p.index === idx)) {
        window._arStruggledParagraphs.push({
            index: Number(idx),
            text: originalText,
            dwell_ms: window._arDwellMap[idx] || 0,
            rescroll_count: window._arRescrollMap[idx] || 0
        });
        console.log(
            `[AR:telemetry] Para ${idx} added to struggled list.`,
            `Total struggled: ${window._arStruggledParagraphs.length}`
        );
    }

    if (typeof saveSession === "function") saveSession();
}

// ── Utility ───────────────────────────────────────────────────────────────────
function getTopmostVisible(container) {
    const top = container.getBoundingClientRect().top;
    return Array.from(document.querySelectorAll("#ar-column p"))
        .find(p => p.getBoundingClientRect().top >= top);
}

// ── Inline Glossary ───────────────────────────────────────────────────────────

/**
 * Requests simplification for a paragraph and injects "[meaning]" in italic
 * next to each hard word, seamlessly in the DOM.
 */
function triggerSimplify(para, idx, originalText) {
    // Skip if already glossed
    if (para.dataset.arGlossed) return;

    console.log(`[AR:telemetry] triggerSimplify() para ${idx}`);

    chrome.runtime.sendMessage(
        { type: "SIMPLIFY_PARAGRAPH", text: originalText },
        (res) => {
            if (chrome.runtime.lastError) {
                console.warn(`[AR:telemetry] Para ${idx}: simplify runtime error:`, chrome.runtime.lastError);
                return;
            }

            const words = res?.words;
            if (!Array.isArray(words) || words.length === 0) {
                console.log(`[AR:telemetry] Para ${idx}: no hard words found`);
                return;
            }

            console.log(`[AR:telemetry] Para ${idx}: glossing ${words.length} words`);
            injectGlosses(para, words);
            para.dataset.arGlossed = "1";
        }
    );
}

/**
 * Walks all text nodes inside `para` and, for each matched word,
 * splits the text node to insert:
 *   <span class="ar-hard-word">word</span><span class="ar-gloss"> [meaning]</span>
 *
 * Works on the live DOM without replacing innerHTML, so it composes
 * safely with any HTML already injected by the adaptation step.
 */
function injectGlosses(para, words) {
    // Sort longest first so "photosynthesis" matches before "photo"
    const sorted = [...words].sort((a, b) => b.original.length - a.original.length);

    function getTextNodes(node) {
        const result = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) result.push(n);
        return result;
    }

    sorted.forEach(({ original, meaning }) => {
        let escaped;
        try {
            escaped = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        } catch {
            return;
        }
        const re = new RegExp(`(${escaped})`, "i");

        // Re-collect text nodes each pass since previous inserts split nodes
        const textNodes = getTextNodes(para);

        for (const tn of textNodes) {
            // Skip nodes already inside a gloss or hard-word span
            if (
                tn.parentElement?.classList.contains("ar-gloss") ||
                tn.parentElement?.classList.contains("ar-hard-word")
            ) continue;

            const text = tn.nodeValue || "";
            if (!re.test(text)) continue;

            const match = re.exec(text);
            if (!match) continue;

            const before = text.slice(0, match.index);
            const matchedWord = match[1];
            const after = text.slice(match.index + matchedWord.length);

            const frag = document.createDocumentFragment();

            if (before) frag.appendChild(document.createTextNode(before));

            const wordSpan = document.createElement("span");
            wordSpan.className = "ar-hard-word";
            wordSpan.textContent = matchedWord;
            wordSpan.title = meaning;
            frag.appendChild(wordSpan);

            const glossSpan = document.createElement("span");
            glossSpan.className = "ar-gloss";
            glossSpan.textContent = ` [${meaning}]`;
            frag.appendChild(glossSpan);

            if (after) frag.appendChild(document.createTextNode(after));

            tn.parentNode.replaceChild(frag, tn);

            // Only annotate first occurrence per word per paragraph
            break;
        }
    });
}