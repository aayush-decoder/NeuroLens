const WEBAPP_BASE = "https://aleta-stairless-nguyet.ngrok-free.dev";   // webapp (Next.js) — auth
const BACKEND_BASE = "https://aleta-stairless-nguyet.ngrok-free.dev"; // extension-backend — adapt/session/etc.

const authSection = document.getElementById("auth-section");
const mainSection = document.getElementById("main-section");
const statusEl = document.getElementById("status");
const userInfoEl = document.getElementById("user-info");
const langSelect = document.getElementById("language");

function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.className = isError ? "error" : "";
}

// ── Boot: check if already logged in ─────────────────────────────────────────
chrome.storage.local.get(["ar_token", "ar_user"], (data) => {
    if (data.ar_token && data.ar_user) {
        showMain(data.ar_user);
    } else {
        showAuth();
    }
});

function showAuth() {
    authSection.style.display = "block";
    mainSection.style.display = "none";
}

function showMain(user) {
    authSection.style.display = "none";
    mainSection.style.display = "block";
    userInfoEl.textContent = `Signed in as ${user.email}`;
    chrome.storage.sync.get(["language"], (d) => {
        if (d.language) langSelect.value = d.language;
    });
}

// ── Auth: sign in or auto-register via webapp Postgres ───────────────────────
document.getElementById("btn-auth").addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!email || !password) {
        setStatus("Email and password required.", true);
        return;
    }

    const btn = document.getElementById("btn-auth");
    btn.disabled = true;
    setStatus("Signing in…");

    try {
        // 1. Try login against webapp Postgres
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
        setStatus("");
        showMain(user);

    } catch (e) {
        setStatus(e.message, true);
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
    const language = langSelect.value;
    await chrome.storage.sync.set({ language });

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

        setStatus("Reader activated!");
        setTimeout(() => window.close(), 700);
    } catch (err) {
        setStatus("Error: " + err.message, true);
    }
});
