import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';

export interface VirtualPoint {
  readonly x: number;
  readonly y: number;
}

export type KeyHandler = (e: KeyboardEvent) => void;
export type PointerHandler = (pt: VirtualPoint, e: PointerEvent) => void;

export class InputController {
  private readonly canvas: HTMLCanvasElement;
  private keyHandlers = new Set<KeyHandler>();
  private downHandlers = new Set<PointerHandler>();
  private moveHandlers = new Set<PointerHandler>();
  private unlockCallback: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('pointerdown', this.handleWindowPointerDown, true);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
  }

  onFirstGesture(cb: () => void): void {
    this.unlockCallback = cb;
  }

  onKeyDown(handler: KeyHandler): () => void {
    this.keyHandlers.add(handler);
    return () => this.keyHandlers.delete(handler);
  }

  onPointerDown(handler: PointerHandler): () => void {
    this.downHandlers.add(handler);
    return () => this.downHandlers.delete(handler);
  }

  onPointerMove(handler: PointerHandler): () => void {
    this.moveHandlers.add(handler);
    return () => this.moveHandlers.delete(handler);
  }

  toVirtualPoint(e: PointerEvent): VirtualPoint {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    const x = Math.max(0, Math.min(SCREEN_WIDTH - 1, Math.floor(((e.clientX - rect.left) / rect.width) * SCREEN_WIDTH)));
    const y = Math.max(0, Math.min(SCREEN_HEIGHT - 1, Math.floor(((e.clientY - rect.top) / rect.height) * SCREEN_HEIGHT)));
    return { x, y };
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.unlockCallback?.();
    for (const h of this.keyHandlers) {
      h(e);
    }
  };

  private handleWindowPointerDown = (): void => {
    this.unlockCallback?.();
  };

  private handlePointerDown = (e: PointerEvent): void => {
    this.unlockCallback?.();
    this.canvas.focus();
    const pt = this.toVirtualPoint(e);
    for (const h of this.downHandlers) {
      h(pt, e);
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const pt = this.toVirtualPoint(e);
    for (const h of this.moveHandlers) {
      h(pt, e);
    }
  };

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('pointerdown', this.handleWindowPointerDown, true);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.keyHandlers.clear();
    this.downHandlers.clear();
    this.moveHandlers.clear();
  }
}
