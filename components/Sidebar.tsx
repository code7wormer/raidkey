'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Key, Zap, LogOut, Terminal, Layers } from 'lucide-react';
import { Address } from 'viem';
import { SessionAuthorization, SessionKeyData } from '@/lib/types';

interface SidebarProps {
  walletMode: 'EOA' | 'ERC4337';
  onChangeWalletMode: (mode: 'EOA' | 'ERC4337') => void;
  sessionAuth: SessionAuthorization | null;
  sessionKey: SessionKeyData | null;
  smartAccount: Address;
  masterSigner: Address;
  spentEth: string;
  eoaPopupsCount: number;
  aaActionsCount: number;
  eoaTimeWastedSec: number;
  onRevoke: () => void;
  onOpenSessionModal: () => void;
  onOpenInspector: () => void;
  isRevoking: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  walletMode, onChangeWalletMode, sessionAuth, sessionKey,
  smartAccount, masterSigner, spentEth, eoaPopupsCount,
  aaActionsCount, eoaTimeWastedSec, onRevoke, onOpenSessionModal,
  onOpenInspector, isRevoking,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('—');
  const truncAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  useEffect(() => {
    if (!sessionAuth || !sessionKey) return;
    const interval = setInterval(() => {
      const rem = sessionAuth.policy.validUntil - Math.floor(Date.now() / 1000);
      if (rem <= 0) { setTimeLeft('Expired'); clearInterval(interval); }
      else setTimeLeft(`${Math.floor(rem / 60)}:${(rem % 60).toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionAuth, sessionKey]);

  return (
    <aside className="w-full lg:w-60 bg-bg-sidebar border-r border-border-default flex flex-col justify-between p-4 shrink-0 font-sans select-none lg:min-h-screen">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <div className="w-7 h-7 rounded-md bg-text-primary text-text-inverse flex items-center justify-center font-mono font-bold text-xs shadow-sm">
            rk
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-text-primary leading-none">
              raidKey
            </div>
            <div className="text-[10px] text-text-tertiary font-mono mt-1">
              sepolia · erc-4337
            </div>
          </div>
        </div>

        {/* Execution Mode Segmented Control */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary px-1">
            Account Architecture
          </div>
          <div className="bg-bg-secondary p-1 rounded-lg border border-border-default flex flex-col gap-1">
            <button
              onClick={() => onChangeWalletMode('ERC4337')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                walletMode === 'ERC4337'
                  ? 'bg-bg-elevated text-text-primary font-semibold shadow-sm border border-border-default'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-accent-primary" />
                <span>Smart Account</span>
              </div>
              <span className="text-[10px] font-mono text-accent-green font-medium">0 Popups</span>
            </button>

            <button
              onClick={() => onChangeWalletMode('EOA')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                walletMode === 'EOA'
                  ? 'bg-bg-elevated text-text-primary font-semibold shadow-sm border border-border-default'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-accent-red" />
                <span>Standard EOA</span>
              </div>
              <span className="text-[10px] font-mono text-accent-red font-medium">Prompts</span>
            </button>
          </div>
        </div>

        {/* Active Session Status */}
        {walletMode === 'ERC4337' && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary px-1 flex items-center justify-between">
              <span>Session Key</span>
              {sessionKey && <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />}
            </div>

            {sessionKey && sessionAuth ? (
              <div className="bg-bg-elevated rounded-lg border border-border-default p-3 space-y-2 text-xs shadow-card">
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-[11px]">Key</span>
                  <span className="font-mono text-text-primary text-[11px] font-medium">{truncAddr(sessionKey.address)}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-[11px]">Remaining</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{timeLeft}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-[11px]">Cap</span>
                  <span className="font-mono text-text-primary text-[11px]">{spentEth} / {sessionAuth.policy.spendLimitEth} ETH</span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={onRevoke}
                    disabled={isRevoking}
                    className="w-full py-1.5 px-2 rounded-md border border-accent-red/20 bg-accent-red/5 text-accent-red hover:bg-accent-red/10 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{isRevoking ? 'Revoking…' : 'Revoke Key'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-bg-elevated rounded-lg border border-border-default p-3 text-center space-y-2.5 shadow-card">
                <div className="text-[11px] text-text-tertiary leading-relaxed">
                  No active session key.
                </div>
                <button
                  onClick={onOpenSessionModal}
                  className="w-full py-1.5 px-2 rounded-md bg-text-primary hover:opacity-90 text-text-inverse text-[11px] font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3 h-3" />
                  <span>Authorize Key</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Telemetry Numbers */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary px-1">
            Telemetry
          </div>
          <div className="bg-bg-elevated rounded-lg border border-border-default p-3 space-y-2 text-xs shadow-card">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-[11px]">User Prompts</span>
              <span className="font-mono font-bold text-text-primary text-[11px]">
                {walletMode === 'EOA' ? eoaPopupsCount : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-[11px]">Latency Overhead</span>
              <span className="font-mono text-text-primary text-[11px]">
                {walletMode === 'EOA' ? `${eoaTimeWastedSec}s` : '0ms'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-[11px]">Gas Incurred</span>
              <span className="font-mono text-text-primary text-[11px]">
                {walletMode === 'EOA' ? `${(eoaPopupsCount * 0.0008).toFixed(4)} ETH` : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border-default pt-1.5">
              <span className="text-text-secondary text-[11px]">Moves Executed</span>
              <span className="font-mono font-bold text-text-primary text-[11px]">
                {walletMode === 'EOA' ? eoaPopupsCount : aaActionsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-border-default/60">
        <button
          onClick={onOpenInspector}
          className="w-full py-2 px-3 rounded-lg border border-border-default bg-bg-elevated hover:bg-bg-secondary text-text-secondary hover:text-text-primary text-xs font-medium transition-colors flex items-center justify-between shadow-card"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-text-tertiary" />
            <span>AA Inspector</span>
          </div>
          <Layers className="w-3 h-3 text-text-tertiary" />
        </button>
      </div>
    </aside>
  );
};
