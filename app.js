/**
 * OrbitPay — Main Application Entry Point
 * @module app
 *
 * Orchestrates wallet connection, payment, polling, transaction history,
 * network stats, navigation, and the toast notification system.
 */

import * as StellarSdk from "stellar-sdk";
import { initWalletKit, connectWallet, disconnectWallet, signTransaction } from "./js/wallet.js";
import { showToast } from "./js/toast.js";
import { truncateAddress, formatNumber, formatDate, copyToClipboard, showQRModal } from "./js/utils.js";
import { getOptions, getAllVotes, castVote, subscribeToVoteEvents } from "./js/contract.js";

// --- Stellar SDK Destructuring ---
const { Horizon, TransactionBuilder, Networks, Asset, Operation, StrKey } = StellarSdk;

// --- Configuration ---
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

// --- Cache Keys ---
const CACHE_KEYS = {
    PUBKEY: "orbitpay_pubkey",
    BALANCE: "orbitpay_balance",
    TXS: "orbitpay_transactions"
};

// --- Application State ---
const state = {
    userPublicKey: localStorage.getItem(CACHE_KEYS.PUBKEY),
    balance: localStorage.getItem(CACHE_KEYS.BALANCE) || "0.00",
    isProcessing: false,
    isConnecting: false,
    pollData: [],
    pollLoaded: false,
    votedOption: null,
    transactions: JSON.parse(localStorage.getItem(CACHE_KEYS.TXS) || "[]"),
    currentPage: "dashboard",
    lastPollUpdate: new Date(),
    unsubscribeEvents: null,
};


// --- DOM References ---
const $ = (id) => document.getElementById(id);

// ======================================================
//  INITIALIZATION
// ======================================================

/** Bootstrap the entire application. */
async function init() {
    console.log("🚀 OrbitPay v3.0 (Orange Belt) initialized");

    initWalletKit();
    setupNavigation();
    setupEventListeners();
    // Initialize Landing Page Logic
    const cachedPubKey = localStorage.getItem(CACHE_KEYS.PUBLIC_KEY);
    if (cachedPubKey) {
        $("landing-overlay")?.classList.add("fade-out");
        triggerAppReveal();
    } else {
        $("enter-app-btn")?.addEventListener("click", async () => {
            const btn = $("enter-app-btn");
            btn.classList.add("btn-loading");
            try {
                const address = await connectWallet();
                state.userPublicKey = address;
                localStorage.setItem(CACHE_KEYS.PUBKEY, address);
                
                await syncAccountData();
                showToast("Wallet connected successfully!", "success");
                fetchTransactions();

                $("landing-overlay")?.classList.add("fade-out");
                triggerAppReveal();
            } catch (err) {
                console.error("Connection error:", err);
                if (err?.code === -1 && err?.message?.includes("closed")) return;
                showToast(err?.message || "Failed to connect wallet", "error");
            } finally {
                btn.classList.remove("btn-loading");
            }
        });

    }

    // Initial UI Update from Cache
    updateUI();
    if (state.transactions.length > 0) renderDashboardTx();

    // Initial Poll Load

    await refreshPollData();
    
    // Refresh account data if already connected
    if (state.userPublicKey) syncAccountData();

    fetchNetworkStats();
    setInterval(fetchNetworkStats, 15000);
}


// ======================================================
//  NAVIGATION (Sidebar Router)
// ======================================================

function setupNavigation() {
    document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
        item.addEventListener("click", () => navigateTo(item.dataset.page));
    });

    $("view-all-tx")?.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo("history");
    });

    $("mobile-menu-btn")?.addEventListener("click", toggleMobileMenu);
    $("sidebar-overlay")?.addEventListener("click", toggleMobileMenu);
}

function navigateTo(page) {
    // Cleanup old listeners if moving away from poll
    if (state.currentPage === "poll" && page !== "poll") {
        if (state.unsubscribeEvents) {
            state.unsubscribeEvents();
            state.unsubscribeEvents = null;
        }
    }

    state.currentPage = page;

    // Navigation UI updates
    document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
        item.classList.toggle("active", item.dataset.page === page);
    });

    const view = $(`page-${page}`);
    document.querySelectorAll(".page-view").forEach((v) => {
        v.classList.toggle("active", v === view);
    });

    // Re-trigger staggered reveal animation
    if (view) {
        const sections = view.querySelectorAll(".content-section");
        sections.forEach((sec, idx) => {
            sec.style.animation = 'none';
            sec.offsetHeight; // trigger reflow
            sec.style.animation = `reveal-item 0.8s var(--ease-out-expo) ${idx * 0.1}s forwards`;
        });
    }

    const titles = { dashboard: "Dashboard", send: "Send XLM", poll: "Community Poll", history: "Transaction History", settings: "Settings" };
    $("page-title").textContent = titles[page] || "Dashboard";

    $("sidebar")?.classList.remove("open");
    $("sidebar-overlay")?.classList.remove("open");

    // Page-specific initialization
    if (page === "poll") {
        refreshPollData();
        state.unsubscribeEvents = subscribeToVoteEvents(() => {
            console.log("New results detected on-chain!");
            refreshPollData(true);
        });
    }

    if (page === "history" && state.userPublicKey) fetchTransactions();
}


function toggleMobileMenu() {
    $("sidebar")?.classList.toggle("open");
    $("sidebar-overlay")?.classList.toggle("open");
}

function triggerAppReveal() {
    // Re-trigger staggered reveal for dashboard to create a unified loading experience
    const view = $("page-dashboard");
    if (view) {
        const sections = view.querySelectorAll(".content-section, .card");
        sections.forEach((sec, idx) => {
            sec.style.animation = 'none';
            sec.offsetHeight; // trigger reflow
            sec.style.animation = `reveal-item 0.8s var(--ease-out-expo) ${idx * 0.1}s forwards`;
        });
    }
}

// ======================================================
//  EVENT LISTENERS

// ======================================================

function setupEventListeners() {
    $("connect-btn")?.addEventListener("click", handleConnect);
    $("disconnect-btn")?.addEventListener("click", handleDisconnect);
    $("payment-form")?.addEventListener("submit", handlePayment);
    $("copy-addr-btn")?.addEventListener("click", handleCopyAddress);
    $("qr-btn")?.addEventListener("click", () => showQRModal(state.userPublicKey));
}

// ======================================================
//  UI UPDATES
// ======================================================

function updateUI() {
    const connected = !!state.userPublicKey;

    $("connect-btn")?.classList.toggle("hidden", connected);
    $("wallet-pill")?.classList.toggle("hidden", !connected);
    $("connection-prompt")?.classList.toggle("hidden", connected);
    $("dashboard-content")?.classList.toggle("hidden", !connected);

    if (connected) {
        const truncated = truncateAddress(state.userPublicKey);
        $("wallet-address").textContent = truncated;
        $("wallet-balance").textContent = `${formatNumber(state.balance)} XLM`;
        $("dash-balance").textContent = formatNumber(state.balance, 4);
        $("dash-wallet").textContent = truncated;
    }

    const totalVotes = state.pollData.reduce((a, b) => a + b.votes, 0);
    $("dash-total-votes").textContent = totalVotes;
}

// ======================================================
//  WALLET CONNECTION
// ======================================================

async function handleConnect() {
    if (state.isConnecting) return;
    state.isConnecting = true;
    const btn = $("connect-btn");
    btn.classList.add("btn-loading");
    
    try {
        const address = await connectWallet();
        state.userPublicKey = address;
        localStorage.setItem(CACHE_KEYS.PUBKEY, address);
        
        await syncAccountData();
        showToast("Wallet connected successfully!", "success");
        fetchTransactions();
    } catch (err) {
        console.error("Connection error:", err);
        if (err?.code === -1 && err?.message?.includes("closed")) return;
        showToast(err?.message || "Failed to connect wallet", "error");
    } finally {
        state.isConnecting = false;
        btn.classList.remove("btn-loading");
    }
}


function handleDisconnect() {
    disconnectWallet();
    state.userPublicKey = null;
    state.balance = "0.00";
    state.transactions = [];
    
    // Clear Cache
    localStorage.removeItem(CACHE_KEYS.PUBKEY);
    localStorage.removeItem(CACHE_KEYS.BALANCE);
    localStorage.removeItem(CACHE_KEYS.TXS);

    updateUI();
    renderDashboardTx();
    showToast("Wallet disconnected", "info");
}


async function syncAccountData() {
    if (!state.userPublicKey) return;
    try {
        const account = await server.loadAccount(state.userPublicKey);
        const native = account.balances.find((b) => b.asset_type === "native");
        state.balance = native ? native.balance : "0.00";
        localStorage.setItem(CACHE_KEYS.BALANCE, state.balance);
    } catch (err) {
        console.error("Horizon error:", err);
        if (err?.response?.status === 404) {
            showToast("Account not found on Testnet. Fund it via Friendbot.", "warning");
        }
    }
    updateUI();
}


async function handleCopyAddress() {
    if (!state.userPublicKey) return;
    const ok = await copyToClipboard(state.userPublicKey);
    showToast(ok ? "Address copied to clipboard!" : "Failed to copy address", ok ? "success" : "error");
}

// ======================================================
//  SEND XLM
// ======================================================

async function handlePayment(e) {
    e.preventDefault();
    if (!state.userPublicKey) {
        showToast("Please connect your wallet first", "warning");
        return;
    }

    const receiver = $("receiver").value.trim();
    const amount = $("amount").value.trim();

    if (!StrKey.isValidEd25519PublicKey(receiver)) {
        showToast("Invalid recipient address format", "error");
        return;
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        showToast("Amount must be greater than zero", "error");
        return;
    }
    if (parseFloat(amount) > parseFloat(state.balance)) {
        showToast("Insufficient XLM balance", "error");
        return;
    }

    const btn = $("send-btn");
    setBtnState(btn, true, "Preparing...");

    try {
        const sourceAccount = await server.loadAccount(state.userPublicKey);
        const fee = await server.fetchBaseFee();

        const tx = new TransactionBuilder(sourceAccount, {
            fee: fee.toString(),
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(Operation.payment({ destination: receiver, asset: Asset.native(), amount: amount.toString() }))
            .setTimeout(TransactionBuilder.TIMEOUT_INFINITE)
            .build();

        btn.classList.add("btn-loading");
        setBtnState(btn, true, "Waiting for Signature...");
        const signedXDR = await signTransaction(tx.toXDR());

        setBtnState(btn, true, "Broadcasting...");
        const result = await server.submitTransaction(TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET));

        showToast(`Sent ${amount} XLM! <a href="https://stellar.expert/explorer/testnet/tx/${result.hash}" target="_blank" style="color:#818cf8">View on Explorer</a>`, "success", 6000);
        $("payment-form").reset();
        await syncAccountData();
        fetchTransactions();
    } catch (err) {
        console.error("Tx Error:", err);
        showToast(`Transaction failed: ${err?.message || err}`, "error");
    } finally {
        btn.classList.remove("btn-loading");
        setBtnState(btn, false);
    }
}


function setBtnState(btn, loading, text = "") {
    btn.disabled = loading;
    if (loading) {
        btn.innerHTML = `<div class="loading" style="display:flex;align-items:center;gap:8px"><div class="loader" style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></div>${text}</div>`;
    } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span>Send XLM</span>`;
    }
}

// ======================================================
//  COMMUNITY POLL (ON-CHAIN)
// ======================================================

/** Fetch real data from the contract. */
async function refreshPollData(isQuiet = false) {
    if (!isQuiet) {
        $("poll-options").innerHTML = '<div class="skeleton" style="height:60px;margin-bottom:12px"></div>'.repeat(3);
    }
    
    try {
        const optionNames = await getOptions();
        const voteCounts = await getAllVotes();
        
        state.pollData = optionNames.map((name, i) => ({
            id: name,
            name: name,
            votes: voteCounts[name] || 0,
            color: ["accent", "cyan", "purple"][i % 3]
        }));
        
        state.pollLoaded = true;
        state.lastPollUpdate = new Date();
        renderPoll();
    } catch (err) {
        console.error("Poll fetch error:", err);
        showToast("Failed to fetch on-chain poll data", "error");
    }
}

/** Render the poll options UI. */
function renderPoll() {
    const total = state.pollData.reduce((a, b) => a + b.votes, 0);
    const container = $("poll-options");
    if (!container) return;

    // Badge styling
    const badge = `<span class="network-badge" style="margin-left: 10px; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 8px; font-size: 10px;">⛓ On-chain</span>`;
    const title = $("page-poll").querySelector("h3");
    if (title && !title.innerHTML.includes("On-chain")) {
        title.innerHTML += badge;
    }

    container.innerHTML = state.pollData.map((opt) => {
        const pct = total > 0 ? ((opt.votes / total) * 100).toFixed(1) : 0;
        const isVoted = state.votedOption === opt.id;
        return `
            <div class="poll-option ${isVoted ? "voted" : ""}" onclick="window._vote('${opt.id}')">
                <div class="poll-bar" style="width:${pct}%"></div>
                <div class="poll-content">
                    <span class="poll-name">
                        ${opt.name}
                        ${isVoted ? '<span class="voted-badge">✓ You voted</span>' : ""}
                    </span>
                    <div class="poll-stats">
                        <span>${opt.votes} votes</span>
                        <span class="poll-pct">${pct}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    updatePollTimestamp();
    $("dash-total-votes").textContent = total;
}

/** Update the 'Last updated' timestamp label helper. */
function updatePollTimestamp() {
    const el = $("poll-total");
    if (!el || state.currentPage !== "poll") return;
    
    const total = state.pollData.reduce((a, b) => a + b.votes, 0);
    const lastUpdated = Math.round((new Date() - state.lastPollUpdate) / 1000);
    
    el.innerHTML = `
        Total votes: <strong>${total}</strong><br>
        <span id="poll-timer-label" style="font-size: 11px; color: var(--text-muted); margin-top: 8px; display: block;">
            Last updated: ${lastUpdated} seconds ago
        </span>
    `;
}

// Global UI timer for the poll timestamp
setInterval(() => {
    if (state.currentPage === "poll" && state.pollLoaded) {
        updatePollTimestamp();
    }
}, 1000);

/** Global vote handler - now with real on-chain logic. */
window._vote = async (optionId) => {
    if (!state.userPublicKey) {
        showToast("Connect your wallet to vote", "warning");
        return;
    }
    if (state.votedOption) {
        showToast("You have already voted on-chain!", "warning");
        return;
    }
    
    if (state.isProcessing) return;
    state.isProcessing = true;

    // Visual feedback for the specific option
    const optionEl = document.querySelector(`.poll-option[onclick*="'${optionId}'"]`);
    if (optionEl) optionEl.classList.add("processing");

    showToast(`Preparing on-chain vote for ${optionId}...`, "info");
    
    try {
        const txHash = await castVote(optionId, signTransaction, state.userPublicKey);
        
        state.votedOption = optionId;
        await refreshPollData(true);
        
        showToast(`
            <strong>Vote Confirmed!</strong><br>
            Your vote for ${optionId} is now permanent.<br>
            <a href="https://stellar.expert/explorer/testnet/tx/${txHash}" target="_blank" style="color:#818cf8; font-size: 11px;">View on Explorer ↗</a>
        `, "success", 8000);
    } catch (err) {
        console.error("Vote error:", err);
        const msg = err.message || "";
        if (msg.includes("Simulation failed")) {
            showToast("Transaction simulation failed. Check your balance.", "error");
        } else if (msg.includes("timed out")) {
            showToast("Transaction timed out. Please try again.", "error");
        } else if (msg.includes("Already initialized")) {
            showToast("You have already voted on-chain!", "error");
        } else {
            showToast(`Vote failed: ${msg}`, "error");
        }
    } finally {
        if (optionEl) optionEl.classList.remove("processing");
        state.isProcessing = false;
    }
}


// ======================================================
//  TRANSACTION HISTORY
// ======================================================

async function fetchTransactions() {
    if (!state.userPublicKey) return;

    const historyEl = $("history-list");
    historyEl.innerHTML = '<div class="skeleton" style="height:50px;margin-bottom:10px"></div>'.repeat(5);

    try {
        const txs = await server.transactions().forAccount(state.userPublicKey).order("desc").limit(10).call();
        state.transactions = await Promise.all(
            txs.records.map(async (tx) => {
                const ops = await tx.operations();
                const op = ops.records[0];
                const isSent = op?.from === state.userPublicKey;
                return {
                    hash: tx.hash,
                    type: isSent ? "Sent" : "Received",
                    amount: op?.amount || "—",
                    counterparty: isSent ? op?.to : op?.from || "—",
                    date: tx.created_at,
                    isSent,
                };
            })
        );
        localStorage.setItem(CACHE_KEYS.TXS, JSON.stringify(state.transactions));
        renderTransactionList(historyEl);
        renderDashboardTx();

    } catch (err) {
        console.error("History error:", err);
        historyEl.innerHTML = `<div class="empty-state"><p>Could not load transactions</p></div>`;
    }
}

function renderTransactionList(container) {
    if (!state.transactions.length) {
        container.innerHTML = `<div class="empty-state"><p>No transactions found</p></div>`;
        return;
    }
    container.innerHTML = `<ul class="tx-list">${state.transactions.map(renderTxItem).join("")}</ul>`;
}

function renderDashboardTx() {
    const el = $("dash-recent-tx");
    if (!el) return;
    const recent = state.transactions.slice(0, 3);
    if (!recent.length) {
        el.innerHTML = `<div class="empty-state"><p>No transactions yet</p></div>`;
        return;
    }
    el.innerHTML = `<ul class="tx-list">${recent.map(renderTxItem).join("")}</ul>`;
}

function renderTxItem(tx) {
    const arrowUp = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
    const arrowDown = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;

    return `
        <li class="tx-item">
            <div class="tx-icon ${tx.isSent ? "sent" : "received"}">${tx.isSent ? arrowUp : arrowDown}</div>
            <div class="tx-details">
                <div class="tx-type">${tx.type}</div>
                <div class="tx-addr">${truncateAddress(tx.counterparty, 8, 8)}</div>
            </div>
            <div class="tx-meta">
                <div class="tx-amount ${tx.isSent ? "sent" : "received"}">${tx.isSent ? "-" : "+"}${formatNumber(tx.amount, 4)} XLM</div>
                <div class="tx-date">${formatDate(tx.date)}</div>
                <a class="tx-link" href="https://stellar.expert/explorer/testnet/tx/${tx.hash}" target="_blank">Explorer ↗</a>
            </div>
        </li>
    `;
}

// ======================================================
//  NETWORK STATS
// ======================================================

async function fetchNetworkStats() {
    try {
        const res = await fetch(`${HORIZON_URL}/ledgers?order=desc&limit=1`);
        const data = await res.json();
        const ledger = data._embedded?.records?.[0];
        if (ledger) {
            const num = ledger.sequence.toLocaleString();
            const fee = (ledger.base_fee_in_stroops / 10000000).toFixed(5);

            $("ledger-number").textContent = num;
            $("base-fee").textContent = `${fee}`;
            $("dash-ledger").textContent = num;
        }
    } catch (err) {
        console.error("Network stats error:", err);
    }
}

// initialization is handled by bootstrap init() call below


// ======================================================
//  BOOTSTRAP
// ======================================================

init();
