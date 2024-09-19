# Spyre JS SDK

A typescript and react module for building games on Spyre. This library provides a simple interface for interaction between the `Thirdweb SDK`, `TanStack Query`, `Nakama SDK`, and Spyre-specific hooks for game wallet interaction.

### Quickstart

```ts
import { SpyreClientProvider } from "@spyre-io/js";

function Example() {
 return (
   <SpyreClientProvider
    config={{
      thirdweb: {
        clientId: "Thirdweb Client Id",
        metadata: {}, // thirdweb app metadata
      },
      name: "Base Mainnet",
      chainId: 8453,
      contracts: {
        staking: { addr: "Game Wallet Address" },
        usdc: { addr: "USDC Address" },
      },
      network: base,
      blockExplorer: 'https://basescan.org',
    }}>
     <App />
  </SpyreClientProvider>
  );
}
```

### Development Quickstart

```
pnpm install
pnpm dev
```
