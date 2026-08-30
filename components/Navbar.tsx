'use client';

import React from 'react';
import { Shield, Key, Cpu, Wallet, Globe } from 'lucide-react';
import { Address } from 'viem';
import { ChainConfig } from '@/lib/types';

interface NavbarProps {
  smartAccount: Address;
  masterSigner: Address;
  hasActiveSession: boolean;
  selectedChain: ChainConfig;
  isConnectedMetaMask: boolean;
  onConnectMetaMask: () => void;
  onOpenInspector: () => void;
  onOpenSessionModal: () => void;
  currentView: 'LOBBY' | 'PLAYING';
}

export const Navbar: React.FC<NavbarProps> = ({
  smartAccount, masterSigner, hasActiveSession, selectedChain,
  isConnectedMetaMask, onConnectMetaMask,
  onOpenInspector, onOpenSessionModal, currentView,
}) => {
  const truncAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-default bg-bg-elevated/90 backdrop-blur-md">
      <div className="px-4 sm:px-6 h-13 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="font-bold text-text-primary">RaidKey</span>
          <span>/</span>
          <span className="text-text-secondary font-medium">
            {currentView === 'LOBBY' ? 'Lobby' : 'Sonic & Mario Sepolia Zone'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sepolia Network Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 animate-pulse text-accent-primary" />
            <span>Ethereum Sepolia Testnet</span>
          </div>

          <button
            onClick={onConnectMetaMask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default text-xs font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{isConnectedMetaMask ? truncAddr(masterSigner) : 'Connect MetaMask'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default text-xs font-mono text-text-secondary bg-bg-secondary/50">
            <Shield className="w-3.5 h-3.5 text-accent-primary" />
            <span>{truncAddr(smartAccount)}</span>
          </div>

          {!hasActiveSession && (
            <button
              onClick={onOpenSessionModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-text-primary text-text-inverse text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Authorize Key</span>
            </button>
          )}

          <button
            onClick={onOpenInspector}
            className="p-1.5 rounded-lg border border-border-default text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            title="AA Inspector"
          >
            <Cpu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
