import { Container, Sprite, type Texture } from 'pixi.js';
import { sliceMaskedTexture, sliceTexture } from '../engine/BitmapFont';
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

// Pong cycle raising and lowering the trumpets
const TRUMPET_SEQUENCE = [0, 1, 2, 3, 4, 4, 3, 2, 1, 0];
const DEALER_SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];

export class IntroScene implements Scene {
  private ctx: GameContext | null = null;
  private trumpetSprites: Sprite[] = [];
  private trumpetFrames: Texture[][] = [];
  private dealerSprite: Sprite | null = null;
  private dealerFrames: Texture[] = [];
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

    // Center red dealer hat-raise sprite (mask black transparent so it sits cleanly behind table/logo)
    this.dealerFrames = [sliceMaskedTexture(zr, 547, 167, 92, 60)];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        this.dealerFrames.push(sliceMaskedTexture(zr, 403 + c * 79, 228 + r * 61, 78, 60));
      }
    }

    this.dealerSprite = new Sprite(this.dealerFrames[0]);
    this.dealerSprite.position.set(277, 86);
    parent.addChild(this.dealerSprite);

    ctx.audio.music.play('intro');

    this.unbindKey = ctx.input.onKeyDown((e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('F') || e.key.length === 1) {
        e.preventDefault();
        this.skipToMenu();
      }
    });
    this.unbindPtr = ctx.input.onPointerDown(() => {
      this.skipToMenu();
    });
  }

  update(dtMs: number): void {
    if (this.skipDone) return;
    this.elapsedMs += dtMs;

    const tIdx = TRUMPET_SEQUENCE[Math.floor(this.elapsedMs / 130) % TRUMPET_SEQUENCE.length];
    for (let i = 0; i < this.trumpetSprites.length; i++) {
      this.trumpetSprites[i].texture = this.trumpetFrames[i][tIdx];
    }

    if (this.dealerSprite) {
      const dStep = Math.floor(this.elapsedMs / 180) % (DEALER_SEQUENCE.length + 6);
      const dIdx = dStep < DEALER_SEQUENCE.length ? DEALER_SEQUENCE[dStep] : 0;
      this.dealerSprite.texture = this.dealerFrames[dIdx];
      this.dealerSprite.position.set(dIdx === 0 ? 270 : 284, 86);
    }

    // Auto-advance after full ~15.6s fanfare
    if (this.elapsedMs >= 15800) {
      this.skipToMenu();
    }
  }

  private skipToMenu(): void {
    if (this.skipDone || !this.ctx) return;
    this.skipDone = true;
    this.ctx.goTo('menu', 220);
  }

  unmount(): void {
    this.unbindKey?.();
    this.unbindPtr?.();
    this.unbindKey = null;
    this.unbindPtr = null;
  }
}
