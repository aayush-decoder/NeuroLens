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
    <button class="ar-btn" id="ar-upload-btn">↑ File</button>
    <button class="ar-btn" id="ar-end-btn">Review &amp; End</button>
    <button class="ar-btn" id="ar-peek-btn">Peek&nbsp;(Esc)</button>
  `;
    document.body.appendChild(toolbar);

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
    modal.querySelector("#ar-modal-close").addEventListener("click", () => modal.classList.remove("ar-visible"));
    modal.querySelector("#ar-destroy-btn").addEventListener("click", destroyReader);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("ar-visible"); });

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

// ── End Session → Review sheet ────────────────────────────────────────────────
function endSession() {
    const bar = document.getElementById("ar-peek-bar");
    if (bar?.classList.contains("ar-visible")) resumeFromPeek();

    const modal = document.getElementById("ar-review-modal");
    const content = document.getElementById("ar-review-content");
    const struggled = window._arStruggledParagraphs || [];

    modal.classList.add("ar-visible");

    const elapsedMin = (Date.now() - window._arSessionStart) / 60000;
    console.log(
        "[AR:overlay] endSession() called.",
        `Struggled paragraphs: ${struggled.length},`,
        `elapsed: ${elapsedMin.toFixed(2)} min`
    );

    // Fire session_ended telemetry
    chrome.runtime.sendMessage({
        type: "TELEMETRY",
        session_id: window._arSessionId,
        url: location.href,
        event: "session_ended",
        session_elapsed_min: elapsedMin
    });

    if (struggled.length === 0) {
        content.innerHTML = "<p style='color:#666;font-size:14px'>No difficult passages detected this session.</p>";
        return;
    }

    content.innerHTML = "<p style='color:#999;font-size:13px'>Generating review sheet…</p>";

    chrome.storage.sync.get("language", (d) => {
        chrome.runtime.sendMessage(
            {
                type: "GENERATE_REVIEW",
                session_id: window._arSessionId,
                paragraphs: struggled.map(p => ({
                    index: p.index,
                    text: p.text,
                    dwell_ms: p.dwell_ms || window._arDwellMap[p.index] || 0,
                    rescroll_count: p.rescroll_count || window._arRescrollMap[p.index] || 0
                })),
                language: d.language || null
            },
            (res) => {
                console.log("[AR:overlay] Review sheet response:", res);
                if (res?.items?.length) {
                    const rows = res.items.map(item => `
            <tr>
              <td>${escHtml(item.term)}</td>
              <td>
                ${escHtml(item.definition)}
                ${item.esl_equiv ? `<br><em style="color:#1565c0;font-size:0.9em">${escHtml(item.esl_equiv)}</em>` : ""}
              </td>
            </tr>`).join("");
                    content.innerHTML = `<table>${rows}</table>`;
                } else {
                    content.innerHTML = "<p style='color:#999;font-size:13px'>Could not generate review sheet.</p>";
                }
            }
        );
    });
}

// ── Destroy ───────────────────────────────────────────────────────────────────
function destroyReader() {
    console.log("[AR:overlay] destroyReader() — tearing down all AR elements");
    ["ar-overlay", "ar-toolbar", "ar-peek-bar", "ar-dropzone", "ar-review-modal"]
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