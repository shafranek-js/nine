import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';

export interface VirtualPoint {
  readonly x: number;
  readonly y: number;
}

export type KeyHandler = (e: KeyboardEvent) => void;
export type PointerHandler = (pt: VirtualPoint, e: PointerEvent) => void;
export type TextInputChangeHandler = (value: string) => void;
export type TextInputKeyHandler = (action: 'submit' | 'cancel') => void;

export interface TextInputConfig {
  readonly value: string;
  readonly maxLength: number;
  readonly isPassword?: boolean;
  readonly onChange: TextInputChangeHandler;
  readonly onAction: TextInputKeyHandler;
}

export interface TextInputHitbox {
  /** Virtual rect `{ x, y, w, h }` in 640x350 stage coordinates for direct tap-to-focus on Android/iOS. */
  readonly virtualRect: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly onFocusTap: () => void;
}

export class InputController {
  private readonly canvas: HTMLCanvasElement;
  private readonly hiddenInput: HTMLInputElement;
  private activeTextConfig: TextInputConfig | null = null;
  private activeHitbox: TextInputHitbox | null = null;
  private keyHandlers = new Set<KeyHandler>();
  private downHandlers = new Set<PointerHandler>();
  private moveHandlers = new Set<PointerHandler>();
  private unlockCallback: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.hiddenInput = this.createHiddenTextInput();
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('pointerdown', this.handleWindowPointerDown, true);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
  }

  private createHiddenTextInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'none';
    input.spellcheck = false;
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('aria-label', 'Player name or password');
    // Positioned over the prompt region inside the stage host, transparent so Android/iOS soft keyboards open reliably
    Object.assign(input.style, {
      position: 'absolute',
      left: '53%',
      top: '70%',
      width: '20%',
      height: '5%',
      opacity: '0.001',
      pointerEvents: 'none',
      zIndex: '10',
      fontSize: '16px', // >= 16px prevents iOS/Android mobile viewport auto-zoom on focus
      border: 'none',
      outline: 'none',
      padding: '0',
      margin: '0',
      background: 'transparent',
      color: 'transparent',
      caretColor: 'transparent',
    });

    input.addEventListener('input', () => {
      if (!this.activeTextConfig) return;
      const sliced = input.value.slice(0, this.activeTextConfig.maxLength);
      if (input.value !== sliced) {
        input.value = sliced;
      }
      this.activeTextConfig.onChange(sliced);
    });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.activeTextConfig) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.activeTextConfig.onAction('submit');
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.activeTextConfig.onAction('cancel');
        return;
      }
      // Prevent window keydown from double-processing characters that the native <input> handles via its 'input' event
      e.stopPropagation();
    });

    input.addEventListener('focus', () => {
      if (!this.activeTextConfig && this.activeHitbox) {
        this.activeHitbox.onFocusTap();
      }
    });

    input.addEventListener('pointerdown', () => {
      this.unlockCallback?.();
      if (!this.activeTextConfig && this.activeHitbox) {
        this.activeHitbox.onFocusTap();
      }
    });

    const host = this.canvas.parentElement ?? document.body;
    host.appendChild(input);
    return input;
  }

  /**
   * Registers (or clears) a direct tap hitbox over the prompt field on the stage so tapping the prompt box on
   * Android / iOS lands directly on the native `<input>` element, guaranteeing soft-keyboard activation.
   */
  setTextInputHitbox(hitbox: TextInputHitbox | null): void {
    this.activeHitbox = hitbox;
    if (hitbox) {
      const r = hitbox.virtualRect;
      this.hiddenInput.style.left = `${(r.x / SCREEN_WIDTH) * 100}%`;
      this.hiddenInput.style.top = `${(r.y / SCREEN_HEIGHT) * 100}%`;
      this.hiddenInput.style.width = `${(r.w / SCREEN_WIDTH) * 100}%`;
      this.hiddenInput.style.height = `${(r.h / SCREEN_HEIGHT) * 100}%`;
      this.hiddenInput.style.pointerEvents = 'auto';
    } else if (!this.activeTextConfig) {
      this.hiddenInput.style.pointerEvents = 'none';
    }
  }

  /**
   * Opens and focuses the native mobile/desktop text input so Android & iOS soft keyboards appear immediately.
   * Must be called synchronously inside a user gesture handler (`pointerdown` / `keydown`) for mobile browsers.
   */
  openTextInput(config: TextInputConfig): void {
    this.activeTextConfig = config;
    this.hiddenInput.maxLength = config.maxLength;
    this.hiddenInput.enterKeyHint = config.isPassword ? 'done' : 'next';
    this.hiddenInput.value = config.value;
    this.hiddenInput.style.pointerEvents = 'auto';
    try {
      this.hiddenInput.focus({ preventScroll: true });
      const len = this.hiddenInput.value.length;
      this.hiddenInput.setSelectionRange(len, len);
    } catch {
      this.hiddenInput.focus();
    }
  }

  /** Updates the current native input value without losing soft-keyboard focus (e.g. when switching from Name -> Password). */
  syncTextInputValue(value: string, isPassword = false): void {
    if (this.activeTextConfig) {
      this.activeTextConfig = { ...this.activeTextConfig, value, isPassword };
    }
    this.hiddenInput.enterKeyHint = isPassword ? 'done' : 'next';
    if (this.hiddenInput.value !== value) {
      this.hiddenInput.value = value;
    }
    if (this.activeTextConfig) {
      try {
        this.hiddenInput.focus({ preventScroll: true });
        const len = value.length;
        this.hiddenInput.setSelectionRange(len, len);
      } catch {
        // Ignore selection errors on restricted mobile WebViews
      }
    }
  }

  closeTextInput(): void {
    this.activeTextConfig = null;
    this.hiddenInput.value = '';
    this.hiddenInput.style.pointerEvents = this.activeHitbox ? 'auto' : 'none';
    if (typeof document !== 'undefined' && document.activeElement === this.hiddenInput) {
      this.hiddenInput.blur();
      this.canvas.focus({ preventScroll: true });
    }
  }

  isTextInputActive(): boolean {
    return this.activeTextConfig !== null;
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
    const pt = this.toVirtualPoint(e);
    for (const h of this.downHandlers) {
      h(pt, e);
    }
    if (this.activeTextConfig) {
      // Prevent default on canvas pointerdown when opening/focusing the text input so the browser's
      // subsequent default mouse/touch focus step does not steal focus back from hiddenInput to canvas!
      e.preventDefault();
      try {
        this.hiddenInput.focus({ preventScroll: true });
      } catch {
        this.hiddenInput.focus();
      }
    } else {
      this.canvas.focus({ preventScroll: true });
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
    this.hiddenInput.remove();
    this.keyHandlers.clear();
    this.downHandlers.clear();
    this.moveHandlers.clear();
  }
}
