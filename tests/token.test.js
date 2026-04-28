import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';

const { contractCallMock } = vi.hoisted(() => ({
    contractCallMock: vi.fn().mockReturnValue({ type: 'invokeHostFunction' }),
}));

// Force mock stellar-sdk
vi.mock('@stellar/stellar-sdk', () => {
    const mockRpc = {
        Server: vi.fn().mockImplementation(() => ({
            simulateTransaction: vi.fn().mockResolvedValue({
                status: "success",
                result: { retval: "mock" }
            })
        })),
        Api: {
            isSimulationError: vi.fn().mockReturnValue(false)
        }
    };

    return {
        rpc: mockRpc,
        TransactionBuilder: vi.fn().mockImplementation(() => ({
             addOperation: vi.fn().mockReturnThis(),
             setTimeout: vi.fn().mockReturnThis(),
             build: vi.fn().mockReturnValue({})
        })),
        Networks: { TESTNET: 'test' },
        Keypair: { random: () => ({ publicKey: () => 'G' }) },
        Operation: { invokeContractFunction: vi.fn() },
        Contract: vi.fn().mockImplementation(() => ({
            call: contractCallMock
        })),
        Account: vi.fn().mockImplementation(() => ({})),
        nativeToScVal: vi.fn(),
        scValToNative: vi.fn().mockReturnValue(50000000n), // 5.0000000 OBT
        Address: vi.fn().mockImplementation(() => ({}))
    };
});

import { getTokenBalance, rpcServer } from '../js/token.js';

describe('OrbitToken Integration', () => {
    beforeEach(() => {
        contractCallMock.mockClear();
    });

    it('should correctly format token balance from stroops', async () => {
        // Since rpcServer was initialized at module load, we need to spy on it
        vi.spyOn(rpcServer, 'simulateTransaction').mockResolvedValue({
            status: "success",
            result: { retval: "mock" }
        });

        const balance = await getTokenBalance('GCXYZ...');
        expect(balance).toBe('5.0000000');
        expect(contractCallMock).toHaveBeenCalledTimes(1);
        expect(contractCallMock.mock.calls[0][0]).toBe('balance');
    });

    it('should handle simulation errors by returning 0', async () => {
         vi.spyOn(rpcServer, 'simulateTransaction').mockResolvedValue({
            status: "error",
            error: "Something went wrong"
         });
         // Mock isSimulationError to return true
         vi.spyOn(StellarSdk.rpc.Api, 'isSimulationError').mockReturnValue(true);

         const balance = await getTokenBalance('GCXYZ...');
         expect(balance).toBe('0');
    });
});
