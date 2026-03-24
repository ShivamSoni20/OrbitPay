/**
 * Soroban Smart Contract Interaction Module
 * @module contract
 *
 * Handles all on-chain interactions with the Community Poll
 * smart contract deployed on Stellar Testnet.
 */

import * as StellarSdk from "@stellar/stellar-sdk";

const {
    rpc,
    xdr,
    TransactionBuilder,
    Networks,
    Keypair,
    Operation,
    Account,
    nativeToScVal,
    scValToNative,
} = StellarSdk;

const CONTRACT_ID = "CAKINUZ4GVF6IB56H26YCJ64OUHJNXZMXWF3SXNLO6PQYYGYIGRS52UC";
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const rpcServer = new rpc.Server(RPC_URL);

/**
 * A valid throwaway public key used as the source for read-only
 * simulation calls (no signing or submission needed).
 */
const SIMULATED_SOURCE = Keypair.random().publicKey();

// ======================================================
//  READ CALLS (simulate-only, no signing)
// ======================================================

/**
 * Fetch all available poll options from the contract.
 * @returns {Promise<string[]>} List of option symbol names.
 */
export async function getOptions() {
    try {
        const tx = buildViewTx("get_options");
        const response = await rpcServer.simulateTransaction(tx);

        if (rpc.Api.isSimulationError(response)) {
            return ["Tokens", "NFTs", "DeFi"];
        }

        // Extract the return value from the simulation result
        const retval = response.result?.retval;
        if (retval) {
            return scValToNative(retval);
        }

        return ["Tokens", "NFTs", "DeFi"];
    } catch (err) {
        return ["Tokens", "NFTs", "DeFi"];
    }
}

/**
 * Fetch vote count for a specific option.
 * @param {string} option - Option name (must match a Symbol stored on-chain).
 * @returns {Promise<number>} Vote count.
 */
export async function getVotes(option) {
    try {
        const tx = buildViewTx("get_votes", [
            nativeToScVal(option, { type: "symbol" }),
        ]);
        const response = await rpcServer.simulateTransaction(tx);

        if (rpc.Api.isSimulationError(response)) {
            return 0;
        }

        const retval = response.result?.retval;
        if (retval) {
            return scValToNative(retval) || 0;
        }
        return 0;
    } catch (err) {
        return 0;
    }
}

/**
 * Fetch votes for all options at once.
 * @returns {Promise<Object>} Map of { optionName: voteCount }.
 */
export async function getAllVotes() {
    const options = await getOptions();
    const results = {};
    for (const opt of options) {
        results[opt] = await getVotes(opt);
    }
    return results;
}

// ======================================================
//  WRITE CALL (sign + submit)
// ======================================================

/**
 * Cast a vote on-chain. Full lifecycle:
 * Build → Simulate → Assemble → Sign → Submit → Poll.
 *
 * @param {string} option - The poll option to vote for.
 * @param {Function} signFn - Async function that signs XDR and returns signed XDR.
 * @param {string} publicKey - The voter's Stellar public key.
 * @returns {Promise<string>} The confirmed transaction hash.
 * @throws {Error} Descriptive error on simulation failure, timeout, or on-chain failure.
 */
export async function castVote(option, signFn, publicKey) {
    // 1. Fetch the real account from Horizon so we have a valid sequence number
    const accountRes = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!accountRes.ok) {
        throw new Error("Account not found. Please fund it via Friendbot first.");
    }
    const accountData = await accountRes.json();
    const sourceAccount = new Account(publicKey, accountData.sequence);

    // 2. Build the transaction
    let tx = new TransactionBuilder(sourceAccount, {
        fee: "100000", // 0.01 XLM — generous for Soroban
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(
            Operation.invokeContractFunction({
                contract: CONTRACT_ID,
                function: "vote",
                args: [nativeToScVal(option, { type: "symbol" })],
            })
        )
        .setTimeout(30)
        .build();

    // 3. Simulate
    const simulation = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
        const errMsg = simulation.error || "Unknown simulation error";
        if (errMsg.toLowerCase().includes("invalid option")) {
            throw new Error("Invalid poll option");
        }
        throw new Error(`Simulation failed: ${errMsg}`);
    }

    // 4. Assemble (adds resource footprint, auth, etc.)
    tx = rpc.assembleTransaction(tx, simulation).build();

    // 5. Sign via wallet
    const signedXDR = await signFn(tx.toXDR());

    // 6. Submit
    const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
    let response = await rpcServer.sendTransaction(signedTx);

    if (response.status === "ERROR") {
        throw new Error(
            response.errorResult?.message || "Transaction submission failed"
        );
    }

    // 7. Poll for confirmation
    const txHash = response.hash;
    let status = response.status;
    let iterations = 0;

    while (status === "PENDING" && iterations < 20) {
        await sleep(2000);
        const txResponse = await rpcServer.getTransaction(txHash);
        status = txResponse.status;

        if (status === "SUCCESS") return txHash;
        if (status === "FAILED") {
            throw new Error("Transaction failed on-chain. The contract may have panicked.");
        }
        iterations++;
    }

    if (status === "PENDING") {
        throw new Error("Transaction timed out after 40 seconds. Please try again.");
    }

    return txHash;
}

// ======================================================
//  EVENT SUBSCRIPTION
// ======================================================

/** Tracks the last ledger sequence we queried for events. */
let lastLedger = 0;

/**
 * Subscribe to vote events from the contract.
 * Polls getEvents() every 8 seconds and fires the callback when new events appear.
 *
 * @param {Function} callback - Called (with no args) when new vote events are detected.
 * @returns {Function} Unsubscribe function to stop polling.
 */
export function subscribeToVoteEvents(callback) {
    const interval = setInterval(async () => {
        try {
            const latest = await rpcServer.getLatestLedger();
            if (lastLedger === 0) {
                lastLedger = latest.sequence - 5;
            }

            const events = await rpcServer.getEvents({
                startLedger: lastLedger,
                filters: [
                    {
                        type: "contract",
                        contractIds: [CONTRACT_ID],
                    },
                ],
                limit: 10,
            });

            if (events.events && events.events.length > 0) {
                lastLedger = latest.sequence;
                callback();
            } else {
                // Move forward to avoid re-scanning old ledgers
                lastLedger = latest.sequence - 1;
            }
        } catch (err) {
            // Silently retry — event polling is best-effort
            console.warn("Event polling error (will retry):", err?.message || err);
        }
    }, 8000);

    return () => clearInterval(interval);
}

// ======================================================
//  HELPERS
// ======================================================

/**
 * Build a read-only transaction for simulation (no signing needed).
 * Uses a random throwaway source account.
 *
 * @param {string} fn - Contract function name.
 * @param {xdr.ScVal[]} args - Function arguments.
 * @returns {Transaction} An unsigned transaction ready for simulation.
 */
function buildViewTx(fn, args = []) {
    return new TransactionBuilder(
        new Account(SIMULATED_SOURCE, "0"),
        {
            fee: "100",
            networkPassphrase: Networks.TESTNET,
        }
    )
        .addOperation(
            Operation.invokeContractFunction({
                contract: CONTRACT_ID,
                function: fn,
                args,
            })
        )
        .setTimeout(30)
        .build();
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
