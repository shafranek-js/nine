import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';
import { sliceMaskedTexture } from '../engine/BitmapFont';
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

/**
 * Intermediate black screen with the red dealer raising and lowering his top hat
 * between the `ZF_Nine` intro fanfare and the `TF_Nine` main club menu (`CS:5B14..5ECC`).
 */
export class DealerTransitionScene implements Scene {
  private ctx: GameContext | null = null;
  private dealerSprite: Sprite | null = null;
  private frames: Texture[] = [];
  private beatIndex = 0;
  private beatElapsedMs = 0;
  private finished = false;
  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.beatIndex = 0;
    this.beatElapsedMs = 0;
    this.finished = false;

    const bg = new Graphics();
    bg.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x000000);
    parent.addChild(bg);

    const zr = ctx.assets.sheets.ZR_NINE;
    const restRect = { x: 547, y: 167, w: 92, h: 60 } as const;
    // CS:5B4D loads TF_Nine.pcx palette where EGA index 5 is felt green (0,170,0), not ZR_Nine's (0,255,0).
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

    this.dealerSprite = new Sprite(this.frames[0]);
    this.dealerSprite.position.set(265, 130);
    parent.addChild(this.dealerSprite);

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

  update(dtMs: number): void {
    if (this.finished || !this.dealerSprite) return;
    this.beatElapsedMs += dtMs;

    while (this.beatIndex < DEALER_SEQUENCE.length) {
      const beat = DEALER_SEQUENCE[this.beatIndex];
      if (this.beatElapsedMs < beat.durationMs) {
        this.dealerSprite.texture = this.frames[beat.frame];
        return;
      }
      this.beatElapsedMs -= beat.durationMs;
      this.beatIndex++;
    }

    this.advanceToMenu(280);
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
    this.dealerSprite = null;
    this.frames = [];
    this.ctx = null;
  }
}
