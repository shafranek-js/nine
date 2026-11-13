import { Container, Graphics, type Ticker } from 'pixi.js';
import type { AudioController } from '../audio/opl2Engine';
import {
  decodeNineCfg,
  decodeNineRes,
  encodeNineRes,
  loadStoredConfig,
  loadStoredHighScores,
  saveStoredConfig,
  saveStoredHighScores,
  type HighScoreTables,
} from '../core/persistence';
import { SCREEN_HEIGHT, SCREEN_WIDTH, type NineConfig } from '../core/types';
import type { LoadedAssets } from '../engine/AssetManager';
import { HudDigitFont, MenuBitmapFont } from '../engine/BitmapFont';
import type { InputController } from '../engine/InputController';
import type { StageApp } from '../engine/StageApp';

export type SceneId = 'intro' | 'menu' | 'table';

export interface SessionPlayer {
  loggedIn: boolean;
  name: string;
  password: string;
  clubCarryover: number;
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
  persistConfig(): void;
  persistHighScores(): void;
  goTo(scene: SceneId, fadeMs?: number): void;
  onStateChange?: () => void;
}

export interface Scene {
  mount(parent: Container, ctx: GameContext): void;
  update(dtMs: number): void;
  unmount(): void;
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
      sessionPlayer: {
        loggedIn: false,
        name: '',
        password: '',
        clubCarryover: 0,
      },
      persistConfig: () => {
        saveStoredConfig(this.ctx.config);
        this.ctx.onStateChange?.();
      },
      persistHighScores: () => {
        saveStoredHighScores(this.ctx.highScores);
        this.ctx.onStateChange?.();
      },
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
    this.ctx.sessionPlayer = {
      loggedIn: false,
      name: '',
      password: '',
      clubCarryover: 0,
    };
    this.ctx.audio.setEnabled(this.ctx.config.soundMusicEnabled);
    this.ctx.persistConfig();
    this.ctx.persistHighScores();
    this.transitionTo('menu', 180);
  }

  exportNineResBytes(): Uint8Array {
    return encodeNineRes(this.ctx.highScores);
  }

  importNineResBytes(bytes: Uint8Array): void {
    this.ctx.highScores = decodeNineRes(bytes);
    this.ctx.persistHighScores();
    if (this.currentId === 'menu') {
      this.transitionTo('menu', 120);
    }
  }

  private transitionTo(nextId: SceneId, fadeMs: number): void {
    if (fadeMs <= 0 || !this.activeScene) {
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
