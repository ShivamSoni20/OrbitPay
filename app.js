/**
 * Stellar Pay | White Belt Challenge
 * 
 * A simple Stellar Payment dApp focusing on:
 * - Freighter Wallet Integration
 * - Horizon API Interactions
 * - Transaction Building & Signing
 */

import {
    isConnected,
    setAllowed,
    getPublicKey,
    signTransaction,
} from "@stellar/freighter-api";
import * as StellarSdk from "stellar-sdk";

// --- Configuration & Constants ---
const { Horizon, TransactionBuilder, Networks, Asset, Operation, StrKey } = StellarSdk;
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

// --- State Management ---
let appState = {
    userPublicKey: null,
    accountBalance: "0.00",
    isProcessing: false,
};

// --- DOM Elements ---
const DOM = {
    connectBtn: document.getElementById("connect-btn"),
    disconnectBtn: document.getElementById("disconnect-btn"),
    walletAddressDisplay: document.getElementById("wallet-address"),
    balanceDisplay: document.getElementById("wallet-balance"),

    // Sections
    connectionPrompt: document.getElementById("connection-prompt"),
    walletInfo: document.getElementById("wallet-info"),
    balanceSection: document.getElementById("balance-section"),
    paymentSection: document.getElementById("payment-section"),

    // Form & Status
    paymentForm: document.getElementById("payment-form"),
    statusBox: document.getElementById("status-box"),
    statusContent: document.getElementById("status-content"),
    sendBtn: document.getElementById("send-btn"),
};

// --- Core Initialization ---
async function init() {
    console.log("Stellar White Belt Challenge dApp Initialized");
    setupEventListeners();
}

// --- Event Listeners ---
function setupEventListeners() {
    DOM.connectBtn.addEventListener("click", handleConnect);
    DOM.disconnectBtn.addEventListener("click", handleDisconnect);
    DOM.paymentForm.addEventListener("submit", handlePaymentSubmit);
}

// --- UI Logic (Updates the View) ---
function updateUI() {
    const isUserConnected = !!appState.userPublicKey;

    // Toggle sections based on connection state
    DOM.connectionPrompt.classList.toggle("hidden", isUserConnected);
    DOM.walletInfo.classList.toggle("hidden", !isUserConnected);
    DOM.balanceSection.classList.toggle("hidden", !isUserConnected);
    DOM.paymentSection.classList.toggle("hidden", !isUserConnected);

    if (isUserConnected) {
        DOM.walletAddressDisplay.innerText = appState.userPublicKey;
        DOM.balanceDisplay.innerText = parseFloat(appState.accountBalance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 7
        });
    } else {
        hideStatus();
    }
}

function showStatus(message, type = "success") {
    DOM.statusBox.classList.remove("hidden", "status-success", "status-error");
    DOM.statusBox.classList.add(`status-${type}`);
    DOM.statusContent.innerHTML = message;
    console.log(`Status shown: [${type}] ${message.replace(/<[^>]*>?/gm, '')}`);
}

function hideStatus() {
    DOM.statusBox.classList.add("hidden");
}

function setBtnLoading(isLoading, text = "Processing...") {
    DOM.sendBtn.disabled = isLoading;
    if (isLoading) {
        DOM.sendBtn.innerHTML = `<div class="loading"><div class="loader"></div> ${text}</div>`;
    } else {
        DOM.sendBtn.innerText = "Send XLM";
    }
}

// --- Business Logic ---

/**
 * Validates Stellar address format
 */
function isValidAddress(address) {
    try {
        return StrKey.isValidEd25519PublicKey(address);
    } catch (e) {
        return false;
    }
}

/**
 * Fetches account details from Horizon
 */
async function syncAccountData() {
    if (!appState.userPublicKey) return;

    try {
        console.log("Fetching account data for:", appState.userPublicKey);
        const account = await server.loadAccount(appState.userPublicKey);
        const nativeBalance = account.balances.find(b => b.asset_type === "native");
        appState.accountBalance = nativeBalance ? nativeBalance.balance : "0.00";
        console.log("Balance synced:", appState.accountBalance);
    } catch (err) {
        console.error("Horizon error:", err);
        if (err.response && err.response.status === 404) {
            showStatus("Account not found on Testnet. Please fund it with Friendbot.", "error");
        } else {
            showStatus("Failed to sync account data.", "error");
        }
    }
    updateUI();
}

/**
 * Connection Flow
 */
async function handleConnect() {
    console.log("Connect Wallet requested");
    hideStatus();

    try {
        // 1. Check if extension exists (with library + fallback)
        console.log("Checking if Freighter is available...");

        let freighterAvailable = false;
        try {
            freighterAvailable = await isConnected();
        } catch (err) {
            console.warn("Library isConnected check failed:", err);
        }

        // Fallback check
        if (!freighterAvailable) {
            freighterAvailable = !!(window.freighter || (window.stellar && window.stellar.isFreighter));
            console.log("Fallback check (window.freighter):", freighterAvailable);
        }

        console.log("Freighter availability final result:", freighterAvailable);

        if (!freighterAvailable) {
            console.warn("Freighter not detected via any method");
            showStatus("<strong>Freighter not found!</strong> Please install the browser extension and refresh the page.", "error");
            return;
        }

        // 2. Request Access using setAllowed (This is the recommended way to trigger the popup)
        console.log("Triggering setAllowed (requestAccess)...");
        const allowed = await setAllowed();
        console.log("Response from setAllowed:", allowed);

        if (allowed) {
            console.log("Access granted, fetching public key...");
            // 3. Get the public key
            const publicKey = await getPublicKey();
            console.log("Response from getPublicKey:", publicKey);

            if (publicKey && typeof publicKey === "string" && publicKey.length > 0) {
                appState.userPublicKey = publicKey;
                console.log("Connection successful, syncing account data...");
                await syncAccountData();
            } else {
                console.warn("Public key fetch returned empty even after setAllowed(true)");
                showStatus("Please unlock your Freighter wallet and try again.", "error");
            }
        } else {
            console.warn("Connection was denied (setAllowed returned false)");
            showStatus("Wallet connection access was denied.", "error");
        }
    } catch (e) {
        console.error("Freighter connection error:", e);
        showStatus(`Connection failed: ${e.message}`, "error");
    }
}

/**
 * Disconnection Flow
 */
function handleDisconnect() {
    appState.userPublicKey = null;
    appState.accountBalance = "0.00";
    updateUI();
}

/**
 * Payment Execution Flow
 */
async function handlePaymentSubmit(e) {
    e.preventDefault();
    hideStatus();

    const receiver = document.getElementById("receiver").value.trim();
    const amount = document.getElementById("amount").value.trim();

    // --- Validations ---
    if (!isValidAddress(receiver)) {
        showStatus("Invalid Stellar address format.", "error");
        return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
        showStatus("Please enter a valid amount.", "error");
        return;
    }

    if (parseFloat(amount) > parseFloat(appState.accountBalance)) {
        showStatus("Insufficient balance.", "error");
        return;
    }

    setBtnLoading(true, "Building...");

    try {
        // 1. Fetch current sequence number
        const sourceAccount = await server.loadAccount(appState.userPublicKey);

        // 1.5 Determine whether to use Payment or Create Account
        let operation;
        try {
            // Check if account already exists
            await server.loadAccount(receiver);
            console.log("Account exists, using Payment operation.");
            operation = Operation.payment({
                destination: receiver,
                asset: Asset.native(),
                amount: amount.toString(),
            });
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log("Account does not exist, using Create Account operation.");
                operation = Operation.createAccount({
                    destination: receiver,
                    startingBalance: amount.toString(),
                });
            } else {
                throw err;
            }
        }

        // 2. Build Transaction
        const transaction = new TransactionBuilder(sourceAccount, {
            fee: (await server.fetchBaseFee()).toString(),
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(operation)
            .setTimeout(180) // 3 minute timeout
            .build();

        // 3. Request Signature from Freighter
        setBtnLoading(true, "Sign in Wallet...");
        const xdr = transaction.toXDR();
        const signedXDR = await signTransaction(xdr, {
            network: "TESTNET",
        });

        // 4. Submit to Network
        setBtnLoading(true, "Confirming...");
        
        // Convert the returned XDR string back into a Transaction object for the SDK v13
        const signedTransaction = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
        
        const result = await server.submitTransaction(signedTransaction);

        showStatus(`
            <strong>Transaction Successful!</strong><br>
            Sent ${amount} XLM to ${receiver.slice(0, 6)}...${receiver.slice(-4)}<br>
            <a href="https://stellar.expert/explorer/testnet/tx/${result.hash}" target="_blank" style="color: #00d2ff; font-weight: 600;">View in Explorer</a>
        `, "success");

        // Sync fresh balance
        await syncAccountData();

    } catch (err) {
        console.error("Payment error:", err);
        let msg = "Transaction failed!";
        if (err.response && err.response.data && err.response.data.extras) {
            const results = err.response.data.extras.result_codes;
            msg += ` (Code: ${results.operations ? results.operations[0] : results.transaction})`;
        } else {
            msg += ` ${err.message || ""}`;
        }
        showStatus(msg, "error");
    } finally {
        setBtnLoading(false);
    }
}

init();
