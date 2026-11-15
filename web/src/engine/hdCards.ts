import { CanvasSource, Texture } from 'pixi.js';
import { cardKey } from '../core/rules';
import type { Rank, Suit } from '../core/types';
import { HD_RENDER_SCALE, type AspectMode } from './StageApp';

export interface HdCardLibrary {
  readonly cards: Map<string, Texture>;
  readonly miniCards: Map<string, Texture>;
  readonly cardBack: Texture;
  readonly miniCardBack: Texture;
}

const cachedLibraries: Record<AspectMode, HdCardLibrary | null> = {
  '4:3': null,
  '1:1': null,
};
let hdCourtArtMap: Map<string, HTMLImageElement> = new Map();

/** Registers preloaded illustrated HD court portraits and invalidates cached card textures. */
export function setHdCourtArt(artMap: Map<string, HTMLImageElement>): void {
  hdCourtArtMap = artMap;
  cachedLibraries['4:3'] = null;
  cachedLibraries['1:1'] = null;
}

export function createHdTexture(
  logicalW: number,
  logicalH: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalW * HD_RENDER_SCALE);
  canvas.height = Math.round(logicalH * HD_RENDER_SCALE);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.save();
    ctx.scale(HD_RENDER_SCALE, HD_RENDER_SCALE);
    draw(ctx, logicalW, logicalH);
    ctx.restore();
  }
  const source = new CanvasSource({
    resource: canvas,
    resolution: HD_RENDER_SCALE,
    scaleMode: 'linear',
  });
  return new Texture({ source });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function isRedSuit(suit: Suit): boolean {
  return suit === 3 || suit === 4;
}

function suitFillStyle(ctx: CanvasRenderingContext2D, suit: Suit, yTop: number, yBottom: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, yTop, 0, yBottom);
  if (isRedSuit(suit)) {
    g.addColorStop(0, '#e33443');
    g.addColorStop(0.55, '#c41628');
    g.addColorStop(1, '#8c0e1b');
  } else {
    g.addColorStop(0, '#2a3347');
    g.addColorStop(0.6, '#141923');
    g.addColorStop(1, '#0c0f16');
  }
  return g;
}

export function drawSuitShape(ctx: CanvasRenderingContext2D, suit: Suit, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size * 0.5;
  ctx.fillStyle = suitFillStyle(ctx, suit, -s, s);

  if (suit === 4) {
    // Heart
    ctx.beginPath();
    ctx.moveTo(0, s * 0.92);
    ctx.bezierCurveTo(-s * 1.15, s * 0.25, -s * 1.12, -s * 0.72, -s * 0.48, -s * 0.88);
    ctx.bezierCurveTo(-s * 0.14, -s * 0.96, 0, -s * 0.56, 0, -s * 0.42);
    ctx.bezierCurveTo(0, -s * 0.56, s * 0.14, -s * 0.96, s * 0.48, -s * 0.88);
    ctx.bezierCurveTo(s * 1.12, -s * 0.72, s * 1.15, s * 0.25, 0, s * 0.92);
    ctx.closePath();
    ctx.fill();
  } else if (suit === 3) {
    // Diamond
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.96);
    ctx.quadraticCurveTo(s * 0.36, -s * 0.34, s * 0.84, 0);
    ctx.quadraticCurveTo(s * 0.36, s * 0.34, 0, s * 0.96);
    ctx.quadraticCurveTo(-s * 0.36, s * 0.34, -s * 0.84, 0);
    ctx.quadraticCurveTo(-s * 0.36, -s * 0.34, 0, -s * 0.96);
    ctx.closePath();
    ctx.fill();
  } else if (suit === 1) {
    // Spade
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.96);
    ctx.bezierCurveTo(s * 1.05, -s * 0.15, s * 1.08, s * 0.58, s * 0.46, s * 0.62);
    ctx.bezierCurveTo(s * 0.2, s * 0.63, s * 0.08, s * 0.48, s * 0.06, s * 0.42);
    ctx.quadraticCurveTo(s * 0.09, s * 0.72, s * 0.28, s * 0.94);
    ctx.lineTo(-s * 0.28, s * 0.94);
    ctx.quadraticCurveTo(-s * 0.09, s * 0.72, -s * 0.06, s * 0.42);
    ctx.bezierCurveTo(-s * 0.08, s * 0.48, -s * 0.2, s * 0.63, -s * 0.46, s * 0.62);
    ctx.bezierCurveTo(-s * 1.08, s * 0.58, -s * 1.05, -s * 0.15, 0, -s * 0.96);
    ctx.closePath();
    ctx.fill();
  } else {
    // Club (each lobe drawn with its own beginPath so Canvas2D never connects chord lines between circles)
    const r = s * 0.4;
    const lobes: readonly [number, number, number][] = [
      [0, -s * 0.46, r],
      [-s * 0.45, s * 0.14, r],
      [s * 0.45, s * 0.14, r],
      [0, -s * 0.02, s * 0.28],
    ];
    for (const [lx, ly, lr] of lobes) {
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, s * 0.08);
    ctx.lineTo(s * 0.08, s * 0.08);
    ctx.quadraticCurveTo(s * 0.1, s * 0.66, s * 0.28, s * 0.92);
    ctx.lineTo(-s * 0.28, s * 0.92);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.66, -s * 0.08, s * 0.08);
    ctx.closePath();
    ctx.fill();
  }

  // Subtle specular highlight positioned safely inside each suit's silhouette
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  if (suit === 2) {
    ctx.ellipse(-s * 0.1, -s * 0.52, s * 0.11, s * 0.16, -0.35, 0, Math.PI * 2);
  } else if (suit === 3) {
    ctx.ellipse(-s * 0.16, -s * 0.24, s * 0.1, s * 0.18, -0.45, 0, Math.PI * 2);
  } else if (suit === 1) {
    ctx.ellipse(-s * 0.25, s * 0.06, s * 0.13, s * 0.22, -0.35, 0, Math.PI * 2);
  } else {
    ctx.ellipse(-s * 0.34, -s * 0.34, s * 0.13, s * 0.21, -0.45, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function rankLabel(rank: Rank): string {
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return String(rank);
}

function drawCardStockBase(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number): void {
  // Subtle rounded drop shadow inside boundary
  roundRectPath(ctx, 1, 1.5, w - 2, h - 2, radius);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fill();

  // Warm luxury ivory card body
  roundRectPath(ctx, 0.75, 0.75, w - 1.5, h - 2, radius);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#fffef9');
  bg.addColorStop(0.55, '#faf3e4');
  bg.addColorStop(1, '#ebe0c9');
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.lineWidth = 1.1;
  ctx.strokeStyle = '#3d3324';
  ctx.stroke();

  // Fine Art-Deco champagne-gold inner border
  roundRectPath(ctx, 3.2, 3.2, w - 6.4, h - 6.8, Math.max(2, radius - 2));
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = 'rgba(184, 146, 62, 0.62)';
  ctx.stroke();
}

function drawPipLayout(ctx: CanvasRenderingContext2D, suit: Suit, rank: Rank, w: number, h: number): void {
  const narrow = w < 75;
  const left = narrow ? 22.5 : 29;
  const right = w - (narrow ? 16 : 25);
  const cx = (left + right) * 0.5;
  const top = narrow ? 18.5 : 19;
  const bot = h - (narrow ? 17.5 : 18);
  const cy = (top + bot) * 0.5;
  const midY1 = (top + cy) * 0.5;
  const midY2 = (cy + bot) * 0.5;
  const pip = narrow ? 9.6 : 11.8;

  const drawMirrored = (px: number, py: number, flip = false) => {
    ctx.save();
    ctx.translate(px, py);
    if (flip) ctx.rotate(Math.PI);
    drawSuitShape(ctx, suit, 0, 0, pip);
    ctx.restore();
  };

  if (rank === 6) {
    for (const py of [top, cy, bot]) {
      drawMirrored(left, py, py > cy);
      drawMirrored(right, py, py > cy);
    }
  } else if (rank === 7) {
    for (const py of [top, cy, bot]) {
      drawMirrored(left, py, py > cy);
      drawMirrored(right, py, py > cy);
    }
    drawMirrored(cx, midY1);
  } else if (rank === 8) {
    for (const py of [top, cy, bot]) {
      drawMirrored(left, py, py > cy);
      drawMirrored(right, py, py > cy);
    }
    drawMirrored(cx, midY1);
    drawMirrored(cx, midY2, true);
  } else if (rank === 9) {
    for (const py of [top, midY1, midY2, bot]) {
      drawMirrored(left, py, py > cy);
      drawMirrored(right, py, py > cy);
    }
    drawMirrored(cx, cy);
  } else if (rank === 10) {
    for (const py of [top, midY1, midY2, bot]) {
      drawMirrored(left, py, py > cy);
      drawMirrored(right, py, py > cy);
    }
    drawMirrored(cx, (top + midY1) * 0.5);
    drawMirrored(cx, (midY2 + bot) * 0.5, true);
  }
}

function drawRoyalCharacter(ctx: CanvasRenderingContext2D, suit: Suit, rank: Rank, w: number, h: number): void {
  const narrow = w < 75;
  const cx = narrow ? w * 0.52 : w * 0.5;
  const cy = narrow ? h * 0.53 : h * 0.51;
  const red = isRedSuit(suit);
  const bodyPrimary = red ? '#d92334' : '#26449e';
  const bodyDark = red ? '#870d19' : '#132258';
  const bodyHighlight = red ? '#ff707c' : '#5e83e6';

  // Subtle soft radial halo behind the character on open card stock (no inner box border)
  ctx.save();
  const haloR = narrow ? 26 : 34;
  const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, haloR);
  halo.addColorStop(0, red ? 'rgba(220, 40, 60, 0.12)' : 'rgba(38, 68, 158, 0.12)');
  halo.addColorStop(0.65, 'rgba(184, 146, 62, 0.05)');
  halo.addColorStop(1, 'rgba(184, 146, 62, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  const illustrated = hdCourtArtMap.get(cardKey({ suit, rank }));
  if (illustrated && illustrated.complete && illustrated.naturalWidth > 0) {
    // Bottom-right corner has no index, so expand portrait down & right cleanly inside the border
    const artSize = narrow ? 53 : 76;
    const dx = narrow ? 7.5 : 8.5;
    const dy = narrow ? 23 : 9.5;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(illustrated, dx, dy, artSize, artSize);
    ctx.restore();
    return;
  }

  // Scale character cleanly inside the royal frame so arms/spear never touch card indices
  const charScale = narrow ? 0.72 : 0.86;
  ctx.translate(cx, cy);
  ctx.scale(charScale, charScale);
  ctx.translate(-cx, -cy);

  // Gentle shadow under character
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 21, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (rank === 12) {
    // Coiffure wave behind Queen head
    ctx.fillStyle = '#2d1812';
    ctx.strokeStyle = '#140b08';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 3, 18.5, 14, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Character spherical body in the playful Nine 1993 spirit
  const bodyGrad = ctx.createRadialGradient(cx - 5, cy - 5, 3, cx, cy + 3, 21);
  bodyGrad.addColorStop(0, bodyHighlight);
  bodyGrad.addColorStop(0.55, bodyPrimary);
  bodyGrad.addColorStop(1, bodyDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#181410';
  ctx.stroke();

  if (rank === 13) {
    // King: velvet ermine shoulders + gold chain + 3-point gold crown
    ctx.fillStyle = '#f5eedc';
    ctx.strokeStyle = '#181410';
    ctx.lineWidth = 1;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + sx * 13, cy + 12, 4.5, 8, -sx * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Gold chain of office
    ctx.strokeStyle = '#e8b948';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 11, 0.35, Math.PI - 0.35);
    ctx.stroke();
    drawSuitShape(ctx, suit, cx, cy + 16, 7);

    // Crown
    const crownGrad = ctx.createLinearGradient(cx - 10, cy - 22, cx + 10, cy - 8);
    crownGrad.addColorStop(0, '#ffe885');
    crownGrad.addColorStop(0.5, '#d99e26');
    crownGrad.addColorStop(1, '#9c6a0c');
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = '#181410';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 8);
    ctx.lineTo(cx - 12, cy - 19);
    ctx.lineTo(cx - 4, cy - 13);
    ctx.lineTo(cx, cy - 22);
    ctx.lineTo(cx + 4, cy - 13);
    ctx.lineTo(cx + 12, cy - 19);
    ctx.lineTo(cx + 10, cy - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (rank === 12) {
    // Queen: royal collar/ruffles + pearl diadem + suit jewel
    ctx.fillStyle = '#1a1a24';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + sx * 14, cy + 10, 5.5, 7.5, -sx * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Necklace
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 10, 0.45, Math.PI - 0.45);
    ctx.stroke();
    drawSuitShape(ctx, suit, cx, cy + 16, 6.5);

    // Pearl & Gold Tiara
    ctx.fillStyle = '#ffd966';
    ctx.strokeStyle = '#181410';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 9);
    ctx.lineTo(cx - 7, cy - 17);
    ctx.lineTo(cx, cy - 21);
    ctx.lineTo(cx + 7, cy - 17);
    ctx.lineTo(cx + 10, cy - 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy - 15, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Jack: gilded belt + feathered beret/helmet + gold halberd & shield
    ctx.strokeStyle = '#e8b948';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 10);
    ctx.quadraticCurveTo(cx, cy + 14, cx + 16, cy + 10);
    ctx.stroke();

    // Halberd shaft + steel spearhead on right
    ctx.fillStyle = '#d49d2a';
    ctx.fillRect(cx + 16, cy - 21, 2.5, 41);
    ctx.fillStyle = '#e5ebf2';
    ctx.strokeStyle = '#181410';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + 17.25, cy - 27);
    ctx.lineTo(cx + 21, cy - 19);
    ctx.lineTo(cx + 17.25, cy - 16);
    ctx.lineTo(cx + 13.5, cy - 19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cavalier feather/plume
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 9);
    ctx.quadraticCurveTo(cx - 9, cy - 20, cx - 2, cy - 22);
    ctx.stroke();
    ctx.fillStyle = red ? '#ffd966' : '#a8c6ff';
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy - 10, 8, 3.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Expressive eyes + nose
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#181410';
  ctx.lineWidth = 0.8;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + sx * 3.6, cy - 1.5, 3, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#111111';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + sx * 3.2, cy - 1.3, 1.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cheerful button nose
  ctx.fillStyle = red ? '#ff5964' : '#5278e8';
  ctx.strokeStyle = '#181410';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2.2, 3.2, 2.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawFullHdCard(suit: Suit, rank: Rank, cardW: number, cardH: number): Texture {
  const narrow = cardW < 75;
  return createHdTexture(cardW, cardH, (ctx, w, h) => {
    drawCardStockBase(ctx, w, h, narrow ? 5.5 : 6);

    if (rank === 14) {
      // Ace Art-Deco sunburst medallion
      const cx = w * 0.5 + (narrow ? 1.2 : 1.5);
      const cy = h * 0.53;
      const rInner = narrow ? 16 : 21;
      const rOuter = narrow ? 19.5 : 25;
      ctx.save();
      ctx.strokeStyle = 'rgba(184, 146, 62, 0.52)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(184, 146, 62, 0.25)';
      ctx.stroke();
      ctx.restore();
      const aceSize = narrow ? (suit === 1 ? 26 : 24) : suit === 1 ? 33 : 30;
      drawSuitShape(ctx, suit, cx, cy, aceSize);
    } else if (rank >= 11) {
      drawRoyalCharacter(ctx, suit, rank, w, h);
    } else {
      drawPipLayout(ctx, suit, rank, w, h);
    }

    const red = isRedSuit(suit);
    const inkColor = red ? '#bd1829' : '#181e2b';
    const label = rankLabel(rank);

    // Top-left corner index only (matches original 1993 Nine card layout)
    ctx.save();
    ctx.fillStyle = inkColor;
    const fontSize = narrow ? (label.length > 1 ? 9.5 : 11) : label.length > 1 ? 10.5 : 12;
    ctx.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const idxX = narrow ? 9.5 : 11.5;
    ctx.fillText(label, idxX, narrow ? 5.5 : 6);
    drawSuitShape(ctx, suit, idxX, narrow ? 19.5 : 22, narrow ? 7.8 : 9);
    ctx.restore();
  });
}

function drawMiniHdCard(suit: Suit, rank: Rank, miniW: number, miniH: number): Texture {
  const narrow = miniW < 33;
  return createHdTexture(miniW, miniH, (ctx, w, h) => {
    drawCardStockBase(ctx, w, h, narrow ? 3.2 : 3.6);
    const red = isRedSuit(suit);
    const inkColor = red ? '#bd1829' : '#181e2b';
    const label = rankLabel(rank);

    // Crisp corner rank
    ctx.fillStyle = inkColor;
    const fontSize = narrow ? (label.length > 1 ? 7.6 : 8.6) : label.length > 1 ? 8.5 : 9.5;
    ctx.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, narrow ? 3.8 : 5, narrow ? 3.2 : 4);

    // Gold inner tint for court cards & aces so key cards pop cleanly on board
    if (rank >= 11 || rank === 14) {
      ctx.fillStyle = red ? 'rgba(200, 30, 50, 0.08)' : 'rgba(20, 40, 110, 0.08)';
      roundRectPath(ctx, narrow ? 3.8 : 5, narrow ? 4.2 : 5, w - (narrow ? 7.6 : 10), h - (narrow ? 8.4 : 10), 2);
      ctx.fill();
    }

    const illustrated = rank >= 11 ? hdCourtArtMap.get(cardKey({ suit, rank })) : undefined;
    if (illustrated && illustrated.complete && illustrated.naturalWidth > 0) {
      drawSuitShape(ctx, suit, narrow ? 6.4 : 7.6, narrow ? 14.5 : 16.5, narrow ? 5.2 : 6.2);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (narrow) {
        ctx.drawImage(illustrated, 6.2, 13.5, 19.5, 19.5);
      } else {
        ctx.drawImage(illustrated, 10.5, 6.5, 25, 25);
      }
      ctx.restore();
      return;
    }

    drawSuitShape(ctx, suit, w * (narrow ? 0.56 : 0.59), h * (narrow ? 0.61 : 0.58), narrow ? 12.2 : rank >= 11 ? 14.5 : 15.5);

    // Tiny royal crown dot accent in upper-right for K/Q/J
    if (rank >= 11) {
      ctx.fillStyle = '#d49d2a';
      ctx.beginPath();
      ctx.arc(w - (narrow ? 6 : 7.5), narrow ? 6.5 : 7.5, narrow ? 1.8 : 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawCardBack(w: number, h: number, radius: number): Texture {
  return createHdTexture(w, h, (ctx, cw, ch) => {
    roundRectPath(ctx, 0.75, 0.75, cw - 1.5, ch - 1.5, radius);
    ctx.fillStyle = '#faf3e4';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#33291b';
    ctx.stroke();

    const inset = Math.max(3, Math.round(cw * 0.065));
    roundRectPath(ctx, inset, inset, cw - inset * 2, ch - inset * 2, Math.max(2, radius - 2));
    const g = ctx.createLinearGradient(0, 0, cw, ch);
    g.addColorStop(0, '#781423');
    g.addColorStop(0.5, '#590d19');
    g.addColorStop(1, '#3d0811');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d8b45c';
    ctx.stroke();

    // Art-Deco diamond lattice
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, inset + 1.5, inset + 1.5, cw - (inset + 1.5) * 2, ch - (inset + 1.5) * 2, Math.max(1.5, radius - 3));
    ctx.clip();

    ctx.strokeStyle = 'rgba(232, 194, 102, 0.35)';
    ctx.lineWidth = 0.7;
    const step = Math.max(6, Math.round(cw * 0.14));
    for (let d = -ch; d < cw + ch; d += step) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + ch, ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(d, ch);
      ctx.lineTo(d + ch, 0);
      ctx.stroke();
    }

    // Center diamond crest
    const cx = cw * 0.5;
    const cy = ch * 0.5;
    const r = Math.min(cw, ch) * 0.16;
    ctx.fillStyle = '#d8b45c';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.82, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.82, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

export function getHdCardLibrary(aspectMode: AspectMode = '4:3'): HdCardLibrary {
  const existing = cachedLibraries[aspectMode];
  if (existing) return existing;

  const isSquare = aspectMode === '1:1';
  const cardW = isSquare ? 64 : 88;
  const cardH = 89;
  const miniW = isSquare ? 28 : 38;
  const miniH = isSquare ? 38 : 37;

  const cards = new Map<string, Texture>();
  const miniCards = new Map<string, Texture>();
  const suits: readonly Suit[] = [1, 2, 3, 4];
  const ranks: readonly Rank[] = [6, 7, 8, 9, 10, 11, 12, 13, 14];

  for (const suit of suits) {
    for (const rank of ranks) {
      const key = cardKey({ suit, rank });
      cards.set(key, drawFullHdCard(suit, rank, cardW, cardH));
      miniCards.set(key, drawMiniHdCard(suit, rank, miniW, miniH));
    }
  }

  const lib: HdCardLibrary = {
    cards,
    miniCards,
    cardBack: drawCardBack(cardW, cardH, isSquare ? 5.5 : 6),
    miniCardBack: drawCardBack(miniW, miniH, isSquare ? 3.2 : 3.6),
  };
  cachedLibraries[aspectMode] = lib;
  return lib;
}

const cachedRivalCardBacks: Record<AspectMode, Texture | null> = {
  '4:3': null,
  '1:1': null,
};

/** Crisp Art-Deco miniature card back displayed in each rival's 2x6 table reserve. */
export function getHdRivalCardBackTexture(aspectMode: AspectMode = '4:3'): Texture {
  const existing = cachedRivalCardBacks[aspectMode];
  if (existing) return existing;

  const rw = aspectMode === '1:1' ? 12 : 14;
  const rh = aspectMode === '1:1' ? 17 : 16;
  const tex = createHdTexture(rw, rh, (ctx, w, h) => {
    roundRectPath(ctx, 0.4, 0.4, w - 0.8, h - 0.8, 2.2);
    ctx.fillStyle = '#faf2e1';
    ctx.fill();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = '#33291b';
    ctx.stroke();

    roundRectPath(ctx, 1.6, 1.6, w - 3.2, h - 3.2, 1.3);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#851627');
    g.addColorStop(0.55, '#590d19');
    g.addColorStop(1, '#39070f');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = '#dfb85c';
    ctx.stroke();

    // Fine diagonal sheen & center diamond emblem
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, 2.2, 2.2, w - 4.4, h - 4.4, 1);
    ctx.clip();
    ctx.strokeStyle = 'rgba(235, 198, 108, 0.28)';
    ctx.lineWidth = 0.55;
    for (let d = -h; d < w + h; d += 4) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(d, h);
      ctx.lineTo(d + h, 0);
      ctx.stroke();
    }
    const cx = w * 0.5;
    const cy = h * 0.5;
    ctx.fillStyle = '#e2be62';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2.6);
    ctx.lineTo(cx + 2.1, cy);
    ctx.lineTo(cx, cy + 2.6);
    ctx.lineTo(cx - 2.1, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  cachedRivalCardBacks[aspectMode] = tex;
  return tex;
}
