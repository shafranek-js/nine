import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';
import { sliceMaskedTexture } from '../engine/BitmapFont';
import {
  createHdDealer,
  createHdTextSprite,
  getWarmGlowTexture,
  type HdDealerController,
} from '../engine/hdCharacters';
import type { GameContext, Scene } from './SceneManager';

interface DealerBeat {
  readonly frame: number;
  readonly durationMs: number;
}

// Exact DOS post-intro sequence (NINE_MAIN_CODE.asm CS:5B52..5E87):
// 0 -> 1..4 (hat raise, 120ms/step) -> 5 (hat extended hold during TR_Nine load) -> 4..0 (hat lowered)
const DEALER_SEQUENCE: readonly DealerBeat[] = [
  { frame: 0, durationMs: 120 },
  { frame: 1, durationMs: 120 },
  { frame: 2, durationMs: 120 },
  { frame: 3, durationMs: 120 },
  { frame: 4, durationMs: 120 },
  { frame: 5, durationMs: 720 },
  { frame: 4, durationMs: 120 },
  { frame: 3, durationMs: 120 },
  { frame: 2, durationMs: 120 },
  { frame: 1, durationMs: 120 },
  { frame: 0, durationMs: 120 },
];

const TOTAL_DEALER_DURATION_MS = DEALER_SEQUENCE.reduce((sum, b) => sum + b.durationMs, 0);

/**
 * Intermediate screen with the red dealer raising and lowering his top hat
 * between the intro fanfare and the main club menu (`CS:5B14..5ECC`).
 */
export class DealerTransitionScene implements Scene {
  private ctx: GameContext | null = null;
  private viewRoot = new Container();

  private dealerSprite: Sprite | null = null;
  private frames: Texture[] = [];

  private hdDealer: HdDealerController | null = null;
  private hdCaption: Sprite | null = null;
  private hdTotalElapsedMs = 0;

  private beatIndex = 0;
  private beatElapsedMs = 0;
  private finished = false;
  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.beatIndex = 0;
    this.beatElapsedMs = 0;
    this.hdTotalElapsedMs = 0;
    this.finished = false;
    ctx.audio.music.stop();
    ctx.audio.music.playStinger('welcome');

    parent.addChild(this.viewRoot);
    this.buildVisuals();

    this.unbindKey = ctx.input.onKeyDown((e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('F') || e.key.length === 1) {
        e.preventDefault();
        this.advanceToMenu(220);
      }
    });
    this.unbindPtr = ctx.input.onPointerDown(() => {
      this.advanceToMenu(220);
    });
  }

  onGraphicsModeChanged(): void {
    this.buildVisuals();
  }

  private buildVisuals(): void {
    if (!this.ctx) return;
    this.viewRoot.removeChildren();
    this.dealerSprite = null;
    this.frames = [];
    this.hdDealer = null;
    this.hdCaption = null;

    if (this.ctx.getGraphicsMode() === 'ega') {
      this.buildEgaVisuals(this.ctx);
    } else {
      this.buildHdVisuals();
    }
  }

  private buildEgaVisuals(ctx: GameContext): void {
    const bg = new Graphics();
    bg.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x000000);
    this.viewRoot.addChild(bg);

    const zr = ctx.assets.sheets.ZR_NINE;
    const restRect = { x: 547, y: 167, w: 92, h: 60 } as const;
    const tfGreenLedgeRemap = [{ from: [0, 255, 0] as const, to: [0, 170, 0, 255] as const }];

    this.frames = [
      sliceMaskedTexture(zr, restRect.x, restRect.y, restRect.w, restRect.h, {
        remapRgb: tfGreenLedgeRemap,
      }),
    ];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        this.frames.push(
          sliceMaskedTexture(zr, 403 + c * 79, 228 + r * 61, 78, 60, {
            baseRect: restRect,
            remapRgb: tfGreenLedgeRemap,
          }),
        );
      }
    }

    const currentFrame = DEALER_SEQUENCE[this.beatIndex]?.frame ?? 0;
    this.dealerSprite = new Sprite(this.frames[currentFrame] ?? this.frames[0]);
    this.dealerSprite.position.set(265, 130);
    this.viewRoot.addChild(this.dealerSprite);
  }

  private buildHdVisuals(): void {
    const bg = new Graphics();
    bg.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x06070a);
    this.viewRoot.addChild(bg);

    const glow = new Sprite(getWarmGlowTexture());
    glow.anchor.set(0.5);
    glow.position.set(SCREEN_WIDTH * 0.5, 165);
    glow.scale.set(3.2, 2.4);
    glow.alpha = 0.42;
    glow.blendMode = 'add';
    this.viewRoot.addChild(glow);

    const dealer = createHdDealer(1.42);
    dealer.container.position.set(SCREEN_WIDTH * 0.5 - 42, 136);
    this.viewRoot.addChild(dealer.container);
    this.hdDealer = dealer;

    const caption = createHdTextSprite('WELCOME TO THE NINE CLUB', 340, 22, {
      font: '600 11px Georgia, "Times New Roman", serif',
      fill: ['#fff1bd', '#d49a24'],
      align: 'center',
      shadowColor: 'rgba(0,0,0,0.85)',
      shadowBlur: 4,
    });
    caption.anchor.set(0.5);
    caption.position.set(SCREEN_WIDTH * 0.5, 228);
    this.viewRoot.addChild(caption);
    this.hdCaption = caption;
  }

  update(dtMs: number): void {
    if (this.finished || !this.ctx) return;

    this.hdTotalElapsedMs += dtMs;
    if (this.hdDealer) {
      const progress01 = Math.min(1, this.hdTotalElapsedMs / TOTAL_DEALER_DURATION_MS);
      this.hdDealer.setHatTipProgress(progress01);
      if (this.hdCaption) {
        this.hdCaption.alpha = Math.sin(progress01 * Math.PI);
      }
    }

    this.beatElapsedMs += dtMs;
    const currentBeat = DEALER_SEQUENCE[this.beatIndex];
    if (!currentBeat) {
      this.advanceToMenu(220);
      return;
    }

    if (this.beatElapsedMs >= currentBeat.durationMs) {
      this.beatElapsedMs -= currentBeat.durationMs;
      this.beatIndex++;
      if (this.beatIndex >= DEALER_SEQUENCE.length) {
        this.advanceToMenu(220);
        return;
      }
      if (this.dealerSprite) {
        this.dealerSprite.texture = this.frames[DEALER_SEQUENCE[this.beatIndex].frame] ?? this.frames[0];
      }
    }
  }

  private advanceToMenu(fadeMs: number): void {
    if (this.finished || !this.ctx) return;
    this.finished = true;
    this.ctx.goTo('menu', fadeMs);
  }

  unmount(): void {
    this.unbindKey?.();
    this.unbindPtr?.();
    this.unbindKey = null;
    this.unbindPtr = null;
  }
}
