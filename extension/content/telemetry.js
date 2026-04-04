function initTelemetry(container) {
    window._arDwellMap = window._arDwellMap || {};
    window._arRescrollMap = window._arRescrollMap || {};
    window._arStruggledParagraphs = window._arStruggledParagraphs || [];
    window._arAdaptingSet = window._arAdaptingSet || new Set(); // prevent double-calls

    const entryTimes = {};

    /* ── IntersectionObserver: paragraph dwell ── */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const idx = entry.target.dataset.index;
            if (!idx) return;

            if (entry.isIntersecting) {
                entryTimes[idx] = Date.now();
            } else {
                if (entryTimes[idx]) {
                    const dwell = Date.now() - entryTimes[idx];
                    window._arDwellMap[idx] = (window._arDwellMap[idx] || 0) + dwell;
                    delete entryTimes[idx];
                    checkStruggle(idx);
                }
            }
        });
    }, { root: container, threshold: 0.6 });

    function observeAll() {
        document.querySelectorAll("#ar-column p").forEach(p => observer.observe(p));
    }
    observeAll();
    window._arObserveParagraphs = observeAll;

    /* ── Scroll: re-scroll detection ── */
    let lastY = container.scrollTop;

    container.addEventListener("scroll", () => {
        const y = container.scrollTop;

        if (y < lastY - 40) {
            // Meaningful upward scroll — find topmost visible paragraph
            const para = getTopmostVisible(container);
            if (para) {
                const idx = para.dataset.index;
                window._arRescrollMap[idx] = (window._arRescrollMap[idx] || 0) + 1;
                checkStruggle(idx);
            }
        }

        lastY = y;
        if (typeof savePersistence === "function") savePersistence();
    });

    /* ── Struggle check ── */
    function checkStruggle(idx) {
        const para = document.querySelector(`#ar-column p[data-index="${idx}"]`);
        if (!para) return;
        if (para.classList.contains("ar-adapted")) return;
        if (window._arAdaptingSet.has(idx)) return;

        const dwell = window._arDwellMap[idx] || 0;
        const rescroll = window._arRescrollMap[idx] || 0;

        // Struggle = lingering (>8s) OR scrolled back up 2+ times
        if (dwell > 8000 || rescroll >= 2) {
            window._arAdaptingSet.add(idx);
            triggerAdaptation(para, idx);
        }
    }
}

/* ─────────────────────────────────────────
   ADAPTATION — calls background → Claude
───────────────────────────────────────── */
function triggerAdaptation(para, idx) {
    const originalText = para.textContent.trim();

    // Visual "thinking" state
    para.style.opacity = "0.55";
    para.style.transition = "opacity 0.4s";

    chrome.storage.sync.get("language", (data) => {
        chrome.runtime.sendMessage(
            {
                type: "ADAPT_PARAGRAPH",
                text: originalText,
                language: data.language || ""
            },
            (res) => {
                if (chrome.runtime.lastError || !res) {
                    para.style.opacity = "1";
                    window._arAdaptingSet.delete(idx);
                    return;
                }

                if (res.adapted) {
                    // Render rich HTML with highlighted definitions + acronyms
                    para.innerHTML = res.adapted;   // background.js returns safe HTML string
                    para.classList.add("ar-adapted");
                    para.style.opacity = "1";

                    // Track for review sheet
                    if (!window._arStruggledParagraphs.find(p => p.index === idx)) {
                        window._arStruggledParagraphs.push({ index: idx, text: originalText });
                    }

                    if (typeof savePersistence === "function") savePersistence();
                } else {
                    para.style.opacity = "1";
                    window._arAdaptingSet.delete(idx);
                }
            }
        );
    });
}

function getTopmostVisible(container) {
    const top = container.getBoundingClientRect().top;
    return Array.from(document.querySelectorAll("#ar-column p"))
        .find(p => p.getBoundingClientRect().top >= top);
}