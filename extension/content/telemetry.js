// ── Embedded wordmap (mirrored from webapp/src/app/api/simplify/wordmap.ts) ──
// Keys are lowercase. Values: { meaning: string, hindi: string }
const AR_HARD_WORDS = new Map([
    ["vietnamese", { meaning: "from Vietnam", hindi: "वियतनामी" }],
    ["honorary", { meaning: "given as an honor", hindi: "मानदंडित" }],
    ["archipelago", { meaning: "group of islands", hindi: "द्वीपसमूह" }],
    ["sovereignty", { meaning: "supreme authority", hindi: "सार्वभौमिकता" }],
    ["asserts", { meaning: "claims strongly", hindi: "दावा करना" }],
    ["covertly", { meaning: "secretly", hindi: "गुप्त रूप से" }],
    ["paramilitary", { meaning: "semi-military", hindi: "अर्धसैनिक" }],
    ["ethnographic", { meaning: "study of people", hindi: "जनजातीय अध्ययन" }],
    ["interrogation", { meaning: "formal questioning", hindi: "पूछताछ" }],
    ["misery", { meaning: "extreme suffering", hindi: "दुःख" }],
    ["intimidated", { meaning: "frightened", hindi: "डरा हुआ" }],
    ["expeditions", { meaning: "journeys", hindi: "अभियान" }],
    ["reclamation", { meaning: "land recovery", hindi: "पुनः दावा" }],
    ["infrastructure", { meaning: "basic facilities", hindi: "बुनियादी ढांचा" }],
    ["disappeared", { meaning: "vanished", hindi: "गायब" }],
    ["transnational", { meaning: "crossing countries", hindi: "अंतरराष्ट्रीय" }],
    ["assertiveness", { meaning: "forceful behavior", hindi: "आत्मविश्वासपूर्ण" }],
    ["commemorations", { meaning: "ceremonies to honor", hindi: "स्मरणोत्सव" }],
    ["harassment", { meaning: "persistent trouble", hindi: "उत्पीड़न" }],
    ["oblivion", { meaning: "state of being forgotten", hindi: "अविस्मरण" }],
    ["detained", { meaning: "kept in custody", hindi: "हिरासत में लिया" }],
    ["bureaucracy", { meaning: "official procedures", hindi: "राजस्व प्रशासन" }],
    ["intervention", { meaning: "getting involved", hindi: "हस्तक्षेप" }],
    ["diplomatic", { meaning: "relating to diplomacy", hindi: "राजनयिक" }],
    ["unilateral", { meaning: "one-sided", hindi: "एकतरफा" }],
    ["paramount", { meaning: "most important", hindi: "परम" }],
    ["resilience", { meaning: "ability to recover", hindi: "लचीलापन" }],
    ["evacuated", { meaning: "removed safely", hindi: "खाली किया" }],
    ["adversity", { meaning: "difficulties", hindi: "कठिनाई" }],
    ["extrajudicial", { meaning: "outside courts", hindi: "अधिकारित न्याय के बाहर" }],
    ["espionage", { meaning: "spying", hindi: "जासूसी" }],
    ["guerilla", { meaning: "irregular fighter", hindi: "गुरिल्ला" }],
    ["cooperation", { meaning: "working together", hindi: "सहयोग" }],
    ["evade", { meaning: "avoid", hindi: "बचना" }],
    ["provisions", { meaning: "supplies", hindi: "प्रावधान" }],
    ["rhetoric", { meaning: "persuasive language", hindi: "प्रशंसात्मक भाषा" }],
    ["repercussions", { meaning: "consequences", hindi: "परिणाम" }],
    ["collateral", { meaning: "security for loan", hindi: "बंधक संपत्ति" }],
    ["negotiation", { meaning: "discussion to agree", hindi: "समझौता वार्ता" }],
    ["coercion", { meaning: "forcing", hindi: "दबाव" }],
    ["authorities", { meaning: "officials", hindi: "प्राधिकरण" }],
    ["advocates", { meaning: "supporters", hindi: "समर्थक" }],
    ["militia", { meaning: "armed civilians", hindi: "स्वयंसेवक सेना" }],
    ["strategic", { meaning: "important for planning", hindi: "रणनीतिक" }],
    ["jurisdiction", { meaning: "legal authority", hindi: "क्षेत्राधिकार" }],
    ["escalated", { meaning: "intensified", hindi: "बढ़ा" }],
    ["subsequent", { meaning: "following", hindi: "पश्चात" }],
    ["intermittent", { meaning: "occasional", hindi: "अविरल" }],
    ["disputed", { meaning: "argued over", hindi: "विवादित" }],
    ["compromised", { meaning: "weakened", hindi: "समझौता किया" }],
    ["repercussion", { meaning: "consequence", hindi: "परिणाम" }],
    ["sanctions", { meaning: "penalties", hindi: "प्रतिबंध" }],
    ["annexed", { meaning: "added territory", hindi: "संपत्ति जोड़ना" }],
    ["vulnerability", { meaning: "weakness", hindi: "असुरक्षा" }],
    ["impunity", { meaning: "without punishment", hindi: "निर्दोषता" }],
    ["insurgency", { meaning: "rebellion", hindi: "विद्रोह" }],
    ["displacement", { meaning: "forced moving", hindi: "स्थलांतरण" }],
    ["coastal", { meaning: "near the shore", hindi: "तटीय" }],
    ["maritime", { meaning: "related to sea", hindi: "समुद्री" }],
    ["reconciliation", { meaning: "restoring peace", hindi: "मेल-मिलाप" }],
    ["hostilities", { meaning: "fighting", hindi: "शत्रुता" }],
    ["combat", { meaning: "fight", hindi: "संग्राम" }],
    ["fatalities", { meaning: "deaths", hindi: "मृत्यु" }],
    ["intelligence", { meaning: "information gathering", hindi: "खुफिया" }],
    ["navigation", { meaning: "sailing skill", hindi: "नौवहन" }],
    ["infringement", { meaning: "violation", hindi: "उल्लंघन" }],
    ["deterrent", { meaning: "prevention measure", hindi: "निरोधक" }],
    ["mediation", { meaning: "conflict resolving", hindi: "मध्यस्थता" }],
    ["bilateral", { meaning: "two-sided", hindi: "द्विपक्षीय" }],
    ["armistice", { meaning: "truce", hindi: "युद्धविराम" }],
    ["casualties", { meaning: "injured/killed", hindi: "हानि" }],
    ["fortification", { meaning: "defense structure", hindi: "किला" }],
    ["occupation", { meaning: "control of land", hindi: "अधिकार" }],
    ["expropriation", { meaning: "taking property", hindi: "अधिग्रहण" }],
    ["subjugation", { meaning: "domination", hindi: "दमन" }],
    ["insubordination", { meaning: "refusal to obey", hindi: "अवज्ञा" }],
    ["abduction", { meaning: "kidnapping", hindi: "अपहरण" }],
    ["expatriates", { meaning: "living abroad", hindi: "प्रवासियों" }],
    ["penalized", { meaning: "punished", hindi: "दंडित" }],
    ["precarious", { meaning: "unsafe", hindi: "असुरक्षित" }],
    ["jurisdictional", { meaning: "legal control", hindi: "क्षेत्राधिकार संबंधी" }],
    ["oceanic", { meaning: "related to ocean", hindi: "महासागरीय" }],
    ["naval", { meaning: "related to navy", hindi: "नौसैनिक" }],
    ["escalation", { meaning: "increase in conflict", hindi: "संकट बढ़ना" }],
    ["entitlements", { meaning: "rights", hindi: "अधिकार" }],
    ["arbitration", { meaning: "official judgment", hindi: "निर्णय" }],
    ["militarization", { meaning: "arming of area", hindi: "सैनिकीकरण" }],
    ["paramountcy", { meaning: "supreme power", hindi: "प्रधानता" }],
    ["intrusion", { meaning: "trespass", hindi: "अतिक्रमण" }],
    ["interdiction", { meaning: "blocking", hindi: "रोक" }],
    ["retribution", { meaning: "punishment", hindi: "प्रतिशोध" }],
    ["hostile", { meaning: "unfriendly", hindi: "शत्रुतापूर्ण" }],
    ["retaliation", { meaning: "counterattack", hindi: "प्रतिशोध" }],
    ["vexation", { meaning: "annoyance", hindi: "क्लेश" }],
    ["subversion", { meaning: "undermining authority", hindi: "उपद्रव" }],
    ["diplomacy", { meaning: "international relations", hindi: "कूटनीति" }],
    ["obstruction", { meaning: "blocking", hindi: "अवरोध" }],
    ["deterrence", { meaning: "prevention", hindi: "निरोध" }],
]);

/**
 * Scan `text` against AR_HARD_WORDS and return matched entries.
 * Returns { original (as it appears in text), meaning } for each hit.
 */
function scanWordmap(text) {
    const results = [];
    for (const [key, entry] of AR_HARD_WORDS) {
        const re = new RegExp("\\b" + key + "\\b", "i");
        if (re.test(text)) {
            const match = text.match(new RegExp("\\b" + key + "\\b", "i"));
            results.push({
                original: match ? match[0] : key,
                meaning: entry.meaning
            });
        }
    }
    return results;
}

// ── Module-level state ────────────────────────────────────────────────────────
window._arDwellMap        = window._arDwellMap        || {};
window._arRescrollMap     = window._arRescrollMap     || {};
window._arStruggledParagraphs = window._arStruggledParagraphs || [];
window._arAdaptingSet     = window._arAdaptingSet     || new Set();
window._arSessionId       = window._arSessionId       || crypto.randomUUID();
window._arSessionStart    = window._arSessionStart    || Date.now();

// ── Serial gloss queue ────────────────────────────────────────────────────────
// Paragraphs that dwelled 10s+ are processed ONE AT A TIME via these queues.
const _arGlossQueue  = [];
const _arHindiQueue  = [];
let   _arGlossActive = false;
let   _arHindiActive = false;

const _arGlossTimers = {};
const _arHindiTimers = {};

function _arEnqueueGloss(idx, para) {
    if (_arGlossQueue.find(function(q) { return q.idx === idx; })) return;
    _arGlossQueue.push({ idx: idx, para: para });
    console.log("[AR:telemetry] Gloss queue length:", _arGlossQueue.length);
    _arDrainGlossQueue();
}

function _arDrainGlossQueue() {
    if (_arGlossActive || _arGlossQueue.length === 0) return;
    _arGlossActive = true;
    var item = _arGlossQueue.shift();
    var idx = item.idx, para = item.para;
    if (!para || para.dataset.arGlossed) {
        _arGlossActive = false;
        _arDrainGlossQueue();
        return;
    }
    var text  = para.textContent || "";
    var words = scanWordmap(text);
    if (words.length > 0) {
        console.log("[AR:telemetry] Serial gloss para", idx, words.length, "word(s)");
        injectGlosses(para, words, "simplify");
        para.dataset.arGlossed = "1";
    }
    setTimeout(function() { _arGlossActive = false; _arDrainGlossQueue(); }, 10000); // 10s gap between paragraphs
}

function _arEnqueueHindi(idx, para) {
    if (_arHindiQueue.find(function(q) { return q.idx === idx; })) return;
    _arHindiQueue.push({ idx: idx, para: para });
    console.log("[AR:telemetry] Hindi queue length:", _arHindiQueue.length);
    _arDrainHindiQueue();
}

function _arDrainHindiQueue() {
    if (_arHindiActive || _arHindiQueue.length === 0) return;
    _arHindiActive = true;
    var item = _arHindiQueue.shift();
    var idx = item.idx, para = item.para;
    if (!para || para.dataset.arHindiDone) {
        _arHindiActive = false;
        _arDrainHindiQueue();
        return;
    }
    console.log("[AR:telemetry] Serial Hindi convert para", idx);
    convertGlossesToHindi(para);
    para.dataset.arHindiDone = "1";
    setTimeout(function() { _arHindiActive = false; _arDrainHindiQueue(); }, 10000); // 10s gap between paragraphs
}

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

    // ── IntersectionObserver: paragraph dwell time + 10-sec gloss trigger ────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const idx = entry.target.dataset.index;
            if (idx === undefined) return;

            if (entry.isIntersecting) {
                entryTimes[idx] = Date.now();
                console.log(`[AR:telemetry] Para ${idx} entered viewport`);

                // ── 10s: queue for English gloss ──────────────────────────
                if (!entry.target.dataset.arGlossed && !_arGlossTimers[idx]) {
                    _arGlossTimers[idx] = setTimeout(function() {
                        delete _arGlossTimers[idx];
                        var para = document.querySelector("#ar-column p[data-index='" + idx + "']");
                        if (para && !para.dataset.arGlossed) _arEnqueueGloss(idx, para);
                    }, 10000);
                }

                // ── 20s: queue for Hindi conversion ───────────────────────
                if (!entry.target.dataset.arHindiDone && !_arHindiTimers[idx]) {
                    _arHindiTimers[idx] = setTimeout(function() {
                        delete _arHindiTimers[idx];
                        var para = document.querySelector("#ar-column p[data-index='" + idx + "']");
                        if (para && !para.dataset.arHindiDone) _arEnqueueHindi(idx, para);
                    }, 20000);
                }

            } else {
                // Paragraph left viewport — cancel any pending timers
                if (_arGlossTimers[idx]) {
                    clearTimeout(_arGlossTimers[idx]);
                    delete _arGlossTimers[idx];
                }
                if (_arHindiTimers[idx]) {
                    clearTimeout(_arHindiTimers[idx]);
                    delete _arHindiTimers[idx];
                }

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

        const dwell   = window._arDwellMap[idx]   || 0;
        const rescroll = window._arRescrollMap[idx] || 0;

        // Adaptation (full AI rewrite) only after 20s or on rescroll
        const adaptFlag = dwell > 20000 || rescroll >= 1;

        console.log(
            `[AR:telemetry] Struggle check para ${idx}:`,
            `dwell=${dwell}ms, rescroll=${rescroll}, adapt=${adaptFlag}`
        );

        if (adaptFlag) {
            window._arAdaptingSet.add(idx);
            sendTelemetry("struggle_detected", {
                paragraph_index: Number(idx),
                dwell_ms: dwell,
                rescroll_count: rescroll
            });

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

// ── Inline Gloss Injector ─────────────────────────────────────────────────────
/**
 * Walks all text nodes inside `para` and, for each matched word in `words`,
 * splits the text node to insert inline:
 *   <span class="ar-hard-word">word</span><span class="ar-gloss"> [meaning]</span>
 *
 * Only annotates the FIRST occurrence of each word per paragraph.
 * Mode: "simplify" (blue) or "esl" (pink).
 */
function injectGlosses(para, words, mode) {
    if (!mode) mode = "simplify";

    // Sort longest-match first so "insubordination" matches before "nation"
    const sorted = [...words].sort((a, b) => b.original.length - a.original.length);

    function getTextNodes(node) {
        const result = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) result.push(n);
        return result;
    }

    sorted.forEach(function(item) {
        const original = item.original;
        const meaning  = item.meaning;

        // Strip leading/trailing non-word characters from the key
        let cleanKey = original.trim().replace(/^[\W_]+|[\W_]+$/g, "");
        if (!cleanKey) cleanKey = original;

        // Escape for regex
        let escaped = cleanKey.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

        const re = new RegExp("\\b(" + escaped + ")\\b", "i");

        // Re-collect text nodes every pass (previous insertions split nodes)
        const textNodes = getTextNodes(para);

        for (let i = 0; i < textNodes.length; i++) {
            const tn = textNodes[i];

            // Skip text inside already-glossed spans
            const parent = tn.parentElement;
            if (parent && (parent.classList.contains("ar-gloss") || parent.classList.contains("ar-hard-word"))) {
                continue;
            }

            const text = tn.nodeValue || "";
            const match = re.exec(text);
            if (!match) continue;

            const before      = text.slice(0, match.index);
            const matchedWord = match[1];
            const after       = text.slice(match.index + matchedWord.length);

            const frag = document.createDocumentFragment();

            if (before) frag.appendChild(document.createTextNode(before));

            // Hard-word span (dotted underline)
            const wordSpan = document.createElement("span");
            wordSpan.className = "ar-hard-word";
            wordSpan.textContent = matchedWord;
            wordSpan.title = meaning;
            if (mode === "esl") {
                wordSpan.style.borderBottomColor = "#d81b60";
            }
            frag.appendChild(wordSpan);

            // Gloss span ([meaning] in italic)
            const glossSpan = document.createElement("span");
            glossSpan.className = (mode === "esl") ? "ar-gloss ar-esl" : "ar-gloss";
            if (mode === "esl") {
                glossSpan.style.color = "#d81b60";
            }
            glossSpan.textContent = " [" + meaning + "]";
            frag.appendChild(glossSpan);

            if (after) frag.appendChild(document.createTextNode(after));

            tn.parentNode.replaceChild(frag, tn);

            // First occurrence only
            break;
        }
    });
}

// ── Hindi Gloss Converter ─────────────────────────────────────────────────────
/**
 * For every .ar-hard-word span inside `para`, look up its Hindi equivalent
 * in AR_HARD_WORDS and smoothly transition the adjacent .ar-gloss span
 * from English (blue) → Hindi (pink).
 *
 * Transition sequence:
 *   1. Fade out the gloss (opacity 0, 350ms)
 *   2. Swap text + add .ar-esl class (pink color via CSS)
 *   3. Fade back in (opacity 0.85, 400ms)
 *   4. Also transition the hard-word underline from blue → pink
 */
function convertGlossesToHindi(para) {
    const hardWordSpans = para.querySelectorAll(".ar-hard-word");

    hardWordSpans.forEach(function(wordSpan) {
        // Look up Hindi equivalent using the span's displayed text
        const wordText = (wordSpan.textContent || "").trim().toLowerCase();
        const entry = AR_HARD_WORDS.get(wordText);
        if (!entry || !entry.hindi) return;

        // The gloss span should be the very next sibling element
        const glossSpan = wordSpan.nextElementSibling;
        if (!glossSpan || !glossSpan.classList.contains("ar-gloss")) return;

        // Already converted
        if (glossSpan.classList.contains("ar-esl")) return;

        const hindi = entry.hindi;

        // Step 1: Fade out
        glossSpan.style.transition = "opacity 0.35s ease, color 0.4s ease";
        glossSpan.style.opacity = "0";

        setTimeout(function() {
            // Step 2: Swap content + apply pink class
            glossSpan.textContent = " [" + hindi + "]";
            glossSpan.classList.add("ar-esl");
            // Tooltip update
            wordSpan.title = hindi;
            // Underline → pink
            wordSpan.style.borderBottomColor = "#d81b60";

            // Step 3: Fade back in
            glossSpan.style.opacity = "0.85";
        }, 380); // slightly after the fade-out completes
    });

    console.log("[AR:telemetry] convertGlossesToHindi: converted", hardWordSpans.length, "spans in para");
}