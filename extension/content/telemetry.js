function initTelemetry(container) {
    window._arDwellMap = {};       // { paragraphIndex: totalDwellMs }
    window._arRescrollMap = {};    // { paragraphIndex: count }
    window._arStruggledParagraphs = [];

    let lastScrollY = container.scrollTop;
    let lastScrollTime = Date.now();
    let paragraphEntryTimes = {};

    // Paragraph dwell via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const idx = entry.target.dataset.index;
            if (!idx) return;
            if (entry.isIntersecting) {
                paragraphEntryTimes[idx] = Date.now();
            } else {
                if (paragraphEntryTimes[idx]) {
                    const dwell = Date.now() - paragraphEntryTimes[idx];
                    window._arDwellMap[idx] = (window._arDwellMap[idx] || 0) + dwell;
                    delete paragraphEntryTimes[idx];
                    checkStruggle(idx);
                }
            }
        });
    }, { root: container, threshold: 0.5 });

    const observeParagraphs = () => {
        document.querySelectorAll("#ar-column p").forEach(p => observer.observe(p));
    };
    observeParagraphs();
    window._arObserveParagraphs = observeParagraphs;

    // Re-scroll detection
    container.addEventListener("scroll", () => {
        const now = Date.now();
        const currentY = container.scrollTop;
        const velocity = (currentY - lastScrollY) / (now - lastScrollTime);

        if (currentY < lastScrollY) {
            // User scrolled up — find visible paragraph and increment re-scroll
            const visiblePara = getTopmostVisibleParagraph(container);
            if (visiblePara) {
                const idx = visiblePara.dataset.index;
                window._arRescrollMap[idx] = (window._arRescrollMap[idx] || 0) + 1;
                checkStruggle(idx);
            }
        }

        lastScrollY = currentY;
        lastScrollTime = now;
        savePersistence();
    });

    function getTopmostVisibleParagraph(container) {
        const containerRect = container.getBoundingClientRect();
        const paras = Array.from(document.querySelectorAll("#ar-column p"));
        return paras.find(p => {
            const r = p.getBoundingClientRect();
            return r.top >= containerRect.top && r.top < containerRect.bottom;
        });
    }

    function checkStruggle(idx) {
        const dwell = window._arDwellMap[idx] || 0;
        const rescrolls = window._arRescrollMap[idx] || 0;
        const para = document.querySelector(`#ar-column p[data-index="${idx}"]`);
        if (!para || para.classList.contains("ar-adapted")) return;

        const isStruggle = dwell > 8000 || rescrolls >= 2;
        if (isStruggle) {
            triggerAdaptation(para, idx);
        }
    }
}

function triggerAdaptation(para, idx) {
    const originalText = para.textContent;
    para.style.opacity = "0.5";

    chrome.storage.sync.get("language", (data) => {
        chrome.runtime.sendMessage(
            { type: "ADAPT_PARAGRAPH", text: originalText, language: data.language || "" },
            (res) => {
                if (res && res.adapted) {
                    para.textContent = res.adapted;
                    para.classList.add("ar-adapted");
                    para.style.opacity = "1";

                    // Track struggled paragraphs
                    window._arStruggledParagraphs = window._arStruggledParagraphs || [];
                    if (!window._arStruggledParagraphs.find(p => p.index === idx)) {
                        window._arStruggledParagraphs.push({ index: idx, text: originalText });
                    }

                    savePersistence();
                }
            }
        );
    });
}