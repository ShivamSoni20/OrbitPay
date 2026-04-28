/**
 * OrbitToken (OBT) — Custom Soroban Token Contract Integration
 * @module token
 */

import * as StellarSdk from "@stellar/stellar-sdk";

const {
    rpc,
    TransactionBuilder,
    Networks,
    Keypair,
    Account,
    Contract,
    nativeToScVal,
    scValToNative,
    Address,
} = StellarSdk;

export const TOKEN_CONTRACT_ID = "CDPDVYCGGNEDQYJRM3NJH5PUOI4YRTD2C5CEW6AHIJMPEOK43LWO262Q";
export const TOKEN_SYMBOL = "OBT";
export const TOKEN_NAME = "OrbitToken";
export const TOKEN_DECIMALS = 7; 
export const FAUCET_MINT_AMOUNT = "1000";

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

// Export for testing purposes
export const rpcServer = new rpc.Server(RPC_URL);

const SIM_SOURCE = Keypair.random().publicKey();
let cachedTokenContract;

export async function getTokenBalance(publicKey) {
    try {
        const addressScVal = nativeToScVal(
            new Address(publicKey),
            { type: "address" }
        );

        const tx = buildViewTx("balance", [addressScVal]);
        const response = await rpcServer.simulateTransaction(tx);

        if (rpc.Api.isSimulationError(response)) {
            return "0";
        }

        const retval = response.result?.retval;
        if (retval) {
            const raw = scValToNative(retval);
            const balance = Number(raw) / Math.pow(10, TOKEN_DECIMALS);
            return balance.toFixed(TOKEN_DECIMALS);
        }
        return "0";
    } catch (err) {
        if (process.env.VITEST) {
            // Re-throw to see the error in vitest log
            throw err;
        }
        console.error("Error fetching token balance:", err);
        return "0";
    }
}

export async function getTokenMeta() {
    return { name: TOKEN_NAME, symbol: TOKEN_SYMBOL, decimals: TOKEN_DECIMALS };
}

export async function transferToken(fromKey, toKey, amount, signFn) {
    const stroops = BigInt(Math.round(Number(amount) * Math.pow(10, TOKEN_DECIMALS)));

    const accountRes = await fetch(`${HORIZON_URL}/accounts/${fromKey}`);
    if (!accountRes.ok) throw new Error("Sender account not found.");
    const accountData = await accountRes.json();
    const sourceAccount = new Account(fromKey, accountData.sequence);

    const fromScVal = nativeToScVal(new Address(fromKey), { type: "address" });
    const toScVal = nativeToScVal(new Address(toKey), { type: "address" });
    const amountScVal = nativeToScVal(stroops, { type: "i128" });

    let tx = new TransactionBuilder(sourceAccount, { fee: "100000", networkPassphrase: Networks.TESTNET })
        .addOperation(getTokenContract().call("transfer", fromScVal, toScVal, amountScVal))
        .setTimeout(30).build();

    const simulation = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
        const errMsg = simulation.error?.message || "Simulation failed";
        if (errMsg.toLowerCase().includes("insufficient balance")) throw new Error("Insufficient OBT balance.");
        if (errMsg.toLowerCase().includes("not authorized")) throw new Error("Unauthorized.");
        throw new Error(`Token transfer simulation failed: ${errMsg}`);
    }

    tx = rpc.assembleTransaction(tx, simulation).build();
    const signedXDR = await signFn(tx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
    let response = await rpcServer.sendTransaction(signedTx);

    if (response.status === "ERROR") {
        const detail = response.errorResultXdr || "No detail";
        if (detail.includes("AAAAAQ==")) throw new Error("Insufficient Balance error returned.");
        throw new Error(response.errorResult?.message || "Token transfer submission failed");
    }

    const txHash = response.hash;
    let status = response.status;
    let iterations = 0;
    while (status === "PENDING" && iterations < 20) {
        await sleep(2000);
        const txResponse = await rpcServer.getTransaction(txHash);
        status = txResponse.status;
        if (status === "SUCCESS") return txHash;
        if (status === "FAILED") throw new Error("Token transfer failed on-chain.");
        iterations++;
    }
    if (status === "PENDING") throw new Error("Token transfer timed out.");
    return txHash;
}

export async function mintToken(recipientKey, amount = FAUCET_MINT_AMOUNT, signFn) {
    if (!recipientKey) {
        throw new Error("Connect your wallet before minting OBT.");
    }
    if (!signFn) {
        throw new Error("Wallet signer is not available.");
    }

    const stroops = BigInt(Math.round(Number(amount) * Math.pow(10, TOKEN_DECIMALS)));
    if (stroops <= 0n) {
        throw new Error("Mint amount must be greater than zero.");
    }

    const accountRes = await fetch(`${HORIZON_URL}/accounts/${recipientKey}`);
    if (!accountRes.ok) throw new Error("Account not found. Please fund it via Friendbot first.");
    const accountData = await accountRes.json();
    const sourceAccount = new Account(recipientKey, accountData.sequence);

    const recipientScVal = nativeToScVal(new Address(recipientKey), { type: "address" });
    const amountScVal = nativeToScVal(stroops, { type: "i128" });

    let tx = new TransactionBuilder(sourceAccount, { fee: "100000", networkPassphrase: Networks.TESTNET })
        .addOperation(getTokenContract().call("mint", recipientScVal, amountScVal))
        .setTimeout(30)
        .build();

    const simulation = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
        const errMsg = simulation.error?.message || simulation.error || "Simulation failed";
        if (String(errMsg).toLowerCase().includes("not authorized")) {
            throw new Error("Unauthorized caller. The connected wallet must be the OBT token admin.");
        }
        throw new Error(`OBT mint simulation failed: ${errMsg}`);
    }

    tx = rpc.assembleTransaction(tx, simulation).build();
    const signedXDR = await signFn(tx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
    const response = await rpcServer.sendTransaction(signedTx);

    if (response.status === "ERROR") {
        throw new Error(response.errorResult?.message || "OBT mint submission failed.");
    }

    const txHash = response.hash;
    let status = response.status;
    let iterations = 0;
    while (status === "PENDING" && iterations < 20) {
        await sleep(2000);
        const txResponse = await rpcServer.getTransaction(txHash);
        status = txResponse.status;
        if (status === "SUCCESS") return txHash;
        if (status === "FAILED") throw new Error("OBT mint failed on-chain.");
        iterations++;
    }
    if (status === "PENDING") throw new Error("OBT mint timed out.");
    return txHash;
}

function buildViewTx(fn, args = []) {
    return new TransactionBuilder(new Account(SIM_SOURCE, "0"), { fee: "100", networkPassphrase: Networks.TESTNET })
        .addOperation(getTokenContract().call(fn, ...args))
        .setTimeout(30).build();
}

function getTokenContract() {
    if (!cachedTokenContract) {
        try {
            cachedTokenContract = new Contract(TOKEN_CONTRACT_ID);
        } catch (err) {
            throw new Error(`Invalid OBT token contract ID: ${TOKEN_CONTRACT_ID}`);
        }
    }
    return cachedTokenContract;
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
