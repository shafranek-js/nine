import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
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

export interface HdRivalController {
  readonly container: Container;
  setState(mode: 'idle' | 'think' | 'play', elapsedMs: number): void;
}

export function createHdRival(side: 'left' | 'right'): HdRivalController {
  const container = new Container();
  const dir = side === 'left' ? 1 : -1;

  const makeTex = (think: boolean, play: boolean) =>
    createHdTexture(76, 46, (ctx) => {
      const cx = 38;
      const cy = 32;

      // Felt ledge
      ctx.fillStyle = '#166e32';
      ctx.fillRect(2, 40, 72, 4);
      ctx.fillStyle = '#c9982e';
      ctx.fillRect(2, 43.5, 72, 1.5);

      // Amethyst velvet tuxedo
      const suitG = ctx.createRadialGradient(cx - 6, cy - 6, 4, cx, cy + 4, 28);
      suitG.addColorStop(0, '#ea5cff');
      suitG.addColorStop(0.55, '#9d1bb5');
      suitG.addColorStop(1, '#4b0959');
      ctx.fillStyle = suitG;
      ctx.strokeStyle = '#150819';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 28, 41);
      ctx.quadraticCurveTo(cx - 21, 14, cx, 14);
      ctx.quadraticCurveTo(cx + 21, 14, cx + 28, 41);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shirt + Bow tie
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, 29);
      ctx.lineTo(cx, 39);
      ctx.lineTo(cx + 5.5, 29);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#151720';
      ctx.beginPath();
      ctx.moveTo(cx - 6.5, 29);
      ctx.lineTo(cx, 32);
      ctx.lineTo(cx - 6.5, 35);
      ctx.closePath();
      ctx.moveTo(cx + 6.5, 29);
      ctx.lineTo(cx, 32);
      ctx.lineTo(cx + 6.5, 35);
      ctx.closePath();
      ctx.fill();

      // Eyes
      const pupilShift = think ? dir * 1.1 : 0;
      for (const ex of [cx - 3.6, cx + 3.6]) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#150819';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(ex, 22, 3, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(ex + pupilShift, 22, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nose
      ctx.fillStyle = '#ff6ef7';
      ctx.strokeStyle = '#150819';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(cx, 25.5, 3.2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      drawTopHat(ctx, cx, 17, 0.88);

      // Extended gloved hand when playing a card
      if (play) {
        ctx.fillStyle = '#f8f3e8';
        ctx.strokeStyle = '#150819';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(cx + dir * 24, 34, 6, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

  const idleTex = makeTex(false, false);
  const thinkTex = makeTex(true, false);
  const playTex = makeTex(false, true);

  const spr = new Sprite(idleTex);
  spr.position.set(0, 0);
  container.addChild(spr);

  return {
    container,
    setState(mode, elapsedMs) {
      if (mode === 'play') {
        spr.texture = playTex;
        spr.position.y = -1;
      } else if (mode === 'think') {
        spr.texture = thinkTex;
        spr.position.y = Math.sin(elapsedMs * 0.008) * 0.9;
      } else {
        spr.texture = idleTex;
        spr.position.y = Math.sin(elapsedMs * 0.0025 + (side === 'left' ? 0 : 2)) * 0.6;
      }
    },
  };
}
