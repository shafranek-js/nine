#!/usr/bin/env python3
"""
Slice & convert all original MS-DOS NINE.EXE (Gamos 1993) assets
from 02_extracted_pcx_pcc/ and 01_original_files/ into c:/Projects/nine/web/public/assets/.

Preserves exact EGA 640x350 pixel dimensions, original 16-color PCX palettes,
and palette-index-0 transparency (Mask = NOT(P0 | P1 | P2 | P3)) for masked sprites.
"""
from __future__ import annotations

import json
import shutil
import struct
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
PCC_DIR = REPO_ROOT / "nine_decompiled_full" / "02_extracted_pcx_pcc"
ORIG_DIR = REPO_ROOT / "nine_decompiled_full" / "01_original_files"
REF_PNG_DIR = REPO_ROOT / "nine_decompiled_full" / "03_sprites_png"
OUT_DIR = Path(__file__).resolve().parents[1] / "public" / "assets"


def decode_pcx_indices(raw: bytes) -> tuple[int, int, list[tuple[int, int, int]], list[int]]:
    """Decode a 4-plane EGA 1-bpp/plane PCX/PCC into per-pixel palette indices (0..15)."""
    if len(raw) < 128 or raw[0] != 0x0A:
        raise ValueError("Invalid PCX header")
    xmin, ymin, xmax, ymax = struct.unpack_from("<HHHH", raw, 4)
    w = xmax - xmin + 1
    h = ymax - ymin + 1
    num_planes = raw[65]
    bpl = struct.unpack_from("<H", raw, 66)[0]
    pal = [(raw[16 + i * 3], raw[16 + i * 3 + 1], raw[16 + i * 3 + 2]) for i in range(16)]

    # Decode RLE stream
    expected = h * num_planes * bpl
    out = bytearray()
    pos = 128
    n = len(raw)
    while len(out) < expected and pos < n:
        b = raw[pos]
        pos += 1
        if (b & 0xC0) == 0xC0:
            cnt = b & 0x3F
            if pos >= n:
                break
            val = raw[pos]
            pos += 1
            out.extend([val] * cnt)
        else:
            out.append(b)
    if len(out) < expected:
        out.extend([0] * (expected - len(out)))

    # Convert 4 planar bits to linear 0..15 indices
    indices = [0] * (w * h)
    row_stride = num_planes * bpl
    for y in range(h):
        row_off = y * row_stride
        for x in range(w):
            byte_idx = x >> 3
            bit = 7 - (x & 7)
            c = 0
            for p in range(num_planes):
                if (out[row_off + p * bpl + byte_idx] >> bit) & 1:
                    c |= 1 << p
            indices[y * w + x] = c
    return w, h, pal, indices


def pcx_to_image(path: Path, transparent_zero: bool, card_outline: bool = False) -> Image.Image:
    raw = path.read_bytes()
    w, h, pal, indices = decode_pcx_indices(raw)
    im = Image.new("RGBA", (w, h))

    if card_outline:
        # Flood-fill exterior idx==0 from borders, keeping a 1px black outline (8-connected to non-zero pixels)
        # opaque so rounded card corners are transparent while card borders & interior dithered black stay solid.
        from collections import deque
        exterior = bytearray(w * h)
        q: deque[tuple[int, int]] = deque()
        for x in range(w):
            for y in (0, h - 1):
                i = y * w + x
                if indices[i] == 0 and not exterior[i]:
                    exterior[i] = 1
                    q.append((x, y))
        for y in range(h):
            for x in (0, w - 1):
                i = y * w + x
                if indices[i] == 0 and not exterior[i]:
                    exterior[i] = 1
                    q.append((x, y))
        while q:
            cx, cy = q.popleft()
            for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    ni = ny * w + nx
                    if indices[ni] == 0 and not exterior[ni]:
                        exterior[ni] = 1
                        q.append((nx, ny))

        px = []
        for y in range(h):
            for x in range(w):
                idx = indices[y * w + x]
                if idx != 0:
                    alpha = 255
                elif not exterior[y * w + x]:
                    alpha = 255
                else:
                    # Keep 1px black card border around non-zero body
                    touches_body = False
                    for dy in (-1, 0, 1):
                        ny = y + dy
                        if 0 <= ny < h:
                            for dx in (-1, 0, 1):
                                nx = x + dx
                                if 0 <= nx < w and indices[ny * w + nx] != 0:
                                    touches_body = True
                                    break
                        if touches_body:
                            break
                    alpha = 255 if touches_body else 0
                px.append((pal[idx][0], pal[idx][1], pal[idx][2], alpha))
        im.putdata(px)
        return im

    px = [
        (pal[idx][0], pal[idx][1], pal[idx][2], 0 if (transparent_zero and idx == 0) else 255)
        for idx in indices
    ]
    im.putdata(px)
    return im


def find_ci(directory: Path, filename: str) -> Path:
    target = filename.lower()
    for p in directory.iterdir():
        if p.name.lower() == target:
            return p
    raise FileNotFoundError(f"Missing {filename} in {directory}")


def main() -> None:
    for sub in ["backgrounds", "sheets", "cards", "mini_cards", "optional_portraits", "data"]:
        (OUT_DIR / sub).mkdir(parents=True, exist_ok=True)

    # 1. Decode backgrounds and sprite resource sheets (opaque, exact 640x350)
    bg_names = ["ZF_NINE.PCX", "ZR_NINE.PCX", "TF_NINE.PCX", "TR_NINE.PCX", "GF_NINE.PCX", "GR_NINE.PCX", "VR_NINE.PCX"]
    for name in bg_names:
        src = find_ci(PCC_DIR, name)
        im = pcx_to_image(src, transparent_zero=False)
        dest_folder = "backgrounds" if name.startswith(("ZF", "TF", "GF")) else "sheets"
        out_name = name.rsplit(".", 1)[0].upper() + ".png"
        im.save(OUT_DIR / dest_folder / out_name)

        # Verify against 03_sprites_png/backgrounds if present
        ref_path = REF_PNG_DIR / "backgrounds" / out_name
        if ref_path.exists():
            ref = Image.open(ref_path).convert("RGBA")
            assert ref.size == im.size and list(ref.getdata()) == list(im.getdata()), (
                f"Decoded pixel mismatch vs reference for {out_name}"
            )

    # 2. Decode all 36 hand cards (88x89) with index-0 transparent (PutMaskedImage4Plane)
    suit_prefixes = {1: "V", 2: "K", 3: "B", 4: "C"}
    cards_manifest: dict[str, dict[str, int | str]] = {}
    for suit, prefix in suit_prefixes.items():
        for rank in range(6, 15):
            fname = f"{prefix}_{rank}.PCC"
            src = find_ci(PCC_DIR, fname)
            im = pcx_to_image(src, transparent_zero=False, card_outline=True)
            key = f"s{suit}_{rank}"
            out_rel = f"cards/{key}.png"
            im.save(OUT_DIR / out_rel)
            cards_manifest[key] = {"suit": suit, "rank": rank, "w": im.width, "h": im.height, "path": out_rel}

    # 3. Slice 36 mini table cards (38x37) from TR_NINE.PCX (exact ASM coords: x=(suit-1)*37, y=(rank-6)*36)
    tr_img = Image.open(OUT_DIR / "sheets" / "TR_NINE.png")
    mini_manifest: dict[str, dict[str, int | str]] = {}
    for suit in range(1, 5):
        for rank in range(6, 15):
            x = (suit - 1) * 37
            y = (rank - 6) * 36
            crop = tr_img.crop((x, y, x + 38, y + 37))
            key = f"s{suit}_{rank}"
            out_rel = f"mini_cards/{key}.png"
            crop.save(OUT_DIR / out_rel)
            mini_manifest[key] = {"suit": suit, "rank": rank, "srcX": x, "srcY": y, "w": 38, "h": 37, "path": out_rel}

    # 4. Slice optional portraits P1..P16 (index-0 transparent) for archive/future extensions
    for i in range(1, 17):
        src = find_ci(PCC_DIR, f"P{i}.PCC")
        im = pcx_to_image(src, transparent_zero=True)
        im.save(OUT_DIR / "optional_portraits" / f"P{i}.png")

    # 5. Copy original audio/data blobs
    for data_name in ["NINE.MSC", "NINE.RES", "NINE.CFG"]:
        src = find_ci(ORIG_DIR, data_name)
        shutil.copy2(src, OUT_DIR / "data" / data_name)

    # 6. Write exact manifest.json encoding ASM-verified sprite sheet coordinates & metadata
    manifest = {
        "screen": {"width": 640, "height": 350},
        "backgrounds": {
            "ZF_NINE": "backgrounds/ZF_NINE.png",
            "TF_NINE": "backgrounds/TF_NINE.png",
            "GF_NINE": "backgrounds/GF_NINE.png",
        },
        "sheets": {
            "ZR_NINE": "sheets/ZR_NINE.png",
            "TR_NINE": "sheets/TR_NINE.png",
            "GR_NINE": "sheets/GR_NINE.png",
            "VR_NINE": "sheets/VR_NINE.png",
        },
        "cards": cards_manifest,
        "miniCards": mini_manifest,
        "data": {
            "msc": "data/NINE.MSC",
            "res": "data/NINE.RES",
            "cfg": "data/NINE.CFG",
        },
        "coordinates": {
            "tableMiniGrid": {"originX": 145, "originY": 71, "stepX": 39, "stepY": 38, "w": 38, "h": 37},
            "hand": {"topY": 262, "overlapStep": 16, "cardW": 88, "cardH": 89},
            "hudDigits": {"sheet": "GR_NINE", "x": 109, "y0": 94, "stepY": 8, "w": 8, "h": 7, "plusY": 174, "minusY": 182},
            "thermometer": {"sheet": "GR_NINE", "dstX": 455, "dstY": 51, "w": 32, "h": 5, "startX": 119, "stepX": 33, "rowsY": [332, 338, 344]},
        },
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Sliced assets successfully into {OUT_DIR}:")
    print(f"  backgrounds={len(list((OUT_DIR / 'backgrounds').glob('*.png')))}")
    print(f"  sheets={len(list((OUT_DIR / 'sheets').glob('*.png')))}")
    print(f"  cards={len(list((OUT_DIR / 'cards').glob('*.png')))}")
    print(f"  mini_cards={len(list((OUT_DIR / 'mini_cards').glob('*.png')))}")
    print(f"  optional_portraits={len(list((OUT_DIR / 'optional_portraits').glob('*.png')))}")
    print(f"  data={len(list((OUT_DIR / 'data').iterdir()))}")


if __name__ == "__main__":
    main()
