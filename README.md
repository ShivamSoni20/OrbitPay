# Stellar Payment dApp - White Belt Challenge

A professional, minimal, and fully functional decentralized application (dApp) built for the **Stellar White Belt Challenge**. This application allows users to interact with the Stellar Testnet using their Freighter wallet.

## 🚀 Features
- **Wallet Detection**: Automatically detects if the Freighter extension is installed.
- **Secure Connection**: Connects and disconnects securely using the Freighter Wallet API.
- **Real-time Balance**: Fetches and displays the XLM balance from the Stellar Horizon Testnet server.
- **Payments**: Builds, signs, and submits XLM payment transactions to the Stellar network.
- **Transaction Feedback**: Provides clear loading states, success messages with transaction hashes, and detailed error handling.
- **Testnet Explorer Integration**: Direct links to view transactions on [Stellar.Expert](https://stellar.expert).

## 🛠️ Tech Stack
- **HTML5 & CSS3**: Modern styling with custom glassmorphism and professional typography (Outfit font).
- **JavaScript (ES6+)**: Modular and clean code structure.
- **Stellar SDK**: For building transactions and communicating with Horizon.
- **Freighter API**: For secure transaction signing.
- **Vite**: Modern frontend build tool for a fast development experience.
- **Horizon Server**: [https://horizon-testnet.stellar.org](https://horizon-testnet.stellar.org)

## 📦 Setup & Installation

### Prerequisites
1. [Node.js](https://nodejs.org/) (v16 or higher recommended).
2. [Freighter Wallet](https://www.freighter.app/) extension installed in your chromium browser.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/stellar-payment-dapp.git
   cd stellar-payment-dapp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open the displayed URL (usually `http://localhost:5173`) in your browser.

## 💡 How to Use

### 1. Connect Wallet
- Set your Freighter wallet network to **Testnet** in settings.
- Click the **Connect Wallet** button in the dApp.
- Approve the access request in the Freighter popup.
- Your public address and XLM balance will appear.

### 2. Fund Your Account (If needed)
- If your balance is 0, copy your public key.
- Go to the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=testnet).
- Paste your address and click "Get test network XLM".

### 3. Send a Payment
- Enter a valid Stellar Testnet receiver address.
- Enter the amount of XLM to send.
- Click **Send XLM**.
- Confirm and sign the transaction in the Freighter popup.
- Wait for the success message and view your transaction on the explorer!

## 📸 Final Screenshots (Placeholders)
*Note: Please replace these with actual screenshots of your running application.*

1. **Wallet Connected State**: Shows public address and connect/disconnect flow.
2. **Balance Displayed**: Shows real-time XLM balance fetched from Horizon.
3. **Transaction Form**: Shows the receiver address and amount input fields.
4. **Successful Transaction**: Shows the success message and transaction hash link.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
