import * as StellarSdk from "@stellar/stellar-sdk";
import { TOKEN_CONTRACT_ID, TOKEN_DECIMALS } from "./token.js";

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

export const PAYROLL_CONTRACT_ID = "PAYROLL_CONTRACT_ID_PENDING_DEPLOYMENT";
export const XLM_SAC_CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3";
export const PAYROLL_STORAGE_KEY = "orbitpay_payroll_streams";

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const SIM_SOURCE = Keypair.random().publicKey();

export const payrollRpcServer = new rpc.Server(RPC_URL);

export function validatePayrollStream({ recipient, amount, durationDays }) {
    const errors = {};
    if (!recipient || !StellarSdk.StrKey.isValidEd25519PublicKey(recipient)) {
        errors.recipient = "Enter a valid Stellar public key.";
    }
    if (!amount || Number(amount) <= 0) {
        errors.amount = "Amount must be greater than zero.";
    }
    if (!durationDays || Number(durationDays) <= 0) {
        errors.durationDays = "Duration must be at least 1 day.";
    }
    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

export function getClaimButtonState(claimableAmount) {
    const amount = Number(claimableAmount || 0);
    return {
        disabled: amount <= 0,
        label: amount > 0 ? "Claim Payment" : "Nothing to claim",
    };
}

export async function createPayrollStream(adminKey, form, signFn) {
    const validation = validatePayrollStream(form);
    if (!validation.valid) {
        throw new Error(Object.values(validation.errors)[0]);
    }

    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + Math.round(Number(form.durationDays) * 86400);
    const tokenType = form.tokenType || "OBT";
    const tokenContract = tokenType === "OBT" ? TOKEN_CONTRACT_ID : XLM_SAC_CONTRACT_ID;
    const streamId = await invokePayroll(adminKey, "create_stream", [
        nativeToScVal(new Address(adminKey), { type: "address" }),
        nativeToScVal(new Address(form.recipient), { type: "address" }),
        nativeToScVal(new Address(tokenContract), { type: "address" }),
        nativeToScVal(tokenType, { type: "symbol" }),
        nativeToScVal(toTokenUnits(form.amount), { type: "i128" }),
        nativeToScVal(BigInt(startTime), { type: "u64" }),
        nativeToScVal(BigInt(endTime), { type: "u64" }),
    ], signFn);

    return {
        id: Date.now(),
        onChainId: streamId.hash,
        txHash: streamId.hash,
        admin: adminKey,
        recipient: form.recipient,
        amount: Number(form.amount),
        tokenType,
        startTime,
        endTime,
        claimed: 0,
        status: "Active",
        history: [],
    };
}

export async function claimPayrollStream(publicKey, stream, signFn) {
    const response = await invokePayroll(publicKey, "claim", [
        nativeToScVal(BigInt(stream.id), { type: "u64" }),
    ], signFn);
    return response.hash;
}

export async function updatePayrollStreamStatus(publicKey, stream, action, signFn) {
    if (!["pause", "resume", "cancel"].includes(action)) {
        throw new Error("Unsupported payroll action.");
    }
    const response = await invokePayroll(publicKey, action, [
        nativeToScVal(BigInt(stream.id), { type: "u64" }),
    ], signFn);
    return response.hash;
}

export async function readClaimableAmount(streamId) {
    const tx = buildViewTx("claimable_amount", [nativeToScVal(BigInt(streamId), { type: "u64" })]);
    const response = await payrollRpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(response)) return "0.0000000";
    const retval = response.result?.retval;
    if (!retval) return "0.0000000";
    return (Number(scValToNative(retval)) / Math.pow(10, TOKEN_DECIMALS)).toFixed(TOKEN_DECIMALS);
}

export function loadLocalStreams() {
    return JSON.parse(localStorage.getItem(PAYROLL_STORAGE_KEY) || "[]");
}

export function saveLocalStreams(streams) {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(streams));
}

export function calculateLocalClaimable(stream, now = Math.floor(Date.now() / 1000)) {
    if (!stream || stream.status !== "Active") return 0;
    if (now <= stream.startTime) return 0;
    const duration = stream.endTime - stream.startTime;
    const elapsed = Math.min(now, stream.endTime) - stream.startTime;
    const vested = stream.amount * (elapsed / duration);
    return Math.max(0, vested - (stream.claimed || 0));
}

async function invokePayroll(publicKey, fn, args, signFn) {
    if (!publicKey) throw new Error("Connect your wallet first.");
    if (PAYROLL_CONTRACT_ID.includes("PENDING")) {
        throw new Error("Payroll contract address is pending deployment. Deploy the Rust contract and update PAYROLL_CONTRACT_ID.");
    }

    const accountRes = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!accountRes.ok) throw new Error("Account not found. Please fund it via Friendbot first.");
    const accountData = await accountRes.json();
    const sourceAccount = new Account(publicKey, accountData.sequence);

    let tx = new TransactionBuilder(sourceAccount, { fee: "100000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.invokeContractFunction({ contract: PAYROLL_CONTRACT_ID, function: fn, args }))
        .setTimeout(30)
        .build();

    const simulation = await payrollRpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(simulation.error?.message || `${fn} simulation failed.`);
    }

    tx = rpc.assembleTransaction(tx, simulation).build();
    const signedXDR = await signFn(tx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
    const response = await payrollRpcServer.sendTransaction(signedTx);
    if (response.status === "ERROR") {
        throw new Error(response.errorResult?.message || `${fn} submission failed.`);
    }

    const hash = response.hash;
    let status = response.status;
    let iterations = 0;
    while (status === "PENDING" && iterations < 20) {
        await sleep(2000);
        const txResponse = await payrollRpcServer.getTransaction(hash);
        status = txResponse.status;
        if (status === "SUCCESS") return { hash };
        if (status === "FAILED") throw new Error(`${fn} failed on-chain.`);
        iterations++;
    }
    if (status === "PENDING") throw new Error(`${fn} timed out.`);
    return { hash };
}

function buildViewTx(fn, args = []) {
    return new TransactionBuilder(new Account(SIM_SOURCE, "0"), { fee: "100", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.invokeContractFunction({ contract: PAYROLL_CONTRACT_ID, function: fn, args }))
        .setTimeout(30)
        .build();
}

function toTokenUnits(amount) {
    return BigInt(Math.round(Number(amount) * Math.pow(10, TOKEN_DECIMALS)));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
