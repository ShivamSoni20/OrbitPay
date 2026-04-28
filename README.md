# OrbitPay Pro | Decentralized Payroll on Stellar

![Stellar](https://img.shields.io/badge/Network-Stellar%20Testnet-blue?style=flat-square)
![Soroban](https://img.shields.io/badge/Contracts-Soroban-purple?style=flat-square)
![Vite](https://img.shields.io/badge/Build-Vite%205-yellow?style=flat-square)
![Level](https://img.shields.io/badge/Challenge-Blue%20Belt%20Level%205-blue?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-9%2B%20tests-brightgreen?style=flat-square)
[![CI](https://github.com/ShivamSoni20/OrbitPay/actions/workflows/ci.yml/badge.svg)](https://github.com/ShivamSoni20/OrbitPay/actions/workflows/ci.yml)

OrbitPay Pro is a Stellar testnet MVP for decentralized payroll and streaming payments. It extends the existing OrbitPay dApp with an OBT mint faucet, a new Soroban payroll contract, payroll admin and recipient dashboards, and architecture documentation for the Blue Belt Level 5 challenge.

## Feedback Sheet

Exported Google Sheets feedback log: [OrbitPay Pro User Feedback Sheet](https://docs.google.com/spreadsheets/d/1CxMCo74gmzETjGiJ2NciYFFQdYkyiKR8QjTb4WagH2M/edit?usp=sharing)

## User Feedback Log

| Timestamp | Email Address | Full Name | Wallet Address | Features Tested | Improvement Suggestions / Further Comments |
|---|---|---|---|---|---|
| 4/28/2026 16:07:29 | `raikwarnikhil80@gmail.com` | Nikhil Raikwar | `GAJHOO56GZEXDWA3ZV2YAM2A7O6OBC6573TFSYKILIFGZIH73VTYV5MO` | Connect Wallet, Mint OBT Tokens (Faucet), View Transaction History | The faucet test failed for me. After connecting, the console showed `Error fetching token balance: Error: Unsupported address type: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3`. When I clicked mint, it also showed `OBT mint error: Error: Unsupported address type: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3`. It feels like the OBT contract address or token contract integration is not being parsed correctly. |
| 4/28/2026 17:22:59 | `raikwarsumit19@gmail.com` | Sumit Raikwar | `GDT3GWRHHJZNUGDKATBFMTDOEGI6N54SOQHUOAFHROABY733X5ZMZKC2` | Connect Wallet, On-chain Voting Poll, View Transaction History | I connected successfully, but the poll feature did not work. The console repeatedly showed `Error fetching options: TypeError: Bad union switch: 1` and later `Error fetching votes for Tokens, NFTs, and DeFi` with the same error. When I tried voting, it also failed with `Vote error: TypeError: Bad union switch: 1`. The wallet connection looked fine, but the on-chain poll flow seems broken. |
| 4/28/2026 17:47:16 | `aelixai1@gmail.com` | aelix | `GCGEZFTWUGFEFBYWANLSCDND6LCNIZEUBGO7ZWMP3BZSSW7QPCKAKMQJ` | Connect Wallet, Create Payroll Stream (Admin), On-chain Voting Poll | Wallet connection worked, but creating a payroll stream failed. The console showed `Create payroll stream error: Error: Unsupported address type: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3` when submitting the payroll form. I also saw `Vote error: Object` during poll testing in this build. The payroll issue looks like the app is still using an outdated token contract address when building the stream transaction. |
| 4/28/2026 17:51:48 | `codehonors18@gmail.com` | aman garg | `GDY4UW4N2TWHB4GNHV2PKELQCJ5P24VWO6Z7XEP6DQ4MNMJ7TH3CRLEV` | UI: landing page and dashboard page | The sidebar on dashboard doesn't work accordingly and also the UI was not responsive. |
| 4/28/2026 17:55:32 | `kratikajain012@gmail.com` | Kratika Jain | `GAJEEFOZ52K3BWLBERX5E5PCOLPW6RSZBY3H5LFHMTUNFZQJBGQHEBL3` | Connect Wallet, Send XLM or OBT Payment, On-chain Voting Poll, View Transaction History | Everything look good and smoothly working. |
| 4/28/2026 17:57:54 | `jainamber758@gmail.com` | Amber Jain | `GD3FRBMXOCKK3DHWVOXD2CPE33B4W6WERNYTP2L6U743B3FS54GX6XUC` | Connect Wallet, Mint OBT Tokens (Faucet), Send XLM or OBT Payment, Create Payroll Stream (Admin), Claim Payroll Payment (Recipient), On-chain Voting Poll, View Transaction History | Everything good. |
| 4/28/2026 18:02:48 | `shrivastavatanay22@gmail.com` | Tanay Shrivastava | `GA2HQHLCUHXOTLUE4GXOFZBOB5WS6Q4YCHMGIUYBCGNFDYHQFZUBDOY4` | Connect Wallet, Mint OBT Tokens (Faucet), Send XLM or OBT Payment, Create Payroll Stream (Admin), Claim Payroll Payment (Recipient) | Everything is good. |

## Live Demo

Live demo placeholder: `https://your-orbitpay-pro-demo.example`

Demo video: [OrbitPay Pro Blue Belt Demo](https://youtu.be/-pWromTsNZ4)

## Level 5 Checklist

| Requirement | Status |
|---|---|
| Public GitHub repository | Ready |
| Working MVP | Ready on Stellar Testnet |
| 10+ meaningful commits | Completed |
| Architecture document | `ARCHITECTURE.md` |
| 5+ testnet users | Completed with 7 feedback entries below |
| Feedback documentation | Completed with Google Form sheet and feedback log below |
| One feedback-driven iteration | Completed with linked fix commits below |

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

Verified testnet user wallets collected during OrbitPay Pro MVP feedback:

| User | Wallet Address | Source |
|---|---|
| Nikhil Raikwar | `GAJHOO56GZEXDWA3ZV2YAM2A7O6OBC6573TFSYKILIFGZIH73VTYV5MO` | Google Form |
| Sumit Raikwar | `GDT3GWRHHJZNUGDKATBFMTDOEGI6N54SOQHUOAFHROABY733X5ZMZKC2` | Google Form |
| aelix | `GCGEZFTWUGFEFBYWANLSCDND6LCNIZEUBGO7ZWMP3BZSSW7QPCKAKMQJ` | Google Form |
| aman garg | `GDY4UW4N2TWHB4GNHV2PKELQCJ5P24VWO6Z7XEP6DQ4MNMJ7TH3CRLEV` | Google Form |
| Kratika Jain | `GAJEEFOZ52K3BWLBERX5E5PCOLPW6RSZBY3H5LFHMTUNFZQJBGQHEBL3` | Google Form |
| Amber Jain | `GD3FRBMXOCKK3DHWVOXD2CPE33B4W6WERNYTP2L6U743B3FS54GX6XUC` | Google Form |
| Tanay Shrivastava | `GA2HQHLCUHXOTLUE4GXOFZBOB5WS6Q4YCHMGIUYBCGNFDYHQFZUBDOY4` | Google Form |

## Feedback

Google Form onboarding and feedback collection was used to gather wallet address, email, name, and product feedback from testnet users.

Feedback spreadsheet: [OrbitPay Pro User Feedback Sheet](https://docs.google.com/spreadsheets/d/1CxMCo74gmzETjGiJ2NciYFFQdYkyiKR8QjTb4WagH2M/edit?usp=sharing)

## Feedback-Driven Improvements

The following production fixes were implemented directly from user-reported issues:

| Feedback | Improvement | Commit |
|---|---|---|
| Nikhil reported the faucet and token balance failing with `Unsupported address type: CDLZ...` | Reworked Soroban token invocation to use the SDK `Contract` wrapper and then enabled a public 1,000 OBT faucet flow on the new deployed token contract | [9bd69aa](https://github.com/ShivamSoni20/OrbitPay/commit/9bd69aa), [2791e08](https://github.com/ShivamSoni20/OrbitPay/commit/2791e08) |
| Sumit reported poll reads and voting failing with `Bad union switch: 1` | Repaired frontend poll contract calls to use the correct contract call path and verified on testnet | [de5d688](https://github.com/ShivamSoni20/OrbitPay/commit/de5d688) |
| aelix reported payroll stream creation failing with `Unsupported address type: CDLZ...` | Repaired payroll token contract resolution and switched payroll contract calls to the SDK `Contract` wrapper | [31fac85](https://github.com/ShivamSoni20/OrbitPay/commit/31fac85) |
| aman garg reported the dashboard sidebar behaving incorrectly on mobile and the UI not feeling responsive | Stabilized mobile sidebar behavior, added an in-sidebar close button, and tightened the responsive layout | [5dbcb8e](https://github.com/ShivamSoni20/OrbitPay/commit/5dbcb8e) |
| Kratika Jain, Amber Jain, and Tanay Shrivastava reported that the main MVP flows were working smoothly | No urgent fix required; this feedback validated the post-fix MVP experience and current UX direction | N/A |

## Next Iteration Plan

Based on the collected feedback, the next product iteration will focus on:

1. replacing placeholder demo links and remaining placeholder transaction hashes with final submission artifacts
2. adding a clearer first-time onboarding flow for mint, payroll creation, and claim actions
3. expanding responsive QA across more mobile viewport sizes and wallet extension combinations
4. adding deeper on-chain regression tests for poll, faucet, and payroll flows after each deployment

## Contracts and Transactions

| Item | Value |
|---|---|
| Network | Stellar Testnet |
| Poll Contract ID | `CAKINUZ4GVF6IB56H26YCJ64OUHJNXZMXWF3SXNLO6PQYYGYIGRS52UC` |
| OBT Token Contract ID | `CDPDVYCGGNEDQYJRM3NJH5PUOI4YRTD2C5CEW6AHIJMPEOK43LWO262Q` |
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
