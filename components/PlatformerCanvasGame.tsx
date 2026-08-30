'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Shield, 
  Heart, 
  Coins, 
  ArrowLeft, 
  Activity,
  ShieldAlert,
  Sparkles,
  Award,
  Gamepad2,
  FastForward,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Address } from 'viem';
import { SessionAuthorization, SessionKeyData } from '@/lib/types';
import confetti from 'canvas-confetti';

interface PlatformerCanvasGameProps {
  walletMode: 'EOA' | 'ERC4337';
  sessionKey: SessionKeyData | null;
  sessionAuth: SessionAuthorization | null;
  onExecuteOnChainAction: (actionName: string, selector: string, valueEth?: string) => Promise<boolean>;
  onExitGame: () => void;
  onOpenInspector: () => void;
  smartAccount: Address;
}

type CharacterChoice = 'SONIC' | 'MARIO';

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'GROUND' | 'BRICK' | 'QUESTION' | 'CHECKER';
  hasItem?: boolean;
  itemClaimed?: boolean;
}

interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  character: CharacterChoice;
  hp: number;
  maxHp: number;
  spinDash: boolean;
  spinCharge: number;
  isInvincible: boolean;
  invincibleTimer: number;
  score: number;
  rings: number;
  coins: number;
  kills: number;
  animFrame: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  hp: number;
  maxHp: number;
  type: 'GOOMBA' | 'MOTOBUG' | 'BOWSER_EGGMAN';
  name: string;
  patrolMinX: number;
  patrolMaxX: number;
  isBoss: boolean;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  type: 'FIREBALL' | 'SPIN_BLAST' | 'BOSS_FIRE';
  color: string;
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'RING' | 'COIN' | 'CHAOS_EMERALD' | 'STAR' | 'CHEST';
  claimed: boolean;
  floatOffset: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const PlatformerCanvasGame: React.FC<PlatformerCanvasGameProps> = ({
  walletMode,
  sessionKey,
  sessionAuth,
  onExecuteOnChainAction,
  onExitGame,
  onOpenInspector,
  smartAccount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep actions and mode in refs to prevent game restarts on parent state changes
  const onExecuteOnChainActionRef = useRef(onExecuteOnChainAction);
  useEffect(() => {
    onExecuteOnChainActionRef.current = onExecuteOnChainAction;
  }, [onExecuteOnChainAction]);

  const walletModeRef = useRef(walletMode);
  useEffect(() => {
    walletModeRef.current = walletMode;
  }, [walletMode]);

  const [character, setCharacter] = useState<CharacterChoice>('SONIC');
  const [hudStats, setHudStats] = useState({
    hp: 100,
    maxHp: 100,
    rings: 0,
    coins: 0,
    score: 0,
    bossHp: 3000,
    bossMaxHp: 3000,
    kills: 0,
  });

  const [lastUserOpNotice, setLastUserOpNotice] = useState<string | null>(null);
  const [pendingEOAActionName, setPendingEOAActionName] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [eoaFailedNotice, setEoaFailedNotice] = useState<string | null>(null);

  const isExecutingEOARef = useRef<boolean>(false);

  const gameStateRef = useRef({
    keys: {} as Record<string, boolean>,
    cameraX: 0,
    player: {
      x: 80,
      y: 380,
      w: 32,
      h: 40,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      character: 'SONIC',
      hp: 100,
      maxHp: 100,
      spinDash: false,
      spinCharge: 0,
      isInvincible: false,
      invincibleTimer: 0,
      score: 0,
      rings: 0,
      coins: 0,
      kills: 0,
      animFrame: 0,
    } as Player,
    platforms: [] as Platform[],
    collectibles: [] as Collectible[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    animFrameId: 0,
    levelLength: 2600,
  });

  const initLevel = useCallback((selectedHero: CharacterChoice) => {
    const p: Platform[] = [
      { x: 0, y: 460, w: 700, h: 80, type: 'GROUND' },
      { x: 760, y: 460, w: 600, h: 80, type: 'GROUND' },
      { x: 1420, y: 460, w: 800, h: 80, type: 'GROUND' },
      { x: 2280, y: 460, w: 600, h: 80, type: 'GROUND' },

      { x: 200, y: 350, w: 32, h: 32, type: 'QUESTION', hasItem: true },
      { x: 232, y: 350, w: 32, h: 32, type: 'BRICK' },
      { x: 264, y: 350, w: 32, h: 32, type: 'QUESTION', hasItem: true },
      { x: 296, y: 350, w: 32, h: 32, type: 'BRICK' },
      { x: 328, y: 350, w: 32, h: 32, type: 'QUESTION', hasItem: true },

      { x: 440, y: 300, w: 180, h: 24, type: 'CHECKER' },
      { x: 500, y: 220, w: 120, h: 20, type: 'CHECKER' },

      { x: 710, y: 410, w: 45, h: 18, type: 'CHECKER' },
      { x: 860, y: 340, w: 120, h: 24, type: 'BRICK' },
      { x: 1040, y: 280, w: 160, h: 24, type: 'CHECKER' },
      { x: 1240, y: 360, w: 100, h: 24, type: 'QUESTION', hasItem: true },

      { x: 1480, y: 340, w: 140, h: 20, type: 'CHECKER' },
      { x: 1680, y: 260, w: 160, h: 20, type: 'CHECKER' },
      { x: 1900, y: 340, w: 140, h: 20, type: 'QUESTION', hasItem: true },

      { x: 2150, y: 380, w: 380, h: 24, type: 'BRICK' },
    ];

    const c: Collectible[] = [
      { id: 1, x: 120, y: 420, w: 20, h: 20, type: 'RING', claimed: false, floatOffset: 0 },
      { id: 2, x: 150, y: 420, w: 20, h: 20, type: 'RING', claimed: false, floatOffset: 1 },
      { id: 3, x: 180, y: 420, w: 20, h: 20, type: 'RING', claimed: false, floatOffset: 2 },
      { id: 4, x: 470, y: 260, w: 20, h: 20, type: 'RING', claimed: false, floatOffset: 0 },
      { id: 5, x: 510, y: 180, w: 20, h: 20, type: 'RING', claimed: false, floatOffset: 1 },
      { id: 6, x: 550, y: 180, w: 20, h: 20, type: 'RING', claimed: false, floatOffset: 2 },

      { id: 7, x: 232, y: 310, w: 20, h: 20, type: 'COIN', claimed: false, floatOffset: 0 },
      { id: 8, x: 296, y: 310, w: 20, h: 20, type: 'COIN', claimed: false, floatOffset: 1 },
      { id: 9, x: 890, y: 300, w: 20, h: 20, type: 'COIN', claimed: false, floatOffset: 2 },
      { id: 10, x: 1070, y: 240, w: 20, h: 20, type: 'COIN', claimed: false, floatOffset: 0 },
      { id: 11, x: 1110, y: 240, w: 20, h: 20, type: 'COIN', claimed: false, floatOffset: 1 },

      { id: 12, x: 640, y: 420, w: 28, h: 28, type: 'STAR', claimed: false, floatOffset: 0 },
      { id: 13, x: 1530, y: 300, w: 28, h: 28, type: 'CHAOS_EMERALD', claimed: false, floatOffset: 0 },
      { id: 14, x: 1950, y: 300, w: 32, h: 28, type: 'CHEST', claimed: false, floatOffset: 0 },
      { id: 15, x: 2450, y: 340, w: 34, h: 30, type: 'CHEST', claimed: false, floatOffset: 0 },
    ];

    const e: Enemy[] = [
      { id: 1, x: 380, y: 424, w: 32, h: 36, vx: -1.2, hp: 60, maxHp: 60, type: 'GOOMBA', name: 'Goomba', patrolMinX: 300, patrolMaxX: 520, isBoss: false },
      { id: 2, x: 920, y: 424, w: 32, h: 36, vx: 1.2, hp: 60, maxHp: 60, type: 'GOOMBA', name: 'Goomba', patrolMinX: 840, patrolMaxX: 1100, isBoss: false },
      { id: 3, x: 1550, y: 424, w: 32, h: 36, vx: -1.4, hp: 70, maxHp: 70, type: 'GOOMBA', name: 'Spike Goomba', patrolMinX: 1460, patrolMaxX: 1720, isBoss: false },

      { id: 4, x: 600, y: 424, w: 38, h: 36, vx: -1.8, hp: 90, maxHp: 90, type: 'MOTOBUG', name: 'Motobug', patrolMinX: 480, patrolMaxX: 680, isBoss: false },
      { id: 5, x: 1200, y: 424, w: 38, h: 36, vx: 2.0, hp: 100, maxHp: 100, type: 'MOTOBUG', name: 'Badnik Beetle', patrolMinX: 1050, patrolMaxX: 1350, isBoss: false },
      { id: 6, x: 1800, y: 424, w: 38, h: 36, vx: -2.2, hp: 120, maxHp: 120, type: 'MOTOBUG', name: 'Sonic Crabmeat', patrolMinX: 1650, patrolMaxX: 1950, isBoss: false },

      { 
        id: 100, 
        x: 2320, 
        y: 290, 
        w: 90, 
        h: 90, 
        vx: -1.5, 
        hp: 3000, 
        maxHp: 3000, 
        type: 'BOWSER_EGGMAN', 
        name: 'Dr. Egg-Bowser (Sepolia Warden)', 
        patrolMinX: 2180, 
        patrolMaxX: 2500, 
        isBoss: true 
      },
    ];

    gameStateRef.current = {
      keys: {},
      cameraX: 0,
      player: {
        x: 80,
        y: 380,
        w: 32,
        h: 40,
        vx: 0,
        vy: 0,
        isGrounded: false,
        facing: 'right',
        character: selectedHero,
        hp: 100,
        maxHp: 100,
        spinDash: false,
        spinCharge: 0,
        isInvincible: false,
        invincibleTimer: 0,
        score: 0,
        rings: 0,
        coins: 0,
        kills: 0,
        animFrame: 0,
      },
      platforms: p,
      collectibles: c,
      enemies: e,
      projectiles: [],
      particles: [],
      animFrameId: 0,
      levelLength: 2600,
    };

    setHudStats({
      hp: 100,
      maxHp: 100,
      rings: 0,
      coins: 0,
      score: 0,
      bossHp: 3000,
      bossMaxHp: 3000,
      kills: 0,
    });
    setGameWon(false);
    setPendingEOAActionName(null);
  }, []);

  const handleSelectCharacter = (hero: CharacterChoice) => {
    setCharacter(hero);
    initLevel(hero);
  };

  // Perform Jump Action (Guarded in EOA mode)
  const executeJump = useCallback(async () => {
    const p = gameStateRef.current.player;
    if (!p.isGrounded || isExecutingEOARef.current) return;

    if (walletModeRef.current === 'EOA') {
      isExecutingEOARef.current = true;
      setPendingEOAActionName('Platformer Jump Move');
      const approved = await onExecuteOnChainActionRef.current('Platformer Jump (EOA Approved)', '0x2f91a03c');
      setPendingEOAActionName(null);
      isExecutingEOARef.current = false;

      if (!approved) {
        setEoaFailedNotice('Jump Signature Rejected by User');
        setTimeout(() => setEoaFailedNotice(null), 3500);
        return;
      }
    }

    const jumpStrength = p.character === 'MARIO' ? -14.5 : -13.5;
    p.vy = jumpStrength;
    p.isGrounded = false;

    if (walletModeRef.current === 'ERC4337') {
      onExecuteOnChainActionRef.current('Platformer Jump', '0x2f91a03c');
    }

    for (let i = 0; i < 4; i++) {
      gameStateRef.current.particles.push({
        x: p.x + 16,
        y: p.y + 40,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2,
        life: 14,
        maxLife: 14,
        color: '#e7e5e4',
        size: 4,
      });
    }
  }, []);

  // Perform Attack Action (Guarded in EOA mode)
  const executeAttack = useCallback(async () => {
    const p = gameStateRef.current.player;
    if (isExecutingEOARef.current) return;

    const actionTitle = p.character === 'MARIO' ? 'Mario Fireball Blast' : 'Sonic Spin Slash';
    const selector = p.character === 'MARIO' ? '0x7b1c31a2' : '0x3d9c84e1';

    if (walletModeRef.current === 'EOA') {
      isExecutingEOARef.current = true;
      setPendingEOAActionName(actionTitle);
      const approved = await onExecuteOnChainActionRef.current(actionTitle, selector);
      setPendingEOAActionName(null);
      isExecutingEOARef.current = false;

      if (!approved) {
        setEoaFailedNotice(`${actionTitle} Rejected by User in MetaMask`);
        setTimeout(() => setEoaFailedNotice(null), 3500);
        return;
      }
    } else {
      setLastUserOpNotice(`Sepolia UserOp: ${actionTitle}`);
      setTimeout(() => setLastUserOpNotice(null), 2500);
      onExecuteOnChainActionRef.current(actionTitle, selector);
    }

    const dir = p.facing === 'right' ? 1 : -1;
    if (p.character === 'MARIO') {
      gameStateRef.current.projectiles.push({
        id: Date.now() + Math.random(),
        x: p.x + (dir === 1 ? p.w : 0),
        y: p.y + 16,
        vx: dir * 9.5,
        vy: 2,
        radius: 9,
        damage: 75,
        type: 'FIREBALL',
        color: '#f97316',
      });
    } else {
      gameStateRef.current.projectiles.push({
        id: Date.now() + Math.random(),
        x: p.x + (dir === 1 ? p.w : 0),
        y: p.y + 16,
        vx: dir * 14.5,
        vy: 0,
        radius: 10,
        damage: 90,
        type: 'SPIN_BLAST',
        color: '#0284c7',
      });
    }
  }, []);

  // Main 60 FPS loop mounted ONCE per character selection
  useEffect(() => {
    initLevel(character);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = true;

      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        executeJump();
      }

      if (e.code === 'KeyJ' || e.code === 'KeyX' || e.code === 'KeyQ') {
        executeAttack();
      }

      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        const p = gameStateRef.current.player;
        if (p.character === 'SONIC' && p.isGrounded) {
          p.spinDash = true;
          p.spinCharge = Math.min(20, p.spinCharge + 5);
          for (let i = 0; i < 4; i++) {
            gameStateRef.current.particles.push({
              x: p.x + 16,
              y: p.y + 36,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 3,
              life: 15,
              maxLife: 15,
              color: '#38bdf8',
              size: 4,
            });
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        const p = gameStateRef.current.player;
        if (p.spinDash && p.spinCharge > 0) {
          p.vx = (p.facing === 'right' ? 1 : -1) * (11 + p.spinCharge);
          p.spinCharge = 0;
          p.spinDash = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = () => {
      const state = gameStateRef.current;
      const p = state.player;

      if (!isExecutingEOARef.current && p.hp > 0 && !gameWon) {
        const maxSpeed = p.character === 'SONIC' ? 9.8 : 7.0;
        const accel = p.character === 'SONIC' ? 0.75 : 0.6;
        const friction = 0.85;
        const gravity = 0.68;

        if (state.keys['KeyA'] || state.keys['ArrowLeft']) {
          p.vx -= accel;
          p.facing = 'left';
        } else if (state.keys['KeyD'] || state.keys['ArrowRight']) {
          p.vx += accel;
          p.facing = 'right';
        } else {
          p.vx *= friction;
        }

        if (Math.abs(p.vx) > maxSpeed) {
          p.vx = (p.vx > 0 ? 1 : -1) * maxSpeed;
        }

        p.vy += gravity;
        if (p.vy > 16) p.vy = 16;

        p.x += p.vx;
        p.y += p.vy;

        if (p.isInvincible) {
          p.invincibleTimer--;
          if (p.invincibleTimer <= 0) p.isInvincible = false;
        }

        p.animFrame += Math.abs(p.vx) * 0.15 + 0.05;

        p.isGrounded = false;
        state.platforms.forEach((plat) => {
          if (
            p.x + p.w > plat.x &&
            p.x < plat.x + plat.w &&
            p.y + p.h >= plat.y &&
            p.y + p.h <= plat.y + 22 &&
            p.vy >= 0
          ) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.isGrounded = true;
          }

          if (
            p.x + p.w > plat.x &&
            p.x < plat.x + plat.w &&
            p.y <= plat.y + plat.h &&
            p.y >= plat.y + plat.h - 14 &&
            p.vy < 0
          ) {
            p.vy = 2;
            if (plat.type === 'QUESTION' && plat.hasItem && !plat.itemClaimed) {
              plat.itemClaimed = true;
              p.coins += 1;
              p.score += 200;
              state.collectibles.push({
                id: Date.now() + Math.random(),
                x: plat.x + 6,
                y: plat.y - 30,
                w: 20,
                h: 20,
                type: 'COIN',
                claimed: true,
                floatOffset: 0,
              });
              onExecuteOnChainActionRef.current('Claim Block Bounty', '0x9d4a821e');
            }
          }
        });

        if (p.y > 600) {
          p.x = 80;
          p.y = 350;
          p.vx = 0;
          p.vy = 0;
          p.hp = Math.max(0, p.hp - 25);
        }

        const targetCameraX = p.x - 320;
        state.cameraX += (targetCameraX - state.cameraX) * 0.1;
        if (state.cameraX < 0) state.cameraX = 0;
        if (state.cameraX > state.levelLength - 880) state.cameraX = state.levelLength - 880;

        state.collectibles.forEach((item) => {
          if (!item.claimed) {
            item.floatOffset += 0.05;
            if (
              p.x + p.w > item.x &&
              p.x < item.x + item.w &&
              p.y + p.h > item.y &&
              p.y < item.y + item.h
            ) {
              item.claimed = true;
              if (item.type === 'RING') {
                p.rings += 1;
                p.score += 100;
              } else if (item.type === 'COIN') {
                p.coins += 1;
                p.score += 200;
              } else if (item.type === 'STAR' || item.type === 'CHAOS_EMERALD') {
                p.isInvincible = true;
                p.invincibleTimer = 400;
                p.score += 1000;
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                onExecuteOnChainActionRef.current('Activate Super Form', '0x1c8b392a');
              } else if (item.type === 'CHEST') {
                p.score += 500;
                p.hp = Math.min(100, p.hp + 40);
                onExecuteOnChainActionRef.current('Open Sepolia Chest', '0x49f2b187');
              }

              for (let i = 0; i < 6; i++) {
                state.particles.push({
                  x: item.x + item.w / 2,
                  y: item.y + item.h / 2,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 20,
                  maxLife: 20,
                  color: item.type === 'RING' ? '#facc15' : '#38bdf8',
                  size: 4,
                });
              }
            }
          }
        });

        state.enemies.forEach((enemy) => {
          if (enemy.hp > 0) {
            enemy.x += enemy.vx;
            if (enemy.x <= enemy.patrolMinX || enemy.x + enemy.w >= enemy.patrolMaxX) {
              enemy.vx *= -1;
            }

            if (enemy.isBoss && Math.random() < 0.018) {
              state.projectiles.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y + 35,
                vx: -7.0,
                vy: (Math.random() - 0.5) * 2,
                radius: 12,
                damage: 25,
                type: 'BOSS_FIRE',
                color: '#dc2626',
              });
            }

            if (
              p.x + p.w > enemy.x &&
              p.x < enemy.x + enemy.w &&
              p.y + p.h > enemy.y &&
              p.y < enemy.y + enemy.h
            ) {
              const isStomping = p.vy > 0 && p.y + p.h - p.vy <= enemy.y + 16;
              const isSpinning = p.spinDash || p.isInvincible;

              if (isStomping || isSpinning) {
                const damage = isSpinning ? 120 : 65;
                enemy.hp -= damage;
                p.vy = -11;
                p.score += 250;

                for (let k = 0; k < 8; k++) {
                  state.particles.push({
                    x: enemy.x + enemy.w / 2,
                    y: enemy.y + enemy.h / 2,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 20,
                    maxLife: 20,
                    color: '#f87171',
                    size: 4,
                  });
                }

                if (enemy.hp <= 0) {
                  p.kills += 1;
                  onExecuteOnChainActionRef.current(`Defeated ${enemy.name}`, '0x5c8e2b91');
                  if (enemy.isBoss) {
                    setGameWon(true);
                    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
                  }
                }
              } else if (!p.isInvincible) {
                p.hp = Math.max(0, p.hp - 15);
                p.isInvincible = true;
                p.invincibleTimer = 80;
                p.vy = -5;
                p.vx = p.facing === 'right' ? -6 : 6;
              }
            }
          }
        });

        for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const proj = state.projectiles[i];
          proj.x += proj.vx;
          proj.y += proj.vy;

          let hit = false;
          state.enemies.forEach((enemy) => {
            if (
              enemy.hp > 0 &&
              proj.x > enemy.x &&
              proj.x < enemy.x + enemy.w &&
              proj.y > enemy.y &&
              proj.y < enemy.y + enemy.h
            ) {
              enemy.hp -= proj.damage;
              hit = true;
              if (enemy.hp <= 0) {
                p.kills += 1;
                onExecuteOnChainActionRef.current(`Defeated ${enemy.name}`, '0x5c8e2b91');
                if (enemy.isBoss) {
                  setGameWon(true);
                  confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
                }
              }
            }
          });

          if (
            proj.type === 'BOSS_FIRE' &&
            !p.isInvincible &&
            proj.x > p.x &&
            proj.x < p.x + p.w &&
            proj.y > p.y &&
            proj.y < p.y + p.h
          ) {
            p.hp = Math.max(0, p.hp - proj.damage);
            p.isInvincible = true;
            p.invincibleTimer = 60;
            hit = true;
          }

          if (hit || proj.x < state.cameraX - 50 || proj.x > state.cameraX + 950) {
            state.projectiles.splice(i, 1);
          }
        }

        for (let i = state.particles.length - 1; i >= 0; i--) {
          const part = state.particles[i];
          part.x += part.vx;
          part.y += part.vy;
          part.life--;
          if (part.life <= 0) state.particles.splice(i, 1);
        }

        const boss = state.enemies.find((e) => e.isBoss);
        setHudStats({
          hp: Math.round(p.hp),
          maxHp: 100,
          rings: p.rings,
          coins: p.coins,
          score: p.score,
          bossHp: boss ? Math.max(0, boss.hp) : 0,
          bossMaxHp: 3000,
          kills: p.kills,
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cam = state.cameraX;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#38bdf8');
      skyGrad.addColorStop(0.85, '#bae6fd');
      skyGrad.addColorStop(1, '#86efac');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(canvas.width - 90, 70, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) {
        const cloudX = (i * 360 - cam * 0.25) % (canvas.width + 300);
        const cloudY = 40 + (i % 3) * 35;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 26, 0, Math.PI * 2);
        ctx.arc(cloudX + 24, cloudY - 10, 32, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#4ade80';
      for (let i = 0; i < 7; i++) {
        const hillX = i * 460 - cam * 0.4;
        ctx.beginPath();
        ctx.arc(hillX, 480, 240, Math.PI, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(-cam, 0);

      state.platforms.forEach((plat) => {
        if (plat.type === 'GROUND') {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(plat.x, plat.y, plat.w, 16);
          ctx.fillStyle = '#15803d';
          for (let gx = plat.x; gx < plat.x + plat.w; gx += 16) {
            ctx.beginPath();
            ctx.moveTo(gx, plat.y + 16);
            ctx.lineTo(gx + 8, plat.y + 22);
            ctx.lineTo(gx + 16, plat.y + 16);
            ctx.fill();
          }
          ctx.fillStyle = '#78350f';
          ctx.fillRect(plat.x, plat.y + 16, plat.w, plat.h - 16);

          ctx.fillStyle = '#451a03';
          for (let x = plat.x; x < plat.x + plat.w; x += 32) {
            for (let y = plat.y + 16; y < plat.y + plat.h; y += 32) {
              if ((Math.floor(x / 32) + Math.floor(y / 32)) % 2 === 0) {
                ctx.fillRect(x, y, 32, 32);
              }
            }
          }
        } else if (plat.type === 'QUESTION') {
          ctx.fillStyle = plat.itemClaimed ? '#a8a29e' : '#f59e0b';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

          ctx.fillStyle = '#451a03';
          ctx.fillRect(plat.x + 2, plat.y + 2, 3, 3);
          ctx.fillRect(plat.x + plat.w - 5, plat.y + 2, 3, 3);
          ctx.fillRect(plat.x + 2, plat.y + plat.h - 5, 3, 3);
          ctx.fillRect(plat.x + plat.w - 5, plat.y + plat.h - 5, 3, 3);

          if (!plat.itemClaimed) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('?', plat.x + 9, plat.y + 24);
          }
        } else if (plat.type === 'BRICK') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

          ctx.strokeStyle = '#78350f';
          ctx.beginPath();
          ctx.moveTo(plat.x, plat.y + plat.h / 2);
          ctx.lineTo(plat.x + plat.w, plat.y + plat.h / 2);
          for (let bx = plat.x + 16; bx < plat.x + plat.w; bx += 32) {
            ctx.moveTo(bx, plat.y);
            ctx.lineTo(bx, plat.y + plat.h / 2);
            ctx.moveTo(bx - 16, plat.y + plat.h / 2);
            ctx.lineTo(bx - 16, plat.y + plat.h);
          }
          ctx.stroke();
        } else if (plat.type === 'CHECKER') {
          ctx.fillStyle = '#eab308';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#ca8a04';
          for (let x = plat.x; x < plat.x + plat.w; x += 16) {
            if (Math.floor(x / 16) % 2 === 0) {
              ctx.fillRect(x, plat.y, 16, plat.h);
            }
          }
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(plat.x, plat.y, plat.w, 4);
        }
      });

      state.collectibles.forEach((item) => {
        if (!item.claimed) {
          const floatY = item.y + Math.sin(item.floatOffset) * 4;
          if (item.type === 'RING') {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.ellipse(item.x + 10, floatY + 10, 9, 9, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(item.x + 9, floatY + 8, 6, 0, Math.PI * 2);
            ctx.stroke();
          } else if (item.type === 'COIN') {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.ellipse(item.x + 10, floatY + 10, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(item.x + 8, floatY + 4, 4, 12);
          } else if (item.type === 'STAR') {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(item.x + 14, floatY + 14, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(item.x + 10, floatY + 10, 2, 7);
            ctx.fillRect(item.x + 16, floatY + 10, 2, 7);
          } else if (item.type === 'CHAOS_EMERALD') {
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.moveTo(item.x + 14, floatY);
            ctx.lineTo(item.x + 28, floatY + 12);
            ctx.lineTo(item.x + 14, floatY + 28);
            ctx.lineTo(item.x, floatY + 12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (item.type === 'CHEST') {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(item.x, floatY, item.w, item.h);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(item.x, floatY + 6, item.w, 4);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(item.x + item.w / 2 - 3, floatY + 8, 6, 6);
          }
        }
      });

      state.projectiles.forEach((proj) => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      state.particles.forEach((part) => {
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, (part.life / part.maxLife) * part.size, 0, Math.PI * 2);
        ctx.fill();
      });

      state.enemies.forEach((enemy) => {
        if (enemy.hp > 0) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);

          if (enemy.type === 'GOOMBA') {
            ctx.fillStyle = '#854d0e';
            ctx.beginPath();
            ctx.arc(enemy.w / 2, 16, 16, Math.PI, 0);
            ctx.lineTo(enemy.w, enemy.h - 8);
            ctx.lineTo(0, enemy.h - 8);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillRect(7, 10, 6, 9);
            ctx.fillRect(enemy.w - 13, 10, 6, 9);
            ctx.fillStyle = '#000';
            ctx.fillRect(9, 12, 4, 7);
            ctx.fillRect(enemy.w - 11, 12, 4, 7);

            ctx.fillStyle = '#1c1917';
            ctx.fillRect(2, enemy.h - 8, 12, 8);
            ctx.fillRect(enemy.w - 14, enemy.h - 8, 12, 8);
          } else if (enemy.type === 'MOTOBUG') {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(enemy.w / 2, 16, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemy.w / 2 - 6, 4);
            ctx.lineTo(enemy.w / 2 - 12, -4);
            ctx.moveTo(enemy.w / 2 + 6, 4);
            ctx.lineTo(enemy.w / 2 + 12, -4);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.fillRect(enemy.vx > 0 ? enemy.w - 12 : 3, 10, 9, 9);
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.vx > 0 ? enemy.w - 8 : 5, 12, 5, 5);

            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(enemy.w / 2, enemy.h - 6, 9, 0, Math.PI * 2);
            ctx.fill();
          } else if (enemy.isBoss) {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(0, 0, enemy.w, enemy.h);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, enemy.w, enemy.h);

            ctx.fillStyle = '#dc2626';
            ctx.fillRect(8, 8, enemy.w - 16, 32);

            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.moveTo(enemy.w / 2, 44);
            ctx.lineTo(4, 58);
            ctx.lineTo(enemy.w / 2, 50);
            ctx.lineTo(enemy.w - 4, 58);
            ctx.fill();

            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(18, -20);
            ctx.lineTo(26, 0);
            ctx.moveTo(enemy.w - 26, 0);
            ctx.lineTo(enemy.w - 18, -20);
            ctx.lineTo(enemy.w - 14, 0);
            ctx.fill();

            const hpRatio = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, -26, enemy.w, 6);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, -26, enemy.w * hpRatio, 6);

            ctx.fillStyle = '#2d2b28';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(enemy.name, -10, -32);
          }

          ctx.restore();
        }
      });

      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.isInvincible && Math.floor(Date.now() / 60) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      if (p.character === 'SONIC') {
        if (p.spinDash) {
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(p.w / 2, p.h / 2, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(6, 10, 20, 22);

          ctx.beginPath();
          const quillDir = p.facing === 'right' ? -1 : 1;
          ctx.arc(p.w / 2, 14, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(p.w / 2, 6);
          ctx.lineTo(p.w / 2 + quillDir * 18, 2);
          ctx.lineTo(p.w / 2, 14);
          ctx.lineTo(p.w / 2 + quillDir * 20, 12);
          ctx.lineTo(p.w / 2, 22);
          ctx.fill();

          ctx.fillStyle = '#fde68a';
          ctx.fillRect(10, 16, 12, 12);
          const eyeOffset = p.facing === 'right' ? 14 : 4;
          ctx.fillRect(eyeOffset, 10, 10, 10);

          ctx.fillStyle = '#000';
          const pupilX = p.facing === 'right' ? 19 : 6;
          ctx.fillRect(pupilX, 12, 4, 6);

          ctx.fillStyle = '#dc2626';
          ctx.fillRect(3, p.h - 9, 12, 9);
          ctx.fillRect(p.w - 15, p.h - 9, 12, 9);
          ctx.fillStyle = '#fff';
          ctx.fillRect(6, p.h - 9, 4, 9);
          ctx.fillRect(p.w - 12, p.h - 9, 4, 9);
        }
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(5, 2, 22, 9);
        ctx.fillRect(p.facing === 'right' ? 14 : 2, 7, 14, 4);
        ctx.fillRect(7, 16, 18, 14);

        ctx.fillStyle = '#2563eb';
        ctx.fillRect(7, 22, 18, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(9, 22, 3, 3);
        ctx.fillRect(20, 22, 3, 3);

        ctx.fillStyle = '#fde68a';
        const faceX = p.facing === 'right' ? 12 : 4;
        ctx.fillRect(faceX, 9, 14, 9);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(p.facing === 'right' ? 2 : 20, 9, 8, 9);
        ctx.fillRect(faceX + (p.facing === 'right' ? 4 : 0), 13, 10, 5);

        ctx.fillRect(2, p.h - 7, 12, 7);
        ctx.fillRect(p.w - 14, p.h - 7, 12, 7);
      }

      ctx.restore();
      ctx.restore();

      state.animFrameId = requestAnimationFrame(loop);
    };

    gameStateRef.current.animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(gameStateRef.current.animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [character, initLevel, executeJump, executeAttack]);

  return (
    <div className="space-y-3 font-sans">
      
      {/* Top HUD Bar */}
      <div className="bg-bg-elevated border border-border-default rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-card">
        
        <div className="flex items-center gap-2">
          <button
            onClick={onExitGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-border-default border border-border-default text-text-primary font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>

          {/* Hero Switcher */}
          <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-lg border border-border-default">
            <button
              onClick={() => handleSelectCharacter('SONIC')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                character === 'SONIC'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <FastForward className="w-3 h-3" />
              <span>Sonic</span>
            </button>
            <button
              onClick={() => handleSelectCharacter('MARIO')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                character === 'MARIO'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Gamepad2 className="w-3 h-3" />
              <span>Mario</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-accent-red font-semibold">
            <Heart className="w-3.5 h-3.5" />
            <span>HP: {hudStats.hp}/100</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
            <Coins className="w-3.5 h-3.5" />
            <span>{character === 'SONIC' ? `${hudStats.rings} Rings` : `${hudStats.coins} Coins`}</span>
          </div>

          <div className="flex items-center gap-1.5 text-accent-primary font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Score: {hudStats.score}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-accent-red font-semibold">
            <span>Boss: {hudStats.bossHp} HP</span>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2">
          {lastUserOpNotice ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent-green/10 border border-accent-green/30 text-[11px] font-mono text-accent-green font-semibold animate-fadeIn">
              <Activity className="w-3 h-3 text-accent-green" />
              <span>{lastUserOpNotice}</span>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-text-tertiary flex items-center gap-1">
              <Shield className="w-3 h-3 text-accent-green" />
              <span>{walletMode === 'ERC4337' ? '0-Popup Session Active' : 'EOA Popup Mode Active'}</span>
            </div>
          )}

          <button
            onClick={onOpenInspector}
            className="px-2.5 py-1 rounded bg-bg-secondary hover:bg-border-default border border-border-default text-text-primary font-medium text-xs transition-colors"
          >
            AA Inspector
          </button>
        </div>

      </div>

      {/* Canvas */}
      <div className="relative bg-bg-elevated border border-border-default rounded-2xl overflow-hidden shadow-modal flex flex-col items-center">
        
        <canvas
          ref={canvasRef}
          width={880}
          height={500}
          className="w-full max-w-[880px] h-[500px] block select-none"
        />

        {/* EOA Modal Notice Interruption */}
        {pendingEOAActionName && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-30 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white">Action Paused: Waiting for MetaMask</h3>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              Requested: <strong>{pendingEOAActionName}</strong>.<br />
              In Standard EOA mode, game physics are frozen. Confirm or reject in your wallet extension.
            </p>
          </div>
        )}

        {/* EOA Failure Alert */}
        {eoaFailedNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-accent-red text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 z-30 animate-fadeIn">
            <AlertTriangle className="w-4 h-4" />
            <span>{eoaFailedNotice}</span>
          </div>
        )}

        {/* Victory Screen */}
        {gameWon && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white">raidKey Victory! Boss Defeated!</h3>
            <p className="text-xs text-slate-300 max-w-md">
              Dr. Egg-Bowser defeated on Ethereum Sepolia. 0 popups in ERC-4337 mode.
            </p>
            <button
              onClick={() => initLevel(character)}
              className="px-5 py-2.5 rounded-xl bg-text-primary text-text-inverse font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="w-full bg-bg-secondary border-t border-border-default px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-4 text-[11px]">
            <span><strong className="text-text-primary">A / D</strong> Run</span>
            <span><strong className="text-text-primary">W / Space</strong> Jump</span>
            <span><strong className="text-text-primary">J / X / Q</strong> {character === 'SONIC' ? 'Spin Slash' : 'Fireball'}</span>
            <span><strong className="text-text-primary">S / Down</strong> Spin-Dash</span>
          </div>

          <div className="text-[11px] font-mono text-accent-green font-semibold">
            raidKey • Ethereum Sepolia Engine
          </div>
        </div>

      </div>

    </div>
  );
};
