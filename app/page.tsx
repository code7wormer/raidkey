'use client';

import React, { useState, useEffect } from 'react';
import { Address, Hex, getAddress, keccak256 } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SessionHandshakeModal } from '@/components/SessionHandshakeModal';
import { PlatformerCanvasGame } from '@/components/PlatformerCanvasGame';
import { CombatLog } from '@/components/CombatLog';
import { UserOpFeed } from '@/components/UserOpFeed';
import { AAInspectorDrawer } from '@/components/AAInspectorDrawer';
import { RevocationModal } from '@/components/RevocationModal';
import { EOAPopupModal } from '@/components/EOAPopupModal';
import { 
  SessionAuthorization, 
  SessionKeyData, 
  ExecutionLog, 
  CombatLogItem,
  UserOperation 
} from '@/lib/types';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '@/lib/chains';
import { 
  createEphemeralSessionKey, 
  buildSessionPolicy, 
  signSessionPolicyWithMaster, 
  getActiveEphemeralSession, 
  getActiveSessionAuthorization, 
  revokeActiveSession,
  ensureSepoliaNetwork
} from '@/lib/sessionManager';
import { buildExecutionCallData, signUserOpWithSessionKey } from '@/lib/userOpBuilder';
import { getPaymasterSponsorship } from '@/lib/paymaster';
import { submitUserOperation } from '@/lib/bundlerClient';
import { Shield, Play, ArrowRight, Swords, Sparkles, CheckCircle2, Lock, Wallet } from 'lucide-react';

export default function Home() {
  const [masterSigner, setMasterSigner] = useState<Address | null>(null);
  const [smartAccount, setSmartAccount] = useState<Address | null>(null);
  const [isConnectedMetaMask, setIsConnectedMetaMask] = useState<boolean>(false);
  
  // Game View Mode: 'LOBBY' | 'PLAYING'
  const [currentView, setCurrentView] = useState<'LOBBY' | 'PLAYING'>('LOBBY');

  // Wallet Comparison Mode: 'EOA' | 'ERC4337'
  const [walletMode, setWalletMode] = useState<'EOA' | 'ERC4337'>('ERC4337');
  const [eoaPopupsCount, setEoaPopupsCount] = useState<number>(0);
  const [eoaTimeWastedSec, setEoaTimeWastedSec] = useState<number>(0);
  const [eoaGasPaidEth, setEoaGasPaidEth] = useState<string>('0.000');
  const [aaActionsCount, setAaActionsCount] = useState<number>(0);

  // EOA Pending Popup State
  const [isEOAPopupOpen, setIsEOAPopupOpen] = useState<boolean>(false);
  const [eoaPendingAction, setEoaPendingAction] = useState<{
    name: string;
    target: Address;
    gasEth: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  const chainId = DEFAULT_CHAIN_ID;
  const selectedChain = SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];

  // Session Key State
  const [sessionKey, setSessionKey] = useState<SessionKeyData | null>(null);
  const [sessionAuth, setSessionAuth] = useState<SessionAuthorization | null>(null);
  const [spentEth, setSpentEth] = useState<string>('0.000');

  // UI State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isRevocationModalOpen, setIsRevocationModalOpen] = useState<boolean>(false);
  const [revokedKeyAddress, setRevokedKeyAddress] = useState<Address | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  // Logs
  const [combatLogs, setCombatLogs] = useState<CombatLogItem[]>([
    {
      id: 'init-1',
      timestamp: Date.now() - 30000,
      type: 'SYSTEM',
      title: 'raidKey Platformer Initialized',
      description: 'Connect MetaMask on Ethereum Sepolia to unlock the 60 FPS zero-popup session engine.',
    }
  ]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [selectedUserOpLog, setSelectedUserOpLog] = useState<ExecutionLog | null>(null);

  // Check already connected accounts on mount
  useEffect(() => {
    const checkConnected = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const userAddr = getAddress(accounts[0]);
            setMasterSigner(userAddr);
            setIsConnectedMetaMask(true);
            const calculatedSmartAccount = getAddress(`0x${keccak256(userAddr).slice(26)}`);
            setSmartAccount(calculatedSmartAccount);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkConnected();
  }, []);

  // Connect MetaMask
  const handleConnectMetaMask = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        await ensureSepoliaNetwork();

        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts && accounts.length > 0) {
          const userAddr = getAddress(accounts[0]);
          setMasterSigner(userAddr);
          setIsConnectedMetaMask(true);
          
          const calculatedSmartAccount = getAddress(`0x${keccak256(userAddr).slice(26)}`);
          setSmartAccount(calculatedSmartAccount);

          setCombatLogs((prev) => [
            {
              id: `mm-${Date.now()}`,
              timestamp: Date.now(),
              type: 'SYSTEM',
              title: 'MetaMask Connected (Sepolia)',
              description: `Master Signer: ${userAddr.slice(0, 6)}...${userAddr.slice(-4)}. Smart Account generated.`,
            },
            ...prev,
          ]);
        }
      } catch (err: any) {
        console.error('MetaMask connection error:', err);
        alert(`MetaMask connection error: ${err.message || err}`);
      }
    } else {
      alert('Please install MetaMask extension to connect your wallet.');
    }
  };

  // Restore session
  useEffect(() => {
    const activeKey = getActiveEphemeralSession();
    const activeAuth = getActiveSessionAuthorization();
    if (activeKey && activeAuth) {
      setSessionKey(activeKey);
      setSessionAuth(activeAuth);
    }
  }, []);

  // Authorize Session
  const handleAuthorizeSession = async (spendLimit: string, durationMinutes: number) => {
    if (!masterSigner || !smartAccount) {
      handleConnectMetaMask();
      return;
    }

    try {
      setIsAuthorizing(true);
      const newKey = createEphemeralSessionKey(durationMinutes);
      const policy = buildSessionPolicy(
        newKey.address,
        selectedChain.contracts.raidDungeon,
        spendLimit,
        durationMinutes,
        0
      );

      const auth = await signSessionPolicyWithMaster(
        policy,
        masterSigner,
        chainId,
        smartAccount,
        isConnectedMetaMask
      );

      setSessionKey(newKey);
      setSessionAuth(auth);
      setIsSessionModalOpen(false);

      const logItem: CombatLogItem = {
        id: `auth-${Date.now()}`,
        timestamp: Date.now(),
        type: 'SYSTEM',
        title: 'Sepolia Session Key Authorized',
        description: `Ephemeral key ${newKey.address.slice(0, 6)}... granted access with ${spendLimit} ETH cap for ${durationMinutes}m.`,
      };
      setCombatLogs((prev) => [logItem, ...prev]);

    } catch (err: any) {
      console.error('Session authorization error:', err);
      alert(`Authorization failed: ${err.message}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Revoke Session
  const handleRevokeSession = async () => {
    if (!sessionKey) return;
    try {
      setIsRevoking(true);
      const deadKey = sessionKey.address;
      
      revokeActiveSession();
      setRevokedKeyAddress(deadKey);
      setSessionKey(null);
      setSessionAuth(null);
      setCurrentView('LOBBY');

      const logItem: CombatLogItem = {
        id: `revoke-${Date.now()}`,
        timestamp: Date.now(),
        type: 'REVOKE',
        title: 'Session Key Revoked',
        description: `Ephemeral key ${deadKey.slice(0, 6)}... scrubbed from memory and session nonce incremented on Sepolia.`,
      };
      setCombatLogs((prev) => [logItem, ...prev]);

      setIsRevocationModalOpen(true);
    } catch (err: any) {
      console.error('Revocation error:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  // Fallback EOA Web Modal Confirmation
  const handleConfirmEOAPopup = () => {
    if (!eoaPendingAction) return;
    setEoaPopupsCount((c) => c + 1);
    setEoaTimeWastedSec((t) => t + 3);
    setEoaGasPaidEth((g) => (parseFloat(g) + 0.0008).toFixed(4));
    
    setIsEOAPopupOpen(false);
    eoaPendingAction.resolve(true);
    setEoaPendingAction(null);
  };

  const handleRejectEOAPopup = () => {
    if (!eoaPendingAction) return;
    setIsEOAPopupOpen(false);
    eoaPendingAction.resolve(false);
    setEoaPendingAction(null);
    setCombatLogs((prev) => [
      {
        id: `rej-${Date.now()}`,
        timestamp: Date.now(),
        type: 'SYSTEM',
        title: 'Move Rejected by User',
        description: 'EOA signature request was declined. Action cancelled.',
      },
      ...prev,
    ]);
  };

  // On-Chain Action Executor from raidKey Engine (returns boolean for approval success)
  const handleExecutePlatformerAction = async (actionName: string, selector: string, valueEth: string = '0'): Promise<boolean> => {
    // IF IN EOA MODE: Trigger MetaMask extension popup or fallback modal BEFORE move executes
    if (walletMode === 'EOA') {
      const startTime = Date.now();
      
      if (typeof window !== 'undefined' && (window as any).ethereum && isConnectedMetaMask && masterSigner) {
        try {
          const ethereum = (window as any).ethereum;
          const promptMessage = `raidKey Sepolia Move Approval: ${actionName}\nTarget: ${selectedChain.contracts.raidDungeon}\nSelector: ${selector}\nNonce: ${eoaPopupsCount + 1}\n\nIn standard EOA mode, MetaMask must approve every jump, fireball, and block bounty!`;
          
          await ethereum.request({
            method: 'personal_sign',
            params: [promptMessage, masterSigner],
          });

          const timeElapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          setEoaPopupsCount((c) => c + 1);
          setEoaTimeWastedSec((t) => t + timeElapsedSec);
          setEoaGasPaidEth((g) => (parseFloat(g) + 0.0008).toFixed(4));
          
          setCombatLogs((prev) => [
            {
              id: `combat-${Date.now()}`,
              timestamp: Date.now(),
              type: 'ATTACK',
              title: `${actionName} (MetaMask Approved)`,
              description: `Signed in MetaMask (~${timeElapsedSec}s lag • Player paid $1.85 Gas on Sepolia).`,
            },
            ...prev,
          ]);
          return true;

        } catch (err: any) {
          setCombatLogs((prev) => [
            {
              id: `mm-rej-${Date.now()}`,
              timestamp: Date.now(),
              type: 'SYSTEM',
              title: `${actionName} Rejected`,
              description: 'MetaMask prompt was declined by user. Action was cancelled and prevented.',
            },
            ...prev,
          ]);
          return false;
        }
      } else {
        return new Promise<boolean>((resolve) => {
          setEoaPendingAction({
            name: actionName,
            target: selectedChain.contracts.raidDungeon,
            gasEth: '0.0008',
            resolve,
          });
          setIsEOAPopupOpen(true);
        });
      }
    }

    // IF IN ERC-4337 MODE: Auto-sign seamlessly via ephemeral session key
    if (!sessionKey || !sessionAuth || !smartAccount) {
      setIsSessionModalOpen(true);
      return false;
    }

    const targetAddr = getAddress(selectedChain.contracts.raidDungeon);
    const senderAddr = getAddress(smartAccount);
    const paymasterAddr = getAddress(selectedChain.contracts.paymaster);
    const entryPointAddr = getAddress(selectedChain.contracts.entryPoint);

    const innerCallData = `${selector}${'0'.repeat(64)}` as Hex;
    const callData = buildExecutionCallData(targetAddr, BigInt(0), innerCallData);

    const sponsorship = getPaymasterSponsorship(paymasterAddr, senderAddr, actionName);

    const unsignedUserOp = {
      sender: senderAddr,
      nonce: BigInt(executionLogs.length + 1),
      initCode: '0x' as Hex,
      callData,
      callGasLimit: BigInt(100000),
      verificationGasLimit: BigInt(150000),
      preVerificationGas: BigInt(50000),
      maxFeePerGas: BigInt(1000000000),
      maxPriorityFeePerGas: BigInt(1000000000),
      paymasterAndData: sponsorship.paymasterAndData,
    };

    const signedUserOp: UserOperation = await signUserOpWithSessionKey(
      unsignedUserOp,
      sessionKey,
      sessionAuth,
      entryPointAddr,
      chainId
    );

    const result = await submitUserOperation(
      signedUserOp,
      sessionAuth,
      actionName,
      targetAddr,
      valueEth,
      chainId
    );

    const execLog: ExecutionLog = {
      id: `exec-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      action: actionName,
      target: targetAddr,
      selector,
      userOpHash: result.userOpHash,
      txHash: result.txHash,
      status: 'SUCCESS',
      gasSponsored: result.gasSponsored,
      gasCostEth: result.gasCostEth,
      valueSpentEth: valueEth,
      latencyMs: result.latencyMs,
      details: `Auto-signed via SessionKey on Sepolia in ${result.latencyMs}ms ($0.00 Gas)`,
    };

    setExecutionLogs((prev) => [execLog, ...prev]);
    setAaActionsCount((c) => c + 1);

    setCombatLogs((prev) => [
      {
        id: `combat-${Date.now()}`,
        timestamp: Date.now(),
        type: 'ATTACK',
        title: `${actionName} Executed`,
        description: `Signed in-memory via SessionKey on Sepolia in ${result.latencyMs}ms ($0.00 Gas • 0 Popups).`,
      },
      ...prev,
    ]);

    return true;
  };

  const handleLaunchGame = () => {
    if (!isConnectedMetaMask || !masterSigner) {
      handleConnectMetaMask();
      return;
    }
    if (walletMode === 'ERC4337' && (!sessionKey || !sessionAuth)) {
      setIsSessionModalOpen(true);
      return;
    }
    setCurrentView('PLAYING');
  };

  const defaultMaster = masterSigner || getAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const defaultSmart = smartAccount || getAddress('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7');

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col lg:flex-row font-sans">
      
      {/* Left Sidebar Dashboard */}
      <Sidebar
        walletMode={walletMode}
        onChangeWalletMode={(m) => setWalletMode(m)}
        sessionAuth={sessionAuth}
        sessionKey={sessionKey}
        smartAccount={defaultSmart}
        masterSigner={defaultMaster}
        spentEth={spentEth}
        eoaPopupsCount={eoaPopupsCount}
        aaActionsCount={aaActionsCount}
        eoaTimeWastedSec={eoaTimeWastedSec}
        onRevoke={handleRevokeSession}
        onOpenSessionModal={() => setIsSessionModalOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        isRevoking={isRevoking}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <Navbar
          smartAccount={defaultSmart}
          masterSigner={defaultMaster}
          hasActiveSession={!!sessionKey}
          selectedChain={selectedChain}
          isConnectedMetaMask={isConnectedMetaMask}
          onConnectMetaMask={handleConnectMetaMask}
          onOpenInspector={() => setIsInspectorOpen(true)}
          onOpenSessionModal={() => setIsSessionModalOpen(true)}
          currentView={currentView}
        />

        {/* Content Container */}
        <main className="p-4 sm:p-6 space-y-4 flex-1">
          
          {/* ========================================================= */}
          {/* SCREEN 1: LOBBY / HERO LAUNCHER                          */}
          {/* ========================================================= */}
          {currentView === 'LOBBY' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Hero Banner */}
              <div className="bg-bg-elevated border border-border-default rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-card hover:shadow-card-hover transition-shadow">
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/20 uppercase">
                      raidKey
                    </span>
                    <span className="text-xs text-text-tertiary">Ethereum Sepolia Platformer</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                    raidKey: Zero-Popup 60 FPS Platformer
                  </h1>

                  <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
                    Play as <strong>Sonic</strong> or <strong>Mario</strong> with zero wallet interruptions. In <strong>ERC-4337 Mode</strong>, every jump, fireball attack, and coin bounty is verified in &lt;80ms with 100% Paymaster gas sponsorship. In <strong>EOA Mode</strong>, every move triggers MetaMask approval.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" /> 60 FPS Platform Physics</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" /> Strict MetaMask EOA Interception</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" /> Ephemeral Session Keys on Sepolia</span>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  {!isConnectedMetaMask ? (
                    <button
                      onClick={handleConnectMetaMask}
                      className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-accent-primary hover:opacity-95 text-text-inverse text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Connect MetaMask to Play</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLaunchGame}
                      className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-text-primary hover:opacity-95 text-text-inverse text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-text-inverse" />
                      <span>Launch raidKey Platformer</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>

              {/* Real-time Telemetry Feeds */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CombatLog logs={combatLogs} />
                <UserOpFeed
                  logs={executionLogs}
                  onSelectLog={(log) => {
                    setSelectedUserOpLog(log);
                    setIsInspectorOpen(true);
                  }}
                />
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 2: 2D RAIDKEY PLATFORMER GAMEPLAY                  */}
          {/* ========================================================= */}
          {currentView === 'PLAYING' && (
            <div className="space-y-4 animate-fadeIn">
              
              <PlatformerCanvasGame
                walletMode={walletMode}
                sessionKey={sessionKey}
                sessionAuth={sessionAuth}
                onExecuteOnChainAction={handleExecutePlatformerAction}
                onExitGame={() => setCurrentView('LOBBY')}
                onOpenInspector={() => setIsInspectorOpen(true)}
                smartAccount={defaultSmart}
              />

              {/* Feeds underneath canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CombatLog logs={combatLogs} />
                <UserOpFeed
                  logs={executionLogs}
                  onSelectLog={(log) => {
                    setSelectedUserOpLog(log);
                    setIsInspectorOpen(true);
                  }}
                />
              </div>

            </div>
          )}

          {/* Architecture Explainer Bar */}
          <div className="p-4 rounded-xl bg-bg-elevated border border-border-default flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-card">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <Shield className="w-4 h-4 text-accent-primary" />
                <span>Why Account Abstraction is Essential for Real-Time Gaming</span>
              </div>
              <p className="text-text-secondary leading-relaxed max-w-3xl text-[11px]">
                In <strong>Standard EOA Mode</strong>, every jump and attack pauses gameplay waiting for a MetaMask signature. In <strong>ERC-4337 Mode</strong>, the game executes at a seamless 60 FPS with UserOps auto-signed via ephemeral session keys and sponsored by the treasury Paymaster on Ethereum Sepolia.
              </p>
            </div>

            <button
              onClick={() => setIsInspectorOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-border-default border border-border-default font-medium text-text-primary text-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>Open AA Inspector</span>
              <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-border-default bg-bg-sidebar py-3 px-6 text-xs text-text-tertiary flex flex-col sm:flex-row items-center justify-between gap-2">
          <span><strong>raidKey</strong> — ROAD TO DEVCON – IIITN EDITION</span>
          <span className="font-mono text-[11px]">IIIT Nagpur × Bhaisaaab • Ethereum Research Workshop & Builders Lab</span>
        </footer>

      </div>

      {/* Modals & Drawers */}
      <SessionHandshakeModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onAuthorize={handleAuthorizeSession}
        targetContract={selectedChain.contracts.raidDungeon}
        smartAccount={defaultSmart}
        masterSigner={defaultMaster}
        isAuthorizing={isAuthorizing}
      />

      <AAInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        sessionAuth={sessionAuth}
        sessionKey={sessionKey}
        selectedLog={selectedUserOpLog}
        smartAccount={defaultSmart}
        masterSigner={defaultMaster}
        spentEth={spentEth}
      />

      <RevocationModal
        isOpen={isRevocationModalOpen}
        onClose={() => setIsRevocationModalOpen(false)}
        onStartNewSession={() => setIsSessionModalOpen(true)}
        revokedKeyAddress={revokedKeyAddress}
      />

      <EOAPopupModal
        isOpen={isEOAPopupOpen}
        actionName={eoaPendingAction?.name || 'Action'}
        targetAddress={eoaPendingAction?.target || selectedChain.contracts.raidDungeon}
        estimatedGasEth={eoaPendingAction?.gasEth || '0.0008'}
        onConfirm={handleConfirmEOAPopup}
        onReject={handleRejectEOAPopup}
      />

    </div>
  );
}
