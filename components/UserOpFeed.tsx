'use client';

import React from 'react';
import { Activity, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { ExecutionLog } from '@/lib/types';

interface UserOpFeedProps {
  logs: ExecutionLog[];
  onSelectLog: (log: ExecutionLog) => void;
}

export const UserOpFeed: React.FC<UserOpFeedProps> = ({ logs, onSelectLog }) => {
  const truncate = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  return (
    <div className="bg-bg-elevated border border-border-default rounded-xl p-4 flex flex-col h-[280px] shadow-card">
      <div className="flex items-center justify-between pb-2.5 border-b border-border-default text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-text-tertiary" />
          <h3 className="font-semibold text-text-primary">ERC-4337 UserOp Stream</h3>
        </div>
        <span className="text-[10px] font-mono text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded">
          Paymaster Active ($0 Gas)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pt-2.5 pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-tertiary text-xs italic">
            No UserOperations submitted yet. Execute any move to observe the pipeline.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onClick={() => onSelectLog(log)}
              className="p-2.5 rounded-lg bg-bg-secondary hover:bg-border-default/50 border border-border-default cursor-pointer transition-colors flex flex-col gap-1 text-[11px] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default text-text-primary text-[10px] font-semibold">
                    {log.action}
                  </span>
                  <span className="text-text-secondary text-[10px]">{truncate(log.userOpHash)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-accent-green font-medium">$0.00 Sponsored</span>
                  <span className="text-text-tertiary">{log.latencyMs}ms</span>
                  <ArrowUpRight className="w-3 h-3 text-text-tertiary group-hover:text-text-primary transition-colors" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-0.5">
                <span>Selector: <strong className="text-text-secondary">{log.selector}</strong></span>
                <span className="text-text-secondary flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-accent-green" />
                  Validated via SessionKey
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
