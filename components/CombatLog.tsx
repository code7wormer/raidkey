'use client';

import React, { useEffect, useState } from 'react';
import { CombatLogItem } from '@/lib/types';

interface CombatLogProps {
  logs: CombatLogItem[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const formatTime = (ts: number) => {
    if (!isMounted) return '--:--:--';
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'ATTACK': return 'text-accent-red';
      case 'SPELL': return 'text-accent-primary';
      case 'LOOT': return 'text-accent-amber';
      case 'POTION': return 'text-accent-green';
      case 'REVOKE': return 'text-accent-red';
      default: return 'text-text-tertiary';
    }
  };

  return (
    <div className="rounded-lg border border-border-default bg-bg-elevated shadow-card">
      <div className="px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">Combat Log</h3>
        <p className="text-[11px] text-text-tertiary">{logs.length} events</p>
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-border-default">
        {logs.map((log) => (
          <div key={log.id} className="px-4 py-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${typeColor(log.type)}`}>{log.title}</span>
              <span className="text-text-tertiary font-mono text-[10px]">{formatTime(log.timestamp)}</span>
            </div>
            <p className="text-text-secondary mt-0.5 leading-relaxed">{log.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
