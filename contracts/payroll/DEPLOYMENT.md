# PayrollContract Deployment Notes

Status: deployed to Stellar testnet.

Contract ID: `CCIWIPCHBABIXHAPJWDTMVNPLU2OSOKQ4NYHHHWR7HKLYAUMPACYWNNH`

Deployment transaction: `86aed8563e4f8b148eddbc8445b4cddc8e0e3965d95e5c90b658a98f29f64381`

Initialization transaction: `33328a4e288bf3c64e55e43a030b342495224ee643e1e2ac072bd37d8664960d`

Smoke test stream creation transaction: `ccd4ba7b35adae5f5da910c753f0f0cc775c3cce04a0f5b60a75affb0e4b16a2`

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
```

## Deploy

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source <ADMIN_IDENTITY> \
  --network testnet
```

## Initialize

```bash
stellar contract invoke \
  --id <PAYROLL_CONTRACT_ID> \
  --source <ADMIN_IDENTITY> \
  --network testnet \
  -- initialize \
  --admin <ADMIN_PUBLIC_KEY>
```

After deployment, replace `PAYROLL_CONTRACT_ID_PENDING_DEPLOYMENT` in `js/payroll.js` and update the README transaction hash table.
