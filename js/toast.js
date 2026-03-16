/**
 * Toast Notification System
 * @module toast
 * Provides success/error/warning/info toasts with auto-dismiss and progress bars.
 */

const ICONS = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

const TITLES = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
};

/**
 * Show a toast notification.
 * @param {string} message - The message to display.
 * @param {"success"|"error"|"warning"|"info"} type - Toast type.
 * @param {number} [duration=4000] - Auto-dismiss duration in ms.
 */
export function showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${ICONS[type]}</div>
        <div class="toast-body">
            <div class="toast-title">${TITLES[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;

    const close = () => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector(".toast-close").addEventListener("click", close);

    container.appendChild(toast);

    const timer = setTimeout(close, duration);

    // Pause on hover
    toast.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        const progress = toast.querySelector(".toast-progress");
        if (progress) progress.style.animationPlayState = "paused";
    });

    toast.addEventListener("mouseleave", () => {
        const progress = toast.querySelector(".toast-progress");
        if (progress) progress.style.animationPlayState = "running";
        setTimeout(close, 2000);
    });
}
