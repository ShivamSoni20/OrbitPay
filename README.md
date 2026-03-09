# OrbitPay - Stellar Payment dApp

OrbitPay is a professional, minimal, and fully functional decentralized application (dApp) built for the **Stellar White Belt Challenge**. It provides a seamless experience for users to interact with the Stellar Testnet using their Freighter wallet.

## 🚀 Features
- **Wallet Detection**: Automatically detects if the Freighter extension is installed and active.
- **Secure Connection**: Connects and disconnects securely using the Freighter Wallet API with robust state management.
- **Real-time Balance**: Fetches and displays the XLM balance directly from the Stellar Horizon Testnet server.
- **Simplified Payments**: Build, sign, and submit XLM payments to the Stellar network with validation.
- **Instant Feedback**: Clear loading states, success messages with transaction hashes, and user-friendly error handling.
- **Explorer Integration**: Direct links to view transactions on [Stellar.Expert](https://stellar.expert).

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3 (Outfit Font, Glassmorphism UI)
- **Logic**: Modern JavaScript (Modular ES6)
- **Blockchain**: Stellar SDK, Freighter Wallet API
- **Network**: Stellar Testnet Horizon ([https://horizon-testnet.stellar.org](https://horizon-testnet.stellar.org))
- **Build Tool**: Vite

## 📦 Setup & Installation

### Prerequisites
1. [Node.js](https://nodejs.org/) (v16+)
2. [Freighter Wallet](https://www.freighter.app/) extension installed.

### How to Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/ShivamSoni20/OrbitPay.git
   cd stellar-payment-dapp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 💡 How to Connect & Send Transactions

### 1. Connect Freighter Wallet
- Set Freighter to **Testnet** in settings.
- Click **Connect Wallet** and approve the "Request Access" popup.
- Your public address and XLM balance will be displayed automatically.

### 2. Send a Testnet Transaction
- Enter the **Receiver Address** (Standard G... address).
- Enter the **Amount** in XLM.
- Click **Send XLM** and approve the transaction in the Freighter popup.
- The UI will show a "Confirming..." state followed by a success message with the transaction hash.

## 📸 Screenshots

### 1. Wallet Connected State
*Shows the UI once the Freighter wallet is successfully linked.*
![Wallet Connected](https://github.com/ShivamSoni20/OrbitPay/raw/main/screenshots/connected.png)

### 2. Balance Displayed
*Shows the real-time XLM balance fetched from the Horizon server.*
![Balance Display](https://github.com/ShivamSoni20/OrbitPay/raw/main/screenshots/balance.png)

### 3. Successful Testnet Transaction
*The confirmation message showing the transaction was successful.*
![Success Message](https://github.com/ShivamSoni20/OrbitPay/raw/main/screenshots/success.png)

### 4. Transaction Result & Hash
*The final state showing the transaction hash and a link to the Stellar explorer.*
![Transaction Hash](https://github.com/ShivamSoni20/OrbitPay/raw/main/screenshots/hash.png)

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
