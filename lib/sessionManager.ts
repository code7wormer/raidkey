import { 
  generatePrivateKey, 
  privateKeyToAccount 
} from 'viem/accounts';
import { 
  Address, 
  Hex, 
  parseEther,
  hashTypedData
} from 'viem';
import { SessionKeyData, SessionPolicy, SessionAuthorization } from './types';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from './chains';
// Inline game function selectors (keccak256 prefix of ABI signatures)
const GAME_SELECTORS = {
  attackBoss: '0xa0a3a71b' as Hex,
  castSpell: '0xb2e09304' as Hex,
  openLootChest: '0xf71510aa' as Hex,
  drinkPotion: '0x15eeeb24' as Hex,
  buyPotion: '0x19df7cb8' as Hex,
} as const;

const SESSION_STORAGE_KEY = 'raidkey_active_session';
const SESSION_AUTH_KEY = 'raidkey_active_auth';

export async function ensureSepoliaNetwork(): Promise<number> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return DEFAULT_CHAIN_ID;
  }

  const ethereum = (window as any).ethereum;
  try {
    const currentChainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(currentChainIdHex, 16);

    // If already on Sepolia or local chain, return it
    if (currentChainId === 11155111 || currentChainId === 84532 || currentChainId === 31337) {
      return currentChainId;
    }

    // Try switching to Sepolia (0xaa36a7)
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      return 11155111;
    } catch (switchError: any) {
      // If Sepolia isn't added to MetaMask (error code 4902), add it
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org', 'https://rpc.ankr.com/eth_sepolia'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
        return 11155111;
      }
      // If user declined network switch, fallback to the current active chainId
      return currentChainId;
    }
  } catch (err) {
    console.warn('Network switch detection error, using active chain:', err);
    return DEFAULT_CHAIN_ID;
  }
}

export function createEphemeralSessionKey(expiryMinutes: number = 30): SessionKeyData {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiryMinutes * 60;

  const sessionData: SessionKeyData = {
    privateKey,
    address: account.address,
    createdAt: now,
    expiresAt,
    isRevoked: false,
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }

  return sessionData;
}

export function getActiveEphemeralSession(): SessionKeyData | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const data: SessionKeyData = JSON.parse(stored);
    const now = Math.floor(Date.now() / 1000);
    if (data.expiresAt <= now || data.isRevoked) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function buildSessionPolicy(
  sessionKeyAddress: Address,
  targetContract: Address,
  spendLimitEth: string = '0.05',
  expiryMinutes: number = 30,
  nonce: number = 0
): SessionPolicy {
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now - 60;
  const validUntil = now + expiryMinutes * 60;
  const spendLimitWei = parseEther(spendLimitEth);

  const allowedSelectors: Hex[] = [
    GAME_SELECTORS.attackBoss,
    GAME_SELECTORS.castSpell,
    GAME_SELECTORS.openLootChest,
    GAME_SELECTORS.drinkPotion,
    GAME_SELECTORS.buyPotion,
  ];

  return {
    sessionKey: sessionKeyAddress,
    targetContract,
    allowedSelectors,
    spendLimitEth,
    spendLimitWei,
    validAfter,
    validUntil,
    nonce,
  };
}

export const EIP712_SESSION_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  SessionPolicy: [
    { name: 'sessionKey', type: 'address' },
    { name: 'targetContract', type: 'address' },
    { name: 'spendLimit', type: 'uint256' },
    { name: 'validAfter', type: 'uint48' },
    { name: 'validUntil', type: 'uint48' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export async function signSessionPolicyWithMaster(
  policy: SessionPolicy,
  masterAddress: Address,
  chainId: number = DEFAULT_CHAIN_ID,
  smartAccountAddress: Address,
  useInjectedWallet: boolean = false
): Promise<SessionAuthorization> {
  // Ensure network alignment with MetaMask
  let activeChainId = chainId;
  if (useInjectedWallet && typeof window !== 'undefined' && (window as any).ethereum) {
    activeChainId = await ensureSepoliaNetwork();
  }

  const chainConfig = SUPPORTED_CHAINS[activeChainId] || SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
  
  const domain = {
    name: 'RaidKeySessionValidator',
    version: '1',
    chainId: activeChainId,
    verifyingContract: chainConfig.contracts.sessionValidator,
  };

  const message = {
    sessionKey: policy.sessionKey,
    targetContract: policy.targetContract,
    spendLimit: policy.spendLimitWei.toString(),
    validAfter: policy.validAfter,
    validUntil: policy.validUntil,
    nonce: policy.nonce,
  };

  let masterSignature: Hex;

  if (useInjectedWallet && typeof window !== 'undefined' && (window as any).ethereum) {
    const ethereum = (window as any).ethereum;
    const typedData = JSON.stringify({
      types: EIP712_SESSION_TYPES,
      primaryType: 'SessionPolicy',
      domain,
      message,
    });

    masterSignature = await ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [masterAddress, typedData],
    });
  } else {
    // Demo Master account signature simulation
    const digest = hashTypedData({
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: BigInt(domain.chainId),
        verifyingContract: domain.verifyingContract,
      },
      types: {
        SessionPolicy: EIP712_SESSION_TYPES.SessionPolicy,
      },
      primaryType: 'SessionPolicy',
      message: {
        sessionKey: policy.sessionKey,
        targetContract: policy.targetContract,
        spendLimit: policy.spendLimitWei,
        validAfter: policy.validAfter,
        validUntil: policy.validUntil,
        nonce: BigInt(policy.nonce),
      },
    });
    masterSignature = `0x${'a1b2c3d4'.repeat(16)}1b` as Hex;
  }

  const auth: SessionAuthorization = {
    policy,
    masterSignature,
    signerAddress: masterAddress,
    smartAccountAddress,
    createdAt: Math.floor(Date.now() / 1000),
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(auth, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
  }

  return auth;
}

export function getActiveSessionAuthorization(): SessionAuthorization | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(SESSION_AUTH_KEY);
  if (!stored) return null;
  try {
    const raw = JSON.parse(stored);
    return {
      ...raw,
      policy: {
        ...raw.policy,
        spendLimitWei: BigInt(raw.policy.spendLimitWei || '0'),
      }
    };
  } catch {
    return null;
  }
}

export function revokeActiveSession(): void {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const data: SessionKeyData = JSON.parse(stored);
      data.isRevoked = true;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    }
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
