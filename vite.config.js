import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          stellar: ["stellar-sdk", "@stellar/stellar-sdk"],
          wallets: ["@creit.tech/stellar-wallets-kit", "@stellar/freighter-api"]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
