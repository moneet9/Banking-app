// ============================================================================
// Wagmi Configuration for Web3 Integration
// ============================================================================

import { http, createConfig } from 'wagmi';
import { sepolia, polygonMumbai, goerli } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

// ============================================================================
// Wagmi Config
// ============================================================================

export const config = createConfig({
  chains: [sepolia, polygonMumbai, goerli],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Web3 Chat dApp',
        url: typeof window !== 'undefined' ? window.location.origin : '',
      },
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [goerli.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
