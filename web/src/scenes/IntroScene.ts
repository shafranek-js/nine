import { Container, Sprite, type Texture } from 'pixi.js';
import { sliceTexture } from '../engine/BitmapFont';
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

export class IntroScene implements Scene {
  private ctx: GameContext | null = null;
  private trumpetSprites: Sprite[] = [];
  private trumpetFrames: Texture[][] = [];
  private elapsedMs = 0;
  private skipDone = false;
  private unbindKey: (() => void) | null = null;
  private unbindPtr: (() => void) | null = null;

  mount(parent: Container, ctx: GameContext): void {
    this.ctx = ctx;
    this.elapsedMs = 0;
    this.skipDone = false;

    const bg = new Sprite(ctx.assets.backgrounds.ZF_NINE);
    parent.addChild(bg);

    const zr = ctx.assets.sheets.ZR_NINE;

    this.trumpetFrames = [];
    this.trumpetSprites = [];
    for (const slot of TRUMPETERS) {
      const frames: Texture[] = [];
      for (let row = 0; row < 5; row++) {
        frames.push(sliceTexture(zr, 1 + slot.col * 98, 1 + row * 67, 97, 66));
      }
      this.trumpetFrames.push(frames);

      const spr = new Sprite(frames[0]);
      spr.position.set(slot.x, slot.y);
      parent.addChild(spr);
      this.trumpetSprites.push(spr);
    }

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

  update(dtMs: number): void {
    if (this.skipDone) return;
    this.elapsedMs += dtMs;

    const tIdx = TRUMPET_SEQUENCE[Math.floor(this.elapsedMs / 130) % TRUMPET_SEQUENCE.length];
    for (let i = 0; i < this.trumpetSprites.length; i++) {
      this.trumpetSprites[i].texture = this.trumpetFrames[i][tIdx];
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
