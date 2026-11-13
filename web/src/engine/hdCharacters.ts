import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { createHdTexture } from './hdCards';

export interface HdTextOptions {
  readonly font?: string;
  readonly fill?: string | readonly [string, string];
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly align?: CanvasTextAlign;
  readonly shadowColor?: string;
  readonly shadowBlur?: number;
  readonly shadowOffsetY?: number;
  readonly letterSpacing?: number;
}

const textCache = new Map<string, Texture>();

export function createHdTextTexture(text: string, w: number, h: number, opts: HdTextOptions = {}): Texture {
  const fillKey = Array.isArray(opts.fill) ? opts.fill.join('-') : (opts.fill ?? '#fff');
  const key = `${text}|${w}x${h}|${opts.font ?? ''}|${fillKey}|${opts.stroke ?? ''}|${opts.align ?? 'left'}`;
  const cached = textCache.get(key);
  if (cached) return cached;

  const tex = createHdTexture(w, h, (ctx) => {
    const font = opts.font ?? '600 11px "Segoe UI", system-ui, sans-serif';
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = opts.align ?? 'left';

    const drawX = opts.align === 'center' ? w * 0.5 : opts.align === 'right' ? w - 2 : 2;
    const drawY = h * 0.5;

    if (opts.shadowColor) {
      ctx.shadowColor = opts.shadowColor;
      ctx.shadowBlur = opts.shadowBlur ?? 4;
      ctx.shadowOffsetY = opts.shadowOffsetY ?? 1.5;
    }

    if (opts.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opts.strokeWidth ?? 2.4;
      ctx.strokeStyle = opts.stroke;
      ctx.strokeText(text, drawX, drawY);
    }

    if (typeof opts.fill === 'string' || !opts.fill) {
      ctx.fillStyle = opts.fill ?? '#f6edd9';
    } else {
      const grad = ctx.createLinearGradient(0, 2, 0, h - 2);
      grad.addColorStop(0, opts.fill[0]);
      grad.addColorStop(1, opts.fill[1]);
      ctx.fillStyle = grad;
    }
    ctx.fillText(text, drawX, drawY);
  });

  if (textCache.size < 300) {
    textCache.set(key, tex);
  }
  return tex;
}

export function createHdTextSprite(text: string, w: number, h: number, opts: HdTextOptions = {}): Sprite {
  return new Sprite(createHdTextTexture(text, w, h, opts));
}

let cachedGlowTex: Texture | null = null;
export function getWarmGlowTexture(): Texture {
  if (cachedGlowTex) return cachedGlowTex;
  cachedGlowTex = createHdTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 1, w * 0.5, h * 0.5, w * 0.5);
    g.addColorStop(0, 'rgba(255, 224, 145, 0.72)');
    g.addColorStop(0.35, 'rgba(255, 166, 62, 0.34)');
    g.addColorStop(0.75, 'rgba(210, 96, 20, 0.08)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return cachedGlowTex;
}

let cachedCoinTex: Texture | null = null;
export function getHdCoinTexture(): Texture {
  if (cachedCoinTex) return cachedCoinTex;
  cachedCoinTex = createHdTexture(24, 24, (ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const r = 9.5;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.arc(cx + 0.6, cy + 1.2, r, 0, Math.PI * 2);
    ctx.fill();

    const outer = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    outer.addColorStop(0, '#fff2a6');
    outer.addColorStop(0.45, '#e8b339');
    outer.addColorStop(1, '#99650b');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#5c3c05';
    ctx.stroke();

    const inner = ctx.createRadialGradient(cx - 2.5, cy - 2.5, 1, cx, cy, r * 0.75);
    inner.addColorStop(0, '#ffe885');
    inner.addColorStop(0.7, '#d4961c');
    inner.addColorStop(1, '#a8700d');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff5bd';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.fillStyle = '#6b4506';
    ctx.font = 'bold 9.5px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 0.5);
  });
  return cachedCoinTex;
}

let cachedCandelabraTex: Texture | null = null;
export function getHdCandelabraTexture(): Texture {
  if (cachedCandelabraTex) return cachedCandelabraTex;
  cachedCandelabraTex = createHdTexture(44, 42, (ctx) => {
    const brassGrad = ctx.createLinearGradient(6, 12, 38, 40);
    brassGrad.addColorStop(0, '#ffe896');
    brassGrad.addColorStop(0.45, '#d19b2e');
    brassGrad.addColorStop(1, '#7a520d');

    ctx.strokeStyle = '#301d03';
    ctx.fillStyle = brassGrad;
    ctx.lineWidth = 1;

    // Base pedestal & curved arms
    ctx.beginPath();
    ctx.moveTo(12, 39);
    ctx.quadraticCurveTo(22, 35, 32, 39);
    ctx.lineTo(30, 41);
    ctx.lineTo(14, 41);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central stem
    ctx.fillRect(20.5, 16, 3, 22);
    ctx.strokeRect(20.5, 16, 3, 22);

    // Side curved arms
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#d19b2e';
    ctx.beginPath();
    ctx.moveTo(8, 20);
    ctx.quadraticCurveTo(10, 31, 22, 30);
    ctx.quadraticCurveTo(34, 31, 36, 20);
    ctx.stroke();

    // Brass cups
    for (const [cx, cy] of [
      [8, 20],
      [22, 15],
      [36, 20],
    ]) {
      ctx.fillStyle = brassGrad;
      ctx.strokeStyle = '#301d03';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ivory wax candle
      const wax = ctx.createLinearGradient(cx - 2.5, cy - 10, cx + 2.5, cy);
      wax.addColorStop(0, '#fffdf5');
      wax.addColorStop(1, '#dfd1b4');
      ctx.fillStyle = wax;
      ctx.fillRect(cx - 2.3, cy - 10, 4.6, 10);
      ctx.strokeRect(cx - 2.3, cy - 10, 4.6, 10);

      // Wick
      ctx.strokeStyle = '#24180c';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy - 12);
      ctx.stroke();
    }
  });
  return cachedCandelabraTex;
}

export interface TrumpeterTheme {
  readonly light: string;
  readonly main: string;
  readonly dark: string;
  readonly facingRight: boolean;
}

const TRUMPETER_THEMES: readonly TrumpeterTheme[] = [
  { light: '#ff6bff', main: '#d11cc9', dark: '#6e0768', facingRight: true },
  { light: '#e8eef5', main: '#9aa4b2', dark: '#48515e', facingRight: true },
  { light: '#6cff8c', main: '#16c941', dark: '#076b20', facingRight: false },
  { light: '#ff6e66', main: '#de1d1d', dark: '#730707', facingRight: false },
];

export interface HdTrumpeterController {
  readonly container: Container;
  setProgress(raise01: number, elapsedMs: number): void;
  getBellPosition(): { x: number; y: number };
}

export function createHdTrumpeter(slotIdx: number, baseX: number, baseY: number): HdTrumpeterController {
  const theme = TRUMPETER_THEMES[slotIdx % TRUMPETER_THEMES.length];
  const dir = theme.facingRight ? 1 : -1;

  const container = new Container();
  container.position.set(baseX + 48, baseY + 33);

  // Soft stage contact shadow
  const shadow = new Graphics();
  shadow.ellipse(0, 27, 26, 5).fill({ color: 0x000000, alpha: 0.45 });
  container.addChild(shadow);

  // Body sprite rendered smoothly at 3x
  const bodyTex = createHdTexture(76, 68, (ctx) => {
    const cx = 38;
    const cy = 35;

    // Curly hair tuft on head
    ctx.strokeStyle = theme.main;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx + dir * 2, cy - 23, 4.5, 0.2, Math.PI * 1.65);
    ctx.stroke();

    // Boots
    for (const bx of [cx - 12, cx + 12]) {
      const bootG = ctx.createRadialGradient(bx - 2, cy + 22, 1, bx, cy + 24, 9);
      bootG.addColorStop(0, theme.light);
      bootG.addColorStop(0.55, theme.main);
      bootG.addColorStop(1, theme.dark);
      ctx.fillStyle = bootG;
      ctx.strokeStyle = '#140c0a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(bx, cy + 24, 8.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Spherical body
    const bodyG = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy + 2, 26);
    bodyG.addColorStop(0, theme.light);
    bodyG.addColorStop(0.55, theme.main);
    bodyG.addColorStop(1, theme.dark);
    ctx.fillStyle = bodyG;
    ctx.strokeStyle = '#140c0a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 24, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rim highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 21, -2.3, -0.9);
    ctx.stroke();

    // Gold belt + buckle
    ctx.strokeStyle = '#e6b137';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(cx - 21.5, cy + 9);
    ctx.quadraticCurveTo(cx, cy + 14.5, cx + 21.5, cy + 9);
    ctx.stroke();
    ctx.fillStyle = '#ffe680';
    ctx.strokeStyle = '#382506';
    ctx.lineWidth = 1;
    ctx.fillRect(cx - 4.5, cy + 7.5, 9, 6.5);
    ctx.strokeRect(cx - 4.5, cy + 7.5, 9, 6.5);

    // Eyes
    for (const ex of [cx - 4, cx + 4]) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(ex, cy - 7, 3.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(ex + dir * 0.9, cy - 6.7, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheek nose
    ctx.fillStyle = theme.light;
    ctx.strokeStyle = '#140c0a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(cx + dir * 2, cy - 2, 4.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const bodyRig = new Container();
  const bodySpr = new Sprite(bodyTex);
  bodySpr.anchor.set(0.5);
  bodyRig.addChild(bodySpr);

  // Brass trumpet rig pivoted near mouth
  const trumpetTex = createHdTexture(44, 24, (ctx) => {
    const g = ctx.createLinearGradient(0, 4, 0, 20);
    g.addColorStop(0, '#fff2a6');
    g.addColorStop(0.5, '#e8a825');
    g.addColorStop(1, '#8c5607');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#2d1a03';
    ctx.lineWidth = 0.9;

    if (theme.facingRight) {
      ctx.beginPath();
      ctx.moveTo(4, 10);
      ctx.lineTo(28, 9);
      ctx.lineTo(39, 3);
      ctx.lineTo(40, 21);
      ctx.lineTo(28, 15);
      ctx.lineTo(4, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Bell rim shine
      ctx.fillStyle = '#fffae0';
      ctx.beginPath();
      ctx.ellipse(39.5, 12, 2.2, 8.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(40, 10);
      ctx.lineTo(16, 9);
      ctx.lineTo(5, 3);
      ctx.lineTo(4, 21);
      ctx.lineTo(16, 15);
      ctx.lineTo(40, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fffae0';
      ctx.beginPath();
      ctx.ellipse(4.5, 12, 2.2, 8.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  const trumpetPivot = new Container();
  trumpetPivot.position.set(dir * 5, 2);
  const trumpetSpr = new Sprite(trumpetTex);
  trumpetSpr.anchor.set(theme.facingRight ? 0.1 : 0.9, 0.5);
  trumpetPivot.addChild(trumpetSpr);
  bodyRig.addChild(trumpetPivot);

  container.addChild(bodyRig);

  let currentRaise = 0;

  return {
    container,
    setProgress(raise01: number, elapsedMs: number) {
      currentRaise = raise01;
      const bounce = Math.sin(elapsedMs * 0.005 + slotIdx * 1.1) * 1.4;
      bodyRig.position.y = bounce - raise01 * 2;
      bodyRig.scale.set(1 + raise01 * 0.03, 1 - Math.abs(Math.sin(elapsedMs * 0.01)) * 0.02);
      // Tilt trumpet smoothly from lowered (+0.48 rad) to high fanfare (-0.52 rad)
      const angle = (0.48 - raise01 * 1.0) * dir;
      trumpetPivot.rotation = angle;
    },
    getBellPosition() {
      const angle = (0.48 - currentRaise * 1.0) * dir;
      const dist = 34;
      return {
        x: container.x + dir * 5 + Math.cos(angle) * dist * dir,
        y: container.y + 2 + Math.sin(angle) * dist * dir,
      };
    },
  };
}

function drawTopHat(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Hat crown
  const crownG = ctx.createLinearGradient(-15, -24, 15, -2);
  crownG.addColorStop(0, '#5a6270');
  crownG.addColorStop(0.32, '#c8d1de');
  crownG.addColorStop(0.55, '#464d59');
  crownG.addColorStop(1, '#151820');
  ctx.fillStyle = crownG;
  ctx.strokeStyle = '#0c0d10';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-14, -4);
  ctx.lineTo(-16, -24);
  ctx.quadraticCurveTo(0, -27, 16, -24);
  ctx.lineTo(14, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Silk hatband
  ctx.fillStyle = '#181920';
  ctx.fillRect(-14.2, -9, 28.4, 4.5);

  // Curved brim
  const brimG = ctx.createLinearGradient(-24, -4, 24, 2);
  brimG.addColorStop(0, '#2a2e38');
  brimG.addColorStop(0.4, '#8b95a5');
  brimG.addColorStop(1, '#151820');
  ctx.fillStyle = brimG;
  ctx.beginPath();
  ctx.ellipse(0, -3.5, 24, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export interface HdDealerController {
  readonly container: Container;
  setTableExpression(mode: 'idle' | 'blink' | 'bell' | 'wag', elapsedMs: number): void;
  setHatTipProgress(progress01: number): void;
}

export function createHdDealer(scale = 1): HdDealerController {
  const container = new Container();
  container.scale.set(scale);

  const makeBodyTex = (blinking: boolean) =>
    createHdTexture(66, 46, (ctx) => {
      const cx = 33;
      const cy = 28;

      // Felt ledge strip
      ctx.fillStyle = '#166e32';
      ctx.fillRect(4, 39, 58, 4);
      ctx.fillStyle = '#c9982e';
      ctx.fillRect(4, 42.5, 58, 1.5);

      // Crimson tuxedo torso
      const suitG = ctx.createRadialGradient(cx - 6, cy - 4, 3, cx, cy + 4, 28);
      suitG.addColorStop(0, '#eb343d');
      suitG.addColorStop(0.55, '#b8141c');
      suitG.addColorStop(1, '#59070b');
      ctx.fillStyle = suitG;
      ctx.strokeStyle = '#140808';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 26, 40);
      ctx.quadraticCurveTo(cx - 20, 12, cx, 12);
      ctx.quadraticCurveTo(cx + 20, 12, cx + 26, 40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tuxedo lapels + white shirt V + satin bow tie
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 6, 26);
      ctx.lineTo(cx, 38);
      ctx.lineTo(cx + 6, 26);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#171920';
      ctx.beginPath();
      ctx.moveTo(cx - 10, 25);
      ctx.lineTo(cx - 5, 25);
      ctx.lineTo(cx, 39);
      ctx.closePath();
      ctx.moveTo(cx + 10, 25);
      ctx.lineTo(cx + 5, 25);
      ctx.lineTo(cx, 39);
      ctx.closePath();
      ctx.fill();

      // Bow tie
      ctx.fillStyle = '#101116';
      ctx.strokeStyle = '#383d4a';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(cx - 7, 26);
      ctx.lineTo(cx, 29.5);
      ctx.lineTo(cx - 7, 33);
      ctx.closePath();
      ctx.moveTo(cx + 7, 26);
      ctx.lineTo(cx, 29.5);
      ctx.lineTo(cx + 7, 33);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, 29.5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      if (blinking) {
        ctx.strokeStyle = '#140808';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(cx - 6.5, 19);
        ctx.lineTo(cx - 1.5, 19);
        ctx.moveTo(cx + 1.5, 19);
        ctx.lineTo(cx + 6.5, 19);
        ctx.stroke();
      } else {
        for (const ex of [cx - 3.6, cx + 3.6]) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#140808';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(ex, 18.5, 3, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.arc(ex, 18.8, 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rosy round nose + white handlebar mustache
      ctx.strokeStyle = '#f5f0e4';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, 23.5);
      ctx.quadraticCurveTo(cx - 5, 26, cx - 9, 23);
      ctx.moveTo(cx, 23.5);
      ctx.quadraticCurveTo(cx + 5, 26, cx + 9, 23);
      ctx.stroke();

      ctx.fillStyle = '#ff626a';
      ctx.strokeStyle = '#140808';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(cx, 21.8, 3.4, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

  const openTex = makeBodyTex(false);
  const blinkTex = makeBodyTex(true);
  const bodySpr = new Sprite(openTex);
  bodySpr.anchor.set(0.5, 0.88);
  bodySpr.position.set(30, 38);
  container.addChild(bodySpr);

  const hatTex = createHdTexture(52, 32, (ctx) => {
    drawTopHat(ctx, 26, 28, 0.92);
  });
  const hatPivot = new Container();
  hatPivot.position.set(30, 12);
  const hatSpr = new Sprite(hatTex);
  hatSpr.anchor.set(0.5, 0.9);
  hatPivot.addChild(hatSpr);
  container.addChild(hatPivot);

  // Optional bell & wag arm overlays
  const bellTex = createHdTexture(24, 26, (ctx) => {
    const g = ctx.createLinearGradient(4, 2, 18, 22);
    g.addColorStop(0, '#fff299');
    g.addColorStop(0.5, '#e0a522');
    g.addColorStop(1, '#8a5b08');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#2d1c03';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.quadraticCurveTo(8, 6, 12, 5);
    ctx.quadraticCurveTo(16, 6, 16, 16);
    ctx.lineTo(19, 20);
    ctx.lineTo(5, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5c3c05';
    ctx.fillRect(11, 2, 2, 3);
  });
  const bellSpr = new Sprite(bellTex);
  bellSpr.anchor.set(0.5, 0.2);
  bellSpr.position.set(7, 10);
  bellSpr.visible = false;
  container.addChild(bellSpr);

  const fingerTex = createHdTexture(18, 26, (ctx) => {
    ctx.fillStyle = '#e6333d';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(7, 3, 4.5, 16, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff9aa0';
    ctx.beginPath();
    ctx.ellipse(9.2, 5.5, 2.2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const fingerSpr = new Sprite(fingerTex);
  fingerSpr.anchor.set(0.5, 0.9);
  fingerSpr.position.set(8, 28);
  fingerSpr.visible = false;
  container.addChild(fingerSpr);

  return {
    container,
    setTableExpression(mode, elapsedMs) {
      bellSpr.visible = mode === 'bell';
      fingerSpr.visible = mode === 'wag';
      bodySpr.texture = mode === 'blink' ? blinkTex : openTex;
      hatPivot.position.set(30, 12 + Math.sin(elapsedMs * 0.004) * 0.4);
      hatPivot.rotation = 0;

      if (mode === 'bell') {
        bellSpr.rotation = Math.sin(elapsedMs * 0.036) * 0.48;
      } else if (mode === 'wag') {
        fingerSpr.rotation = Math.sin(elapsedMs * 0.035) * 0.36;
      }
    },
    setHatTipProgress(progress01: number) {
      bellSpr.visible = false;
      fingerSpr.visible = false;
      // Smooth bell curve lift: 0 -> 1 -> 0
      const lift = Math.sin(Math.min(1, Math.max(0, progress01)) * Math.PI);
      bodySpr.texture = progress01 > 0.42 && progress01 < 0.6 ? blinkTex : openTex;
      hatPivot.position.set(30 - lift * 12, 12 - lift * 15);
      hatPivot.rotation = -lift * 0.36;
    },
  };
}

export type RivalAnimMode = 'idle' | 'impatient' | 'think' | 'play' | 'pass' | 'winRound' | 'loseRound';

export interface HdRivalController {
  readonly container: Container;
  setState(
    mode: RivalAnimMode,
    elapsedMs: number,
    lookTarget?: { x: number; y: number } | null,
    dtMs?: number,
  ): void;
}

let hdRivalArtMap: Map<string, HTMLImageElement> = new Map();

/** Registers preloaded illustrated HD rival body/hat artwork overlays. */
export function setHdRivalArt(artMap: Map<string, HTMLImageElement>): void {
  hdRivalArtMap = artMap;
}

export function createHdRival(side: 'left' | 'right'): HdRivalController {
  const container = new Container();
  const dir = side === 'left' ? 1 : -1;
  const isLeft = side === 'left';
  const anchorScreenX = isLeft ? 57 : 569;
  const anchorScreenY = 122;

  const bodyImg = hdRivalArtMap.get(`${side}_body`) ?? hdRivalArtMap.get(side);
  const hatImg = hdRivalArtMap.get(`${side}_hat`);
  const impatientSheetImg = hdRivalArtMap.get(`${side}_impatient_sheet`);
  const hasCustomBody = Boolean(bodyImg && bodyImg.complete && bodyImg.naturalWidth > 0);
  const hasCustomHat = Boolean(hatImg && hatImg.complete && hatImg.naturalWidth > 0);
  const hasImpatientSheet = Boolean(impatientSheetImg && impatientSheetImg.complete && impatientSheetImg.naturalWidth > 0);

  const palette = isLeft
    ? {
        light: '#f37aff',
        main: '#ab20c9',
        dark: '#4e085c',
        lapel: '#290736',
        lapelTrim: '#e5ba56',
        tie: '#151822',
        tieAccent: '#ffe282',
        rim: 'rgba(255, 220, 255, 0.34)',
      }
    : {
        light: '#ea5cff',
        main: '#8a14a3',
        dark: '#3b0547',
        lapel: '#21052b',
        lapelTrim: '#d4425c',
        tie: '#300b1e',
        tieAccent: '#ff708c',
        rim: 'rgba(255, 200, 248, 0.28)',
      };

  // Fixed emerald felt & brass pedestal rail at bottom (y = 40..46)
  const ledgeTex = createHdTexture(84, 9, (ctx) => {
    const g = ctx.createLinearGradient(0, 1, 0, 6);
    g.addColorStop(0, '#229648');
    g.addColorStop(0.55, '#156830');
    g.addColorStop(1, '#0c3f1d');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#071f0e';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(2, 1, 80, 5, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d4a33b';
    ctx.fillRect(3, 6.2, 78, 1.8);
  });
  const ledgeSpr = new Sprite(ledgeTex);
  ledgeSpr.anchor.set(0.5, 0);
  ledgeSpr.position.set(38, 39);

  // Body pivot anchored cleanly on the rail center (38, 41) for natural tilt, lean & squash/stretch
  const bodyPivot = new Container();
  bodyPivot.position.set(38, 41);

  const bodyW = hasCustomBody && bodyImg ? 64 : 80;
  const bodyH = hasCustomBody && bodyImg ? bodyW * (bodyImg.naturalHeight / bodyImg.naturalWidth) : 52;

  const torsoTex =
    hasCustomBody && bodyImg
      ? Texture.from(bodyImg)
      : createHdTexture(80, 52, (ctx) => {
          const cx = 40;
          const cy = 32;

          // Tailored kolobok velvet tuxedo silhouette (rich painterly shading + dark ink outline)
          const suitG = ctx.createRadialGradient(cx - dir * 6, cy - 8, 4, cx, cy + 4, 32);
          suitG.addColorStop(0, palette.light);
          suitG.addColorStop(0.52, palette.main);
          suitG.addColorStop(1, palette.dark);
          ctx.fillStyle = suitG;
          ctx.strokeStyle = '#140619';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cx - 29, 49);
          ctx.bezierCurveTo(cx - 29, 25, cx - 17, 13, cx, 13);
          ctx.bezierCurveTo(cx + 17, 13, cx + 29, 25, cx + 29, 49);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Soft top rim highlight
          ctx.strokeStyle = palette.rim;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, 31, 18.5, -2.35, -0.78);
          ctx.stroke();

          // Crisp pleated white tuxedo shirt V + waistcoat border
          ctx.fillStyle = '#fcfaf2';
          ctx.strokeStyle = '#1b1622';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(cx - 7.5, 31);
          ctx.lineTo(cx, 48);
          ctx.lineTo(cx + 7.5, 31);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Silk tuxedo lapels flanking the shirt V
          ctx.fillStyle = palette.lapel;
          ctx.strokeStyle = palette.lapelTrim;
          ctx.lineWidth = 0.75;
          for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(cx + sx * 12.5, 31.5);
            ctx.lineTo(cx + sx * 7, 30.5);
            ctx.lineTo(cx, 48);
            ctx.lineTo(cx + sx * 10, 46);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // Silk bow tie + pearl/ruby pin
          ctx.fillStyle = palette.tie;
          ctx.strokeStyle = '#0e0812';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(cx - 7.5, 30);
          ctx.lineTo(cx, 33);
          ctx.lineTo(cx - 7.5, 36.2);
          ctx.closePath();
          ctx.moveTo(cx + 7.5, 30);
          ctx.lineTo(cx, 33);
          ctx.lineTo(cx + 7.5, 36.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = palette.tieAccent;
          ctx.beginPath();
          ctx.arc(cx, 33.1, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Subtle mischievous smile & nose shadow
          ctx.strokeStyle = '#2d0638';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(cx + dir * 0.6, 27.6, 5.2, 0.25, Math.PI - 0.25);
          ctx.stroke();

          // Right rival's distinguished curled mustache
          if (!isLeft) {
            ctx.fillStyle = '#33083d';
            ctx.strokeStyle = '#15041a';
            ctx.lineWidth = 0.7;
            for (const sx of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(cx, 27);
              ctx.quadraticCurveTo(cx + sx * 5.5, 25, cx + sx * 9.5, 28.2);
              ctx.quadraticCurveTo(cx + sx * 11, 26.8, cx + sx * 10.2, 25.4);
              ctx.quadraticCurveTo(cx + sx * 5.5, 29.2, cx, 28.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          }

          // Glossy kolobok button nose
          const noseG = ctx.createRadialGradient(cx + dir * 0.2 - 1, 24.4, 0.6, cx + dir * 0.5, 25.3, 4.4);
          noseG.addColorStop(0, '#ffb0ff');
          noseG.addColorStop(0.55, palette.light);
          noseG.addColorStop(1, palette.dark);
          ctx.fillStyle = noseG;
          ctx.strokeStyle = '#16061b';
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.ellipse(cx + dir * 0.5, 25.3, 3.8, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.beginPath();
          ctx.ellipse(cx + dir * 0.5 - 1.1, 24.5, 1.1, 0.55, -0.3, 0, Math.PI * 2);
          ctx.fill();
        });

  if (hasCustomBody) {
    torsoTex.source.scaleMode = 'linear';
  }
  const torsoSpr = new Sprite(torsoTex);
  torsoSpr.anchor.set(0.5, 1);
  torsoSpr.position.set(0, 2);
  if (hasCustomBody) {
    torsoSpr.width = bodyW;
    torsoSpr.height = bodyH;
  }
  bodyPivot.addChild(torsoSpr);

  // Expressive Eye & Brow Rig (tracks flying cards/players, blinks & squints inside illustrated sclera)
  const faceRig = new Container();
  faceRig.position.set(0, hasCustomBody ? 0 : -24);
  bodyPivot.addChild(faceRig);

  const eyeRadiusX = hasCustomBody ? 5.1 : 3.2;
  const eyeRadiusY = hasCustomBody ? 5.0 : 3.5;
  const customEyes = [
    { x: -0.0844 * bodyW, y: 2 - 0.789 * bodyH, rx: 0.078 * bodyW, ry: 0.087 * bodyH },
    { x: 0.090 * bodyW, y: 2 - 0.788 * bodyH, rx: 0.083 * bodyW, ry: 0.085 * bodyH },
  ];
  const eyeOffsets = [-3.9, 3.9];
  const pupils: Sprite[] = [];
  const eyelidTops: Graphics[] = [];
  const brows: Graphics[] = [];

  const scleraTex = createHdTexture(10, 10, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#16061b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(5, 5, 3.2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const pupilTex = createHdTexture(8, 8, (ctx) => {
    const r = hasCustomBody ? 2.1 : 1.55;
    ctx.fillStyle = '#0c0c12';
    ctx.beginPath();
    ctx.arc(4, 4, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4 - r * 0.4, 4 - r * 0.42, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 2; i++) {
    const eyeC = new Container();
    const rx = hasCustomBody ? customEyes[i].rx : eyeRadiusX;
    const ry = hasCustomBody ? customEyes[i].ry : eyeRadiusY;

    if (hasCustomBody) {
      eyeC.position.set(customEyes[i].x, customEyes[i].y);
      const maskGfx = new Graphics().ellipse(0, 0, rx * 0.96, ry * 0.92).fill(0xffffff);
      eyeC.addChild(maskGfx);
      eyeC.mask = maskGfx;
    } else {
      eyeC.position.set(eyeOffsets[i] + dir * 0.5, 0);
      const scleraSpr = new Sprite(scleraTex);
      scleraSpr.anchor.set(0.5);
      eyeC.addChild(scleraSpr);
    }

    const pupilSpr = new Sprite(pupilTex);
    pupilSpr.anchor.set(0.5);
    eyeC.addChild(pupilSpr);
    pupils.push(pupilSpr);

    const lid = new Graphics();
    eyeC.addChild(lid);
    eyelidTops.push(lid);

    if (!hasCustomBody) {
      const brow = new Graphics();
      brow.moveTo(-3.2, -4.6).quadraticCurveTo(0, -5.8, 3.2, -4.4).stroke({ color: '#1a0621', width: 1.1 });
      eyeC.addChild(brow);
      brows.push(brow);
    }

    faceRig.addChild(eyeC);
  }

  // Procedural monocle only when falling back to procedural torso
  if (isLeft && !hasCustomBody) {
    const monocleTex = createHdTexture(16, 20, (ctx) => {
      ctx.strokeStyle = '#d4a33b';
      ctx.lineWidth = 1.05;
      ctx.fillStyle = 'rgba(180, 235, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(6, 6, 4.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(3.6, 4.2);
      ctx.lineTo(5.6, 2.5);
      ctx.stroke();
      ctx.strokeStyle = '#caa042';
      ctx.lineWidth = 0.7;
      ctx.setLineDash([1.1, 0.9]);
      ctx.beginPath();
      ctx.moveTo(1.8, 7.2);
      ctx.quadraticCurveTo(0.8, 13.5, 4.2, 18.5);
      ctx.stroke();
    });
    const monocleSpr = new Sprite(monocleTex);
    monocleSpr.position.set(eyeOffsets[0] + dir * 0.5 - 6, -6);
    faceRig.addChild(monocleSpr);
  }

  // Articulated Top Hat on top of kolobok head (lifts on celebration, tilts on think, dips on pass)
  const hatPivot = new Container();
  const baseHatRot = hasCustomHat ? 0 : dir * 0.045;
  const hatBaseY = hasCustomHat ? -38.0 : -29;
  hatPivot.position.set(0, hatBaseY);
  hatPivot.rotation = baseHatRot;

  const hatTex =
    hasCustomHat && hatImg
      ? Texture.from(hatImg)
      : createHdTexture(56, 34, (ctx) => {
          drawTopHat(ctx, 28, 30, 0.92);
          ctx.fillStyle = isLeft ? '#d4a33b' : '#9c1c3e';
          ctx.fillRect(15.2, 22, 25.6, 3.2);
        });
  if (hasCustomHat) {
    hatTex.source.scaleMode = 'linear';
  }
  const hatSpr = new Sprite(hatTex);
  hatSpr.anchor.set(0.5, hasCustomHat ? 0.92 : 0.88);
  if (hasCustomHat && hatImg) {
    const hatW = 53;
    hatSpr.width = hatW;
    hatSpr.height = hatW * (hatImg.naturalHeight / hatImg.naturalWidth);
  }
  hatPivot.addChild(hatSpr);
  bodyPivot.addChild(hatPivot);

  // Skin-matched hand & 4 articulated drumming fingers (magenta kolobok skin + white shirt cuff when custom art is used)
  const outerHandTex = createHdTexture(16, 14, (ctx) => {
    ctx.fillStyle = hasCustomBody ? '#e816bf' : '#fcf8ef';
    ctx.strokeStyle = '#18091e';
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.ellipse(8, 7, 5.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (hasCustomBody) {
      ctx.fillStyle = 'rgba(255, 220, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(7.2, 5.7, 2.2, 1.0, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(130, 115, 140, 0.55)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(6.5, 5.2);
      ctx.lineTo(9.5, 5.8);
      ctx.moveTo(6.5, 7.8);
      ctx.lineTo(9.5, 8);
      ctx.stroke();
    }
  });
  const outerArmRig = new Container();
  outerArmRig.position.set(-dir * 16, -6);
  const outerHandSpr = new Sprite(outerHandTex);
  outerHandSpr.anchor.set(0.5);
  outerArmRig.addChild(outerHandSpr);
  outerArmRig.visible = !hasCustomBody;
  bodyPivot.addChild(outerArmRig);

  // Inner Table Arm + 4 Individually Articulated Drumming Fingers on the green rail (homage to 1993 frames 2..5)
  const innerArmRig = new Container();
  const restArmX = 38 + dir * 26.5;
  const restArmY = 39.2;
  innerArmRig.position.set(restArmX, restArmY);

  if (hasCustomBody) {
    // Crisp white shirt cuff peeking from sleeve behind palm
    const cuffTex = createHdTexture(8, 10, (ctx) => {
      ctx.fillStyle = '#fcfaf2';
      ctx.strokeStyle = '#18091e';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.roundRect(1, 1.5, 5.5, 6.8, 1.8);
      ctx.fill();
      ctx.stroke();
    });
    const cuffSpr = new Sprite(cuffTex);
    cuffSpr.anchor.set(0.5);
    cuffSpr.position.set(-dir * 6.8, -0.5);
    innerArmRig.addChild(cuffSpr);
  }

  const palmSpr = new Sprite(outerHandTex);
  palmSpr.anchor.set(0.5);
  palmSpr.scale.set(0.88, 0.8);
  palmSpr.position.set(-dir * 3, -1);
  innerArmRig.addChild(palmSpr);

  const fingerTex = createHdTexture(6, 8, (ctx) => {
    ctx.fillStyle = hasCustomBody ? '#ef26cb' : '#fcf8ef';
    ctx.strokeStyle = '#18091e';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.roundRect(1, 0.8, 3.6, 6.2, 1.8);
    ctx.fill();
    ctx.stroke();
  });
  const fingers: Sprite[] = [];
  for (let f = 0; f < 4; f++) {
    const fspr = new Sprite(fingerTex);
    fspr.anchor.set(0.5, 0.15);
    fspr.position.set(dir * (1.2 + f * 2.5), -1.8);
    innerArmRig.addChild(fspr);
    fingers.push(fspr);
  }

  // Layer order: body behind ledge rail, tapping inner hand & fingers resting right ON TOP of ledge rail
  container.addChild(bodyPivot);
  container.addChild(ledgeSpr);
  container.addChild(innerArmRig);

  // Optional 16-frame AI sprite sheet for the signature impatient finger-drumming animation
  const impatientFrames: Texture[] = [];
  let impatientSpr: Sprite | null = null;
  if (hasImpatientSheet && impatientSheetImg) {
    const baseTex = Texture.from(impatientSheetImg);
    baseTex.source.scaleMode = 'linear';
    const cw = Math.floor(impatientSheetImg.naturalWidth / 4);
    const ch = Math.floor(impatientSheetImg.naturalHeight / 4);
    for (let idx = 0; idx < 16; idx++) {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      impatientFrames.push(new Texture({ source: baseTex.source, frame: new Rectangle(col * cw, row * ch, cw, ch) }));
    }
    impatientSpr = new Sprite(impatientFrames[0]);
    const scaleToIdle = isLeft ? 64 / 258 : 64 / 241;
    impatientSpr.width = cw * scaleToIdle;
    impatientSpr.height = ch * scaleToIdle;
    impatientSpr.anchor.set(isLeft ? 0.5034 : 0.5375, isLeft ? 0.9824 : 0.996);
    impatientSpr.position.set(38, 43.2);
    impatientSpr.visible = false;
    container.addChild(impatientSpr);
  }

  // Smooth spring state for 60fps interpolation
  let curPupilX = dir * 0.8;
  let curPupilY = 0;
  let curSquint = 0;
  let curBodyY = 0;
  let curBodyRot = 0;
  let curScaleY = 1;
  let curHatLift = 0;
  let curHatRot = baseHatRot;
  let curPlayReach = 0;
  let curArmShow = hasCustomBody ? 0 : 1;
  let impatientTimerMs = 0;

  return {
    container,
    setState(mode, elapsedMs, lookTarget, dtMs = 16.6) {
      if (impatientSpr && impatientFrames.length === 16 && mode === 'impatient') {
        impatientTimerMs += dtMs;
        const introFrameMs = 130;
        const loopFrameMs = 155;
        const introTotalMs = 5 * introFrameMs;
        const frameIdx =
          impatientTimerMs < introTotalMs
            ? Math.min(4, Math.floor(impatientTimerMs / introFrameMs))
            : 5 + (Math.floor((impatientTimerMs - introTotalMs) / loopFrameMs) % 11);
        impatientSpr.texture = impatientFrames[frameIdx];
        impatientSpr.visible = true;
        bodyPivot.visible = false;
        innerArmRig.visible = false;
        return;
      }

      impatientTimerMs = 0;
      if (impatientSpr) {
        impatientSpr.visible = false;
      }
      bodyPivot.visible = true;
      const lerpFactor = Math.min(1, dtMs / 75);

      // Compute pupil aim vector toward target on table
      const maxPupilX = hasCustomBody ? 2.1 : 1.45;
      const maxPupilY = hasCustomBody ? 1.55 : 1.25;
      let targetPX = dir * (hasCustomBody ? 1.05 : 0.85);
      let targetPY = 0.15;
      if (lookTarget) {
        const dx = lookTarget.x - anchorScreenX;
        const dy = lookTarget.y - anchorScreenY;
        const len = Math.hypot(dx, dy) || 1;
        targetPX = Math.max(-maxPupilX, Math.min(maxPupilX, (dx / len) * maxPupilX));
        targetPY = Math.max(-maxPupilY * 0.8, Math.min(maxPupilY, (dy / len) * maxPupilY));
      } else if (mode === 'think') {
        targetPX = Math.sin(elapsedMs * 0.008) * (maxPupilX * 0.85);
        targetPY = -0.5;
      } else if (mode === 'impatient') {
        targetPX = dir * (maxPupilX * 0.65);
        targetPY = maxPupilY * 0.72;
      }
      curPupilX += (targetPX - curPupilX) * lerpFactor;
      curPupilY += (targetPY - curPupilY) * lerpFactor;

      // Natural blinking (~every 3.4s) + emotion eye squint
      const blinkPhase = (elapsedMs + (isLeft ? 0 : 1450)) % 3400;
      const isBlinking = blinkPhase > 3230;
      let targetSquint = 0;
      let targetBodyY = Math.sin(elapsedMs * 0.0028 + (isLeft ? 0 : 1.9)) * 0.6;
      let targetBodyRot = 0;
      let targetScaleY = 1 + Math.sin(elapsedMs * 0.0028 + (isLeft ? 0 : 1.9)) * 0.015;
      let targetHatLift = 0;
      let targetHatRot = baseHatRot;
      let targetPlayReach = 0;
      let browTilt = 0;
      let browLift = 0;

      if (mode === 'think') {
        targetSquint = 0.34;
        targetBodyRot = dir * 0.04;
        targetHatRot = baseHatRot - dir * 0.07 + Math.sin(elapsedMs * 0.012) * 0.04;
        browTilt = 0.16;
        browLift = -0.3;
      } else if (mode === 'impatient') {
        targetSquint = 0.22;
        targetBodyY = Math.sin(elapsedMs * 0.005) * 0.5;
        targetBodyRot = dir * 0.03;
        browTilt = 0.22;
        browLift = -0.5;
      } else if (mode === 'play') {
        targetBodyY = -2;
        targetBodyRot = dir * 0.09;
        targetScaleY = 1.04;
        targetHatLift = 3.5;
        targetHatRot = baseHatRot - dir * 0.1;
        targetPlayReach = 1;
        browLift = -1.2;
      } else if (mode === 'pass') {
        targetSquint = 0.62;
        targetBodyY = 2.5;
        targetBodyRot = Math.sin(elapsedMs * 0.018) * 0.09;
        targetScaleY = 0.94;
        targetHatLift = -2.2;
        targetHatRot = baseHatRot + dir * 0.08;
        browTilt = -0.25;
        browLift = 0.4;
      } else if (mode === 'winRound') {
        const bounce = Math.abs(Math.sin(elapsedMs * 0.012));
        targetBodyY = -bounce * 6;
        targetScaleY = 0.96 + bounce * 0.08;
        targetHatLift = bounce * 10;
        targetHatRot = -dir * 0.28 * bounce;
        browLift = -1.8;
      } else if (mode === 'loseRound') {
        targetSquint = 0.45;
        targetBodyY = 1.8;
        targetBodyRot = Math.sin(elapsedMs * 0.014) * 0.07;
        targetScaleY = 0.96;
        browTilt = -0.22;
      }

      if (isBlinking && mode !== 'winRound') {
        targetSquint = 1;
      }

      const targetArmShow =
        !hasCustomBody || mode === 'impatient' || mode === 'think' || mode === 'play' || mode === 'winRound' ? 1 : 0;

      curSquint += (targetSquint - curSquint) * Math.min(1, dtMs / 45);
      curBodyY += (targetBodyY - curBodyY) * lerpFactor;
      curBodyRot += (targetBodyRot - curBodyRot) * lerpFactor;
      curScaleY += (targetScaleY - curScaleY) * lerpFactor;
      curHatLift += (targetHatLift - curHatLift) * lerpFactor;
      curHatRot += (targetHatRot - curHatRot) * lerpFactor;
      curPlayReach += (targetPlayReach - curPlayReach) * Math.min(1, dtMs / 55);
      curArmShow += (targetArmShow - curArmShow) * Math.min(1, dtMs / 90);

      bodyPivot.position.set(38, 41 + curBodyY);
      bodyPivot.rotation = curBodyRot;
      bodyPivot.scale.set(2 - curScaleY, curScaleY);

      hatPivot.position.set(0, hatBaseY - curHatLift);
      hatPivot.rotation = curHatRot;

      for (let i = 0; i < 2; i++) {
        pupils[i].position.set(curPupilX, curPupilY);
        if (brows[i]) {
          const browSign = i === 0 ? 1 : -1;
          brows[i].rotation = browSign * browTilt;
          brows[i].position.y = browLift;
        }

        const rx = hasCustomBody ? customEyes[i].rx : eyeRadiusX;
        const ry = hasCustomBody ? customEyes[i].ry : eyeRadiusY;
        const lid = eyelidTops[i];
        lid.clear();
        if (curSquint > 0.04) {
          const coverH = ry * 2 * Math.min(1, curSquint);
          lid
            .rect(-rx - 0.6, -ry - 0.4, rx * 2 + 1.2, coverH)
            .fill(hasCustomBody ? '#d404a0' : palette.main)
            .stroke({ color: '#16061b', width: 0.75 });
        }
      }

      // Outer bow-tie/lapel hand pose (procedural fallback only)
      if (!hasCustomBody) {
        if (mode === 'think' || mode === 'impatient') {
          outerArmRig.position.set(
            -dir * 11 + Math.sin(elapsedMs * 0.015) * 1.4,
            -9 + Math.cos(elapsedMs * 0.015) * 1.1,
          );
          outerArmRig.rotation = Math.sin(elapsedMs * 0.015) * 0.14;
        } else if (mode === 'winRound') {
          const wave = Math.sin(elapsedMs * 0.02);
          outerArmRig.position.set(-dir * 20, -18 + wave * 4);
          outerArmRig.rotation = -dir * 0.3 + wave * 0.25;
        } else if (mode === 'pass') {
          outerArmRig.position.set(-dir * 18, -3);
          outerArmRig.rotation = dir * 0.1;
        } else {
          outerArmRig.position.set(-dir * 17, -6);
          outerArmRig.rotation = 0;
        }
      }

      // Inner rail hand & 4 drumming fingers (homage to 1993 frames 2-5!)
      innerArmRig.alpha = curArmShow;
      innerArmRig.visible = curArmShow > 0.02;
      innerArmRig.position.set(
        restArmX - dir * (1 - curArmShow) * 6 + dir * curPlayReach * 11 - (mode === 'pass' ? dir * 4 : 0),
        restArmY + (1 - curArmShow) * 3 - curPlayReach * 8 + (mode === 'winRound' ? -Math.abs(Math.sin(elapsedMs * 0.012)) * 4 : 0),
      );
      innerArmRig.rotation = -dir * curPlayReach * 0.28;

      for (let f = 0; f < fingers.length; f++) {
        if (mode === 'impatient') {
          // Rolling 4-finger wave drum on the emerald rail
          const wave = Math.max(0, Math.sin(elapsedMs * 0.015 - f * 0.95));
          fingers[f].position.y = -1.8 - wave * 3.1;
          fingers[f].rotation = -dir * wave * 0.32;
        } else if (mode === 'think') {
          const fidget = Math.max(0, Math.sin(elapsedMs * 0.01 - f * 1.1));
          fingers[f].position.y = -1.8 - fidget * 1.4;
          fingers[f].rotation = -dir * fidget * 0.12;
        } else if (mode === 'play') {
          fingers[f].position.y = -2.2;
          fingers[f].rotation = dir * 0.22;
        } else {
          fingers[f].position.y = -1.8;
          fingers[f].rotation = 0;
        }
      }
    },
  };
}
