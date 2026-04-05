/**
 * initEyeStrain(overlay, column)
 *
 * Timeline (from reader activation, not per-paragraph):
 *   0s     → apply dark mode + font family from prefs
 *   15s    → ambient warm background shift begins (light cream tint)
 *   30s    → line-height expands from 1.6 → 1.9 for easier reading
 *   60s+   → continued gradual warmth (over 60 min session)
 */
function initEyeStrain(overlay, column) {
    if (!window._arSessionStart) {
        window._arSessionStart = Date.now();
        console.log("[AR:eyestrain] No session start found, setting to now");
    }

    // ── Apply stored user preferences immediately ──────────────────────────────
    chrome.storage.sync.get(["arDarkMode", "arFontFamily"], (prefs) => {
        if (prefs.arDarkMode) {
            applyDarkMode(overlay, column);
        }
        if (prefs.arFontFamily) {
            column.style.fontFamily = prefs.arFontFamily;
            console.log("[AR:eyestrain] Font family applied:", prefs.arFontFamily);
        }
        console.log("[AR:eyestrain] Preferences applied:", prefs);
    });

    // Track whether warm / line-height phases have fired
    let warmPhaseApplied = false;
    let lineHeightPhaseApplied = false;
    let darkModeActive = false;

    // ── 15s: Ambient warm tint ────────────────────────────────────────────────
    setTimeout(() => {
        chrome.storage.sync.get(["arDarkMode"], (prefs) => {
            // Skip warm tint in dark mode (dark bg is already easy on eyes)
            if (prefs.arDarkMode) return;
            warmPhaseApplied = true;
            overlay.style.transition = "background-color 2.5s ease";
            overlay.style.backgroundColor = "#fdf8ee";  // very light warm cream
            console.log("[AR:eyestrain] 15s: ambient warm tint applied");
        });
    }, 15000);

    // ── 30s: Line-height expansion ────────────────────────────────────────────
    setTimeout(() => {
        lineHeightPhaseApplied = true;
        column.style.transition = "line-height 2s ease";
        column.style.lineHeight = "1.9";
        console.log("[AR:eyestrain] 30s: line-height expanded to 1.9");
    }, 30000);

    // ── Continuous warmth (over long sessions) ────────────────────────────────
    // Runs every minute, deepens warmth over a 60-minute session
    function applyContinuousWarmth() {
        chrome.storage.sync.get(["arDarkMode"], (prefs) => {
            if (prefs.arDarkMode) return; // Don't fight dark mode
            const mins = (Date.now() - window._arSessionStart) / 60000;
            const progress = Math.min(mins / 60, 1);
            if (progress < 0.1) return; // Let the 15s / 30s phase handle early stages

            // HSL: white → warm amber (#ede8d5)
            const hue   = 43;
            const sat   = Math.round(62 * progress);
            const light = Math.round(100 - (12 * progress));

            overlay.style.transition = "background-color 60s ease";
            overlay.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
            console.log(`[AR:eyestrain] Continuous warmth at ${mins.toFixed(1)}min → hsl(${hue},${sat}%,${light}%)`);
        });
    }

    // First continuous check at 2 minutes, then every minute
    setTimeout(() => {
        applyContinuousWarmth();
        setInterval(applyContinuousWarmth, 60 * 1000);
    }, 2 * 60 * 1000);

    console.log("[AR:eyestrain] Eye-strain monitor started (15s warm, 30s line-height).");
}

// ── Dark Mode ─────────────────────────────────────────────────────────────────
function applyDarkMode(overlay, column) {
    overlay.style.transition = "background-color 0.5s ease, color 0.5s ease";
    overlay.style.backgroundColor = "#121212";
    overlay.style.color = "#e0e0e0";
    column.style.color = "#e0e0e0";

    // Also update the toolbar + peek-bar if they exist
    const toolbar  = document.getElementById("ar-toolbar");
    const peekBar  = document.getElementById("ar-peek-bar");
    if (toolbar) toolbar.style.cssText += ";background:rgba(20,20,20,0.9);border-color:rgba(255,255,255,0.1)";
    if (peekBar) peekBar.style.cssText += ";background:rgba(18,18,18,0.97);border-color:rgba(255,255,255,0.08)";

    // Mark overlay so CSS can cascade
    overlay.dataset.arDark = "1";
    console.log("[AR:eyestrain] Dark mode applied");
}

function removeDarkMode(overlay, column) {
    overlay.style.transition = "background-color 0.5s ease, color 0.5s ease";
    overlay.style.backgroundColor = "#ffffff";
    overlay.style.color = "#1a1a1a";
    column.style.color = "";
    delete overlay.dataset.arDark;
    console.log("[AR:eyestrain] Dark mode removed");
}

// ── Public API (called from overlay.js when user toggles prefs) ───────────────
window._arApplyDarkMode   = applyDarkMode;
window._arRemoveDarkMode  = removeDarkMode;