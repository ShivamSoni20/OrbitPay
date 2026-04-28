import { describe, it, expect, vi } from "vitest";

const { pollContractCallMock } = vi.hoisted(() => ({
    pollContractCallMock: vi.fn().mockReturnValue({ type: "invokeHostFunction" }),
}));

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
        Contract: vi.fn().mockImplementation(() => ({
            call: pollContractCallMock
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
        expect(pollContractCallMock.mock.calls[0][0]).toBe("get_options");
    });
});
