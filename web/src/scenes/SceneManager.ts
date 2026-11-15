import { Container, Graphics, type Ticker } from 'pixi.js';
import type { AudioController } from '../audio/opl2Engine';
import type { AdvisorRecommendation } from '../core/advisor';
import {
  DEFAULT_LANGUAGE,
  getTranslations,
  normalizeLanguage,
  type Language,
} from '../core/i18n';
import {
  decodeNineCfg,
  decodeNineRes,
  encodeNineRes,
  loadStoredConfig,
  loadStoredHighScores,
  loadStoredLastPlayer,
  lookupPlayer,
  saveStoredConfig,
  saveStoredHighScores,
  saveStoredLastPlayer,
  upsertHighScore,
  type HighScoreTables,
} from '../core/persistence';
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  type ClubTableId,
  type NineConfig,
  type SeatIndex,
} from '../core/types';
import type { GraphicsMode, LoadedAssets } from '../engine/AssetManager';
import { HudDigitFont, MenuBitmapFont } from '../engine/BitmapFont';
import type { InputController } from '../engine/InputController';
import type { AspectMode, StageApp } from '../engine/StageApp';

const GRAPHICS_STORAGE_KEY = 'nine_graphics_mode_v1';
const COACH_STORAGE_KEY = 'nine_coach_mode_v1';
const XRAY_STORAGE_KEY = 'nine_advisor_xray_v1';
const LANGUAGE_STORAGE_KEY = 'nine_language_v1';

function loadStoredLanguage(): Language {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function applyDocumentLanguage(lang: Language): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = getTranslations(lang).htmlLang;
    document.title = getTranslations(lang).docTitle;
  }
}

function loadStoredGraphicsMode(): GraphicsMode {
  try {
    const raw = localStorage.getItem(GRAPHICS_STORAGE_KEY);
    if (raw === 'ega' || raw === 'hd') return raw;
  } catch {
    // Ignore storage restriction
  }
  return 'hd';
}

function loadStoredCoachMode(): boolean {
  try {
    return localStorage.getItem(COACH_STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

function loadStoredXrayMode(): boolean {
  try {
    return localStorage.getItem(XRAY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export type SceneId = 'intro' | 'dealer' | 'menu' | 'table';

export interface SessionPlayer {
  loggedIn: boolean;
  name: string;
  password: string;
  clubCarryover: number;
}

export type MoveLogEvent =
  | { readonly type: 'round'; readonly roundNumber: number; readonly pot: number }
  | { readonly type: 'play'; readonly seat: SeatIndex; readonly cardLabel: string }
  | { readonly type: 'pass'; readonly seat: SeatIndex; readonly penalty: number }
  | { readonly type: 'win'; readonly seat: SeatIndex; readonly roundNumber: number; readonly pot: number };

export interface MoveLogEntry {
  id: number;
  kind: 'round' | 'play' | 'pass' | 'win';
  seat?: SeatIndex;
  text: string;
  event?: MoveLogEvent;
}

export interface TableTelemetry {
  roundNumber: number;
  phase: string;
  currentTurn: SeatIndex | null;
  bank: number;
  handCounts: Record<SeatIndex, number>;
  cash: Record<SeatIndex, number>;
  moves: readonly MoveLogEntry[];
}

export interface GameContext {
  readonly stage: StageApp;
  readonly assets: LoadedAssets;
  readonly menuFont: MenuBitmapFont;
  readonly hudFont: HudDigitFont;
  readonly input: InputController;
  readonly audio: AudioController;
  config: NineConfig;
  highScores: HighScoreTables;
  sessionPlayer: SessionPlayer;
  tableTelemetry: TableTelemetry | null;
  coachMode: boolean;
  advisorXrayMode: boolean;
  advisorHint: AdvisorRecommendation | null;
  persistConfig(): void;
  persistHighScores(): void;
  getGraphicsMode(): GraphicsMode;
  setGraphicsMode(mode: GraphicsMode): void;
  getLanguage(): Language;
  setLanguage(lang: Language): void;
  setAspectMode(mode: AspectMode): void;
  setCoachMode(enabled: boolean): void;
  setAdvisorXrayMode(enabled: boolean): void;
  setClubTable(tableId: ClubTableId): void;
  getHighScoresRevision(): number;
  signInPlayer(name: string, password: string): void;
  signOutPlayer(): void;
  getCurrentSceneId(): SceneId | null;
  goTo(scene: SceneId, fadeMs?: number): void;
  onStateChange?: () => void;
}

export interface Scene {
  mount(parent: Container, ctx: GameContext): void;
  update(dtMs: number): void;
  unmount(): void;
  onGraphicsModeChanged?(mode: GraphicsMode): void;
  onAspectModeChanged?(mode: AspectMode): void;
  onCoachModeChanged?(enabled: boolean): void;
  onAdvisorXrayModeChanged?(enabled: boolean): void;
  onClubTableChanged?(tableId: ClubTableId): void;
  onLanguageChanged?(lang: Language): void;
  onSessionChanged?(): void;
}

export class SceneManager {
  readonly ctx: GameContext;
  private readonly sceneLayer = new Container();
  private readonly fadeOverlay = new Graphics();
  private readonly factories = new Map<SceneId, () => Scene>();

  private activeScene: Scene | null = null;
  private currentId: SceneId | null = null;
  private fadeTimer = 0;
  private fadeDuration = 0;
  private fadeDirection: 'none' | 'out' | 'in' = 'none';
  private pendingScene: SceneId | null = null;
  private highScoresRevision = 0;

  constructor(params: {
    stage: StageApp;
    assets: LoadedAssets;
    input: InputController;
    audio: AudioController;
  }) {
    const { stage, assets, input, audio } = params;
    const menuFont = new MenuBitmapFont(assets.sheets.TR_NINE);
    const hudFont = new HudDigitFont(assets.sheets.GR_NINE);

    const config = loadStoredConfig() ?? decodeNineCfg(assets.cfgBytes);
    const highScores = loadStoredHighScores() ?? decodeNineRes(assets.resBytes);
    const lastPlayer = loadStoredLastPlayer();
    const lastHit = lastPlayer ? lookupPlayer(highScores, config.clubTable, lastPlayer.name) : null;
    const initialSession: SessionPlayer = lastPlayer
      ? {
          loggedIn: true,
          name: lastHit?.name ?? lastPlayer.name,
          password: lastHit?.password ?? lastPlayer.password,
          clubCarryover: lastHit ? lastHit.score - 200 : 0,
        }
      : {
          loggedIn: false,
          name: '',
          password: '',
          clubCarryover: 0,
        };
    const initialGraphics = loadStoredGraphicsMode();
    let currentLanguage = loadStoredLanguage();
    applyDocumentLanguage(currentLanguage);
    stage.setGraphicsMode(initialGraphics);
    audio.sfx.setSoundProfile(initialGraphics);
    audio.setEnabled(config.soundMusicEnabled);

    this.fadeOverlay.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x000000);
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = false;

    stage.root.addChild(this.sceneLayer);
    stage.root.addChild(this.fadeOverlay);

    this.ctx = {
      stage,
      assets,
      menuFont,
      hudFont,
      input,
      audio,
      config,
      highScores,
      sessionPlayer: initialSession,
      tableTelemetry: null,
      coachMode: loadStoredCoachMode(),
      advisorXrayMode: loadStoredXrayMode(),
      advisorHint: null,
      persistConfig: () => {
        saveStoredConfig(this.ctx.config);
        this.ctx.onStateChange?.();
      },
      persistHighScores: () => {
        saveStoredHighScores(this.ctx.highScores);
        this.ctx.onStateChange?.();
      },
      getGraphicsMode: () => this.ctx.stage.getGraphicsMode(),
      setGraphicsMode: (mode: GraphicsMode) => {
        if (this.ctx.stage.getGraphicsMode() === mode) return;
        this.ctx.stage.setGraphicsMode(mode);
        this.ctx.audio.sfx.setSoundProfile(mode);
        try {
          localStorage.setItem(GRAPHICS_STORAGE_KEY, mode);
        } catch {
          // Ignore storage errors
        }
        this.activeScene?.onGraphicsModeChanged?.(mode);
        this.ctx.onStateChange?.();
      },
      getLanguage: () => currentLanguage,
      setLanguage: (lang: Language) => {
        const next = normalizeLanguage(lang);
        if (currentLanguage === next) return;
        currentLanguage = next;
        applyDocumentLanguage(next);
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
        } catch {
          // Ignore storage errors
        }
        this.activeScene?.onLanguageChanged?.(next);
        this.ctx.onStateChange?.();
      },
      setAspectMode: (mode: AspectMode) => {
        if (this.ctx.stage.getAspectMode() === mode) return;
        this.ctx.stage.setAspectMode(mode);
        this.activeScene?.onAspectModeChanged?.(mode);
        this.ctx.onStateChange?.();
      },
      setCoachMode: (enabled: boolean) => {
        if (this.ctx.coachMode === enabled) return;
        this.ctx.coachMode = enabled;
        try {
          localStorage.setItem(COACH_STORAGE_KEY, enabled ? '1' : '0');
        } catch {
          // Ignore storage errors
        }
        if (!enabled) {
          this.ctx.advisorHint = null;
        }
        this.activeScene?.onCoachModeChanged?.(enabled);
        this.ctx.onStateChange?.();
      },
      setAdvisorXrayMode: (enabled: boolean) => {
        if (this.ctx.advisorXrayMode === enabled) return;
        this.ctx.advisorXrayMode = enabled;
        try {
          localStorage.setItem(XRAY_STORAGE_KEY, enabled ? '1' : '0');
        } catch {
          // Ignore storage errors
        }
        this.activeScene?.onAdvisorXrayModeChanged?.(enabled);
        this.ctx.onStateChange?.();
      },
      setClubTable: (tableId: ClubTableId) => {
        this.ctx.config.clubTable = tableId;
        this.activeScene?.onClubTableChanged?.(tableId);
        if (this.ctx.sessionPlayer.loggedIn) {
          const existing = lookupPlayer(this.ctx.highScores, tableId, this.ctx.sessionPlayer.name);
          if (existing && existing.password !== this.ctx.sessionPlayer.password) {
            this.ctx.signOutPlayer();
          } else {
            this.ctx.signInPlayer(this.ctx.sessionPlayer.name, this.ctx.sessionPlayer.password);
          }
        } else {
          this.activeScene?.onSessionChanged?.();
          this.ctx.onStateChange?.();
        }
        this.ctx.persistConfig();
      },
      getHighScoresRevision: () => this.highScoresRevision,
      signInPlayer: (name: string, password: string) => {
        const cleanName = name.trim().slice(0, 8);
        if (!cleanName || cleanName.toLowerCase() === 'noname') return;
        const cleanPwd = password.slice(0, 8);
        const existing = lookupPlayer(this.ctx.highScores, this.ctx.config.clubTable, cleanName);
        if (!existing) {
          this.ctx.highScores = upsertHighScore(
            this.ctx.highScores,
            this.ctx.config.clubTable,
            cleanName,
            cleanPwd,
            200,
          );
          this.ctx.persistHighScores();
        }
        const resolvedPwd = existing?.password ?? cleanPwd;
        this.ctx.sessionPlayer = {
          loggedIn: true,
          name: existing?.name ?? cleanName,
          password: resolvedPwd,
          clubCarryover: existing ? existing.score - 200 : 0,
        };
        saveStoredLastPlayer({ name: this.ctx.sessionPlayer.name, password: resolvedPwd });
        this.activeScene?.onSessionChanged?.();
        this.ctx.onStateChange?.();
      },
      signOutPlayer: () => {
        this.ctx.sessionPlayer = {
          loggedIn: false,
          name: '',
          password: '',
          clubCarryover: 0,
        };
        saveStoredLastPlayer(null);
        this.activeScene?.onSessionChanged?.();
        this.ctx.onStateChange?.();
      },
      getCurrentSceneId: () => this.currentId,
      goTo: (scene, fadeMs = 220) => {
        this.transitionTo(scene, fadeMs);
      },
    };

    stage.app.ticker.add(this.onTick);
  }

  register(id: SceneId, factory: () => Scene): void {
    this.factories.set(id, factory);
  }

  getCurrentSceneId(): SceneId | null {
    return this.currentId;
  }

  resetLocalSave(): void {
    this.ctx.config = decodeNineCfg(this.ctx.assets.cfgBytes);
    this.ctx.highScores = decodeNineRes(this.ctx.assets.resBytes);
    this.highScoresRevision += 1;
    this.ctx.sessionPlayer = {
      loggedIn: false,
      name: '',
      password: '',
      clubCarryover: 0,
    };
    saveStoredLastPlayer(null);
    this.ctx.audio.setEnabled(this.ctx.config.soundMusicEnabled);
    this.ctx.persistConfig();
    this.ctx.persistHighScores();
    this.ctx.onStateChange?.();
    this.transitionTo('menu', 180);
  }

  exportNineResBytes(): Uint8Array {
    return encodeNineRes(this.ctx.highScores);
  }

  importNineResBytes(bytes: Uint8Array): void {
    this.ctx.highScores = decodeNineRes(bytes);
    this.highScoresRevision += 1;
    this.ctx.persistHighScores();
    this.reconcileSessionWithHighScores();
    if (this.currentId === 'menu') {
      this.transitionTo('menu', 120);
    }
  }

  private reconcileSessionWithHighScores(): void {
    if (this.ctx.sessionPlayer.loggedIn) {
      const existing = lookupPlayer(
        this.ctx.highScores,
        this.ctx.config.clubTable,
        this.ctx.sessionPlayer.name,
      );
      if (existing && existing.password === this.ctx.sessionPlayer.password) {
        this.ctx.sessionPlayer = {
          loggedIn: true,
          name: existing.name,
          password: existing.password,
          clubCarryover: existing.score - 200,
        };
        saveStoredLastPlayer({ name: existing.name, password: existing.password });
      } else {
        this.ctx.sessionPlayer = {
          loggedIn: false,
          name: '',
          password: '',
          clubCarryover: 0,
        };
        saveStoredLastPlayer(null);
      }
    }
    this.activeScene?.onSessionChanged?.();
    this.ctx.onStateChange?.();
  }

  private transitionTo(nextId: SceneId, fadeMs: number): void {
    if (fadeMs <= 0 || !this.activeScene) {
      this.pendingScene = null;
      this.fadeDirection = 'none';
      this.fadeDuration = 0;
      this.fadeTimer = 0;
      this.fadeOverlay.alpha = 0;
      this.fadeOverlay.visible = false;
      this.swapScene(nextId);
      return;
    }
    this.pendingScene = nextId;
    this.fadeDirection = 'out';
    this.fadeDuration = fadeMs;
    this.fadeTimer = 0;
    this.fadeOverlay.visible = true;
    this.fadeOverlay.alpha = 0;
  }

  private swapScene(nextId: SceneId): void {
    this.activeScene?.unmount();
    this.sceneLayer.removeChildren();

    const factory = this.factories.get(nextId);
    if (!factory) {
      throw new Error(`Unknown scene: ${nextId}`);
    }
    const nextScene = factory();
    this.activeScene = nextScene;
    this.currentId = nextId;
    this.ctx.tableTelemetry = null;
    this.ctx.advisorHint = null;
    nextScene.mount(this.sceneLayer, this.ctx);
    this.ctx.onStateChange?.();
  }

  private onTick = (ticker: Ticker): void => {
    const dtMs = Math.min(100, ticker.deltaMS);
    if (this.fadeDirection === 'out') {
      this.fadeTimer += dtMs;
      this.fadeOverlay.alpha = Math.min(1, this.fadeTimer / this.fadeDuration);
      if (this.fadeTimer >= this.fadeDuration) {
        const nextId = this.pendingScene;
        this.pendingScene = null;
        if (nextId) this.swapScene(nextId);
        this.fadeDirection = 'in';
        this.fadeTimer = 0;
      }
    } else if (this.fadeDirection === 'in') {
      this.fadeTimer += dtMs;
      this.fadeOverlay.alpha = Math.max(0, 1 - this.fadeTimer / this.fadeDuration);
      if (this.fadeTimer >= this.fadeDuration) {
        this.fadeDirection = 'none';
        this.fadeOverlay.visible = false;
      }
    }

    this.activeScene?.update(dtMs);
  };

  destroy(): void {
    this.ctx.stage.app.ticker.remove(this.onTick);
    this.activeScene?.unmount();
    this.activeScene = null;
  }
}
