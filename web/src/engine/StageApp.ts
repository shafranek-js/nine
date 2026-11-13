import { Application, Container, TextureStyle } from 'pixi.js';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';
import type { GraphicsMode } from './AssetManager';

export type AspectMode = '1:1' | '4:3';

/** Backing HiDPI scale factor (1920x1050 canvas for 640x350 logical units). */
export const HD_RENDER_SCALE = 3;

export class StageApp {
  readonly app: Application;
  readonly root: Container;
  private host: HTMLElement | null = null;
  private aspectMode: AspectMode = '4:3';
  private scanlinesEnabled = false;
  private graphicsMode: GraphicsMode = 'hd';
  private scanlineOverlay: HTMLDivElement | null = null;

  constructor() {
    TextureStyle.defaultOptions.scaleMode = 'linear';
    this.app = new Application();
    this.root = new Container();
  }

  async mount(host: HTMLElement): Promise<HTMLCanvasElement> {
    this.host = host;
    await this.app.init({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      resolution: HD_RENDER_SCALE,
      antialias: true,
      roundPixels: false,
      backgroundColor: 0x050709,
    });

    this.app.stage.addChild(this.root);

    const canvas = this.app.canvas;
    canvas.style.display = 'block';
    canvas.tabIndex = 0;

    host.innerHTML = '';
    host.appendChild(canvas);

    const overlay = document.createElement('div');
    overlay.className = 'ega-scanlines';
    overlay.style.display = 'none';
    host.appendChild(overlay);
    this.scanlineOverlay = overlay;

    this.applyGraphicsStyling();
    this.applyViewportFit();
    window.addEventListener('resize', this.onResize);
    return canvas;
  }

  setGraphicsMode(mode: GraphicsMode): void {
    this.graphicsMode = mode;
    this.applyGraphicsStyling();
  }

  getGraphicsMode(): GraphicsMode {
    return this.graphicsMode;
  }

  private applyGraphicsStyling(): void {
    const isEga = this.graphicsMode === 'ega';
    TextureStyle.defaultOptions.scaleMode = isEga ? 'nearest' : 'linear';
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.style.imageRendering = isEga ? 'pixelated' : 'auto';
    }
    this.host?.classList.toggle('mode-hd', !isEga);
    this.host?.classList.toggle('mode-ega', isEga);
  }

  private onResize = (): void => {
    this.applyViewportFit();
  };

  setAspectMode(mode: AspectMode): void {
    this.aspectMode = mode;
    this.applyViewportFit();
  }

  getAspectMode(): AspectMode {
    return this.aspectMode;
  }

  setScanlines(enabled: boolean): void {
    this.scanlinesEnabled = enabled;
    if (this.scanlineOverlay) {
      this.scanlineOverlay.style.display = enabled ? 'block' : 'none';
    }
  }

  isScanlinesEnabled(): boolean {
    return this.scanlinesEnabled;
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  applyViewportFit(): void {
    if (!this.host) return;
    const canvas = this.app.canvas;
    const targetAspect = this.aspectMode === '4:3' ? 4 / 3 : SCREEN_WIDTH / SCREEN_HEIGHT;

    const maxW = Math.max(320, window.innerWidth - 24);
    const maxH = Math.max(200, window.innerHeight - 64);

    let width = maxW;
    let height = width / targetAspect;
    if (height > maxH) {
      height = maxH;
      width = height * targetAspect;
    }

    const wPx = `${Math.floor(width)}px`;
    const hPx = `${Math.floor(height)}px`;
    this.host.style.width = wPx;
    this.host.style.height = hPx;
    canvas.style.width = wPx;
    canvas.style.height = hPx;
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.app.destroy(true, { children: true });
  }
}
