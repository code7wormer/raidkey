'use client';

import React, { useState } from 'react';
import { Key, Shield, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { Address } from 'viem';

interface SessionHandshakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: (spendLimit: string, durationMinutes: number) => Promise<void>;
  targetContract: Address;
  smartAccount: Address;
  masterSigner: Address;
  isAuthorizing: boolean;
}

export const SessionHandshakeModal: React.FC<SessionHandshakeModalProps> = ({
  isOpen,
  onClose,
  onAuthorize,
  targetContract,
  smartAccount,
  masterSigner,
  isAuthorizing,
}) => {
  const [spendLimit, setSpendLimit] = useState('0.05');
  const [duration, setDuration] = useState(30);

  if (!isOpen) return null;

  const truncate = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAuthorize(spendLimit, duration);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-md bg-bg-elevated border border-border-default rounded-2xl shadow-modal overflow-hidden text-text-primary">
        
        {/* Header */}
        <div className="p-5 border-b border-border-default bg-bg-secondary/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center text-text-primary shadow-sm">
              <Key className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Authorize Gaming Session
              </h2>
              <p className="text-xs text-text-tertiary mt-0.5">
                Sign once via EIP-712. An ephemeral key executes game moves with 0 signature popups.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-xs text-text-secondary space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Shield className="w-3.5 h-3.5 text-accent-primary" />
              <span>Cryptographic Bounds Guarantee</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              This ephemeral key can only call the verified game contract within your spend ceiling. It cannot withdraw or transfer assets outside the game.
            </p>
          </div>

          {/* Policy Config */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" /> Hard Expiry
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      duration === mins
                        ? 'bg-accent-primary/10 border-accent-primary text-accent-primary shadow-sm'
                        : 'bg-bg-elevated border-border-default text-text-secondary hover:bg-bg-secondary'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Spend Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-accent-green" /> Spend Ceiling
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['0.01', '0.05', '0.10'].map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => setSpendLimit(lim)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      spendLimit === lim
                        ? 'bg-accent-green/10 border-accent-green text-accent-green shadow-sm'
                        : 'bg-bg-elevated border-border-default text-text-secondary hover:bg-bg-secondary'
                    }`}
                  >
                    {lim}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Scope Parameters */}
          <div className="p-3 bg-bg-secondary rounded-xl border border-border-default text-xs font-mono space-y-1.5">
            <div className="flex justify-between items-center text-text-secondary">
              <span>Target:</span>
              <span className="text-text-primary font-semibold">{truncate(targetContract)}</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>Selectors:</span>
              <span className="text-text-secondary font-sans text-[11px]">5 Game Actions (Attack, Spell, Loot)</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>Gas Policy:</span>
              <span className="text-accent-green font-sans text-[11px] font-semibold">100% Sponsored (Paymaster)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2 px-3 rounded-xl bg-bg-elevated hover:bg-bg-secondary border border-border-default text-text-secondary text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-2/3 py-2 px-3 rounded-xl bg-text-primary hover:opacity-90 text-text-inverse text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isAuthorizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                  <span>Signing Handshake...</span>
                </>
              ) : (
                <>
                  <span>Sign 1-Time Handshake</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
