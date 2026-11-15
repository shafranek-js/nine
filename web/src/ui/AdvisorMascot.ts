export type AdvisorMascotMood = 'sleep' | 'idle' | 'recommend' | 'forced' | 'warnPass';

/**
 * Animated HD portrait controller for the Advisor mascot ("Советник")
 * living in the lower-right Coach card. Composites the generated transparent
 * HD illustration over an atmospheric casino spotlight that reacts to advice state.
 */
export class AdvisorMascot {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly sprite: HTMLImageElement;
  private spriteLoaded = false;
  private mood: AdvisorMascotMood = 'idle';
  private rafId = 0;
  private destroyed = false;
  private readonly widthCss = 92;
  private readonly heightCss = 96;
  private readonly dpr = 2.5;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'advisor-mascot-canvas';
    this.canvas.width = Math.round(this.widthCss * this.dpr);
    this.canvas.height = Math.round(this.heightCss * this.dpr);
    this.canvas.style.width = `${this.widthCss}px`;
    this.canvas.style.height = `${this.heightCss}px`;
    this.ctx = this.canvas.getContext('2d');

    this.sprite = new Image();
    this.sprite.decoding = 'async';
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
    this.sprite.src = './assets/hd/characters/advisor.png';

    this.startLoop();
  }

  setMood(mood: AdvisorMascotMood): void {
    this.mood = mood;
  }

  destroy(): void {
    this.destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private startLoop(): void {
    const tick = (now: number) => {
      if (this.destroyed) return;
      this.draw(now);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private draw(nowMs: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.widthCss;
    const h = this.heightCss;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Stage backdrop spotlight matching the casino felt & mahogany frame
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.44, 6, w * 0.5, h * 0.52, w * 0.68);
    if (this.mood === 'sleep') {
      bgGrad.addColorStop(0, '#18241d');
      bgGrad.addColorStop(1, '#080b09');
    } else if (this.mood === 'warnPass') {
      bgGrad.addColorStop(0, '#4d2b18');
      bgGrad.addColorStop(1, '#100a07');
    } else if (this.mood === 'recommend') {
      bgGrad.addColorStop(0, '#22593a');
      bgGrad.addColorStop(1, '#08120c');
    } else {
      bgGrad.addColorStop(0, '#25412e');
      bgGrad.addColorStop(1, '#090d0a');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle brass / emerald inner rim
    ctx.strokeStyle = this.mood === 'recommend' ? 'rgba(94, 238, 160, 0.38)' : 'rgba(218, 178, 86, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const t = nowMs * 0.001;
    const isSleeping = this.mood === 'sleep';
    const breathY = isSleeping ? Math.sin(t * 1.4) * 0.45 : Math.sin(t * 2.4) * 0.8;

    // 1. Draw the Advisor character *behind* the table rail
    if (this.spriteLoaded && this.sprite.naturalWidth > 0) {
      ctx.save();
      if (isSleeping) {
        ctx.filter = 'brightness(0.68) saturate(0.72)';
      } else if (this.mood === 'warnPass') {
        ctx.filter = 'brightness(0.96) sepia(0.14)';
      }

      const drawW = 86;
      const drawH = 86;
      const dx = (w - drawW) * 0.5;
      const dy = h - 4 - drawH + breathY;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.sprite, dx, dy, drawW, drawH);
      ctx.restore();
    }

    // 2. Foreground table ledge (mahogany wood -> gold trim -> green felt lip) over bottom edge
    const railY = h - 11;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, railY - 2, w, 3);
    ctx.fillStyle = '#3b2112';
    ctx.fillRect(0, railY, w, 5);
    ctx.fillStyle = '#c89e44';
    ctx.fillRect(0, railY + 5, w, 2);
    ctx.fillStyle = '#184b2c';
    ctx.fillRect(0, railY + 7, w, 4);

    // Subtle animated accent over the illustration
    if (this.mood === 'recommend') {
      // Soft golden glint pulsing over the star card in his gloved hand
      const pulse = 0.45 + 0.45 * Math.sin(t * 4.5);
      const sx = w * 0.63;
      const sy = h * 0.78 + breathY;
      const glow = ctx.createRadialGradient(sx, sy, 0.5, sx, sy, 10);
      glow.addColorStop(0, `rgba(255, 235, 138, ${0.55 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 235, 138, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (isSleeping) {
      const floatY = (t * 12) % 12;
      ctx.fillStyle = `rgba(218, 178, 86, ${0.85 - floatY / 15})`;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Z', w - 16, 20 - floatY);
    }

    ctx.restore();
  }
}
