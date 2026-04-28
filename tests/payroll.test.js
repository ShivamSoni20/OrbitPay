import { describe, expect, it } from "vitest";
import { mintToken } from "../js/token.js";
import { getClaimButtonState, validatePayrollStream } from "../js/payroll.js";

describe("Level 5 Payroll and Faucet Tests", () => {
    it("mint faucet function rejects when no wallet is connected", async () => {
        await expect(mintToken("", "1000", async () => "")).rejects.toThrow("Connect your wallet");
    });

    it("payroll stream creation validation requires recipient, positive amount, and duration", () => {
        const result = validatePayrollStream({
            recipient: "not-a-stellar-address",
            amount: "0",
            durationDays: "0",
        });

        expect(result.valid).toBe(false);
        expect(result.errors.recipient).toBeTruthy();
        expect(result.errors.amount).toBeTruthy();
        expect(result.errors.durationDays).toBeTruthy();
    });

    it("claim button UI state is disabled when claimable amount is 0", () => {
        const state = getClaimButtonState(0);

        expect(state.disabled).toBe(true);
        expect(state.label).toBe("Nothing to claim");
    });
});
