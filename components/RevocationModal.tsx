'use client';

import React from 'react';
import { Key, RotateCcw } from 'lucide-react';
import { Address } from 'viem';

interface RevocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewSession: () => void;
  revokedKeyAddress: Address | null;
}

export const RevocationModal: React.FC<RevocationModalProps> = ({
  isOpen,
  onClose,
  onStartNewSession,
  revokedKeyAddress,
}) => {
  if (!isOpen) return null;

  const truncate = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-md bg-bg-elevated border border-border-default rounded-2xl shadow-modal overflow-hidden p-5 space-y-4 text-center">
        
        <div className="mx-auto w-12 h-12 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red">
          <Key className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-text-primary">Session Key Revoked</h2>
          <p className="text-xs text-text-secondary">
            The ephemeral key has been scrubbed from memory and invalidated on-chain.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-xs font-mono text-left space-y-1.5">
          <div className="flex justify-between items-center text-text-secondary">
            <span>Revoked Key:</span>
            <span className="text-accent-red font-medium">{revokedKeyAddress ? truncate(revokedKeyAddress) : '0x...'}</span>
          </div>
          <div className="flex justify-between items-center text-text-secondary">
            <span>Browser Memory:</span>
            <span className="text-accent-green font-sans text-[11px] font-semibold">Scrubbed</span>
          </div>
          <div className="flex justify-between items-center text-text-secondary">
            <span>On-Chain Nonce:</span>
            <span className="text-accent-green font-sans text-[11px] font-semibold">Bumped (Invalidated)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="w-1/2 py-2 px-3 rounded-xl bg-bg-elevated hover:bg-bg-secondary border border-border-default text-text-secondary text-xs font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onStartNewSession();
            }}
            className="w-1/2 py-2 px-3 rounded-xl bg-text-primary hover:opacity-90 text-text-inverse text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>

      </div>
    </div>
  );
};
