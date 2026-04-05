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

    var modal   = document.getElementById("ar-review-modal");
    var content = document.getElementById("ar-review-content");
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

    // Extract text and fire SAVE_TO_BUCKET in background asynchronously
    setTimeout(async () => {
        try {
            var fullText = Array.from(document.querySelectorAll("#ar-column p"))
                .map(p => p.textContent)
                .join("\n\n");
            
            var conceptSvg = document.getElementById("ar-concept-graph")?.innerHTML || "";
            
            var mdResponse = await fetch(chrome.runtime.getURL("content/revision.md"));
            var revisionMarkdown = await mdResponse.text();

            chrome.runtime.sendMessage({
                type: "SAVE_TO_BUCKET",
                url: location.href,
                title: document.title,
                text: fullText,
                conceptSvg,
                revisionMarkdown
            }, (res) => {
                if (res?.error) console.error("[AR:overlay] SAVE_TO_BUCKET error:", res.error);
                else console.log("[AR:overlay] SAVE_TO_BUCKET success:", res);
            });
        } catch (e) {
            console.error("[AR:overlay] Failed to trigger bucket save:", e);
        }
    }, 1000);

    // ── Tab: Smart Review ──────────────────────────────────────────────────────
    if (struggled.length === 0) {
        content.innerHTML = "<p style='color:#777;font-size:14px;line-height:1.7'>" +
            "<strong>Hardcoded Session Review (Fallback):</strong><br><br>" +
            "<table>" +
            "<tr><td>sovereignty</td><td>Supreme power or authority<br><em style='color:#1565c0;font-size:0.9em'>सार्वभौमिकता</em></td></tr>" +
            "<tr><td>paramilitary</td><td>An unofficial force organized similarly to a military force<br><em style='color:#1565c0;font-size:0.9em'>अर्धसैनिक</em></td></tr>" +
            "<tr><td>intimidation</td><td>The action of frightening or threatening someone<br><em style='color:#1565c0;font-size:0.9em'>धमकाना</em></td></tr>" +
            "<tr><td>archipelago</td><td>A group of islands<br><em style='color:#1565c0;font-size:0.9em'>द्वीपसमूह</em></td></tr>" +
            "</table>" +
            "</p>";
    } else {
        content.innerHTML = "<p style='color:#aaa;font-size:13px'>Generating review...</p>";
        chrome.storage.sync.get("language", function(d) {
            chrome.runtime.sendMessage({
                type: "GENERATE_REVIEW",
                session_id: window._arSessionId,
                paragraphs: struggled.map(function(p) { return {
                    index: p.index,
                    text: p.text,
                    dwell_ms: p.dwell_ms || window._arDwellMap[p.index] || 0,
                    rescroll_count: p.rescroll_count || window._arRescrollMap[p.index] || 0
                }; }),
                language: d.language || null
            }, function(res) {
                if (res && res.items && res.items.length) {
                    var rows = res.items.map(function(item) {
                        return "<tr><td>" + escHtml(item.term) + "</td><td>" +
                            escHtml(item.definition) +
                            (item.esl_equiv ? "<br><em style='color:#1565c0;font-size:0.9em'>" + escHtml(item.esl_equiv) + "</em>" : "") +
                            "</td></tr>";
                    }).join("");
                    content.innerHTML = "<table>" + rows + "</table>";
                } else {
                    content.innerHTML = "<p style='color:#aaa;font-size:13px'>Could not generate review.</p>";
                }
            });
        });
    }

    // ── Tab: Concept Map ───────────────────────────────────────────────────────
    buildConceptGraph(document.getElementById("ar-concept-graph"));

    // ── Tab: Revision Sheet ────────────────────────────────────────────────────
    loadRevisionSheet(document.getElementById("ar-revision-content"));
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

    // Collect all words that were glossed during this session
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

    // Assign each glossed word to its primary category
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