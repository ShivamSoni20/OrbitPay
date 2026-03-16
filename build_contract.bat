@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat" x64 >nul 2>nul
cd /d "d:\Gihtub Main\OrbitPay\stellar-payment-dapp\contracts\poll"
cargo build --target wasm32-unknown-unknown --release 2>&1
