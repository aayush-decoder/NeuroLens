function initEyeStrain(overlay, column) {
    // Session start is set by persistence.js first; fall back to now
    if (!window._arSessionStart) window._arSessionStart = Date.now();

    const phases = [
        { maxMin: 15, cls: "ar-phase-1", lineHeight: "1.60", fontWeight: "400" },
        { maxMin: 30, cls: "ar-phase-2", lineHeight: "1.72", fontWeight: "400" },
        { maxMin: 60, cls: "ar-phase-3", lineHeight: "1.85", fontWeight: "300" },
        { maxMin: 9999, cls: "ar-phase-4", lineHeight: "2.00", fontWeight: "300" }
    ];

    function applyPhase() {
        const mins = (Date.now() - window._arSessionStart) / 60000;
        const phase = phases.find(p => mins < p.maxMin);

        // Swap background phase class
        phases.forEach(p => overlay.classList.remove(p.cls));
        overlay.classList.add(phase.cls);

        // Smoothly adjust typography on the column
        column.style.lineHeight = phase.lineHeight;
        column.style.fontWeight = phase.fontWeight;
    }

    applyPhase();
    // Check every 5 minutes; CSS transitions do the smooth blending
    setInterval(applyPhase, 5 * 60 * 1000);
}