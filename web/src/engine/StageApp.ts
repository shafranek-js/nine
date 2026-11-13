import { Application, Container, TextureStyle } from 'pixi.js';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/types';

export type AspectMode = '1:1' | '4:3';

export class StageApp {
  readonly app: Application;
  readonly root: Container;
  private host: HTMLElement | null = null;
  private aspectMode: AspectMode = '1:1';
  private scanlinesEnabled = false;
  private scanlineOverlay: HTMLDivElement | null = null;

  constructor() {
    TextureStyle.defaultOptions.scaleMode = 'nearest';
    this.app = new Application();
    this.root = new Container();
  }

  async mount(host: HTMLElement): Promise<HTMLCanvasElement> {
    this.host = host;
    await this.app.init({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      resolution: 1,
      antialias: false,
      roundPixels: true,
      backgroundColor: 0x000000,
    });

    this.app.stage.addChild(this.root);

    const canvas = this.app.canvas;
    canvas.style.imageRendering = 'pixelated';
    canvas.style.display = 'block';
    canvas.tabIndex = 0;

    host.innerHTML = '';
    host.appendChild(canvas);

    const overlay = document.createElement('div');
    overlay.className = 'ega-scanlines';
    overlay.style.display = 'none';
    host.appendChild(overlay);
    this.scanlineOverlay = overlay;

    this.applyViewportFit();
    window.addEventListener('resize', this.onResize);
    return canvas;
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
