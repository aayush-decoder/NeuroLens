// Session save/restore via backend + chrome.storage.local as fallback.

let _saveDebounce;

// ── saveSession ───────────────────────────────────────────────────────────────
function saveSession() {
    clearTimeout(_saveDebounce);
    _saveDebounce = setTimeout(_doSave, 2000);
}

async function _doSave() {
    const overlay = document.getElementById("ar-overlay");
    if (!overlay) return;

    const total = overlay.scrollHeight - overlay.clientHeight;
    const scrollPct = total > 0 ? (overlay.scrollTop / total) * 100 : 0;
    const elapsedMin = (Date.now() - (window._arSessionStart || Date.now())) / 60000;

    const adaptedIndices = Array.from(
        document.querySelectorAll("#ar-column p.ar-adapted")
    ).map(p => Number(p.dataset.index));

    const struggledIndices = (window._arStruggledParagraphs || []).map(p => p.index);

    const payload = {
        type: "SESSION_SAVE",
        session_id: window._arSessionId,
        url: location.href,
        scroll_pct: scrollPct,
        adapted_indices: adaptedIndices,
        struggled_indices: struggledIndices,
        dwell_map: window._arDwellMap || {},
        rescroll_map: window._arRescrollMap || {},
        session_elapsed_min: elapsedMin,
        language: window._arLanguage || null
    };

    console.log(
        "[AR:persistence] saveSession() →",
        `scroll=${scrollPct.toFixed(1)}%,`,
        `adapted=${adaptedIndices.length},`,
        `struggled=${struggledIndices.length},`,
        `elapsed=${elapsedMin.toFixed(2)}min`
    );

    // Also save to local storage as offline fallback
    chrome.storage.local.set({ ["ar_session_" + location.href]: payload });

    chrome.runtime.sendMessage(payload, (res) => {
        if (chrome.runtime.lastError) {
            console.warn("[AR:persistence] saveSession backend error:", chrome.runtime.lastError);
            return;
        }
        console.log("[AR:persistence] saveSession backend response:", res);
    });
}

// ── initPersistence ────────────────────────────────────────────────────────────
function initPersistence(overlay, column) {
    console.log("[AR:persistence] initPersistence() — attempting session restore for:", location.href);

    // Load language pref so saveSession can include it
    chrome.storage.sync.get("language", (d) => {
        window._arLanguage = d.language || null;
        console.log("[AR:persistence] Language pref loaded:", window._arLanguage);
    });

    chrome.runtime.sendMessage(
        { type: "SESSION_RESTORE", url: location.href },
        (res) => {
            if (chrome.runtime.lastError) {
                console.warn("[AR:persistence] restore message error:", chrome.runtime.lastError);
                _restoreFromLocal(overlay, column);
                return;
            }

            console.log("[AR:persistence] SESSION_RESTORE response:", res);

            if (res?.found) {
                applyRestoredSession(overlay, column, res);
            } else {
                console.log("[AR:persistence] No server session found, trying local storage");
                _restoreFromLocal(overlay, column);
            }
        }
    );
}

function applyRestoredSession(overlay, column, res) {
    console.log(
        "[AR:persistence] Restoring session:",
        `scroll_pct=${res.scroll_pct},`,
        `elapsed=${res.session_elapsed_min}min,`,
        `dwell keys=${Object.keys(res.dwell_map || {}).length}`
    );

    // Restore elapsed time (eye-strain phase needs this)
    if (res.session_elapsed_min) {
        const msElapsed = res.session_elapsed_min * 60 * 1000;
        window._arSessionStart = Date.now() - msElapsed;
        console.log("[AR:persistence] Session start backfilled, elapsed:", res.session_elapsed_min, "min");
    }

    window._arSessionId = res.session_id || window._arSessionId;
    window._arDwellMap = res.dwell_map || {};
    window._arRescrollMap = res.rescroll_map || {};

    // Restore scroll after a tick (DOM needs to be ready)
    if (res.scroll_pct > 0) {
        setTimeout(() => {
            const total = overlay.scrollHeight - overlay.clientHeight;
            overlay.scrollTop = (res.scroll_pct / 100) * total;
            console.log("[AR:persistence] Scroll restored to:", overlay.scrollTop, "px");
        }, 150);
    }

    // Note: server doesn't store adapted HTML — we'd need to re-call /adapt.
    // For now, paragraphs that were adapted show as original (acceptable for MVP).
    // To re-adapt, we'd call triggerAdaptation on each adapted_indices entry.
}

function _restoreFromLocal(overlay, column) {
    chrome.storage.local.get("ar_session_" + location.href, (data) => {
        const saved = data["ar_session_" + location.href];
        if (!saved) {
            console.log("[AR:persistence] No local session either. Fresh start.");
            window._arSessionStart = window._arSessionStart || Date.now();
            return;
        }

        console.log("[AR:persistence] Restoring from local storage:", saved);
        applyRestoredSession(overlay, column, {
            found: true,
            session_id: saved.session_id || window._arSessionId,
            scroll_pct: saved.scroll_pct || 0,
            dwell_map: saved.dwell_map || {},
            rescroll_map: saved.rescroll_map || {},
            session_elapsed_min: saved.session_elapsed_min || 0
        });
    });
}