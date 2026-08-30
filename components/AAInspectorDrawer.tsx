'use client';

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  Key, 
  FileCode, 
  CheckCircle2, 
  Layers, 
  Copy, 
  Check,
} from 'lucide-react';
import { SessionAuthorization, SessionKeyData, ExecutionLog } from '@/lib/types';
import { Address } from 'viem';

interface AAInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionAuth: SessionAuthorization | null;
  sessionKey: SessionKeyData | null;
  selectedLog: ExecutionLog | null;
  smartAccount: Address;
  masterSigner: Address;
  spentEth: string;
}

export const AAInspectorDrawer: React.FC<AAInspectorDrawerProps> = ({
  isOpen,
  onClose,
  sessionAuth,
  sessionKey,
  selectedLog,
  smartAccount,
  masterSigner,
  spentEth,
}) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'userop' | 'architecture'>('policy');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleUserOp: any = selectedLog ? {
    sender: smartAccount,
    nonce: "0x01",
    initCode: "0x",
    callData: `0xb61d27f6...${selectedLog.selector.replace('0x', '')}`,
    callGasLimit: "0x186a0",
    verificationGasLimit: "0x249f0",
    preVerificationGas: "0xc350",
    maxFeePerGas: "0x3b9aca00",
    maxPriorityFeePerGas: "0x3b9aca00",
    paymasterAndData: "0x000000000009b901de27d160e189322986367503...fe7c88121b",
    signature: sessionKey ? `0x${sessionKey.address.slice(2)}...${sessionAuth?.masterSignature?.slice(2, 20)}` : "0x",
  } : {
    info: "Execute any action in the arena to inspect live UserOperation fields."
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm animate-fadeIn flex justify-end font-sans">
      <div className="relative w-full max-w-xl bg-bg-elevated border-l border-border-default h-full flex flex-col shadow-modal overflow-hidden text-text-primary">
        
        {/* Header */}
        <div className="p-4 border-b border-border-default bg-bg-secondary/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-bg-elevated text-text-primary border border-border-default shadow-sm">
              <Cpu className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Account Abstraction Inspector
              </h2>
              <p className="text-xs text-text-tertiary">
                ERC-4337 Session Keys, Scoped Policies & Gas Sponsorship
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-bg-elevated hover:bg-bg-secondary border border-border-default text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border-default bg-bg-sidebar px-4 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('policy')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'policy'
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Policy Bounds</span>
          </button>
          <button
            onClick={() => setActiveTab('userop')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'userop'
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Packed UserOp</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Flow</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* TAB 1: Policy */}
          {activeTab === 'policy' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-bg-secondary border border-border-default space-y-1">
                  <div className="text-[10px] uppercase font-bold text-text-tertiary">Master Signer (EOA)</div>
                  <div className="font-mono text-[11px] text-text-primary truncate">{masterSigner}</div>
                  <div className="text-[10px] text-text-secondary">Signs EIP-712 session policy 1x</div>
                </div>

                <div className="p-3 rounded-xl bg-bg-secondary border border-border-default space-y-1">
                  <div className="text-[10px] uppercase font-bold text-text-tertiary">Smart Account (ERC-4337)</div>
                  <div className="font-mono text-[11px] text-accent-primary font-semibold truncate">{smartAccount}</div>
                  <div className="text-[10px] text-text-secondary">Executes UserOps in dungeon</div>
                </div>
              </div>

              {sessionAuth && sessionKey ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-default space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-accent-green" /> Active Ephemeral Session Key
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent-green/10 text-accent-green border border-accent-green/20 font-semibold">
                        VALIDATED
                      </span>
                    </div>

                    <div className="font-mono text-[11px] bg-bg-elevated p-2 rounded-lg border border-border-default flex items-center justify-between">
                      <span className="truncate text-text-primary">{sessionKey.address}</span>
                      <button
                        onClick={() => copyToClipboard(sessionKey.address, 'sessionAddr')}
                        className="text-text-tertiary hover:text-text-primary shrink-0 ml-2"
                      >
                        {copiedKey === 'sessionAddr' ? <Check className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1">
                      <div>
                        <span className="text-text-tertiary">Valid Until:</span>{' '}
                        <strong className="text-text-primary">{new Date(sessionAuth.policy.validUntil * 1000).toLocaleTimeString()}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary">Spend Limit:</span>{' '}
                        <strong className="text-text-primary">{spentEth} / {sessionAuth.policy.spendLimitEth} ETH</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-secondary border border-border-default space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-text-tertiary">EIP-712 Master Authorization Signature</div>
                    <div className="p-2 rounded bg-bg-elevated border border-border-default font-mono text-[10px] text-text-secondary break-all">
                      {sessionAuth.masterSignature}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-bg-secondary border border-border-default text-center text-text-tertiary space-y-1">
                  <p className="font-semibold text-text-primary">No Active Session Authorization</p>
                  <p className="text-[11px]">Click "Authorize Session" on the navbar to issue a cryptographic session policy.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: UserOp */}
          {activeTab === 'userop' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 bg-bg-secondary rounded-xl border border-border-default space-y-2">
                <div className="flex items-center justify-between text-text-secondary text-[11px]">
                  <span>UserOperation Payload (ERC-4337 v0.6)</span>
                  {selectedLog && <span className="text-accent-green font-semibold">Live Snapshot</span>}
                </div>

                <pre className="p-3 bg-bg-elevated rounded-lg border border-border-default text-[10px] text-text-primary overflow-x-auto leading-relaxed">
                  {JSON.stringify(sampleUserOp, null, 2)}
                </pre>
              </div>

              {selectedLog && (
                <div className="p-3 bg-bg-secondary rounded-xl border border-border-default space-y-1.5 text-[11px]">
                  <div className="text-text-tertiary font-sans font-semibold">Bundler Execution Receipt</div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Transaction Hash:</span>
                    <span className="text-accent-primary font-mono">{selectedLog.txHash.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Gas Sponsored by Paymaster:</span>
                    <span className="text-accent-green font-semibold">$0.00 (100%)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-default space-y-2">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" /> 1-Time Session Handshake Flow
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-text-secondary text-[11px] leading-relaxed">
                  <li>User connects MetaMask & signs EIP-712 typed data specifying target contract, spend cap, & expiry.</li>
                  <li>Browser engine generates an ephemeral burner private key stored in secure local memory.</li>
                  <li>Platformer combat actions (slashes, fireballs, loot) are signed instantly via the local key in <strong>&lt;75ms</strong>.</li>
                  <li>Paymaster sponsors 100% of execution gas; bundler batches calls into single on-chain transactions.</li>
                  <li>On logout or button click, ephemeral key is erased and session nonce is incremented.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
