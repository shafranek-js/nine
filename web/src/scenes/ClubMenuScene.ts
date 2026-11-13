import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { lookupPlayer } from '../core/persistence';
import { SCREEN_HEIGHT, SCREEN_WIDTH, type ClubTableId } from '../core/types';
import { sliceTexture } from '../engine/BitmapFont';
import type { GameContext, Scene } from './SceneManager';

type LoginPhase = 'idle' | 'enteringName' | 'enteringPassword';

interface AnimStep {
  frames: Texture[];
  elapsed: number;
  frameDurationMs: number;
  target: Sprite;
  onComplete: () => void;
}

const BUTTON_HITBOXES: readonly { id: 1 | 2 | 3 | 4 | 5; x: number; w: number }[] = [
  { id: 1, x: 0, w: 120 },
  { id: 2, x: 140, w: 118 },
  { id: 3, x: 278, w: 112 },
  { id: 4, x: 405, w: 120 },
  { id: 5, x: 542, w: 98 },
];

export class ClubMenuScene implements Scene {
  private ctx: GameContext | null = null;
  private root = new Container();

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

  private loginPhase: LoginPhase = 'idle';
  private pendingName = '';
  private pendingPassword = '';
  private existingPasswordToMatch: string | null = null;
  private existingScoreForMatch = 0;
  private autoLaunchAfterLogin = false;

  private inputBlocked = false;
  private cursorBlinkMs = 0;
  private activeAnim: AnimStep | null = null;
  private dealStage: { step: 'none' | 'head' | 'col1' | 'pause' | 'col2' | 'done'; timer: number; frameIdx: number } = {
    step: 'none',
    timer: 0,
    frameIdx: 0,
  };

  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.inputBlocked = false;
    this.loginPhase = 'idle';
    this.activeAnim = null;
    this.dealStage = { step: 'none', timer: 0, frameIdx: 0 };

    const tr = ctx.assets.sheets.TR_NINE;

    // Background TF_NINE
    this.root.addChild(new Sprite(ctx.assets.backgrounds.TF_NINE));

    // Leaderboard card blank textures for tables 1..3
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

    // Bottom icon sprites F2, F3, F4, F5
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

    // F4 Login prompt banner & white text input box
    this.bannerNewPlayerTex = sliceTexture(tr, 400, 199, 88, 9);
    this.bannerPasswordTex = sliceTexture(tr, 400, 209, 88, 9);

    this.bannerSpr = new Sprite(this.bannerNewPlayerTex);
    this.bannerSpr.position.set(192, 228);
    this.root.addChild(this.bannerSpr);

    this.root.addChild(this.inputLayer);
    this.root.addChild(this.cursorGfx);

    // F1 start-game clean black screen + dealer card-shuffling sprites (CS:38fa..39df)
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

    this.renderLeaderboard();
    this.renderPromptInput();

    parent.addChild(this.root);

    ctx.audio.music.play('menu');

    this.unbindKey = ctx.input.onKeyDown(this.handleKeyDown);
    this.unbindPtr = ctx.input.onPointerDown(this.handlePointerDown);
  }

  private renderLeaderboard(): void {
    if (!this.ctx) return;
    const tableId = this.ctx.config.clubTable;
    this.cardNameSpr.texture = this.cardNameTextures[tableId];
    this.cardScoreSpr.texture = this.cardScoreTextures[tableId];
    this.f3Spr.texture = this.f3Frames[tableId - 1];

    this.tableTextLayer.removeChildren();
    const rows = this.ctx.highScores[tableId];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const y = 116 + i * 10;
      const nameStr = row.name.slice(0, 8);
      this.tableTextLayer.addChild(
        this.ctx.menuFont.createText(nameStr, 195, y, { stepX: 10 }),
      );

      if (row.name !== 'Noname' || row.score !== 0) {
        const scoreStr = String(row.score).slice(0, 5).padStart(5, ' ');
        this.tableTextLayer.addChild(
          this.ctx.menuFont.createText(scoreStr, 361, y, { stepX: 10, blackDigits: true }),
        );
      }
    }
  }

  private renderPromptInput(): void {
    if (!this.ctx) return;
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
    this.dealBackdropGfx.visible = true;
    this.f1HeadSpr.visible = true;
    this.f1FanSpr.visible = false;
    this.dealStage = { step: 'head', timer: 0, frameIdx: 0 };
  }

  private triggerF2ToggleSound(): void {
    if (!this.ctx || this.inputBlocked || this.activeAnim) return;
    const nextEnabled = !this.ctx.config.soundMusicEnabled;
    this.ctx.config.soundMusicEnabled = nextEnabled;
    this.ctx.audio.setEnabled(nextEnabled);
    this.ctx.persistConfig();

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

  private handlePointerDown = (pt: { x: number; y: number }): void => {
    if (this.inputBlocked) return;

    // Clicking the prompt area starts/focuses F4 login
    if (pt.x >= 188 && pt.x <= 440 && pt.y >= 224 && pt.y <= 244) {
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
    // Active button animation
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

    // F1 Dealing coat/card-fan animation (CS:3915..39d9)
    if (this.dealStage.step !== 'none' && this.dealStage.step !== 'done') {
      this.dealStage.timer += dtMs;
      if (this.dealStage.step === 'head') {
        if (this.dealStage.timer >= 180) {
          this.dealStage.step = 'col1';
          this.dealStage.timer = 0;
          this.dealStage.frameIdx = 0;
          this.f1FanSpr.visible = true;
          this.f1FanSpr.texture = this.f1Col1Frames[0];
        }
      } else if (this.dealStage.step === 'col1') {
        const nextIdx = Math.floor(this.dealStage.timer / 45);
        if (nextIdx >= this.f1Col1Frames.length) {
          this.dealStage.step = 'pause';
          this.dealStage.timer = 0;
        } else if (nextIdx !== this.dealStage.frameIdx) {
          this.dealStage.frameIdx = nextIdx;
          this.f1FanSpr.texture = this.f1Col1Frames[nextIdx];
          if (nextIdx % 2 === 0) this.ctx?.audio.sfx.cardSlide();
        }
      } else if (this.dealStage.step === 'pause') {
        if (this.dealStage.timer >= 320) {
          this.dealStage.step = 'col2';
          this.dealStage.timer = 0;
          this.dealStage.frameIdx = 0;
          this.f1FanSpr.texture = this.f1Col2Frames[0];
        }
      } else if (this.dealStage.step === 'col2') {
        const nextIdx = Math.floor(this.dealStage.timer / 45);
        if (nextIdx >= this.f1Col2Frames.length) {
          this.dealStage.step = 'done';
          this.ctx?.audio.music.stop();
          this.ctx?.goTo('table', 250);
        } else if (nextIdx !== this.dealStage.frameIdx) {
          this.dealStage.frameIdx = nextIdx;
          this.f1FanSpr.texture = this.f1Col2Frames[nextIdx];
          if (nextIdx % 2 === 0) this.ctx?.audio.sfx.cardSlide();
        }
      }
    }

    // Blinking cursor in F4 prompt box
    this.cursorGfx.clear();
    if (this.loginPhase !== 'idle') {
      this.cursorBlinkMs += dtMs;
      if (Math.floor(this.cursorBlinkMs / 350) % 2 === 0) {
        const len = this.loginPhase === 'enteringName' ? this.pendingName.length : this.pendingPassword.length;
        const cx = 351 + Math.min(7, len) * 10;
        this.cursorGfx.rect(cx, 238, 8, 2).fill(0xaa0000);
      }
    }
  }

  unmount(): void {
    this.unbindKey?.();
    this.unbindPtr?.();
    this.unbindKey = null;
    this.unbindPtr = null;
  }
}
