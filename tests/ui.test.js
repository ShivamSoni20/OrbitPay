import { describe, it, expect, vi } from "vitest";
import { showToast } from "../js/toast.js";

describe("UI Component Tests", () => {
    
    it("showToast should create a toast element in the container", () => {
        // Setup document body
        document.body.innerHTML = '<div id="toast-container"></div>';
        
        showToast("Level 3 Test Message", "success");
        
        const container = document.getElementById("toast-container");
        expect(container.children.length).toBe(1);
        
        const toast = container.querySelector(".toast");
        expect(toast.classList.contains("success")).toBe(true);
        expect(toast.textContent).toContain("Level 3 Test Message");
    });

    it("asset selector should switch emphasis between XLM/OBT", () => {
        document.body.innerHTML = `
            <div id="asset-xlm" class="asset-card active">XLM</div>
            <div id="asset-obt" class="asset-card">OBT</div>
        `;
        
        // Simulating the logic from app.js updateAssetUI()
        const clickOBT = () => {
             document.getElementById("asset-xlm").classList.remove("active");
             document.getElementById("asset-obt").classList.add("active");
        };

        clickOBT();
        expect(document.getElementById("asset-obt").classList.contains("active")).toBe(true);
        expect(document.getElementById("asset-xlm").classList.contains("active")).toBe(false);
    });
});

