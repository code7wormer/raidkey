import { Address, Hex } from 'viem';

export type SupportedChainId = 11155111 | 84532 | 421614 | 31337;

export interface ChainConfig {
  id: SupportedChainId;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    entryPoint: Address;
    raidDungeon: Address;
    sessionValidator: Address;
    paymaster: Address;
  };
}

export interface SessionKeyData {
  privateKey: Hex;
  address: Address;
  createdAt: number;
  expiresAt: number;
  isRevoked: boolean;
}

export interface SessionPolicy {
  sessionKey: Address;
  targetContract: Address;
  allowedSelectors: Hex[];
  spendLimitEth: string;
  spendLimitWei: bigint;
  validAfter: number;
  validUntil: number;
  nonce: number;
}

export interface SessionAuthorization {
  policy: SessionPolicy;
  masterSignature: Hex;
  signerAddress: Address;
  smartAccountAddress: Address;
  createdAt: number;
}

export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  action: string;
  target: Address;
  selector: string;
  userOpHash: Hex;
  txHash: Hex;
  status: 'PENDING' | 'BUNDLED' | 'SUCCESS' | 'REVOKED' | 'FAILED';
  gasSponsored: boolean;
  gasCostEth: string;
  valueSpentEth: string;
  latencyMs: number;
  details: string;
}

export interface CombatLogItem {
  id: string;
  timestamp: number;
  type: 'ATTACK' | 'SPELL' | 'LOOT' | 'POTION' | 'REVOKE' | 'SYSTEM';
  title: string;
  description: string;
  damage?: number;
  reward?: string;
  userOpHash?: Hex;
}

export interface PlayerInventoryItem {
  id: string;
  name: string;
  tier: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
  icon: string;
  description: string;
  quantity: number;
}

export interface GameState {
  boss: {
    name: string;
    maxHp: number;
    currentHp: number;
    killCount: number;
    isAlive: boolean;
  };
  player: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    raidTokens: number;
    xp: number;
    level: number;
    inventory: PlayerInventoryItem[];
  };
}
