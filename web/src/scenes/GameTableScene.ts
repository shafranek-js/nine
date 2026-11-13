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
  type Card,
  type MatchState,
  type SeatIndex,
} from '../core/types';
import { sliceMaskedTexture, sliceTexture } from '../engine/BitmapFont';
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

export class GameTableScene implements Scene {
  private ctx: GameContext | null = null;
  private rng: Rng = createDefaultRng();
  private match!: MatchState;

  private root = new Container();
  private tableCardsLayer = new Container();
  private handLayer = new Container();
  private fxLayer = new Container();
  private hudLayer = new Container();
  private overlayLayer = new Container();

  private leftCashLayer = new Container();
  private rightCashLayer = new Container();
  private humanCashLayer = new Container();
  private thermoSpr!: Sprite;

  private dealerSpr!: Sprite;
  private leftBotSpr!: Sprite;
  private rightBotSpr!: Sprite;
  private flameSprites: Sprite[] = [];

  private dealerIdleTex!: Texture;
  private dealerBlinkTex!: Texture;
  private dealerBellFrames: Texture[] = [];
  private dealerWagFrames: Texture[] = [];
  private botFrames: Texture[] = [];
  private flameFrames: Texture[] = [];
  private thermoTextures: Texture[] = [];
  private coinFrames: Texture[] = [];

  private phase: TablePhase = 'anteIntro';
  private phaseTimerMs = 0;
  private idleBlinkMs = 0;
  private pendingMoveCard: Card | null = null;
  private flyingCard: FlyingCard | null = null;
  private flyingCoins: FlyingCoin[] = [];
  private currentHandLayouts: HandCardLayout[] = [];
  private roundWinner: SeatIndex | null = null;
  private roundWonPot = 0;
  private statusBanner = '';

  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;
  private unbindMove: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.rng = createDefaultRng();
    this.flyingCard = null;
    this.flyingCoins = [];

    const gr = ctx.assets.sheets.GR_NINE;

    this.root.addChild(new Sprite(ctx.assets.backgrounds.GF_NINE));

    // Character animation slices from GR_NINE
    this.dealerIdleTex = sliceTexture(gr, 477, 237, 60, 39);
    this.dealerBlinkTex = sliceTexture(gr, 477, 277, 60, 39);
    this.dealerBellFrames = [0, 1, 2, 3].map((i) => sliceTexture(gr, 200, 1 + i * 40, 60, 39));
    this.dealerWagFrames = [0, 1, 2].map((i) => sliceTexture(gr, 477, 117 + i * 40, 60, 39));
    this.botFrames = [0, 1, 2, 3, 4, 5].map((i) => sliceTexture(gr, 118, 1 + i * 43, 73, 42));

    this.coinFrames = [204, 230, 256].map((y) => sliceMaskedTexture(gr, 84, y, 24, 23));
    this.flameFrames = [0, 1, 2].map((i) => sliceTexture(gr, 39 + i * 8, 176, 7, 10));

    // Six candelabra flames (exact matches verified against GF_NINE pixels)
    const candlePositions: readonly { x: number; y: number }[] = [
      { x: 150, y: 15 },
      { x: 165, y: 9 },
      { x: 180, y: 15 },
      { x: 452, y: 15 },
      { x: 467, y: 9 },
      { x: 482, y: 15 },
    ];
    const flameErase = new Graphics();
    for (const pos of candlePositions) {
      flameErase.rect(pos.x - 1, pos.y - 4, 9, 14).fill(0x000000);
    }
    this.root.addChild(flameErase);
    this.flameSprites = candlePositions.map((pos, idx) => {
      const spr = new Sprite(this.flameFrames[idx % this.flameFrames.length]);
      spr.position.set(pos.x, pos.y);
      this.root.addChild(spr);
      return spr;
    });

    // Thermometer 33 segments (DrawScoreThermometer: y=332, 338, 344; x=119 + col*33)
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
    this.root.addChild(this.dealerSpr);

    this.leftBotSpr = new Sprite(this.botFrames[0]);
    this.leftBotSpr.position.set(19, 101);
    this.root.addChild(this.leftBotSpr);

    this.rightBotSpr = new Sprite(this.botFrames[0]);
    this.rightBotSpr.position.set(531, 101);
    this.root.addChild(this.rightBotSpr);

    this.thermoSpr = new Sprite(this.thermoTextures[0]);
    this.thermoSpr.position.set(455, 51);
    this.root.addChild(this.thermoSpr);

    // Black erase masks behind cash counters so GF_NINE '200' clears cleanly
    const cashBgMask = new Graphics();
    cashBgMask.rect(28, 187, 45, 9).fill(0x000000);
    cashBgMask.rect(540, 187, 45, 9).fill(0x000000);
    cashBgMask.rect(287, 244, 45, 9).fill(0x000000);
    this.hudLayer.addChild(cashBgMask);

    this.hudLayer.addChild(this.leftCashLayer);
    this.hudLayer.addChild(this.rightCashLayer);
    this.hudLayer.addChild(this.humanCashLayer);

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

    ctx.audio.music.play('table');

    this.beginRoundPresentation();

    this.unbindKey = ctx.input.onKeyDown(this.handleKeyDown);
    this.unbindPtr = ctx.input.onPointerDown(this.handlePointerDown);
    this.unbindMove = ctx.input.onPointerMove(this.handlePointerMove);
  }

  private beginRoundPresentation(): void {
    this.tableCardsLayer.removeChildren();
    this.overlayLayer.removeChildren();
    this.renderCashAndBankHud();
    this.renderHumanHand();

    // $20 ante coins fly into BANK
    this.spawnCoinFlight(56, 170, 165, 42, 420);
    this.spawnCoinFlight(568, 170, 175, 42, 420);
    this.spawnCoinFlight(316, 232, 170, 42, 420);
    this.ctx?.audio.sfx.coinChime();

    this.phase = 'anteIntro';
    this.phaseTimerMs = 0;
  }

  private renderCashAndBankHud(): void {
    if (!this.ctx) return;
    this.ctx.hudFont.renderFixedNumber(this.leftCashLayer, this.match.cash[1], 73 - 45, 188, 5, 9);
    this.ctx.hudFont.renderFixedNumber(this.rightCashLayer, this.match.cash[2], 585 - 45, 188, 5, 9);
    this.ctx.hudFont.renderFixedNumber(this.humanCashLayer, this.match.cash[3], 332 - 45, 245, 5, 9);

    const bank = this.match.round?.bank ?? 0;
    const segIdx = Math.max(0, Math.min(32, Math.floor(bank / 10)));
    this.thermoSpr.texture = this.thermoTextures[segIdx];
  }

  private renderHumanHand(): void {
    if (!this.ctx) return;
    this.handLayer.removeChildren();
    const hand = this.match.round?.hands[3] ?? [];
    this.currentHandLayouts = computeHandLayout(hand);

    for (const layout of this.currentHandLayouts) {
      const tex = this.ctx.assets.cards.get(cardKey(layout.card));
      if (!tex) continue;
      const spr = new Sprite(tex);
      spr.position.set(layout.x, layout.y);
      this.handLayer.addChild(spr);
    }
  }

  private placeMiniCardOnTable(card: Card): void {
    if (!this.ctx) return;
    const tex = this.ctx.assets.miniCards.get(cardKey(card));
    if (!tex) return;
    const spr = new Sprite(tex);
    spr.position.set(145 + (card.rank - 6) * 39, 71 + (card.suit - 1) * 38);
    this.tableCardsLayer.addChild(spr);
  }

  private spawnCoinFlight(startX: number, startY: number, endX: number, endY: number, durationMs = 360): void {
    if (!this.coinFrames.length) return;
    const spr = new Sprite(this.coinFrames[0]);
    spr.anchor.set(0.5);
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
    const miniTex = this.ctx.assets.miniCards.get(cardKey(card));
    const endX = 145 + (card.rank - 6) * 39;
    const endY = 71 + (card.suit - 1) * 38;
    const startX = originX ?? (seat === 1 ? 65 : seat === 2 ? 545 : 300);
    const startY = originY ?? (seat === 3 ? HAND_TOP_Y : 120);

    this.ctx.audio.sfx.cardSlide();
    this.pendingMoveCard = card;

    // Immediately remove card from human hand before flight so visual matches move
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
    } else if (seat === 1) {
      this.leftBotSpr.texture = this.botFrames[2];
    } else {
      this.rightBotSpr.texture = this.botFrames[2];
    }

    if (!miniTex) {
      this.finishCardFlight();
      return;
    }

    const spr = new Sprite(miniTex);
    spr.position.set(startX, startY);
    this.fxLayer.addChild(spr);

    this.phase = 'movingCard';
    this.phaseTimerMs = 0;
    this.flyingCard = {
      sprite: spr,
      startX,
      startY,
      endX,
      endY,
      elapsed: 0,
      durationMs: 165,
      onLand: () => this.finishCardFlight(),
    };
  }

  private finishCardFlight(): void {
    if (this.flyingCard) {
      this.fxLayer.removeChild(this.flyingCard.sprite);
      this.flyingCard = null;
    }
    if (this.pendingMoveCard) {
      this.placeMiniCardOnTable(this.pendingMoveCard);
      this.pendingMoveCard = null;
    }
    this.leftBotSpr.texture = this.botFrames[0];
    this.rightBotSpr.texture = this.botFrames[0];
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

    if (seat === 1) {
      this.spawnCoinFlight(56, 170, 165, 42, 380);
    } else if (seat === 2) {
      this.spawnCoinFlight(568, 170, 175, 42, 380);
    } else {
      this.spawnCoinFlight(316, 232, 170, 42, 380);
    }

    this.phase = 'passing';
    this.phaseTimerMs = 0;
  }

  private enterNextTurn(): void {
    this.phase = 'waitingTurn';
    this.phaseTimerMs = 0;

    const round = this.match.round;
    if (!round || round.roundOver) return;

    // On human turn with 0 legal moves, ring bell & process automatic $20 pass cleanly
    if (round.currentTurn === 3) {
      const legal = getLegalMoves(round.hands[3], round.tableBounds, round.isFirstTurnOfRound);
      if (legal.length === 0) {
        this.statusBanner = `NO LEGAL MOVES - PASS -$${PASS_PENALTY}`;
      } else {
        this.statusBanner = '';
      }
    } else {
      this.statusBanner = '';
    }
  }

  private enterRoundEnd(): void {
    this.ctx?.audio.sfx.victoryBeep();
    this.phase = 'roundEnd';
    this.phaseTimerMs = 0;

    const winner = this.roundWinner ?? 3;
    const dstX = winner === 1 ? 56 : winner === 2 ? 568 : 316;
    const dstY = winner === 3 ? 232 : 170;
    if (this.roundWonPot > 0) {
      this.spawnCoinFlight(168, 42, dstX, dstY, 520);
      this.spawnCoinFlight(470, 48, dstX, dstY, 560);
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
    this.overlayLayer.addChild(
      this.ctx.menuFont.createText('PRESS KEY/CLICK', 245, 200, { stepX: 10 }),
    );
  }

  private findCardLayoutAt(x: number, y: number): HandCardLayout | null {
    if (y < HAND_TOP_Y || y >= SCREEN_HEIGHT) return null;
    for (let i = 0; i < this.currentHandLayouts.length; i++) {
      const l = this.currentHandLayouts[i];
      if (x >= l.x && x < l.x + l.hitWidth && y >= l.y && y < l.y + l.height) {
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
      canvas.style.cursor = hit ? 'pointer' : 'default';
    } else {
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
      // Clicking table or cards with 0 legal moves triggers pass immediately
      this.triggerSeatPass(3);
      return;
    }

    const hit = this.findCardLayoutAt(pt.x, pt.y);
    if (!hit) return;

    if (isLegalMove(hit.card, round.tableBounds, round.isFirstTurnOfRound)) {
      this.startCardFlight(3, hit.card, hit.x + 25, hit.y);
    } else {
      this.ctx?.audio.sfx.passAlert();
      this.phase = 'illegalShake';
      this.phaseTimerMs = 0;
    }
  };

  update(dtMs: number): void {
    // Update spinning coin flights
    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const c = this.flyingCoins[i];
      c.elapsed += dtMs;
      const t = Math.min(1, c.elapsed / c.durationMs);
      c.sprite.position.set(
        c.startX + (c.endX - c.startX) * t,
        c.startY + (c.endY - c.startY) * t - Math.sin(t * Math.PI) * 18,
      );
      const frame = Math.floor(c.elapsed / 70) % this.coinFrames.length;
      c.sprite.texture = this.coinFrames[frame];
      if (t >= 1) {
        this.fxLayer.removeChild(c.sprite);
        this.flyingCoins.splice(i, 1);
      }
    }

    // Idle blinking of red dealer and candelabra candle flicker
    this.idleBlinkMs += dtMs;
    const flameStep = Math.floor(this.idleBlinkMs / 130);
    const flameSeq = [0, 1, 2, 1, 0, 2];
    for (let i = 0; i < this.flameSprites.length; i++) {
      this.flameSprites[i].texture = this.flameFrames[flameSeq[(flameStep + i * 2) % flameSeq.length]];
    }
    if (this.phase === 'waitingTurn' || this.phase === 'anteIntro') {
      const cycle = this.idleBlinkMs % 3200;
      this.dealerSpr.texture = cycle > 2950 ? this.dealerBlinkTex : this.dealerIdleTex;
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
      this.flyingCard.sprite.position.set(
        this.flyingCard.startX + (this.flyingCard.endX - this.flyingCard.startX) * t,
        this.flyingCard.startY + (this.flyingCard.endY - this.flyingCard.startY) * t,
      );
      if (t >= 1) {
        this.flyingCard.onLand();
      }
      return;
    }

    if (this.phase === 'illegalShake') {
      const fIdx = Math.floor(this.phaseTimerMs / 95) % this.dealerWagFrames.length;
      this.dealerSpr.texture = this.dealerWagFrames[fIdx];
      if (this.phaseTimerMs >= 450) {
        this.dealerSpr.texture = this.dealerIdleTex;
        this.phase = 'waitingTurn';
        this.phaseTimerMs = 0;
      }
      return;
    }

    if (this.phase === 'passing') {
      const bIdx = Math.floor(this.phaseTimerMs / 100) % this.dealerBellFrames.length;
      this.dealerSpr.texture = this.dealerBellFrames[bIdx];
      if (this.phaseTimerMs >= 420) {
        this.dealerSpr.texture = this.dealerIdleTex;
        this.enterNextTurn();
      }
      return;
    }

    if (this.phase === 'waitingTurn') {
      const round = this.match.round;
      if (!round || round.roundOver) return;

      if (round.currentTurn === 1 || round.currentTurn === 2) {
        // Subtle bot thinking animation
        const botSpr = round.currentTurn === 1 ? this.leftBotSpr : this.rightBotSpr;
        const thinkFrame = Math.floor(this.phaseTimerMs / 140) % 2;
        botSpr.texture = this.botFrames[thinkFrame];

        if (this.phaseTimerMs >= 440) {
          const botMove = selectBotMove(round, this.match.clubTable, this.rng);
          if (botMove) {
            this.startCardFlight(round.currentTurn, botMove);
          } else {
            botSpr.texture = this.botFrames[0];
            this.triggerSeatPass(round.currentTurn);
          }
        }
      } else {
        // Auto-pass after short pause if human has 0 legal moves (or instant on key/click)
        if (this.statusBanner && this.phaseTimerMs >= 650) {
          this.statusBanner = '';
          this.triggerSeatPass(3);
        }
      }
      return;
    }

    if (this.phase === 'roundEnd') {
      const bIdx = Math.floor(this.phaseTimerMs / 110) % this.dealerBellFrames.length;
      this.dealerSpr.texture = this.dealerBellFrames[bIdx];
      if (this.phaseTimerMs >= 1150) {
        this.dealerSpr.texture = this.dealerIdleTex;
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
