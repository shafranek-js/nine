import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { createHdTexture } from './hdCards';
import { HD_RENDER_SCALE } from './StageApp';

// 640x350 logical space displayed inside a 4:3 frame stretches Y relative to X by 48/35;
// counter-scale square-pixel character rigs symmetrically so visual area stays 1.0x and circles stay round.
const EGA_ASPECT_COMP_X = Math.sqrt(48 / 35);
const EGA_ASPECT_COMP_Y = Math.sqrt(35 / 48);

let characterAspectMode: '1:1' | '4:3' = '4:3';
const activeAspectRigs = new Set<Container>();

function getAspectCompScale(): { sx: number; sy: number } {
  return characterAspectMode === '4:3'
    ? { sx: EGA_ASPECT_COMP_X, sy: EGA_ASPECT_COMP_Y }
    : { sx: 1, sy: 1 };
}

function createAspectRig(x = 0, y = 0): Container {
  const rig = new Container();
  rig.position.set(x, y);
  const { sx, sy } = getAspectCompScale();
  rig.scale.set(sx, sy);
  activeAspectRigs.add(rig);
  return rig;
}

/** Updates aspect-ratio compensation on all active animated HD character rigs. */
export function setHdCharacterAspectMode(mode: '1:1' | '4:3'): void {
  characterAspectMode = mode;
  const { sx, sy } = getAspectCompScale();
  for (const rig of activeAspectRigs) {
    if (rig.destroyed) {
      activeAspectRigs.delete(rig);
    } else {
      rig.scale.set(sx, sy);
    }
  }
}

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

let hdCandelabraArtImg: HTMLImageElement | null = null;
let cachedCandelabraFrames: { frames: Texture[]; cw: number; ch: number } | null = null;

/** Registers the preloaded 6-frame raster candelabra sprite sheet. */
export function setHdCandelabraArt(img: HTMLImageElement): void {
  hdCandelabraArtImg = img;
  cachedCandelabraFrames = null;
}

export interface HdCandelabraController {
  readonly container: Container;
  update(elapsedMs: number): void;
}

/** Creates an animated HD 3-candle candelabra with aspect compensation and subtle ambient candlelight glow. */
export function createHdCandelabra(phaseOffsetMs = 0, mountOffsetY = 0): HdCandelabraController {
  const container = new Container();
  const rig = createAspectRig(0, 0);
  container.addChild(rig);

  let frames: Texture[] = [];
  let cw = 186;
  let ch = 240;

  if (hdCandelabraArtImg && hdCandelabraArtImg.complete && hdCandelabraArtImg.naturalWidth > 0) {
    if (!cachedCandelabraFrames) {
      const baseTex = Texture.from(hdCandelabraArtImg);
      baseTex.source.scaleMode = 'linear';
      const cellW = Math.floor(hdCandelabraArtImg.naturalWidth / 6);
      const cellH = hdCandelabraArtImg.naturalHeight;
      const sliced: Texture[] = [];
      for (let i = 0; i < 6; i++) {
        sliced.push(new Texture({ source: baseTex.source, frame: new Rectangle(i * cellW, 0, cellW, cellH) }));
      }
      cachedCandelabraFrames = { frames: sliced, cw: cellW, ch: cellH };
    }
    frames = cachedCandelabraFrames.frames;
    cw = cachedCandelabraFrames.cw;
    ch = cachedCandelabraFrames.ch;
  }

  const targetH = 43.2;
  const targetW = targetH * (cw / ch);

  const glowOffsets = [
    { x: -0.33 * targetW, y: mountOffsetY - 0.73 * targetH },
    { x: 0.0, y: mountOffsetY - 0.86 * targetH },
    { x: 0.33 * targetW, y: mountOffsetY - 0.70 * targetH },
  ];
  const glows: Sprite[] = glowOffsets.map((pos) => {
    const glow = new Sprite(getWarmGlowTexture());
    glow.anchor.set(0.5);
    glow.position.set(pos.x, pos.y);
    glow.scale.set(0.65);
    glow.blendMode = 'add';
    glow.alpha = 0.36;
    rig.addChild(glow);
    return glow;
  });

  const sprite = new Sprite(frames.length > 0 ? frames[0] : getHdCandelabraTexture());
  sprite.anchor.set(0.5, 1);
  sprite.position.set(0, mountOffsetY);
  sprite.width = targetW;
  sprite.height = targetH;
  rig.addChild(sprite);

  return {
    container,
    update(elapsedMs: number): void {
      const t = elapsedMs + phaseOffsetMs;
      if (frames.length > 0) {
        const idx = Math.floor(t / 145) % frames.length;
        sprite.texture = frames[idx];
      }
      for (let i = 0; i < glows.length; i++) {
        const phase = t * 0.012 + i * 1.9;
        glows[i].alpha = 0.34 + Math.sin(phase) * 0.08;
      }
    },
  };
}

export interface TrumpeterTheme {
  readonly light: string;
  readonly main: string;
  readonly dark: string;
  readonly facingRight: boolean;
}

interface TrumpeterHuePreset {
  readonly hueDeg: number;
  readonly satMul: number;
  readonly lumMul: number;
  readonly desatTo?: number;
}

const TRUMPETER_THEMES: readonly TrumpeterTheme[] = [
  { light: '#ff6bff', main: '#d11cc9', dark: '#6e0768', facingRight: true },
  { light: '#e8eef5', main: '#9aa4b2', dark: '#48515e', facingRight: true },
  { light: '#6cff8c', main: '#16c941', dark: '#076b20', facingRight: false },
  { light: '#ff6e66', main: '#de1d1d', dark: '#730707', facingRight: false },
];

const TRUMPETER_HUE_PRESETS: readonly (TrumpeterHuePreset | null)[] = [
  { hueDeg: 304, satMul: 0.90, lumMul: 1.06 }, // 0: Magenta
  { hueDeg: 214, satMul: 0.16, lumMul: 1.48, desatTo: 0.16 }, // 1: Silver-Grey
  { hueDeg: 132, satMul: 0.88, lumMul: 1.02 }, // 2: Emerald Green
  null, // 3: Master Cherry Red
];

let hdTrumpeterSheetImg: HTMLImageElement | undefined;
const hdTrumpeterFramesCache = new Map<number, { frames: Texture[]; cw: number; ch: number }>();

/** Registers preloaded illustrated HD trumpeter sprite sheet (12 frames, 4x3 grid). */
export function setHdTrumpeterArt(img?: HTMLImageElement | null): void {
  hdTrumpeterSheetImg = img ?? undefined;
  hdTrumpeterFramesCache.clear();
}

function hslToRgb01(hDeg: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((hDeg % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c * 0.5;
  return [r1 + m, g1 + m, b1 + m];
}

function getHdTrumpeterFrames(slotIdx: number): { frames: Texture[]; cw: number; ch: number } | null {
  const img = hdTrumpeterSheetImg;
  if (!isLoadedImage(img)) return null;

  const themeIdx = slotIdx % TRUMPETER_THEMES.length;
  const cached = hdTrumpeterFramesCache.get(themeIdx);
  if (cached) return cached;

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const cw = Math.floor(w / 4);
  const ch = Math.floor(h / 3);
  const preset = TRUMPETER_HUE_PRESETS[themeIdx];

  let baseTex: Texture;
  if (!preset) {
    baseTex = Texture.from(img);
    baseTex.source.scaleMode = 'linear';
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 8) continue;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const df = mx - mn;
      if (df <= 1e-4 || mx <= 1e-4) continue;

      let hDeg = 0;
      if (mx === r) hDeg = ((60 * ((g - b) / df)) % 360 + 360) % 360;
      else if (mx === g) hDeg = 60 * ((b - r) / df + 2);
      else hDeg = 60 * ((r - g) / df + 4);

      const signedH = hDeg > 180 ? hDeg - 360 : hDeg;
      const sat = df / mx;
      const wRed =
        Math.max(0, Math.min(1, (16 - signedH) / 5)) *
        Math.max(0, Math.min(1, (signedH + 45) / 10)) *
        Math.max(0, Math.min(1, (sat - 0.14) / 0.12));
      if (wRed <= 0.01) continue;

      const l = (mx + mn) * 0.5;
      const lv = Math.min(0.96, l * preset.lumMul);
      const svBase =
        preset.desatTo !== undefined
          ? preset.desatTo
          : preset.satMul * (1 - Math.max(0, (lv - 0.55) / 0.45) * 0.55);
      const sv = Math.min(1, svBase * (sat / 0.85));
      const [rr, gg, bb] = hslToRgb01(preset.hueDeg, sv, lv);

      data[i] = Math.round(Math.max(0, Math.min(255, (r * (1 - wRed) + rr * wRed) * 255)));
      data[i + 1] = Math.round(Math.max(0, Math.min(255, (g * (1 - wRed) + gg * wRed) * 255)));
      data[i + 2] = Math.round(Math.max(0, Math.min(255, (b * (1 - wRed) + bb * wRed) * 255)));
    }
    ctx.putImageData(imgData, 0, 0);
    baseTex = Texture.from(canvas);
    baseTex.source.scaleMode = 'linear';
  }

  const frames: Texture[] = [];
  for (let idx = 0; idx < 12; idx++) {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    frames.push(new Texture({ source: baseTex.source, frame: new Rectangle(col * cw, row * ch, cw, ch) }));
  }
  const entry = { frames, cw, ch };
  hdTrumpeterFramesCache.set(themeIdx, entry);
  return entry;
}

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
  const aspectRig = createAspectRig();
  container.addChild(aspectRig);

  const sheet = getHdTrumpeterFrames(slotIdx);
  if (sheet && sheet.frames.length === 12) {
    const shadow = new Graphics();
    shadow.ellipse(dir * -6, 30, 27, 4.8).fill({ color: 0x000000, alpha: 0.42 });
    aspectRig.addChild(shadow);

    const flipWrap = new Container();
    flipWrap.scale.x = theme.facingRight ? -1 : 1;
    aspectRig.addChild(flipWrap);

    const bodyRig = new Container();
    flipWrap.addChild(bodyRig);

    const spr = new Sprite(sheet.frames[0]);
    const targetW = 108;
    const targetH = targetW * (sheet.ch / sheet.cw);
    spr.width = targetW;
    spr.height = targetH;
    spr.anchor.set(0.5, 0.56);
    bodyRig.addChild(spr);

    let currentRaise = 0;

    return {
      container,
      setProgress(raise01: number, elapsedMs: number) {
        const clamped = Math.max(0, Math.min(1, raise01));
        currentRaise = clamped;
        const idx = Math.min(sheet.frames.length - 1, Math.floor(clamped * sheet.frames.length));
        if (spr.texture !== sheet.frames[idx]) {
          spr.texture = sheet.frames[idx];
        }
        const bounce = Math.sin(elapsedMs * 0.005 + slotIdx * 1.1) * 1.0;
        bodyRig.position.y = bounce - clamped * 1.4;
      },
      getBellPosition() {
        const { sx, sy } = getAspectCompScale();
        const localX = (-40 - currentRaise * 2) * (theme.facingRight ? -1 : 1) * sx;
        const localY = (16 - currentRaise * 42) * sy;
        return {
          x: container.x + localX,
          y: container.y + localY,
        };
      },
    };
  }

  // Fallback procedural vector trumpeter when illustrated sheet is unavailable
  const shadow = new Graphics();
  shadow.ellipse(0, 27, 26, 5).fill({ color: 0x000000, alpha: 0.45 });
  aspectRig.addChild(shadow);

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

  aspectRig.addChild(bodyRig);

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
      const { sx, sy } = getAspectCompScale();
      const angle = (0.48 - currentRaise * 1.0) * dir;
      const dist = 34;
      return {
        x: container.x + (dir * 5 + Math.cos(angle) * dist * dir) * sx,
        y: container.y + (2 + Math.sin(angle) * dist * dir) * sy,
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

export type DealerTableMode =
  | 'idle'
  | 'blink'
  | 'bell'
  | 'wag'
  | 'glanceLeft'
  | 'glanceRight'
  | 'hatCollect'
  | 'dealLeft'
  | 'dealDown'
  | 'dealRight'
  | 'pourLeft'
  | 'pourRight'
  | 'pourDown';

export interface HdDealerController {
  readonly container: Container;
  setTableExpression(mode: DealerTableMode, elapsedMs: number): void;
  setHatTipProgress(progress01: number): void;
  setShuffleFrame(frameIdx: number): void;
  getHatWorldPosition(winnerSeat?: 1 | 2 | 3): { x: number; y: number };
}

function getDealerInvertedHatTexture(): Texture {
  return createHdTexture(60, 44, (ctx) => {
    const cx = 30;
    // Left/right gloved hands holding the inverted brim
    for (const sx of [-1, 1]) {
      ctx.fillStyle = '#b8141c';
      ctx.strokeStyle = '#140808';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx + sx * 19 - 4, 15, 8, 9, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fcf8ef';
      ctx.beginPath();
      ctx.ellipse(cx + sx * 16, 17, 4.4, 3.2, sx * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Upside-down plush charcoal cylinder crown below brim
    const crownG = ctx.createLinearGradient(cx - 15, 16, cx + 15, 40);
    crownG.addColorStop(0, '#5a6270');
    crownG.addColorStop(0.32, '#9ca6b8');
    crownG.addColorStop(0.58, '#363c48');
    crownG.addColorStop(1, '#12151c');
    ctx.fillStyle = crownG;
    ctx.strokeStyle = '#0c0d10';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - 13.5, 16);
    ctx.lineTo(cx - 15.5, 37);
    ctx.quadraticCurveTo(cx, 40, cx + 15.5, 37);
    ctx.lineTo(cx + 13.5, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Satin crimson band on inverted hat
    ctx.fillStyle = '#8b1520';
    ctx.fillRect(cx - 14, 17.5, 28, 4);

    // Wide open brim facing up + dark hollow cavity + coin glint
    const brimG = ctx.createLinearGradient(cx - 22, 10, cx + 22, 20);
    brimG.addColorStop(0, '#2a2e38');
    brimG.addColorStop(0.45, '#8b95a5');
    brimG.addColorStop(1, '#151820');
    ctx.fillStyle = brimG;
    ctx.beginPath();
    ctx.ellipse(cx, 15, 21.5, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#120b0d';
    ctx.beginPath();
    ctx.ellipse(cx, 14.6, 13.2, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold coin glints inside open hat
    ctx.fillStyle = '#ffd859';
    ctx.beginPath();
    ctx.ellipse(cx - 3, 14.5, 4.2, 1.8, -0.15, 0, Math.PI * 2);
    ctx.ellipse(cx + 4.5, 14.9, 3.6, 1.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getDealerDealArmTexture(): Texture {
  return createHdTexture(44, 30, (ctx) => {
    // Crimson jacket sleeve + white shirt cuff
    const sleeveG = ctx.createLinearGradient(4, 12, 24, 20);
    sleeveG.addColorStop(0, '#9a1017');
    sleeveG.addColorStop(1, '#d92630');
    ctx.fillStyle = sleeveG;
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(4, 11, 17, 9, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8f5ec';
    ctx.fillRect(19, 12, 3.5, 7);

    // White glove thumb/palm holding flicked blue mini-card
    ctx.save();
    ctx.translate(31, 13);
    ctx.rotate(0.24);
    ctx.fillStyle = '#1b479e';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.roundRect(-7, -5, 14, 10, 1.6);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d9b54d';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(-4.8, -3, 9.6, 6);
    ctx.restore();

    ctx.fillStyle = '#fcf8ef';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(25.5, 16, 4.8, 3.4, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

let hdDealerArtMap: Map<string, HTMLImageElement> = new Map();

/** Registers preloaded illustrated HD dealer body/hat/animation artwork overlays. */
export function setHdDealerArt(artMap: Map<string, HTMLImageElement>): void {
  hdDealerArtMap = artMap;
}

function isLoadedImage(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

function sliceSheet4x4(img: HTMLImageElement): { frames: Texture[]; cw: number; ch: number } {
  const baseTex = Texture.from(img);
  baseTex.source.scaleMode = 'linear';
  const cols = img.naturalWidth >= img.naturalHeight * 1.65 ? 8 : 4;
  const rows = 4;
  const cw = Math.floor(img.naturalWidth / cols);
  const ch = Math.floor(img.naturalHeight / rows);
  const total = cols * rows;
  const frames: Texture[] = [];
  for (let idx = 0; idx < total; idx++) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    frames.push(new Texture({ source: baseTex.source, frame: new Rectangle(col * cw, row * ch, cw, ch) }));
  }
  return { frames, cw, ch };
}

function createLinearEyelidTexture(topColor: string, midColor: string, botColor: string, rimColor: string): Texture {
  return createHdTexture(14, 12, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 11);
    g.addColorStop(0, topColor);
    g.addColorStop(0.75, midColor);
    g.addColorStop(1, botColor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 14, 11);
    ctx.fillStyle = rimColor;
    ctx.fillRect(0, 10.7, 14, 1.3);
  });
}

function createGlossyPupilTexture(radius: number): Texture {
  return createHdTexture(8, 8, (ctx) => {
    ctx.fillStyle = '#0c0c12';
    ctx.beginPath();
    ctx.arc(4, 4, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4 - radius * 0.38, 4 - radius * 0.4, radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function createHdDealer(scale = 1): HdDealerController {
  const container = new Container();
  container.scale.set(scale);
  const aspectRig = createAspectRig(30, 44);
  container.addChild(aspectRig);

  const idlePoseImg = hdDealerArtMap.get('idle_pose');
  const blinkSheetImg = hdDealerArtMap.get('blink_sheet');
  const bodyImg = hdDealerArtMap.get('body');
  const hatImg = hdDealerArtMap.get('hat');
  const wagSheetImg = hdDealerArtMap.get('wag_sheet');
  const bellSheetImg = hdDealerArtMap.get('bell_sheet');
  const hatTipSheetImg = hdDealerArtMap.get('hat_tip_sheet');
  const shuffleSheetImg = hdDealerArtMap.get('shuffle_sheet');
  const dealSheetImg = hdDealerArtMap.get('deal_sheet');
  const hatCollectSheetImg = hdDealerArtMap.get('hat_collect_sheet');
  const pourLeftSheetImg = hdDealerArtMap.get('pour_left_sheet');
  const pourRightSheetImg = hdDealerArtMap.get('pour_right_sheet');
  const pourDownSheetImg = hdDealerArtMap.get('pour_down_sheet');

  const toWorldPoint = (lx: number, ly: number): { x: number; y: number } => ({
    x: container.x + (aspectRig.x + lx * aspectRig.scale.x) * container.scale.x,
    y: container.y + (aspectRig.y + ly * aspectRig.scale.y) * container.scale.y,
  });

  const useUnifiedIdle = isLoadedImage(idlePoseImg);
  const idleBaseImg = useUnifiedIdle ? idlePoseImg : bodyImg;

  if (isLoadedImage(idleBaseImg)) {
    const bodyPivot = new Container();
    bodyPivot.position.set(0, 0);
    aspectRig.addChild(bodyPivot);

    const bodyW = useUnifiedIdle ? (205 * 62.7) / 206 : 62.7;
    const bodyH = bodyW * (idleBaseImg.naturalHeight / idleBaseImg.naturalWidth);
    const torsoTex = Texture.from(idleBaseImg);
    torsoTex.source.scaleMode = 'linear';
    const bodySpr = new Sprite(torsoTex);
    bodySpr.anchor.set(0.5, 1);
    bodySpr.position.set(0, useUnifiedIdle ? -0.3 : 0);
    bodySpr.width = bodyW;
    bodySpr.height = bodyH;
    bodyPivot.addChild(bodySpr);

    // Live glossy pupils (for hatless bodyImg) + raster gradient eyelids clipped inside illustrated sclera
    const dealerEyes = useUnifiedIdle
      ? [
          { x: -0.0869 * bodyW, y: -0.58 * bodyH - 0.3, rx: 0.085 * bodyW, ry: 0.085 * bodyH, gazeX: 0 },
          { x: 0.084 * bodyW, y: -0.5992 * bodyH - 0.3, rx: 0.084 * bodyW, ry: 0.081 * bodyH, gazeX: 0 },
        ]
      : [
          { x: -0.083 * bodyW, y: -0.8122 * bodyH, rx: 0.077 * bodyW, ry: 0.068 * bodyH, gazeX: 0.9 },
          { x: 0.0908 * bodyW, y: -0.8108 * bodyH, rx: 0.073 * bodyW, ry: 0.067 * bodyH, gazeX: -0.9 },
        ];
    const pupilTex = createGlossyPupilTexture(2.05);
    const lidTex = createLinearEyelidTexture('#b80404', '#ea1414', '#8e0202', '#180303');
    const eyelids: { spr: Sprite; closedY: number; openY: number }[] = [];
    const pupils: { spr: Sprite; baseX: number }[] = [];

    for (const eye of dealerEyes) {
      const eyeC = new Container();
      eyeC.position.set(eye.x, eye.y);
      const maskGfx = new Graphics().ellipse(0, 0, eye.rx * 0.96, eye.ry * 0.92).fill(0xffffff);
      eyeC.addChild(maskGfx);
      eyeC.mask = maskGfx;

      if (!useUnifiedIdle) {
        const pupilSpr = new Sprite(pupilTex);
        pupilSpr.anchor.set(0.5);
        pupilSpr.position.set(eye.gazeX, 0.45);
        eyeC.addChild(pupilSpr);
        pupils.push({ spr: pupilSpr, baseX: eye.gazeX });

        const lidSpr = new Sprite(lidTex);
        lidSpr.anchor.set(0.5, 1);
        lidSpr.width = eye.rx * 2.2;
        lidSpr.height = eye.ry * 2.2;
        const openY = -eye.ry * 1.15;
        const closedY = eye.ry * 1.1;
        lidSpr.position.set(0, openY);
        lidSpr.visible = false;
        eyeC.addChild(lidSpr);
        eyelids.push({ spr: lidSpr, closedY, openY });
      }

      bodyPivot.addChild(eyeC);
    }

    const hatBaseY = -45.2;
    const hatPivot = new Container();
    hatPivot.position.set(0, hatBaseY);
    if (isLoadedImage(hatImg) && !useUnifiedIdle) {
      const hatTex = Texture.from(hatImg);
      hatTex.source.scaleMode = 'linear';
      const hatSpr = new Sprite(hatTex);
      hatSpr.anchor.set(0.5, 0.72);
      const hatW = 62.7 * 0.76;
      hatSpr.width = hatW;
      hatSpr.height = hatW * (hatImg.naturalHeight / hatImg.naturalWidth);
      hatPivot.addChild(hatSpr);
    }
    bodyPivot.addChild(hatPivot);

    let wagFrames: Texture[] = [];
    let wagSpr: Sprite | null = null;
    if (isLoadedImage(wagSheetImg)) {
      const sliced = sliceSheet4x4(wagSheetImg);
      wagFrames = sliced.frames;
      wagSpr = new Sprite(wagFrames[0]);
      const sc = 57.5 / 244;
      wagSpr.width = sliced.cw * sc;
      wagSpr.height = sliced.ch * sc;
      wagSpr.anchor.set(0.5367, 1.0);
      wagSpr.position.set(0, 0);
      wagSpr.visible = false;
      aspectRig.addChild(wagSpr);
    }

    let bellFrames: Texture[] = [];
    let bellSpr: Sprite | null = null;
    if (isLoadedImage(bellSheetImg)) {
      const sliced = sliceSheet4x4(bellSheetImg);
      bellFrames = sliced.frames;
      bellSpr = new Sprite(bellFrames[0]);
      const sc = bodyW / 206;
      bellSpr.width = sliced.cw * sc;
      bellSpr.height = sliced.ch * sc;
      bellSpr.anchor.set(0.5, 1.0);
      bellSpr.position.set(0, 0);
      bellSpr.visible = false;
      aspectRig.addChild(bellSpr);
    }

    let hatTipFrames: Texture[] = [];
    let hatTipSpr: Sprite | null = null;
    if (isLoadedImage(hatTipSheetImg)) {
      const sliced = sliceSheet4x4(hatTipSheetImg);
      hatTipFrames = sliced.frames;
      hatTipSpr = new Sprite(hatTipFrames[0]);
      const sc = bodyW / 206;
      hatTipSpr.width = sliced.cw * sc;
      hatTipSpr.height = sliced.ch * sc;
      hatTipSpr.anchor.set(0.6516, 1.0);
      hatTipSpr.position.set(0, 0);
      hatTipSpr.visible = false;
      aspectRig.addChild(hatTipSpr);
    }

    let shuffleFrames: Texture[] = [];
    let shuffleSpr: Sprite | null = null;
    if (isLoadedImage(shuffleSheetImg)) {
      const sliced = sliceSheet4x4(shuffleSheetImg);
      shuffleFrames = sliced.frames;
      shuffleSpr = new Sprite(shuffleFrames[0]);
      const sc = bodyW / 206;
      shuffleSpr.width = sliced.cw * sc;
      shuffleSpr.height = sliced.ch * sc;
      shuffleSpr.anchor.set(0.5016, 0.9726);
      shuffleSpr.position.set(0, 0);
      shuffleSpr.visible = false;
      aspectRig.addChild(shuffleSpr);
    }

    let dealFrames: Texture[] = [];
    let dealSpr: Sprite | null = null;
    if (isLoadedImage(dealSheetImg)) {
      const sliced = sliceSheet4x4(dealSheetImg);
      dealFrames = sliced.frames;
      dealSpr = new Sprite(dealFrames[0]);
      const sc = bodyW / 206;
      dealSpr.width = sliced.cw * sc;
      dealSpr.height = sliced.ch * sc;
      dealSpr.anchor.set(0.5, 1.0);
      dealSpr.position.set(0, 0);
      dealSpr.visible = false;
      aspectRig.addChild(dealSpr);
    }

    let hatCollectFrames: Texture[] = [];
    let hatCollectSpr: Sprite | null = null;
    if (isLoadedImage(hatCollectSheetImg)) {
      const sliced = sliceSheet4x4(hatCollectSheetImg);
      hatCollectFrames = sliced.frames;
      hatCollectSpr = new Sprite(hatCollectFrames[0]);
      const sc = bodyW / 206;
      hatCollectSpr.width = sliced.cw * sc;
      hatCollectSpr.height = sliced.ch * sc;
      hatCollectSpr.anchor.set(0.5, 1.0);
      hatCollectSpr.position.set(0, 0);
      hatCollectSpr.visible = false;
      aspectRig.addChild(hatCollectSpr);
    }

    const loadOptionalSheet = (img: HTMLImageElement | undefined): { frames: Texture[]; spr: Sprite } | null => {
      if (!isLoadedImage(img)) return null;
      const sliced = sliceSheet4x4(img);
      const spr = new Sprite(sliced.frames[0]);
      const sc = bodyW / 206;
      spr.width = sliced.cw * sc;
      spr.height = sliced.ch * sc;
      spr.anchor.set(0.5, 1.0);
      spr.position.set(0, 0);
      spr.visible = false;
      aspectRig.addChild(spr);
      return { frames: sliced.frames, spr };
    };
    const blinkArt = loadOptionalSheet(blinkSheetImg);
    const pourLeftArt = loadOptionalSheet(pourLeftSheetImg);
    const pourRightArt = loadOptionalSheet(pourRightSheetImg);
    const pourDownArt = loadOptionalSheet(pourDownSheetImg);

    // Temporary vector overlays used whenever optional dealer sprite sheets aren't provided yet.
    const vectorHatSpr = new Sprite(getDealerInvertedHatTexture());
    vectorHatSpr.anchor.set(0.5, 0.5);
    vectorHatSpr.position.set(0, -18);
    vectorHatSpr.visible = false;
    aspectRig.addChild(vectorHatSpr);

    const vectorDealArmSpr = new Sprite(getDealerDealArmTexture());
    vectorDealArmSpr.anchor.set(0.18, 0.55);
    vectorDealArmSpr.position.set(0, -12);
    vectorDealArmSpr.visible = false;
    aspectRig.addChild(vectorDealArmSpr);

    const hideExtraOverlays = (): void => {
      if (dealSpr) dealSpr.visible = false;
      if (hatCollectSpr) hatCollectSpr.visible = false;
      if (blinkArt) blinkArt.spr.visible = false;
      if (pourLeftArt) pourLeftArt.spr.visible = false;
      if (pourRightArt) pourRightArt.spr.visible = false;
      if (pourDownArt) pourDownArt.spr.visible = false;
      vectorHatSpr.visible = false;
      vectorDealArmSpr.visible = false;
    };

    let activeSheetGroup: 'none' | 'deal' | 'collect' | 'pourLeft' | 'pourRight' | 'pourDown' = 'none';
    let sheetGroupTimeMs = 0;
    let sheetOutroStartMs = -1;
    let blinkTimeMs = -1;
    let lastDealerCallMs = 0;
    let lastPerfNowMs = typeof performance !== 'undefined' ? performance.now() : 0;

    return {
      container,
      getHatWorldPosition(winnerSeat) {
        if (winnerSeat === 1) return toWorldPoint(-17, -14);
        if (winnerSeat === 2) return toWorldPoint(17, -14);
        if (winnerSeat === 3) return toWorldPoint(0, -10);
        return toWorldPoint(0, -22);
      },
      setTableExpression(mode, elapsedMs) {
        const nowMs = Math.max(0, elapsedMs);
        const perfNow = typeof performance !== 'undefined' ? performance.now() : nowMs;
        const perfDt = perfNow - lastPerfNowMs;
        lastPerfNowMs = perfNow;
        const argDt = nowMs >= lastDealerCallMs && nowMs - lastDealerCallMs < 200 ? nowMs - lastDealerCallMs : 16.6;
        const dt = perfDt > 1 && perfDt < 120 ? perfDt : argDt;
        lastDealerCallMs = nowMs;

        const DEAL_OUTRO_DURATION_MS = 720;
        const COLLECT_OUTRO_DURATION_MS = 400;
        const getOutroDurationMs = (grp: typeof activeSheetGroup): number =>
          grp === 'collect' ? COLLECT_OUTRO_DURATION_MS : DEAL_OUTRO_DURATION_MS;
        const showWag = Boolean(wagSpr && wagFrames.length >= 16 && mode === 'wag');
        const showBell = Boolean(bellSpr && bellFrames.length >= 16 && mode === 'bell');
        const isDeal = mode === 'dealLeft' || mode === 'dealDown' || mode === 'dealRight';
        const isPour = mode === 'pourLeft' || mode === 'pourRight' || mode === 'pourDown';

        const targetGroup: typeof activeSheetGroup = isDeal
          ? 'deal'
          : mode === 'hatCollect'
            ? 'collect'
            : mode === 'pourLeft'
              ? 'pourLeft'
              : mode === 'pourRight'
                ? 'pourRight'
                : mode === 'pourDown'
                  ? 'pourDown'
                  : 'none';

        if (targetGroup !== 'none') {
          if (activeSheetGroup !== targetGroup) {
            activeSheetGroup = targetGroup;
            sheetGroupTimeMs = 0;
          } else {
            sheetGroupTimeMs += dt;
          }
          sheetOutroStartMs = -1;
        } else if (activeSheetGroup !== 'none' && !showWag && !showBell) {
          const isPourComplete =
            (activeSheetGroup === 'pourLeft' ||
              activeSheetGroup === 'pourRight' ||
              activeSheetGroup === 'pourDown') &&
            sheetGroupTimeMs >= 2050;
          if (isPourComplete) {
            activeSheetGroup = 'none';
            sheetOutroStartMs = -1;
          } else {
            if (sheetOutroStartMs < 0) {
              sheetOutroStartMs = 0;
            } else {
              sheetOutroStartMs += dt;
            }
            if (sheetOutroStartMs >= getOutroDurationMs(activeSheetGroup)) {
              activeSheetGroup = 'none';
              sheetOutroStartMs = -1;
            }
          }
        } else {
          activeSheetGroup = 'none';
          sheetOutroStartMs = -1;
        }

        const effectiveGroup = activeSheetGroup;
        const activePourArt =
          effectiveGroup === 'pourLeft'
            ? pourLeftArt
            : effectiveGroup === 'pourRight'
              ? pourRightArt
              : effectiveGroup === 'pourDown'
                ? pourDownArt
                : null;

        if (hatTipSpr) hatTipSpr.visible = false;
        if (shuffleSpr) shuffleSpr.visible = false;
        hideExtraOverlays();

        const useDealSheet = Boolean(effectiveGroup === 'deal' && dealSpr && dealFrames.length >= 16);
        const useCollectSheet = Boolean(effectiveGroup === 'collect' && hatCollectSpr && hatCollectFrames.length >= 16);
        const usePourSheet = Boolean(activePourArt && activePourArt.frames.length >= 16);
        const BLINK_DURATION_MS = 340;
        const useBlinkSheet = Boolean(
          blinkArt &&
            blinkArt.frames.length >= 16 &&
            mode === 'blink' &&
            !showWag &&
            !showBell &&
            effectiveGroup === 'none'
        );
        if (useBlinkSheet) {
          blinkTimeMs = blinkTimeMs < 0 ? 0 : blinkTimeMs + dt;
        } else {
          blinkTimeMs = -1;
        }

        bodyPivot.visible =
          !showWag && !showBell && !useDealSheet && !useCollectSheet && !usePourSheet && !useBlinkSheet;

        if (wagSpr) {
          wagSpr.visible = showWag;
          if (showWag) {
            const n = wagFrames.length;
            const step = n >= 32 ? 62 : 124;
            const idx = Math.min(n - 1, Math.floor(nowMs / step));
            wagSpr.texture = wagFrames[idx];
          }
        }
        if (bellSpr) {
          bellSpr.visible = showBell;
          if (showBell) {
            const n = bellFrames.length;
            const step = n >= 32 ? 68 : 136;
            const idx = Math.min(n - 1, Math.floor(nowMs / step));
            bellSpr.texture = bellFrames[idx];
          }
        }
        if (useDealSheet && dealSpr) {
          dealSpr.visible = true;
          dealSpr.scale.x = Math.abs(dealSpr.scale.x);
          const n = dealFrames.length;
          const k = n >= 32 ? 2 : 1;
          const stepMs = n >= 32 ? 68 : 136;
          let idx: number;
          if (sheetOutroStartMs >= 0) {
            const startF = 10 * k;
            const span = Math.max(1, n - 1 - startF);
            idx = Math.min(n - 1, startF + Math.floor((sheetOutroStartMs / DEAL_OUTRO_DURATION_MS) * span));
          } else if (sheetGroupTimeMs < 540) {
            idx = Math.min(4 * k - 1, Math.floor((sheetGroupTimeMs / 540) * (4 * k)));
          } else {
            const lo = 4 * k;
            const hi = 10 * k - 1;
            const period = (hi - lo) * 2;
            const pos = Math.floor((sheetGroupTimeMs - 540) / stepMs) % period;
            idx = pos <= hi - lo ? lo + pos : hi - (pos - (hi - lo));
          }
          dealSpr.texture = dealFrames[idx];
        } else if (useCollectSheet && hatCollectSpr) {
          hatCollectSpr.visible = true;
          const n = hatCollectFrames.length;
          const k = n >= 32 ? 2 : 1;
          const holdStepMs = n >= 32 ? 90 : 180;
          let idx: number;
          if (sheetOutroStartMs >= 0) {
            const startF = 11 * k;
            const span = Math.max(1, n - 1 - startF);
            idx = Math.min(n - 1, startF + Math.floor((sheetOutroStartMs / COLLECT_OUTRO_DURATION_MS) * span));
          } else if (sheetGroupTimeMs < 560) {
            idx = Math.min(6 * k - 1, Math.floor((sheetGroupTimeMs / 560) * (6 * k)));
          } else {
            const lo = 6 * k;
            const hi = 10 * k;
            const period = (hi - lo) * 2;
            const pos = Math.floor((sheetGroupTimeMs - 560) / holdStepMs) % period;
            idx = pos <= hi - lo ? lo + pos : hi - (pos - (hi - lo));
          }
          hatCollectSpr.texture = hatCollectFrames[idx];
        } else if (usePourSheet && activePourArt) {
          activePourArt.spr.visible = true;
          const n = activePourArt.frames.length;
          const k = n >= 32 ? 2 : 1;
          let idx: number;
          if (sheetOutroStartMs >= 0) {
            const startF = 11 * k;
            const span = Math.max(1, n - 1 - startF);
            idx = Math.min(n - 1, startF + Math.floor((sheetOutroStartMs / DEAL_OUTRO_DURATION_MS) * span));
          } else {
            idx = Math.min(n - 1, Math.floor((sheetGroupTimeMs / 2100) * n));
          }
          activePourArt.spr.texture = activePourArt.frames[idx];
        } else if (useBlinkSheet && blinkArt) {
          blinkArt.spr.visible = true;
          const n = blinkArt.frames.length;
          const idx = Math.min(n - 1, Math.floor((blinkTimeMs / BLINK_DURATION_MS) * n));
          blinkArt.spr.texture = blinkArt.frames[idx];
        }

        if (bodyPivot.visible) {
          const isBlink = mode === 'blink';
          for (const lid of eyelids) {
            lid.spr.visible = isBlink;
            lid.spr.position.y = isBlink ? lid.closedY : lid.openY;
          }

          let pupilShiftX = 0;
          if (mode === 'glanceLeft' || mode === 'dealLeft' || mode === 'pourLeft') pupilShiftX = -1.7;
          else if (mode === 'glanceRight' || mode === 'dealRight' || mode === 'pourRight') pupilShiftX = 1.7;
          for (const p of pupils) {
            p.spr.position.set(p.baseX + pupilShiftX, 0.45);
          }

          const hideHeadHat = useUnifiedIdle || mode === 'hatCollect' || isPour;
          hatPivot.visible = !hideHeadHat;
          hatPivot.position.set(0, hatBaseY);
          hatPivot.rotation = mode === 'glanceLeft' ? -0.05 : mode === 'glanceRight' ? 0.05 : 0;
          if (useUnifiedIdle) {
            bodyPivot.rotation = mode === 'glanceLeft' ? -0.032 : mode === 'glanceRight' ? 0.032 : 0;
            bodyPivot.position.x = mode === 'glanceLeft' ? -0.8 : mode === 'glanceRight' ? 0.8 : 0;
          }

          if (mode === 'hatCollect') {
            vectorHatSpr.visible = true;
            vectorHatSpr.position.set(0, -19 + Math.sin(elapsedMs * 0.008) * 1.1);
            vectorHatSpr.rotation = 0;
            vectorHatSpr.scale.set(1, 1);
          } else if (isPour) {
            vectorHatSpr.visible = true;
            if (mode === 'pourLeft') {
              vectorHatSpr.position.set(-10, -21 + Math.sin(elapsedMs * 0.018) * 1.4);
              vectorHatSpr.rotation = -2.15 + Math.sin(elapsedMs * 0.015) * 0.12;
            } else if (mode === 'pourRight') {
              vectorHatSpr.position.set(10, -21 + Math.sin(elapsedMs * 0.018) * 1.4);
              vectorHatSpr.rotation = 2.15 + Math.sin(elapsedMs * 0.015) * 0.12;
            } else {
              vectorHatSpr.position.set(0, -16 + Math.sin(elapsedMs * 0.018) * 1.5);
              vectorHatSpr.rotation = Math.PI + Math.sin(elapsedMs * 0.014) * 0.1;
            }
          } else if (isDeal) {
            vectorDealArmSpr.visible = true;
            const flick = Math.sin(elapsedMs * 0.05) * 0.18;
            if (mode === 'dealLeft') {
              vectorDealArmSpr.position.set(-8, -11);
              vectorDealArmSpr.scale.set(-0.92, 0.92);
              vectorDealArmSpr.rotation = 0.28 + flick;
            } else if (mode === 'dealRight') {
              vectorDealArmSpr.position.set(8, -11);
              vectorDealArmSpr.scale.set(0.92, 0.92);
              vectorDealArmSpr.rotation = -0.28 + flick;
            } else {
              vectorDealArmSpr.position.set(2, -9);
              vectorDealArmSpr.scale.set(0.92, 0.92);
              vectorDealArmSpr.rotation = 1.15 + flick;
            }
          }
        }
      },
      setHatTipProgress(progress01: number) {
        if (wagSpr) wagSpr.visible = false;
        if (bellSpr) bellSpr.visible = false;
        if (shuffleSpr) shuffleSpr.visible = false;
        hideExtraOverlays();
        hatPivot.visible = true;
        for (const p of pupils) {
          p.spr.position.set(p.baseX, 0.45);
        }
        const p = Math.min(1, Math.max(0, progress01));

        if (hatTipSpr && hatTipFrames.length === 16) {
          bodyPivot.visible = false;
          hatTipSpr.visible = true;
          const idx = Math.min(15, Math.floor(p * 16));
          if (hatTipSpr.texture !== hatTipFrames[idx]) {
            hatTipSpr.texture = hatTipFrames[idx];
          }
          return;
        }

        bodyPivot.visible = true;
        const lift = Math.sin(p * Math.PI);
        const isBlink = p > 0.42 && p < 0.6;
        for (const lid of eyelids) {
          lid.spr.visible = isBlink;
          lid.spr.position.y = isBlink ? lid.closedY : lid.openY;
        }
        hatPivot.position.set(-lift * 12, hatBaseY - lift * 15);
        hatPivot.rotation = -lift * 0.36;
      },
      setShuffleFrame(frameIdx: number) {
        if (wagSpr) wagSpr.visible = false;
        if (bellSpr) bellSpr.visible = false;
        if (hatTipSpr) hatTipSpr.visible = false;
        hideExtraOverlays();
        hatPivot.visible = true;

        if (shuffleSpr && shuffleFrames.length === 16) {
          bodyPivot.visible = false;
          shuffleSpr.visible = true;
          const idx = Math.min(15, Math.max(0, Math.round(frameIdx)));
          if (shuffleSpr.texture !== shuffleFrames[idx]) {
            shuffleSpr.texture = shuffleFrames[idx];
          }
          return;
        }

        bodyPivot.visible = true;
      },
    };
  }

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
  bodySpr.position.set(0, -6);
  aspectRig.addChild(bodySpr);

  const hatTex = createHdTexture(52, 32, (ctx) => {
    drawTopHat(ctx, 26, 28, 0.92);
  });
  const hatPivot = new Container();
  hatPivot.position.set(0, -32);
  const hatSpr = new Sprite(hatTex);
  hatSpr.anchor.set(0.5, 0.9);
  hatPivot.addChild(hatSpr);
  aspectRig.addChild(hatPivot);

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
  bellSpr.position.set(-23, -34);
  bellSpr.visible = false;
  aspectRig.addChild(bellSpr);

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
  fingerSpr.position.set(-22, -16);
  fingerSpr.visible = false;
  aspectRig.addChild(fingerSpr);

  return {
    container,
    getHatWorldPosition(winnerSeat) {
      if (winnerSeat === 1) return toWorldPoint(-17, -14);
      if (winnerSeat === 2) return toWorldPoint(17, -14);
      if (winnerSeat === 3) return toWorldPoint(0, -10);
      return toWorldPoint(0, -22);
    },
    setTableExpression(mode, elapsedMs) {
      bellSpr.visible = mode === 'bell';
      fingerSpr.visible = mode === 'wag';
      bodySpr.texture = mode === 'blink' ? blinkTex : openTex;
      hatPivot.position.set(0, -32);
      hatPivot.rotation = 0;

      if (mode === 'bell') {
        bellSpr.rotation = Math.sin(elapsedMs * 0.02) * 0.48;
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
      hatPivot.position.set(-lift * 12, -32 - lift * 15);
      hatPivot.rotation = -lift * 0.36;
    },
    setShuffleFrame() {
      bellSpr.visible = false;
      fingerSpr.visible = false;
      bodySpr.texture = openTex;
      hatPivot.position.set(0, -32);
      hatPivot.rotation = 0;
    },
  };
}

export type RivalAnimMode =
  | 'idle'
  | 'impatient'
  | 'think'
  | 'play'
  | 'pass'
  | 'purseReach'
  | 'purseOpen'
  | 'purseClose'
  | 'purseReceive'
  | 'brokeShake'
  | 'brokeShrug'
  | 'yawn'
  | 'winRound'
  | 'loseRound';

function getRivalPurseTexture(variant: 'closed' | 'open' | 'empty'): Texture {
  return createHdTexture(34, 34, (ctx) => {
    const cx = 17;
    const cy = 19;

    // Plump crimson coin pouch
    const g = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 12);
    g.addColorStop(0, '#ff4d5a');
    g.addColorStop(0.55, '#bd1724');
    g.addColorStop(1, '#5e060e');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#180508';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - 5.5, 11);
    ctx.quadraticCurveTo(cx - 12, 18, cx - 9, 27);
    ctx.quadraticCurveTo(cx, 31, cx + 9, 27);
    ctx.quadraticCurveTo(cx + 12, 18, cx + 5.5, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold drawstring band & frame clasp
    ctx.fillStyle = '#e8b638';
    ctx.strokeStyle = '#5c3c05';
    ctx.lineWidth = 0.85;
    if (variant === 'open' || variant === 'empty') {
      ctx.beginPath();
      ctx.ellipse(cx, 10.5, 7.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1c0709';
      ctx.beginPath();
      ctx.ellipse(cx, 10.6, 5.4, 2.0, 0, 0, Math.PI * 2);
      ctx.fill();

      if (variant === 'open') {
        ctx.fillStyle = '#ffe56b';
        ctx.strokeStyle = '#754e06';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(cx - 1.2, 9.6, 3.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.fillRect(cx - 5.2, 10, 10.4, 2.6);
      ctx.strokeRect(cx - 5.2, 10, 10.4, 2.6);
      ctx.fillStyle = '#ffdf78';
      ctx.beginPath();
      ctx.arc(cx - 1.8, 8.2, 1.8, 0, Math.PI * 2);
      ctx.arc(cx + 1.8, 8.2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function getRivalGloveTexture(): Texture {
  return createHdTexture(18, 16, (ctx) => {
    ctx.fillStyle = '#fcf8ef';
    ctx.strokeStyle = '#18091e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(9, 8, 5.6, 4.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130, 115, 140, 0.55)';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(6.8, 6.2);
    ctx.lineTo(10.8, 6.6);
    ctx.moveTo(6.8, 9.2);
    ctx.lineTo(10.8, 9.4);
    ctx.stroke();
  });
}

function getRivalYawnMouthTexture(): Texture {
  return createHdTexture(16, 14, (ctx) => {
    ctx.fillStyle = '#290414';
    ctx.strokeStyle = '#120209';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(8, 7, 4.6, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b5284c';
    ctx.beginPath();
    ctx.ellipse(8, 9.2, 2.6, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

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
  const aspectRig = createAspectRig(38, 41);
  container.addChild(aspectRig);
  const dir = side === 'left' ? 1 : -1;
  const isLeft = side === 'left';
  const anchorScreenX = isLeft ? 57 : 569;
  const anchorScreenY = 122;

  const bodyImg = hdRivalArtMap.get(`${side}_body`) ?? hdRivalArtMap.get(side);
  const hatImg = hdRivalArtMap.get(`${side}_hat`);
  const impatientSheetImg = hdRivalArtMap.get(`${side}_impatient_sheet`);
  const playSheetImg = hdRivalArtMap.get(`${side}_play_sheet`);
  const purseSheetImg = hdRivalArtMap.get(`${side}_purse_sheet`);
  const brokeSheetImg = hdRivalArtMap.get(`${side}_broke_sheet`);
  const yawnSheetImg = hdRivalArtMap.get(`${side}_yawn_sheet`);
  const hasCustomBody = Boolean(bodyImg && bodyImg.complete && bodyImg.naturalWidth > 0);
  const hasCustomHat = Boolean(hatImg && hatImg.complete && hatImg.naturalWidth > 0);
  const hasImpatientSheet = Boolean(impatientSheetImg && impatientSheetImg.complete && impatientSheetImg.naturalWidth > 0);
  const hasPlaySheet = Boolean(playSheetImg && playSheetImg.complete && playSheetImg.naturalWidth > 0);

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

  // Pedestal rail is omitted whenever custom illustrated rival art is active
  if (!hasCustomBody) {
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
    ledgeSpr.position.set(0, -2);
    aspectRig.addChild(ledgeSpr);
  }

  // Body pivot anchored cleanly on the rail center (0, 0) inside aspectRig for natural tilt, lean & squash/stretch
  const bodyPivot = new Container();
  bodyPivot.position.set(0, 0);

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
  const eyelidSprites: Sprite[] = [];
  const eyelidTops: Graphics[] = [];
  const brows: Graphics[] = [];

  const customLidTex = hasCustomBody
    ? createLinearEyelidTexture('#c80396', '#e80ab4', '#9e0174', '#140318')
    : null;

  const scleraTex = createHdTexture(10, 10, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#16061b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(5, 5, 3.2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const pupilTex = createGlossyPupilTexture(hasCustomBody ? 2.15 : 1.55);

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

    if (hasCustomBody && customLidTex) {
      const lidSpr = new Sprite(customLidTex);
      lidSpr.anchor.set(0.5, 0);
      lidSpr.width = rx * 2.2;
      lidSpr.height = ry * 2.2;
      lidSpr.position.set(0, -ry * 2.2);
      eyeC.addChild(lidSpr);
      eyelidSprites.push(lidSpr);
    } else {
      const lid = new Graphics();
      eyeC.addChild(lid);
      eyelidTops.push(lid);

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
  const hatBaseY = hasCustomHat ? (isLeft ? -42.5 : -39.8) : -29;
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
    const hatW = 45.5;
    hatSpr.width = hatW;
    hatSpr.height = hatW * (hatImg.naturalHeight / hatImg.naturalWidth);
  }
  hatPivot.addChild(hatSpr);
  bodyPivot.addChild(hatPivot);

  // Procedural arms & drumming fingers only used when falling back without custom illustrated rival sprites
  let outerArmRig: Container | null = null;
  let innerArmRig: Container | null = null;
  const fingers: Sprite[] = [];
  const restArmX = dir * 26.5;
  const restArmY = -1.8;

  if (!hasCustomBody) {
    const outerHandTex = createHdTexture(16, 14, (ctx) => {
      ctx.fillStyle = '#fcf8ef';
      ctx.strokeStyle = '#18091e';
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.ellipse(8, 7, 5.2, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(130, 115, 140, 0.55)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(6.5, 5.2);
      ctx.lineTo(9.5, 5.8);
      ctx.moveTo(6.5, 7.8);
      ctx.lineTo(9.5, 8);
      ctx.stroke();
    });
    outerArmRig = new Container();
    outerArmRig.position.set(-dir * 16, -6);
    const outerHandSpr = new Sprite(outerHandTex);
    outerHandSpr.anchor.set(0.5);
    outerArmRig.addChild(outerHandSpr);
    bodyPivot.addChild(outerArmRig);

    innerArmRig = new Container();
    innerArmRig.position.set(restArmX, restArmY);

    const palmSpr = new Sprite(outerHandTex);
    palmSpr.anchor.set(0.5);
    palmSpr.scale.set(0.88, 0.8);
    palmSpr.position.set(-dir * 3, -1);
    innerArmRig.addChild(palmSpr);

    const fingerTex = createHdTexture(6, 8, (ctx) => {
      ctx.fillStyle = '#fcf8ef';
      ctx.strokeStyle = '#18091e';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.roundRect(1, 0.8, 3.6, 6.2, 1.8);
      ctx.fill();
      ctx.stroke();
    });
    for (let f = 0; f < 4; f++) {
      const fspr = new Sprite(fingerTex);
      fspr.anchor.set(0.5, 0.15);
      fspr.position.set(dir * (1.2 + f * 2.5), -1.8);
      innerArmRig.addChild(fspr);
      fingers.push(fspr);
    }
  }

  // Layer order: body & sprite sheets cleanly positioned above rival card racks
  aspectRig.addChild(bodyPivot);

  const playFrames: Texture[] = [];
  let playSpr: Sprite | null = null;
  if (hasPlaySheet && playSheetImg) {
    const sliced = sliceSheet4x4(playSheetImg);
    playFrames.push(...sliced.frames);
    playSpr = new Sprite(playFrames[1]);
    const scaleToIdle = isLeft ? 64 / 273 : 64 / 248;
    playSpr.width = sliced.cw * scaleToIdle;
    playSpr.height = sliced.ch * scaleToIdle;
    playSpr.anchor.set(isLeft ? 0.4968 : 0.5582, isLeft ? 0.9866 : 0.9883);
    playSpr.position.set(0, 1.5);
    playSpr.visible = false;
    aspectRig.addChild(playSpr);
  }

  if (innerArmRig) {
    aspectRig.addChild(innerArmRig);
  }

  // Optional 16-frame AI sprite sheet for the signature impatient finger-drumming animation
  const impatientFrames: Texture[] = [];
  let impatientSpr: Sprite | null = null;
  if (hasImpatientSheet && impatientSheetImg) {
    const sliced = sliceSheet4x4(impatientSheetImg);
    impatientFrames.push(...sliced.frames);
    impatientSpr = new Sprite(impatientFrames[0]);
    const scaleToIdle = isLeft ? 64 / 258 : 64 / 241;
    impatientSpr.width = sliced.cw * scaleToIdle;
    impatientSpr.height = sliced.ch * scaleToIdle;
    impatientSpr.anchor.set(isLeft ? 0.5034 : 0.5375, isLeft ? 0.9824 : 0.996);
    impatientSpr.position.set(0, 1.5);
    impatientSpr.visible = false;
    aspectRig.addChild(impatientSpr);
  }

  const loadOptionalRivalSheet = (img: HTMLImageElement | undefined): { frames: Texture[]; spr: Sprite } | null => {
    if (!isLoadedImage(img)) return null;
    const sliced = sliceSheet4x4(img);
    const spr = new Sprite(sliced.frames[0]);
    const scaleToIdle = isLeft ? 64 / 258 : 64 / 241;
    spr.width = sliced.cw * scaleToIdle;
    spr.height = sliced.ch * scaleToIdle;
    spr.anchor.set(isLeft ? 0.5 : 0.54, 0.985);
    spr.position.set(0, 1.5);
    spr.visible = false;
    aspectRig.addChild(spr);
    return { frames: sliced.frames, spr };
  };
  const purseSheetArt = loadOptionalRivalSheet(purseSheetImg);
  const brokeSheetArt = loadOptionalRivalSheet(brokeSheetImg);
  const yawnSheetArt = loadOptionalRivalSheet(yawnSheetImg);

  // Temporary vector action props layered on bodyPivot so both custom raster bodies & procedural bodies animate all EGA actions.
  const propOverlay = new Container();
  bodyPivot.addChild(propOverlay);

  const purseClosedTex = getRivalPurseTexture('closed');
  const purseOpenTex = getRivalPurseTexture('open');
  const purseEmptyTex = getRivalPurseTexture('empty');
  const purseSpr = new Sprite(purseClosedTex);
  purseSpr.anchor.set(0.5, 0.5);
  purseSpr.position.set(dir * 10, -10);
  purseSpr.visible = false;

  const gloveTex = getRivalGloveTexture();
  const propHandPrimary = new Sprite(gloveTex);
  propHandPrimary.anchor.set(0.5);
  propHandPrimary.visible = false;

  const propHandSecondary = new Sprite(gloveTex);
  propHandSecondary.anchor.set(0.5);
  propHandSecondary.visible = false;

  const yawnMouthSpr = new Sprite(getRivalYawnMouthTexture());
  yawnMouthSpr.anchor.set(0.5);
  yawnMouthSpr.position.set(dir * 1, hasCustomBody ? -0.34 * bodyH : -14);
  yawnMouthSpr.visible = false;

  propOverlay.addChild(yawnMouthSpr, purseSpr, propHandSecondary, propHandPrimary);

  const hideVectorProps = (): void => {
    purseSpr.visible = false;
    purseSpr.rotation = 0;
    purseSpr.scale.set(1, 1);
    propHandPrimary.visible = false;
    propHandPrimary.rotation = 0;
    propHandSecondary.visible = false;
    propHandSecondary.rotation = 0;
    yawnMouthSpr.visible = false;
    yawnMouthSpr.scale.set(1, 1);
  };
  const hideOptionalActionSheets = (): void => {
    if (purseSheetArt) purseSheetArt.spr.visible = false;
    if (brokeSheetArt) brokeSheetArt.spr.visible = false;
    if (yawnSheetArt) yawnSheetArt.spr.visible = false;
  };

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
  let impatientTimerMs = 0;
  let playTimerMs = 0;

  let actionSheetTimerMs = 0;
  let lastActionGroup: 'none' | 'play' | 'purse' | 'broke' | 'yawn' | 'impatient' = 'none';
  let rivalOutroMs = -1;

  return {
    container,
    setState(mode, elapsedMs, lookTarget, dtMs = 16.6) {
      const isPurseMode =
        mode === 'purseReach' || mode === 'purseOpen' || mode === 'purseClose' || mode === 'purseReceive';
      const isBrokeMode = mode === 'brokeShake' || mode === 'brokeShrug';
      const targetGroup: typeof lastActionGroup =
        mode === 'play'
          ? 'play'
          : isPurseMode
            ? 'purse'
            : isBrokeMode
              ? 'broke'
              : mode === 'yawn'
                ? 'yawn'
                : mode === 'impatient'
                  ? 'impatient'
                  : 'none';

      if (targetGroup !== 'none') {
        if (lastActionGroup !== targetGroup) {
          actionSheetTimerMs = 0;
          lastActionGroup = targetGroup;
        } else {
          actionSheetTimerMs += dtMs;
        }
        rivalOutroMs = -1;
      } else if (lastActionGroup !== 'none') {
        if (rivalOutroMs < 0) {
          rivalOutroMs = 0;
        } else {
          rivalOutroMs += dtMs;
        }
        if (rivalOutroMs >= 260) {
          lastActionGroup = 'none';
          rivalOutroMs = -1;
        }
      }

      const activeGroup = lastActionGroup;
      hideVectorProps();
      hideOptionalActionSheets();

      if (playSpr && playFrames.length >= 16 && activeGroup === 'play') {
        playTimerMs += dtMs;
        const n = playFrames.length;
        const stepMs = n >= 32 ? 26 : 52;
        const idx =
          rivalOutroMs >= 0
            ? Math.min(n - 1, Math.floor((n * 0.72) + (rivalOutroMs / 260) * (n * 0.28)))
            : Math.min(n - 1, Math.floor(playTimerMs / stepMs));
        playSpr.texture = playFrames[idx];
        playSpr.visible = true;
        const farReach = lookTarget && lookTarget.y > 154 ? 1 : 0;
        playSpr.position.set(dir * farReach * 1.4, 1.5 + farReach * 1.4);
        playSpr.rotation = dir * farReach * 0.04;
        if (impatientSpr) impatientSpr.visible = false;
        bodyPivot.visible = false;
        if (innerArmRig) innerArmRig.visible = false;
        impatientTimerMs = 0;
        return;
      }

      playTimerMs = 0;
      if (playSpr) {
        playSpr.visible = false;
      }

      if (purseSheetArt && activeGroup === 'purse') {
        const n = purseSheetArt.frames.length;
        const k = n >= 32 ? 2 : 1;
        let idx = 0;
        if (rivalOutroMs >= 0) {
          const startF = 11 * k;
          idx = Math.min(n - 1, startF + Math.floor((rivalOutroMs / 260) * (n - 1 - startF)));
        } else if (mode === 'purseReceive') {
          const lo = 4 * k;
          const hi = 7 * k;
          const period = (hi - lo) * 2;
          const pos = Math.floor(actionSheetTimerMs / (65 / k)) % period;
          idx = pos <= hi - lo ? lo + pos : hi - (pos - (hi - lo));
        } else {
          // Continuous full purse sequence across purseReach -> purseOpen -> purseClose (~1300ms total)
          idx = Math.min(n - 1, Math.floor((actionSheetTimerMs / 1300) * n));
        }
        purseSheetArt.spr.texture = purseSheetArt.frames[idx];
        purseSheetArt.spr.visible = true;
        if (impatientSpr) impatientSpr.visible = false;
        bodyPivot.visible = false;
        return;
      }
      if (brokeSheetArt && activeGroup === 'broke') {
        const n = brokeSheetArt.frames.length;
        const k = n >= 32 ? 2 : 1;
        let idx = 0;
        if (rivalOutroMs >= 0) {
          const startF = 12 * k;
          idx = Math.min(n - 1, startF + Math.floor((rivalOutroMs / 260) * (n - 1 - startF)));
        } else if (mode === 'brokeShake') {
          if (actionSheetTimerMs < 480) {
            idx = Math.min(5 * k - 1, Math.floor((actionSheetTimerMs / 480) * (5 * k)));
          } else {
            const lo = 5 * k;
            const hi = 8 * k;
            const period = (hi - lo) * 2;
            const pos = Math.floor((actionSheetTimerMs - 480) / (60 / k)) % period;
            idx = pos <= hi - lo ? lo + pos : hi - (pos - (hi - lo));
          }
        } else {
          const startF = 8 * k;
          idx = Math.min(n - 1, startF + Math.floor((actionSheetTimerMs / 950) * (n - startF)));
        }
        brokeSheetArt.spr.texture = brokeSheetArt.frames[idx];
        brokeSheetArt.spr.visible = true;
        if (impatientSpr) impatientSpr.visible = false;
        bodyPivot.visible = false;
        return;
      }
      if (yawnSheetArt && activeGroup === 'yawn') {
        const n = yawnSheetArt.frames.length;
        const idx =
          rivalOutroMs >= 0
            ? Math.min(n - 1, Math.floor(n * 0.75 + (rivalOutroMs / 260) * (n * 0.25)))
            : Math.min(n - 1, Math.floor((actionSheetTimerMs / 2050) * n));
        yawnSheetArt.spr.texture = yawnSheetArt.frames[idx];
        yawnSheetArt.spr.visible = true;
        if (impatientSpr) impatientSpr.visible = false;
        bodyPivot.visible = false;
        return;
      }

      if (impatientSpr && impatientFrames.length >= 16 && activeGroup === 'impatient') {
        const n = impatientFrames.length;
        const k = n >= 32 ? 2 : 1;
        impatientTimerMs += dtMs;
        let frameIdx: number;
        if (rivalOutroMs >= 0) {
          const introMax = 5 * k - 1;
          frameIdx = Math.max(0, Math.round(introMax * (1 - rivalOutroMs / 260)));
        } else {
          const introFrameMs = 120 / k;
          const loopFrameMs = 140 / k;
          const introCount = 5 * k;
          const introTotalMs = introCount * introFrameMs;
          frameIdx =
            impatientTimerMs < introTotalMs
              ? Math.min(introCount - 1, Math.floor(impatientTimerMs / introFrameMs))
              : introCount + (Math.floor((impatientTimerMs - introTotalMs) / loopFrameMs) % (n - introCount));
        }
        impatientSpr.texture = impatientFrames[frameIdx];
        impatientSpr.visible = true;
        bodyPivot.visible = false;
        if (innerArmRig) innerArmRig.visible = false;
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
      } else if (isPurseMode || isBrokeMode) {
        targetPX = dir * maxPupilX * 0.55;
        targetPY = maxPupilY * 0.65;
      } else if (mode === 'yawn') {
        targetPX = 0;
        targetPY = -maxPupilY * 0.4;
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
      } else if (mode === 'yawn') {
        const yawnOpen = 0.5 + 0.5 * Math.sin(Math.min(1, actionSheetTimerMs / 1360) * Math.PI);
        targetSquint = 0.85;
        targetBodyY = -1.2 * yawnOpen;
        targetBodyRot = -dir * 0.07 * yawnOpen;
        targetScaleY = 1 + 0.04 * yawnOpen;
        targetHatRot = baseHatRot - dir * 0.05;
        yawnMouthSpr.visible = true;
        yawnMouthSpr.scale.set(0.75 + 0.45 * yawnOpen, 0.45 + 0.85 * yawnOpen);
        propHandPrimary.visible = true;
        propHandPrimary.position.set(dir * 5, (hasCustomBody ? -0.31 * bodyH : -12) + (1 - yawnOpen) * 4);
        propHandPrimary.rotation = -dir * 0.35;
      } else if (mode === 'play') {
        targetBodyY = -2;
        targetBodyRot = dir * 0.09;
        targetScaleY = 1.04;
        targetHatLift = 3.5;
        targetHatRot = baseHatRot - dir * 0.1;
        targetPlayReach = 1;
        browLift = -1.2;
      } else if (mode === 'pass' || isPurseMode) {
        targetSquint = mode === 'purseReceive' ? 0.15 : 0.42;
        targetBodyY = mode === 'purseReceive' ? -1.4 : 1.6;
        targetBodyRot = dir * (mode === 'purseOpen' ? 0.05 : 0.02);
        targetScaleY = mode === 'purseReceive' ? 1.03 : 0.96;
        targetHatRot = baseHatRot + dir * 0.05;
        browTilt = mode === 'purseReceive' ? 0 : -0.18;

        if (isPurseMode) {
          purseSpr.visible = true;
          propHandPrimary.visible = true;
          if (mode === 'purseReach') {
            purseSpr.texture = purseClosedTex;
            purseSpr.position.set(dir * 13, -10);
            propHandPrimary.position.set(dir * 17, -14);
          } else if (mode === 'purseOpen' || mode === 'purseReceive') {
            purseSpr.texture = purseOpenTex;
            const bounce = mode === 'purseReceive' ? Math.sin(elapsedMs * 0.03) * 1.4 : Math.sin(elapsedMs * 0.02) * 0.8;
            purseSpr.position.set(dir * 8, -11 + bounce);
            propHandPrimary.position.set(dir * 14, -14 + bounce);
            propHandSecondary.visible = true;
            propHandSecondary.position.set(dir * 2, -14 - Math.abs(bounce));
          } else {
            purseSpr.texture = purseClosedTex;
            purseSpr.position.set(dir * 11, -9);
            propHandPrimary.position.set(dir * 15, -12);
          }
        }
      } else if (isBrokeMode) {
        targetSquint = 0.65;
        targetBodyY = 2.0;
        targetScaleY = 0.95;
        targetHatLift = -1.8;
        targetHatRot = baseHatRot + dir * 0.06;
        browTilt = -0.26;
        if (mode === 'brokeShake') {
          const shake = Math.sin(elapsedMs * 0.045);
          targetBodyRot = shake * 0.08;
          purseSpr.visible = true;
          purseSpr.texture = purseEmptyTex;
          purseSpr.scale.set(1, -1);
          purseSpr.position.set(dir * 10 + shake * 2.4, -12);
          purseSpr.rotation = shake * 0.42;
          propHandPrimary.visible = true;
          propHandPrimary.position.set(dir * 13 + shake * 2.2, -20);
        } else {
          // brokeShrug: empty palms out & up
          propHandPrimary.visible = true;
          propHandPrimary.position.set(dir * 21, -15 + Math.sin(elapsedMs * 0.015) * 1.2);
          propHandPrimary.rotation = -dir * 0.25;
          propHandSecondary.visible = true;
          propHandSecondary.position.set(-dir * 18, -15 + Math.sin(elapsedMs * 0.015) * 1.2);
          propHandSecondary.rotation = dir * 0.25;
        }
      } else if (mode === 'winRound') {
        const bounce = Math.abs(Math.sin(elapsedMs * 0.012));
        targetBodyY = -bounce * 6;
        targetScaleY = 0.96 + bounce * 0.08;
        targetHatLift = bounce * 10;
        targetHatRot = -dir * 0.28 * bounce;
        browLift = -1.8;
        const wave = Math.sin(elapsedMs * 0.024);
        propHandPrimary.visible = true;
        propHandPrimary.position.set(dir * 23, -24 + wave * 3.5);
        propHandPrimary.rotation = dir * 0.35 * wave;
      } else if (mode === 'loseRound') {
        targetSquint = 0.45;
        targetBodyY = 1.8;
        targetBodyRot = Math.sin(elapsedMs * 0.014) * 0.07;
        targetScaleY = 0.96;
        browTilt = -0.22;
        propHandPrimary.visible = true;
        propHandPrimary.position.set(dir * 15, -7);
      }

      if (isBlinking && mode !== 'winRound') {
        targetSquint = 1;
      }

      curSquint += (targetSquint - curSquint) * Math.min(1, dtMs / 45);
      curBodyY += (targetBodyY - curBodyY) * lerpFactor;
      curBodyRot += (targetBodyRot - curBodyRot) * lerpFactor;
      curScaleY += (targetScaleY - curScaleY) * lerpFactor;
      curHatLift += (targetHatLift - curHatLift) * lerpFactor;
      curHatRot += (targetHatRot - curHatRot) * lerpFactor;
      curPlayReach += (targetPlayReach - curPlayReach) * Math.min(1, dtMs / 55);

      bodyPivot.position.set(0, curBodyY);
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
        if (hasCustomBody && eyelidSprites[i]) {
          const lidSpr = eyelidSprites[i];
          const lidOffset = -ry * 2.1 + Math.min(1, curSquint) * (ry * 2.0);
          lidSpr.position.y = lidOffset;
          lidSpr.visible = curSquint > 0.04;
        } else if (eyelidTops[i]) {
          const lid = eyelidTops[i];
          lid.clear();
          if (curSquint > 0.04) {
            const coverH = ry * 2 * Math.min(1, curSquint);
            lid
              .rect(-rx - 0.6, -ry - 0.4, rx * 2 + 1.2, coverH)
              .fill(palette.main)
              .stroke({ color: '#16061b', width: 0.75 });
          }
        }
      }

      // Procedural arms & fingers (fallback only when custom art is absent)
      if (!hasCustomBody && outerArmRig && innerArmRig) {
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

        innerArmRig.alpha = 1;
        innerArmRig.visible = true;
        innerArmRig.position.set(
          restArmX + dir * curPlayReach * 11 - (mode === 'pass' ? dir * 4 : 0),
          restArmY - curPlayReach * 8 + (mode === 'winRound' ? -Math.abs(Math.sin(elapsedMs * 0.012)) * 4 : 0),
        );
        innerArmRig.rotation = -dir * curPlayReach * 0.28;

        for (let f = 0; f < fingers.length; f++) {
          if (mode === 'impatient') {
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
      }
    },
  };
}

export interface HdGoldLabelController {
  readonly container: Container;
  setText(text: string): void;
}

export interface HdGoldLabelOptions {
  readonly anchorY?: number;
  readonly textHeight?: number;
  readonly withPedestal?: boolean;
  readonly pedestalWidth?: number;
}

const goldPlaqueCache = new Map<string, { texture: Texture; width: number; height: number }>();

function drawChunkyGoldGlyph(ctx: CanvasRenderingContext2D, ch: string, ox: number, oy: number, scale: number): void {
  const pt = (x: number, y: number): [number, number] => [ox + x * scale, oy + y * scale];
  const poly = (coords: readonly [number, number][], close = false) => {
    if (coords.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(...pt(coords[0][0], coords[0][1]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(...pt(coords[i][0], coords[i][1]));
    }
    if (close) ctx.closePath();
    ctx.stroke();
  };

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.15 * scale;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  switch (ch) {
    case '0': {
      ctx.beginPath();
      ctx.roundRect(ox + 2.1 * scale, oy + 1.7 * scale, 5.8 * scale, 7.6 * scale, 2.1 * scale);
      ctx.stroke();
      break;
    }
    case '1': {
      poly([
        [2.6, 3.6],
        [5.4, 1.7],
        [5.4, 9.6],
      ]);
      poly([
        [2.2, 9.5],
        [8.4, 9.5],
      ]);
      break;
    }
    case '2': {
      poly([
        [2.1, 3.3],
        [2.1, 2.3],
        [3.3, 1.7],
        [6.7, 1.7],
        [7.9, 2.6],
        [7.9, 4.1],
        [6.9, 5.2],
        [2.3, 8.5],
        [2.3, 9.5],
        [8.4, 9.5],
      ]);
      break;
    }
    case '3': {
      poly([
        [2.0, 1.7],
        [7.0, 1.7],
        [8.0, 2.8],
        [8.0, 4.1],
        [6.8, 5.2],
        [4.2, 5.2],
      ]);
      poly([
        [4.8, 5.2],
        [7.0, 5.2],
        [8.1, 6.4],
        [8.1, 8.3],
        [6.9, 9.5],
        [2.0, 9.5],
      ]);
      break;
    }
    case '4': {
      poly([
        [6.7, 9.8],
        [6.7, 1.6],
      ]);
      poly([
        [6.4, 1.8],
        [2.0, 6.7],
        [8.7, 6.7],
      ]);
      break;
    }
    case '5': {
      poly([
        [8.1, 1.7],
        [2.3, 1.7],
        [2.3, 4.8],
        [6.8, 4.8],
        [8.1, 6.0],
        [8.1, 8.3],
        [6.8, 9.5],
        [2.0, 9.5],
      ]);
      break;
    }
    case '6': {
      poly([
        [7.6, 1.7],
        [3.6, 1.7],
        [2.1, 3.2],
        [2.1, 8.3],
        [3.3, 9.5],
        [6.9, 9.5],
        [8.1, 8.3],
        [8.1, 6.0],
        [6.9, 5.0],
        [2.3, 5.0],
      ]);
      break;
    }
    case '7': {
      poly([
        [1.8, 1.7],
        [8.1, 1.7],
        [4.3, 9.7],
      ]);
      break;
    }
    case '8': {
      ctx.beginPath();
      ctx.roundRect(ox + 2.3 * scale, oy + 1.6 * scale, 5.4 * scale, 3.6 * scale, 1.5 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(ox + 1.9 * scale, oy + 5.2 * scale, 6.2 * scale, 4.3 * scale, 1.8 * scale);
      ctx.stroke();
      break;
    }
    case '9': {
      poly([
        [7.9, 5.7],
        [3.1, 5.7],
        [1.9, 4.6],
        [1.9, 2.8],
        [3.1, 1.7],
        [6.9, 1.7],
        [8.1, 2.8],
        [8.1, 8.1],
        [6.6, 9.5],
        [2.4, 9.5],
      ]);
      break;
    }
    case '$': {
      ctx.save();
      ctx.lineWidth = 1.65 * scale;
      poly([
        [5.0, 0.2],
        [5.0, 10.8],
      ]);
      ctx.restore();
      ctx.lineWidth = 2.0 * scale;
      poly([
        [7.9, 2.6],
        [6.7, 1.7],
        [3.2, 1.7],
        [2.1, 2.8],
        [2.1, 4.1],
        [3.4, 5.1],
        [6.8, 5.6],
        [8.1, 6.8],
        [8.1, 8.3],
        [6.8, 9.5],
        [3.1, 9.5],
        [1.9, 8.5],
      ]);
      break;
    }
    case '-': {
      poly([
        [2.2, 5.5],
        [7.8, 5.5],
      ]);
      break;
    }
    case 'B': {
      poly([
        [2.1, 1.4],
        [2.1, 9.7],
      ]);
      poly([
        [2.1, 1.7],
        [6.4, 1.7],
        [7.8, 2.8],
        [7.8, 4.2],
        [6.5, 5.3],
        [2.1, 5.3],
      ]);
      poly([
        [2.1, 5.3],
        [6.7, 5.3],
        [8.2, 6.5],
        [8.2, 8.3],
        [6.8, 9.5],
        [2.1, 9.5],
      ]);
      break;
    }
    case 'A': {
      poly([
        [1.7, 9.7],
        [5.0, 1.7],
        [8.3, 9.7],
      ]);
      poly([
        [2.8, 6.9],
        [7.2, 6.9],
      ]);
      break;
    }
    case 'N': {
      poly([
        [2.0, 9.7],
        [2.0, 1.5],
      ]);
      poly([
        [2.2, 1.8],
        [7.8, 9.4],
      ]);
      poly([
        [8.0, 9.7],
        [8.0, 1.5],
      ]);
      break;
    }
    case 'K': {
      poly([
        [2.1, 1.5],
        [2.1, 9.7],
      ]);
      poly([
        [7.9, 1.6],
        [2.6, 5.6],
      ]);
      poly([
        [3.4, 5.0],
        [8.1, 9.7],
      ]);
      break;
    }
    default: {
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${9.5 * scale}px "Arial Black", "Impact", "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, ox + 5 * scale, oy + 5.7 * scale);
      break;
    }
  }
}

function makeTintedCopy(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d');
  if (g) {
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

function getHdGoldPlaqueEntry(
  text: string,
  textHeight: number,
  withPedestal: boolean,
  minPedestalWidth: number,
): { texture: Texture; width: number; height: number } {
  const norm = text.toUpperCase();
  const key = `${norm}|${textHeight}|${withPedestal ? 1 : 0}|${minPedestalWidth}`;
  const cached = goldPlaqueCache.get(key);
  if (cached) return cached;

  const glyphScale = textHeight / 11;
  const glyphAdvance = 9.4 * glyphScale;
  const glyphsW = Math.max(10 * glyphScale, norm.length * glyphAdvance);
  const padX = 5;
  const padTop = withPedestal ? 1.2 : 2.5;
  const plinthGap = withPedestal ? 0.7 : 0;
  const plinthH = withPedestal ? 3.0 : 0;
  const padBottom = withPedestal ? 2.6 : 3.2;

  const boxW = Math.ceil(Math.max(withPedestal ? minPedestalWidth : 0, glyphsW) + padX * 2);
  const boxH = Math.ceil(padTop + textHeight + plinthGap + plinthH + padBottom);

  const pxW = Math.round(boxW * HD_RENDER_SCALE);
  const pxH = Math.round(boxH * HD_RENDER_SCALE);

  // Build crisp unified white silhouette (text + optional solid gold pedestal bar)
  const sil = document.createElement('canvas');
  sil.width = pxW;
  sil.height = pxH;
  const sctx = sil.getContext('2d');
  if (sctx) {
    sctx.scale(HD_RENDER_SCALE, HD_RENDER_SCALE);
    const startX = (boxW - glyphsW) * 0.5;
    for (let i = 0; i < norm.length; i++) {
      drawChunkyGoldGlyph(sctx, norm[i], startX + i * glyphAdvance, padTop, glyphScale);
    }

    if (withPedestal) {
      const pW = Math.max(minPedestalWidth, glyphsW + 7);
      const px0 = (boxW - pW) * 0.5;
      const py0 = padTop + textHeight + plinthGap;
      // Wide stepped golden pedestal baseplate matching the 1993 candelabra plinth
      sctx.fillStyle = '#ffffff';
      sctx.beginPath();
      sctx.moveTo(px0 + 1.8, py0);
      sctx.lineTo(px0 + pW - 1.8, py0);
      sctx.lineTo(px0 + pW, py0 + plinthH);
      sctx.lineTo(px0, py0 + plinthH);
      sctx.closePath();
      sctx.fill();
    }
  }

  const inkCopy = makeTintedCopy(sil, '#0b0501');
  const deepBronzeCopy = makeTintedCopy(sil, '#632e02');
  const midBronzeCopy = makeTintedCopy(sil, '#9d4f06');
  const rimDarkCopy = makeTintedCopy(sil, '#1a0c02');

  const faceCopy = document.createElement('canvas');
  faceCopy.width = pxW;
  faceCopy.height = pxH;
  const fctx = faceCopy.getContext('2d');
  if (fctx) {
    fctx.drawImage(sil, 0, 0);
    fctx.globalCompositeOperation = 'source-in';
    const grad = fctx.createLinearGradient(0, padTop * HD_RENDER_SCALE, 0, (boxH - padBottom) * HD_RENDER_SCALE);
    grad.addColorStop(0.0, '#fffce0');
    grad.addColorStop(0.22, '#ffe959');
    grad.addColorStop(0.55, '#f6b119');
    grad.addColorStop(0.84, '#cf7206');
    grad.addColorStop(1.0, '#964702');
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, pxW, pxH);
  }

  // Top-edge specular highlight bevel cut cleanly inside the gold face
  const specCopy = document.createElement('canvas');
  specCopy.width = pxW;
  specCopy.height = pxH;
  const spctx = specCopy.getContext('2d');
  if (spctx) {
    spctx.drawImage(sil, 0, 0);
    spctx.globalCompositeOperation = 'destination-out';
    spctx.drawImage(sil, 0.35 * HD_RENDER_SCALE, 0.85 * HD_RENDER_SCALE);
    spctx.globalCompositeOperation = 'source-in';
    spctx.fillStyle = 'rgba(255, 254, 236, 0.78)';
    spctx.fillRect(0, 0, pxW, pxH);
  }

  const tex = createHdTexture(boxW, boxH, (ctx) => {
    ctx.save();
    ctx.scale(1 / HD_RENDER_SCALE, 1 / HD_RENDER_SCALE);

    // 1. Soft dark ambient drop shadow behind metal object
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
    ctx.shadowBlur = 3.2 * HD_RENDER_SCALE;
    ctx.shadowOffsetX = 0.6 * HD_RENDER_SCALE;
    ctx.shadowOffsetY = 1.8 * HD_RENDER_SCALE;
    ctx.drawImage(inkCopy, 0, 0);
    ctx.restore();

    // 2. Heavy black ink outline around 3D extrusion volume (matches candelabra ink work)
    const outlineR = 0.88 * HD_RENDER_SCALE;
    const extX = 0.55 * HD_RENDER_SCALE;
    const extY = 1.45 * HD_RENDER_SCALE;
    for (let s = 5; s >= 0; s--) {
      const t = s / 5;
      const bx = extX * t;
      const by = extY * t;
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        ctx.drawImage(inkCopy, bx + Math.cos(ang) * outlineR, by + Math.sin(ang) * outlineR);
      }
    }

    // 3. Stepped burnished bronze 3D extrusion thickness
    for (let s = 5; s >= 1; s--) {
      const t = s / 5;
      ctx.drawImage(s >= 3 ? deepBronzeCopy : midBronzeCopy, extX * t, extY * t);
    }

    // 4. Crisp dark rim separating front gold plane from bronze extrusion
    ctx.drawImage(rimDarkCopy, 0.14 * HD_RENDER_SCALE, 0.36 * HD_RENDER_SCALE);

    // 5. Polished metallic gold front face + top specular highlight edge
    ctx.drawImage(faceCopy, 0, 0);
    ctx.drawImage(specCopy, 0, 0);

    ctx.restore();
  });

  const entry = { texture: tex, width: boxW, height: boxH };
  if (goldPlaqueCache.size < 200) {
    goldPlaqueCache.set(key, entry);
  }
  return entry;
}

/** Creates an aspect-compensated solid-gold 3D sculpted HUD label or candelabra pedestal. */
export function createHdGoldLabel(
  initialText: string,
  options: HdGoldLabelOptions = {},
): HdGoldLabelController {
  const textHeight = options.textHeight ?? 11;
  const withPedestal = options.withPedestal ?? false;
  const pedestalWidth = options.pedestalWidth ?? 44;
  const anchorY = options.anchorY ?? 0.5;

  const container = new Container();
  const rig = createAspectRig(0, 0);
  container.addChild(rig);

  const initial = getHdGoldPlaqueEntry(initialText, textHeight, withPedestal, pedestalWidth);
  const sprite = new Sprite(initial.texture);
  sprite.anchor.set(0.5, anchorY);
  rig.addChild(sprite);

  let currentText = initialText;
  return {
    container,
    setText(nextText: string): void {
      if (nextText === currentText) return;
      currentText = nextText;
      const entry = getHdGoldPlaqueEntry(nextText, textHeight, withPedestal, pedestalWidth);
      sprite.texture = entry.texture;
    },
  };
}

/**
 * Places the pre-rendered HD "NINE" or "CLUB" card arch sprite cleanly beside
 * the central hat alcove with square-pixel aspect compensation (`4:3` & `1:1`).
 */
export function createHdClubBannerSprite(texture: Texture, side: 'left' | 'right'): Container {
  const x = side === 'left' ? 148 : 640 - 148;
  const y = 70;
  const rig = createAspectRig(x, y);
  const spr = new Sprite(texture);
  spr.anchor.set(0.5);
  const targetH = 122;
  const aspect = texture.height > 0 ? texture.width / texture.height : 1.26;
  spr.height = targetH;
  spr.width = targetH * aspect;
  rig.addChild(spr);
  return rig;
}

/**
 * Places the glossy Gothic "MONTE CARLO" logo centered on the intro banner
 * with square-pixel aspect compensation so lettering keeps its exact authored shape.
 */
export function createHdIntroLogoSprite(
  texture: Texture,
  x: number,
  y: number,
  targetW = 260,
  targetH?: number,
): Container {
  const rig = createAspectRig(x, y);
  const spr = new Sprite(texture);
  spr.anchor.set(0.5);
  const aspect = texture.height > 0 ? texture.width / texture.height : 3;
  spr.width = targetW;
  spr.height = targetH ?? targetW / aspect;
  rig.addChild(spr);
  return rig;
}

/**
 * Slices a uniform horizontal HD sprite sheet into `count` textures while
 * keeping its existing `linear` GPU filtering mode intact.
 */
export function sliceLinearSheet(sheet: Texture, count: number): Texture[] {
  const cellW = Math.floor(sheet.width / count);
  const cellH = sheet.height;
  return Array.from({ length: count }, (_, i) =>
    new Texture({
      source: sheet.source,
      frame: new Rectangle(i * cellW, 0, cellW, cellH),
    }),
  );
}

/**
 * Places a linear-filtered HD sprite inside an aspect-compensated rig anchored
 * cleanly at `(x, y)` so circle/square ratios stay exact in both `4:3` and `1:1`.
 */
export function createHdMenuRigSprite(
  texture: Texture,
  x: number,
  y: number,
  targetHeight: number,
  anchorY = 1,
): { rig: Container; sprite: Sprite } {
  const rig = createAspectRig(x, y);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, anchorY);
  const aspect = texture.height > 0 ? texture.width / texture.height : 1;
  sprite.height = targetHeight;
  sprite.width = targetHeight * aspect;
  rig.addChild(sprite);
  return { rig, sprite };
}
