const STORAGE_KEY = "ar_state_" + location.href;
let _persistDebounce;

function savePersistence() {
    clearTimeout(_persistDebounce);
    _persistDebounce = setTimeout(() => {
        const overlay = document.getElementById("ar-overlay");
        if (!overlay) return;

        const adaptedParagraphs = Array.from(
            document.querySelectorAll("#ar-column p.ar-adapted")
        ).map(p => ({
            index: p.dataset.index,
            html: p.innerHTML
        }));

        const state = {
            scrollY: overlay.scrollTop,
            adaptedParagraphs,
            dwellMap: window._arDwellMap || {},
            rescrollMap: window._arRescrollMap || {},
            sessionStart: window._arSessionStart || Date.now()
        };

        chrome.storage.local.set({ [STORAGE_KEY]: state });
    }, 1000);
}

function initPersistence(overlay, column) {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
        const state = data[STORAGE_KEY];
        if (!state) {
            window._arSessionStart = Date.now();
            return;
        }

        window._arSessionStart = state.sessionStart || Date.now();
        window._arDwellMap = state.dwellMap || {};
        window._arRescrollMap = state.rescrollMap || {};

        // Restore scroll position
        setTimeout(() => { overlay.scrollTop = state.scrollY || 0; }, 100);

        // Restore adapted paragraphs
        if (state.adaptedParagraphs?.length) {
            state.adaptedParagraphs.forEach(({ index, html }) => {
                const p = document.querySelector(`#ar-column p[data-index="${index}"]`);
                if (p) {
                    p.innerHTML = html;
                    p.classList.add("ar-adapted");
                }
            });
        }
    });
}

// Expose globally so overlay.js scroll handler can call it
window.savePersistence = savePersistence;