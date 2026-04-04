function initEyeStrain(overlay, column) {
    const sessionStart = Date.now();

    const profiles = [
        { maxMin: 15, bg: "#ffffff", fontWeight: "400", lineHeight: "1.6" },
        { maxMin: 30, bg: "#fdf6e3", fontWeight: "400", lineHeight: "1.7" },
        { maxMin: 60, bg: "#f5efe0", fontWeight: "300", lineHeight: "1.85" },
        { maxMin: Infinity, bg: "#ede8d5", fontWeight: "300", lineHeight: "2.0" }
    ];

    function applyProfile() {
        const elapsedMin = (Date.now() - sessionStart) / 60000;
        const profile = profiles.find(p => elapsedMin < p.maxMin);
        overlay.style.background = profile.bg;
        column.style.fontWeight = profile.fontWeight;
        column.style.lineHeight = profile.lineHeight;
    }

    applyProfile();
    setInterval(applyProfile, 5 * 60 * 1000); // check every 5 minutes
}