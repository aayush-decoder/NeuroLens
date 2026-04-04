if (document.getElementById("ar-overlay")) {
    // Already injected — do nothing
} else {
    initAdaptiveReader();
}

function initAdaptiveReader() {
    // Extract page text into paragraphs
    const pageParas = Array.from(document.querySelectorAll("p, article p, .content p"))
        .filter(el => el.innerText.trim().length > 80)
        .map(el => el.innerText.trim());

    // Build overlay
    const overlay = document.createElement("div");
    overlay.id = "ar-overlay";

    const column = document.createElement("div");
    column.id = "ar-column";
    overlay.appendChild(column);

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.id = "ar-toolbar";
    toolbar.innerHTML = `
    <button class="ar-btn" id="ar-upload-btn">↑ Upload</button>
    <button class="ar-btn" id="ar-end-btn">✓ End</button>
  `;
    document.body.appendChild(toolbar);

    // Dropzone
    const dropzone = document.createElement("div");
    dropzone.id = "ar-dropzone";
    dropzone.textContent = "Drop .txt or .md file to read";
    document.body.appendChild(dropzone);

    // Review modal
    const reviewModal = document.createElement("div");
    reviewModal.id = "ar-review-modal";
    reviewModal.innerHTML = `<div id="ar-review-inner"><h2>Review Sheet</h2><div id="ar-review-content">Generating…</div></div>`;
    document.body.appendChild(reviewModal);
    reviewModal.querySelector("#ar-review-inner").addEventListener("click", e => e.stopPropagation());
    reviewModal.addEventListener("click", () => reviewModal.style.display = "none");

    // Inject paragraphs
    window._arParagraphs = pageParas;
    renderParagraphs(column, pageParas);

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Wire up modules (defined in other content scripts)
    window._arColumn = column;
    window._arOverlay = overlay;

    initTelemetry(overlay);
    initEyeStrain(overlay, column);
    initFileLoader(dropzone, column, document.getElementById("ar-upload-btn"));
    initPersistence(overlay, column);

    // Toolbar hide logic
    let hideTimer;
    const resetHide = () => {
        toolbar.classList.remove("hidden");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => toolbar.classList.add("hidden"), 2500);
    };
    overlay.addEventListener("mousemove", resetHide);
    overlay.addEventListener("scroll", resetHide);
    resetHide();

    document.getElementById("ar-end-btn").addEventListener("click", () => {
        endSession(reviewModal);
    });
}

function renderParagraphs(column, paras) {
    column.innerHTML = "";
    paras.forEach((text, i) => {
        const p = document.createElement("p");
        p.textContent = text;
        p.dataset.index = i;
        column.appendChild(p);
    });
}

function endSession(reviewModal) {
    const struggled = window._arStruggledParagraphs || [];
    if (struggled.length === 0) {
        reviewModal.querySelector("#ar-review-content").innerHTML = "<p>No difficult paragraphs detected this session.</p>";
    } else {
        chrome.runtime.sendMessage(
            { type: "GENERATE_REVIEW", paragraphs: struggled.map(p => p.text) },
            (res) => {
                if (res.items && res.items.length) {
                    const rows = res.items.map(item =>
                        `<tr><td>${item.term}</td><td>${item.definition}</td></tr>`
                    ).join("");
                    reviewModal.querySelector("#ar-review-content").innerHTML =
                        `<table>${rows}</table>`;
                } else {
                    reviewModal.querySelector("#ar-review-content").innerHTML = "<p>Could not generate review sheet.</p>";
                }
            }
        );
    }
    reviewModal.style.display = "flex";
}