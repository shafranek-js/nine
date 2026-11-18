import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { getTranslations } from '../core/i18n';
import { isEncodableProfileChar, lookupPlayer } from '../core/persistence';
import { SCREEN_HEIGHT, SCREEN_WIDTH, type ClubTableId } from '../core/types';
import { sliceTexture } from '../engine/BitmapFont';
import {
  createHdClubBannerSprite,
  createHdDealer,
  createHdMenuRigSprite,
  createHdTextSprite,
  getWarmGlowTexture,
  sliceLinearSheet,
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

const BUTTON_HITBOXES: readonly {
  id: 1 | 2 | 3 | 4 | 5;
  x: number;
  w: number;
  mascotX: number;
  keyX: number;
  key: string;
  label: string;
}[] = [
  { id: 1, x: 0, w: 124, mascotX: 46, keyX: 98, key: 'F1', label: 'PLAY' },
  { id: 2, x: 134, w: 118, mascotX: 175, keyX: 224, key: 'F2', label: 'AUDIO' },
  { id: 3, x: 268, w: 116, mascotX: 304, keyX: 350, key: 'F3', label: 'TABLE' },
  { id: 4, x: 394, w: 124, mascotX: 431, keyX: 483, key: 'F4', label: 'SIGN IN' },
  { id: 5, x: 524, w: 116, mascotX: 559, keyX: 607, key: 'F5', label: 'EXIT' },
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
  private hdHoverHaloLayer = new Container();
  private hdHoverTooltipLayer = new Container();
  private hdDealLayer = new Container();
  private hdDealer: HdDealerController | null = null;
  private hdF2Frames: Texture[] = [];
  private hdF3Frames: Texture[] = [];
  private hdF4IdleTex: Texture | null = null;
  private hdF4ActiveTex: Texture | null = null;
  private hdF5Frames: Texture[] = [];
  private hdF2Spr: Sprite | null = null;
  private hdF3Spr: Sprite | null = null;
  private hdF4Spr: Sprite | null = null;
  private hdF5Spr: Sprite | null = null;
  private hdKeyRigs: Container[] = [];
  private hdKeySprites: Sprite[] = [];
  private hoveredButtonId: number | null = null;
  private hoveredRowIndex: number | null = null;

  private loginPhase: LoginPhase = 'idle';
  private pendingName = '';
  private pendingPassword = '';
  private existingPasswordToMatch: string | null = null;
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
    this.hoveredRowIndex = null;
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

  onLanguageChanged(): void {
    if (this.ctx?.getGraphicsMode() === 'hd') {
      this.buildVisuals();
    }
  }

  onClubTableChanged(): void {
    this.cancelLoginFlow();
  }

  onRuleConfigChanged(): void {
    this.cancelLoginFlow();
    this.renderLeaderboard();
  }

  onSessionChanged(): void {
    this.renderLeaderboard();
    this.renderPromptInput();
  }

  private buildVisuals(): void {
    if (!this.ctx) return;
    if (this.activeAnim) {
      const done = this.activeAnim.onComplete;
      this.activeAnim = null;
      done();
    }
    this.root.removeChildren();
    this.tableTextLayer.removeChildren();
    this.inputLayer.removeChildren();
    this.cursorGfx.clear();
    this.hdTableLayer.removeChildren();
    this.hdInputLayer.removeChildren();
    this.hdButtonsLayer.removeChildren();
    this.hdHoverHaloLayer.removeChildren();
    this.hdHoverTooltipLayer.removeChildren();
    this.hdDealLayer.removeChildren();
    this.hdDealer = null;
    this.hdF2Spr = null;
    this.hdF3Spr = null;
    this.hdF4Spr = null;
    this.hdF5Spr = null;
    this.hdKeyRigs = [];
    this.hdKeySprites = [];

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.buildEgaVisuals(this.ctx);
    } else {
      this.buildHdVisuals(this.ctx);
    }
    this.renderLeaderboard();
    this.renderPromptInput();
    this.updateNativeInputHitbox();

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

    // Exact TR_NINE cell from NINE.EXE 0x5d07: (150, 287, 80, 44) includes full top-hat crown AND 2px green tabletop (y=329..330)
    this.f1HeadTex = sliceTexture(tr, 150, 287, 80, 44);
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

    // Top arched NINE / CLUB card fans extracted cleanly from reference art flanking the central alcove
    this.root.addChild(createHdClubBannerSprite(ctx.assets.hdBanners.nine, 'left'));
    this.root.addChild(createHdClubBannerSprite(ctx.assets.hdBanners.club, 'right'));

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

    this.buildHdBottomBar(ctx);
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

    const dealCaptionText = getTranslations(ctx.getLanguage()).scenes.menuShuffling;
    const dealCaption = createHdTextSprite(dealCaptionText, 320, 22, {
      font: '600 10px Georgia, "Times New Roman", serif',
      fill: ['#fff1bd', '#d49a24'],
      align: 'center',
    });
    dealCaption.anchor.set(0.5);
    dealCaption.position.set(SCREEN_WIDTH * 0.5, 232);
    this.hdDealLayer.addChild(dealCaption);

    this.root.addChild(this.hdDealLayer);
  }

  private buildHdBottomBar(ctx: GameContext): void {
    const baseY = 344;
    const { hdMenu } = ctx.assets;

    this.hdF2Frames = sliceLinearSheet(hdMenu.f2, 3);
    this.hdF3Frames = sliceLinearSheet(hdMenu.f3, 3);
    const f4Frames = sliceLinearSheet(hdMenu.f4, 2);
    this.hdF4IdleTex = f4Frames[0];
    this.hdF4ActiveTex = f4Frames[1];
    this.hdF5Frames = sliceLinearSheet(hdMenu.f5, 3);
    const keyFrames = sliceLinearSheet(hdMenu.keys, 5);

    // Grounded contact shadows beneath mascots and mechanical keycaps
    const shadowGfx = new Graphics();
    for (const btn of BUTTON_HITBOXES) {
      shadowGfx.ellipse(btn.mascotX, baseY - 1, 25, 4.2).fill({ color: 0x000000, alpha: 0.44 });
      shadowGfx.ellipse(btn.keyX, baseY - 0.5, 17, 3.2).fill({ color: 0x000000, alpha: 0.48 });
    }
    this.hdButtonsLayer.addChild(shadowGfx);

    this.hdHoverHaloLayer.removeChildren();
    this.hdButtonsLayer.addChild(this.hdHoverHaloLayer);

    const f1 = createHdMenuRigSprite(hdMenu.f1, BUTTON_HITBOXES[0].mascotX, baseY, 42);
    this.hdButtonsLayer.addChild(f1.rig);

    const f2 = createHdMenuRigSprite(
      this.hdF2Frames[ctx.config.soundMusicEnabled ? 0 : 2],
      BUTTON_HITBOXES[1].mascotX,
      baseY,
      54,
    );
    this.hdF2Spr = f2.sprite;
    this.hdButtonsLayer.addChild(f2.rig);

    const f3 = createHdMenuRigSprite(
      this.hdF3Frames[ctx.config.clubTable - 1] ?? this.hdF3Frames[0],
      BUTTON_HITBOXES[2].mascotX,
      baseY,
      50,
    );
    this.hdF3Spr = f3.sprite;
    this.hdButtonsLayer.addChild(f3.rig);

    const f4Tex = this.loginPhase !== 'idle' ? this.hdF4ActiveTex : this.hdF4IdleTex;
    const f4 = createHdMenuRigSprite(f4Tex, BUTTON_HITBOXES[3].mascotX, baseY, 46);
    this.hdF4Spr = f4.sprite;
    this.hdButtonsLayer.addChild(f4.rig);

    const f5 = createHdMenuRigSprite(this.hdF5Frames[0], BUTTON_HITBOXES[4].mascotX, baseY, 50);
    this.hdF5Spr = f5.sprite;
    this.hdButtonsLayer.addChild(f5.rig);

    this.hdKeyRigs = [];
    this.hdKeySprites = [];
    for (let i = 0; i < BUTTON_HITBOXES.length; i++) {
      const k = createHdMenuRigSprite(keyFrames[i], BUTTON_HITBOXES[i].keyX, baseY, 31);
      this.hdKeyRigs.push(k.rig);
      this.hdKeySprites.push(k.sprite);
      this.hdButtonsLayer.addChild(k.rig);
    }

    this.hdHoverTooltipLayer.removeChildren();
    this.hdButtonsLayer.addChild(this.hdHoverTooltipLayer);
  }

  private renderHdButtons(): void {
    if (!this.ctx || this.ctx.getGraphicsMode() !== 'hd' || this.hdKeySprites.length === 0) return;

    this.hdHoverHaloLayer.removeChildren();
    this.hdHoverTooltipLayer.removeChildren();

    const { config } = this.ctx;
    const romanTable = ['I', 'II', 'III'][config.clubTable - 1] ?? 'I';
    const baseY = 344;

    for (let i = 0; i < BUTTON_HITBOXES.length; i++) {
      const btn = BUTTON_HITBOXES[i];
      const hovered = this.hoveredButtonId === btn.id;
      const active =
        (btn.id === 4 && this.loginPhase !== 'idle') ||
        (btn.id === 2 && !config.soundMusicEnabled);

      const rig = this.hdKeyRigs[i];
      const keySpr = this.hdKeySprites[i];
      if (rig && keySpr) {
        rig.y = baseY + (active ? 1.2 : hovered ? -1.5 : 0);
        keySpr.tint = hovered ? 0xfff2c2 : active ? 0xd9cbb8 : 0xffffff;
      }

      if (!hovered && !active) continue;

      if (hovered) {
        const glow = new Sprite(getWarmGlowTexture());
        glow.anchor.set(0.5);
        glow.position.set(btn.mascotX + 18, 322);
        glow.scale.set(1.45, 0.72);
        glow.alpha = 0.44;
        glow.blendMode = 'add';
        this.hdHoverHaloLayer.addChild(glow);

        const halo = new Graphics();
        halo
          .roundRect(btn.x + 2, 290, btn.w - 4, 57, 8)
          .fill({ color: 0xf7d478, alpha: 0.08 })
          .stroke({ color: 0xf7d478, width: 1.15, alpha: 0.78 });
        this.hdHoverHaloLayer.addChild(halo);

        const tr = getTranslations(this.ctx.getLanguage()).scenes;
        let caption = btn.label;
        if (btn.id === 1) caption = tr.menuBtnPlay;
        else if (btn.id === 2) caption = config.soundMusicEnabled ? tr.menuBtnAudioOn : tr.menuBtnAudioOff;
        else if (btn.id === 3) caption = tr.menuBtnTable(romanTable);
        else if (btn.id === 4) caption = this.ctx.sessionPlayer.loggedIn ? this.ctx.sessionPlayer.name : tr.menuBtnSignIn;
        else if (btn.id === 5) caption = tr.menuBtnExit;

        const pillW = Math.max(66, Math.min(126, caption.length * 6.8 + 20));
        const pillX = Math.max(6, Math.min(SCREEN_WIDTH - pillW - 6, btn.x + (btn.w - pillW) * 0.5));
        const pillY = 273;

        const tipBg = new Graphics();
        tipBg
          .roundRect(pillX, pillY, pillW, 14.5, 4)
          .fill({ color: 0x101518, alpha: 0.92 })
          .stroke({ color: 0xe6be63, width: 0.9, alpha: 0.9 });
        this.hdHoverTooltipLayer.addChild(tipBg);

        const tipTxt = createHdTextSprite(caption, pillW - 6, 14, {
          font: 'bold 7.5px "Segoe UI", system-ui, sans-serif',
          fill: '#fff3cb',
          align: 'center',
        });
        tipTxt.anchor.set(0.5);
        tipTxt.position.set(pillX + pillW * 0.5, pillY + 7.4);
        this.hdHoverTooltipLayer.addChild(tipTxt);
      } else if (active) {
        const activeRing = new Graphics();
        activeRing
          .roundRect(btn.x + 2, 290, btn.w - 4, 57, 8)
          .stroke({ color: 0xe07050, width: 1.0, alpha: 0.65 });
        this.hdHoverHaloLayer.addChild(activeRing);
      }
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
      const rows = this.ctx.getHighScoresForVariant()[tableId];
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
    if (this.hdF3Spr && this.hdF3Frames.length >= 3) {
      this.hdF3Spr.texture = this.hdF3Frames[tableId - 1] ?? this.hdF3Frames[0];
    }
    this.hdTableLayer.removeChildren();
    const roman = ['I', 'II', 'III'][tableId - 1] ?? 'I';
    const suitColors = [0xb81a28, 0x1b202b, 0x7b4c14];
    const rankColorHex = ['#c41d2d', '#1c2433', '#8c5a18'][tableId - 1] ?? '#c41d2d';

    const tr = getTranslations(this.ctx.getLanguage()).scenes;
    const leftHeader = createHdTextSprite(tr.menuClubTable(roman), 138, 18, {
      font: 'bold 9.5px Georgia, "Times New Roman", serif',
      fill: rankColorHex,
      align: 'left',
    });
    leftHeader.position.set(170, 124);
    this.hdTableLayer.addChild(leftHeader);

    const rightHeader = createHdTextSprite(tr.menuHighScores, 138, 18, {
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

    const rows = this.ctx.getHighScoresForVariant()[tableId];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const y = 145 + i * 9.5;
      const isNamed = row.name.trim().length > 0 && row.name !== 'Noname';
      const isSignedUser =
        this.ctx.sessionPlayer.loggedIn && row.name.toLowerCase() === this.ctx.sessionPlayer.name.toLowerCase();
      const isHoveredRow = isNamed && this.hoveredRowIndex === i;

      if (isSignedUser || isHoveredRow) {
        const hl = new Graphics();
        hl.roundRect(168, y - 0.5, 140, 9.2, 2).fill({
          color: isSignedUser ? 0xb81a28 : 0xc99c38,
          alpha: isHoveredRow ? 0.16 : 0.08,
        });
        hl.roundRect(332, y - 0.5, 140, 9.2, 2).fill({
          color: isSignedUser ? 0xb81a28 : 0xc99c38,
          alpha: isHoveredRow ? 0.16 : 0.08,
        });
        this.hdTableLayer.addChild(hl);
      }

      const prefix = isSignedUser ? '▶ ' : '';
      const nameSpr = createHdTextSprite(`${prefix}${i + 1}. ${row.name.slice(0, 8)}`, 132, 11, {
        font: `${isSignedUser ? 'bold' : '600'} 8px "Segoe UI", system-ui, sans-serif`,
        fill: isSignedUser ? '#b81a28' : isHoveredRow ? '#7a4b0c' : '#2a221a',
        align: 'left',
      });
      nameSpr.position.set(172, y);
      this.hdTableLayer.addChild(nameSpr);

      if (row.name !== 'Noname' || row.score !== 0) {
        const scoreSpr = createHdTextSprite(`$${row.score}`, 120, 11, {
          font: `${isSignedUser ? 'bold' : '600'} 8px "Segoe UI", system-ui, sans-serif`,
          fill: isSignedUser ? '#b81a28' : isHoveredRow ? '#7a4b0c' : '#19202b',
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
    if (this.hdF4Spr && this.hdF4IdleTex && this.hdF4ActiveTex) {
      this.hdF4Spr.texture = this.loginPhase !== 'idle' ? this.hdF4ActiveTex : this.hdF4IdleTex;
    }
    this.hdInputLayer.removeChildren();

    const tr = getTranslations(this.ctx.getLanguage()).scenes;
    const promptLabel = this.loginPhase === 'enteringPassword' ? tr.menuPassword : tr.menuNewPlayer;
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

    const fieldText = shown || tr.menuClickOrF4;
    const textSpr = createHdTextSprite(fieldText, 120, 14, {
      font: `${shown ? 'bold' : 'italic'} 8.5px "Segoe UI", system-ui, sans-serif`,
      fill: shown ? '#1b1d24' : '#8a7c63',
      align: 'left',
    });
    textSpr.position.set(343, 246);
    this.hdInputLayer.addChild(textSpr);

    this.renderHdButtons();
  }

  private sanitizeProfileInput(raw: string): string {
    let out = '';
    for (const ch of raw) {
      if (isEncodableProfileChar(ch)) {
        out += ch;
        if (out.length >= 8) break;
      }
    }
    return out;
  }

  private updateNativeInputHitbox(): void {
    if (!this.ctx) return;
    if (this.inputBlocked || (this.dealStage.step !== 'none' && this.dealStage.step !== 'done')) {
      this.ctx.input.setTextInputHitbox(null);
      return;
    }
    const isEga = this.ctx.getGraphicsMode() === 'ega';
    const virtualRect = isEga ? { x: 190, y: 226, w: 248, h: 16 } : { x: 170, y: 243, w: 298, h: 20 };
    this.ctx.input.setTextInputHitbox({
      virtualRect,
      onFocusTap: () => {
        if (this.loginPhase === 'idle') {
          this.beginLoginFlow(false);
        } else {
          this.activateNativeTextInput();
        }
      },
    });
  }

  private activateNativeTextInput(): void {
    if (!this.ctx || this.loginPhase === 'idle') return;
    this.updateNativeInputHitbox();
    const isPassword = this.loginPhase === 'enteringPassword';
    const currentVal = isPassword ? this.pendingPassword : this.pendingName;
    this.ctx.input.openTextInput({
      value: currentVal,
      maxLength: 8,
      isPassword,
      onChange: (raw) => {
        const clean = this.sanitizeProfileInput(raw);
        if (clean !== raw) {
          this.ctx?.input.syncTextInputValue(clean, this.loginPhase === 'enteringPassword');
        }
        if (this.loginPhase === 'enteringName') {
          this.pendingName = clean;
        } else if (this.loginPhase === 'enteringPassword') {
          this.pendingPassword = clean;
        }
        this.renderPromptInput();
      },
      onAction: (action) => {
        if (action === 'cancel') {
          this.cancelLoginFlow();
        } else if (this.loginPhase === 'enteringName') {
          this.submitName();
        } else if (this.loginPhase === 'enteringPassword') {
          this.submitPassword();
        }
      },
    });
  }

  private beginLoginFlow(autoLaunchAfter: boolean): void {
    if (this.inputBlocked) return;
    this.loginPhase = 'enteringName';
    this.pendingName = '';
    this.pendingPassword = '';
    this.existingPasswordToMatch = null;
    this.autoLaunchAfterLogin = autoLaunchAfter;
    this.cursorBlinkMs = 0;
    this.renderPromptInput();
    this.activateNativeTextInput();
  }

  private cancelLoginFlow(): void {
    this.loginPhase = 'idle';
    this.pendingName = '';
    this.pendingPassword = '';
    this.existingPasswordToMatch = null;
    this.autoLaunchAfterLogin = false;
    this.ctx?.input.closeTextInput();
    this.renderPromptInput();
  }

  private submitName(): void {
    if (!this.ctx) return;
    const trimmed = this.pendingName.trim();
    if (!trimmed || trimmed.toLowerCase() === 'noname') {
      this.ctx.audio.sfx.illegalMove();
      this.cancelLoginFlow();
      return;
    }
    this.pendingName = trimmed.slice(0, 8);
    const existing = lookupPlayer(
      this.ctx.getHighScoresForVariant(),
      this.ctx.config.clubTable,
      this.pendingName,
    );
    if (existing) {
      this.existingPasswordToMatch = existing.password;
    } else {
      this.existingPasswordToMatch = null;
    }
    this.loginPhase = 'enteringPassword';
    this.pendingPassword = '';
    this.cursorBlinkMs = 0;
    this.renderPromptInput();
    this.activateNativeTextInput();
  }

  private submitPassword(): void {
    if (!this.ctx) return;
    const pwd = this.pendingPassword.slice(0, 8);
    if (this.existingPasswordToMatch !== null && pwd !== this.existingPasswordToMatch) {
      this.ctx.audio.sfx.illegalMove();
      this.cancelLoginFlow();
      return;
    }

    this.ctx.signInPlayer(this.pendingName, pwd);
    this.ctx.audio.sfx.coinChime();

    const shouldLaunch = this.autoLaunchAfterLogin;
    this.loginPhase = 'idle';
    this.autoLaunchAfterLogin = false;
    this.ctx.input.closeTextInput();
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
    this.ctx.input.closeTextInput();
    this.ctx.input.setTextInputHitbox(null);
    if (this.ctx.getGraphicsMode() === 'ega') {
      this.dealBackdropGfx.visible = true;
      this.f1HeadSpr.visible = true;
      this.f1FanSpr.visible = false;
    } else {
      this.hdDealLayer.visible = true;
      this.hdDealer?.setShuffleFrame(0);
    }
    this.dealStage = { step: 'head', timer: 0, frameIdx: 0 };
  }

  private triggerF2ToggleSound(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    const nextEnabled = !this.ctx.config.soundMusicEnabled;
    this.ctx.config.soundMusicEnabled = nextEnabled;
    this.ctx.audio.setEnabled(nextEnabled);
    this.ctx.persistConfig();

    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const frames = isHd ? this.hdF2Frames : this.f2Frames;
    const target = isHd ? this.hdF2Spr : this.f2Spr;
    if (!target || frames.length < 3) {
      this.renderHdButtons();
      return;
    }

    // DOS CS:2C53..2CC4: transitions through frame 1 -> 0 (on) or 2 (off) at 100ms (0x64)
    const seq = isHd
      ? (nextEnabled ? [frames[2], frames[1], frames[0]] : [frames[0], frames[1], frames[2]])
      : [frames[1], frames[nextEnabled ? 0 : 2]];
    this.activeAnim = {
      frames: seq,
      elapsed: 0,
      frameDurationMs: isHd ? 90 : 100,
      target,
      onComplete: () => {
        target.texture = frames[nextEnabled ? 0 : 2];
        this.renderHdButtons();
      },
    };
  }

  private triggerF3CycleTable(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    const nextTable = ((this.ctx.config.clubTable % 3) + 1) as ClubTableId;
    this.ctx.setClubTable(nextTable);
    this.ctx.audio.sfx.cardSlide();
  }

  private triggerF5Exit(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    this.inputBlocked = true;
    this.ctx.audio.sfx.exitSequence();

    const isHd = this.ctx.getGraphicsMode() === 'hd';
    const frames = isHd ? this.hdF5Frames : this.f5Frames;
    const target = isHd ? this.hdF5Spr : this.f5Spr;
    if (!target || frames.length < 3) {
      this.ctx.audio.music.stop();
      this.ctx.goTo('intro', 250);
      return;
    }

    this.activeAnim = {
      frames: [frames[0], frames[1], frames[2]],
      elapsed: 0,
      frameDurationMs: 250,
      target,
      onComplete: () => {
        this.ctx?.audio.music.stop();
        this.ctx?.goTo('intro', 250);
      },
    };
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.inputBlocked) return;

    if (this.loginPhase !== 'idle') {
      if (e.isComposing && e.key !== 'Enter') {
        return;
      }
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
          this.ctx?.input.syncTextInputValue(this.pendingName, false);
        } else {
          this.pendingPassword = this.pendingPassword.slice(0, -1);
          this.ctx?.input.syncTextInputValue(this.pendingPassword, true);
        }
        this.renderPromptInput();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && isEncodableProfileChar(e.key)) {
        e.preventDefault();
        if (this.loginPhase === 'enteringName' && this.pendingName.length < 8) {
          this.pendingName += e.key;
          this.ctx?.input.syncTextInputValue(this.pendingName, false);
        } else if (this.loginPhase === 'enteringPassword' && this.pendingPassword.length < 8) {
          this.pendingPassword += e.key;
          this.ctx?.input.syncTextInputValue(this.pendingPassword, true);
        }
        this.renderPromptInput();
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

  private hitTestLeaderboardRow(pt: { x: number; y: number }): number | null {
    if (!this.ctx) return null;
    const isHd = this.ctx.getGraphicsMode() === 'hd';
    let idx = -1;
    if (isHd) {
      if (pt.x >= 166 && pt.x <= 474 && pt.y >= 144 && pt.y < 239.5) {
        idx = Math.floor((pt.y - 144.5) / 9.5);
      }
    } else if (pt.x >= 192 && pt.x <= 440 && pt.y >= 115 && pt.y < 215) {
      idx = Math.floor((pt.y - 115) / 10);
    }
    if (idx < 0 || idx >= 10) return null;
    const row = this.ctx.getHighScoresForVariant()[this.ctx.config.clubTable]?.[idx];
    if (!row || row.name.trim().length === 0 || row.name === 'Noname') return null;
    return idx;
  }

  private handlePointerMove = (pt: { x: number; y: number }): void => {
    if (!this.ctx || this.inputBlocked) return;
    let hitId: number | null = null;
    if (pt.y >= 288 && pt.y <= 349) {
      for (const btn of BUTTON_HITBOXES) {
        if (pt.x >= btn.x && pt.x <= btn.x + btn.w) {
          hitId = btn.id;
          break;
        }
      }
    }
    const rowIdx = this.hitTestLeaderboardRow(pt);
    const overPrompt = pt.x >= 170 && pt.x <= 470 && pt.y >= 220 && pt.y <= 268;
    this.ctx.stage.getCanvas().style.cursor = hitId || overPrompt || rowIdx !== null ? 'pointer' : 'default';

    if (hitId !== this.hoveredButtonId) {
      this.hoveredButtonId = hitId;
      this.renderHdButtons();
    }
    if (rowIdx !== this.hoveredRowIndex) {
      this.hoveredRowIndex = rowIdx;
      this.renderLeaderboard();
    }
  };

  private handlePointerDown = (pt: { x: number; y: number }): void => {
    if (!this.ctx || this.inputBlocked) return;

    // One-click sign-in on an existing player row in the leaderboard
    const rowIdx = this.hitTestLeaderboardRow(pt);
    if (rowIdx !== null) {
      const row = this.ctx.getHighScoresForVariant()[this.ctx.config.clubTable]?.[rowIdx];
      if (row && row.name !== 'Noname') {
        this.cancelLoginFlow();
        this.ctx.signInPlayer(row.name, row.password);
        this.ctx.audio.sfx.coinChime();
        this.renderLeaderboard();
        this.renderPromptInput();
        return;
      }
    }

    // Clicking the prompt area starts/focuses F4 login (and re-opens Android soft keyboard if dismissed)
    if (pt.x >= 170 && pt.x <= 470 && pt.y >= 220 && pt.y <= 268) {
      if (this.loginPhase === 'idle') {
        this.beginLoginFlow(false);
      } else {
        this.activateNativeTextInput();
      }
      return;
    }

    // Bottom bar F1..F5 buttons
    if (pt.y >= 288 && pt.y <= 349) {
      for (const btn of BUTTON_HITBOXES) {
        if (pt.x >= btn.x && pt.x <= btn.x + btn.w) {
          if (btn.id === 1) {
            if (this.loginPhase === 'enteringName') {
              this.autoLaunchAfterLogin = true;
              this.submitName();
            } else if (this.loginPhase === 'enteringPassword') {
              this.autoLaunchAfterLogin = true;
              this.submitPassword();
            } else {
              this.triggerF1StartGame();
            }
          }
          else if (btn.id === 2) this.triggerF2ToggleSound();
          else if (btn.id === 3) this.triggerF3CycleTable();
          else if (btn.id === 4) {
            if (this.loginPhase === 'idle') {
              this.beginLoginFlow(false);
            } else if (this.loginPhase === 'enteringName' && this.pendingName.trim().length > 0) {
              this.submitName();
            } else if (this.loginPhase === 'enteringPassword') {
              this.submitPassword();
            } else {
              this.activateNativeTextInput();
            }
          }
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

      const headWaitMs = 200;
      const frameStepMs = 140;
      const pauseWaitMs = 800;

      if (this.dealStage.step === 'head') {
        if (this.dealStage.timer >= headWaitMs) {
          this.dealStage.step = 'col1';
          this.dealStage.timer = 0;
          this.dealStage.frameIdx = 0;
          if (isEga) {
            this.f1FanSpr.visible = true;
            this.f1FanSpr.texture = this.f1Col1Frames[0];
          } else {
            this.ctx?.audio.sfx.cardSpring();
          }
        }
      } else if (this.dealStage.step === 'col1') {
        const nextIdx = Math.floor(this.dealStage.timer / frameStepMs);
        if (nextIdx >= 11) {
          this.dealStage.step = 'pause';
          this.dealStage.timer = 0;
        } else if (nextIdx !== this.dealStage.frameIdx) {
          this.dealStage.frameIdx = nextIdx;
          if (isEga) {
            this.f1FanSpr.texture = this.f1Col1Frames[nextIdx];
            if (nextIdx % 2 === 0) this.ctx?.audio.sfx.cardSlide();
          }
        }
      } else if (this.dealStage.step === 'pause') {
        if (this.dealStage.timer >= pauseWaitMs) {
          this.dealStage.step = 'col2';
          this.dealStage.timer = 0;
          this.dealStage.frameIdx = 0;
          if (isEga) {
            this.f1FanSpr.texture = this.f1Col2Frames[0];
          } else {
            this.ctx?.audio.sfx.cardSpring();
          }
        }
      } else if (this.dealStage.step === 'col2') {
        const nextIdx = Math.floor(this.dealStage.timer / frameStepMs);
        if (nextIdx >= 11) {
          this.dealStage.step = 'done';
          this.ctx?.audio.music.stop();
          this.ctx?.goTo('table', isEga ? 200 : 250);
        } else if (nextIdx !== this.dealStage.frameIdx) {
          this.dealStage.frameIdx = nextIdx;
          if (isEga) {
            this.f1FanSpr.texture = this.f1Col2Frames[nextIdx];
            if (nextIdx % 2 === 0) this.ctx?.audio.sfx.cardSlide();
          }
        }
      }

      // Raster 16-frame card-spring shuffle flourish for HD dealer synchronized to EGA F1 cadence
      if (!isEga && this.hdDealer) {
        let shuffleIdx = 0;
        if (this.dealStage.step === 'head') {
          const p = Math.min(1, this.dealStage.timer / headWaitMs);
          shuffleIdx = Math.min(4, Math.floor(p * 5));
        } else if (this.dealStage.step === 'col1') {
          const p = Math.min(1, this.dealStage.timer / (11 * frameStepMs));
          shuffleIdx = 5 + Math.min(7, Math.floor(p * 8));
        } else if (this.dealStage.step === 'pause') {
          const p = Math.min(1, this.dealStage.timer / pauseWaitMs);
          shuffleIdx = 13 + Math.min(2, Math.floor(p * 3));
        } else if (this.dealStage.step === 'col2') {
          const p = Math.min(1, this.dealStage.timer / (11 * frameStepMs));
          shuffleIdx = Math.max(0, 12 - Math.floor(p * 13));
        }
        this.hdDealer.setShuffleFrame(shuffleIdx);
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
    this.ctx?.input.setTextInputHitbox(null);
    this.ctx?.input.closeTextInput();
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
