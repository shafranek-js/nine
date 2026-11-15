import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { getTranslations } from '../core/i18n';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';
import { sliceTexture } from '../engine/BitmapFont';
import {
  createHdIntroLogoSprite,
  createHdTextSprite,
  createHdTrumpeter,
  getWarmGlowTexture,
  type HdTrumpeterController,
} from '../engine/hdCharacters';
import type { GameContext, Scene } from './SceneManager';

interface TrumpeterSlot {
  readonly col: number;
  readonly x: number;
  readonly y: number;
}

const TRUMPETERS: readonly TrumpeterSlot[] = [
  { col: 0, x: 20, y: 169 },
  { col: 1, x: 98, y: 237 },
  { col: 2, x: 445, y: 237 },
  { col: 3, x: 523, y: 169 },
];

// Pong cycle raising and lowering the trumpets (`CS:43B1..46E5`)
const TRUMPET_SEQUENCE = [0, 1, 2, 3, 4, 4, 3, 2, 1, 0];

interface SparkleParticle {
  readonly gfx: Graphics;
  vx: number;
  vy: number;
  lifeMs: number;
  maxLifeMs: number;
}

export class IntroScene implements Scene {
  private ctx: GameContext | null = null;
  private parent: Container | null = null;
  private viewRoot = new Container();

  // EGA visuals
  private trumpetSprites: Sprite[] = [];
  private trumpetFrames: Texture[][] = [];

  // HD visuals
  private hdTrumpeters: HdTrumpeterController[] = [];
  private hdSpotlight: Sprite | null = null;
  private hdPromptText: Sprite | null = null;
  private sparkleLayer: Container | null = null;
  private sparkles: SparkleParticle[] = [];
  private sparkleSpawnAccumMs = 0;

  private elapsedMs = 0;
  private skipDone = false;
  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.parent = parent;
    this.elapsedMs = 0;
    this.skipDone = false;

    parent.addChild(this.viewRoot);
    this.buildVisuals();

    ctx.audio.music.play('intro');

    this.unbindKey = ctx.input.onKeyDown((e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('F') || e.key.length === 1) {
        e.preventDefault();
        this.advanceToDealer();
      }
    });
    this.unbindPtr = ctx.input.onPointerDown(() => {
      this.advanceToDealer();
    });
  }

  onGraphicsModeChanged(): void {
    this.buildVisuals();
  }

  onLanguageChanged(): void {
    if (this.ctx?.getGraphicsMode() === 'hd') {
      this.buildVisuals();
    }
  }

  private buildVisuals(): void {
    if (!this.ctx || !this.parent) return;
    this.viewRoot.removeChildren();
    this.trumpetSprites = [];
    this.trumpetFrames = [];
    this.hdTrumpeters = [];
    this.hdSpotlight = null;
    this.hdPromptText = null;
    this.sparkleLayer = null;
    this.sparkles = [];

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.buildEgaVisuals(this.ctx);
    } else {
      this.buildHdVisuals(this.ctx);
    }
  }

  private buildEgaVisuals(ctx: GameContext): void {
    const bg = new Sprite(ctx.assets.backgrounds.ZF_NINE);
    this.viewRoot.addChild(bg);

    const zr = ctx.assets.sheets.ZR_NINE;
    for (const slot of TRUMPETERS) {
      const frames: Texture[] = [];
      for (let row = 0; row < 5; row++) {
        frames.push(sliceTexture(zr, 1 + slot.col * 98, 1 + row * 67, 97, 66));
      }
      this.trumpetFrames.push(frames);

      const spr = new Sprite(frames[0]);
      spr.position.set(slot.x, slot.y);
      this.viewRoot.addChild(spr);
      this.trumpetSprites.push(spr);
    }
  }

  private buildHdVisuals(ctx: GameContext): void {
    const bg = new Sprite(ctx.assets.hdBackgrounds.intro);
    bg.width = SCREEN_WIDTH;
    bg.height = SCREEN_HEIGHT;
    this.viewRoot.addChild(bg);

    // Subtle dark header/footer readability bands
    const frameOverlay = new Graphics();
    frameOverlay.rect(0, 0, SCREEN_WIDTH, 42).fill({ color: 0x050608, alpha: 0.48 });
    frameOverlay.rect(0, SCREEN_HEIGHT - 44, SCREEN_WIDTH, 44).fill({ color: 0x050608, alpha: 0.52 });
    this.viewRoot.addChild(frameOverlay);

    // Warm animated spotlight glow behind Monte Carlo skyline & top hat
    const glow = new Sprite(getWarmGlowTexture());
    glow.anchor.set(0.5);
    glow.position.set(SCREEN_WIDTH * 0.5, 190);
    glow.scale.set(5.2, 3.4);
    glow.blendMode = 'add';
    glow.alpha = 0.25;
    this.viewRoot.addChild(glow);
    this.hdSpotlight = glow;

    // Crisp Art-Deco header & Monte Carlo title
    const copy1 = createHdTextSprite('COPYRIGHT (C) GAMOS, 1993. RUSSIA. ALL RIGHTS RESERVED.', 520, 16, {
      font: '600 8.5px Georgia, "Times New Roman", serif',
      fill: '#f0dfba',
      align: 'center',
      shadowColor: 'rgba(0,0,0,0.85)',
      shadowBlur: 3,
    });
    copy1.anchor.set(0.5);
    copy1.position.set(SCREEN_WIDTH * 0.5, 13);
    this.viewRoot.addChild(copy1);

    const copy2 = createHdTextSprite('GAMOS LOGICAL SERIAL  •  ISSUE NO. FOUR', 440, 14, {
      font: '500 7.5px "Segoe UI", system-ui, sans-serif',
      fill: '#c8b48a',
      align: 'center',
      shadowColor: 'rgba(0,0,0,0.85)',
      shadowBlur: 3,
    });
    copy2.anchor.set(0.5);
    copy2.position.set(SCREEN_WIDTH * 0.5, 25);
    this.viewRoot.addChild(copy2);

    this.viewRoot.addChild(createHdIntroLogoSprite(ctx.assets.hdBanners.monteCarlo, SCREEN_WIDTH * 0.5, 81, 456, 114));

    // Sparkle particle layer behind/around trumpeters
    this.sparkleLayer = new Container();
    this.viewRoot.addChild(this.sparkleLayer);

    for (let i = 0; i < TRUMPETERS.length; i++) {
      const slot = TRUMPETERS[i];
      const trumpeter = createHdTrumpeter(i, slot.x, slot.y);
      this.viewRoot.addChild(trumpeter.container);
      this.hdTrumpeters.push(trumpeter);
    }

    const credits = createHdTextSprite(
      'PROGRAMMING: OLEG DEMIN   •   ORIGINAL GRAPHICS: IGOR IVKIN & OLEG DEMIN',
      580,
      16,
      {
        font: '600 8px "Segoe UI", system-ui, sans-serif',
        fill: '#dfcfa8',
        align: 'center',
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowBlur: 3,
      },
    );
    credits.anchor.set(0.5);
    credits.position.set(SCREEN_WIDTH * 0.5, 319);
    this.viewRoot.addChild(credits);

    const promptText = getTranslations(ctx.getLanguage()).scenes.introPrompt;
    const prompt = createHdTextSprite(promptText, 420, 16, {
      font: '600 8.5px Georgia, "Times New Roman", serif',
      fill: '#ffe49e',
      align: 'center',
      shadowColor: 'rgba(0,0,0,0.9)',
      shadowBlur: 4,
    });
    prompt.anchor.set(0.5);
    prompt.position.set(SCREEN_WIDTH * 0.5, 335);
    this.viewRoot.addChild(prompt);
    this.hdPromptText = prompt;
  }

  update(dtMs: number): void {
    if (this.skipDone || !this.ctx) return;
    this.elapsedMs += dtMs;

    if (this.ctx.getGraphicsMode() === 'ega') {
      const tIdx = TRUMPET_SEQUENCE[Math.floor(this.elapsedMs / 130) % TRUMPET_SEQUENCE.length];
      for (let i = 0; i < this.trumpetSprites.length; i++) {
        this.trumpetSprites[i].texture = this.trumpetFrames[i][tIdx];
      }
    } else {
      const raise01 = 0.5 - 0.5 * Math.cos((this.elapsedMs / 1300) * Math.PI * 2);
      for (const tr of this.hdTrumpeters) {
        tr.setProgress(raise01, this.elapsedMs);
      }

      if (this.hdSpotlight) {
        this.hdSpotlight.alpha = 0.22 + Math.sin(this.elapsedMs * 0.003) * 0.06;
      }
      if (this.hdPromptText) {
        this.hdPromptText.alpha = 0.65 + 0.35 * Math.sin(this.elapsedMs * 0.005);
      }

      // Emit delicate brass sparkles when trumpets rise high
      if (this.sparkleLayer) {
        this.sparkleSpawnAccumMs += dtMs;
        if (raise01 > 0.62 && this.sparkleSpawnAccumMs >= 95) {
          this.sparkleSpawnAccumMs = 0;
          const tr = this.hdTrumpeters[Math.floor(Math.random() * this.hdTrumpeters.length)];
          if (tr) {
            const bell = tr.getBellPosition();
            const g = new Graphics();
            g.circle(0, 0, 1.4 + Math.random() * 1.4).fill(0xffe680);
            g.position.set(bell.x, bell.y);
            this.sparkleLayer.addChild(g);
            this.sparkles.push({
              gfx: g,
              vx: (bell.x < SCREEN_WIDTH * 0.5 ? 1 : -1) * (16 + Math.random() * 24),
              vy: -14 - Math.random() * 22,
              lifeMs: 0,
              maxLifeMs: 550 + Math.random() * 300,
            });
          }
        }
        const dtSec = dtMs / 1000;
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
          const p = this.sparkles[i];
          p.lifeMs += dtMs;
          const u = p.lifeMs / p.maxLifeMs;
          p.gfx.x += p.vx * dtSec;
          p.gfx.y += p.vy * dtSec;
          p.gfx.alpha = Math.max(0, 1 - u);
          if (u >= 1) {
            this.sparkleLayer.removeChild(p.gfx);
            p.gfx.destroy();
            this.sparkles.splice(i, 1);
          }
        }
      }
    }

    // Auto-advance after full ~15.6s fanfare (`CS:43B1` 70-beat loop -> `CS:5B14`)
    if (this.elapsedMs >= 15800) {
      this.advanceToDealer();
    }
  }

  private advanceToDealer(): void {
    if (this.skipDone || !this.ctx) return;
    this.skipDone = true;
    this.ctx.goTo('dealer', 300);
  }

  unmount(): void {
    this.unbindKey?.();
    this.unbindPtr?.();
    this.unbindKey = null;
    this.unbindPtr = null;
  }
}
