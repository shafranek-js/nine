import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { selectBotMove } from '../core/ai';
import { upsertHighScore } from '../core/persistence';
import { createDefaultRng, type Rng } from '../core/rng';
import {
  applyMove,
  applyPass,
  cardKey,
  computeHandLayout,
  createMatch,
  getFinalClubScore,
  getLegalMoves,
  HAND_TOP_Y,
  isLegalMove,
  startNextRound,
  type HandCardLayout,
} from '../core/rules';
import {
  PASS_PENALTY,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  Suit,
  type Card,
  type MatchState,
  type Rank,
  type SeatIndex,
} from '../core/types';
import { sliceMaskedTexture, sliceTexture } from '../engine/BitmapFont';
import { createHdTexture, drawSuitShape, getHdCardLibrary, getHdRivalCardBackTexture } from '../engine/hdCards';
import {
  createHdDealer,
  createHdRival,
  createHdTextSprite,
  getHdCandelabraTexture,
  getHdCoinTexture,
  getWarmGlowTexture,
  type HdDealerController,
  type HdRivalController,
  type RivalAnimMode,
} from '../engine/hdCharacters';
import type { GameContext, Scene } from './SceneManager';

type TablePhase =
  | 'anteIntro'
  | 'waitingTurn'
  | 'movingCard'
  | 'passing'
  | 'illegalShake'
  | 'roundEnd'
  | 'matchEnd';

interface FlyingCard {
  sprite: Sprite;
  shadow: Graphics | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  elapsed: number;
  durationMs: number;
  onLand: () => void;
}

interface FlyingCoin {
  sprite: Sprite;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  elapsed: number;
  durationMs: number;
}

interface SparkParticle {
  readonly gfx: Graphics;
  vx: number;
  vy: number;
  lifeMs: number;
  maxLifeMs: number;
}

interface HandCardEntry {
  readonly layout: HandCardLayout;
  readonly container: Container;
  readonly baseY: number;
  liftPx: number;
}

const CANDLE_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 150, y: 15 },
  { x: 165, y: 9 },
  { x: 180, y: 15 },
  { x: 452, y: 15 },
  { x: 467, y: 9 },
  { x: 482, y: 15 },
];

let cachedFeltTexture: Texture | null = null;
function getHdFeltTableTexture(): Texture {
  if (cachedFeltTexture) return cachedFeltTexture;
  cachedFeltTexture = createHdTexture(384, 174, (ctx, w, h) => {
    // Rich mahogany frame with brass trim
    ctx.fillStyle = '#2d1409';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 10);
    ctx.fill();

    const mahog = ctx.createLinearGradient(0, 0, 0, h);
    mahog.addColorStop(0, '#6e381d');
    mahog.addColorStop(0.5, '#4c2210');
    mahog.addColorStop(1, '#311408');
    ctx.fillStyle = mahog;
    ctx.beginPath();
    ctx.roundRect(1.5, 1.5, w - 3, h - 3, 9);
    ctx.fill();

    // Brass inlay rim
    ctx.strokeStyle = '#d4a63d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(5, 5, w - 10, h - 10, 7);
    ctx.stroke();

    // Inner casino emerald velvet felt
    const feltX = 8;
    const feltY = 8;
    const feltW = w - 16;
    const feltH = h - 16;
    const feltG = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.6);
    feltG.addColorStop(0, '#147a3b');
    feltG.addColorStop(0.7, '#0c5929');
    feltG.addColorStop(1, '#073c1b');
    ctx.fillStyle = feltG;
    ctx.beginPath();
    ctx.roundRect(feltX, feltY, feltW, feltH, 5);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle recessed 9x4 grid slots (matching exact 145 + (r-6)*39, 71 + (s-1)*38 relative to table top-left (128, 60))
    const ranks: readonly Rank[] = [6, 7, 8, 9, 10, 11, 12, 13, 14];
    const suits: readonly Suit[] = [1, 2, 3, 4];
    const rankLabels: Record<Rank, string> = {
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: 'J',
      12: 'Q',
      13: 'K',
      14: 'A',
    };

    for (const suit of suits) {
      for (const rank of ranks) {
        const sx = 145 - 128 + (rank - 6) * 39;
        const sy = 71 - 60 + (suit - 1) * 38;
        const sw = 38;
        const sh = 37;
        const isNine = rank === 9;

        ctx.fillStyle = isNine ? 'rgba(218, 176, 68, 0.10)' : 'rgba(0, 0, 0, 0.14)';
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 3.6);
        ctx.fill();

        ctx.strokeStyle = isNine ? 'rgba(230, 188, 82, 0.46)' : 'rgba(212, 175, 55, 0.18)';
        ctx.lineWidth = isNine ? 0.95 : 0.65;
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = isNine ? 0.34 : 0.16;
        ctx.fillStyle = isNine ? '#ffe699' : '#d6eadb';
        ctx.font = 'bold 8.5px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rankLabels[rank], sx + sw * 0.5, sy + 11.5);
        drawSuitShape(ctx, suit, sx + sw * 0.5, sy + 24.5, 11);
        ctx.restore();
      }
    }
  });
  return cachedFeltTexture;
}

export class GameTableScene implements Scene {
  private ctx: GameContext | null = null;
  private rng: Rng = createDefaultRng();
  private match!: MatchState;

  private root = new Container();
  private bgLayer = new Container();
  private tableCardsLayer = new Container();
  private handLayer = new Container();
  private fxLayer = new Container();
  private hudLayer = new Container();
  private overlayLayer = new Container();

  // EGA visuals
  private leftCashLayer = new Container();
  private rightCashLayer = new Container();
  private humanCashLayer = new Container();
  private rivalCardsLayer = new Container();
  private egaMiniBackTex: Texture | null = null;
  private thermoSpr: Sprite | null = null;
  private dealerSpr: Sprite | null = null;
  private leftBotSpr: Sprite | null = null;
  private rightBotSpr: Sprite | null = null;
  private flameSprites: Sprite[] = [];
  private dealerIdleTex!: Texture;
  private dealerBlinkTex!: Texture;
  private dealerBellFrames: Texture[] = [];
  private dealerWagFrames: Texture[] = [];
  private botFrames: Texture[] = [];
  private flameFrames: Texture[] = [];
  private thermoTextures: Texture[] = [];
  private coinFrames: Texture[] = [];

  // HD visuals
  private hdDealer: HdDealerController | null = null;
  private hdLeftRival: HdRivalController | null = null;
  private hdRightRival: HdRivalController | null = null;
  private hdFlames: { container: Container; glow: Sprite }[] = [];
  private hdTurnHalos: { left: Graphics; right: Graphics; human: Graphics } | null = null;
  private hdBankBarFill: Graphics | null = null;
  private hdBankTextLayer = new Container();
  private hdBannerLayer = new Container();

  private phase: TablePhase = 'anteIntro';
  private phaseTimerMs = 0;
  private idleBlinkMs = 0;
  private activeFlightSeat: SeatIndex | null = null;
  private passingSeat: SeatIndex | null = null;
  private humanWaitMs = 0;
  private rivalPlayAnimMs: Record<1 | 2, number> = { 1: 0, 2: 0 };
  private pendingMoveCard: Card | null = null;
  private flyingCard: FlyingCard | null = null;
  private flyingCoins: FlyingCoin[] = [];
  private sparkParticles: SparkParticle[] = [];
  private currentHandLayouts: HandCardLayout[] = [];
  private handCardEntries: HandCardEntry[] = [];
  private hoveredCardKey: string | null = null;
  private roundWinner: SeatIndex | null = null;
  private roundWonPot = 0;
  private statusBanner = '';

  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;
  private unbindMove: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.rng = createDefaultRng();
    this.activeFlightSeat = null;
    this.passingSeat = null;
    this.humanWaitMs = 0;
    this.rivalPlayAnimMs = { 1: 0, 2: 0 };
    this.flyingCard = null;
    this.flyingCoins = [];
    this.sparkParticles = [];
    this.hoveredCardKey = null;
    this.statusBanner = '';

    this.root.addChild(this.bgLayer);
    this.root.addChild(this.tableCardsLayer);
    this.root.addChild(this.handLayer);
    this.root.addChild(this.hudLayer);
    this.root.addChild(this.fxLayer);
    this.root.addChild(this.overlayLayer);
    parent.addChild(this.root);

    const playerName = ctx.sessionPlayer.loggedIn ? ctx.sessionPlayer.name : 'Player';
    const playerPassword = ctx.sessionPlayer.loggedIn ? ctx.sessionPlayer.password : '';
    this.match = createMatch(
      playerName,
      playerPassword,
      ctx.sessionPlayer.clubCarryover,
      ctx.config.clubTable,
      this.rng,
    );

    this.buildVisuals();

    ctx.audio.music.play('table');
    this.beginRoundPresentation();

    this.unbindKey = ctx.input.onKeyDown(this.handleKeyDown);
    this.unbindPtr = ctx.input.onPointerDown(this.handlePointerDown);
    this.unbindMove = ctx.input.onPointerMove(this.handlePointerMove);
  }

  onGraphicsModeChanged(): void {
    this.buildVisuals();
    this.restoreBoardFromMatch();
    this.renderRivalCardBacks();
    this.renderCashAndBankHud();
    this.renderHumanHand();
    this.renderStatusBanner();
    if (this.phase === 'matchEnd') {
      const humanCash = this.match.cash[3];
      const botsOut = this.match.cash[1] <= 0 || this.match.cash[2] <= 0;
      const humanWon = humanCash > 0 && (botsOut || (humanCash >= this.match.cash[1] && humanCash >= this.match.cash[2]));
      this.drawMatchEndModal(humanWon, getFinalClubScore(this.match));
    }
  }

  private buildVisuals(): void {
    if (!this.ctx) return;
    this.bgLayer.removeChildren();
    this.hudLayer.removeChildren();
    this.leftCashLayer.removeChildren();
    this.rightCashLayer.removeChildren();
    this.humanCashLayer.removeChildren();
    this.rivalCardsLayer.removeChildren();
    this.leftCashLayer.position.set(0, 0);
    this.rightCashLayer.position.set(0, 0);
    this.humanCashLayer.position.set(0, 0);
    this.hdBankTextLayer.removeChildren();
    this.hdBannerLayer.removeChildren();
    this.flameSprites = [];
    this.hdFlames = [];
    this.thermoSpr = null;
    this.dealerSpr = null;
    this.leftBotSpr = null;
    this.rightBotSpr = null;
    this.egaMiniBackTex = null;
    this.hdDealer = null;
    this.hdLeftRival = null;
    this.hdRightRival = null;
    this.hdTurnHalos = null;
    this.hdBankBarFill = null;

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.buildEgaVisuals(this.ctx);
    } else {
      this.buildHdVisuals(this.ctx);
    }
  }

  private buildEgaVisuals(ctx: GameContext): void {
    const gr = ctx.assets.sheets.GR_NINE;
    this.bgLayer.addChild(new Sprite(ctx.assets.backgrounds.GF_NINE));

    this.dealerIdleTex = sliceTexture(gr, 477, 237, 60, 39);
    this.dealerBlinkTex = sliceTexture(gr, 477, 277, 60, 39);
    this.dealerBellFrames = [0, 1, 2, 3].map((i) => sliceTexture(gr, 200, 1 + i * 40, 60, 39));
    this.dealerWagFrames = [0, 1, 2].map((i) => sliceTexture(gr, 477, 117 + i * 40, 60, 39));
    this.botFrames = [0, 1, 2, 3, 4, 5].map((i) => sliceTexture(gr, 118, 1 + i * 43, 73, 42));
    this.coinFrames = [204, 230, 256].map((y) => sliceMaskedTexture(gr, 84, y, 24, 23));
    this.flameFrames = [0, 1, 2].map((i) => sliceTexture(gr, 39 + i * 8, 176, 7, 10));
    this.egaMiniBackTex = sliceTexture(gr, 478, 318, 14, 16);

    const flameErase = new Graphics();
    for (const pos of CANDLE_POSITIONS) {
      flameErase.rect(pos.x - 1, pos.y - 4, 9, 14).fill(0x000000);
    }
    this.bgLayer.addChild(flameErase);
    this.flameSprites = CANDLE_POSITIONS.map((pos, idx) => {
      const spr = new Sprite(this.flameFrames[idx % this.flameFrames.length]);
      spr.position.set(pos.x, pos.y);
      this.bgLayer.addChild(spr);
      return spr;
    });

    this.thermoTextures = [];
    for (let i = 0; i <= 32; i++) {
      let sx = 0;
      let sy = 332;
      if (i <= 6) {
        sx = 119 + i * 33;
        sy = 332;
      } else if (i <= 19) {
        sx = 119 + (i - 7) * 33;
        sy = 338;
      } else {
        sx = 119 + (i - 20) * 33;
        sy = 344;
      }
      this.thermoTextures.push(sliceTexture(gr, sx, sy, 32, 5));
    }

    this.dealerSpr = new Sprite(this.dealerIdleTex);
    this.dealerSpr.position.set(281, 20);
    this.bgLayer.addChild(this.dealerSpr);

    this.leftBotSpr = new Sprite(this.botFrames[0]);
    this.leftBotSpr.position.set(19, 101);
    this.bgLayer.addChild(this.leftBotSpr);

    this.rightBotSpr = new Sprite(this.botFrames[0]);
    this.rightBotSpr.position.set(531, 101);
    this.bgLayer.addChild(this.rightBotSpr);

    this.thermoSpr = new Sprite(this.thermoTextures[0]);
    this.thermoSpr.position.set(455, 51);
    this.bgLayer.addChild(this.thermoSpr);

    const cashBgMask = new Graphics();
    cashBgMask.rect(28, 187, 45, 9).fill(0x000000);
    cashBgMask.rect(540, 187, 45, 9).fill(0x000000);
    cashBgMask.rect(287, 244, 45, 9).fill(0x000000);
    this.hudLayer.addChild(cashBgMask);

    this.hudLayer.addChild(this.leftCashLayer);
    this.hudLayer.addChild(this.rightCashLayer);
    this.hudLayer.addChild(this.humanCashLayer);
    this.hudLayer.addChild(this.rivalCardsLayer);
  }

  private buildHdVisuals(ctx: GameContext): void {
    const bg = new Sprite(ctx.assets.hdBackgrounds.table);
    bg.width = SCREEN_WIDTH;
    bg.height = SCREEN_HEIGHT;
    this.bgLayer.addChild(bg);

    // Table shadow & mahogany emerald felt board aligned exactly over card slots
    const tableShadow = new Graphics();
    tableShadow.roundRect(126, 63, 388, 178, 12).fill({ color: 0x000000, alpha: 0.56 });
    this.bgLayer.addChild(tableShadow);

    const tableBoard = new Sprite(getHdFeltTableTexture());
    tableBoard.position.set(128, 60);
    this.bgLayer.addChild(tableBoard);

    // Active turn spotlight halos
    const leftHalo = new Graphics();
    leftHalo.ellipse(57, 124, 46, 28).fill({ color: 0xffe070, alpha: 0.16 }).stroke({ color: 0xffd564, width: 1.3, alpha: 0.75 });
    leftHalo.visible = false;

    const rightHalo = new Graphics();
    rightHalo.ellipse(569, 124, 46, 28).fill({ color: 0xffe070, alpha: 0.16 }).stroke({ color: 0xffd564, width: 1.3, alpha: 0.75 });
    rightHalo.visible = false;

    const humanHalo = new Graphics();
    humanHalo.roundRect(262, 238, 116, 19, 8).stroke({ color: 0xffd564, width: 1.4, alpha: 0.8 });
    humanHalo.visible = false;

    this.bgLayer.addChild(leftHalo, rightHalo, humanHalo);
    this.hdTurnHalos = { left: leftHalo, right: rightHalo, human: humanHalo };

    // Left & Right Brass Candelabras with dynamic 60fps flames & ambient light
    const candTex = getHdCandelabraTexture();
    const candLeft = new Sprite(candTex);
    candLeft.position.set(146, 13);
    const candRight = new Sprite(candTex);
    candRight.position.set(448, 13);
    this.bgLayer.addChild(candLeft, candRight);

    const candleTipPositions: readonly { x: number; y: number }[] = [
      { x: 154, y: 20 },
      { x: 168, y: 15 },
      { x: 182, y: 20 },
      { x: 456, y: 20 },
      { x: 470, y: 15 },
      { x: 484, y: 20 },
    ];
    for (const pos of candleTipPositions) {
      const glow = new Sprite(getWarmGlowTexture());
      glow.anchor.set(0.5);
      glow.position.set(pos.x, pos.y - 2);
      glow.scale.set(0.75);
      glow.blendMode = 'add';
      glow.alpha = 0.42;
      this.bgLayer.addChild(glow);

      const flameC = new Container();
      flameC.position.set(pos.x, pos.y);
      const outer = new Graphics();
      outer.ellipse(0, -3.5, 2.3, 4.6).fill({ color: 0xff9b21, alpha: 0.92 });
      outer.ellipse(0, -2.5, 1.2, 2.7).fill(0xfff6b8);
      flameC.addChild(outer);
      this.bgLayer.addChild(flameC);

      this.hdFlames.push({ container: flameC, glow });
    }

    // Dealer & Rival Rigs
    const dealer = createHdDealer(1.0);
    dealer.container.position.set(290, 17);
    this.bgLayer.addChild(dealer.container);
    this.hdDealer = dealer;

    const leftRival = createHdRival('left');
    leftRival.container.position.set(19, 98);
    this.bgLayer.addChild(leftRival.container);
    this.hdLeftRival = leftRival;

    const rightRival = createHdRival('right');
    rightRival.container.position.set(531, 98);
    this.bgLayer.addChild(rightRival.container);
    this.hdRightRival = rightRival;

    // Brass plaques for Bank, Thermo & Player Cash
    const plaques = new Graphics();
    const drawPlaque = (x: number, y: number, w: number, h: number) => {
      plaques.roundRect(x + 1, y + 1.5, w, h, 5).fill({ color: 0x000000, alpha: 0.5 });
      plaques.roundRect(x, y, w, h, 5).fill({ color: 0x101417, alpha: 0.9 }).stroke({ color: 0xc99c38, width: 1 });
    };
    // Bank left plaque & pot gauge right plaque
    drawPlaque(140, 40, 56, 17);
    drawPlaque(432, 40, 78, 17);
    // Cash plaques
    drawPlaque(22, 182, 70, 18);
    drawPlaque(534, 182, 70, 18);
    drawPlaque(264, 239, 112, 17);
    this.hudLayer.addChild(plaques);

    const bankLbl = createHdTextSprite('BANK', 54, 15, {
      font: 'bold 8.5px Georgia, serif',
      fill: '#ffe599',
      align: 'center',
    });
    bankLbl.position.set(141, 41);
    this.hudLayer.addChild(bankLbl);

    // Thermometer progress rail inside right plaque
    const barBg = new Graphics();
    barBg.roundRect(437, 51, 68, 3.5, 1.75).fill(0x1f2824).stroke({ color: 0x7a5c1d, width: 0.6 });
    this.hudLayer.addChild(barBg);

    const barFill = new Graphics();
    this.hudLayer.addChild(barFill);
    this.hdBankBarFill = barFill;

    this.hudLayer.addChild(this.hdBankTextLayer);
    this.hudLayer.addChild(this.leftCashLayer);
    this.hudLayer.addChild(this.rightCashLayer);
    this.hudLayer.addChild(this.humanCashLayer);
    this.hudLayer.addChild(this.rivalCardsLayer);
    this.hudLayer.addChild(this.hdBannerLayer);
  }

  private restoreBoardFromMatch(): void {
    this.tableCardsLayer.removeChildren();
    const round = this.match.round;
    if (!round) return;
    for (const suit of [1, 2, 3, 4] as const) {
      const bounds = round.tableBounds[suit];
      if (bounds.low <= 0 || bounds.high <= 0) continue;
      for (let r = bounds.low; r <= bounds.high; r++) {
        this.placeMiniCardOnTable({ suit, rank: r as Rank });
      }
    }
  }

  private beginRoundPresentation(): void {
    this.tableCardsLayer.removeChildren();
    this.overlayLayer.removeChildren();
    this.activeFlightSeat = null;
    this.passingSeat = null;
    this.humanWaitMs = 0;
    this.rivalPlayAnimMs = { 1: 0, 2: 0 };
    this.statusBanner = '';
    this.renderRivalCardBacks();
    this.renderCashAndBankHud();
    this.renderHumanHand();
    this.renderStatusBanner();

    // $20 ante coins fly into BANK
    this.spawnCoinFlight(56, 170, 165, 42, 420);
    this.spawnCoinFlight(568, 170, 175, 42, 420);
    this.spawnCoinFlight(316, 232, 170, 42, 420);
    this.ctx?.audio.sfx.coinChime();

    this.phase = 'anteIntro';
    this.phaseTimerMs = 0;
  }

  private getRivalCardSlotPos(seat: 1 | 2, index: number): { x: number; y: number } {
    const col = index % 6;
    const row = Math.floor(index / 6);
    const baseX = seat === 1 ? 14 : 526;
    const baseY = this.ctx?.getGraphicsMode() === 'hd' ? 144 : 145;
    return { x: baseX + col * 17, y: baseY + row * 18 };
  }

  private renderRivalCardBacks(): void {
    this.rivalCardsLayer.removeChildren();
    if (!this.ctx || !this.match.round) return;

    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const tex = isHd ? getHdRivalCardBackTexture() : this.egaMiniBackTex;
    if (!tex) return;

    const shadowGfx = isHd ? new Graphics() : null;
    if (shadowGfx) {
      this.rivalCardsLayer.addChild(shadowGfx);
    }

    for (const seat of [1, 2] as const) {
      const count = Math.min(12, this.match.round.hands[seat].length);
      for (let i = 0; i < count; i++) {
        const { x, y } = this.getRivalCardSlotPos(seat, i);
        if (shadowGfx) {
          shadowGfx.roundRect(x + 1, y + 1.5, 14, 16, 2.2).fill({ color: 0x000000, alpha: 0.42 });
        }
        const spr = new Sprite(tex);
        spr.position.set(x, y);
        this.rivalCardsLayer.addChild(spr);
      }
    }
  }

  private renderCashAndBankHud(): void {
    if (!this.ctx) return;

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.ctx.hudFont.renderFixedNumber(this.leftCashLayer, this.match.cash[1], 73 - 45, 188, 5, 9);
      this.ctx.hudFont.renderFixedNumber(this.rightCashLayer, this.match.cash[2], 585 - 45, 188, 5, 9);
      this.ctx.hudFont.renderFixedNumber(this.humanCashLayer, this.match.cash[3], 332 - 45, 245, 5, 9);

      const bank = this.match.round?.bank ?? 0;
      const segIdx = Math.max(0, Math.min(32, Math.floor(bank / 10)));
      if (this.thermoSpr) {
        this.thermoSpr.texture = this.thermoTextures[segIdx];
      }
      return;
    }

    // HD Cash & Bank HUD
    this.leftCashLayer.position.set(0, 0);
    this.rightCashLayer.position.set(0, 0);
    this.humanCashLayer.position.set(0, 0);
    this.leftCashLayer.removeChildren();
    this.rightCashLayer.removeChildren();
    this.humanCashLayer.removeChildren();
    this.hdBankTextLayer.removeChildren();

    const makeCash = (val: number, color: string) =>
      createHdTextSprite(`$${val}`, 66, 16, {
        font: 'bold 9.5px "Segoe UI", system-ui, sans-serif',
        fill: color,
        align: 'center',
      });

    const lSpr = makeCash(this.match.cash[1], '#f3deb0');
    lSpr.position.set(24, 183);
    this.leftCashLayer.addChild(lSpr);

    const rSpr = makeCash(this.match.cash[2], '#f3deb0');
    rSpr.position.set(536, 183);
    this.rightCashLayer.addChild(rSpr);

    const playerName = this.match.playerName.slice(0, 8).toUpperCase();
    const hSpr = createHdTextSprite(`${playerName}: $${this.match.cash[3]}`, 108, 15, {
      font: 'bold 9.5px "Segoe UI", system-ui, sans-serif',
      fill: '#ffe696',
      align: 'center',
    });
    hSpr.position.set(266, 240);
    this.humanCashLayer.addChild(hSpr);

    const bank = this.match.round?.bank ?? 0;
    const potSpr = createHdTextSprite(`POT $${bank}`, 74, 11, {
      font: 'bold 7.5px "Segoe UI", system-ui, sans-serif',
      fill: '#ffe89c',
      align: 'center',
    });
    potSpr.position.set(434, 40.5);
    this.hdBankTextLayer.addChild(potSpr);

    if (this.hdBankBarFill) {
      this.hdBankBarFill.clear();
      const frac = Math.max(0, Math.min(1, bank / 320));
      if (frac > 0) {
        this.hdBankBarFill.roundRect(437.5, 51.3, Math.max(3, 67 * frac), 2.8, 1.4).fill(0xebb538);
      }
    }
  }

  private renderStatusBanner(): void {
    this.hdBannerLayer.removeChildren();
    if (!this.statusBanner || !this.ctx || this.ctx.getGraphicsMode() !== 'hd') return;

    const pill = new Graphics();
    pill.roundRect(184, 214, 272, 18, 9).fill({ color: 0x3b0c12, alpha: 0.92 }).stroke({ color: 0xffb347, width: 1.1 });
    this.hdBannerLayer.addChild(pill);

    const txt = createHdTextSprite(this.statusBanner, 266, 16, {
      font: 'bold 8.5px "Segoe UI", system-ui, sans-serif',
      fill: '#ffe8a8',
      align: 'center',
    });
    txt.position.set(187, 215);
    this.hdBannerLayer.addChild(txt);
  }

  private getActiveMiniTexture(card: Card): Texture | undefined {
    const key = cardKey(card);
    if (this.ctx?.getGraphicsMode() === 'hd') {
      return getHdCardLibrary().miniCards.get(key);
    }
    return this.ctx?.assets.miniCards.get(key);
  }

  private getActiveCardTexture(card: Card): Texture | undefined {
    const key = cardKey(card);
    if (this.ctx?.getGraphicsMode() === 'hd') {
      return getHdCardLibrary().cards.get(key);
    }
    return this.ctx?.assets.cards.get(key);
  }

  private renderHumanHand(): void {
    if (!this.ctx) return;
    this.handLayer.removeChildren();
    this.handCardEntries = [];
    const hand = this.match.round?.hands[3] ?? [];
    this.currentHandLayouts = computeHandLayout(hand);
    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const round = this.match.round;
    const isHumanTurn = round && !round.roundOver && round.currentTurn === 3 && this.phase === 'waitingTurn';

    for (const layout of this.currentHandLayouts) {
      const tex = this.getActiveCardTexture(layout.card);
      if (!tex) continue;

      const cardContainer = new Container();
      cardContainer.position.set(layout.x, layout.y);

      if (isHd) {
        const shadow = new Graphics();
        shadow.roundRect(3, 4, 86, 86, 6).fill({ color: 0x000000, alpha: 0.36 });
        cardContainer.addChild(shadow);

        const legal = isHumanTurn && isLegalMove(layout.card, round.tableBounds, round.isFirstTurnOfRound);
        if (legal) {
          const glow = new Graphics();
          glow.roundRect(-1.5, -1.5, 91, 92, 7.5).stroke({ color: 0xffd75e, width: 1.8, alpha: 0.9 });
          cardContainer.addChild(glow);
        }
      }

      const spr = new Sprite(tex);
      cardContainer.addChild(spr);
      this.handLayer.addChild(cardContainer);

      this.handCardEntries.push({
        layout,
        container: cardContainer,
        baseY: layout.y,
        liftPx: 0,
      });
    }
  }

  private placeMiniCardOnTable(card: Card): void {
    const tex = this.getActiveMiniTexture(card);
    if (!tex) return;
    const spr = new Sprite(tex);
    spr.position.set(145 + (card.rank - 6) * 39, 71 + (card.suit - 1) * 38);
    this.tableCardsLayer.addChild(spr);
  }

  private spawnSparkBurst(x: number, y: number, count = 8, color = 0xffe484): void {
    if (this.ctx?.getGraphicsMode() !== 'hd') return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 22 + Math.random() * 34;
      const g = new Graphics();
      g.circle(0, 0, 1.3 + Math.random() * 1.1).fill(color);
      g.position.set(x, y);
      this.fxLayer.addChild(g);
      this.sparkParticles.push({
        gfx: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 10,
        lifeMs: 0,
        maxLifeMs: 360 + Math.random() * 200,
      });
    }
  }

  private spawnCoinFlight(startX: number, startY: number, endX: number, endY: number, durationMs = 360): void {
    const isHd = this.ctx?.getGraphicsMode() === 'hd';
    const tex = isHd ? getHdCoinTexture() : this.coinFrames[0];
    if (!tex) return;

    const spr = new Sprite(tex);
    spr.anchor.set(0.5);
    if (isHd) spr.scale.set(0.76);
    spr.position.set(startX, startY);
    this.fxLayer.addChild(spr);
    this.flyingCoins.push({
      sprite: spr,
      startX,
      startY,
      endX,
      endY,
      elapsed: 0,
      durationMs,
    });
  }

  private startCardFlight(seat: SeatIndex, card: Card, originX?: number, originY?: number): void {
    if (!this.ctx) return;
    const miniTex = this.getActiveMiniTexture(card);
    const endX = 145 + (card.rank - 6) * 39;
    const endY = 71 + (card.suit - 1) * 38;
    const rivalSlot =
      seat === 1 || seat === 2
        ? this.getRivalCardSlotPos(seat, Math.max(0, Math.min(11, (this.match.round?.hands[seat].length ?? 1) - 1)))
        : null;
    const startX = originX ?? (rivalSlot ? rivalSlot.x : 300);
    const startY = originY ?? (seat === 3 ? HAND_TOP_Y : rivalSlot ? rivalSlot.y : 120);

    this.ctx.audio.sfx.cardSlide();
    this.activeFlightSeat = seat;
    if ((seat === 1 || seat === 2) && this.ctx.getGraphicsMode() === 'hd') {
      this.rivalPlayAnimMs[seat] = 920;
    }
    this.pendingMoveCard = card;
    this.hoveredCardKey = null;

    const prevBank = this.match.round?.bank ?? 0;
    this.match = applyMove(this.match, card);
    if (this.match.round?.roundOver) {
      this.roundWinner = this.match.round.winner;
      this.roundWonPot = prevBank;
    } else {
      this.roundWinner = null;
      this.roundWonPot = 0;
    }

    if (seat === 3) {
      this.renderHumanHand();
    } else {
      this.renderRivalCardBacks();
      if (this.ctx.getGraphicsMode() === 'ega') {
        if (seat === 1 && this.leftBotSpr) this.leftBotSpr.texture = this.botFrames[2];
        else if (seat === 2 && this.rightBotSpr) this.rightBotSpr.texture = this.botFrames[2];
      }
    }

    if (!miniTex) {
      this.finishCardFlight();
      return;
    }

    const isHd = this.ctx.getGraphicsMode() === 'hd';
    let shadow: Graphics | null = null;
    if (isHd) {
      shadow = new Graphics();
      shadow.roundRect(3, 5, 38, 37, 3.6).fill({ color: 0x000000, alpha: 0.34 });
      shadow.position.set(startX, startY);
      this.fxLayer.addChild(shadow);
    }

    const spr = new Sprite(miniTex);
    spr.position.set(startX, startY);
    this.fxLayer.addChild(spr);

    this.phase = 'movingCard';
    this.phaseTimerMs = 0;
    this.flyingCard = {
      sprite: spr,
      shadow,
      startX,
      startY,
      endX,
      endY,
      elapsed: 0,
      durationMs: isHd ? 230 : 165,
      onLand: () => this.finishCardFlight(),
    };
  }

  private finishCardFlight(): void {
    this.activeFlightSeat = null;
    if (this.flyingCard) {
      this.spawnSparkBurst(this.flyingCard.endX + 19, this.flyingCard.endY + 18, 6, 0xffe48a);
      this.fxLayer.removeChild(this.flyingCard.sprite);
      if (this.flyingCard.shadow) this.fxLayer.removeChild(this.flyingCard.shadow);
      this.flyingCard = null;
    }
    if (this.pendingMoveCard) {
      this.placeMiniCardOnTable(this.pendingMoveCard);
      this.pendingMoveCard = null;
    }
    if (this.leftBotSpr) this.leftBotSpr.texture = this.botFrames[0];
    if (this.rightBotSpr) this.rightBotSpr.texture = this.botFrames[0];
    this.renderCashAndBankHud();

    if (this.match.round?.roundOver) {
      this.enterRoundEnd();
    } else {
      this.enterNextTurn();
    }
  }

  private triggerSeatPass(seat: SeatIndex): void {
    this.ctx?.audio.sfx.passAlert();
    this.match = applyPass(this.match);
    this.renderCashAndBankHud();
    this.renderStatusBanner();

    if (seat === 1) {
      this.spawnCoinFlight(56, 170, 165, 42, 380);
    } else if (seat === 2) {
      this.spawnCoinFlight(568, 170, 175, 42, 380);
    } else {
      this.spawnCoinFlight(316, 232, 170, 42, 380);
    }

    this.passingSeat = seat;
    this.phase = 'passing';
    this.phaseTimerMs = 0;
  }

  private enterNextTurn(): void {
    this.phase = 'waitingTurn';
    this.phaseTimerMs = 0;

    const round = this.match.round;
    if (!round || round.roundOver) return;

    if (round.currentTurn === 3) {
      const legal = getLegalMoves(round.hands[3], round.tableBounds, round.isFirstTurnOfRound);
      if (legal.length === 0) {
        this.statusBanner = `NO LEGAL MOVES — PASS -$${PASS_PENALTY}`;
      } else {
        this.statusBanner = '';
      }
    } else {
      this.statusBanner = '';
    }
    this.renderHumanHand();
    this.renderStatusBanner();
  }

  private enterRoundEnd(): void {
    this.ctx?.audio.sfx.victoryBeep();
    this.phase = 'roundEnd';
    this.phaseTimerMs = 0;
    this.statusBanner = '';
    this.renderStatusBanner();

    const winner = this.roundWinner ?? 3;
    const dstX = winner === 1 ? 56 : winner === 2 ? 568 : 316;
    const dstY = winner === 3 ? 232 : 170;
    if (this.roundWonPot > 0) {
      this.spawnCoinFlight(168, 42, dstX, dstY, 520);
      this.spawnCoinFlight(470, 48, dstX, dstY, 560);
      if (this.ctx?.getGraphicsMode() === 'hd') {
        this.spawnCoinFlight(175, 44, dstX, dstY, 610);
        this.spawnSparkBurst(dstX, dstY, 14, 0xffea88);
      }
    }
  }

  private enterMatchEnd(): void {
    if (!this.ctx) return;
    this.phase = 'matchEnd';
    this.phaseTimerMs = 0;

    const humanCash = this.match.cash[3];
    const botsOut = this.match.cash[1] <= 0 || this.match.cash[2] <= 0;
    const humanWonMatch = humanCash > 0 && (botsOut || (humanCash >= this.match.cash[1] && humanCash >= this.match.cash[2]));

    if (humanWonMatch) {
      this.ctx.audio.sfx.victoryBeep();
      this.spawnSparkBurst(SCREEN_WIDTH * 0.5, 160, 22, 0xffdf70);
    } else {
      this.ctx.audio.sfx.passAlert();
    }

    const finalScore = getFinalClubScore(this.match);
    if (this.ctx.sessionPlayer.loggedIn) {
      this.ctx.highScores = upsertHighScore(
        this.ctx.highScores,
        this.match.clubTable,
        this.match.playerName,
        this.match.playerPassword,
        finalScore,
      );
      this.ctx.sessionPlayer.clubCarryover = finalScore - 200;
      this.ctx.persistHighScores();
    }

    this.drawMatchEndModal(humanWonMatch, finalScore);
  }

  private drawMatchEndModal(humanWon: boolean, finalScore: number): void {
    if (!this.ctx) return;
    this.overlayLayer.removeChildren();

    if (this.ctx.getGraphicsMode() === 'ega') {
      const box = new Graphics();
      box.rect(192, 114, 256, 118).fill(0xffffff).stroke({ color: 0xaa0000, width: 2 });
      box.rect(196, 118, 248, 110).stroke({ color: 0x000000, width: 1 });
      this.overlayLayer.addChild(box);

      const title = humanWon ? 'VICTORY!' : 'BANKRUPT';
      this.overlayLayer.addChild(
        this.ctx.menuFont.createText(title.padStart(Math.floor((18 + title.length) / 2), ' '), 230, 128, { stepX: 10 }),
      );
      this.overlayLayer.addChild(
        this.ctx.menuFont.createText(`CASH ${this.match.cash[3]}$`, 220, 152, { stepX: 10, blackDigits: true }),
      );
      this.overlayLayer.addChild(
        this.ctx.menuFont.createText(`SCORE ${finalScore}`, 220, 170, { stepX: 10, blackDigits: true }),
      );
      this.overlayLayer.addChild(this.ctx.menuFont.createText('PRESS KEY/CLICK', 245, 200, { stepX: 10 }));
      return;
    }

    // HD Art-Deco Modal
    const backdrop = new Graphics();
    backdrop.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill({ color: 0x040507, alpha: 0.62 });
    backdrop.roundRect(184, 102, 272, 144, 10).fill({ color: 0x121619, alpha: 0.97 }).stroke({ color: 0xd9ad42, width: 1.8 });
    backdrop.roundRect(189, 107, 262, 134, 7).stroke({ color: 0xd9ad42, width: 0.7, alpha: 0.5 });
    this.overlayLayer.addChild(backdrop);

    const titleSpr = createHdTextSprite(humanWon ? 'VICTORY!' : 'BANKRUPT', 240, 28, {
      font: 'bold 18px Georgia, "Times New Roman", serif',
      fill: humanWon ? ['#fff3be', '#d99e26'] : ['#ff9696', '#c42938'],
      align: 'center',
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 4,
    });
    titleSpr.anchor.set(0.5);
    titleSpr.position.set(SCREEN_WIDTH * 0.5, 130);
    this.overlayLayer.addChild(titleSpr);

    const cashSpr = createHdTextSprite(`FINAL CASH: $${this.match.cash[3]}`, 240, 18, {
      font: '600 11px "Segoe UI", system-ui, sans-serif',
      fill: '#f0e4c8',
      align: 'center',
    });
    cashSpr.anchor.set(0.5);
    cashSpr.position.set(SCREEN_WIDTH * 0.5, 164);
    this.overlayLayer.addChild(cashSpr);

    const scoreSpr = createHdTextSprite(`CLUB SCORE: ${finalScore}`, 240, 18, {
      font: 'bold 11.5px "Segoe UI", system-ui, sans-serif',
      fill: '#ffe18c',
      align: 'center',
    });
    scoreSpr.anchor.set(0.5);
    scoreSpr.position.set(SCREEN_WIDTH * 0.5, 186);
    this.overlayLayer.addChild(scoreSpr);

    const promptSpr = createHdTextSprite('CLICK OR PRESS ANY KEY TO CONTINUE', 240, 16, {
      font: '600 8.5px Georgia, serif',
      fill: '#cbb98c',
      align: 'center',
    });
    promptSpr.anchor.set(0.5);
    promptSpr.position.set(SCREEN_WIDTH * 0.5, 222);
    this.overlayLayer.addChild(promptSpr);
  }

  private findCardLayoutAt(x: number, y: number): HandCardLayout | null {
    if (y < HAND_TOP_Y - 8 || y >= SCREEN_HEIGHT) return null;
    for (let i = 0; i < this.currentHandLayouts.length; i++) {
      const l = this.currentHandLayouts[i];
      if (x >= l.x && x < l.x + l.hitWidth && y >= l.y - 6 && y < l.y + l.height) {
        return l;
      }
    }
    return null;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.phase === 'matchEnd') {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        this.ctx?.audio.music.stop();
        this.ctx?.goTo('menu', 220);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.ctx?.audio.music.stop();
      this.ctx?.goTo('menu', 200);
      return;
    }

    if (
      this.phase === 'waitingTurn' &&
      this.match.round?.currentTurn === 3 &&
      (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'p')
    ) {
      const round = this.match.round;
      const legal = getLegalMoves(round.hands[3], round.tableBounds, round.isFirstTurnOfRound);
      if (legal.length === 0) {
        e.preventDefault();
        this.triggerSeatPass(3);
      }
    }
  };

  private handlePointerMove = (pt: { x: number; y: number }): void => {
    if (!this.ctx) return;
    const canvas = this.ctx.stage.getCanvas();
    if (this.phase === 'waitingTurn' && this.match.round?.currentTurn === 3) {
      const hit = this.findCardLayoutAt(pt.x, pt.y);
      this.hoveredCardKey = hit ? cardKey(hit.card) : null;
      canvas.style.cursor = hit ? 'pointer' : 'default';
    } else {
      this.hoveredCardKey = null;
      canvas.style.cursor = 'default';
    }
  };

  private handlePointerDown = (pt: { x: number; y: number }): void => {
    if (this.phase === 'matchEnd') {
      this.ctx?.audio.music.stop();
      this.ctx?.goTo('menu', 220);
      return;
    }

    if (this.phase !== 'waitingTurn' || !this.match.round || this.match.round.currentTurn !== 3) {
      return;
    }

    const round = this.match.round;
    const legal = getLegalMoves(round.hands[3], round.tableBounds, round.isFirstTurnOfRound);

    if (legal.length === 0) {
      this.triggerSeatPass(3);
      return;
    }

    const hit = this.findCardLayoutAt(pt.x, pt.y);
    if (!hit) return;

    if (isLegalMove(hit.card, round.tableBounds, round.isFirstTurnOfRound)) {
      this.startCardFlight(3, hit.card, hit.x + 25, hit.y);
    } else {
      this.ctx?.audio.sfx.illegalMove();
      this.phase = 'illegalShake';
      this.phaseTimerMs = 0;
    }
  };

  update(dtMs: number): void {
    const isHd = this.ctx?.getGraphicsMode() === 'hd';

    // Spinning / 3D-flipping coin flights
    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const c = this.flyingCoins[i];
      c.elapsed += dtMs;
      const t = Math.min(1, c.elapsed / c.durationMs);
      const ease = 1 - Math.pow(1 - t, 2);
      c.sprite.position.set(
        c.startX + (c.endX - c.startX) * ease,
        c.startY + (c.endY - c.startY) * ease - Math.sin(t * Math.PI) * 22,
      );
      if (isHd) {
        c.sprite.scale.set(0.76 * Math.cos(c.elapsed * 0.022), 0.76);
      } else {
        const frame = Math.floor(c.elapsed / 70) % this.coinFrames.length;
        c.sprite.texture = this.coinFrames[frame];
      }
      if (t >= 1) {
        this.spawnSparkBurst(c.endX, c.endY, 5, 0xffe680);
        this.fxLayer.removeChild(c.sprite);
        this.flyingCoins.splice(i, 1);
      }
    }

    // Update sparkle burst particles
    if (this.sparkParticles.length > 0) {
      const dtSec = dtMs / 1000;
      for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
        const p = this.sparkParticles[i];
        p.lifeMs += dtMs;
        const u = p.lifeMs / p.maxLifeMs;
        p.gfx.x += p.vx * dtSec;
        p.gfx.y += p.vy * dtSec;
        p.gfx.alpha = Math.max(0, 1 - u);
        if (u >= 1) {
          this.fxLayer.removeChild(p.gfx);
          p.gfx.destroy();
          this.sparkParticles.splice(i, 1);
        }
      }
    }

    // Smooth hover lift on human hand cards in HD mode
    if (isHd) {
      const dtLerp = Math.min(1, dtMs / 65);
      for (const entry of this.handCardEntries) {
        const targetLift = this.hoveredCardKey === cardKey(entry.layout.card) ? 7 : 0;
        entry.liftPx += (targetLift - entry.liftPx) * dtLerp;
        entry.container.position.y = entry.baseY - entry.liftPx;
      }
    }

    // Candle flicker & dealer idle blinking
    this.idleBlinkMs += dtMs;
    if (isHd) {
      for (let i = 0; i < this.hdFlames.length; i++) {
        const f = this.hdFlames[i];
        const phase = this.idleBlinkMs * 0.012 + i * 1.7;
        f.container.scale.set(1 + Math.sin(phase * 1.3) * 0.14, 1 + Math.cos(phase * 1.9) * 0.2);
        f.container.rotation = Math.sin(phase * 0.9) * 0.1;
        f.glow.alpha = 0.36 + Math.sin(phase) * 0.09;
      }
    } else {
      const flameStep = Math.floor(this.idleBlinkMs / 130);
      const flameSeq = [0, 1, 2, 1, 0, 2];
      for (let i = 0; i < this.flameSprites.length; i++) {
        this.flameSprites[i].texture = this.flameFrames[flameSeq[(flameStep + i * 2) % flameSeq.length]];
      }
    }

    const round = this.match.round;
    if (this.hdTurnHalos) {
      const activeTurn = this.phase === 'waitingTurn' && round && !round.roundOver ? round.currentTurn : null;
      const pulse = 0.65 + 0.35 * Math.sin(this.idleBlinkMs * 0.008);
      this.hdTurnHalos.left.visible = activeTurn === 1;
      this.hdTurnHalos.right.visible = activeTurn === 2;
      this.hdTurnHalos.human.visible = activeTurn === 3;
      this.hdTurnHalos.left.alpha = pulse;
      this.hdTurnHalos.right.alpha = pulse;
      this.hdTurnHalos.human.alpha = pulse;
    }

    const blinking = (this.idleBlinkMs % 3200) > 2950;
    if (this.phase === 'waitingTurn' || this.phase === 'anteIntro') {
      if (this.hdDealer) {
        this.hdDealer.setTableExpression(blinking ? 'blink' : 'idle', this.idleBlinkMs);
      } else if (this.dealerSpr) {
        this.dealerSpr.texture = blinking ? this.dealerBlinkTex : this.dealerIdleTex;
      }
    }

    if (this.phase === 'waitingTurn' && round && !round.roundOver && round.currentTurn === 3) {
      this.humanWaitMs += dtMs;
    } else {
      this.humanWaitMs = 0;
    }
    this.rivalPlayAnimMs[1] = Math.max(0, this.rivalPlayAnimMs[1] - dtMs);
    this.rivalPlayAnimMs[2] = Math.max(0, this.rivalPlayAnimMs[2] - dtMs);

    if (this.hdLeftRival && this.hdRightRival) {
      const lookTarget =
        this.phase === 'movingCard' && this.flyingCard
          ? { x: this.flyingCard.sprite.x + 19, y: this.flyingCard.sprite.y + 18 }
          : round && !round.roundOver
            ? round.currentTurn === 1
              ? { x: 75, y: 140 }
              : round.currentTurn === 2
                ? { x: 550, y: 140 }
                : { x: 320, y: 245 }
            : null;

      const resolveRivalMode = (seat: 1 | 2): RivalAnimMode => {
        if (this.phase === 'roundEnd') {
          return this.roundWinner === seat ? 'winRound' : 'loseRound';
        }
        if (this.rivalPlayAnimMs[seat] > 0) {
          return 'play';
        }
        if (this.phase === 'movingCard' && this.activeFlightSeat === seat) {
          return 'play';
        }
        if (this.phase === 'passing' && this.passingSeat === seat) {
          return 'pass';
        }
        if (this.phase === 'waitingTurn' && round && !round.roundOver) {
          if (round.currentTurn === seat) return 'think';
          if (round.currentTurn === 3 && this.humanWaitMs >= 3500) return 'impatient';
        }
        return 'idle';
      };

      this.hdLeftRival.setState(resolveRivalMode(1), this.idleBlinkMs, lookTarget, dtMs);
      this.hdRightRival.setState(resolveRivalMode(2), this.idleBlinkMs, lookTarget, dtMs);
    }

    this.phaseTimerMs += dtMs;

    if (this.phase === 'anteIntro') {
      if (this.phaseTimerMs >= 460) {
        this.enterNextTurn();
      }
      return;
    }

    if (this.phase === 'movingCard' && this.flyingCard) {
      this.flyingCard.elapsed += dtMs;
      const t = Math.min(1, this.flyingCard.elapsed / this.flyingCard.durationMs);
      const ease = isHd ? 1 - Math.pow(1 - t, 3) : t;
      const arcLift = isHd ? Math.sin(t * Math.PI) * 16 : 0;
      const curX = this.flyingCard.startX + (this.flyingCard.endX - this.flyingCard.startX) * ease;
      const curY = this.flyingCard.startY + (this.flyingCard.endY - this.flyingCard.startY) * ease;

      this.flyingCard.sprite.position.set(curX, curY - arcLift);
      if (isHd) {
        const s = 1 + Math.sin(t * Math.PI) * 0.16;
        this.flyingCard.sprite.scale.set(s);
        if (this.flyingCard.shadow) {
          this.flyingCard.shadow.position.set(curX + arcLift * 0.25, curY + arcLift * 0.2);
          this.flyingCard.shadow.alpha = 0.25 + (1 - t) * 0.3;
        }
      }
      if (t >= 1) {
        this.flyingCard.onLand();
      }
      return;
    }

    if (this.phase === 'illegalShake') {
      if (this.hdDealer) {
        this.hdDealer.setTableExpression('wag', this.phaseTimerMs);
      } else if (this.dealerSpr) {
        const fIdx = Math.floor(this.phaseTimerMs / 95) % this.dealerWagFrames.length;
        this.dealerSpr.texture = this.dealerWagFrames[fIdx];
      }
      if (this.phaseTimerMs >= 450) {
        if (this.dealerSpr) this.dealerSpr.texture = this.dealerIdleTex;
        this.phase = 'waitingTurn';
        this.phaseTimerMs = 0;
      }
      return;
    }

    if (this.phase === 'passing') {
      if (this.hdDealer) {
        this.hdDealer.setTableExpression('bell', this.phaseTimerMs);
      } else if (this.dealerSpr) {
        const bIdx = Math.floor(this.phaseTimerMs / 100) % this.dealerBellFrames.length;
        this.dealerSpr.texture = this.dealerBellFrames[bIdx];
      }
      if (this.phaseTimerMs >= 420) {
        this.passingSeat = null;
        if (this.dealerSpr) this.dealerSpr.texture = this.dealerIdleTex;
        this.enterNextTurn();
      }
      return;
    }

    if (this.phase === 'waitingTurn') {
      if (!round || round.roundOver) return;

      if (round.currentTurn === 1 || round.currentTurn === 2) {
        if (!isHd) {
          const botSpr = round.currentTurn === 1 ? this.leftBotSpr : this.rightBotSpr;
          const thinkFrame = Math.floor(this.phaseTimerMs / 140) % 2;
          if (botSpr) botSpr.texture = this.botFrames[thinkFrame];
        }

        if (this.phaseTimerMs >= 440) {
          const botMove = selectBotMove(round, this.match.clubTable, this.rng);
          if (botMove) {
            this.startCardFlight(round.currentTurn, botMove);
          } else {
            if (this.leftBotSpr) this.leftBotSpr.texture = this.botFrames[0];
            if (this.rightBotSpr) this.rightBotSpr.texture = this.botFrames[0];
            this.triggerSeatPass(round.currentTurn);
          }
        }
      } else {
        if (this.statusBanner && this.phaseTimerMs >= 650) {
          this.statusBanner = '';
          this.renderStatusBanner();
          this.triggerSeatPass(3);
        }
      }
      return;
    }

    if (this.phase === 'roundEnd') {
      if (this.hdDealer) {
        this.hdDealer.setTableExpression('bell', this.phaseTimerMs);
      } else if (this.dealerSpr) {
        const bIdx = Math.floor(this.phaseTimerMs / 110) % this.dealerBellFrames.length;
        this.dealerSpr.texture = this.dealerBellFrames[bIdx];
      }
      if (this.phaseTimerMs >= 1150) {
        if (this.dealerSpr) this.dealerSpr.texture = this.dealerIdleTex;
        if (this.match.matchOver) {
          this.enterMatchEnd();
        } else {
          this.match = startNextRound(this.match, this.rng);
          this.beginRoundPresentation();
        }
      }
    }
  }

  unmount(): void {
    this.unbindKey?.();
    this.unbindPtr?.();
    this.unbindMove?.();
    this.unbindKey = null;
    this.unbindPtr = null;
    this.unbindMove = null;
    if (this.ctx) {
      this.ctx.stage.getCanvas().style.cursor = 'default';
    }
  }
}
