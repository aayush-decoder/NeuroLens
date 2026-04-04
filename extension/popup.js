const keyInput = document.getElementById("apiKey");
const langSelect = document.getElementById("language");
const status = document.getElementById("status");

chrome.storage.sync.get(["apiKey", "language"], (data) => {
    if (data.apiKey) keyInput.value = data.apiKey;
    if (data.language) langSelect.value = data.language;
});

document.getElementById("activate").addEventListener("click", async () => {
    const apiKey = keyInput.value.trim();
    const language = langSelect.value;

    if (!apiKey) { status.textContent = "Please enter your API key."; return; }

    await chrome.storage.sync.set({ apiKey, language });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
            "content/persistence.js",
            "content/telemetry.js",
            "content/eyestrain.js",
            "content/fileloader.js",
            "content/overlay.js"
        ]
    });

    await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content/overlay.css"]
    });

    status.textContent = "Reader activated!";
    setTimeout(() => window.close(), 800);
});