const frame = document.getElementById("ntp-frame") as HTMLIFrameElement | null;

if (frame) {
    frame.addEventListener("load", () => {
        try {
            frame.contentWindow?.focus?.();
        } catch {
            // Cross-origin, expected
        }
    });

    // Forward keyboard events to iframe when possible
    document.addEventListener("keydown", (e) => {
        if (document.activeElement === frame) return;
        frame.focus();
    });

    // Auto-focus iframe on page load
    requestAnimationFrame(() => {
        frame.focus();
    });
}

