import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { lookupPlayer } from '../core/persistence';
import { SCREEN_HEIGHT, SCREEN_WIDTH, type ClubTableId } from '../core/types';
import { sliceTexture } from '../engine/BitmapFont';
import { getHdCardLibrary } from '../engine/hdCards';
import {
  createHdDealer,
  createHdTextSprite,
  getWarmGlowTexture,
  type HdDealerController,
} from '../engine/hdCharacters';
import type { GameContext, Scene } from './SceneManager';

type LoginPhase = 'idle' | 'enteringName' | 'enteringPassword';

interface AnimStep {
  frames: Texture[];
  elapsed: number;
  frameDurationMs: number;
  target: Sprite;
  onComplete: () => void;
}

const BUTTON_HITBOXES: readonly { id: 1 | 2 | 3 | 4 | 5; x: number; w: number; key: string; label: string }[] = [
  { id: 1, x: 0, w: 120, key: 'F1', label: 'PLAY' },
  { id: 2, x: 140, w: 118, key: 'F2', label: 'AUDIO' },
  { id: 3, x: 278, w: 112, key: 'F3', label: 'TABLE' },
  { id: 4, x: 405, w: 120, key: 'F4', label: 'SIGN IN' },
  { id: 5, x: 542, w: 98, key: 'F5', label: 'EXIT' },
];

export class ClubMenuScene implements Scene {
  private ctx: GameContext | null = null;
  private root = new Container();

  // EGA visuals
  private cardNameSpr!: Sprite;
  private cardScoreSpr!: Sprite;
  private tableTextLayer = new Container();
  private f2Spr!: Sprite;
  private f3Spr!: Sprite;
  private f4Spr!: Sprite;
  private f5Spr!: Sprite;
  private dealBackdropGfx!: Graphics;
  private f1HeadSpr!: Sprite;
  private f1FanSpr!: Sprite;
  private bannerSpr!: Sprite;
  private inputLayer = new Container();
  private cursorGfx = new Graphics();

  private f2Frames: Texture[] = [];
  private f3Frames: Texture[] = [];
  private f4IdleTex!: Texture;
  private f4ActiveTex!: Texture;
  private f5Frames: Texture[] = [];
  private cardNameTextures!: Record<ClubTableId, Texture>;
  private cardScoreTextures!: Record<ClubTableId, Texture>;
  private bannerNewPlayerTex!: Texture;
  private bannerPasswordTex!: Texture;
  private f1HeadTex!: Texture;
  private f1Col1Frames: Texture[] = [];
  private f1Col2Frames: Texture[] = [];

  // HD visuals
  private hdTableLayer = new Container();
  private hdInputLayer = new Container();
  private hdButtonsLayer = new Container();
  private hdDealLayer = new Container();
  private hdDealer: HdDealerController | null = null;
  private hdDealCards: Sprite[] = [];
  private hoveredButtonId: number | null = null;

  private loginPhase: LoginPhase = 'idle';
  private pendingName = '';
  private pendingPassword = '';
  private existingPasswordToMatch: string | null = null;
  private existingScoreForMatch = 0;
  private autoLaunchAfterLogin = false;

  private inputBlocked = false;
  private cursorBlinkMs = 0;
  private hdElapsedMs = 0;
  private activeAnim: AnimStep | null = null;
  private dealStage: { step: 'none' | 'head' | 'col1' | 'pause' | 'col2' | 'done'; timer: number; frameIdx: number } = {
    step: 'none',
    timer: 0,
    frameIdx: 0,
  };

  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;
  private unbindMove: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.inputBlocked = false;
    this.loginPhase = 'idle';
    this.activeAnim = null;
    this.hoveredButtonId = null;
    this.hdElapsedMs = 0;
    this.dealStage = { step: 'none', timer: 0, frameIdx: 0 };

    parent.addChild(this.root);
    this.buildVisuals();

    ctx.audio.music.play('menu');

    this.unbindKey = ctx.input.onKeyDown(this.handleKeyDown);
    this.unbindPtr = ctx.input.onPointerDown(this.handlePointerDown);
    this.unbindMove = ctx.input.onPointerMove(this.handlePointerMove);
  }

  onGraphicsModeChanged(): void {
    this.buildVisuals();
  }

  private buildVisuals(): void {
    if (!this.ctx) return;
    this.root.removeChildren();
    this.tableTextLayer.removeChildren();
    this.inputLayer.removeChildren();
    this.cursorGfx.clear();
    this.hdTableLayer.removeChildren();
    this.hdInputLayer.removeChildren();
    this.hdButtonsLayer.removeChildren();
    this.hdDealLayer.removeChildren();
    this.hdDealer = null;
    this.hdDealCards = [];

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.buildEgaVisuals(this.ctx);
    } else {
      this.buildHdVisuals(this.ctx);
    }
    this.renderLeaderboard();
    this.renderPromptInput();

    // Restore in-progress F1 shuffle backdrop if user toggled mode mid-transition
    if (this.dealStage.step !== 'none' && this.dealStage.step !== 'done') {
      if (this.ctx.getGraphicsMode() === 'ega') {
        this.dealBackdropGfx.visible = true;
        this.f1HeadSpr.visible = true;
        this.f1FanSpr.visible = this.dealStage.step !== 'head';
      } else {
        this.hdDealLayer.visible = true;
      }
    }
  }

  private buildEgaVisuals(ctx: GameContext): void {
    const tr = ctx.assets.sheets.TR_NINE;

    this.root.addChild(new Sprite(ctx.assets.backgrounds.TF_NINE));

    this.cardNameTextures = {
      1: sliceTexture(tr, 346, 1, 87, 103),
      2: sliceTexture(tr, 493, 1, 87, 103),
      3: sliceTexture(tr, 493, 105, 87, 103),
    };
    this.cardScoreTextures = {
      1: sliceTexture(tr, 434, 1, 58, 103),
      2: sliceTexture(tr, 581, 1, 58, 103),
      3: sliceTexture(tr, 581, 105, 58, 103),
    };

    this.cardNameSpr = new Sprite(this.cardNameTextures[ctx.config.clubTable]);
    this.cardNameSpr.position.set(192, 114);
    this.root.addChild(this.cardNameSpr);

    this.cardScoreSpr = new Sprite(this.cardScoreTextures[ctx.config.clubTable]);
    this.cardScoreSpr.position.set(357, 114);
    this.root.addChild(this.cardScoreSpr);

    this.root.addChild(this.tableTextLayer);

    this.f2Frames = [0, 1, 2].map((i) => sliceTexture(tr, 578, 209 + i * 47, 61, 46));
    this.f3Frames = [0, 1, 2].map((i) => sliceTexture(tr, 469, 230 + i * 40, 55, 39));
    this.f4IdleTex = sliceTexture(tr, 333, 280, 64, 34);
    this.f4ActiveTex = sliceTexture(tr, 333, 315, 64, 34);
    this.f5Frames = [0, 1, 2].map((i) => sliceTexture(tr, 525, 230 + i * 40, 55, 39));

    this.f2Spr = new Sprite(this.f2Frames[ctx.config.soundMusicEnabled ? 0 : 2]);
    this.f2Spr.position.set(145, 295);
    this.root.addChild(this.f2Spr);

    this.f3Spr = new Sprite(this.f3Frames[ctx.config.clubTable - 1]);
    this.f3Spr.position.set(283, 302);
    this.root.addChild(this.f3Spr);

    this.f4Spr = new Sprite(this.f4IdleTex);
    this.f4Spr.position.set(410, 307);
    this.root.addChild(this.f4Spr);

    this.f5Spr = new Sprite(this.f5Frames[0]);
    this.f5Spr.position.set(547, 302);
    this.root.addChild(this.f5Spr);

    this.bannerNewPlayerTex = sliceTexture(tr, 400, 199, 88, 9);
    this.bannerPasswordTex = sliceTexture(tr, 400, 209, 88, 9);

    this.bannerSpr = new Sprite(this.bannerNewPlayerTex);
    this.bannerSpr.position.set(192, 228);
    this.root.addChild(this.bannerSpr);

    this.root.addChild(this.inputLayer);
    this.root.addChild(this.cursorGfx);

    this.dealBackdropGfx = new Graphics().rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x000000);
    this.dealBackdropGfx.visible = false;
    this.root.addChild(this.dealBackdropGfx);

    this.f1HeadTex = sliceTexture(tr, 150, 290, 76, 41);
    this.f1Col1Frames = Array.from({ length: 11 }, (_, r) => sliceTexture(tr, 150, 1 + r * 26, 72, 25));
    this.f1Col2Frames = Array.from({ length: 11 }, (_, r) => sliceTexture(tr, 223, 1 + r * 26, 72, 25));

    this.f1HeadSpr = new Sprite(this.f1HeadTex);
    this.f1HeadSpr.position.set(279, 154);
    this.f1HeadSpr.visible = false;
    this.root.addChild(this.f1HeadSpr);

    this.f1FanSpr = new Sprite(this.f1Col1Frames[0]);
    this.f1FanSpr.position.set(283, 171);
    this.f1FanSpr.visible = false;
    this.root.addChild(this.f1FanSpr);
  }

  private buildHdVisuals(ctx: GameContext): void {
    const bg = new Sprite(ctx.assets.hdBackgrounds.menu);
    bg.width = SCREEN_WIDTH;
    bg.height = SCREEN_HEIGHT;
    this.root.addChild(bg);

    // Subtle dark scrim under center cards for luxury contrast
    const scrim = new Graphics();
    scrim.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill({ color: 0x05070a, alpha: 0.16 });
    this.root.addChild(scrim);

    // Top fanned Art-Deco letter cards: N I N E   &   C L U B
    this.drawFannedBannerWord('NINE', 132, 54, -1);
    this.drawFannedBannerWord('CLUB', SCREEN_WIDTH - 132, 54, 1);

    // Twin luxury Ivory Leaderboard Scorecards aligned cleanly with the prompt area
    const cardsGfx = new Graphics();
    const drawScoreCardBase = (x: number, y: number, w: number, h: number) => {
      cardsGfx.roundRect(x + 2, y + 3, w, h, 8).fill({ color: 0x000000, alpha: 0.45 });
      cardsGfx.roundRect(x, y, w, h, 8).fill(0xfaf3e3).stroke({ color: 0x45351c, width: 1.3 });
      cardsGfx.roundRect(x + 4, y + 4, w - 8, h - 8, 5).stroke({ color: 0xc99c38, width: 0.85, alpha: 0.85 });
    };
    drawScoreCardBase(160, 118, 156, 150);
    drawScoreCardBase(324, 118, 156, 150);
    this.root.addChild(cardsGfx);

    this.root.addChild(this.hdTableLayer);
    this.root.addChild(this.hdInputLayer);
    this.root.addChild(this.cursorGfx);
    this.root.addChild(this.hdButtonsLayer);

    this.renderHdButtons();

    // HD F1 Shuffle transition overlay
    this.hdDealLayer.visible = false;
    const dealBg = new Graphics().rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x06070a);
    this.hdDealLayer.addChild(dealBg);

    const dealGlow = new Sprite(getWarmGlowTexture());
    dealGlow.anchor.set(0.5);
    dealGlow.position.set(SCREEN_WIDTH * 0.5, 175);
    dealGlow.scale.set(3.4, 2.5);
    dealGlow.alpha = 0.4;
    dealGlow.blendMode = 'add';
    this.hdDealLayer.addChild(dealGlow);

    const dealer = createHdDealer(1.3);
    dealer.container.position.set(SCREEN_WIDTH * 0.5 - 39, 134);
    this.hdDealLayer.addChild(dealer.container);
    this.hdDealer = dealer;

    const hdLib = getHdCardLibrary();
    for (let i = 0; i < 12; i++) {
      const cardSpr = new Sprite(hdLib.miniCardBack);
      cardSpr.anchor.set(0.5);
      cardSpr.scale.set(0.85);
      cardSpr.position.set(SCREEN_WIDTH * 0.5, 184);
      cardSpr.visible = false;
      this.hdDealLayer.addChild(cardSpr);
      this.hdDealCards.push(cardSpr);
    }

    const dealCaption = createHdTextSprite('SHUFFLING THE DECK...', 320, 22, {
      font: '600 10px Georgia, "Times New Roman", serif',
      fill: ['#fff1bd', '#d49a24'],
      align: 'center',
    });
    dealCaption.anchor.set(0.5);
    dealCaption.position.set(SCREEN_WIDTH * 0.5, 232);
    this.hdDealLayer.addChild(dealCaption);

    this.root.addChild(this.hdDealLayer);
  }

  private drawFannedBannerWord(word: string, centerX: number, centerY: number, tiltSign: -1 | 1): void {
    const g = new Container();
    g.position.set(centerX, centerY);
    const total = word.length;
    for (let i = 0; i < total; i++) {
      const offset = i - (total - 1) * 0.5;
      const cardContainer = new Container();
      cardContainer.position.set(offset * 34, Math.abs(offset) * 3.5);
      cardContainer.rotation = (offset * 0.08 + tiltSign * 0.04);

      const cardG = new Graphics();
      cardG.roundRect(-16, -23, 34, 48, 4).fill({ color: 0x000000, alpha: 0.4 });
      cardG.roundRect(-17, -24, 34, 48, 4).fill(0xfff9ea).stroke({ color: 0xd4a438, width: 1.2 });
      cardG.roundRect(-14, -21, 28, 42, 2.5).stroke({ color: 0x8f1a24, width: 0.7, alpha: 0.7 });
      cardContainer.addChild(cardG);

      const letter = createHdTextSprite(word[i], 30, 36, {
        font: 'bold 22px Georgia, "Times New Roman", serif',
        fill: ['#d91e2e', '#850d17'],
        align: 'center',
        shadowColor: 'rgba(0,0,0,0.18)',
        shadowBlur: 2,
      });
      letter.anchor.set(0.5);
      cardContainer.addChild(letter);

      g.addChild(cardContainer);
    }
    this.root.addChild(g);
  }

  private renderHdButtons(): void {
    if (!this.ctx || this.ctx.getGraphicsMode() !== 'hd') return;
    this.hdButtonsLayer.removeChildren();

    const { config } = this.ctx;
    const romanTable = ['I', 'II', 'III'][config.clubTable - 1] ?? 'I';

    for (const btn of BUTTON_HITBOXES) {
      const hovered = this.hoveredButtonId === btn.id;
      const active =
        (btn.id === 4 && this.loginPhase !== 'idle') ||
        (btn.id === 2 && !config.soundMusicEnabled);

      const bx = btn.x + 8;
      const bw = btn.w - 12;
      const by = 298;
      const bh = 42;

      const pill = new Graphics();
      pill
        .roundRect(bx, by + 2, bw, bh, 7)
        .fill({ color: 0x000000, alpha: 0.45 });
      pill
        .roundRect(bx, by, bw, bh, 7)
        .fill({ color: hovered ? 0x1e2824 : 0x111618, alpha: 0.94 })
        .stroke({
          color: hovered ? 0xffe28a : active ? 0xe07050 : 0xc89d3c,
          width: hovered ? 1.6 : 1.1,
        });
      pill.roundRect(bx + 2.5, by + 2.5, bw - 5, bh - 5, 5).stroke({
        color: hovered ? 0xffe28a : 0xc89d3c,
        width: 0.6,
        alpha: 0.4,
      });
      this.hdButtonsLayer.addChild(pill);

      const badge = createHdTextSprite(btn.key, 34, 16, {
        font: 'bold 8.5px Georgia, "Times New Roman", serif',
        fill: hovered ? '#fff4c2' : '#e0b85c',
        align: 'center',
      });
      badge.anchor.set(0.5);
      badge.position.set(bx + bw * 0.5, by + 13);
      this.hdButtonsLayer.addChild(badge);

      let sub = btn.label;
      if (btn.id === 2) sub = config.soundMusicEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
      else if (btn.id === 3) sub = `TABLE ${romanTable}`;
      else if (btn.id === 4 && this.ctx.sessionPlayer.loggedIn) sub = this.ctx.sessionPlayer.name;

      const subSpr = createHdTextSprite(sub, bw - 8, 16, {
        font: '600 8.5px "Segoe UI", system-ui, sans-serif',
        fill: hovered ? '#ffffff' : '#dfd6c1',
        align: 'center',
      });
      subSpr.anchor.set(0.5);
      subSpr.position.set(bx + bw * 0.5, by + 29);
      this.hdButtonsLayer.addChild(subSpr);
    }
  }

  private renderLeaderboard(): void {
    if (!this.ctx) return;
    const tableId = this.ctx.config.clubTable;

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.cardNameSpr.texture = this.cardNameTextures[tableId];
      this.cardScoreSpr.texture = this.cardScoreTextures[tableId];
      this.f3Spr.texture = this.f3Frames[tableId - 1];

      this.tableTextLayer.removeChildren();
      const rows = this.ctx.highScores[tableId];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const y = 116 + i * 10;
        const nameStr = row.name.slice(0, 8);
        this.tableTextLayer.addChild(this.ctx.menuFont.createText(nameStr, 195, y, { stepX: 10 }));

        if (row.name !== 'Noname' || row.score !== 0) {
          const scoreStr = String(row.score).slice(0, 5).padStart(5, ' ');
          this.tableTextLayer.addChild(
            this.ctx.menuFont.createText(scoreStr, 361, y, { stepX: 10, blackDigits: true }),
          );
        }
      }
      return;
    }

    // HD Scorecard Leaderboard
    this.hdTableLayer.removeChildren();
    const roman = ['I', 'II', 'III'][tableId - 1] ?? 'I';
    const suitColors = [0xb81a28, 0x1b202b, 0x7b4c14];
    const rankColorHex = ['#c41d2d', '#1c2433', '#8c5a18'][tableId - 1] ?? '#c41d2d';

    const leftHeader = createHdTextSprite(`9♥   CLUB TABLE ${roman}`, 138, 18, {
      font: 'bold 9.5px Georgia, "Times New Roman", serif',
      fill: rankColorHex,
      align: 'left',
    });
    leftHeader.position.set(170, 124);
    this.hdTableLayer.addChild(leftHeader);

    const rightHeader = createHdTextSprite('9♠   HIGH SCORES', 138, 18, {
      font: 'bold 9.5px Georgia, "Times New Roman", serif',
      fill: '#1b202b',
      align: 'left',
    });
    rightHeader.position.set(334, 124);
    this.hdTableLayer.addChild(rightHeader);

    const divG = new Graphics();
    divG.moveTo(168, 142).lineTo(308, 142).stroke({ color: suitColors[tableId - 1], width: 0.7, alpha: 0.45 });
    divG.moveTo(332, 142).lineTo(472, 142).stroke({ color: 0x1b202b, width: 0.7, alpha: 0.35 });
    divG.moveTo(168, 242).lineTo(308, 242).stroke({ color: 0xc99c38, width: 0.65, alpha: 0.5 });
    divG.moveTo(332, 242).lineTo(472, 242).stroke({ color: 0xc99c38, width: 0.65, alpha: 0.5 });
    this.hdTableLayer.addChild(divG);

    const rows = this.ctx.highScores[tableId];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const y = 145 + i * 9.5;
      const isSignedUser =
        this.ctx.sessionPlayer.loggedIn && row.name.toLowerCase() === this.ctx.sessionPlayer.name.toLowerCase();

      const nameSpr = createHdTextSprite(`${i + 1}. ${row.name.slice(0, 8)}`, 128, 11, {
        font: `${isSignedUser ? 'bold' : '600'} 8px "Segoe UI", system-ui, sans-serif`,
        fill: isSignedUser ? '#b81a28' : '#2a221a',
        align: 'left',
      });
      nameSpr.position.set(172, y);
      this.hdTableLayer.addChild(nameSpr);

      if (row.name !== 'Noname' || row.score !== 0) {
        const scoreSpr = createHdTextSprite(`$${row.score}`, 120, 11, {
          font: `${isSignedUser ? 'bold' : '600'} 8px "Segoe UI", system-ui, sans-serif`,
          fill: isSignedUser ? '#b81a28' : '#19202b',
          align: 'right',
        });
        scoreSpr.position.set(342, y);
        this.hdTableLayer.addChild(scoreSpr);
      }
    }

    this.renderHdButtons();
  }

  private renderPromptInput(): void {
    if (!this.ctx) return;

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.inputLayer.removeChildren();
      const whiteBg = new Graphics();
      whiteBg.rect(349, 229, 86, 11).fill(0xffffff);
      this.inputLayer.addChild(whiteBg);

      let shown = '';
      if (this.loginPhase === 'enteringName') {
        this.bannerSpr.texture = this.bannerNewPlayerTex;
        this.f4Spr.texture = this.f4ActiveTex;
        shown = this.pendingName;
      } else if (this.loginPhase === 'enteringPassword') {
        this.bannerSpr.texture = this.bannerPasswordTex;
        this.f4Spr.texture = this.f4ActiveTex;
        shown = '*'.repeat(this.pendingPassword.length);
      } else {
        this.bannerSpr.texture = this.bannerNewPlayerTex;
        this.f4Spr.texture = this.f4IdleTex;
        shown = this.ctx.sessionPlayer.loggedIn ? this.ctx.sessionPlayer.name : '';
      }

      if (shown.length > 0) {
        this.inputLayer.addChild(
          this.ctx.menuFont.createText(shown, 351, 230, { stepX: 10, blackDigits: false }),
        );
      }
      return;
    }

    // HD Prompt & Input Field
    this.hdInputLayer.removeChildren();

    const promptLabel = this.loginPhase === 'enteringPassword' ? 'PASSWORD:' : 'NEW PLAYER:';
    const promptSpr = createHdTextSprite(promptLabel, 130, 16, {
      font: 'bold 8.5px Georgia, "Times New Roman", serif',
      fill: this.loginPhase !== 'idle' ? '#b81a28' : '#5e4926',
      align: 'center',
    });
    promptSpr.position.set(173, 246);
    this.hdInputLayer.addChild(promptSpr);

    const fieldBox = new Graphics();
    fieldBox
      .roundRect(338, 245, 128, 16, 4)
      .fill(this.loginPhase !== 'idle' ? 0xffffff : 0xf2ead7)
      .stroke({
        color: this.loginPhase !== 'idle' ? 0xb81a28 : 0xb38a34,
        width: this.loginPhase !== 'idle' ? 1.3 : 0.85,
      });
    this.hdInputLayer.addChild(fieldBox);

    let shown = '';
    if (this.loginPhase === 'enteringName') {
      shown = this.pendingName;
    } else if (this.loginPhase === 'enteringPassword') {
      shown = '*'.repeat(this.pendingPassword.length);
    } else if (this.ctx.sessionPlayer.loggedIn) {
      shown = this.ctx.sessionPlayer.name;
    }

    const fieldText = shown || 'Click or press F4';
    const textSpr = createHdTextSprite(fieldText, 120, 14, {
      font: `${shown ? 'bold' : 'italic'} 8.5px "Segoe UI", system-ui, sans-serif`,
      fill: shown ? '#1b1d24' : '#8a7c63',
      align: 'left',
    });
    textSpr.position.set(343, 246);
    this.hdInputLayer.addChild(textSpr);

    this.renderHdButtons();
  }

  private beginLoginFlow(autoLaunchAfter: boolean): void {
    if (this.inputBlocked) return;
    this.loginPhase = 'enteringName';
    this.pendingName = '';
    this.pendingPassword = '';
    this.existingPasswordToMatch = null;
    this.existingScoreForMatch = 0;
    this.autoLaunchAfterLogin = autoLaunchAfter;
    this.cursorBlinkMs = 0;
    this.renderPromptInput();
  }

  private cancelLoginFlow(): void {
    this.loginPhase = 'idle';
    this.pendingName = '';
    this.pendingPassword = '';
    this.existingPasswordToMatch = null;
    this.autoLaunchAfterLogin = false;
    this.renderPromptInput();
  }

  private submitName(): void {
    if (!this.ctx) return;
    const trimmed = this.pendingName.trim();
    if (!trimmed || trimmed.toLowerCase() === 'noname') {
      this.ctx.audio.sfx.passAlert();
      this.cancelLoginFlow();
      return;
    }
    this.pendingName = trimmed.slice(0, 8);
    const existing = lookupPlayer(this.ctx.highScores, this.ctx.config.clubTable, this.pendingName);
    if (existing) {
      this.existingPasswordToMatch = existing.password;
      this.existingScoreForMatch = existing.score;
    } else {
      this.existingPasswordToMatch = null;
      this.existingScoreForMatch = 0;
    }
    this.loginPhase = 'enteringPassword';
    this.pendingPassword = '';
    this.cursorBlinkMs = 0;
    this.renderPromptInput();
  }

  private submitPassword(): void {
    if (!this.ctx) return;
    const pwd = this.pendingPassword.slice(0, 8);
    if (this.existingPasswordToMatch !== null && pwd !== this.existingPasswordToMatch) {
      this.ctx.audio.sfx.passAlert();
      this.cancelLoginFlow();
      return;
    }

    const carryover = this.existingPasswordToMatch !== null ? this.existingScoreForMatch - 200 : 0;
    this.ctx.sessionPlayer = {
      loggedIn: true,
      name: this.pendingName,
      password: pwd,
      clubCarryover: carryover,
    };
    this.ctx.onStateChange?.();
    this.ctx.audio.sfx.coinChime();

    const shouldLaunch = this.autoLaunchAfterLogin;
    this.loginPhase = 'idle';
    this.autoLaunchAfterLogin = false;
    this.renderPromptInput();

    if (shouldLaunch) {
      this.triggerF1StartGame();
    }
  }

  private triggerF1StartGame(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    if (!this.ctx.sessionPlayer.loggedIn) {
      this.beginLoginFlow(true);
      return;
    }
    this.inputBlocked = true;
    if (this.ctx.getGraphicsMode() === 'ega') {
      this.dealBackdropGfx.visible = true;
      this.f1HeadSpr.visible = true;
      this.f1FanSpr.visible = false;
    } else {
      this.hdDealLayer.visible = true;
    }
    this.dealStage = { step: 'head', timer: 0, frameIdx: 0 };
  }

  private triggerF2ToggleSound(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    const nextEnabled = !this.ctx.config.soundMusicEnabled;
    this.ctx.config.soundMusicEnabled = nextEnabled;
    this.ctx.audio.setEnabled(nextEnabled);
    this.ctx.persistConfig();

    if (this.ctx.getGraphicsMode() === 'hd') {
      this.renderHdButtons();
      return;
    }

    const seq = nextEnabled ? [this.f2Frames[2], this.f2Frames[1], this.f2Frames[0]] : [this.f2Frames[0], this.f2Frames[1], this.f2Frames[2]];
    this.activeAnim = {
      frames: seq,
      elapsed: 0,
      frameDurationMs: 90,
      target: this.f2Spr,
      onComplete: () => {
        this.f2Spr.texture = this.f2Frames[nextEnabled ? 0 : 2];
      },
    };
  }

  private triggerF3CycleTable(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    const nextTable = ((this.ctx.config.clubTable % 3) + 1) as ClubTableId;
    this.ctx.config.clubTable = nextTable;
    this.ctx.sessionPlayer = {
      loggedIn: false,
      name: '',
      password: '',
      clubCarryover: 0,
    };
    this.cancelLoginFlow();
    this.ctx.persistConfig();
    this.ctx.audio.sfx.cardSlide();
    this.renderLeaderboard();
  }

  private triggerF5Exit(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    this.inputBlocked = true;
    this.ctx.audio.sfx.exitSequence();

    if (this.ctx.getGraphicsMode() === 'hd') {
      this.ctx.audio.music.stop();
      this.ctx.goTo('intro', 420);
      return;
    }

    this.activeAnim = {
      frames: [this.f5Frames[0], this.f5Frames[1], this.f5Frames[2]],
      elapsed: 0,
      frameDurationMs: 250,
      target: this.f5Spr,
      onComplete: () => {
        this.ctx?.audio.music.stop();
        this.ctx?.goTo('intro', 250);
      },
    };
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.inputBlocked) return;

    if (this.loginPhase !== 'idle') {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelLoginFlow();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.loginPhase === 'enteringName') this.submitName();
        else this.submitPassword();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (this.loginPhase === 'enteringName') {
          this.pendingName = this.pendingName.slice(0, -1);
        } else {
          this.pendingPassword = this.pendingPassword.slice(0, -1);
        }
        this.renderPromptInput();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const code = e.key.charCodeAt(0);
        if (code >= 0x20 && code <= 0x7a) {
          e.preventDefault();
          if (this.loginPhase === 'enteringName' && this.pendingName.length < 8) {
            this.pendingName += e.key;
          } else if (this.loginPhase === 'enteringPassword' && this.pendingPassword.length < 8) {
            this.pendingPassword += e.key;
          }
          this.renderPromptInput();
        }
      }
      return;
    }

    if (e.key === 'F1' || e.key === '1') {
      e.preventDefault();
      this.triggerF1StartGame();
    } else if (e.key === 'F2' || e.key === '2') {
      e.preventDefault();
      this.triggerF2ToggleSound();
    } else if (e.key === 'F3' || e.key === '3') {
      e.preventDefault();
      this.triggerF3CycleTable();
    } else if (e.key === 'F4' || e.key === '4') {
      e.preventDefault();
      this.beginLoginFlow(false);
    } else if (e.key === 'F5' || e.key === '5' || e.key === 'Escape') {
      e.preventDefault();
      this.triggerF5Exit();
    }
  };

  private handlePointerMove = (pt: { x: number; y: number }): void => {
    if (!this.ctx || this.inputBlocked) return;
    let hitId: number | null = null;
    if (pt.y >= 292 && pt.y <= 349) {
      for (const btn of BUTTON_HITBOXES) {
        if (pt.x >= btn.x && pt.x <= btn.x + btn.w) {
          hitId = btn.id;
          break;
        }
      }
    }
    const overPrompt = pt.x >= 170 && pt.x <= 470 && pt.y >= 220 && pt.y <= 268;
    this.ctx.stage.getCanvas().style.cursor = hitId || overPrompt ? 'pointer' : 'default';

    if (hitId !== this.hoveredButtonId) {
      this.hoveredButtonId = hitId;
      this.renderHdButtons();
    }
  };

  private handlePointerDown = (pt: { x: number; y: number }): void => {
    if (this.inputBlocked) return;

    // Clicking the prompt area starts/focuses F4 login
    if (pt.x >= 170 && pt.x <= 470 && pt.y >= 220 && pt.y <= 268) {
      if (this.loginPhase === 'idle') this.beginLoginFlow(false);
      return;
    }

    // Bottom bar F1..F5 buttons
    if (pt.y >= 292 && pt.y <= 349) {
      for (const btn of BUTTON_HITBOXES) {
        if (pt.x >= btn.x && pt.x <= btn.x + btn.w) {
          if (btn.id === 1) this.triggerF1StartGame();
          else if (btn.id === 2) this.triggerF2ToggleSound();
          else if (btn.id === 3) this.triggerF3CycleTable();
          else if (btn.id === 4) this.beginLoginFlow(false);
          else if (btn.id === 5) this.triggerF5Exit();
          return;
        }
      }
    }
  };

  update(dtMs: number): void {
    this.hdElapsedMs += dtMs;

    if (this.activeAnim) {
      this.activeAnim.elapsed += dtMs;
      const idx = Math.floor(this.activeAnim.elapsed / this.activeAnim.frameDurationMs);
      if (idx < this.activeAnim.frames.length) {
        this.activeAnim.target.texture = this.activeAnim.frames[idx];
      } else {
        const done = this.activeAnim.onComplete;
        this.activeAnim = null;
        done();
      }
    }

    // F1 Dealing card-fan animation (EGA frames + smooth 60fps HD arc)
    if (this.dealStage.step !== 'none' && this.dealStage.step !== 'done') {
      this.dealStage.timer += dtMs;
      const isEga = this.ctx?.getGraphicsMode() === 'ega';

      if (this.dealStage.step === 'head') {
        if (this.dealStage.timer >= 180) {
          this.dealStage.step = 'col1';
          this.dealStage.timer = 0;
          this.dealStage.frameIdx = 0;
          if (isEga) {
            this.f1FanSpr.visible = true;
            this.f1FanSpr.texture = this.f1Col1Frames[0];
          }
        }
      } else if (this.dealStage.step === 'col1') {
        const nextIdx = Math.floor(this.dealStage.timer / 45);
        if (nextIdx >= 11) {
          this.dealStage.step = 'pause';
          this.dealStage.timer = 0;
        } else if (nextIdx !== this.dealStage.frameIdx) {
          this.dealStage.frameIdx = nextIdx;
          if (isEga) this.f1FanSpr.texture = this.f1Col1Frames[nextIdx];
          if (nextIdx % 2 === 0) this.ctx?.audio.sfx.cardSlide();
        }
      } else if (this.dealStage.step === 'pause') {
        if (this.dealStage.timer >= 320) {
          this.dealStage.step = 'col2';
          this.dealStage.timer = 0;
          this.dealStage.frameIdx = 0;
          if (isEga) this.f1FanSpr.texture = this.f1Col2Frames[0];
        }
      } else if (this.dealStage.step === 'col2') {
        const nextIdx = Math.floor(this.dealStage.timer / 45);
        if (nextIdx >= 11) {
          this.dealStage.step = 'done';
          this.ctx?.audio.music.stop();
          this.ctx?.goTo('table', 250);
        } else if (nextIdx !== this.dealStage.frameIdx) {
          this.dealStage.frameIdx = nextIdx;
          if (isEga) this.f1FanSpr.texture = this.f1Col2Frames[nextIdx];
          if (nextIdx % 2 === 0) this.ctx?.audio.sfx.cardSlide();
        }
      }

      // Smooth 60fps cascading arc for HD dealer showcase
      if (!isEga && this.hdDealer) {
        this.hdDealer.setTableExpression('idle', this.hdElapsedMs);
        const showCascade = this.dealStage.step === 'col1' || this.dealStage.step === 'col2';
        const t = Math.min(1, this.dealStage.timer / (11 * 45));
        const forward = this.dealStage.step === 'col1';
        for (let i = 0; i < this.hdDealCards.length; i++) {
          const spr = this.hdDealCards[i];
          spr.visible = showCascade || this.dealStage.step === 'pause';
          if (showCascade) {
            const p = Math.max(0, Math.min(1, t * 1.4 - i * 0.04));
            const sx = forward ? -32 : 32;
            const ex = forward ? 32 : -32;
            spr.position.set(SCREEN_WIDTH * 0.5 + sx + (ex - sx) * p, 184 - Math.sin(p * Math.PI) * 24);
            spr.rotation = (p - 0.5) * (forward ? 0.8 : -0.8);
          } else if (this.dealStage.step === 'pause') {
            spr.position.set(SCREEN_WIDTH * 0.5 + (i - 5.5) * 3, 184);
            spr.rotation = (i - 5.5) * 0.06;
          }
        }
      }
    }

    // Blinking cursor in F4 prompt box
    this.cursorGfx.clear();
    if (this.loginPhase !== 'idle') {
      this.cursorBlinkMs += dtMs;
      if (Math.floor(this.cursorBlinkMs / 350) % 2 === 0) {
        if (this.ctx?.getGraphicsMode() === 'ega') {
          const len = this.loginPhase === 'enteringName' ? this.pendingName.length : this.pendingPassword.length;
          const cx = 351 + Math.min(7, len) * 10;
          this.cursorGfx.rect(cx, 238, 8, 2).fill(0xaa0000);
        } else {
          const len = this.loginPhase === 'enteringName' ? this.pendingName.length : this.pendingPassword.length;
          const cx = 345 + len * 5.2;
          this.cursorGfx.rect(cx, 248, 1.5, 10).fill(0xb81a28);
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
