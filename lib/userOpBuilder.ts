import { 
  Address, 
  Hex, 
  encodeAbiParameters, 
  keccak256, 
  encodePacked, 
  toHex, 
  concat, 
  encodeFunctionData,
  parseEther 
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { UserOperation, SessionAuthorization, SessionKeyData } from './types';
import { RAID_DUNGEON_ABI } from './contracts';

export function buildExecutionCallData(
  target: Address,
  value: bigint,
  innerCallData: Hex
): Hex {
  // Encodes standard Smart Account execute(target, value, data) call
  // execute(address dest, uint256 value, bytes calldata func)
  const EXECUTE_SELECTOR = '0xb61d27f6'; // keccak256("execute(address,uint256,bytes)")[:4]
  
  const encodedParams = encodeAbiParameters(
    [
      { name: 'dest', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'func', type: 'bytes' },
    ],
    [target, value, innerCallData]
  );

  return concat([EXECUTE_SELECTOR as Hex, encodedParams]);
}

export function computeUserOpHash(
  userOp: Omit<UserOperation, 'signature'>,
  entryPoint: Address,
  chainId: number
): Hex {
  const packedUserOp = encodeAbiParameters(
    [
      { name: 'sender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'hashInitCode', type: 'bytes32' },
      { name: 'hashCallData', type: 'bytes32' },
      { name: 'callGasLimit', type: 'uint256' },
      { name: 'verificationGasLimit', type: 'uint256' },
      { name: 'preVerificationGas', type: 'uint256' },
      { name: 'maxFeePerGas', type: 'uint256' },
      { name: 'maxPriorityFeePerGas', type: 'uint256' },
      { name: 'hashPaymasterAndData', type: 'bytes32' },
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      keccak256(userOp.paymasterAndData),
    ]
  );

  const enc = encodeAbiParameters(
    [
      { name: 'userOpHash', type: 'bytes32' },
      { name: 'entryPoint', type: 'address' },
      { name: 'chainId', type: 'uint256' },
    ],
    [keccak256(packedUserOp), entryPoint, BigInt(chainId)]
  );

  return keccak256(enc);
}

export async function signUserOpWithSessionKey(
  userOp: Omit<UserOperation, 'signature'>,
  sessionKey: SessionKeyData,
  auth: SessionAuthorization,
  entryPoint: Address,
  chainId: number
): Promise<UserOperation> {
  const sessionSigner = privateKeyToAccount(sessionKey.privateKey);
  const userOpHash = computeUserOpHash(userOp, entryPoint, chainId);

  // Sign the UserOp hash directly using ephemeral session key
  const sessionSig = await sessionSigner.signMessage({
    message: { raw: userOpHash },
  });

  // Pack composite signature:
  // [Session Validator Module Marker] + [Master Authorization Signature] + [Session Key Signature] + [Policy Metadata]
  const compositeSignature = encodeAbiParameters(
    [
      { name: 'sessionKey', type: 'address' },
      { name: 'validUntil', type: 'uint48' },
      { name: 'validAfter', type: 'uint48' },
      { name: 'spendLimit', type: 'uint256' },
      { name: 'masterSig', type: 'bytes' },
      { name: 'sessionSig', type: 'bytes' },
    ],
    [
      sessionKey.address,
      auth.policy.validUntil,
      auth.policy.validAfter,
      auth.policy.spendLimitWei,
      auth.masterSignature,
      sessionSig,
    ]
  );

  return {
    ...userOp,
    signature: compositeSignature,
  };
}
