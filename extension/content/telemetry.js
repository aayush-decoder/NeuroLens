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
// TODO: Make these thresholds configurable via settings panel
// Dwell threshold (ms) before a paragraph is sent to /api/adapt for simplification
const AR_ADAPT_DWELL_THRESHOLD_MS = 10000; // 10 seconds as required
// Additional wait time (ms) after /api/adapt before calling /api/translate
const AR_TRANSLATE_DELAY_MS = 10000; // 10 seconds after adapt completes

window._arDwellMap        = window._arDwellMap        || {};
window._arRescrollMap     = window._arRescrollMap     || {};
window._arStruggledParagraphs = window._arStruggledParagraphs || [];
window._arAdaptingSet     = window._arAdaptingSet     || new Set();
window._arTranslatingSet  = window._arTranslatingSet  || new Set();
window._arSessionId       = window._arSessionId       || crypto.randomUUID();
window._arSessionStart    = window._arSessionStart    || Date.now();
// Concept map state - build incrementally
window._arConceptMapWords = window._arConceptMapWords || {};
window._arConceptMapCategories = window._arConceptMapCategories || {};

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

        // Adaptation: use global threshold constant
        const adaptFlag = dwell > AR_ADAPT_DWELL_THRESHOLD_MS || rescroll >= 1;

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

// ── Style inserted brackets in grey ───────────────────────────────────────────
/**
 * Compares original text with modified HTML and wraps inserted content
 * (text in brackets like [definition] or (expansion)) in grey spans.
 */
function styleInsertedBrackets(originalText, modifiedHtml) {
    // Extract plain text from HTML for comparison
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modifiedHtml;
    const modifiedText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Find all bracket patterns: [text] or (text)
    const bracketPattern = /(\[[^\]]+\]|\([^)]+\))/g;
    
    // Check if these brackets exist in original text
    let styledHtml = modifiedHtml;
    const matches = modifiedText.match(bracketPattern);
    
    if (matches) {
        matches.forEach(function(bracket) {
            // If bracket doesn't exist in original text, it was inserted
            if (originalText.indexOf(bracket) === -1) {
                // Escape special regex characters in bracket
                const escapedBracket = bracket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Wrap it in a grey span (outside of existing HTML tags)
                const greySpan = '<span style="color: #888; opacity: 0.75;">' + bracket + '</span>';
                // Replace in HTML, but be careful not to replace inside existing tags
                styledHtml = styledHtml.replace(
                    new RegExp('(?<=>|^)(' + escapedBracket + ')(?=<|$)', 'g'),
                    greySpan
                );
            }
        });
    }
    
    return styledHtml;
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

    // Call /api/adapt to get simplified paragraph
    chrome.runtime.sendMessage(
        {
            type: "ADAPT_PARAGRAPH",
            text: originalText,
            paragraph_index: Number(idx),
            url: location.href,
            dwell_ms: dwellMs,
            rescroll_count: rescrollCount,
            session_elapsed_min: elapsedMin(),
            language: null
        },
        (res) => {
            if (!chrome.runtime.lastError && res && res.modifiedText) {
                console.log(`[AR:telemetry] Para ${idx}: adapt success, replacing paragraph`);
                
                // Style inserted brackets in grey by comparing original and modified text
                const styledHtml = styleInsertedBrackets(originalText, res.modifiedText);
                
                // Replace entire paragraph with simplified version
                para.innerHTML = styledHtml;
                para.classList.add("ar-adapted");
                para.style.opacity = "1";
                
                // Store for review sheet
                if (!window._arStruggledParagraphs.find(p => p.index === idx)) {
                    window._arStruggledParagraphs.push({
                        index: Number(idx),
                        text: originalText,
                        dwell_ms: dwellMs,
                        rescroll_count: rescrollCount
                    });
                }
                
                sendTelemetry("adaptation_shown", {
                    paragraph_index: Number(idx),
                    dwell_ms: dwellMs,
                    rescroll_count: rescrollCount
                });
                
                window._arAdaptingSet.delete(idx);
                
                // Extract hard words from adapted paragraph and categorize them
                extractAndCategorizeWords(para, idx);
                
                // Schedule translation after AR_TRANSLATE_DELAY_MS
                console.log(`[AR:telemetry] Para ${idx}: scheduling translation in ${AR_TRANSLATE_DELAY_MS}ms`);
                setTimeout(function() {
                    triggerTranslation(para, idx, res.modifiedText);
                }, AR_TRANSLATE_DELAY_MS);
                
                return;
            }

            // Fallback: wordmap gloss injection
            console.warn(`[AR:telemetry] Para ${idx}: adapt failed, falling back to wordmap`);
            const words = scanWordmap(originalText);
            if (words.length > 0) {
                injectGlosses(para, words, "simplify");
            }
            window._arAdaptingSet.delete(idx);
        }
    );
}

// ── Translation call ──────────────────────────────────────────────────────────
function triggerTranslation(para, idx, adaptedText) {
    // Check if already translating
    if (window._arTranslatingSet.has(idx)) {
        console.log(`[AR:telemetry] Para ${idx}: translation already in progress, skip`);
        return;
    }
    
    // Check if paragraph still exists and is adapted
    if (!para || !para.classList.contains("ar-adapted")) {
        console.log(`[AR:telemetry] Para ${idx}: paragraph no longer adapted, skip translation`);
        return;
    }
    
    window._arTranslatingSet.add(idx);
    
    console.log(
        `[AR:telemetry] triggerTranslation() para ${idx}:`,
        `text length=${adaptedText.length}`
    );
    
    // Get user's preferred language from storage (default: hindi)
    chrome.storage.sync.get("language", function(data) {
        const language = data.language || "hindi";
        
        console.log(`[AR:telemetry] Para ${idx}: translating to ${language}`);
        
        // Call /api/translate to translate bracketed definitions
        chrome.runtime.sendMessage(
            {
                type: "TRANSLATE_PARAGRAPH",
                text: adaptedText,
                language: language,
                paragraph_index: Number(idx)
            },
            (res) => {
                if (!chrome.runtime.lastError && res && res.translatedText) {
                    console.log(
                        `[AR:telemetry] Para ${idx}: translation success,`,
                        `applied ${res.translationsApplied || 0} translations`
                    );
                    
                    // Replace paragraph with translated version
                    para.innerHTML = res.translatedText;
                    para.classList.add("ar-translated");
                    
                    sendTelemetry("translation_shown", {
                        paragraph_index: Number(idx),
                        language: language,
                        translations_applied: res.translationsApplied || 0
                    });
                } else {
                    console.warn(`[AR:telemetry] Para ${idx}: translation failed, keeping adapted version`);
                }
                
                window._arTranslatingSet.delete(idx);
            }
        );
    });
}

// ── Extract and categorize words from adapted paragraph ──────────────────────
function extractAndCategorizeWords(para, idx) {
    // Extract all hard words from this paragraph
    // Look for words that have definitions in parentheses or brackets
    const text = para.textContent || "";
    const hardWords = [];
    
    // Pattern: word (definition) or word [definition]
    // We want to extract the "word" part before the bracket/parenthesis
    const pattern = /(\w+)\s*[\[\(]/g;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
        const word = match[1].toLowerCase();
        if (word && word.length > 3 && !hardWords.includes(word)) {
            hardWords.push(word);
            // Track which paragraph this word came from
            if (!window._arConceptMapWords[word]) {
                window._arConceptMapWords[word] = [];
            }
            if (!window._arConceptMapWords[word].includes(idx)) {
                window._arConceptMapWords[word].push(idx);
            }
        }
    }
    
    // Also check for .ar-hard-word spans (from wordmap fallback)
    para.querySelectorAll(".ar-hard-word").forEach(function(span) {
        const word = (span.textContent || "").trim().toLowerCase();
        if (word && word.length > 3 && !hardWords.includes(word)) {
            hardWords.push(word);
            if (!window._arConceptMapWords[word]) {
                window._arConceptMapWords[word] = [];
            }
            if (!window._arConceptMapWords[word].includes(idx)) {
                window._arConceptMapWords[word].push(idx);
            }
        }
    });
    
    if (hardWords.length === 0) {
        console.log(`[AR:telemetry] Para ${idx}: no hard words to categorize`);
        return;
    }
    
    console.log(`[AR:telemetry] Para ${idx}: categorizing ${hardWords.length} words:`, hardWords);
    
    // Call /api/categorize for these words
    chrome.runtime.sendMessage(
        {
            type: "CATEGORIZE_WORDS",
            words: hardWords,
            paragraph_index: Number(idx)
        },
        function(response) {
            if (response && response.categories) {
                console.log(`[AR:telemetry] Para ${idx}: categorization success, source: ${response.source}`);
                
                // Merge categories into global concept map
                Object.keys(response.categories).forEach(function(category) {
                    if (!window._arConceptMapCategories[category]) {
                        window._arConceptMapCategories[category] = [];
                    }
                    response.categories[category].forEach(function(word) {
                        if (!window._arConceptMapCategories[category].includes(word)) {
                            window._arConceptMapCategories[category].push(word);
                        }
                    });
                });
                
                console.log("[AR:telemetry] Concept map updated. Total categories:", Object.keys(window._arConceptMapCategories).length);
                
                // Notify that concept map data is available
                sendTelemetry("concept_map_updated", {
                    paragraph_index: Number(idx),
                    words_added: hardWords.length,
                    total_words: Object.keys(window._arConceptMapWords).length,
                    total_categories: Object.keys(window._arConceptMapCategories).length
                });
            } else {
                console.warn(`[AR:telemetry] Para ${idx}: categorization failed, will use fallback at review`);
            }
        }
    );
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


// ── Phrase Simplification Feature ──
let simplifyTooltip = null;
let simplifiedResultTooltip = null;

console.log('[AR-SIMPLIFY] Phrase simplification feature loaded');

// Listen for text selection
document.addEventListener('mouseup', (e) => {
  console.log('[AR-SIMPLIFY] mouseup event fired');
  
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log('[AR-SIMPLIFY] Selection:', {
      hasSelection: !!selection,
      text: selectedText,
      length: selectedText?.length || 0
    });
    
    if (!selectedText || selectedText.length === 0) {
      hideSimplifyTooltip();
      return;
    }
    
    const wordCount = selectedText.split(/\s+/).length;
    console.log('[AR-SIMPLIFY] Word count:', wordCount);
    
    // Only show for 3-100 words
    if (wordCount < 3 || wordCount > 100) {
      console.log('[AR-SIMPLIFY] Word count out of range (need 3-100)');
      hideSimplifyTooltip();
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    console.log('[AR-SIMPLIFY] Showing tooltip at:', rect);
    showSimplifyTooltip(selectedText, rect, getParagraphContext(selection));
  }, 50);
});

function getParagraphContext(selection) {
  let node = selection.anchorNode;
  while (node && node.nodeName !== 'P') {
    node = node.parentNode;
  }
  return node ? node.textContent : '';
}

function showSimplifyTooltip(text, rect, paragraphText) {
  hideSimplifyTooltip();
  
  simplifyTooltip = document.createElement('div');
  simplifyTooltip.className = 'ar-simplify-tooltip';
  simplifyTooltip.innerHTML = `
    <button class="ar-simplify-btn" data-action="simplify">
      <span class="ar-icon">✨</span> Simplify
    </button>
  `;
  
  simplifyTooltip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  simplifyTooltip.style.top = `${rect.top + window.scrollY - 50}px`;
  
  simplifyTooltip.querySelector('[data-action="simplify"]').addEventListener('click', () => {
    simplifyPhrase(text, paragraphText, rect);
  });
  
  document.body.appendChild(simplifyTooltip);
}

function hideSimplifyTooltip() {
  if (simplifyTooltip) {
    simplifyTooltip.remove();
    simplifyTooltip = null;
  }
}

function hideSimplifiedResult() {
  if (simplifiedResultTooltip) {
    simplifiedResultTooltip.remove();
    simplifiedResultTooltip = null;
  }
}

async function simplifyPhrase(phrase, paragraph, rect) {
  hideSimplifyTooltip();
  
  // Show loading
  const loadingTooltip = document.createElement('div');
  loadingTooltip.className = 'ar-simplify-result';
  loadingTooltip.innerHTML = `
    <div class="ar-loading">
      <div class="ar-spinner"></div>
      <span>Simplifying...</span>
    </div>
  `;
  loadingTooltip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  loadingTooltip.style.top = `${rect.top + window.scrollY + 20}px`;
  document.body.appendChild(loadingTooltip);
  
  try {
    const response = await fetch('https://aleta-stairless-nguyet.ngrok-free.dev/api/simplify-phrase', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ paragraph, phrase })
    });
    
    if (!response.ok) {
      throw new Error('Simplification failed');
    }
    
    const data = await response.json();
    
    loadingTooltip.remove();
    showSimplifiedResult(data, rect);
  } catch (error) {
    console.error('[AR] Simplification error:', error);
    loadingTooltip.innerHTML = `
      <div class="ar-error">
        <span>❌ Failed to simplify</span>
      </div>
    `;
    setTimeout(() => loadingTooltip.remove(), 2000);
  }
}

function showSimplifiedResult(data, rect) {
  hideSimplifiedResult();
  
  simplifiedResultTooltip = document.createElement('div');
  simplifiedResultTooltip.className = 'ar-simplify-result';
  simplifiedResultTooltip.innerHTML = `
    <div class="ar-result-header">
      <strong>Simplified</strong>
      <button class="ar-close-btn">✕</button>
    </div>
    <div class="ar-result-content">
      <p class="ar-simplified-text">${data.simplifiedPhrase}</p>
      <details class="ar-explanation">
        <summary>Why?</summary>
        <p>${data.explanation}</p>
      </details>
    </div>
  `;
  
  simplifiedResultTooltip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  simplifiedResultTooltip.style.top = `${rect.top + window.scrollY + 20}px`;
  
  simplifiedResultTooltip.querySelector('.ar-close-btn').addEventListener('click', hideSimplifiedResult);
  
  document.body.appendChild(simplifiedResultTooltip);
  
  // Auto-hide after 10 seconds
  setTimeout(hideSimplifiedResult, 10000);
}

// Close tooltips on click outside
document.addEventListener('mousedown', (e) => {
  if (simplifyTooltip && !simplifyTooltip.contains(e.target)) {
    hideSimplifyTooltip();
  }
  if (simplifiedResultTooltip && !simplifiedResultTooltip.contains(e.target)) {
    hideSimplifiedResult();
  }
});
