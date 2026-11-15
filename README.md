# Monte Carlo / Nine (Gamos, 1993) — Web 1:1 Restoration

A faithful web restoration and HD upgrade of the classic 1993 MS-DOS card game **Monte Carlo / Девятка (`NINE.EXE`, Gamos, 1993)** built with **TypeScript + Vite + PixiJS v8 + Web Audio API**.

The project preserves 1:1 gameplay, card dealing, 3-tier AI, AdLib OPL2 FM synthesis, and binary-compatible `NINE.RES` / `NINE.CFG` save files alongside a toggleable **HD visual/audio overhaul**, **4-language localization**, **3-column responsive club UI**, and an **interactive tactical Advisor** (with optional **X-Ray** mode).

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Features & Architecture](#features--architecture)
- [Rules, Tables & Binary Formats](#rules-tables--binary-formats)
- [Getting Started](#getting-started)
- [Controls & UI](#controls--ui)
- [Testing, Building & Deployment](#testing-building--deployment)

---

## Repository Structure

```text
nine/
├── nine_eng original dos version/   # Original 1993 DOS binaries (read-only reference)
│   ├── NINE.EXE
│   ├── NINE.LIB
│   ├── NINE.MSC
│   ├── NINE.RES
│   └── NINE.CFG
├── nine_decompiled_full/            # Reverse-engineering notes and disassembly references
├── web/                             # Main web application
│   ├── index.html                   # App shell styles & entry HTML
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts               # Base './', Pixi/Vitest Node test config
│   ├── tools/
│   │   └── slice_assets.py          # Asset slicer & manifest generator
│   ├── public/assets/               # Sprites, cards, HD artwork, MP3 tracks/SFX, binary data
│   ├── src/
│   │   ├── main.ts                  # Bootstrap (assets, stage, scenes, audio, shell)
│   │   ├── core/                    # Pure headless game logic
│   │   │   ├── types.ts             # Deck, bounds, match, high-score & config types
│   │   │   ├── rng.ts               # Default & seedable Mulberry32 PRNG
│   │   │   ├── rules.ts             # 36-card deal, legal moves, passes, pot, hand layout
│   │   │   ├── ai.ts                # Disassembly-accurate 3-difficulty bot AI
│   │   │   ├── advisor.ts           # Fair-play PIMC/deduction advisor & optional X-Ray
│   │   │   ├── i18n.ts              # 4 localizations: EN (default), RU, UK, DE
│   │   │   └── persistence.ts       # NINE.RES (600B) / NINE.CFG (2B) CP866 codec & storage
│   │   ├── audio/                   # Dual-mode music & SFX engine
│   │   │   ├── mscParser.ts         # NINE.MSC .MUS + .TIM parser
│   │   │   ├── ym3812Core.ts        # AdLib YM3812 OPL2 core
│   │   │   ├── opl2Engine.ts        # MP3 soundtrack/stingers + OPL2 AudioWorklet/fallback
│   │   │   └── pcSpeaker.ts         # EGA PC Speaker tones & HD acoustic Web Audio / sampled SFX
│   │   ├── engine/                  # PixiJS v8 rendering & input layer
│   │   │   ├── StageApp.ts          # 640×350 logical space (3× HiDPI in HD), 1:1 / 4:3 CRT, scanlines
│   │   │   ├── AssetManager.ts      # Asset loader & binary resource fetcher
│   │   │   ├── BitmapFont.ts        # DOS TR_NINE / GR_NINE bitmap fonts & colorkey slicing
│   │   │   ├── hdCards.ts           # Procedural/illustrated HD cards & centered mini-card pips
│   │   │   ├── hdCharacters.ts      # Animated HD trumpeters, dealer, rivals, candelabras
│   │   │   └── InputController.ts   # Keyboard & coordinate-mapped pointer handling
│   │   ├── scenes/                  # Scene graph & flow
│   │   │   ├── SceneManager.ts      # Scene transitions, shared config, profile & save management
│   │   │   ├── IntroScene.ts        # Title screen with trumpeters
│   │   │   ├── DealerTransitionScene.ts  # Animated dealer welcome/hat-tip transition
│   │   │   ├── ClubMenuScene.ts     # Lobby, leaderboards, F1–F5 actions, CP866 sign-in
│   │   │   └── GameTableScene.ts    # Full match loop, card flights, coin/spark FX, end modal
│   │   └── ui/
│   │       ├── AdvisorMascot.ts     # Animated advisor mascot portrait
│   │       └── ShellControls.ts     # Responsive 3-column desktop/mobile club shell
│   └── tests/                       # Vitest unit & regression test suites (8 files)
│       ├── advisor.test.ts
│       ├── ai.test.ts
│       ├── mscParser.test.ts
│       ├── pcSpeaker.test.ts
│       ├── persistence.test.ts
│       ├── rules.test.ts
│       ├── sceneManager.test.ts
│       └── ym3812.test.ts
└── README.md
```

---

## Features & Architecture

- **Graphics Modes (HD / EGA 93)**:
  - **HD** (default): HiDPI `3×` PixiJS v8 canvas (`1920×1050` backing resolution over `640×350` logical units) with HD backgrounds, card illustrations, centered mini-card pips (`6–10`) matching the original layout, animated dealer/rivals/trumpeters, candlelight flickers, and floating `$20` coins.
  - **EGA 93**: Authentic `640×350` pixel-art mode with nearest-neighbor scaling, original DOS sprite sheets (`TR_NINE`, `GR_NINE`, `VR_NINE`, `ZR_NINE`), and bitmap fonts.
  - Supports **4:3 CRT** and **1:1 PAR** aspect ratios plus optional **CRT Scanlines**.
- **Localization (`en` / `ru` / `uk` / `de`)**:
  - Defaults to **English** and switches live across **English**, **Russian**, **Ukrainian**, and **German** for UI chrome, match logs, scene banners, and Advisor explanations.
- **Dual-Mode Audio**:
  - **Music**: Toggleable between orchestrated **MP3** tracks (`01_intro_fanfare.mp3`–`06_dealer_welcome.mp3`) and cycle-accurate **AdLib OPL2** FM synthesis driven by parsed `NINE.MSC` tracks (`ym3812Core.ts` in `AudioWorklet` with a Web Audio fallback).
  - **SFX**: In **HD**, tactile Web Audio foley (coins, card slides, victory chord) plus a real brass handbell sample (`07_dealer_bell.mp3`, trimmed to match the dealer's `1.50 s` bell-ringing animation, with modal brass synthesis fallback). In **EGA 93**, authentic MS-DOS square-wave PC Speaker tones.
- **Tactical Advisor & Optional X-Ray Mode**:
  - Default **Fair-Play Coach**: Uses card counting, pass-exclusion deduction (`PassExclusions`), and PIMC / exact combination search to evaluate candidate plays by win probability and expected net cash (`EV`).
  - Optional **X-Ray Toggle (`X-Ray: OFF / ON`)**: Reveals exact rival hands in the Advisor panel, flags moves that immediately force rivals to pass, and computes exact full-information rollouts.
- **Hybrid 3-Column Club Layout (`ShellControls.ts`)**:
  - Left panel shows active turn telemetry, seat card counts/cash, live move log, and quick rules.
  - Right panel shows active table stakes, top 3 leaders (with one-click sign-in), display/audio/language toggles, save/table controls, and the live Advisor card.

---

## Rules, Tables & Binary Formats

- **Core Rules (`rules.ts`)**:
  - Standard 36-card deck (`6` through `A` across `♠ ♣ ♦ ♥`), dealt 12 cards each to 3 seats (`1` Left Bot, `2` Right Bot, `3` Human).
  - Every player posts a **`$20` ante** per round (initial pot **`$60`**), starting a match with **`$200`** plus any carried-over club balance.
  - The holder of **`9♦`** must open the round. On subsequent turns, players extend an open suit by `±1` rank (`low - 1` or `high + 1`) or open a new suit with its `9`.
  - If no legal play exists, the player passes and pays **`$20`** into the pot. First to empty their hand wins the pot; the match continues across rounds until a seat goes bankrupt (`cash <= 0`).
- **3 Club Tables (`types.ts`, `ai.ts`)**:
  - All 3 tables use identical stakes (`$20` ante / `$20` pass / `$200` base cash), while `ClubTableId` (`1 | 2 | 3`) controls **bot AI strength** (from Table #1 Classic through Table #3 High Stakes with end-gap safe-9 prioritization and opponent lock-risk evaluation) and selects a separate **10-row leaderboard** in `NINE.RES`.
- **Binary Save Compatibility (`persistence.ts`)**:
  - `NINE.RES` is strictly **600 bytes** (`3 tables × 10 entries × 20 bytes`): `name` (`String[8] XOR 0xFF`), `score` (`int16 LE`), `password` (`String[8] XOR 0xFF`), encoded with lossless CP866 mapping for printable ASCII (`0x20–0x7E`), `А–Я`, `а–я`, `Ё`, `ё`, and `№`.
  - `NINE.CFG` is **2 bytes**: `[soundEnabled, clubTable]`.
  - Browser state persists in `localStorage` and supports downloading/importing real 600-byte `NINE.RES` files compatible with the 1993 DOS executable.

---

## Getting Started

### Prerequisites

- **Node.js** `18+` and **npm**
- *(Optional, asset re-slicing only)* **Python 3** with `Pillow`

### Run Locally

```powershell
cd web
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173/`).

> **Note:** Browsers block Web Audio until the first user gesture. Any click, keypress, or clicking the `Audio` toggle unlocks music and SFX playback.

---

## Controls & UI

### Intro Screen (`IntroScene`)
- Click anywhere or press `Space` / `Enter` / `Esc` / any key to enter the club.

### Club Menu (`ClubMenuScene`)
- **`F1`** / **`1`** or left figure / **`Play`**: Start a match (opens login prompt automatically if signed out).
- **`F2`** / **`2`** or headphones icon: Toggle audio/music (`NINE.CFG`).
- **`F3`** / **`3`** or center figure / **`Switch Table`**: Cycle Club Table `#1` / `#2` / `#3` (cancels any in-progress login input and loads that table's profile carryover).
- **`F4`** / **`4`** or tablet figure / prompt area: Sign in or register (`PLAYER` → `PASSWORD`, up to 8 CP866-encodable characters).
- **`F5`** / **`5`** / **`Esc`** or exit door figure: Return to the intro screen.

### Card Table (`GameTableScene`)
- **Click a highlighted card** in your hand to play it.
- **`Space` / `Enter` / `P`** (or auto-pass after pause) when no moves are legal: Pass (`-$20`).
- **`Esc`**: Return to the Club Menu.

### Sidebar Controls
- **Language**: `EN` / `RU` / `UK` / `DE`.
- **Display & Audio**: `Graphics: HD / EGA 93`, `Audio: ON / OFF`, `Music: MP3 / OPL2`, `Aspect: 4:3 / 1:1`, `CRT: ON / OFF`, `Hide Sidebars` / `Focus View`.
- **Navigation & Save**: `Deal / Play (F1)`, `Switch Table (F3)`, `Club Menu (Esc)`, `Intro (F5)`, `Export .RES`, `Import .RES`, `Reset Save`.
- **Advisor**: `Coach: ON / OFF` and `X-Ray: OFF / ON`.

---

## Testing, Building & Deployment

Run all commands inside `web/`:

```powershell
# Run all Vitest unit & regression tests (8 suites)
npm test

# Strict TypeScript check + production build into web/dist/
npm run build

# Preview the production bundle locally
npm run preview

# (Optional) Re-slice EGA PNG assets and regenerate manifest.json
npm run slice
```

Production builds in `web/dist/` are deployed cleanly as static assets (configured with Vite `base: './'`) to GitHub Pages (`gh-pages` branch) and Cloudflare Pages.
