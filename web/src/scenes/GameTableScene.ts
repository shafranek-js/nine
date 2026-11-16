import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { selectBotMove } from '../core/ai';
import { DEFAULT_LANGUAGE, getTranslations } from '../core/i18n';
import { normalizeGameRulesConfig, upsertHighScore } from '../core/persistence';
import { createDefaultRng, type Rng } from '../core/rng';
import {
  applyMove,
  applyPass,
  cardKey,
  computeHandLayout,
  createMatch,
  getDeckRanks,
  getFinalClubScore,
  getLegalMoves,
  HAND_TOP_Y,
  isLegalMove,
  resolveRoundRules,
  startNextRound,
  type HandCardLayout,
  type HandLayoutOptions,
} from '../core/rules';
import {
  PASS_PENALTY,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  Suit,
  type Card,
  type GameRulesConfig,
  type GameVariant,
  type MatchState,
  type Rank,
  type SeatIndex,
} from '../core/types';
import {
  createHdTexture,
  drawSuitShape,
  getEgaFallbackCardTexture,
  getHdCardLibrary,
  getHdRivalCardBackTexture,
  HD_COMPACT_MINI_SIZE,
} from '../engine/hdCards';
import {
  createHdCandelabra,
  createHdDealer,
  createHdGoldLabel,
  createHdRival,
  createHdTextSprite,
  getHdCoinTexture,
  type HdCandelabraController,
  type HdDealerController,
  type HdGoldLabelController,
  type HdRivalController,
  type RivalAnimMode,
} from '../engine/hdCharacters';
import {
  getHdAnteIntroState,
  getHdBotBrokeMode,
  getHdBotCardThrowState,
  getHdBotPurseTossMode,
  getHdDealerGlanceMode,
  getHdDealingStepState,
  HD_BOT_BROKE_SHAKE_DURATION_MS,
  HD_BOT_PURSE_COIN_FLIGHT_MS,
  HD_BOT_PURSE_COIN_RELEASE_MS,
  HD_BOT_PURSE_TOSS_TOTAL_MS,
  HD_BOT_THROW_FAR_MS,
  HD_BOT_THROW_NEAR_MS,
  HD_DEAL_STEP_MS,
} from '../engine/hdAnimations';
import {
  EGA_BOT_BROKE_SHAKE_DURATION_MS,
  EGA_BOT_PURSE_COIN_RELEASE_MS,
  EGA_BOT_PURSE_TOSS_TOTAL_MS,
  EGA_BOT_TAP_DURATION_MS,
  EGA_BOT_THROW_FAR_MS,
  EGA_BOT_THROW_NEAR_MS,
  computeEgaDealCardPos,
  computeEgaParabolicCardPos,
  createEgaSpriteBank,
  evaluateWaypointPath,
  getEgaBotBrokeShakeFrame,
  getEgaBotCardLaunchPos,
  getEgaBotCardThrowPose,
  getEgaBotPurseReceiveFrame,
  getEgaBotPurseTossFrame,
  getEgaBotTapFrame,
  getEgaBotYawnFrame,
  getEgaDealerDealPose,
  getEgaDealerGlanceWagFrame,
  getEgaHatCoinTrajectory,
  getEgaPayoutCoinTrajectory,
  type EgaCoinTrajectory,
  type EgaSpriteBank,
  type Waypoint,
} from '../engine/egaAnimations';
import type { AspectMode } from '../engine/StageApp';
import type { GameContext, MoveLogEntry, MoveLogEvent, Scene } from './SceneManager';
import {
  evaluatePlayerMoves,
  getAllCurrentlyLegalCards,
} from '../core/advisor';
import { cardKey as advisorCardKey } from '../core/rules';

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Spades]: '♠',
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
};

function formatCardShort(card: Card): string {
  const rank =
    card.rank === 1 || card.rank === 14
      ? 'A'
      : card.rank === 11
        ? 'J'
        : card.rank === 12
          ? 'Q'
          : card.rank === 13
            ? 'K'
            : String(card.rank);
  return `${rank}${SUIT_SYMBOLS[card.suit]}`;
}

type TablePhase =
  | 'anteIntro'
  | 'dealingCards'
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
  egaFrames?: readonly Texture[];
  botSlotIdx?: number;
  botCols?: number;
  hdBotSync?: boolean;
  soundPlayed?: boolean;
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
  delayMs?: number;
  waypoints?: readonly Waypoint[];
  getTexture?: (t: number, elapsedMs: number) => Texture;
  onArrive?: () => void;
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

interface HdBoardMetrics {
  readonly tableX: number;
  readonly tableY: number;
  readonly tableW: number;
  readonly tableH: number;
  readonly slotX0: number;
  readonly slotY0: number;
  readonly stepX: number;
  readonly stepY: number;
  readonly cardW: number;
  readonly cardH: number;
  readonly cornerRadius: number;
}

const HD_BOARD_METRICS: Record<GameVariant, Record<AspectMode, HdBoardMetrics>> = {
  nine36: {
    '4:3': {
      tableX: 128,
      tableY: 60,
      tableW: 384,
      tableH: 174,
      slotX0: 145,
      slotY0: 71,
      stepX: 39,
      stepY: 38,
      cardW: 38,
      cardH: 37,
      cornerRadius: 3.6,
    },
    '1:1': {
      tableX: 158,
      tableY: 60,
      tableW: 324,
      tableH: 174,
      slotX0: 174,
      slotY0: 69,
      stepX: 33,
      stepY: 40,
      cardW: 28,
      cardH: 38,
      cornerRadius: 3.2,
    },
  },
  fantan52: {
    '4:3': {
      tableX: 60,
      tableY: 60,
      tableW: 520,
      tableH: 170,
      slotX0: 74,
      slotY0: 71,
      stepX: 38,
      stepY: 37.5,
      cardW: HD_COMPACT_MINI_SIZE['4:3'].w,
      cardH: HD_COMPACT_MINI_SIZE['4:3'].h,
      cornerRadius: 3.4,
    },
    '1:1': {
      tableX: 86,
      tableY: 60,
      tableW: 468,
      tableH: 188,
      slotX0: 101,
      slotY0: 71,
      stepX: 34,
      stepY: 42,
      cardW: HD_COMPACT_MINI_SIZE['1:1'].w,
      cardH: HD_COMPACT_MINI_SIZE['1:1'].h,
      cornerRadius: 3.2,
    },
  },
};

const EGA_FANTAN_BOARD_METRICS: HdBoardMetrics = {
  tableX: 128,
  tableY: 60,
  tableW: 384,
  tableH: 174,
  slotX0: 145,
  slotY0: 71,
  stepX: 27,
  stepY: 38,
  cardW: 26,
  cardH: 36,
  cornerRadius: 2.6,
};

const cachedFeltTextures = new Map<string, Texture>();

let cachedDealerSpotlightTex: Texture | null = null;

function getHdDealerSpotlightTexture(): Texture {
  if (cachedDealerSpotlightTex) return cachedDealerSpotlightTex;

  const w = 280;
  const h = 64;
  const tex = createHdTexture(w, h, (ctx) => {
    const pw = ctx.canvas.width;
    const ph = ctx.canvas.height;
    const imgData = ctx.createImageData(pw, ph);
    const data = imgData.data;

    for (let py = 0; py < ph; py++) {
      const y = (py / ph) * h;
      const t = Math.min(1, y / 60);
      const halfW = 48 + t * 28;
      const v = 1 - 0.34 * t;

      for (let px = 0; px < pw; px++) {
        const dx = Math.abs((px / pw) * w - w * 0.5);
        // Smooth horizontal mask feathering out between dx=95 and dx=140 so background ledge is cleanly hidden
        const maskA = dx <= 95 ? 1 : dx >= 140 ? 0 : 1 - (dx - 95) / 45;
        const smoothMask = maskA * maskA * (3 - 2 * maskA);

        const norm = Math.min(1, dx / halfW);
        const beam = Math.pow(1 - norm * norm, 1.85);

        const r = 5 + beam * v * 204;
        const g = 6 + beam * v * 158;
        const b = 3 + beam * v * 102;

        const idx = (py * pw + px) * 4;
        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
        data[idx + 3] = Math.round(smoothMask * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  });

  cachedDealerSpotlightTex = tex;
  return tex;
}

let cachedSoftTurnHaloTex: Texture | null = null;

function getHdSoftTurnHaloTexture(): Texture {
  if (cachedSoftTurnHaloTex) return cachedSoftTurnHaloTex;
  cachedSoftTurnHaloTex = createHdTexture(118, 34, (ctx, w, h) => {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(1, h / w);
    const r = w * 0.5;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0.0, 'rgba(255, 224, 118, 0.56)');
    g.addColorStop(0.28, 'rgba(255, 210, 96, 0.38)');
    g.addColorStop(0.58, 'rgba(248, 186, 68, 0.14)');
    g.addColorStop(0.84, 'rgba(240, 168, 48, 0.03)');
    g.addColorStop(1.0, 'rgba(240, 168, 48, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  return cachedSoftTurnHaloTex;
}

function getHdFeltTableTexture(aspectMode: AspectMode, variant: GameVariant): Texture {
  const cacheKey = `${aspectMode}:${variant}`;
  const existing = cachedFeltTextures.get(cacheKey);
  if (existing) return existing;

  const m = HD_BOARD_METRICS[variant][aspectMode];
  const rules = resolveRoundRules({ variant });
  const tex = createHdTexture(m.tableW, m.tableH, (ctx, w, h) => {
    // Rich mahogany frame with warm top bevel (no dark seam under overhead spotlight) and brass trim
    const outerRim = ctx.createLinearGradient(0, 0, 0, h);
    outerRim.addColorStop(0, '#723b1e');
    outerRim.addColorStop(0.08, '#4a2210');
    outerRim.addColorStop(1, '#2d1409');
    ctx.fillStyle = outerRim;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 10);
    ctx.fill();

    const mahog = ctx.createLinearGradient(0, 0, 0, h);
    mahog.addColorStop(0, '#784022');
    mahog.addColorStop(0.5, '#4c2210');
    mahog.addColorStop(1, '#311408');
    ctx.fillStyle = mahog;
    ctx.beginPath();
    ctx.roundRect(1, 0.5, w - 2, h - 2, 9.5);
    ctx.fill();

    // Warm overhead light pool across the top mahogany rail behind the dealer
    const railGlow = ctx.createRadialGradient(w * 0.5, 1.5, 4, w * 0.5, 2, 88);
    railGlow.addColorStop(0, 'rgba(255, 214, 134, 0.36)');
    railGlow.addColorStop(0.55, 'rgba(245, 184, 92, 0.14)');
    railGlow.addColorStop(1, 'rgba(245, 184, 92, 0)');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, w, 7.5, [10, 10, 0, 0]);
    ctx.clip();
    ctx.fillStyle = railGlow;
    ctx.fillRect(0, 0, w, 8);
    ctx.restore();

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

    // Subtle recessed grid slots (9x4 for Nine, 13x4 for Fan Tan) aligned with placed mini cards
    const ranks = getDeckRanks(rules);
    const suits: readonly Suit[] = [1, 2, 3, 4];
    const rankLabels: Record<number, string> = {
      1: 'A',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
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
    const narrow = aspectMode === '1:1' || variant === 'fantan52';

    for (const suit of suits) {
      for (const rank of ranks) {
        const sx = m.slotX0 - m.tableX + (rank - rules.minRank) * m.stepX;
        const sy = m.slotY0 - m.tableY + (suit - 1) * m.stepY;
        const sw = m.cardW;
        const sh = m.cardH;
        const isCenter = rank === rules.centerRank;

        ctx.fillStyle = isCenter ? 'rgba(218, 176, 68, 0.10)' : 'rgba(0, 0, 0, 0.14)';
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, m.cornerRadius);
        ctx.fill();

        ctx.strokeStyle = isCenter ? 'rgba(230, 188, 82, 0.46)' : 'rgba(212, 175, 55, 0.18)';
        ctx.lineWidth = isCenter ? 0.95 : 0.65;
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = isCenter ? 0.34 : 0.16;
        ctx.fillStyle = isCenter ? '#ffe699' : '#d6eadb';
        ctx.font = `bold ${variant === 'fantan52' ? 8.2 : narrow ? 8 : 8.5}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rankLabels[rank], sx + sw * 0.5, sy + sh * 0.3);
        drawSuitShape(
          ctx,
          suit,
          sx + sw * 0.5,
          sy + sh * 0.67,
          variant === 'fantan52' ? 9.8 : narrow ? 9.5 : 11,
        );
        ctx.restore();
      }
    }
  });
  cachedFeltTextures.set(cacheKey, tex);
  return tex;
}

export class GameTableScene implements Scene {
  private ctx: GameContext | null = null;
  private rng: Rng = createDefaultRng();
  private match!: MatchState;
  private matchHighScoresRevision = 0;

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
  private egaBank: EgaSpriteBank | null = null;
  private egaMiniBackTex: Texture | null = null;
  private thermoSpr: Sprite | null = null;
  private dealerSpr: Sprite | null = null;
  private leftBotSpr: Sprite | null = null;
  private rightBotSpr: Sprite | null = null;
  private egaDealerHatMask: Graphics | null = null;
  private egaDealerHatSpr: Sprite | null = null;
  private egaDealerDealSpr: Sprite | null = null;
  private egaDealerDealElbowMask: Graphics | null = null;
  private egaLeftErase: Graphics | null = null;
  private egaRightErase: Graphics | null = null;
  private egaLeftActionSpr: Sprite | null = null;
  private egaRightActionSpr: Sprite | null = null;
  private flameSprites: Sprite[] = [];
  private dealerIdleTex!: Texture;
  private dealerBlinkTex!: Texture;
  private dealerWagFrames: Texture[] = [];
  private botFrames: Texture[] = [];
  private flameFrames: Texture[] = [];
  private thermoTextures: Texture[] = [];
  private coinFrames: Texture[] = [];

  // HD visuals
  private hdDealer: HdDealerController | null = null;
  private hdLeftRival: HdRivalController | null = null;
  private hdRightRival: HdRivalController | null = null;
  private hdCandelabras: HdCandelabraController[] = [];
  private hdTurnHalos: { left: Container; right: Container; human: Container } | null = null;
  private hdPotPedestal: HdGoldLabelController | null = null;
  private hdLeftCashLabel: HdGoldLabelController | null = null;
  private hdRightCashLabel: HdGoldLabelController | null = null;
  private hdHumanCashLabel: HdGoldLabelController | null = null;
  private hdBankTextLayer = new Container();
  private hdBannerLayer = new Container();

  private phase: TablePhase = 'anteIntro';
  private phaseTimerMs = 0;
  private idleBlinkMs = 0;
  private activeFlightSeat: SeatIndex | null = null;
  private passingSeat: SeatIndex | null = null;
  private passingBroke = false;
  private egaAntePaid: Record<SeatIndex, boolean> = { 1: true, 2: true, 3: true };
  private egaDealtCounts: Record<SeatIndex, number> | null = null;
  private egaDealFlySpr: Sprite | null = null;
  private egaDealPrevStep = -1;
  private idleBellCycleTriggered = -1;
  private rivalSlotCards: Record<1 | 2, (string | null)[]> = { 1: [], 2: [] };
  private pendingRivalRemoveSlot: { seat: 1 | 2; slotIdx: number } | null = null;
  private egaBotThinkMode: 'quick' | 'tap' = 'quick';
  private egaBotThinkDurationMs = 560;
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
  private moveLog: MoveLogEntry[] = [];
  private nextMoveId = 1;
  private passExclusions: Record<1 | 2, Set<string>> = {
    1: new Set(),
    2: new Set(),
  };

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
    this.moveLog = [];
    this.nextMoveId = 1;
    this.passExclusions = { 1: new Set(), 2: new Set() };
    if (this.ctx) {
      this.ctx.advisorHint = null;
    }

    this.root.addChild(this.bgLayer);
    this.root.addChild(this.tableCardsLayer);
    this.root.addChild(this.handLayer);
    this.root.addChild(this.hudLayer);
    this.root.addChild(this.fxLayer);
    this.root.addChild(this.overlayLayer);
    parent.addChild(this.root);

    const playerName = ctx.sessionPlayer.loggedIn ? ctx.sessionPlayer.name : 'Player';
    const playerPassword = ctx.sessionPlayer.loggedIn ? ctx.sessionPlayer.password : '';
    this.matchHighScoresRevision = ctx.getHighScoresRevision();
    this.match = createMatch(
      playerName,
      playerPassword,
      ctx.sessionPlayer.clubCarryover,
      ctx.config.clubTable,
      this.rng,
      ctx.ruleConfig,
    );

    this.buildVisuals();

    ctx.audio.music.play('table');
    this.beginRoundPresentation();

    this.unbindKey = ctx.input.onKeyDown(this.handleKeyDown);
    this.unbindPtr = ctx.input.onPointerDown(this.handlePointerDown);
    this.unbindMove = ctx.input.onPointerMove(this.handlePointerMove);
  }

  onGraphicsModeChanged(): void {
    this.rebuildVisualsForModeChange();
  }

  onAspectModeChanged(): void {
    if (this.ctx?.getGraphicsMode() === 'hd') {
      this.rebuildVisualsForModeChange();
    }
  }

  onLanguageChanged(): void {
    this.refreshAdvisorHint();
    if (this.statusBanner && this.ctx) {
      this.statusBanner = getTranslations(this.ctx.getLanguage()).scenes.tableNoLegalMovesPass(PASS_PENALTY);
    }
    if (this.ctx?.getGraphicsMode() === 'hd') {
      this.rebuildVisualsForModeChange();
    }
    this.emitTelemetry();
  }

  private rebuildVisualsForModeChange(): void {
    this.buildVisuals();
    if (this.phase === 'dealingCards') {
      this.finishEgaDealingCards();
    }
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

  private isHdSquareAspect(): boolean {
    return this.ctx?.getGraphicsMode() === 'hd' && this.ctx.stage.getAspectMode() === '1:1';
  }

  private getMatchVariant(): GameVariant {
    return resolveRoundRules(this.match?.round?.rules ?? this.match?.ruleConfig ?? this.ctx?.ruleConfig).variant;
  }

  private isCompactFanTanHdLayout(): boolean {
    return this.ctx?.getGraphicsMode() === 'hd' && this.getMatchVariant() === 'fantan52';
  }

  private getHumanHandScale(): number {
    if (!this.isCompactFanTanHdLayout()) return 1;
    return this.isHdSquareAspect() ? 0.88 : 0.96;
  }

  private getHumanHandTopY(): number {
    if (!this.isCompactFanTanHdLayout()) return HAND_TOP_Y;
    return this.isHdSquareAspect() ? 269 : 257;
  }

  private getHdSeatLayout() {
    const isSquare = this.isHdSquareAspect();
    if (this.isCompactFanTanHdLayout()) {
      if (!isSquare) {
        return {
          leftCenterX: 30,
          rightCenterX: 610,
          rivalRigY: 88,
          rivalScale: 0.72,
          haloY: 108,
          haloRx: 28,
          haloRy: 20,
          oppCashY: 190,
          oppCashTextH: 9.0,
          candLeftX: 152,
          candRightX: 488,
          humanCashY: 243.5,
          bannerY: 212,
          coinLeftY: 174,
          coinHumanY: 243,
        };
      }
      return {
        leftCenterX: 44,
        rightCenterX: 596,
        rivalRigY: 86,
        rivalScale: 1,
        haloY: 112,
        haloRx: 44,
        haloRy: 27,
        oppCashY: 197,
        oppCashTextH: 10.5,
        candLeftX: 152,
        candRightX: 488,
        humanCashY: 257,
        bannerY: 226,
        coinLeftY: 176,
        coinHumanY: 254,
      };
    }
    return {
      leftCenterX: 57,
      rightCenterX: 569,
      rivalRigY: 98,
      rivalScale: 1,
      haloY: 124,
      haloRx: 46,
      haloRy: 28,
      oppCashY: 191,
      oppCashTextH: 10.5,
      candLeftX: isSquare ? 186 : 168,
      candRightX: isSquare ? 454 : 471,
      humanCashY: 248,
      bannerY: 214,
      coinLeftY: 170,
      coinHumanY: 232,
    };
  }

  private getBoardMetrics(): HdBoardMetrics {
    const variant = this.getMatchVariant();
    if (this.ctx?.getGraphicsMode() === 'ega' && variant === 'fantan52') {
      return EGA_FANTAN_BOARD_METRICS;
    }
    const aspect: AspectMode = this.isHdSquareAspect() ? '1:1' : '4:3';
    return HD_BOARD_METRICS[variant][aspect];
  }

  onRuleConfigChanged(rules: GameRulesConfig): void {
    const currentVariant = resolveRoundRules(this.match?.ruleConfig).variant;
    const roundUntouched = this.match.roundNumber === 1 && (this.match.round?.playedCount ?? 0) === 0;
    if (rules.variant !== currentVariant || roundUntouched) {
      this.ctx?.goTo('table', 120);
    }
  }

  onCoachModeChanged(enabled: boolean): void {
    if (!enabled) {
      if (this.ctx) {
        this.ctx.advisorHint = null;
      }
    } else {
      this.refreshAdvisorHint();
    }
    this.renderHumanHand();
    this.emitTelemetry();
  }

  onAdvisorXrayModeChanged(): void {
    this.refreshAdvisorHint();
    this.renderHumanHand();
    this.emitTelemetry();
  }

  onAdvisorAutoPlayModeChanged(enabled: boolean): void {
    if (enabled && this.phase === 'waitingTurn' && this.match.round?.currentTurn === 3) {
      this.refreshAdvisorHint();
      this.phaseTimerMs = Math.max(this.phaseTimerMs, 220);
      this.emitTelemetry();
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
    this.hdCandelabras = [];
    this.egaBank = null;
    this.thermoSpr = null;
    this.dealerSpr = null;
    this.leftBotSpr = null;
    this.rightBotSpr = null;
    this.egaDealerHatMask = null;
    this.egaDealerHatSpr = null;
    this.egaDealerDealSpr = null;
    this.egaDealerDealElbowMask = null;
    if (this.egaDealFlySpr) {
      this.fxLayer.removeChild(this.egaDealFlySpr);
      this.egaDealFlySpr.destroy();
      this.egaDealFlySpr = null;
    }
    this.egaLeftErase = null;
    this.egaRightErase = null;
    this.egaLeftActionSpr = null;
    this.egaRightActionSpr = null;
    this.egaMiniBackTex = null;
    this.hdDealer = null;
    this.hdLeftRival = null;
    this.hdRightRival = null;
    this.hdTurnHalos = null;
    this.hdPotPedestal = null;
    this.hdLeftCashLabel = null;
    this.hdRightCashLabel = null;
    this.hdHumanCashLabel = null;

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.buildEgaVisuals(this.ctx);
    } else {
      this.buildHdVisuals(this.ctx);
    }
  }

  private buildEgaVisuals(ctx: GameContext): void {
    const bank = createEgaSpriteBank(ctx.assets.sheets.GR_NINE, ctx.assets.sheets.VR_NINE);
    this.egaBank = bank;
    this.bgLayer.addChild(new Sprite(ctx.assets.backgrounds.GF_NINE));

    this.dealerIdleTex = bank.dealerIdleTex;
    this.dealerBlinkTex = bank.dealerBlinkTex;
    this.dealerWagFrames = [...bank.dealerWagFrames];
    this.botFrames = [...bank.botFrames];
    this.coinFrames = [...bank.coinFrames];
    this.flameFrames = [...bank.flameFrames];
    this.egaMiniBackTex = bank.miniBackTex;
    this.thermoTextures = [...bank.thermoTextures];

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

    this.dealerSpr = new Sprite(this.dealerIdleTex);
    this.dealerSpr.position.set(281, 20);
    this.bgLayer.addChild(this.dealerSpr);

    this.egaDealerDealElbowMask = new Graphics().rect(291, 49, 2, 5).fill(0x000000);
    this.egaDealerDealElbowMask.visible = false;
    this.bgLayer.addChild(this.egaDealerDealElbowMask);

    this.egaDealerDealSpr = new Sprite(bank.dealerDealFrames[0]);
    this.egaDealerDealSpr.position.set(293, 37);
    this.egaDealerDealSpr.visible = false;
    this.bgLayer.addChild(this.egaDealerDealSpr);

    this.egaLeftErase = new Graphics().rect(19, 100, 74, 41).fill(0x000000);
    this.egaLeftErase.visible = false;
    this.bgLayer.addChild(this.egaLeftErase);

    this.egaRightErase = new Graphics().rect(531, 100, 74, 41).fill(0x000000);
    this.egaRightErase.visible = false;
    this.bgLayer.addChild(this.egaRightErase);

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

    // Overhanging VR_NINE overlays sit above table cards / rival card backs, below flying FX.
    this.egaDealerHatMask = new Graphics().rect(272, 0, 76, 59).fill(0x000000);
    this.egaDealerHatMask.visible = false;
    this.hudLayer.addChild(this.egaDealerHatMask);

    this.egaDealerHatSpr = new Sprite(bank.dealerHatOpenFrames[0]);
    this.egaDealerHatSpr.position.set(274, 20);
    this.egaDealerHatSpr.visible = false;
    this.hudLayer.addChild(this.egaDealerHatSpr);

    this.egaLeftActionSpr = new Sprite(bank.botTossLeftFrames[0]);
    this.egaLeftActionSpr.position.set(33, 101);
    this.egaLeftActionSpr.visible = false;
    this.hudLayer.addChild(this.egaLeftActionSpr);

    this.egaRightActionSpr = new Sprite(bank.botTossRightFrames[0]);
    this.egaRightActionSpr.position.set(522, 101);
    this.egaRightActionSpr.visible = false;
    this.hudLayer.addChild(this.egaRightActionSpr);
  }

  private clearEgaActionOverlays(): void {
    if (this.egaDealerHatMask) this.egaDealerHatMask.visible = false;
    if (this.egaDealerHatSpr) this.egaDealerHatSpr.visible = false;
    if (this.egaDealerDealElbowMask) this.egaDealerDealElbowMask.visible = false;
    if (this.egaDealerDealSpr) this.egaDealerDealSpr.visible = false;
    if (this.egaDealFlySpr) {
      this.fxLayer.removeChild(this.egaDealFlySpr);
      this.egaDealFlySpr.destroy();
      this.egaDealFlySpr = null;
    }
    if (this.dealerSpr) {
      this.dealerSpr.visible = true;
      this.dealerSpr.texture = this.dealerIdleTex;
    }
    if (this.egaLeftErase) this.egaLeftErase.visible = false;
    if (this.egaRightErase) this.egaRightErase.visible = false;
    if (this.egaLeftActionSpr) this.egaLeftActionSpr.visible = false;
    if (this.egaRightActionSpr) this.egaRightActionSpr.visible = false;
    if (this.leftBotSpr) {
      this.leftBotSpr.visible = true;
      this.leftBotSpr.texture = this.botFrames[0];
    }
    if (this.rightBotSpr) {
      this.rightBotSpr.visible = true;
      this.rightBotSpr.texture = this.botFrames[0];
    }
  }

  private setEgaDealerHatPose(tex: Texture | null, x = 274, y = 20, maskBakedDealer = true): void {
    if (!this.egaDealerHatSpr || !this.dealerSpr) return;
    if (!tex) {
      this.egaDealerHatSpr.visible = false;
      if (this.egaDealerHatMask) this.egaDealerHatMask.visible = false;
      this.dealerSpr.visible = true;
      return;
    }
    this.dealerSpr.visible = false;
    if (this.egaDealerHatMask) this.egaDealerHatMask.visible = maskBakedDealer;
    this.egaDealerHatSpr.texture = tex;
    this.egaDealerHatSpr.position.set(x, y);
    this.egaDealerHatSpr.visible = true;
  }

  private setEgaRivalOverlay(
    seat: 1 | 2,
    tex: Texture | null,
    mode: 'vr' | 'purse' | 'yawn' = 'vr',
    customX?: number,
  ): void {
    const erase = seat === 1 ? this.egaLeftErase : this.egaRightErase;
    const actionSpr = seat === 1 ? this.egaLeftActionSpr : this.egaRightActionSpr;
    const botSpr = seat === 1 ? this.leftBotSpr : this.rightBotSpr;
    if (!actionSpr || !botSpr) return;
    if (!tex) {
      actionSpr.visible = false;
      if (erase) erase.visible = false;
      botSpr.visible = true;
      return;
    }
    if (mode === 'vr') {
      if (erase) erase.visible = true;
      botSpr.visible = false;
      actionSpr.position.set(customX ?? (seat === 1 ? 33 : 522), 101);
    } else if (mode === 'purse') {
      if (erase) erase.visible = false;
      botSpr.visible = true;
      botSpr.texture = this.botFrames[0];
      actionSpr.position.set(seat === 1 ? 33 : 545, 101);
    } else {
      if (erase) erase.visible = false;
      botSpr.visible = true;
      actionSpr.position.set(seat === 1 ? 42 : 554, 101);
    }
    actionSpr.texture = tex;
    actionSpr.visible = true;
  }

  private buildHdVisuals(ctx: GameContext): void {
    const bg = new Sprite(ctx.assets.hdBackgrounds.table);
    bg.width = SCREEN_WIDTH;
    bg.height = SCREEN_HEIGHT;
    this.bgLayer.addChild(bg);

    // Smooth overhead spotlight cone above the dealer (replaces background wall cornice shadow band)
    const dealerSpotlight = new Sprite(getHdDealerSpotlightTexture());
    dealerSpotlight.anchor.set(0.5, 0);
    dealerSpotlight.position.set(SCREEN_WIDTH * 0.5, 0);
    this.bgLayer.addChild(dealerSpotlight);

    // Center dealer stands behind the top mahogany edge (y = 60); scale 0.84 keeps top hat below y = 0 at 1:1
    const dealer = createHdDealer(0.84);
    dealer.container.position.set(294.8, 23.3);
    this.bgLayer.addChild(dealer.container);
    this.hdDealer = dealer;

    // Table coordinates; candelabras & gold pedestals stand directly behind y = 60 so their plinth bottom meets the top rail flush
    const aspect = ctx.stage.getAspectMode();
    const variant = this.getMatchVariant();
    const bm = HD_BOARD_METRICS[variant][aspect];
    const sl = this.getHdSeatLayout();
    const candLeftX = sl.candLeftX;
    const candRightX = sl.candRightX;
    const tableRailY = bm.tableY;

    const candLeft = createHdCandelabra(0, -16.2);
    candLeft.container.position.set(candLeftX, tableRailY);
    const candRight = createHdCandelabra(435, -16.2);
    candRight.container.position.set(candRightX, tableRailY);
    this.bgLayer.addChild(candLeft.container, candRight.container);
    this.hdCandelabras.push(candLeft, candRight);

    const pedestalAnchorY = 16.2 / 17;
    const bankLabel = getTranslations(ctx.getLanguage()).scenes.tableBankLabel;
    const bankPedestal = createHdGoldLabel(bankLabel, {
      anchorY: pedestalAnchorY,
      textHeight: 9.0,
      withPedestal: true,
      pedestalWidth: 40,
    });
    bankPedestal.container.position.set(candLeftX, tableRailY);
    this.hdBankTextLayer.addChild(bankPedestal.container);

    const potPedestal = createHdGoldLabel(`${this.match.round?.bank ?? 0}$`, {
      anchorY: pedestalAnchorY,
      textHeight: 9.0,
      withPedestal: true,
      pedestalWidth: 40,
    });
    potPedestal.container.position.set(candRightX, tableRailY);
    this.hdBankTextLayer.addChild(potPedestal.container);
    this.hdPotPedestal = potPedestal;
    this.bgLayer.addChild(this.hdBankTextLayer);

    const tableShadow = new Graphics();
    tableShadow
      .roundRect(bm.tableX - 2, bm.tableY + 3, bm.tableW + 4, bm.tableH + 4, 12)
      .fill({ color: 0x000000, alpha: 0.56 });
    this.bgLayer.addChild(tableShadow);

    const tableBoard = new Sprite(getHdFeltTableTexture(aspect, variant));
    tableBoard.position.set(bm.tableX, bm.tableY);
    this.bgLayer.addChild(tableBoard);

    // Active turn spotlight halos
    const leftHalo = new Graphics();
    leftHalo
      .ellipse(sl.leftCenterX, sl.haloY, sl.haloRx, sl.haloRy)
      .fill({ color: 0xffe070, alpha: 0.16 })
      .stroke({ color: 0xffd564, width: 1.3, alpha: 0.75 });
    leftHalo.visible = false;

    const rightHalo = new Graphics();
    rightHalo
      .ellipse(sl.rightCenterX, sl.haloY, sl.haloRx, sl.haloRy)
      .fill({ color: 0xffe070, alpha: 0.16 })
      .stroke({ color: 0xffd564, width: 1.3, alpha: 0.75 });
    rightHalo.visible = false;

    const humanHalo = new Sprite(getHdSoftTurnHaloTexture());
    humanHalo.anchor.set(0.5);
    humanHalo.position.set(320, sl.humanCashY);
    humanHalo.blendMode = 'add';
    humanHalo.visible = false;

    this.bgLayer.addChild(leftHalo, rightHalo, humanHalo);
    this.hdTurnHalos = { left: leftHalo, right: rightHalo, human: humanHalo };

    // Left & Right Rival Rigs
    const leftRival = createHdRival('left');
    leftRival.container.scale.set(sl.rivalScale);
    leftRival.container.position.set(sl.leftCenterX - 38 * sl.rivalScale, sl.rivalRigY);
    this.bgLayer.addChild(leftRival.container);
    this.hdLeftRival = leftRival;

    const rightRival = createHdRival('right');
    rightRival.container.scale.set(sl.rivalScale);
    rightRival.container.position.set(sl.rightCenterX - 38 * sl.rivalScale, sl.rivalRigY);
    this.bgLayer.addChild(rightRival.container);
    this.hdRightRival = rightRival;

    const leftCash = createHdGoldLabel(`${this.match.cash[1]}$`, { anchorY: 0.5, textHeight: sl.oppCashTextH });
    leftCash.container.position.set(sl.leftCenterX, sl.oppCashY);
    this.leftCashLayer.addChild(leftCash.container);
    this.hdLeftCashLabel = leftCash;

    const rightCash = createHdGoldLabel(`${this.match.cash[2]}$`, { anchorY: 0.5, textHeight: sl.oppCashTextH });
    rightCash.container.position.set(sl.rightCenterX, sl.oppCashY);
    this.rightCashLayer.addChild(rightCash.container);
    this.hdRightCashLabel = rightCash;

    const humanCash = createHdGoldLabel(`${this.match.cash[3]}$`, { anchorY: 0.5, textHeight: 11.0 });
    humanCash.container.position.set(320, sl.humanCashY);
    this.humanCashLayer.addChild(humanCash.container);
    this.hdHumanCashLabel = humanCash;

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

  private seatDisplayName(seat: SeatIndex): string {
    const tr = getTranslations(this.ctx?.getLanguage() ?? DEFAULT_LANGUAGE);
    if (seat === 1) return tr.shell.leftRival;
    if (seat === 2) return tr.shell.rightRival;
    return this.ctx?.sessionPlayer.loggedIn ? this.ctx.sessionPlayer.name : tr.shell.you;
  }

  private pushMoveLog(
    kind: MoveLogEntry['kind'],
    text: string,
    seat?: SeatIndex,
    event?: MoveLogEvent,
  ): void {
    this.moveLog.unshift({ id: this.nextMoveId++, kind, seat, text, event });
    if (this.moveLog.length > 18) {
      this.moveLog.length = 18;
    }
  }

  private emitTelemetry(): void {
    if (!this.ctx) return;
    const r = this.match.round;
    const activeRules = normalizeGameRulesConfig(this.match.ruleConfig);
    this.ctx.tableTelemetry = {
      roundNumber: this.match.roundNumber,
      phase: this.phase,
      currentTurn: r && !r.roundOver ? r.currentTurn : null,
      bank: r?.bank ?? 0,
      variant: activeRules.variant,
      ruleConfig: activeRules,
      handCounts: {
        1: r?.hands[1].length ?? 0,
        2: r?.hands[2].length ?? 0,
        3: r?.hands[3].length ?? 0,
      },
      cash: { ...this.match.cash },
      moves: this.moveLog.slice(),
    };
    this.ctx.onStateChange?.();
  }

  private beginRoundPresentation(): void {
    this.tableCardsLayer.removeChildren();
    this.overlayLayer.removeChildren();
    this.clearEgaActionOverlays();
    this.activeFlightSeat = null;
    this.passingSeat = null;
    this.passingBroke = false;
    this.pendingRivalRemoveSlot = null;
    this.humanWaitMs = 0;
    this.rivalPlayAnimMs = { 1: 0, 2: 0 };
    this.statusBanner = '';
    this.initRivalSlotCards();

    const isHd = this.ctx?.getGraphicsMode() === 'hd';
    this.egaAntePaid = { 1: false, 2: false, 3: false };
    this.egaDealtCounts = !isHd && this.egaBank ? { 1: 0, 2: 0, 3: 0 } : isHd ? { 1: 0, 2: 0, 3: 0 } : null;
    this.egaDealPrevStep = -1;
    this.idleBellCycleTriggered = -1;
    this.phase = 'anteIntro';
    this.phaseTimerMs = 0;
    this.renderRivalCardBacks();
    this.renderCashAndBankHud();
    this.renderHumanHand();
    this.renderStatusBanner();

    if (!isHd && this.egaBank) {
      // Original MS-DOS NINE.EXE timing (`60ms`/purse step): open hat, then 1 -> 2 -> 3 sequentially reach coat, pull coin, toss into hat, close purse.
      const bank = this.egaBank;
      const leftStart = 360;
      const rightStart = leftStart + EGA_BOT_PURSE_TOSS_TOTAL_MS + 40;
      const humanStart = rightStart + EGA_BOT_PURSE_TOSS_TOTAL_MS + 40;
      this.spawnEgaTrajectoryCoin(getEgaHatCoinTrajectory(bank, 1), leftStart + EGA_BOT_PURSE_COIN_RELEASE_MS, () => {
        this.egaAntePaid[1] = true;
        this.renderCashAndBankHud();
        this.ctx?.audio.sfx.coinHatClink();
      });
      this.spawnEgaTrajectoryCoin(getEgaHatCoinTrajectory(bank, 2), rightStart + EGA_BOT_PURSE_COIN_RELEASE_MS, () => {
        this.egaAntePaid[2] = true;
        this.renderCashAndBankHud();
        this.ctx?.audio.sfx.coinHatClink();
      });
      this.spawnEgaTrajectoryCoin(getEgaHatCoinTrajectory(bank, 3), humanStart, () => {
        this.egaAntePaid[3] = true;
        this.renderCashAndBankHud();
        this.ctx?.audio.sfx.coinHatClink();
      });
    } else {
      // EGA-aligned sequential HD ante: dealer opens hat, seats 1 -> 2 -> 3 sequentially toss coins into hat.
      const sl = this.getHdSeatLayout();
      const ante = getHdAnteIntroState(0);
      const hatPos = this.hdDealer?.getHatWorldPosition() ?? { x: 320, y: 42 };
      this.spawnCoinFlight(
        sl.leftCenterX,
        sl.coinLeftY,
        hatPos.x - 4,
        hatPos.y,
        HD_BOT_PURSE_COIN_FLIGHT_MS,
        ante.leftStartMs + HD_BOT_PURSE_COIN_RELEASE_MS,
        () => {
          this.egaAntePaid[1] = true;
          this.renderCashAndBankHud();
          this.ctx?.audio.sfx.coinHatClink();
        },
      );
      this.spawnCoinFlight(
        sl.rightCenterX,
        sl.coinLeftY,
        hatPos.x + 4,
        hatPos.y,
        HD_BOT_PURSE_COIN_FLIGHT_MS,
        ante.rightStartMs + HD_BOT_PURSE_COIN_RELEASE_MS,
        () => {
          this.egaAntePaid[2] = true;
          this.renderCashAndBankHud();
          this.ctx?.audio.sfx.coinHatClink();
        },
      );
      this.spawnCoinFlight(
        316,
        sl.coinHumanY,
        hatPos.x,
        hatPos.y,
        HD_BOT_PURSE_COIN_FLIGHT_MS,
        ante.humanStartMs,
        () => {
          this.egaAntePaid[3] = true;
          this.renderCashAndBankHud();
          this.ctx?.audio.sfx.coinHatClink();
        },
      );
    }

    this.passExclusions = { 1: new Set(), 2: new Set() };
    if (this.ctx) {
      this.ctx.advisorHint = null;
    }
    const pot = this.match.round?.bank ?? 0;
    const roundLogText = getTranslations(this.ctx?.getLanguage() ?? DEFAULT_LANGUAGE).scenes.logRound(
      this.match.roundNumber,
      pot,
    );
    this.pushMoveLog('round', roundLogText, undefined, {
      type: 'round',
      roundNumber: this.match.roundNumber,
      pot,
    });
    this.emitTelemetry();
  }

  private getRivalCardMetrics(): {
    baseXLeft: number;
    baseXRight: number;
    baseY: number;
    stepX: number;
    stepY: number;
    cols: number;
    w: number;
    h: number;
  } {
    const isFanTan = this.getMatchVariant() === 'fantan52';
    const isHd = this.ctx?.getGraphicsMode() === 'hd';
    if (isHd && isFanTan) {
      if (this.isHdSquareAspect()) {
        return {
          baseXLeft: 10,
          baseXRight: 562,
          baseY: 132,
          stepX: 14,
          stepY: 12,
          cols: 5,
          w: 12,
          h: 17,
        };
      }
      return {
        baseXLeft: 3,
        baseXRight: 583,
        baseY: 124,
        stepX: 11,
        stepY: 13,
        cols: 5,
        w: 10,
        h: 11,
      };
    }
    if (this.isHdSquareAspect()) {
      return {
        baseXLeft: 18,
        baseXRight: 530,
        baseY: isFanTan ? 140 : 144,
        stepX: 16,
        stepY: isFanTan ? 12 : 19,
        cols: 6,
        w: 12,
        h: 17,
      };
    }
    return {
      baseXLeft: 14,
      baseXRight: 526,
      baseY: isFanTan ? 140 : isHd ? 144 : 145,
      stepX: 17,
      stepY: isFanTan ? 12 : 18,
      cols: 6,
      w: 14,
      h: 16,
    };
  }

  private initRivalSlotCards(): void {
    const round = this.match.round;
    if (!round) {
      this.rivalSlotCards = { 1: [], 2: [] };
      return;
    }
    const maxVisible = this.getMatchVariant() === 'fantan52' ? 18 : 12;
    for (const seat of [1, 2] as const) {
      const keys = round.hands[seat].slice(0, maxVisible).map((c) => cardKey(c));
      // Shuffle visual slot layout so bots pull arbitrary card positions across their shelf (leaving gaps), as in DOS NINE.EXE.
      for (let i = keys.length - 1; i > 0; i--) {
        const j = this.rng.nextInt(i + 1);
        const tmp = keys[i];
        keys[i] = keys[j];
        keys[j] = tmp;
      }
      this.rivalSlotCards[seat] = keys;
    }
  }

  private getRivalCardSlotPos(seat: 1 | 2, index: number): { x: number; y: number } {
    const m = this.getRivalCardMetrics();
    const col = index % m.cols;
    const row = Math.floor(index / m.cols);
    const baseX = seat === 1 ? m.baseXLeft : m.baseXRight;
    return { x: baseX + col * m.stepX, y: m.baseY + row * m.stepY };
  }

  private renderRivalCardBacks(): void {
    this.rivalCardsLayer.removeChildren();
    if (!this.ctx || !this.match.round) return;

    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const tex = isHd ? getHdRivalCardBackTexture(this.ctx.stage.getAspectMode()) : this.egaMiniBackTex;
    if (!tex) return;

    const shadowGfx = isHd ? new Graphics() : null;
    if (shadowGfx) {
      this.rivalCardsLayer.addChild(shadowGfx);
    }

    const maxVisible = this.getMatchVariant() === 'fantan52' ? 18 : 12;
    const rm = this.getRivalCardMetrics();
    for (const seat of [1, 2] as const) {
      const slots = this.rivalSlotCards[seat];
      const dealtLimit = this.egaDealtCounts ? this.egaDealtCounts[seat] : undefined;
      if (slots.length > 0) {
        const limit = Math.min(maxVisible, slots.length, dealtLimit ?? maxVisible);
        for (let i = 0; i < limit; i++) {
          if (slots[i] === null) continue;
          const { x, y } = this.getRivalCardSlotPos(seat, i);
          if (shadowGfx) {
            shadowGfx.roundRect(x + 1, y + 1.5, rm.w, rm.h, 2.2).fill({ color: 0x000000, alpha: 0.42 });
          }
          const spr = new Sprite(tex);
          spr.position.set(x, y);
          if (isHd) {
            spr.width = rm.w;
            spr.height = rm.h;
          }
          this.rivalCardsLayer.addChild(spr);
        }
      } else {
        const count = Math.min(maxVisible, this.match.round.hands[seat].length, dealtLimit ?? maxVisible);
        for (let i = 0; i < count; i++) {
          const { x, y } = this.getRivalCardSlotPos(seat, i);
          if (shadowGfx) {
            shadowGfx.roundRect(x + 1, y + 1.5, rm.w, rm.h, 2.2).fill({ color: 0x000000, alpha: 0.42 });
          }
          const spr = new Sprite(tex);
          spr.position.set(x, y);
          if (isHd) {
            spr.width = rm.w;
            spr.height = rm.h;
          }
          this.rivalCardsLayer.addChild(spr);
        }
      }
    }
  }

  private renderCashAndBankHud(): void {
    if (!this.ctx) return;

    if (this.ctx.getGraphicsMode() === 'ega') {
      const pendingAnte = (seat: SeatIndex): number =>
        this.phase === 'anteIntro' && !this.egaAntePaid[seat] ? 20 : 0;
      const pendingPot = pendingAnte(1) + pendingAnte(2) + pendingAnte(3);
      this.ctx.hudFont.renderFixedNumber(this.leftCashLayer, this.match.cash[1] + pendingAnte(1), 73 - 45, 188, 5, 9);
      this.ctx.hudFont.renderFixedNumber(this.rightCashLayer, this.match.cash[2] + pendingAnte(2), 585 - 45, 188, 5, 9);
      this.ctx.hudFont.renderFixedNumber(this.humanCashLayer, this.match.cash[3] + pendingAnte(3), 332 - 45, 245, 5, 9);

      const bank = Math.max(0, (this.match.round?.bank ?? 0) - pendingPot);
      const segIdx = Math.max(0, Math.min(32, Math.floor(bank / 10)));
      if (this.thermoSpr) {
        this.thermoSpr.texture = this.thermoTextures[segIdx];
      }
      return;
    }

    // HD Cash & Bank HUD (sculpted solid gold labels without frames or progress bars)
    this.leftCashLayer.position.set(0, 0);
    this.rightCashLayer.position.set(0, 0);
    this.humanCashLayer.position.set(0, 0);

    const pendingAnte = (seat: SeatIndex): number =>
      this.phase === 'anteIntro' && !this.egaAntePaid[seat] ? 20 : 0;
    const pendingPot = pendingAnte(1) + pendingAnte(2) + pendingAnte(3);
    const bank = Math.max(0, (this.match.round?.bank ?? 0) - pendingPot);
    this.hdLeftCashLabel?.setText(`${this.match.cash[1] + pendingAnte(1)}$`);
    this.hdRightCashLabel?.setText(`${this.match.cash[2] + pendingAnte(2)}$`);
    this.hdHumanCashLabel?.setText(`${this.match.cash[3] + pendingAnte(3)}$`);
    this.hdPotPedestal?.setText(`${bank}$`);
  }

  private renderStatusBanner(): void {
    this.hdBannerLayer.removeChildren();
    if (!this.statusBanner || !this.ctx || this.ctx.getGraphicsMode() !== 'hd') return;

    const bannerY = this.getHdSeatLayout().bannerY;
    const pill = new Graphics();
    pill.roundRect(184, bannerY, 272, 18, 9).fill({ color: 0x3b0c12, alpha: 0.92 }).stroke({ color: 0xffb347, width: 1.1 });
    this.hdBannerLayer.addChild(pill);

    const txt = createHdTextSprite(this.statusBanner, 266, 16, {
      font: 'bold 8.5px "Segoe UI", system-ui, sans-serif',
      fill: '#ffe8a8',
      align: 'center',
    });
    txt.position.set(187, bannerY + 1);
    this.hdBannerLayer.addChild(txt);
  }

  private getActiveMiniTexture(card: Card): Texture | undefined {
    const key = cardKey(card);
    if (this.ctx?.getGraphicsMode() === 'hd') {
      const lib = getHdCardLibrary(this.ctx.stage.getAspectMode());
      return this.getMatchVariant() === 'fantan52' ? lib.compactMiniCards.get(key) : lib.miniCards.get(key);
    }
    if (card.rank === 1) {
      return this.ctx?.assets.miniCards.get(cardKey({ suit: card.suit, rank: 14 }));
    }
    if (card.rank < 6) {
      return getEgaFallbackCardTexture(card.suit, card.rank, true);
    }
    return this.ctx?.assets.miniCards.get(key);
  }

  private getActiveCardTexture(card: Card): Texture | undefined {
    const key = cardKey(card);
    if (this.ctx?.getGraphicsMode() === 'hd') {
      return getHdCardLibrary(this.ctx.stage.getAspectMode()).cards.get(key);
    }
    if (card.rank === 1) {
      return this.ctx?.assets.cards.get(cardKey({ suit: card.suit, rank: 14 }));
    }
    if (card.rank < 6) {
      return getEgaFallbackCardTexture(card.suit, card.rank, false);
    }
    return this.ctx?.assets.cards.get(key);
  }

  private renderHumanHand(): void {
    if (!this.ctx) return;
    this.handLayer.removeChildren();
    this.handCardEntries = [];
    const hand = this.match.round?.hands[3] ?? [];
    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const isFanTanHd = this.isCompactFanTanHdLayout();
    const handScale = this.getHumanHandScale();
    const handTopY = this.getHumanHandTopY();
    const layoutOpts: HandLayoutOptions = this.isHdSquareAspect()
      ? {
          cardWidth: Math.round(64 * handScale),
          cardHeight: Math.round(89 * handScale),
          cardHitWidth: Math.round(64 * handScale),
          overlapStep: isFanTanHd ? 17 : 14,
          areaWidth: 480,
          topY: handTopY,
          centerHorizontal: isFanTanHd,
        }
      : isFanTanHd
        ? {
            cardWidth: Math.round(88 * handScale),
            cardHeight: Math.round(89 * handScale),
            cardHitWidth: Math.round(83 * handScale),
            overlapStep: 18,
            areaWidth: 464,
            topY: handTopY,
            centerHorizontal: true,
          }
        : {};
    this.currentHandLayouts = computeHandLayout(hand, layoutOpts);
    const round = this.match.round;
    const isHumanTurn = round && !round.roundOver && round.currentTurn === 3 && this.phase === 'waitingTurn';
    const visibleHumanCount = this.egaDealtCounts ? this.egaDealtCounts[3] : this.currentHandLayouts.length;

    for (let hIdx = 0; hIdx < Math.min(visibleHumanCount, this.currentHandLayouts.length); hIdx++) {
      const layout = this.currentHandLayouts[hIdx];
      const tex = this.getActiveCardTexture(layout.card);
      if (!tex) continue;

      const cardContainer = new Container();
      cardContainer.position.set(layout.x, layout.y);

      const legal =
        isHumanTurn &&
        isLegalMove(layout.card, round.tableBounds, round.isFirstTurnOfRound, round.rules ?? this.match.ruleConfig);
      const hint = this.ctx?.coachMode ? this.ctx.advisorHint : null;
      const isBestHint = Boolean(
        isHd &&
        legal &&
        hint?.bestCard &&
        hint.candidates.length > 1 &&
        hint.bestCard.suit === layout.card.suit &&
        hint.bestCard.rank === layout.card.rank,
      );

      if (isHd) {
        const shadow = new Graphics();
        shadow.roundRect(3, 4, layout.width - 2, layout.height - 3, 6).fill({ color: 0x000000, alpha: 0.36 });
        cardContainer.addChild(shadow);

        if (legal) {
          const glow = new Graphics();
          glow
            .roundRect(-1.5, -1.5, layout.width + 3, layout.height + 3, 7.5)
            .stroke({ color: isBestHint ? 0x44d984 : 0xffd75e, width: isBestHint ? 2.4 : 1.8, alpha: 0.94 });
          cardContainer.addChild(glow);
        }
      }

      const spr = new Sprite(tex);
      if (isFanTanHd) {
        spr.scale.set(handScale);
      }
      cardContainer.addChild(spr);

      if (isBestHint) {
        const isSquare = this.isHdSquareAspect();
        const badgeX = 0.8;
        const badgeY = isFanTanHd ? (isSquare ? 26 : 28) : isSquare ? 26.5 : 29;
        const badgeW = isFanTanHd ? 11 : 12;
        const badgeH = isSquare ? 12 : 9;
        const badge = new Graphics();
        badge.roundRect(badgeX, badgeY, badgeW, badgeH, 3).fill({ color: 0x0d2d1b, alpha: 0.96 });
        badge.roundRect(badgeX, badgeY, badgeW, badgeH, 3).stroke({ color: 0x52e090, width: 1.2 });
        const cx = badgeX + badgeW * 0.5;
        const cy = badgeY + badgeH * 0.5;
        const rxOuter = 4.2;
        const rxInner = 1.85;
        const yScale = isSquare ? 1 : 35 / 48;
        const starPts: number[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const rad = i % 2 === 0 ? rxOuter : rxInner;
          starPts.push(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad * yScale);
        }
        badge.poly(starPts).fill({ color: 0xffdf6e });
        cardContainer.addChild(badge);
      }

      this.handLayer.addChild(cardContainer);

      this.handCardEntries.push({
        layout,
        container: cardContainer,
        baseY: layout.y,
        liftPx: 0,
      });
    }
  }

  private getBoardCardSlotPos(card: Card): { x: number; y: number } {
    const m = this.getBoardMetrics();
    const rules = resolveRoundRules(this.match.round?.rules ?? this.match.ruleConfig);
    return {
      x: m.slotX0 + (card.rank - rules.minRank) * m.stepX,
      y: m.slotY0 + (card.suit - 1) * m.stepY,
    };
  }

  private placeMiniCardOnTable(card: Card): void {
    const tex = this.getActiveMiniTexture(card);
    if (!tex) return;
    const bm = this.getBoardMetrics();
    const spr = new Sprite(tex);
    const pos = this.getBoardCardSlotPos(card);
    spr.position.set(pos.x, pos.y);
    if (this.ctx?.getGraphicsMode() === 'ega' && this.getMatchVariant() === 'fantan52') {
      spr.width = bm.cardW;
      spr.height = bm.cardH;
    }
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

  private spawnCoinFlight(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs = 360,
    delayMs = 0,
    onArrive?: () => void,
  ): void {
    const isHd = this.ctx?.getGraphicsMode() === 'hd';
    const tex = isHd ? getHdCoinTexture() : this.coinFrames[0];
    if (!tex) return;

    const spr = new Sprite(tex);
    spr.anchor.set(0.5);
    if (isHd) spr.scale.set(0.76);
    spr.position.set(startX, startY);
    spr.visible = delayMs <= 0;
    this.fxLayer.addChild(spr);
    this.flyingCoins.push({
      sprite: spr,
      startX,
      startY,
      endX,
      endY,
      elapsed: 0,
      durationMs,
      delayMs,
      onArrive,
    });
  }

  private spawnEgaTrajectoryCoin(traj: EgaCoinTrajectory, delayMs = 0, onArrive?: () => void): void {
    const startPt = traj.waypoints[0];
    const endPt = traj.waypoints[traj.waypoints.length - 1];
    const spr = new Sprite(traj.getTexture(0, 0));
    spr.anchor.set(0.5);
    spr.position.set(startPt.x, startPt.y);
    spr.visible = delayMs <= 0;
    this.fxLayer.addChild(spr);
    this.flyingCoins.push({
      sprite: spr,
      startX: startPt.x,
      startY: startPt.y,
      endX: endPt.x,
      endY: endPt.y,
      elapsed: 0,
      durationMs: traj.durationMs,
      delayMs,
      waypoints: traj.waypoints,
      getTexture: traj.getTexture,
      onArrive,
    });
  }

  private findRivalCardSlot(seat: 1 | 2, card: Card): number {
    const slots = this.rivalSlotCards[seat];
    const key = cardKey(card);
    const exact = slots.indexOf(key);
    if (exact >= 0) return exact;
    const fallback = slots.findIndex((entry) => entry !== null);
    if (fallback >= 0) return fallback;
    return Math.max(0, (this.match.round?.hands[seat].length ?? 1) - 1);
  }

  private consumePendingRivalSlot(): void {
    if (!this.pendingRivalRemoveSlot) return;
    const { seat, slotIdx } = this.pendingRivalRemoveSlot;
    this.pendingRivalRemoveSlot = null;
    if (slotIdx >= 0 && slotIdx < this.rivalSlotCards[seat].length) {
      this.rivalSlotCards[seat][slotIdx] = null;
    }
    this.renderRivalCardBacks();
  }

  private startCardFlight(seat: SeatIndex, card: Card, originX?: number, originY?: number): void {
    if (!this.ctx) return;
    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const miniTex = this.getActiveMiniTexture(card);
    const bm = this.getBoardMetrics();
    const { x: endX, y: endY } = this.getBoardCardSlotPos(card);
    const rm = this.getRivalCardMetrics();
    const botSlotIdx = seat === 1 || seat === 2 ? this.findRivalCardSlot(seat, card) : 0;
    const rivalSlot = seat === 1 || seat === 2 ? this.getRivalCardSlotPos(seat, botSlotIdx) : null;
    const startX = originX ?? (rivalSlot ? rivalSlot.x : 300);
    const startY = originY ?? (seat === 3 ? this.getHumanHandTopY() : rivalSlot ? rivalSlot.y : 120);

    const isBot = seat === 1 || seat === 2;
    const botRow = isBot ? Math.floor(botSlotIdx / rm.cols) : 0;
    const delayBotLaunch = isBot && Boolean(miniTex) && (isHd || Boolean(this.egaBank));
    if (!delayBotLaunch) {
      this.ctx.audio.sfx.cardSlide();
    }
    this.activeFlightSeat = seat;
    if (isBot && isHd) {
      this.rivalPlayAnimMs[seat] = botRow >= 1 ? HD_BOT_THROW_FAR_MS : HD_BOT_THROW_NEAR_MS;
    }
    this.pendingMoveCard = card;
    this.hoveredCardKey = null;

    const prevBank = this.match.round?.bank ?? 0;
    this.match = applyMove(this.match, card);
    const cardLabel = formatCardShort(card);
    const playLogText = getTranslations(this.ctx.getLanguage()).scenes.logPlay(
      this.seatDisplayName(seat),
      cardLabel,
    );
    this.pushMoveLog('play', playLogText, seat, {
      type: 'play',
      seat,
      cardLabel,
    });
    if (this.match.round?.roundOver) {
      this.roundWinner = this.match.round.winner;
      this.roundWonPot = prevBank + (this.match.round.lastHandPenaltyCollected ?? 0);
    } else {
      this.roundWinner = null;
      this.roundWonPot = 0;
    }
    this.emitTelemetry();

    if (seat === 3) {
      this.renderHumanHand();
    } else {
      this.pendingRivalRemoveSlot = { seat, slotIdx: botSlotIdx };
      if (!delayBotLaunch) {
        this.consumePendingRivalSlot();
      }
    }

    if (!miniTex) {
      this.finishCardFlight();
      return;
    }

    if (!isHd && this.egaBank) {
      const flightFrames = this.egaBank.flyingCardFrames;
      const isBot = seat === 1 || seat === 2;
      const botRow = isBot ? Math.floor(botSlotIdx / rm.cols) : 0;
      const botLaunch = isBot ? getEgaBotCardLaunchPos(seat, botSlotIdx, rm.cols) : null;
      const egaStartX = botLaunch ? botLaunch.x : startX + 14;
      const egaStartY = botLaunch ? botLaunch.y : startY + 12;
      const egaEndX = endX + bm.cardW * 0.5;
      const egaEndY = endY + bm.cardH * 0.5;
      const spr = new Sprite(flightFrames[0]);
      spr.anchor.set(0.5);
      spr.position.set(egaStartX, egaStartY);
      spr.visible = !isBot;
      this.fxLayer.addChild(spr);

      if (isBot) {
        const initPose = getEgaBotCardThrowPose(this.egaBank, seat, botSlotIdx, rm.cols, 0);
        this.setEgaRivalOverlay(seat, initPose.overlayTex, 'vr', initPose.overlayX);
      }

      this.phase = 'movingCard';
      this.phaseTimerMs = 0;
      this.flyingCard = {
        sprite: spr,
        shadow: null,
        startX: egaStartX,
        startY: egaStartY,
        endX: egaEndX,
        endY: egaEndY,
        elapsed: 0,
        durationMs: isBot ? (botRow >= 1 ? EGA_BOT_THROW_FAR_MS : EGA_BOT_THROW_NEAR_MS) : 380,
        egaFrames: flightFrames,
        botSlotIdx: isBot ? botSlotIdx : undefined,
        botCols: isBot ? rm.cols : undefined,
        soundPlayed: !isBot,
        onLand: () => this.finishCardFlight(),
      };
      return;
    }

    let shadow: Graphics | null = null;
    if (isHd) {
      shadow = new Graphics();
      shadow.roundRect(3, 5, bm.cardW, bm.cardH, bm.cornerRadius).fill({ color: 0x000000, alpha: 0.34 });
      shadow.position.set(startX, startY);
      shadow.visible = !isBot;
      this.fxLayer.addChild(shadow);
    }

    const spr = new Sprite(miniTex);
    spr.position.set(startX, startY);
    spr.visible = !isBot;
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
      durationMs: isBot ? (botRow >= 1 ? HD_BOT_THROW_FAR_MS : HD_BOT_THROW_NEAR_MS) : 380,
      hdBotSync: isHd && isBot,
      soundPlayed: !isBot,
      onLand: () => this.finishCardFlight(),
    };
  }

  private finishCardFlight(): void {
    this.activeFlightSeat = null;
    this.consumePendingRivalSlot();
    if (this.flyingCard) {
      const bm = this.getBoardMetrics();
      this.spawnSparkBurst(this.flyingCard.endX + bm.cardW * 0.5, this.flyingCard.endY + bm.cardH * 0.5, 6, 0xffe48a);
      this.fxLayer.removeChild(this.flyingCard.sprite);
      if (this.flyingCard.shadow) this.fxLayer.removeChild(this.flyingCard.shadow);
      this.flyingCard = null;
    }
    if (this.pendingMoveCard) {
      this.placeMiniCardOnTable(this.pendingMoveCard);
      this.pendingMoveCard = null;
    }
    if (this.ctx?.getGraphicsMode() === 'ega') {
      this.clearEgaActionOverlays();
    }
    this.renderCashAndBankHud();

    if (this.match.round?.roundOver) {
      this.enterRoundEnd();
    } else {
      this.enterNextTurn();
    }
  }

  private triggerSeatPass(seat: SeatIndex): void {
    const roundBeforePass = this.match.round;
    if (roundBeforePass && (seat === 1 || seat === 2)) {
      const excluded = getAllCurrentlyLegalCards(
        roundBeforePass.tableBounds,
        roundBeforePass.isFirstTurnOfRound,
        roundBeforePass.rules ?? this.match.ruleConfig,
      );
      for (const card of excluded) {
        this.passExclusions[seat].add(advisorCardKey(card));
      }
    }
    this.passingBroke = (this.match.cash[seat] ?? 0) <= 0;
    if (this.passingBroke) {
      this.ctx?.audio.sfx.illegalMove();
    }
    this.match = applyPass(this.match);
    this.renderCashAndBankHud();
    this.renderStatusBanner();
    const passLogText = getTranslations(this.ctx?.getLanguage() ?? DEFAULT_LANGUAGE).scenes.logPass(
      this.seatDisplayName(seat),
      PASS_PENALTY,
    );
    this.pushMoveLog('pass', passLogText, seat, {
      type: 'pass',
      seat,
      penalty: PASS_PENALTY,
    });

    const sl = this.getHdSeatLayout();
    const isHd = this.ctx?.getGraphicsMode() === 'hd';
    if (!isHd && this.egaBank) {
      this.clearEgaActionOverlays();
      if (!this.passingBroke) {
        const coinDelay = seat === 3 ? 280 : 260 + EGA_BOT_PURSE_COIN_RELEASE_MS;
        this.spawnEgaTrajectoryCoin(getEgaHatCoinTrajectory(this.egaBank, seat), coinDelay, () => {
          this.ctx?.audio.sfx.coinHatClink();
        });
      }
    } else if (!this.passingBroke) {
      const hatPos = this.hdDealer?.getHatWorldPosition() ?? { x: 320, y: 42 };
      const startX = seat === 1 ? sl.leftCenterX : seat === 2 ? sl.rightCenterX : 316;
      const startY = seat === 3 ? sl.coinHumanY : sl.coinLeftY;
      const delayMs = seat === 3 ? 140 : 100 + HD_BOT_PURSE_COIN_RELEASE_MS;
      this.spawnCoinFlight(startX, startY, hatPos.x, hatPos.y, 460, delayMs, () => {
        this.ctx?.audio.sfx.coinHatClink();
      });
    }

    this.passingSeat = seat;
    this.phase = 'passing';
    this.phaseTimerMs = 0;
    this.emitTelemetry();
  }

  private enterNextTurn(): void {
    this.phase = 'waitingTurn';
    this.phaseTimerMs = 0;

    const round = this.match.round;
    if (!round || round.roundOver) return;

    if (round.currentTurn === 3) {
      const legal = getLegalMoves(
        round.hands[3],
        round.tableBounds,
        round.isFirstTurnOfRound,
        round.rules ?? this.match.ruleConfig,
      );
      if (legal.length === 0) {
        this.statusBanner = getTranslations(this.ctx?.getLanguage() ?? DEFAULT_LANGUAGE).scenes.tableNoLegalMovesPass(
          PASS_PENALTY,
        );
      } else {
        this.statusBanner = '';
      }
    } else {
      this.statusBanner = '';
      const botLegal = getLegalMoves(
        round.hands[round.currentTurn],
        round.tableBounds,
        round.isFirstTurnOfRound,
        round.rules ?? this.match.ruleConfig,
      );
      // In original DOS NINE.EXE, rivals pause thoughtfully and tap their fingers before tricky turns.
      const tapPct = botLegal.length > 1 ? 45 : 25;
      this.egaBotThinkMode = this.rng.nextInt(100) < tapPct ? 'tap' : 'quick';
      this.egaBotThinkDurationMs = this.egaBotThinkMode === 'tap' ? EGA_BOT_TAP_DURATION_MS : 560;
    }
    this.refreshAdvisorHint();
    this.renderHumanHand();
    this.renderStatusBanner();
    this.emitTelemetry();
  }

  private refreshAdvisorHint(): void {
    if (!this.ctx) return;
    const round = this.match.round;
    if (
      !this.ctx.coachMode ||
      this.phase !== 'waitingTurn' ||
      !round ||
      round.roundOver ||
      round.currentTurn !== 3
    ) {
      this.ctx.advisorHint = null;
      return;
    }
    this.ctx.advisorHint = evaluatePlayerMoves({
      round,
      difficulty: this.match.clubTable,
      passExclusions: this.passExclusions,
      cash: this.match.cash,
      xrayMode: this.ctx.advisorXrayMode,
      language: this.ctx.getLanguage(),
    });
  }

  private executeAdvisorAutoMove(): void {
    const round = this.match.round;
    if (!this.ctx || !round || round.roundOver || round.currentTurn !== 3) return;
    const hint =
      this.ctx.advisorHint ??
      evaluatePlayerMoves({
        round,
        difficulty: this.match.clubTable,
        passExclusions: this.passExclusions,
        cash: this.match.cash,
        xrayMode: this.ctx.advisorXrayMode,
        language: this.ctx.getLanguage(),
      });
    this.ctx.advisorHint = hint;
    if (hint.action === 'play' && hint.bestCard) {
      this.startCardFlight(3, hint.bestCard);
    } else {
      this.triggerSeatPass(3);
    }
  }

  private enterRoundEnd(): void {
    if (this.ctx) {
      this.ctx.advisorHint = null;
    }
    this.ctx?.audio.sfx.victoryBeep();
    this.phase = 'roundEnd';
    this.phaseTimerMs = 0;
    this.statusBanner = '';
    this.renderStatusBanner();

    const winner = this.roundWinner ?? 3;
    const winLogText = getTranslations(this.ctx?.getLanguage() ?? DEFAULT_LANGUAGE).scenes.logWin(
      this.seatDisplayName(winner),
      this.match.roundNumber,
      this.roundWonPot,
    );
    this.pushMoveLog('win', winLogText, winner, {
      type: 'win',
      seat: winner,
      roundNumber: this.match.roundNumber,
      pot: this.roundWonPot,
    });
    const sl = this.getHdSeatLayout();
    const isHd = this.ctx?.getGraphicsMode() === 'hd';
    if (this.roundWonPot > 0) {
      if (!isHd && this.egaBank) {
        this.clearEgaActionOverlays();
        const count = winner === 3 ? 1 : 3;
        for (let i = 0; i < count; i++) {
          this.spawnEgaTrajectoryCoin(
            getEgaPayoutCoinTrajectory(this.egaBank, winner, i),
            340 + i * 160,
            i === 0 ? () => this.ctx?.audio.sfx.coinHatClink() : undefined,
          );
        }
      } else {
        const dstX = winner === 1 ? sl.leftCenterX : winner === 2 ? sl.rightCenterX : 316;
        const dstY = winner === 3 ? sl.coinHumanY : sl.coinLeftY;
        const hatPos = this.hdDealer?.getHatWorldPosition(winner) ?? { x: 320, y: 42 };
        this.spawnCoinFlight(hatPos.x - 4, hatPos.y, dstX, dstY, 520, 340);
        this.spawnCoinFlight(hatPos.x + 4, hatPos.y + 3, dstX + 4, dstY, 560, 480);
        this.spawnCoinFlight(hatPos.x, hatPos.y + 1, dstX - 4, dstY, 600, 620, () => {
          this.spawnSparkBurst(dstX, dstY, 12, 0xffea88);
        });
        this.ctx?.audio.sfx.coinPourPayout(0.36);
      }
    }
    this.emitTelemetry();
  }

  private enterMatchEnd(): void {
    if (!this.ctx) return;
    this.phase = 'matchEnd';
    this.phaseTimerMs = 0;

    const humanCash = this.match.cash[3];
    const botsOut = this.match.cash[1] <= 0 || this.match.cash[2] <= 0;
    const humanWonMatch = humanCash > 0 && (botsOut || (humanCash >= this.match.cash[1] && humanCash >= this.match.cash[2]));

    if (this.ctx.audio.music.getMusicMode() === 'mp3') {
      this.ctx.audio.music.stop();
      this.ctx.audio.music.playStinger(humanWonMatch ? 'victory' : 'bankrupt', () => {
        if (humanWonMatch) {
          this.ctx?.audio.sfx.matchVictory();
        } else {
          this.ctx?.audio.sfx.matchDefeat();
        }
      });
    } else if (humanWonMatch) {
      this.ctx.audio.sfx.matchVictory();
    } else {
      this.ctx.audio.sfx.matchDefeat();
    }

    if (humanWonMatch) {
      this.spawnSparkBurst(SCREEN_WIDTH * 0.5, 160, 22, 0xffdf70);
    }

    const finalScore = getFinalClubScore(this.match);
    const sameScoresSnapshot = this.matchHighScoresRevision === this.ctx.getHighScoresRevision();
    const sameProfile =
      this.ctx.sessionPlayer.loggedIn &&
      this.ctx.sessionPlayer.name.toLowerCase() === this.match.playerName.toLowerCase();
    const matchVariant = resolveRoundRules(this.match.ruleConfig).variant;
    const sameVariant = matchVariant === this.ctx.ruleConfig.variant;
    if (sameProfile && (matchVariant === 'fantan52' || sameScoresSnapshot)) {
      const currentTables = this.ctx.getHighScoresForVariant(matchVariant);
      const updated = upsertHighScore(
        currentTables,
        this.match.clubTable,
        this.match.playerName,
        this.match.playerPassword,
        finalScore,
      );
      if (matchVariant === 'fantan52') {
        this.ctx.fanTanHighScores = updated;
        this.ctx.persistFanTanHighScores();
      } else {
        this.ctx.highScores = updated;
        this.ctx.persistHighScores();
      }
      if (sameVariant && this.match.clubTable === this.ctx.config.clubTable) {
        this.ctx.sessionPlayer.clubCarryover = finalScore - 200;
      }
    }

    this.drawMatchEndModal(humanWonMatch, finalScore);
    this.emitTelemetry();
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

    const tr = getTranslations(this.ctx.getLanguage()).scenes;

    const titleSpr = createHdTextSprite(humanWon ? tr.matchEndVictory : tr.matchEndBankrupt, 240, 28, {
      font: 'bold 18px Georgia, "Times New Roman", serif',
      fill: humanWon ? ['#fff3be', '#d99e26'] : ['#ff9696', '#c42938'],
      align: 'center',
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 4,
    });
    titleSpr.anchor.set(0.5);
    titleSpr.position.set(SCREEN_WIDTH * 0.5, 130);
    this.overlayLayer.addChild(titleSpr);

    const cashSpr = createHdTextSprite(tr.finalCash(this.match.cash[3]), 240, 18, {
      font: '600 11px "Segoe UI", system-ui, sans-serif',
      fill: '#f0e4c8',
      align: 'center',
    });
    cashSpr.anchor.set(0.5);
    cashSpr.position.set(SCREEN_WIDTH * 0.5, 164);
    this.overlayLayer.addChild(cashSpr);

    const scoreSpr = createHdTextSprite(tr.clubScore(finalScore), 240, 18, {
      font: 'bold 11.5px "Segoe UI", system-ui, sans-serif',
      fill: '#ffe18c',
      align: 'center',
    });
    scoreSpr.anchor.set(0.5);
    scoreSpr.position.set(SCREEN_WIDTH * 0.5, 186);
    this.overlayLayer.addChild(scoreSpr);

    const promptSpr = createHdTextSprite(tr.continuePrompt, 240, 16, {
      font: '600 8.5px Georgia, serif',
      fill: '#cbb98c',
      align: 'center',
    });
    promptSpr.anchor.set(0.5);
    promptSpr.position.set(SCREEN_WIDTH * 0.5, 222);
    this.overlayLayer.addChild(promptSpr);
  }

  private findCardLayoutAt(x: number, y: number): HandCardLayout | null {
    if (y < this.getHumanHandTopY() - 8 || y >= SCREEN_HEIGHT) return null;
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

    if (this.phase === 'dealingCards') {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        this.finishEgaDealingCards();
        return;
      }
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
      const legal = getLegalMoves(
        round.hands[3],
        round.tableBounds,
        round.isFirstTurnOfRound,
        round.rules ?? this.match.ruleConfig,
      );
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

    if (this.phase === 'dealingCards') {
      this.finishEgaDealingCards();
      return;
    }

    if (this.phase !== 'waitingTurn' || !this.match.round || this.match.round.currentTurn !== 3) {
      return;
    }

    const round = this.match.round;
    const roundRules = round.rules ?? this.match.ruleConfig;
    const legal = getLegalMoves(round.hands[3], round.tableBounds, round.isFirstTurnOfRound, roundRules);

    if (legal.length === 0) {
      this.triggerSeatPass(3);
      return;
    }

    const hit = this.findCardLayoutAt(pt.x, pt.y);
    if (!hit) return;

    if (isLegalMove(hit.card, round.tableBounds, round.isFirstTurnOfRound, roundRules)) {
      this.startCardFlight(3, hit.card, hit.x + 25, hit.y);
    } else {
      this.ctx?.audio.sfx.illegalMove();
      this.phase = 'illegalShake';
      this.phaseTimerMs = 0;
    }
  };

  private updateEgaHatTimeline(timerMs: number, openEndMs: number, holdEndMs: number, closeEndMs: number): void {
    const bank = this.egaBank;
    if (!bank) return;
    const frames = bank.dealerHatOpenFrames;
    if (timerMs < openEndMs) {
      const idx = Math.min(frames.length - 1, Math.floor((timerMs / openEndMs) * frames.length));
      this.setEgaDealerHatPose(frames[idx], 274, 20, true);
    } else if (timerMs < holdEndMs) {
      this.setEgaDealerHatPose(frames[frames.length - 1], 274, 20, true);
    } else if (timerMs < closeEndMs) {
      const u = (timerMs - holdEndMs) / Math.max(1, closeEndMs - holdEndMs);
      const revIdx = Math.max(0, frames.length - 1 - Math.floor(u * frames.length));
      this.setEgaDealerHatPose(frames[revIdx], 274, 20, true);
    } else {
      this.setEgaDealerHatPose(null);
    }
  }

  private updateEgaTossRival(seat: 1 | 2, localMs: number, durationMs: number): void {
    const bank = this.egaBank;
    if (!bank) return;
    const tex = getEgaBotPurseTossFrame(bank, seat, localMs, durationMs);
    this.setEgaRivalOverlay(seat, tex, 'purse');
  }

  private startEgaDealingCards(): void {
    const round = this.match.round;
    if (!this.egaBank || !round) {
      this.finishEgaDealingCards();
      return;
    }
    this.egaDealtCounts = { 1: 0, 2: 0, 3: 0 };
    this.egaDealPrevStep = -1;
    this.phase = 'dealingCards';
    this.phaseTimerMs = 0;
    if (this.egaDealerDealSpr) {
      this.egaDealerDealSpr.visible = true;
      this.egaDealerDealSpr.position.set(293, 37);
      this.egaDealerDealSpr.texture = this.egaBank.dealerDealFrames[0];
    }
    if (this.egaDealerDealElbowMask) {
      this.egaDealerDealElbowMask.visible = true;
    }
    if (this.egaMiniBackTex && !this.egaDealFlySpr) {
      const spr = new Sprite(this.egaMiniBackTex);
      spr.anchor.set(0.5);
      spr.position.set(308, 66);
      this.fxLayer.addChild(spr);
      this.egaDealFlySpr = spr;
    }
    this.renderRivalCardBacks();
    this.renderHumanHand();
  }

  private updateEgaDealingCards(timerMs: number): void {
    const bank = this.egaBank;
    const round = this.match.round;
    if (!bank || !round) {
      this.finishEgaDealingCards();
      return;
    }
    const maxVisible = this.getMatchVariant() === 'fantan52' ? 18 : 12;
    const targets: Record<SeatIndex, number> = {
      1: Math.min(maxVisible, round.hands[1].length),
      2: Math.min(maxVisible, round.hands[2].length),
      3: Math.min(round.hands[3].length, this.currentHandLayouts.length || round.hands[3].length),
    };
    // Build interleaved clockwise deal schedule (Left -> Right -> Human per card index).
    const schedule: { seat: SeatIndex; slotIdx: number }[] = [];
    const maxRounds = Math.max(targets[1], targets[2], targets[3]);
    for (let r = 0; r < maxRounds; r++) {
      for (const s of [1, 2, 3] as const) {
        if (r < targets[s]) schedule.push({ seat: s, slotIdx: r });
      }
    }

    const stepMs = 65;
    const stepIdx = Math.floor(timerMs / stepMs);
    if (stepIdx >= schedule.length) {
      this.finishEgaDealingCards();
      return;
    }

    // Reveal all cards from completed steps before the active flying card.
    if (stepIdx !== this.egaDealPrevStep) {
      const counts: Record<SeatIndex, number> = { 1: 0, 2: 0, 3: 0 };
      for (let i = 0; i < stepIdx; i++) {
        counts[schedule[i].seat]++;
      }
      this.egaDealtCounts = counts;
      this.renderRivalCardBacks();
      this.renderHumanHand();
      if (stepIdx % 2 === 0) {
        this.ctx?.audio.sfx.cardDeal();
      }
      this.egaDealPrevStep = stepIdx;
    }

    const cur = schedule[stepIdx];
    const frac = (timerMs - stepIdx * stepMs) / stepMs;
    if (this.egaDealerDealSpr) {
      const dealPose = getEgaDealerDealPose(bank, cur.seat, frac);
      this.egaDealerDealSpr.visible = true;
      this.egaDealerDealSpr.position.set(dealPose.x, dealPose.y);
      this.egaDealerDealSpr.texture = dealPose.texture;
      if (this.egaDealerDealElbowMask) {
        this.egaDealerDealElbowMask.visible = dealPose.coverRestingElbow;
      }
    }

    if (this.egaDealFlySpr) {
      let endX = 316;
      let endY = 307;
      if (cur.seat === 1 || cur.seat === 2) {
        const dst = this.getRivalCardSlotPos(cur.seat, cur.slotIdx);
        endX = dst.x + 7;
        endY = dst.y + 8;
      } else {
        const hl = this.currentHandLayouts[cur.slotIdx];
        endX = (hl ? hl.x : 191 + cur.slotIdx * 16) + 25;
        endY = (hl ? hl.y : 290) + 28;
      }
      const pos = computeEgaDealCardPos(308, 66, endX, endY, frac);
      this.egaDealFlySpr.position.set(pos.x, pos.y);
      this.egaDealFlySpr.visible = true;
    }
  }

  private buildDealSchedule(): { seat: SeatIndex; slotIdx: number }[] {
    const round = this.match.round;
    if (!round) return [];
    const maxVisible = this.getMatchVariant() === 'fantan52' ? 18 : 12;
    const targets: Record<SeatIndex, number> = {
      1: Math.min(maxVisible, round.hands[1].length),
      2: Math.min(maxVisible, round.hands[2].length),
      3: Math.min(round.hands[3].length, this.currentHandLayouts.length || round.hands[3].length),
    };
    const schedule: { seat: SeatIndex; slotIdx: number }[] = [];
    const maxRounds = Math.max(targets[1], targets[2], targets[3]);
    for (let r = 0; r < maxRounds; r++) {
      for (const s of [1, 2, 3] as const) {
        if (r < targets[s]) schedule.push({ seat: s, slotIdx: r });
      }
    }
    return schedule;
  }

  private startHdDealingCards(): void {
    if (!this.ctx) return;
    this.phase = 'dealingCards';
    this.phaseTimerMs = 0;
    this.egaDealPrevStep = -1;
    this.egaDealtCounts = { 1: 0, 2: 0, 3: 0 };
    if (!this.egaDealFlySpr) {
      const backTex = getHdRivalCardBackTexture(this.ctx.stage.getAspectMode());
      const spr = new Sprite(backTex);
      const rm = this.getRivalCardMetrics();
      spr.width = rm.w * 1.15;
      spr.height = rm.h * 1.15;
      spr.anchor.set(0.5);
      spr.position.set(320, 56);
      this.fxLayer.addChild(spr);
      this.egaDealFlySpr = spr;
    }
    this.renderRivalCardBacks();
    this.renderHumanHand();
  }

  private updateHdDealingCards(timerMs: number): void {
    const round = this.match.round;
    if (!round) {
      this.finishEgaDealingCards();
      return;
    }
    const schedule = this.buildDealSchedule();
    const state = getHdDealingStepState(timerMs, schedule.length, HD_DEAL_STEP_MS);
    if (state.finished || state.currentStep >= schedule.length) {
      this.hdDealer?.setTableExpression('idle', this.idleBlinkMs);
      this.finishEgaDealingCards();
      return;
    }

    const stepIdx = state.currentStep;
    if (stepIdx !== this.egaDealPrevStep) {
      const counts: Record<SeatIndex, number> = { 1: 0, 2: 0, 3: 0 };
      for (let i = 0; i < stepIdx; i++) {
        counts[schedule[i].seat]++;
      }
      this.egaDealtCounts = counts;
      this.renderRivalCardBacks();
      this.renderHumanHand();
      if (stepIdx % 2 === 0) {
        this.ctx?.audio.sfx.cardDeal();
      }
      this.egaDealPrevStep = stepIdx;
    }

    this.hdDealer?.setTableExpression(state.dealerPose, timerMs);

    const cur = schedule[stepIdx];
    const frac = Math.min(1, (timerMs - stepIdx * HD_DEAL_STEP_MS) / HD_DEAL_STEP_MS);
    if (this.egaDealFlySpr) {
      let endX = 320;
      let endY = 296;
      if (cur.seat === 1 || cur.seat === 2) {
        const dst = this.getRivalCardSlotPos(cur.seat, cur.slotIdx);
        const rm = this.getRivalCardMetrics();
        endX = dst.x + rm.w * 0.5;
        endY = dst.y + rm.h * 0.5;
      } else {
        const hl = this.currentHandLayouts[cur.slotIdx];
        endX = (hl ? hl.x : 191 + cur.slotIdx * 16) + 25;
        endY = (hl ? hl.y : 290) + 28;
      }
      const ease = frac * frac * (3 - 2 * frac);
      const curX = 320 + (endX - 320) * ease;
      const curY = 56 + (endY - 56) * ease - Math.sin(frac * Math.PI) * 14;
      this.egaDealFlySpr.position.set(curX, curY);
      this.egaDealFlySpr.visible = true;
    }
  }

  private finishEgaDealingCards(): void {
    this.egaDealtCounts = null;
    this.egaDealPrevStep = -1;
    if (this.egaDealerDealElbowMask) {
      this.egaDealerDealElbowMask.visible = false;
    }
    if (this.egaDealerDealSpr) {
      this.egaDealerDealSpr.visible = false;
    }
    if (this.egaDealFlySpr) {
      this.fxLayer.removeChild(this.egaDealFlySpr);
      this.egaDealFlySpr.destroy();
      this.egaDealFlySpr = null;
    }
    this.renderRivalCardBacks();
    this.renderHumanHand();
    this.enterNextTurn();
  }

  private updateEgaWaitingIdle(round: NonNullable<MatchState['round']>): void {
    const bank = this.egaBank;
    if (!bank) return;
    if (this.dealerSpr) {
      // DOS CS:2114 / CS:23A5 -> 0xe97: after ~10.5s waiting on human, dealer rings the brass handbell.
      const bellActive = round.currentTurn === 3 && this.humanWaitMs >= 10500;
      const bellCycleIdx = bellActive ? Math.floor((this.humanWaitMs - 10500) / 12000) : -1;
      const bellCycleMs = bellActive ? (this.humanWaitMs - 10500) % 12000 : 0;
      const glanceActive = round.currentTurn === 3 && this.humanWaitMs >= 6500 && this.humanWaitMs < 8500;
      if (bellActive && bellCycleMs < 1800) {
        const bellSeq = [0, 1, 2, 3, 2, 1, 2, 3, 0];
        const bIdx = Math.min(bellSeq.length - 1, Math.floor(bellCycleMs / 200));
        this.dealerSpr.texture = bank.dealerBellFrames[bellSeq[bIdx]] ?? bank.dealerBellFrames[0];
        if (bellCycleIdx !== this.idleBellCycleTriggered) {
          this.idleBellCycleTriggered = bellCycleIdx;
          this.ctx?.audio.sfx.dealerBellPing();
        }
      } else if (glanceActive) {
        this.dealerSpr.texture = getEgaDealerGlanceWagFrame(bank, this.humanWaitMs - 6500);
      } else {
        const cycle = this.idleBlinkMs % 6400;
        if (cycle > 6150 || (cycle > 2950 && cycle < 3200)) {
          this.dealerSpr.texture = bank.dealerBlinkTex;
        } else if (cycle > 4500 && cycle < 4850) {
          this.dealerSpr.texture = bank.dealerLookLeftTex;
        } else if (cycle > 1300 && cycle < 1650) {
          this.dealerSpr.texture = bank.dealerLookRightTex;
        } else {
          this.dealerSpr.texture = bank.dealerIdleTex;
        }
      }
    }
    if (round.currentTurn === 3 && this.humanWaitMs >= 4500) {
      const waitCycleIdx = Math.floor((this.humanWaitMs - 4500) / 4200);
      const waitCycleMs = (this.humanWaitMs - 4500) % 4200;
      const actor: 1 | 2 = waitCycleIdx % 2 === 0 ? 1 : 2;
      const other: 1 | 2 = actor === 1 ? 2 : 1;
      this.setEgaRivalOverlay(other, null);
      const otherSpr = other === 1 ? this.leftBotSpr : this.rightBotSpr;
      if (otherSpr) otherSpr.texture = bank.botFrames[0];

      // Alternate between bored yawning (DOS proc_113b timings) and DOS 21-step finger tapping/glance.
      if (Math.floor(waitCycleIdx / 2) % 2 === 1 && waitCycleMs < EGA_BOT_TAP_DURATION_MS) {
        this.setEgaRivalOverlay(actor, null);
        const actorSpr = actor === 1 ? this.leftBotSpr : this.rightBotSpr;
        if (actorSpr) actorSpr.texture = getEgaBotTapFrame(bank, waitCycleMs);
      } else {
        const yawnTex = getEgaBotYawnFrame(bank, waitCycleMs, Math.floor(waitCycleIdx / 2) % 2 === 0);
        if (yawnTex) {
          this.setEgaRivalOverlay(actor, yawnTex, 'yawn');
        } else {
          this.setEgaRivalOverlay(actor, null);
          const actorSpr = actor === 1 ? this.leftBotSpr : this.rightBotSpr;
          if (actorSpr) actorSpr.texture = bank.botFrames[0];
        }
      }
    } else {
      this.setEgaRivalOverlay(1, null);
      this.setEgaRivalOverlay(2, null);
    }
  }

  private updateEgaRoundEndPose(timerMs: number): void {
    const bank = this.egaBank;
    if (!bank) return;
    const winner = this.roundWinner ?? 3;
    const frames = bank.dealerHatOpenFrames;
      if (timerMs < 360) {
      const idx = Math.min(frames.length - 1, Math.floor((timerMs / 360) * frames.length));
      this.setEgaDealerHatPose(frames[idx], 274, 20, true);
    } else if (timerMs < 1400) {
      if (winner === 1) {
        const pf = bank.dealerPourLeftFrames;
        const pIdx = Math.min(pf.length - 1, Math.floor(((timerMs - 360) / 1040) * pf.length));
        this.setEgaDealerHatPose(pf[pIdx], 274, 3, true);
      } else if (winner === 2) {
        const pf = bank.dealerPourRightFrames;
        const pIdx = Math.min(pf.length - 1, Math.floor(((timerMs - 360) / 1040) * pf.length));
        this.setEgaDealerHatPose(pf[pIdx], 274, 20, true);
      } else {
        const pf = bank.dealerPourDownFrames;
        const pIdx = Math.min(pf.length - 1, Math.floor(((timerMs - 360) / 640) * pf.length));
        this.setEgaDealerHatPose(pf[pIdx], 274, 20, true);
      }
    } else if (timerMs < 1720) {
      const u = (timerMs - 1400) / 320;
      const revIdx = Math.max(0, frames.length - 1 - Math.floor(u * frames.length));
      this.setEgaDealerHatPose(frames[revIdx], 274, 20, true);
    } else {
      this.setEgaDealerHatPose(null);
      if ((winner === 1 || winner === 2) && timerMs < 1840) {
        const purseTex = getEgaBotPurseReceiveFrame(bank, timerMs - 1720, 120);
        this.setEgaRivalOverlay(winner, purseTex, 'purse');
      } else {
        this.setEgaRivalOverlay(1, null);
        this.setEgaRivalOverlay(2, null);
      }
    }
  }

  update(dtMs: number): void {
    const isHd = this.ctx?.getGraphicsMode() === 'hd';

    // Spinning / 3D-flipping / DOS-waypoint coin flights
    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const c = this.flyingCoins[i];
      if (c.delayMs && c.delayMs > 0) {
        c.delayMs -= dtMs;
        if (c.delayMs > 0) continue;
        c.sprite.visible = true;
      }
      c.elapsed += dtMs;
      const t = Math.min(1, c.elapsed / c.durationMs);
      if (c.waypoints) {
        const pos = evaluateWaypointPath(c.waypoints, t);
        c.sprite.position.set(pos.x, pos.y);
      } else {
        const ease = 1 - Math.pow(1 - t, 2);
        c.sprite.position.set(
          c.startX + (c.endX - c.startX) * ease,
          c.startY + (c.endY - c.startY) * ease - Math.sin(t * Math.PI) * 22,
        );
      }
      if (c.getTexture) {
        c.sprite.texture = c.getTexture(t, c.elapsed);
      } else if (isHd) {
        c.sprite.scale.set(0.76 * Math.cos(c.elapsed * 0.022), 0.76);
      } else {
        const frame = Math.floor(c.elapsed / 70) % this.coinFrames.length;
        c.sprite.texture = this.coinFrames[frame];
      }
      if (t >= 1) {
        this.spawnSparkBurst(c.endX, c.endY, 5, 0xffe680);
        c.onArrive?.();
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
      for (const cand of this.hdCandelabras) {
        cand.update(this.idleBlinkMs);
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
    if (this.phase === 'waitingTurn') {
      if (this.hdDealer) {
        const bellActive = round && !round.roundOver && round.currentTurn === 3 && this.humanWaitMs >= 10500;
        const bellCycleIdx = bellActive ? Math.floor((this.humanWaitMs - 10500) / 12000) : -1;
        const bellCycleMs = bellActive ? (this.humanWaitMs - 10500) % 12000 : 0;
        const glanceActive = round && !round.roundOver && round.currentTurn === 3 && this.humanWaitMs >= 6500 && this.humanWaitMs < 8500;
        if (bellActive && bellCycleMs < 1480) {
          this.hdDealer.setTableExpression('bell', bellCycleMs);
          if (bellCycleIdx !== this.idleBellCycleTriggered) {
            this.idleBellCycleTriggered = bellCycleIdx;
            this.ctx?.audio.sfx.dealerBellPing();
          }
        } else if (glanceActive) {
          const glance = getHdDealerGlanceMode(this.humanWaitMs - 6500);
          this.hdDealer.setTableExpression(glance === 'idle' && blinking ? 'blink' : glance, this.idleBlinkMs);
        } else {
          this.hdDealer.setTableExpression(blinking ? 'blink' : 'idle', this.idleBlinkMs);
        }
      } else if (this.dealerSpr && round && !round.roundOver) {
        this.updateEgaWaitingIdle(round);
      }
    } else if (this.phase === 'anteIntro' && this.dealerSpr) {
      this.dealerSpr.texture = blinking ? this.dealerBlinkTex : this.dealerIdleTex;
    }

    if (this.phase === 'waitingTurn' && round && !round.roundOver && round.currentTurn === 3) {
      this.humanWaitMs += dtMs;
    } else {
      this.humanWaitMs = 0;
      this.idleBellCycleTriggered = -1;
    }
    this.rivalPlayAnimMs[1] = Math.max(0, this.rivalPlayAnimMs[1] - dtMs);
    this.rivalPlayAnimMs[2] = Math.max(0, this.rivalPlayAnimMs[2] - dtMs);

    if (this.hdLeftRival && this.hdRightRival) {
      const lookTarget =
        this.phase === 'movingCard' && this.flyingCard
          ? this.flyingCard.sprite.visible
            ? { x: this.flyingCard.sprite.x + 19, y: this.flyingCard.sprite.y + 18 }
            : { x: this.flyingCard.startX + 7, y: this.flyingCard.startY + 8 }
          : round && !round.roundOver
            ? round.currentTurn === 1
              ? { x: 75, y: 140 }
              : round.currentTurn === 2
                ? { x: 550, y: 140 }
                : { x: 320, y: 245 }
            : null;

      const anteState = this.phase === 'anteIntro' ? getHdAnteIntroState(this.phaseTimerMs) : null;
      const resolveRivalMode = (seat: 1 | 2): RivalAnimMode => {
        if (this.phase === 'anteIntro' && anteState) {
          return seat === 1 ? anteState.leftMode : anteState.rightMode;
        }
        if (this.phase === 'roundEnd') {
          if (this.roundWinner === seat) {
            return this.phaseTimerMs >= 1320 && this.phaseTimerMs < 1820 ? 'purseReceive' : 'winRound';
          }
          return 'loseRound';
        }
        if (this.rivalPlayAnimMs[seat] > 0 || (this.phase === 'movingCard' && this.activeFlightSeat === seat)) {
          return 'play';
        }
        if (this.phase === 'passing' && this.passingSeat === seat) {
          return this.passingBroke
            ? getHdBotBrokeMode(this.phaseTimerMs, HD_BOT_BROKE_SHAKE_DURATION_MS)
            : getHdBotPurseTossMode(this.phaseTimerMs - 100);
        }
        if (this.phase === 'waitingTurn' && round && !round.roundOver) {
          if (round.currentTurn === seat) return 'think';
          if (round.currentTurn === 3 && this.humanWaitMs >= 3500) {
            const waitCycleIdx = Math.floor((this.humanWaitMs - 3500) / 4200);
            const waitCycleMs = (this.humanWaitMs - 3500) % 4200;
            const actor: 1 | 2 = waitCycleIdx % 2 === 0 ? 1 : 2;
            if (actor !== seat) return 'idle';
            if (Math.floor(waitCycleIdx / 2) % 2 === 1 && waitCycleMs < 2100) {
              return 'impatient';
            }
            if (waitCycleMs < 1360) {
              return 'yawn';
            }
          }
        }
        return 'idle';
      };

      this.hdLeftRival.setState(resolveRivalMode(1), this.idleBlinkMs, lookTarget, dtMs);
      this.hdRightRival.setState(resolveRivalMode(2), this.idleBlinkMs, lookTarget, dtMs);
    }

    this.phaseTimerMs += dtMs;

    if (this.phase === 'anteIntro') {
      if (!isHd && this.egaBank) {
        const rightStart = 360 + EGA_BOT_PURSE_TOSS_TOTAL_MS + 40;
        const humanStart = rightStart + EGA_BOT_PURSE_TOSS_TOTAL_MS + 40;
        const closeStart = humanStart + 700;
        const endMs = closeStart + 380;
        this.updateEgaHatTimeline(this.phaseTimerMs, 360, closeStart, endMs - 60);
        this.updateEgaTossRival(1, this.phaseTimerMs - 360, EGA_BOT_PURSE_TOSS_TOTAL_MS);
        this.updateEgaTossRival(2, this.phaseTimerMs - rightStart, EGA_BOT_PURSE_TOSS_TOTAL_MS);
        if (this.phaseTimerMs >= endMs) {
          this.egaAntePaid = { 1: true, 2: true, 3: true };
          this.renderCashAndBankHud();
          this.clearEgaActionOverlays();
          this.startEgaDealingCards();
        }
      } else {
        const anteState = getHdAnteIntroState(this.phaseTimerMs);
        this.hdDealer?.setTableExpression(anteState.dealerHatOpen ? 'hatCollect' : blinking ? 'blink' : 'idle', this.phaseTimerMs);
        if (this.phaseTimerMs >= anteState.endMs) {
          this.egaAntePaid = { 1: true, 2: true, 3: true };
          this.renderCashAndBankHud();
          this.hdDealer?.setTableExpression('idle', this.idleBlinkMs);
          this.startHdDealingCards();
        }
      }
      return;
    }

    if (this.phase === 'dealingCards') {
      if (!isHd && this.egaBank) {
        this.updateEgaDealingCards(this.phaseTimerMs);
      } else {
        this.updateHdDealingCards(this.phaseTimerMs);
      }
      return;
    }

    if (this.phase === 'movingCard' && this.flyingCard) {
      this.flyingCard.elapsed += dtMs;
      const t = Math.min(1, this.flyingCard.elapsed / this.flyingCard.durationMs);
      if (!isHd && this.flyingCard.egaFrames) {
        let flyT = t;
        if (this.egaBank && (this.activeFlightSeat === 1 || this.activeFlightSeat === 2)) {
          const seat = this.activeFlightSeat;
          const pose = getEgaBotCardThrowPose(
            this.egaBank,
            seat,
            this.flyingCard.botSlotIdx ?? 0,
            this.flyingCard.botCols ?? 6,
            t,
          );
          this.setEgaRivalOverlay(seat, pose.overlayTex, 'vr', pose.overlayX);
          if (pose.cardPickedFromStack) {
            this.consumePendingRivalSlot();
          }
          if (pose.cardReleased && !this.flyingCard.soundPlayed) {
            this.flyingCard.soundPlayed = true;
            this.ctx?.audio.sfx.cardSlide();
          }
          this.flyingCard.sprite.visible = pose.cardReleased;
          flyT = pose.flyProgress;
        }
        const pos = computeEgaParabolicCardPos(
          this.flyingCard.startX,
          this.flyingCard.startY,
          this.flyingCard.endX,
          this.flyingCard.endY,
          flyT,
        );
        this.flyingCard.sprite.position.set(pos.x, pos.y);
        const fIdx = Math.floor(this.flyingCard.elapsed / 70) % this.flyingCard.egaFrames.length;
        this.flyingCard.sprite.texture = this.flyingCard.egaFrames[fIdx];
      } else {
        let flyT = t;
        if (this.flyingCard.hdBotSync) {
          const throwState = getHdBotCardThrowState(t);
          if (throwState.cardPickedFromStack) {
            this.consumePendingRivalSlot();
          }
          if (throwState.cardReleased && !this.flyingCard.soundPlayed) {
            this.flyingCard.soundPlayed = true;
            this.ctx?.audio.sfx.cardSlide();
          }
          this.flyingCard.sprite.visible = throwState.cardReleased;
          if (this.flyingCard.shadow) this.flyingCard.shadow.visible = throwState.cardReleased;
          flyT = throwState.flyProgress;
        }
        const ease = isHd ? flyT * flyT * (3 - 2 * flyT) : flyT;
        const arcLift = isHd ? Math.sin(flyT * Math.PI) * 18 : 0;
        const curX = this.flyingCard.startX + (this.flyingCard.endX - this.flyingCard.startX) * ease;
        const curY = this.flyingCard.startY + (this.flyingCard.endY - this.flyingCard.startY) * ease;

        this.flyingCard.sprite.position.set(curX, curY - arcLift);
        if (isHd) {
          const s = 1 + Math.sin(flyT * Math.PI) * 0.16;
          this.flyingCard.sprite.scale.set(s);
          if (this.flyingCard.shadow) {
            this.flyingCard.shadow.position.set(curX + arcLift * 0.25, curY + arcLift * 0.2);
            this.flyingCard.shadow.alpha = 0.25 + (1 - flyT) * 0.3;
          }
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
        const fIdx = Math.floor(this.phaseTimerMs / 115) % this.dealerWagFrames.length;
        this.dealerSpr.texture = this.dealerWagFrames[fIdx];
      }
      if (this.phaseTimerMs >= (isHd ? 900 : 720)) {
        if (this.dealerSpr) this.dealerSpr.texture = this.dealerIdleTex;
        this.phase = 'waitingTurn';
        this.phaseTimerMs = 0;
      }
      return;
    }

    if (this.phase === 'passing') {
      if (this.hdDealer) {
        const isBotBroke = this.passingBroke && (this.passingSeat === 1 || this.passingSeat === 2);
        const isBotNormal = !this.passingBroke && (this.passingSeat === 1 || this.passingSeat === 2);
        const endMs = isBotBroke
          ? HD_BOT_BROKE_SHAKE_DURATION_MS + 20
          : isBotNormal
            ? 100 + HD_BOT_PURSE_TOSS_TOTAL_MS + 180
            : 1020;
        const hatOpen = !this.passingBroke && this.phaseTimerMs >= 80 && this.phaseTimerMs < endMs - 140;
        this.hdDealer.setTableExpression(hatOpen ? 'hatCollect' : blinking ? 'blink' : 'idle', this.phaseTimerMs);
        if (this.phaseTimerMs >= endMs) {
          this.passingSeat = null;
          this.passingBroke = false;
          this.enterNextTurn();
        }
      } else if (this.egaBank) {
        if (this.passingBroke && (this.passingSeat === 1 || this.passingSeat === 2)) {
          const emptyPurseTex = getEgaBotBrokeShakeFrame(
            this.egaBank,
            this.phaseTimerMs,
            EGA_BOT_BROKE_SHAKE_DURATION_MS,
          );
          this.setEgaRivalOverlay(this.passingSeat, emptyPurseTex, 'purse');
          if (this.phaseTimerMs >= EGA_BOT_BROKE_SHAKE_DURATION_MS + 20) {
            this.passingSeat = null;
            this.passingBroke = false;
            this.clearEgaActionOverlays();
            this.enterNextTurn();
          }
        } else if (this.passingSeat === 1 || this.passingSeat === 2) {
          const botEndMs = 260 + EGA_BOT_PURSE_TOSS_TOTAL_MS;
          this.updateEgaHatTimeline(this.phaseTimerMs, 320, botEndMs, botEndMs + 300);
          this.updateEgaTossRival(this.passingSeat, this.phaseTimerMs - 260, EGA_BOT_PURSE_TOSS_TOTAL_MS);
          if (this.phaseTimerMs >= botEndMs + 320) {
            this.passingSeat = null;
            this.passingBroke = false;
            this.clearEgaActionOverlays();
            this.enterNextTurn();
          }
        } else {
          this.updateEgaHatTimeline(this.phaseTimerMs, 300, 960, 1280);
          if (this.phaseTimerMs >= 1300) {
            this.passingSeat = null;
            this.passingBroke = false;
            this.clearEgaActionOverlays();
            this.enterNextTurn();
          }
        }
      }
      return;
    }

    if (this.phase === 'waitingTurn') {
      if (!round || round.roundOver) return;

      if (round.currentTurn === 1 || round.currentTurn === 2) {
        if (!isHd && this.egaBank) {
          const botSpr = round.currentTurn === 1 ? this.leftBotSpr : this.rightBotSpr;
          if (botSpr) {
            botSpr.texture =
              this.egaBotThinkMode === 'tap'
                ? getEgaBotTapFrame(this.egaBank, this.phaseTimerMs)
                : this.botFrames[Math.floor(this.phaseTimerMs / 180) % 2];
          }
        }

        const waitLimitMs = isHd ? 440 : this.egaBotThinkDurationMs;
        if (this.phaseTimerMs >= waitLimitMs) {
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
        const autoPassDelayMs = this.ctx?.advisorAutoPlayMode ? 320 : 650;
        if (this.statusBanner && this.phaseTimerMs >= autoPassDelayMs) {
          this.statusBanner = '';
          this.renderStatusBanner();
          this.triggerSeatPass(3);
        } else if (
          !this.statusBanner &&
          this.ctx?.advisorAutoPlayMode &&
          this.phaseTimerMs >= 420
        ) {
          this.executeAdvisorAutoMove();
        }
      }
      return;
    }

    if (this.phase === 'roundEnd') {
      if (this.hdDealer) {
        if (this.roundWonPot > 0 && this.phaseTimerMs < 320) {
          this.hdDealer.setTableExpression('hatCollect', this.phaseTimerMs);
        } else if (this.roundWonPot > 0 && this.phaseTimerMs < 1380) {
          const winner = this.roundWinner ?? 3;
          const pourMode = winner === 1 ? 'pourLeft' : winner === 2 ? 'pourRight' : 'pourDown';
          this.hdDealer.setTableExpression(pourMode, this.phaseTimerMs);
        } else {
          this.hdDealer.setTableExpression(blinking ? 'blink' : 'idle', this.idleBlinkMs);
        }
      } else if (this.egaBank) {
        this.updateEgaRoundEndPose(this.phaseTimerMs);
      }
      if (this.phaseTimerMs >= 1960) {
        if (!isHd) this.clearEgaActionOverlays();
        else if (this.dealerSpr) this.dealerSpr.texture = this.dealerIdleTex;
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
