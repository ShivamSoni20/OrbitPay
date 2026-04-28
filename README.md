# OrbitPay Pro | Decentralized Payroll on Stellar

![Stellar](https://img.shields.io/badge/Network-Stellar%20Testnet-blue?style=flat-square)
![Soroban](https://img.shields.io/badge/Contracts-Soroban-purple?style=flat-square)
![Vite](https://img.shields.io/badge/Build-Vite%205-yellow?style=flat-square)
![Level](https://img.shields.io/badge/Challenge-Blue%20Belt%20Level%205-blue?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-9%2B%20tests-brightgreen?style=flat-square)

OrbitPay Pro is a Stellar testnet MVP for decentralized payroll and streaming payments. It extends the existing OrbitPay dApp with an OBT mint faucet, a new Soroban payroll contract, payroll admin and recipient dashboards, and architecture documentation for the Blue Belt Level 5 challenge.

## Live Demo

Live demo placeholder: `https://your-orbitpay-pro-demo.example`

Demo video placeholder: `https://your-demo-video-link.example`

## Level 5 Checklist

| Requirement | Status |
|---|---|
| Public GitHub repository | Ready |
| Working MVP | Ready after PayrollContract testnet deployment |
| 10+ meaningful commits | Prepared in this branch |
| Architecture document | `ARCHITECTURE.md` |
| 5+ testnet users | Placeholder below |
| Feedback documentation | Placeholder below |
| One feedback-driven iteration | Placeholder below |

## Features

| Feature | Description |
|---|---|
| Multi-wallet connect | Freighter, xBull, Albedo, and Hana via StellarWalletsKit |
| OBT token faucet | Dashboard button mints 1,000 OBT to the connected wallet |
| OBT transfers | Send and track custom OrbitToken payments |
| Payroll streams | Admin creates recipient, amount, token, and duration-based streams |
| Recipient claims | Recipient sees claimable balance and claims streamed pay |
| Admin controls | Pause, resume, and cancel stream controls |
| On-chain poll | Existing Soroban voting flow with inter-contract OBT balance check |
| CI and tests | Vitest suite covering utilities, UI, contracts, token, faucet, and payroll |

## Testnet Users

Replace these placeholders with real wallet addresses from your 5+ testnet users:

| User | Wallet Address |
|---|---|
| User 1 | `G...` |
| User 2 | `G...` |
| User 3 | `G...` |
| User 4 | `G...` |
| User 5 | `G...` |

## Feedback

Google Form placeholder: `https://forms.gle/your-form`

Exported feedback sheet placeholder: `https://docs.google.com/spreadsheets/d/your-sheet`

## Feedback-Driven Improvements

Add one completed iteration after user feedback. Include commit links when the commits are pushed:

| Feedback | Improvement | Commit |
|---|---|---|
| Placeholder: users wanted clearer claim state | Disabled claim button when claimable balance is 0 | `https://github.com/<owner>/<repo>/commit/<sha>` |
| Placeholder: users wanted easier test tokens | Added 1,000 OBT mint faucet | `https://github.com/<owner>/<repo>/commit/<sha>` |

## Contracts and Transactions

| Item | Value |
|---|---|
| Network | Stellar Testnet |
| Poll Contract ID | `CAKINUZ4GVF6IB56H26YCJ64OUHJNXZMXWF3SXNLO6PQYYGYIGRS52UC` |
| OBT Token Contract ID | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3` |
| Payroll Contract ID | `CCIWIPCHBABIXHAPJWDTMVNPLU2OSOKQ4NYHHHWR7HKLYAUMPACYWNNH` |
| OBT Faucet Mint Tx | `PASTE_TX_HASH_AFTER_MINT` |
| Payroll Contract Deploy Tx | `86aed8563e4f8b148eddbc8445b4cddc8e0e3965d95e5c90b658a98f29f64381` |
| Payroll Contract Initialize Tx | `33328a4e288bf3c64e55e43a030b342495224ee643e1e2ac072bd37d8664960d` |
| Payroll Stream Create Tx | `ccd4ba7b35adae5f5da910c753f0f0cc775c3cce04a0f5b60a75affb0e4b16a2` |
| Payroll Claim Tx | `PASTE_CLAIM_TX_HASH` |

## Setup

```bash
npm install
npm run test
npm run dev
```

## Build

```bash
npm run build
```

## Soroban Contract Deployment

Install and configure the Stellar CLI, then build the contracts:

```bash
cargo build --target wasm32-unknown-unknown --release
```

Deploy PayrollContract:

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source <ADMIN_IDENTITY> \
  --network testnet
```

Initialize PayrollContract:

```bash
stellar contract invoke \
  --id <PAYROLL_CONTRACT_ID> \
  --source <ADMIN_IDENTITY> \
  --network testnet \
  -- initialize \
  --admin <ADMIN_PUBLIC_KEY>
```

The current PayrollContract deployment is already configured in `js/payroll.js`. Redeploying requires replacing that ID and updating the transaction hash table above.

## Project Structure

```text
OrbitPay/
|-- app.js
|-- index.html
|-- style.css
|-- ARCHITECTURE.md
|-- js/
|   |-- wallet.js
|   |-- token.js
|   |-- payroll.js
|   |-- contract.js
|   |-- toast.js
|   `-- utils.js
|-- contracts/
|   |-- token/
|   |-- poll/
|   `-- payroll/
`-- tests/
    |-- utils.test.js
    |-- ui.test.js
    |-- token.test.js
    |-- contract.test.js
    `-- payroll.test.js
```

## Architecture

See `ARCHITECTURE.md` for the system overview, contract interaction flow, frontend component tree, and PayrollContract to OBT TokenContract data flow.

## Screenshots

Existing OrbitPay screenshots are stored in `assets/`:

| View | File |
|---|---|
| Landing | `assets/landing.png` |
| Dashboard | `assets/dashboard.png` |
| Poll | `assets/poll.png` |

## License

MIT
