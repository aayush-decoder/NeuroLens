const WEBAPP_BASE = "https://aleta-stairless-nguyet.ngrok-free.dev";

const authSection    = document.getElementById("auth-section");
const mainSection    = document.getElementById("main-section");
const userInfoEl     = document.getElementById("user-info");
const langSelect     = document.getElementById("language");
const fontSelect     = document.getElementById("font-family");
const darkToggle     = document.getElementById("dark-mode-toggle");

// Status element — one per section; get the visible one
function getStatusEl() {
    return (mainSection.style.display === "none")
        ? document.querySelector("#auth-section #status")
        : document.querySelector("#main-section #status");
}

function setStatus(msg, type = "") {
    const el = getStatusEl();
    if (!el) return;
    el.textContent = msg;
    el.className = type; // "error" | "ok" | ""
}

// ── Dark mode helpers ──────────────────────────────────────────────────────────
function applyPopupDark(isDark) {
    document.body.classList.toggle("dark", isDark);
}

// ── Boot: check stored session ────────────────────────────────────────────────
chrome.storage.local.get(["ar_token", "ar_user"], (data) => {
    if (data.ar_token && data.ar_user) {
        showMain(data.ar_user);
    } else {
        showAuth();
    }
});

// Load visual prefs regardless of auth state
chrome.storage.sync.get(["arDarkMode", "arFontFamily", "language"], (prefs) => {
    if (prefs.arDarkMode) {
        darkToggle.checked = true;
        applyPopupDark(true);
    }
    if (prefs.arFontFamily) {
        fontSelect.value = prefs.arFontFamily;
    }
    if (prefs.language) {
        langSelect.value = prefs.language;
    }
});

function showAuth() {
    authSection.style.display = "block";
    mainSection.style.display = "none";
}

function showMain(user) {
    authSection.style.display = "none";
    mainSection.style.display = "block";
    userInfoEl.textContent = "Signed in as " + (user.email || "");
}

// ── Dark mode toggle ──────────────────────────────────────────────────────────
darkToggle.addEventListener("change", () => {
    const isDark = darkToggle.checked;
    applyPopupDark(isDark);
    chrome.storage.sync.set({ arDarkMode: isDark });
    console.log("[AR:popup] Dark mode →", isDark);
});

// ── Font family change ────────────────────────────────────────────────────────
fontSelect.addEventListener("change", () => {
    const font = fontSelect.value;
    chrome.storage.sync.set({ arFontFamily: font });
    console.log("[AR:popup] Font family →", font);
});

// ── Language change ───────────────────────────────────────────────────────────
langSelect.addEventListener("change", () => {
    chrome.storage.sync.set({ language: langSelect.value });
});

// ── Auth: sign in or auto-register via /api/auth/extension ───────────────────
document.getElementById("btn-auth").addEventListener("click", async () => {
    const email    = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!email || !password) {
        setStatus("Email and password required.", "error");
        return;
    }

    const btn = document.getElementById("btn-auth");
    btn.disabled = true;
    setStatus("Signing in…");

    try {
        // 1. Try login first
        let res = await fetch(`${WEBAPP_BASE}/api/auth/extension/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        // 2. User not found → auto-register
        if (res.status === 401) {
            const err = await res.json();
            const msg = (err.error || "").toLowerCase();
            if (msg.includes("not found")) {
                setStatus("New account? Registering…");
                const username = email.split("@")[0].replace(/[^a-z0-9_]/gi, "_");
                res = await fetch(`${WEBAPP_BASE}/api/auth/extension/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, username })
                });
            }
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const user = { email: data.email, username: data.username, user_id: data.user_id };

        await chrome.storage.local.set({ ar_token: data.access_token, ar_user: user });
        setStatus("", "ok");
        showMain(user);

    } catch (e) {
        setStatus(e.message, "error");
    } finally {
        btn.disabled = false;
    }
});

// ── Sign out ──────────────────────────────────────────────────────────────────
document.getElementById("btn-logout").addEventListener("click", async () => {
    await chrome.storage.local.remove(["ar_token", "ar_user"]);
    setStatus("");
    showAuth();
});

// ── Activate reader ───────────────────────────────────────────────────────────
document.getElementById("activate").addEventListener("click", async () => {
    const language   = langSelect.value;
    const fontFamily = fontSelect.value;
    const darkMode   = darkToggle.checked;

    // Persist all prefs before injecting
    await chrome.storage.sync.set({ language, arFontFamily: fontFamily, arDarkMode: darkMode });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ["content/overlay.css"]
        });

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

        setStatus("Reader activated!", "ok");
        setTimeout(() => window.close(), 700);
    } catch (err) {
        setStatus("Error: " + err.message, "error");
    }
});
