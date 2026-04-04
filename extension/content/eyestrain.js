function initEyeStrain(overlay, column) {
    // Session start backfilled by persistence.js; fall back to now
    if (!window._arSessionStart) {
        window._arSessionStart = Date.now();
        console.log("[AR:eyestrain] No session start found, setting to now");
    }

    const phases = [
        { maxMin: 1, cls: "ar-phase-1", lineHeight: "1.60", fontWeight: "400", label: "Fresh (0-15min)" },
        { maxMin: 2, cls: "ar-phase-2", lineHeight: "1.72", fontWeight: "400", label: "Warm (15-30min)" },
        { maxMin: 3, cls: "ar-phase-3", lineHeight: "1.85", fontWeight: "300", label: "Tired (30-60min)" },
        { maxMin: 9999, cls: "ar-phase-4", lineHeight: "2.00", fontWeight: "300", label: "Fatigued (60min+)" }
    ];

    let currentPhase = null;

    function applyPhase() {
        const mins = (Date.now() - window._arSessionStart) / 60000;
        const phase = phases.find(p => mins < p.maxMin);

        if (phase.cls === currentPhase) return; // no change

        console.log(
            `[AR:eyestrain] Phase transition → ${phase.label}`,
            `(elapsed: ${mins.toFixed(2)} min)`,
            `lineHeight: ${phase.lineHeight}, fontWeight: ${phase.fontWeight}`
        );

        phases.forEach(p => overlay.classList.remove(p.cls));
        overlay.classList.add(phase.cls);
        column.style.lineHeight = phase.lineHeight;
        column.style.fontWeight = phase.fontWeight;
        currentPhase = phase.cls;
    }

    applyPhase();
    setInterval(applyPhase, 60 * 1000); // check every minute (not 5 — catches transitions faster)
    console.log("[AR:eyestrain] Eye-strain monitor started. Check interval: 60s");
}