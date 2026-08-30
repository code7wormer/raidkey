'use client';

import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { Address } from 'viem';

interface EOAPopupModalProps {
  isOpen: boolean;
  actionName: string;
  targetAddress: Address;
  estimatedGasEth: string;
  onConfirm: () => void;
  onReject: () => void;
}

export const EOAPopupModal: React.FC<EOAPopupModalProps> = ({
  isOpen,
  actionName,
  targetAddress,
  estimatedGasEth,
  onConfirm,
  onReject,
}) => {
  if (!isOpen) return null;

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-sm bg-bg-elevated border border-accent-red/30 rounded-2xl shadow-modal overflow-hidden text-text-primary">
        
        {/* Header */}
        <div className="bg-bg-secondary p-3.5 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">
              🦊
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Signature Request</div>
              <div className="text-[10px] text-text-tertiary font-mono">Standard EOA Wallet</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-accent-red bg-accent-red/10 border border-accent-red/20 px-2 py-0.5 rounded font-semibold">
            Popup Required
          </span>
        </div>

        {/* Problem Notice */}
        <div className="bg-accent-red/10 border-b border-accent-red/20 px-3.5 py-2 text-[11px] text-accent-red flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0 text-accent-red" />
          <span>Gameplay paused waiting for manual signature.</span>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          <div className="text-center space-y-0.5">
            <div className="text-xs text-text-tertiary uppercase tracking-wide text-[10px]">Action</div>
            <div className="text-sm font-bold text-text-primary">{actionName}</div>
            <div className="text-[11px] font-mono text-text-secondary">Target: {truncate(targetAddress)}</div>
          </div>

          <div className="bg-bg-secondary p-3 rounded-xl border border-border-default space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-text-secondary">
              <span className="font-sans">Estimated Gas:</span>
              <span className="text-accent-amber font-semibold">~{estimatedGasEth} ETH</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span className="font-sans">Sponsorship:</span>
              <span className="text-accent-red font-sans font-semibold">None (Player Pays)</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3.5 bg-bg-secondary/60 border-t border-border-default flex gap-2">
          <button
            onClick={onReject}
            className="w-1/2 py-2 px-3 rounded-xl bg-bg-elevated hover:bg-bg-secondary border border-border-default text-text-secondary text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 py-2 px-3 rounded-xl bg-text-primary hover:opacity-90 text-text-inverse text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Move</span>
          </button>
        </div>

      </div>
    </div>
  );
};
