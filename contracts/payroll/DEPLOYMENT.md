# PayrollContract Deployment Notes

Status: pending testnet deployment by the project admin wallet.

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
