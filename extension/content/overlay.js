if (window.__arActive) {
    const bar = document.getElementById("ar-peek-bar");
    if (bar?.classList.contains("ar-visible")) resumeFromPeek();
    console.log("[AR:overlay] Already active — skipping re-init");
} else {
    window.__arActive = true;
    initAdaptiveReader();
}

function initAdaptiveReader() {
    console.log("[AR:overlay] initAdaptiveReader() starting");
    const pageParas = extractPageParagraphs();
    console.log("[AR:overlay] Extracted", pageParas.length, "paragraphs from page");

    buildDOM(pageParas);
    document.documentElement.style.overflow = "hidden";

    const overlay = document.getElementById("ar-overlay");
    const column = document.getElementById("ar-column");

    window._arOverlay = overlay;
    window._arColumn = column;
    window._arParagraphs = pageParas;
    window._arStruggledParagraphs = window._arStruggledParagraphs || [];

    // Boot order matters
    initPersistence(overlay, column);   // sets _arSessionStart, _arDwellMap, etc.
    initTelemetry(overlay);             // starts observers using restored maps
    initEyeStrain(overlay, column);     // reads _arSessionStart set by persistence
    initFileLoader(
        document.getElementById("ar-dropzone"),
        column,
        document.getElementById("ar-upload-btn")
    );

    setupToolbarAutoHide();
    updatePeekProgress();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const bar = document.getElementById("ar-peek-bar");
            bar?.classList.contains("ar-visible") ? resumeFromPeek() : enterPeekMode();
        }
    });

    document.getElementById("ar-peek-btn").addEventListener("click", enterPeekMode);
    document.getElementById("ar-end-btn").addEventListener("click", endSession);

    overlay.addEventListener("scroll", () => {
        updatePeekProgress();
    });

    console.log("[AR:overlay] Init complete. Session:", window._arSessionId);
}

// ── DOM Build ─────────────────────────────────────────────────────────────────
function buildDOM(pageParas) {
    const overlay = el("div", { id: "ar-overlay" });
    const column = el("div", { id: "ar-column" });
    overlay.appendChild(column);
    document.body.appendChild(overlay);
    renderParagraphs(column, pageParas);

    const toolbar = el("div", { id: "ar-toolbar" });
    toolbar.innerHTML = `
    <span id="ar-session-clock" style="font-size:11px;font-family:sans-serif;color:#888;margin-right:4px"></span>
    <button class="ar-btn" id="ar-upload-btn">File</button>
    <button class="ar-btn" id="ar-settings-btn">Settings</button>
    <button class="ar-btn" id="ar-end-btn">Review &amp; End</button>
    <button class="ar-btn" id="ar-peek-btn">Peek (Esc)</button>
  `;
    document.body.appendChild(toolbar);

    // ── Settings panel ────────────────────────────────────────────────────────
    const settingsPanel = el("div", { id: "ar-settings-panel" });
    settingsPanel.innerHTML = `
      <div class="ar-settings-title">Reader Settings</div>

      <div class="ar-settings-row">
        <span class="ar-settings-label">Dark Mode</span>
        <label class="ar-toggle">
          <input type="checkbox" id="ar-dark-toggle" />
          <span class="ar-toggle-slider"></span>
        </label>
      </div>

      <hr class="ar-settings-divider" />

      <div class="ar-settings-label" style="margin-bottom:6px">Font Family</div>
      <select id="ar-font-select" class="ar-settings-select">
        <option value="">Default (Georgia)</option>
        <option value="'Inter', sans-serif">Inter</option>
        <option value="'Merriweather', serif">Merriweather</option>
        <option value="'Roboto', sans-serif">Roboto</option>
        <option value="'Open Sans', sans-serif">Open Sans</option>
        <option value="'Lato', sans-serif">Lato</option>
        <option value="'Nunito', sans-serif">Nunito</option>
        <option value="'Source Serif 4', serif">Source Serif 4</option>
        <option value="monospace">Monospace</option>
      </select>
    `;
    document.body.appendChild(settingsPanel);
    initSettingsPanel(settingsPanel, overlay, column);

    const peekBar = el("div", { id: "ar-peek-bar" });
    peekBar.innerHTML = `
    <span id="ar-peek-title">${document.title}</span>
    <div id="ar-peek-progress">
      <div id="ar-peek-progressbar"><div id="ar-peek-progressfill" style="width:0%"></div></div>
      <span id="ar-peek-pct">0%</span>
    </div>
    <button id="ar-resume-btn">↩ Resume Reading</button>
    <button id="ar-end-peek-btn" title="End session">✕</button>
  `;
    document.body.appendChild(peekBar);
    peekBar.querySelector("#ar-resume-btn").addEventListener("click", resumeFromPeek);
    peekBar.querySelector("#ar-end-peek-btn").addEventListener("click", endSession);

    const dz = el("div", { id: "ar-dropzone" });
    dz.textContent = "Drop .txt or .md to load into reader";
    document.body.appendChild(dz);

    const modal = el("div", { id: "ar-review-modal" });
    modal.innerHTML = `
    <div id="ar-review-inner">
      <button class="ar-modal-close" id="ar-modal-close">x</button>
      <h2>Session Review</h2>

      <div id="ar-review-tabs">
        <button class="ar-tab-btn ar-tab-active" data-tab="ai">Smart Review</button>
        <button class="ar-tab-btn" data-tab="graph">Concept Map</button>
        <button class="ar-tab-btn" data-tab="revision">Revision Sheet</button>
      </div>

      <div id="ar-tab-ai" class="ar-tab-pane ar-tab-pane-active">
        <div id="ar-review-content">Loading...</div>
      </div>
      <div id="ar-tab-graph" class="ar-tab-pane">
        <div id="ar-concept-graph"></div>
      </div>
      <div id="ar-tab-revision" class="ar-tab-pane">
        <div id="ar-revision-content">Loading revision sheet...</div>
      </div>

      <div style="margin-top:20px;text-align:right">
        <button class="ar-btn" id="ar-destroy-btn"
          style="background:#fff0f0;border-color:#ffcdd2;color:#c62828">
          End &amp; Close Reader
        </button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    modal.querySelector("#ar-modal-close").addEventListener("click", function() { modal.classList.remove("ar-visible"); });
    modal.querySelector("#ar-destroy-btn").addEventListener("click", destroyReader);
    modal.addEventListener("click", function(e) { if (e.target === modal) modal.classList.remove("ar-visible"); });

    // Tab switching
    modal.querySelectorAll(".ar-tab-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            modal.querySelectorAll(".ar-tab-btn").forEach(function(b) { b.classList.remove("ar-tab-active"); });
            modal.querySelectorAll(".ar-tab-pane").forEach(function(p) { p.classList.remove("ar-tab-pane-active"); });
            btn.classList.add("ar-tab-active");
            modal.querySelector("#ar-tab-" + btn.dataset.tab).classList.add("ar-tab-pane-active");
        });
    });

    setInterval(updateSessionClock, 30000);
    updateSessionClock();
}

function el(tag, attrs = {}) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => (e[k] = v));
    return e;
}

function renderParagraphs(column, paras) {
    column.innerHTML = "";
    paras.forEach((text, i) => {
        const p = document.createElement("p");
        p.textContent = text;
        p.dataset.index = i;
        column.appendChild(p);
    });
    console.log("[AR:overlay] Rendered", paras.length, "paragraphs into column");
}

function extractPageParagraphs() {
    const seen = new Set();
    return Array.from(
        document.querySelectorAll("p, article p, main p, .post-content p, .entry-content p")
    )
        .filter(el => {
            const t = el.innerText.trim();
            if (t.length < 80 || seen.has(t)) return false;
            seen.add(t);
            return true;
        })
        .map(el => el.innerText.trim());
}

// ── Peek Mode ─────────────────────────────────────────────────────────────────
function enterPeekMode() {
    const overlay = document.getElementById("ar-overlay");
    const bar = document.getElementById("ar-peek-bar");
    const toolbar = document.getElementById("ar-toolbar");

    window._arSavedScroll = overlay.scrollTop;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    toolbar.style.display = "none";
    document.documentElement.style.overflow = "";
    bar.classList.add("ar-visible");
    updatePeekProgress();

    console.log("[AR:overlay] Entered peek mode. Saved scroll:", window._arSavedScroll);

    // Fire telemetry
    chrome.runtime.sendMessage({
        type: "TELEMETRY",
        session_id: window._arSessionId,
        url: location.href,
        event: "peek_entered",
        session_elapsed_min: (Date.now() - window._arSessionStart) / 60000
    });
}

function resumeFromPeek() {
    const overlay = document.getElementById("ar-overlay");
    const bar = document.getElementById("ar-peek-bar");
    const toolbar = document.getElementById("ar-toolbar");

    bar.classList.remove("ar-visible");
    document.documentElement.style.overflow = "hidden";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "";
    toolbar.style.display = "";

    if (window._arSavedScroll != null) {
        overlay.scrollTop = window._arSavedScroll;
    }
    console.log("[AR:overlay] Resumed from peek. Scroll restored to:", window._arSavedScroll);
}

function updatePeekProgress() {
    const overlay = document.getElementById("ar-overlay");
    if (!overlay) return;
    const total = overlay.scrollHeight - overlay.clientHeight;
    const pct = total > 0 ? Math.round((overlay.scrollTop / total) * 100) : 0;
    const fill = document.getElementById("ar-peek-progressfill");
    const pctEl = document.getElementById("ar-peek-pct");
    if (fill) fill.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
}

// ── Toolbar auto-hide ─────────────────────────────────────────────────────────
function setupToolbarAutoHide() {
    const toolbar = document.getElementById("ar-toolbar");
    const overlay = document.getElementById("ar-overlay");
    let timer;
    const show = () => {
        toolbar.classList.remove("ar-hidden");
        clearTimeout(timer);
        timer = setTimeout(() => toolbar.classList.add("ar-hidden"), 2500);
    };
    overlay.addEventListener("mousemove", show);
    overlay.addEventListener("scroll", show);
    show();
}

// ── Session clock ─────────────────────────────────────────────────────────────
function updateSessionClock() {
    const clockEl = document.getElementById("ar-session-clock");
    if (!clockEl || !window._arSessionStart) return;
    const mins = Math.floor((Date.now() - window._arSessionStart) / 60000);
    clockEl.textContent = mins < 1 ? "" : `${mins}m`;
}

// ── End Session ───────────────────────────────────────────────────────────────
function endSession() {
    var bar = document.getElementById("ar-peek-bar");
    if (bar && bar.classList.contains("ar-visible")) resumeFromPeek();

    var modal    = document.getElementById("ar-review-modal");
    var struggled = window._arStruggledParagraphs || [];

    modal.classList.add("ar-visible");

    var elapsedMin = (Date.now() - window._arSessionStart) / 60000;
    console.log("[AR:overlay] endSession(). Struggled:", struggled.length, "Elapsed:", elapsedMin.toFixed(2), "min");

    chrome.runtime.sendMessage({
        type: "TELEMETRY",
        session_id: window._arSessionId,
        url: location.href,
        event: "session_ended",
        session_elapsed_min: elapsedMin
    });

    // ── Tab: Concept Map — build immediately ──────────────────────────────────
    buildConceptGraph(document.getElementById("ar-concept-graph"));

    // ── Load Smart Review + Revision Sheet via /api/review ───────────────────
    var smartReviewEl  = document.getElementById("ar-review-content");
    var revisionEl     = document.getElementById("ar-revision-content");

    smartReviewEl.innerHTML = renderSmartReviewLoading();
    revisionEl.innerHTML    = renderRevisionLoading();

    chrome.storage.sync.get("language", function(d) {
        var paragraphPayload = struggled.map(function(p) {
            return {
                index: p.index,
                text: p.text,
                dwell_ms: p.dwell_ms || (window._arDwellMap && window._arDwellMap[p.index]) || 0,
                rescroll_count: p.rescroll_count || (window._arRescrollMap && window._arRescrollMap[p.index]) || 0
            };
        });

        chrome.runtime.sendMessage({
            type: "GENERATE_REVIEW",
            session_id: window._arSessionId,
            paragraphs: paragraphPayload,
            language: d.language || null
        }, function(res) {
            var items = (res && res.items && res.items.length > 0)
                ? res.items
                : generateFallbackItems(struggled);

            console.log("[AR:overlay] Review items received:", items.length);

            smartReviewEl.innerHTML  = renderSmartReview(items, struggled);
            revisionEl.innerHTML     = renderRevisionSheet(items, struggled);
        });
    });

    // ── Fire bucket save in background ───────────────────────────────────────
    setTimeout(function() {
        try {
            var fullText = Array.from(document.querySelectorAll("#ar-column p"))
                .map(function(p) { return p.textContent; })
                .join("\n\n");
            var conceptSvg = document.getElementById("ar-concept-graph")
                ? document.getElementById("ar-concept-graph").innerHTML
                : "";

            chrome.runtime.sendMessage({
                type: "SAVE_TO_BUCKET",
                url: location.href,
                title: document.title,
                text: fullText,
                conceptSvg: conceptSvg,
                revisionMarkdown: "" // will be ignored; bucket save is best-effort
            }, function(res) {
                if (res && res.error) console.error("[AR:overlay] SAVE_TO_BUCKET error:", res.error);
                else console.log("[AR:overlay] SAVE_TO_BUCKET success:", res);
            });
        } catch (e) {
            console.error("[AR:overlay] Failed to trigger bucket save:", e);
        }
    }, 800);
}

// ── Smart Review HTML renderers ───────────────────────────────────────────────
function renderSmartReviewLoading() {
    return '<div style="text-align:center;padding:40px 0">' +
        '<div style="display:inline-block;width:28px;height:28px;border:3px solid rgba(76,175,80,0.2);border-top-color:#4CAF50;border-radius:50%;animation:ar-spin 0.8s linear infinite;margin-bottom:10px"></div>' +
        '<p style="color:#888;font-size:13px">Generating your Smart Review…</p>' +
        '</div>';
}

function renderRevisionLoading() {
    return '<div style="text-align:center;padding:40px 0">' +
        '<div style="display:inline-block;width:28px;height:28px;border:3px solid rgba(76,175,80,0.2);border-top-color:#4CAF50;border-radius:50%;animation:ar-spin 0.8s linear infinite;margin-bottom:10px"></div>' +
        '<p style="color:#888;font-size:13px">Building revision sheet…</p>' +
        '</div>';
}

function renderSmartReview(items, struggled) {
    if (!items.length && !struggled.length) {
        return '<div style="text-align:center;padding:32px;color:#999;font-size:13px">' +
            '<p>No struggled paragraphs detected.</p>' +
            '<p style="margin-top:6px;font-size:12px">Keep reading to build your review!</p></div>';
    }

    var html = '';

    // ── Key Insights banner ────────────────────────────────────────────────────
    html += '<div style="background:#ecf9ec;border:1px solid #a5d6a7;border-radius:10px;padding:14px 16px;margin-bottom:16px">' +
        '<p style="font-weight:700;color:#2e7d32;font-size:13px;margin-bottom:6px">✨ Key Insights</p>' +
        '<ul style="list-style:none;font-size:12px;color:#388e3c;line-height:1.8">' +
        '<li>• Found <strong>' + items.length + '</strong> challenging terms during your reading</li>' +
        '<li>• <strong>' + struggled.length + '</strong> paragraph' + (struggled.length !== 1 ? 's' : '') + ' marked as difficult</li>' +
        '<li>• Review these terms to improve comprehension</li>' +
        '</ul></div>';

    if (!items.length) {
        html += '<div style="text-align:center;padding:20px;color:#aaa;font-size:13px">' +
            '<p>No term definitions available.</p><p style="margin-top:4px;font-size:12px">Check the Revision Sheet tab.</p></div>';
        return html;
    }

    // ── Challenging Terms list ─────────────────────────────────────────────────
    html += '<p style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Challenging Terms</p>';

    items.forEach(function(item) {
        html += '<div style="border:1px solid #e0e0e0;border-radius:10px;padding:12px 14px;margin-bottom:10px;transition:background 0.15s" ' +
            'onmouseover="this.style.background=\'#fafafa\'" onmouseout="this.style.background=\'\'">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">' +
            '<div style="flex:1">' +
            '<p style="font-weight:700;color:#4CAF50;font-size:13px;margin-bottom:4px">' + escHtml(item.term) + '</p>' +
            '<p style="font-size:13px;color:#333;line-height:1.6">' + escHtml(item.definition) + '</p>' +
            (item.esl_equiv
                ? '<p style="font-size:11px;color:#e91e63;margin-top:6px;font-style:italic">💡 Simpler: ' + escHtml(item.esl_equiv) + '</p>'
                : '') +
            '</div>' +
            '<span style="font-size:11px;color:#aaa;white-space:nowrap;margin-top:2px">Para ' + (item.source_paragraph_index + 1) + '</span>' +
            '</div></div>';
    });

    return html;
}

function renderRevisionSheet(items, struggled) {
    var html = '';

    // ── Study Tips ────────────────────────────────────────────────────────────
    html += '<div style="background:#e8f4fd;border:1px solid #90caf9;border-radius:10px;padding:14px 16px;margin-bottom:16px">' +
        '<p style="font-weight:700;color:#1565c0;font-size:13px;margin-bottom:6px">📚 Study Tips</p>' +
        '<ul style="list-style:none;font-size:12px;color:#1976d2;line-height:2">' +
        '<li>• Review these terms regularly to improve retention</li>' +
        '<li>• Create flashcards for terms you struggle with</li>' +
        '<li>• Try using these words in your own sentences</li>' +
        '<li>• Focus on paragraphs marked as difficult</li>' +
        '</ul></div>';

    // ── Key Terms ─────────────────────────────────────────────────────────────
    if (items.length > 0) {
        html += '<p style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eee;padding-bottom:6px">Key Terms</p>';
        items.forEach(function(item, i) {
            html += '<div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:10px;padding:12px 14px;margin-bottom:10px">' +
                '<div style="display:flex;align-items:flex-start;gap:10px">' +
                '<span style="font-weight:700;font-size:16px;color:#4CAF50;min-width:24px">' + (i + 1) + '.</span>' +
                '<div style="flex:1">' +
                '<p style="font-weight:700;color:#4CAF50;font-size:13px">' + escHtml(item.term) + '</p>' +
                '<p style="font-size:13px;color:#333;margin-top:4px;line-height:1.6">' + escHtml(item.definition) + '</p>' +
                (item.esl_equiv
                    ? '<p style="font-size:11px;color:#e91e63;margin-top:6px;font-style:italic">💡 Simpler meaning: ' + escHtml(item.esl_equiv) + '</p>'
                    : '') +
                '<p style="font-size:11px;color:#aaa;margin-top:6px">Found in paragraph ' + (item.source_paragraph_index + 1) + '</p>' +
                '</div></div></div>';
        });
    } else if (!struggled.length) {
        html += '<p style="color:#aaa;font-size:13px;padding:20px 0;text-align:center">No review items yet.</p>';
    }

    // ── Challenging Paragraphs ─────────────────────────────────────────────────
    if (struggled.length > 0) {
        html += '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px 16px;margin-top:16px">' +
            '<p style="font-weight:700;color:#e65100;font-size:13px;margin-bottom:10px">⚠️ Challenging Paragraphs</p>';
        struggled.slice(0, 5).forEach(function(para) {
            html += '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;font-size:12px;color:#bf360c">' +
                '<span style="font-weight:700;white-space:nowrap">Para ' + (para.index + 1) + ':</span>' +
                '<div style="flex:1">' +
                '<p style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:340px">' + escHtml(para.text.substring(0, 65)) + '…</p>' +
                '<p style="font-size:11px;color:#e64a19;margin-top:3px">⏱️ ' + (para.dwell_ms / 1000).toFixed(1) + 's dwell • ' + para.rescroll_count + ' rescrolls</p>' +
                '</div></div>';
        });
        html += '</div>';
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    html += '<p style="text-align:center;font-size:11px;color:#bbb;margin-top:20px;padding-top:12px;border-top:1px solid #eee">' +
        '💾 You can save this page (Ctrl+S) for offline study</p>';

    return html;
}

// ── Local fallback: extract terms from struggled paragraphs ───────────────────
var WORD_CATEGORIES_LOCAL = {
    Political:    ["sovereignty","diplomatic","unilateral","rhetoric","sanctions","intervention","jurisdiction","governance","democracy","legislation"],
    Military:     ["paramilitary","militia","combat","casualties","insurgency","espionage","retaliation","warfare","defense","strategic"],
    Geographic:   ["archipelago","coastal","maritime","navigation","reclamation","annexed","disputed","transnational","occupation","territorial"],
    Humanitarian: ["misery","harassment","adversity","vulnerability","resilience","displacement","detention","precarious","refugee","persecution"],
    Legal:        ["extrajudicial","impunity","insubordination","penalized","infringement","deterrent","obstruction","coercion","statute","constitutional"],
    Economic:     ["commerce","fiscal","monetary","investment","capital","revenue","expenditure","inflation","recession","subsidy","tariff"],
    Scientific:   ["hypothesis","empirical","methodology","synthesis","theoretical","experimental","quantitative","qualitative","paradigm"],
    Technological:["algorithm","automation","artificial","intelligence","computing","software","cybersecurity","infrastructure","digital"]
};

function generateFallbackItems(struggled) {
    var items = [], seen = new Set();
    for (var pi = 0; pi < struggled.length && items.length < 12; pi++) {
        var para = struggled[pi];
        var words = para.text.split(/[\s\-\.,\"';:!?()\[\]]+/).filter(function(w) { return w && w.length > 3; });
        for (var wi = 0; wi < words.length && items.length < 12; wi++) {
            var lower = words[wi].toLowerCase();
            if (seen.has(lower) || lower.length > 30) continue;
            seen.add(lower);
            var category = "Other";
            for (var cat in WORD_CATEGORIES_LOCAL) {
                if (WORD_CATEGORIES_LOCAL[cat].indexOf(lower) !== -1) { category = cat; break; }
            }
            items.push({ term: words[wi], definition: "A " + category.toLowerCase() + " term found in your reading.", source_paragraph_index: para.index });
        }
    }
    return items;
}



// ── Concept Graph ─────────────────────────────────────────────────────────────
var WORD_CATEGORIES = {
    Political:    ["sovereignty","diplomatic","unilateral","assertions","rhetoric","sanctions","bureaucracy","intervention","jurisdiction","arbitration","paramountcy","assertiveness","advocates","entitlements"],
    Military:     ["paramilitary","militia","guerilla","combat","casualties","insurgency","armistice","militarization","interdiction","espionage","retaliation","retribution","subversion","hostile","fortification"],
    Geographic:   ["archipelago","coastal","maritime","oceanic","navigation","reclamation","annexed","disputed","displacement","transnational","occupation","coastal","expropriation"],
    Humanitarian: ["misery","harassment","intimidated","adversity","vulnerability","resilience","displacement","oblivion","detention","precarious","vexation","abduction","fatalities","evacuated"],
    Legal:        ["extrajudicial","impunity","jurisdiction","insubordination","penalized","infringement","deterrent","obstruction","deterrence","collateral","negotiation","coercion","cooperation"]
};

var CATEGORY_COLORS = {
    Political:    "#5c6bc0",
    Military:     "#e53935",
    Geographic:   "#00897b",
    Humanitarian: "#f57c00",
    Legal:        "#8e24aa"
};

function buildConceptGraph(container) {
    if (!container) return;

    // Check if we have incrementally built categories from reading session
    const hasIncrementalData = window._arConceptMapCategories && 
                               Object.keys(window._arConceptMapCategories).length > 0;

    if (hasIncrementalData) {
        console.log("[AR:overlay] Using incrementally built concept map from session");
        console.log("[AR:overlay] Categories:", Object.keys(window._arConceptMapCategories));
        console.log("[AR:overlay] Total words:", Object.keys(window._arConceptMapWords || {}).length);
        
        // Use the incrementally built categories
        renderConceptGraph(container, window._arConceptMapCategories);
        return;
    }

    // Fallback: collect words from DOM and categorize all at once
    console.log("[AR:overlay] No incremental data, falling back to DOM collection");
    
    var glossedWords = [];
    document.querySelectorAll("#ar-column .ar-hard-word").forEach(function(span) {
        var w = (span.textContent || "").trim().toLowerCase();
        if (w && !glossedWords.includes(w)) glossedWords.push(w);
    });

    console.log("[AR:overlay] Concept graph — glossed words:", glossedWords);

    if (glossedWords.length === 0) {
        container.innerHTML = "<p style='color:#aaa;text-align:center;padding:40px;font-size:13px'>No hard words were annotated this session.<br>Read for longer to see the concept map.</p>";
        return;
    }

    // Show loading state
    container.innerHTML = "<p style='color:#aaa;text-align:center;padding:40px;font-size:13px'>Generating concept map...</p>";

    // Try AI categorization first, fallback to hardcoded
    chrome.runtime.sendMessage(
        {
            type: "CATEGORIZE_WORDS",
            words: glossedWords
        },
        function(response) {
            var wordsByCategory;
            
            if (response && response.categories) {
                console.log("[AR:overlay] Using AI categorization, source:", response.source);
                wordsByCategory = response.categories;
            } else {
                console.log("[AR:overlay] Using hardcoded categorization (fallback)");
                wordsByCategory = categorizeWordsHardcoded(glossedWords);
            }
            
            renderConceptGraph(container, wordsByCategory);
        }
    );
}

// ── Hardcoded categorization (fallback) ───────────────────────────────────────
function categorizeWordsHardcoded(glossedWords) {
    var wordsByCategory = {};
    Object.keys(WORD_CATEGORIES).forEach(function(cat) { wordsByCategory[cat] = []; });
    wordsByCategory["Other"] = [];

    glossedWords.forEach(function(word) {
        var found = false;
        Object.keys(WORD_CATEGORIES).forEach(function(cat) {
            if (!found && WORD_CATEGORIES[cat].indexOf(word) !== -1) {
                wordsByCategory[cat].push(word);
                found = true;
            }
        });
        if (!found) wordsByCategory["Other"].push(word);
    });

    // Remove empty categories
    Object.keys(wordsByCategory).forEach(function(cat) {
        if (wordsByCategory[cat].length === 0) delete wordsByCategory[cat];
    });

    return wordsByCategory;
}

// ── Render concept graph SVG ──────────────────────────────────────────────────
function renderConceptGraph(container, wordsByCategory) {
    var W = container.offsetWidth || 560;
    var H = 420;
    var cx = W / 2, cy = H / 2;

    var cats = Object.keys(wordsByCategory);
    var catCount = cats.length;

    // SVG elements buffer
    var svgLines = [], svgNodes = [], svgLabels = [];

    cats.forEach(function(cat, ci) {
        var color = CATEGORY_COLORS[cat] || "#78909c";
        var words = wordsByCategory[cat];

        // Place category hub in a ring around center
        var angle = (2 * Math.PI * ci / catCount) - Math.PI / 2;
        var hubR = Math.min(W, H) * 0.28;
        var hx = cx + hubR * Math.cos(angle);
        var hy = cy + hubR * Math.sin(angle);

        // Hub node
        svgNodes.push('<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="28" fill="' + color + '" opacity="0.92"/>');
        svgLabels.push('<text x="' + hx.toFixed(1) + '" y="' + (hy + 4).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="sans-serif">' + escHtml(cat) + '</text>');

        // Line from center to hub
        svgLines.push('<line x1="' + cx.toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '" stroke="' + color + '" stroke-width="1.5" opacity="0.3"/>');

        // Place words around each hub
        words.forEach(function(word, wi) {
            var wCount = words.length;
            var wAngle = angle + (2 * Math.PI * (wi - (wCount - 1) / 2) / Math.max(wCount, 1)) * 0.45;
            var wR = 90 + Math.random() * 10;
            var wx = hx + wR * Math.cos(wAngle);
            var wy = hy + wR * Math.sin(wAngle);

            // Clamp to SVG bounds
            wx = Math.max(40, Math.min(W - 40, wx));
            wy = Math.max(18, Math.min(H - 18, wy));

            svgLines.push('<line x1="' + hx.toFixed(1) + '" y1="' + hy.toFixed(1) + '" x2="' + wx.toFixed(1) + '" y2="' + wy.toFixed(1) + '" stroke="' + color + '" stroke-width="1" opacity="0.45"/>');
            svgNodes.push('<circle cx="' + wx.toFixed(1) + '" cy="' + wy.toFixed(1) + '" r="18" fill="' + color + '" opacity="0.18" stroke="' + color + '" stroke-width="1.2"/>');
            svgLabels.push('<text x="' + wx.toFixed(1) + '" y="' + (wy + 4).toFixed(1) + '" text-anchor="middle" fill="' + color + '" font-size="9" font-weight="600" font-family="sans-serif">' + word.charAt(0).toUpperCase() + word.slice(1) + '</text>');
        });
    });

    // Center node
    svgNodes.push('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="22" fill="#37474f"/>');
    svgLabels.push('<text x="' + cx.toFixed(1) + '" y="' + (cy - 3).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="sans-serif">Hard</text>');
    svgLabels.push('<text x="' + cx.toFixed(1) + '" y="' + (cy + 8).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="sans-serif">Words</text>');

    container.innerHTML =
        '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="font-family:sans-serif">' +
        svgLines.join("") + svgNodes.join("") + svgLabels.join("") +
        '</svg>';
}

// ── Revision Sheet (markdown → HTML) ─────────────────────────────────────────
function loadRevisionSheet(container) {
    if (!container) return;
    var url = chrome.runtime.getURL("content/revision.md");
    fetch(url)
        .then(function(r) { return r.text(); })
        .then(function(md) {
            container.innerHTML = markdownToHtml(md);
        })
        .catch(function(err) {
            container.innerHTML = "<p style='color:#e53935;font-size:13px'>Could not load revision sheet: " + err.message + "</p>";
            console.error("[AR:overlay] revision.md fetch error:", err);
        });
}

function markdownToHtml(md) {
    var lines = md.split(/\r?\n/);
    var html = "";
    var inTable = false;
    var inList = false;
    var inBlockquote = false;
    var tableHtml = "";

    function closeList() {
        if (inList) { html += "</ul>"; inList = false; }
    }
    function closeBlockquote() {
        if (inBlockquote) { html += "</blockquote>"; inBlockquote = false; }
    }
    function closeTable() {
        if (inTable) { html += tableHtml + "</tbody></table>"; inTable = false; tableHtml = ""; }
    }
    function inline(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/`(.+?)`/g, "<code>$1</code>");
    }

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Heading
        if (/^### (.+)/.test(line)) { closeList(); closeBlockquote(); closeTable(); html += "<h3>" + inline(line.slice(4)) + "</h3>"; continue; }
        if (/^## (.+)/.test(line))  { closeList(); closeBlockquote(); closeTable(); html += "<h2>" + inline(line.slice(3)) + "</h2>"; continue; }
        if (/^# (.+)/.test(line))   { closeList(); closeBlockquote(); closeTable(); html += "<h1>" + inline(line.slice(2)) + "</h1>"; continue; }

        // HR
        if (/^---+$/.test(line.trim())) { closeList(); closeBlockquote(); closeTable(); html += "<hr>"; continue; }

        // Blockquote
        if (/^>/.test(line)) {
            closeList(); closeTable();
            if (!inBlockquote) { html += "<blockquote>"; inBlockquote = true; }
            html += "<p>" + inline(line.replace(/^>\s?/, "")) + "</p>";
            continue;
        } else {
            closeBlockquote();
        }

        // Table row
        if (/^\|/.test(line)) {
            var cells = line.split("|").slice(1, -1).map(function(c) { return c.trim(); });
            if (/^[\s|:-]+$/.test(line.replace(/[^|\-: ]/g, ""))) {
                // separator row — skip
                continue;
            }
            if (!inTable) {
                closeList();
                html += '<table class="ar-md-table"><thead><tr>';
                cells.forEach(function(c) { html += "<th>" + inline(c) + "</th>"; });
                html += "</tr></thead><tbody>";
                inTable = true;
                tableHtml = "";
            } else {
                tableHtml += "<tr>";
                cells.forEach(function(c) { tableHtml += "<td>" + inline(c) + "</td>"; });
                tableHtml += "</tr>";
            }
            continue;
        } else {
            closeTable();
        }

        // Ordered list (number.)
        if (/^\d+\.\s/.test(line)) {
            closeBlockquote();
            if (!inList) { html += "<ol>"; inList = true; }
            html += "<li>" + inline(line.replace(/^\d+\.\s+/, "")) + "</li>";
            continue;
        }

        // Unordered list
        if (/^[-*]\s/.test(line)) {
            closeBlockquote();
            if (!inList) { html += "<ul>"; inList = true; }
            html += "<li>" + inline(line.slice(2)) + "</li>";
            continue;
        }

        // Empty line
        if (!line.trim()) { closeList(); html += ""; continue; }

        // Paragraph
        closeList(); closeBlockquote();
        html += "<p>" + inline(line) + "</p>";
    }

    closeList(); closeBlockquote(); closeTable();
    return html;
}

// ── Destroy ───────────────────────────────────────────────────────────────────
function destroyReader() {
    console.log("[AR:overlay] destroyReader() — tearing down all AR elements");
    ["ar-overlay", "ar-toolbar", "ar-peek-bar", "ar-dropzone", "ar-review-modal", "ar-settings-panel"]
        .forEach(id => document.getElementById(id)?.remove());
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    chrome.storage.local.remove("ar_session_" + location.href);
    window.__arActive = false;
}

function escHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Settings panel controller ─────────────────────────────────────────────────
function initSettingsPanel(panel, overlay, column) {
    const settingsBtn = document.getElementById("ar-settings-btn");
    const darkToggle  = panel.querySelector("#ar-dark-toggle");
    const fontSelect  = panel.querySelector("#ar-font-select");

    // ── Toggle panel open/closed ──────────────────────────────────────────────
    settingsBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        var isOpen = panel.classList.toggle("ar-visible");
        if (isOpen) {
            chrome.storage.sync.get(["arDarkMode", "arFontFamily"], function(prefs) {
                darkToggle.checked = !!prefs.arDarkMode;
                fontSelect.value   = prefs.arFontFamily || "";
            });
        }
        console.log("[AR:overlay] Settings panel", isOpen ? "opened" : "closed");
    });

    // ── Close on outside click ────────────────────────────────────────────────
    document.addEventListener("click", function(e) {
        if (!panel.contains(e.target) && e.target !== settingsBtn) {
            panel.classList.remove("ar-visible");
        }
    });

    // ── Dark mode toggle ──────────────────────────────────────────────────────
    darkToggle.addEventListener("change", function() {
        var isDark = darkToggle.checked;
        chrome.storage.sync.set({ arDarkMode: isDark });
        if (isDark) {
            overlay.dataset.arDark = "1";
            overlay.style.transition = "background-color 0.45s ease, color 0.45s ease";
        } else {
            delete overlay.dataset.arDark;
            overlay.style.transition = "background-color 0.45s ease";
            overlay.style.backgroundColor = "";
            overlay.style.color = "";
            column.style.color = "";
        }
        console.log("[AR:overlay] Dark mode:", isDark);
    });

    // ── Font family selector ──────────────────────────────────────────────────
    var googleFonts = {
        "'Inter', sans-serif":     "Inter",
        "'Merriweather', serif":   "Merriweather",
        "'Roboto', sans-serif":    "Roboto",
        "'Open Sans', sans-serif": "Open+Sans",
        "'Lato', sans-serif":      "Lato",
        "'Nunito', sans-serif":    "Nunito",
        "'Source Serif 4', serif": "Source+Serif+4"
    };

    function applyFont(font) {
        column.style.fontFamily = font || "";
        var fontName = googleFonts[font];
        if (fontName && !document.getElementById("ar-gfont-" + fontName)) {
            var link = document.createElement("link");
            link.id   = "ar-gfont-" + fontName;
            link.rel  = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=" + fontName + ":wght@400;700&display=swap";
            document.head.appendChild(link);
            console.log("[AR:overlay] Loaded Google Font:", fontName);
        }
    }

    fontSelect.addEventListener("change", function() {
        var font = fontSelect.value;
        chrome.storage.sync.set({ arFontFamily: font });
        applyFont(font);
        console.log("[AR:overlay] Font changed to:", font || "default");
    });

    // ── Restore saved prefs immediately ──────────────────────────────────────
    chrome.storage.sync.get(["arDarkMode", "arFontFamily"], function(prefs) {
        if (prefs.arDarkMode) {
            overlay.dataset.arDark = "1";
            darkToggle.checked = true;
            console.log("[AR:overlay] Dark mode restored");
        }
        if (prefs.arFontFamily) {
            fontSelect.value = prefs.arFontFamily;
            applyFont(prefs.arFontFamily);
            console.log("[AR:overlay] Font restored:", prefs.arFontFamily);
        }
    });
}