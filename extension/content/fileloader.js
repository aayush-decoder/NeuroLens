function initFileLoader(dropzone, column, uploadBtn) {
    const overlay = document.getElementById("ar-overlay");

    function processFile(file) {
        if (!file) return;
        if (!file.name.match(/\.(txt|md)$/i)) {
            alert("Only .txt or .md files are supported.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            let text = e.target.result;

            if (file.name.endsWith(".md")) {
                // Strip markdown formatting
                text = text
                    .replace(/^#{1,6}\s+/gm, "")          // headings
                    .replace(/\*\*(.+?)\*\*/g, "$1")       // bold
                    .replace(/\*(.+?)\*/g, "$1")           // italic
                    .replace(/_(.+?)_/g, "$1")             // underscores
                    .replace(/`{1,3}[^`]*`{1,3}/g, "")    // code
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
                    .replace(/^[-*+]\s+/gm, "")            // bullets
                    .replace(/^\d+\.\s+/gm, "");           // numbered lists
            }

            const paragraphs = text.split(/\n\n+/)
                .map(p => p.replace(/\n/g, " ").trim())
                .filter(p => p.length > 30);

            window._arParagraphs = paragraphs;
            renderParagraphs(column, paragraphs);
            if (window._arObserveParagraphs) window._arObserveParagraphs();
            dropzone.style.display = "none";
        };
        reader.readAsText(file);
    }

    // Drag & drop on the overlay
    overlay.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.display = "flex";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.display = "none";
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        processFile(e.dataTransfer.files[0]);
    });

    // Click-to-upload button
    uploadBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt,.md";
        input.onchange = () => processFile(input.files[0]);
        input.click();
    });
}