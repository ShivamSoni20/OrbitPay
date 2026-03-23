/**
 * OrbitToken (OBT) — Custom Soroban Token Contract Integration
 * @module token
 *
 * Handles all interactions with the OrbitToken custom token deployed
 * on Stellar Testnet. Implements SEP-41 compatible functions:
 * balance(), transfer(), name(), symbol(), decimals().
 *
 * Token Address: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3
 */

import * as StellarSdk from "stellar-sdk";

const {
    rpc,
    TransactionBuilder,
    Networks,
    Keypair,
    Operation,
    Account,
    nativeToScVal,
    scValToNative,
    Address,
} = StellarSdk;

// ====================================================================
// CONFIGURATION
// ====================================================================

/**
 * The deployed OrbitToken contract address on Stellar testnet.
 * This is the Soroban contract that implements SEP-41 token standard.
 */
export const TOKEN_CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3";
export const TOKEN_SYMBOL = "OBT";
export const TOKEN_NAME = "OrbitToken";
export const TOKEN_DECIMALS = 7; // Standard Stellar decimal precision

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

const rpcServer = new rpc.Server(RPC_URL);

// Throwaway key for read-only simulations
const SIM_SOURCE = Keypair.random().publicKey();

// ====================================================================
// READ CALLS (simulate only)
// ====================================================================

/**
 * Get the OBT token balance of an account.
 * @param {string} publicKey — Stellar public key of the account.
 * @returns {Promise<string>} Human-readable balance (e.g., "1,234.5000000").
 */
export async function getTokenBalance(publicKey) {
    try {
        const addressScVal = nativeToScVal(
            new Address(publicKey),
            { type: "address" }
        );

        const tx = buildViewTx("balance", [addressScVal]);
        const response = await rpcServer.simulateTransaction(tx);

        if (rpc.Api.isSimulationError(response)) {
            console.warn("Token balance simulation error:", response.error);
            return "0";
        }

        const retval = response.result?.retval;
        if (retval) {
            const raw = scValToNative(retval);
            // raw is i128, convert from stroops (7 decimals)
            const balance = Number(raw) / Math.pow(10, TOKEN_DECIMALS);
            return balance.toFixed(TOKEN_DECIMALS);
        }
        return "0";
    } catch (err) {
        console.error("Error fetching token balance:", err);
        return "0";
    }
}

/**
 * Get token metadata (name, symbol, decimals).
 * @returns {Promise<{name: string, symbol: string, decimals: number}>}
 */
export async function getTokenMeta() {
    return {
        name: TOKEN_NAME,
        symbol: TOKEN_SYMBOL,
        decimals: TOKEN_DECIMALS,
    };
}

// ====================================================================
// WRITE CALLS (sign + submit)
// ====================================================================

/**
 * Transfer OBT tokens to another account.
 * Full lifecycle: Build → Simulate → Assemble → Sign → Submit → Poll.
 *
 * @param {string} fromKey — Sender's Stellar public key.
 * @param {string} toKey — Recipient's Stellar public key.
 * @param {number|string} amount — Amount in human-readable units (e.g., 10.5).
 * @param {Function} signFn — Async function that takes XDR and returns signed XDR.
 * @returns {Promise<string>} Confirmed transaction hash.
 */
export async function transferToken(fromKey, toKey, amount, signFn) {
    // Convert human-readable amount to stroops (multiply by 10^7)
    const stroops = BigInt(Math.round(Number(amount) * Math.pow(10, TOKEN_DECIMALS)));

    // 1. Load source account
    const accountRes = await fetch(`${HORIZON_URL}/accounts/${fromKey}`);
    if (!accountRes.ok) {
        throw new Error("Sender account not found. Please fund it via Friendbot first.");
    }
    const accountData = await accountRes.json();
    const sourceAccount = new Account(fromKey, accountData.sequence);

    // 2. Build transfer args
    const fromScVal = nativeToScVal(new Address(fromKey), { type: "address" });
    const toScVal = nativeToScVal(new Address(toKey), { type: "address" });
    const amountScVal = nativeToScVal(stroops, { type: "i128" });

    // 3. Build transaction
    let tx = new TransactionBuilder(sourceAccount, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(
            Operation.invokeContractFunction({
                contract: TOKEN_CONTRACT_ID,
                function: "transfer",
                args: [fromScVal, toScVal, amountScVal],
            })
        )
        .setTimeout(30)
        .build();

    // 4. Simulate
    const simulation = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
        const errMsg = simulation.error || "Unknown simulation error";
        throw new Error(`Token transfer simulation failed: ${errMsg}`);
    }

    // 5. Assemble
    tx = rpc.assembleTransaction(tx, simulation).build();

    // 6. Sign
    const signedXDR = await signFn(tx.toXDR());

    // 7. Submit
    const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
    let response = await rpcServer.sendTransaction(signedTx);

    if (response.status === "ERROR") {
        throw new Error(response.errorResult?.message || "Token transfer submission failed");
    }

    // 8. Poll for confirmation
    const txHash = response.hash;
    let status = response.status;
    let iterations = 0;

    while (status === "PENDING" && iterations < 20) {
        await sleep(2000);
        const txResponse = await rpcServer.getTransaction(txHash);
        status = txResponse.status;
        if (status === "SUCCESS") return txHash;
        if (status === "FAILED") {
            throw new Error("Token transfer failed on-chain.");
        }
        iterations++;
    }

    if (status === "PENDING") {
        throw new Error("Token transfer timed out. Please check the explorer.");
    }

    return txHash;
}

// ====================================================================
// HELPERS
// ====================================================================

function buildViewTx(fn, args = []) {
    return new TransactionBuilder(
        new Account(SIM_SOURCE, "0"),
        { fee: "100", networkPassphrase: Networks.TESTNET }
    )
        .addOperation(
            Operation.invokeContractFunction({
                contract: TOKEN_CONTRACT_ID,
                function: fn,
                args,
            })
        )
        .setTimeout(30)
        .build();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
