import { ChainConfig } from './types';

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  11155111: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://rpc.ankr.com/eth_sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    contracts: {
      entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      raidDungeon: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      sessionValidator: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      paymaster: '0x000000000009B901De27D160e189322986367503',
    },
  },
};

export const DEFAULT_CHAIN_ID = 11155111;
