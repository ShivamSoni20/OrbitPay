/**
 * Wallet integration module using Stellar Wallets Kit v2.
 * @module wallet
 * Provides connect, disconnect, sign, and address management.
 */

import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";

/** Initialize the Wallet Kit with all supported modules. */
export function initWalletKit() {
    StellarWalletsKit.init({
        network: Networks.TESTNET,
        modules: [
            new FreighterModule(),
            new xBullModule(),
            new AlbedoModule(),
            new HanaModule(),
        ],
    });
}

/**
 * Open the wallet authentication modal and return the connected address.
 * @returns {Promise<string>} The user's public key.
 * @throws {Object} Error with code and message if user cancels or wallet fails.
 */
export async function connectWallet() {
    const { address } = await StellarWalletsKit.authModal();
    return address;
}

/**
 * Disconnect the current wallet session.
 */
export function disconnectWallet() {
    StellarWalletsKit.disconnect();
}

/**
 * Get the currently cached address from the kit.
 * @returns {Promise<string>} The user's public key.
 */
export async function getAddress() {
    const { address } = await StellarWalletsKit.getAddress();
    return address;
}

/**
 * Sign a transaction XDR string using the connected wallet.
 * @param {string} xdr - The transaction XDR to sign.
 * @returns {Promise<string>} The signed transaction XDR.
 */
export async function signTransaction(xdr) {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr);
    return signedTxXdr;
}
