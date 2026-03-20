import { describe, it, expect } from "vitest";
import { truncateAddress, formatNumber } from "../js/utils.js";

describe("Utility Functions (Logic & Error Handling)", () => {
    
    it("truncateAddress should shorten a long public key", () => {
        const addr = "GCD43M7W3V4A...R7X7O37TZ";
        const truncated = truncateAddress(addr, 4, 4);
        expect(truncated).toBe("GCD4...37TZ");
    });

    it("truncateAddress should return '-' for empty input", () => {
        expect(truncateAddress(null)).toBe("—");
    });

    it("formatNumber should handle valid numbers", () => {
        expect(formatNumber(1234.5678, 2)).toBe("1,234.57");
    });

    it("formatNumber should handle invalid inputs gracefully (Error Case)", () => {
        // This covers the error handling requirement in logic
        expect(formatNumber("invalid")).toBe("0.00");
    });
});
