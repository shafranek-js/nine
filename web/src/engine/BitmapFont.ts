import { Container, Rectangle, Sprite, Texture } from 'pixi.js';

export function sliceTexture(sheet: Texture, x: number, y: number, w: number, h: number): Texture {
  const tex = new Texture({
    source: sheet.source,
    frame: new Rectangle(x, y, w, h),
  });
  tex.source.scaleMode = 'nearest';
  return tex;
}

const colorKeyCache = new Map<string, Texture>();

/**
 * Slices a sub-rectangle from a sprite sheet and turns exact black `(0,0,0)`
 * pixels transparent (matching EGA `PutMaskedImage4Plane` where color 0 is transparent).
 */
export function sliceMaskedTexture(sheet: Texture, x: number, y: number, w: number, h: number): Texture {
  const uid = sheet.source.uid;
  const key = `${uid}:${x},${y},${w},${h}`;
  const existing = colorKeyCache.get(key);
  if (existing) return existing;

  const resource = sheet.source.resource as HTMLImageElement | HTMLCanvasElement | ImageBitmap | null;
  if (!resource) {
    return sliceTexture(sheet, x, y, w, h);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return sliceTexture(sheet, x, y, w, h);
  }

  ctx.drawImage(resource, x, y, w, h, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  colorKeyCache.set(key, tex);
  return tex;
}

/**
 * 10×9 bitmap font stored in `TR_NINE.pcx` (ASM `CS:4CD8..4E3D`):
 * - ASCII `0x20..0x30`: x=332, y=105 + (code - 0x20)*10
 * - ASCII `0x31..0x41`: x=343, y=105 + (code - 0x31)*10
 * - ASCII `0x42..0x52`: x=354, y=105 + (code - 0x42)*10
 * - ASCII `0x53..0x63`: x=365, y=105 + (code - 0x53)*10
 * - ASCII `0x64..0x74`: x=376, y=105 + (code - 0x64)*10
 * - ASCII `0x75..0x7a`: x=387, y=105 + (code - 0x75)*10
 * - Black digits on white (`'0'..'9'`): x=387, y=165 + digit*10
 */
export class MenuBitmapFont {
  private readonly sheet: Texture;
  private readonly asciiCache = new Map<number, Texture>();
  private readonly blackDigitCache = new Map<number, Texture>();

  constructor(trNineSheet: Texture) {
    this.sheet = trNineSheet;
  }

  getAsciiGlyph(charCode: number, preferBlackDigits = false): Texture {
    if (preferBlackDigits && charCode >= 0x30 && charCode <= 0x39) {
      return this.getBlackDigitGlyph(charCode - 0x30);
    }

    const code = Math.max(0x20, Math.min(0x7a, charCode));
    const cached = this.asciiCache.get(code);
    if (cached) return cached;

    let srcX = 332;
    let srcY = 105;
    if (code <= 0x30) {
      srcX = 332;
      srcY = 105 + (code - 0x20) * 10;
    } else if (code <= 0x41) {
      srcX = 343;
      srcY = 105 + (code - 0x31) * 10;
    } else if (code <= 0x52) {
      srcX = 354;
      srcY = 105 + (code - 0x42) * 10;
    } else if (code <= 0x63) {
      srcX = 365;
      srcY = 105 + (code - 0x53) * 10;
    } else if (code <= 0x74) {
      srcX = 376;
      srcY = 105 + (code - 0x64) * 10;
    } else {
      srcX = 387;
      srcY = 105 + (code - 0x75) * 10;
    }

    const tex = sliceTexture(this.sheet, srcX, srcY, 10, 9);
    this.asciiCache.set(code, tex);
    return tex;
  }

  getBlackDigitGlyph(digit: number): Texture {
    const d = Math.max(0, Math.min(9, digit));
    const cached = this.blackDigitCache.get(d);
    if (cached) return cached;
    const tex = sliceTexture(this.sheet, 387, 165 + d * 10, 10, 9);
    this.blackDigitCache.set(d, tex);
    return tex;
  }

  createText(
    text: string,
    x: number,
    y: number,
    options?: { stepX?: number; blackDigits?: boolean },
  ): Container {
    const stepX = options?.stepX ?? 10;
    const blackDigits = options?.blackDigits ?? false;
    const group = new Container();
    group.position.set(x, y);

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const tex = this.getAsciiGlyph(code, blackDigits);
      const spr = new Sprite(tex);
      spr.position.set(i * stepX, 0);
      group.addChild(spr);
    }
    return group;
  }
}

/**
 * 8×7 HUD number font stored in `GR_NINE.pcx` (`DrawBitmapNumber`):
 * - Digits `'0'..'9'`: `(109, 94 + digit*8, 8, 7)`
 * - Blank / positive sign: `(109, 174, 8, 7)`
 * - Minus sign `'-'`: `(109, 182, 8, 7)`
 */
export class HudDigitFont {
  private readonly digits: Texture[] = [];
  private readonly plusBlank: Texture;
  private readonly minus: Texture;

  constructor(grNineSheet: Texture) {
    for (let d = 0; d < 10; d++) {
      this.digits.push(sliceTexture(grNineSheet, 109, 94 + d * 8, 8, 7));
    }
    this.plusBlank = sliceTexture(grNineSheet, 109, 174, 8, 7);
    this.minus = sliceTexture(grNineSheet, 109, 182, 8, 7);
  }

  renderFixedNumber(
    container: Container,
    value: number,
    x: number,
    y: number,
    totalSlots = 5,
    stepX = 9,
  ): void {
    container.removeChildren();
    container.position.set(x, y);

    const neg = value < 0;
    const str = Math.abs(Math.trunc(value)).toString().padStart(totalSlots - 1, ' ');
    const signSpr = new Sprite(neg ? this.minus : this.plusBlank);
    signSpr.position.set(0, 0);
    container.addChild(signSpr);

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const tex = ch === ' ' ? this.plusBlank : this.digits[ch.charCodeAt(0) - 48] ?? this.plusBlank;
      const spr = new Sprite(tex);
      spr.position.set((i + 1) * stepX, 0);
      container.addChild(spr);
    }
  }
}
