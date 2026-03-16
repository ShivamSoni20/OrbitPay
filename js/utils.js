/**
 * Utility functions for the OrbitPay dApp.
 * @module utils
 */

/**
 * Truncate a Stellar public key for display.
 * @param {string} address - The full public key.
 * @param {number} [start=6] - Characters to show at start.
 * @param {number} [end=6] - Characters to show at end.
 * @returns {string} Truncated address.
 */
export function truncateAddress(address, start = 6, end = 6) {
    if (!address || address.length < start + end + 3) return address || "—";
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format a number for display (with commas and decimal places).
 * @param {string|number} value - The number to format.
 * @param {number} [decimals=2] - Max decimal places.
 * @returns {string} Formatted number string.
 */
export function formatNumber(value, decimals = 2) {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a Date object to a human-readable relative or absolute string.
 * @param {string|Date} dateInput - The date to format.
 * @returns {string} Formatted date string.
 */
export function formatDate(dateInput) {
    const date = new Date(dateInput);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Copy text to clipboard and show a confirmation.
 * @param {string} text - Text to copy.
 * @returns {Promise<boolean>} Whether the copy succeeded.
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
    }
}

/**
 * Generate and display a QR code modal for the given address.
 * @param {string} address - The wallet address.
 */
export async function showQRModal(address) {
    // Dynamically import qrcode
    let QRCode;
    try {
        QRCode = (await import("qrcode")).default;
    } catch {
        // Fallback: use a simple text display
        alert(`Wallet Address:\n${address}`);
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "qr-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "qr-modal";
    modal.innerHTML = `
        <h3>Share Wallet Address</h3>
        <canvas id="qr-canvas"></canvas>
        <p class="qr-address">${address}</p>
        <button class="btn-close-modal">Close</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Render QR Code
    const canvas = modal.querySelector("#qr-canvas");
    await QRCode.toCanvas(canvas, address, {
        width: 200,
        margin: 2,
        color: { dark: "#f1f5f9", light: "#0c1222" },
    });

    // Close events
    const close = () => overlay.remove();
    modal.querySelector(".btn-close-modal").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function handler(e) {
        if (e.key === "Escape") { close(); document.removeEventListener("keydown", handler); }
    });
}
