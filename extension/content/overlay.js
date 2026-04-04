// Guard against double-injection
if (window.__arActive) {
    // Already running — just un-peek if in peek mode
    const bar = document.getElementById("ar-peek-bar");
    if (bar?.classList.contains("ar-visible")) resumeFromPeek();
} else {
    window.__arActive = true;
    initAdaptiveReader();
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
function initAdaptiveReader() {
    const pageParas = extractPageParagraphs();

    buildDOM(pageParas);

    // Hide original page scroll (overlay covers it)
    document.documentElement.style.overflow = "hidden";

    const overlay = document.getElementById("ar-overlay");
    const column = document.getElementById("ar-column");

    // Expose globals for other modules
    window._arOverlay = overlay;
    window._arColumn = column;
    window._arParagraphs = pageParas;
    window._arStruggledParagraphs = [];

    // Boot modules
    initPersistence(overlay, column);
    initTelemetry(overlay);
    initEyeStrain(overlay, column);
    initFileLoader(
        document.getElementById("ar-dropzone"),
        column,
        document.getElementById("ar-upload-btn")
    );

    // Toolbar auto-hide
    setupToolbarAutoHide();

    // Keyboard shortcut: Esc → peek
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const bar = document.getElementById("ar-peek-bar");
            if (bar.classList.contains("ar-visible")) {
                resumeFromPeek();
            } else {
                enterPeekMode();
            }
        }
    });

    // Wire buttons
    document.getElementById("ar-peek-btn")
        .addEventListener("click", enterPeekMode);
    document.getElementById("ar-end-btn")
        .addEventListener("click", endSession);

    // Keep progress bar updated while reading
    overlay.addEventListener("scroll", updatePeekProgress);
}

/* ─────────────────────────────────────────
   DOM CONSTRUCTION
───────────────────────────────────────── */
function buildDOM(pageParas) {
    // Overlay + column
    const overlay = el("div", { id: "ar-overlay" });
    const column = el("div", { id: "ar-column" });
    overlay.appendChild(column);
    document.body.appendChild(overlay);

    renderParagraphs(column, pageParas);

    // Toolbar
    const toolbar = el("div", { id: "ar-toolbar" });
    toolbar.innerHTML = `
    <span id="ar-session-clock" style="font-size:11px;font-family:sans-serif;color:#888;margin-right:4px"></span>
    <button class="ar-btn" id="ar-upload-btn">↑ File</button>
    <button class="ar-btn" id="ar-end-btn">Review &amp; End</button>
    <button class="ar-btn" id="ar-peek-btn">Peek&nbsp;(Esc)</button>
  `;
    document.body.appendChild(toolbar);

    // Peek bar
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

    // Dropzone
    const dz = el("div", { id: "ar-dropzone" });
    dz.textContent = "Drop .txt or .md to load into reader";
    document.body.appendChild(dz);

    // Review modal
    const modal = el("div", { id: "ar-review-modal" });
    modal.innerHTML = `
    <div id="ar-review-inner">
      <button class="ar-modal-close" id="ar-modal-close">✕</button>
      <h2>Session Review Sheet</h2>
      <div id="ar-review-content">Generating…</div>
      <div style="margin-top:20px;text-align:right">
        <button class="ar-btn" id="ar-destroy-btn"
          style="background:#fff0f0;border-color:#ffcdd2;color:#c62828">
          End &amp; Close Reader
        </button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);

    modal.querySelector("#ar-modal-close")
        .addEventListener("click", () => modal.classList.remove("ar-visible"));
    modal.querySelector("#ar-destroy-btn")
        .addEventListener("click", destroyReader);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("ar-visible");
    });

    // Session clock tick
    setInterval(updateSessionClock, 30000);
    updateSessionClock();
}

function el(tag, attrs = {}) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => (e[k] = v));
    return e;
}

/* ─────────────────────────────────────────
   PARAGRAPH RENDERING
───────────────────────────────────────── */
function renderParagraphs(column, paras) {
    column.innerHTML = "";
    paras.forEach((text, i) => {
        const p = document.createElement("p");
        p.textContent = text;
        p.dataset.index = i;
        column.appendChild(p);
    });
}

function extractPageParagraphs() {
    const candidates = Array.from(
        document.querySelectorAll("p, article p, main p, .post-content p, .entry-content p")
    );
    const seen = new Set();
    return candidates
        .filter(el => {
            const t = el.innerText.trim();
            if (t.length < 80 || seen.has(t)) return false;
            seen.add(t);
            return true;
        })
        .map(el => el.innerText.trim());
}

/* ─────────────────────────────────────────
   PEEK MODE — overlay slides to bookmark bar
───────────────────────────────────────── */
function enterPeekMode() {
    const overlay = document.getElementById("ar-overlay");
    const bar = document.getElementById("ar-peek-bar");
    const toolbar = document.getElementById("ar-toolbar");

    // Save scroll before hiding
    window._arSavedScroll = overlay.scrollTop;

    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    toolbar.style.display = "none";

    // Restore page scroll so user can navigate
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    bar.classList.add("ar-visible");
    updatePeekProgress();
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

    // Restore exact scroll position
    if (window._arSavedScroll != null) {
        overlay.scrollTop = window._arSavedScroll;
    }
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

/* ─────────────────────────────────────────
   TOOLBAR AUTO-HIDE
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   SESSION CLOCK
───────────────────────────────────────── */
function updateSessionClock() {
    const el = document.getElementById("ar-session-clock");
    if (!el || !window._arSessionStart) return;
    const mins = Math.floor((Date.now() - window._arSessionStart) / 60000);
    el.textContent = mins < 1 ? "" : `${mins}m`;
}

/* ─────────────────────────────────────────
   END SESSION → REVIEW SHEET
───────────────────────────────────────── */
function endSession() {
    // If currently in peek mode, close the bar first
    const bar = document.getElementById("ar-peek-bar");
    if (bar?.classList.contains("ar-visible")) resumeFromPeek();

    const modal = document.getElementById("ar-review-modal");
    const content = document.getElementById("ar-review-content");
    const struggled = window._arStruggledParagraphs || [];

    modal.classList.add("ar-visible");

    if (struggled.length === 0) {
        content.innerHTML = "<p style='color:#666;font-size:14px'>No difficult passages detected this session. Great reading!</p>";
        return;
    }

    content.innerHTML = "<p style='color:#999;font-size:13px'>Generating review sheet…</p>";

    chrome.runtime.sendMessage(
        { type: "GENERATE_REVIEW", paragraphs: struggled.map(p => p.text) },
        (res) => {
            if (res?.items?.length) {
                const rows = res.items
                    .map(item => `<tr><td>${escHtml(item.term)}</td><td>${escHtml(item.definition)}</td></tr>`)
                    .join("");
                content.innerHTML = `<table>${rows}</table>`;
            } else {
                content.innerHTML = "<p style='color:#999;font-size:13px'>Could not generate review sheet.</p>";
            }
        }
    );
}

/* ─────────────────────────────────────────
   DESTROY — full teardown, restore page
───────────────────────────────────────── */
function destroyReader() {
    // Remove all injected elements
    ["ar-overlay", "ar-toolbar", "ar-peek-bar",
        "ar-dropzone", "ar-review-modal"]
        .forEach(id => document.getElementById(id)?.remove());

    // Restore page scroll
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    // Clear session storage
    chrome.storage.local.remove("ar_state_" + location.href);

    window.__arActive = false;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}