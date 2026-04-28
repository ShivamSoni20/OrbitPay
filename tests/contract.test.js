import { describe, it, expect, vi } from "vitest";

// Mock StellarSdk before importing contract.js
vi.mock("@stellar/stellar-sdk", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        rpc: {
            Server: vi.fn().mockImplementation(() => ({
                simulateTransaction: vi.fn().mockResolvedValue({
                    result: {
                        retval: {
                            _value: ["Tokens", "NFTs", "DeFi"]
                        }
                    }
                })
            })),
            Api: {
                isSimulationError: vi.fn().mockReturnValue(false)
            }
        },
        scValToNative: vi.fn().mockReturnValue(["Tokens", "NFTs", "DeFi"]),
        nativeToScVal: vi.fn(),
        TransactionBuilder: vi.fn().mockImplementation(() => ({
            addOperation: vi.fn().mockReturnThis(),
            setTimeout: vi.fn().mockReturnThis(),
            build: vi.fn()
        })),
        Account: vi.fn(),
        Keypair: {
            random: vi.fn().mockReturnValue({ publicKey: () => "GB..." })
        }
    };
});

import { getOptions } from "../js/contract.js";

describe("Contract Logic Tests (Mocked Call)", () => {
    
    it("getOptions should return the list of poll options", async () => {
        const options = await getOptions();
        
        expect(options).toContain("Tokens");
        expect(options).toContain("NFTs");
        expect(options).toContain("DeFi");
    });
});
