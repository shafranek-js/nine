import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Container, Texture, type Ticker } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { AudioController } from '../src/audio/opl2Engine.js';
import { decodeNineRes, encodeNineRes, upsertHighScore } from '../src/core/persistence.js';
import type { LoadedAssets } from '../src/engine/AssetManager.js';
import type { InputController } from '../src/engine/InputController.js';
import type { AspectMode, StageApp } from '../src/engine/StageApp.js';
import { SceneManager, type Scene, type SceneId } from '../src/scenes/SceneManager.js';

function createHarness() {
  const resBytes = new Uint8Array(readFileSync(resolve(process.cwd(), 'public/assets/data/NINE.RES')));
  const cfgBytes = new Uint8Array(readFileSync(resolve(process.cwd(), 'public/assets/data/NINE.CFG')));

  let graphicsMode: 'ega' | 'hd' = 'hd';
  let aspectMode: AspectMode = '4:3';
  const listeners = new Set<(ticker: Ticker) => void>();

  const stage = {
    root: new Container(),
    app: {
      ticker: {
        add(fn: (ticker: Ticker) => void) {
          listeners.add(fn);
        },
        remove(fn: (ticker: Ticker) => void) {
          listeners.delete(fn);
        },
      },
    },
    getGraphicsMode: () => graphicsMode,
    setGraphicsMode: (m: 'ega' | 'hd') => {
      graphicsMode = m;
    },
    getAspectMode: () => aspectMode,
    setAspectMode: (m: AspectMode) => {
      aspectMode = m;
    },
  } as unknown as StageApp;

  const assets = {
    resBytes,
    cfgBytes,
    sheets: {
      TR_NINE: Texture.EMPTY,
      GR_NINE: Texture.EMPTY,
    },
  } as unknown as LoadedAssets;

  const input = {} as InputController;
  const audio = {
    setEnabled: () => {},
    sfx: {
      setSoundProfile: () => {},
    },
  } as unknown as AudioController;

  const manager = new SceneManager({ stage, assets, input, audio });
  const mounted: SceneId[] = [];
  const tableChanges: number[] = [];
  let sessionUpdates = 0;

  const makeScene = (id: SceneId): Scene => ({
    mount() {
      mounted.push(id);
    },
    update() {},
    unmount() {},
    onClubTableChanged(tableId) {
      tableChanges.push(tableId);
    },
    onSessionChanged() {
      sessionUpdates += 1;
    },
  });

  manager.register('intro', () => makeScene('intro'));
  manager.register('dealer', () => makeScene('dealer'));
  manager.register('menu', () => makeScene('menu'));
  manager.register('table', () => makeScene('table'));

  const tick = (deltaMS: number) => {
    for (const fn of listeners) {
      fn({ deltaMS } as Ticker);
    }
  };

  return {
    manager,
    resBytes,
    mounted,
    tableChanges,
    tick,
    getSessionUpdates: () => sessionUpdates,
  };
}

describe('SceneManager audit regression tests', () => {
  it('recomputes clubCarryover when switching club table via unified setClubTable', () => {
    const { manager, resBytes, tableChanges } = createHarness();
    let tables = decodeNineRes(resBytes);
    tables = upsertHighScore(tables, 1, 'Alice', 'pwd', 900);
    tables = upsertHighScore(tables, 2, 'Alice', 'pwd', 300);
    manager.ctx.highScores = tables;
    manager.ctx.goTo('menu', 0);

    manager.ctx.signInPlayer('Alice', 'pwd');
    expect(manager.ctx.sessionPlayer.clubCarryover).toBe(700);

    manager.ctx.setClubTable(2);
    expect(manager.ctx.config.clubTable).toBe(2);
    expect(manager.ctx.sessionPlayer.clubCarryover).toBe(100);
    expect(tableChanges).toEqual([2]);
    manager.destroy();
  });

  it('signs out instead of overwriting or reusing mismatched table password on setClubTable', () => {
    const { manager, resBytes } = createHarness();
    let tables = decodeNineRes(resBytes);
    tables = upsertHighScore(tables, 1, 'Alice', 'one', 900);
    tables = upsertHighScore(tables, 2, 'Alice', 'two', 300);
    manager.ctx.highScores = tables;
    manager.ctx.goTo('menu', 0);

    manager.ctx.signInPlayer('Alice', 'one');
    expect(manager.ctx.sessionPlayer).toEqual({
      loggedIn: true,
      name: 'Alice',
      password: 'one',
      clubCarryover: 700,
    });

    // Table 2 has Alice with a different password ('two'): switching signs out safely
    manager.ctx.setClubTable(2);
    expect(manager.ctx.config.clubTable).toBe(2);
    expect(manager.ctx.sessionPlayer).toEqual({
      loggedIn: false,
      name: '',
      password: '',
      clubCarryover: 0,
    });
    expect(manager.ctx.highScores[2].find((r) => r.name === 'Alice')?.password).toBe('two');

    // Direct signInPlayer on existing table keeps stored password from that table
    manager.ctx.signInPlayer('Alice', 'one');
    expect(manager.ctx.sessionPlayer.password).toBe('two');
    manager.destroy();
  });

  it('updates active session carryover and bumps revision on importNineResBytes', () => {
    const { manager, resBytes } = createHarness();
    let initial = decodeNineRes(resBytes);
    initial = upsertHighScore(initial, 1, 'Alice', 'pwd', 900);
    manager.ctx.highScores = initial;
    manager.ctx.goTo('table', 0);

    manager.ctx.signInPlayer('Alice', 'pwd');
    expect(manager.ctx.sessionPlayer.clubCarryover).toBe(700);
    const revBefore = manager.ctx.getHighScoresRevision();

    let imported = decodeNineRes(resBytes);
    imported = upsertHighScore(imported, 1, 'Alice', 'pwd', 500);
    manager.importNineResBytes(encodeNineRes(imported));

    expect(manager.ctx.getHighScoresRevision()).toBe(revBefore + 1);
    expect(manager.ctx.sessionPlayer.loggedIn).toBe(true);
    expect(manager.ctx.sessionPlayer.clubCarryover).toBe(300);

    // Importing a NINE.RES without the signed-in player signs out instead of keeping stale carryover
    manager.importNineResBytes(resBytes);
    expect(manager.ctx.sessionPlayer.loggedIn).toBe(false);
    expect(manager.ctx.sessionPlayer.clubCarryover).toBe(0);
    manager.destroy();
  });

  it('cancels a pending fade transition when an instant transition is requested', () => {
    const { manager, mounted, tick } = createHarness();
    manager.ctx.goTo('menu', 0);
    expect(manager.getCurrentSceneId()).toBe('menu');

    // Start a delayed fade to 'intro', then immediately snap to 'table'
    manager.ctx.goTo('intro', 250);
    manager.ctx.goTo('table', 0);
    expect(manager.getCurrentSceneId()).toBe('table');

    // Advancing ticks past the old fade duration must not swap back to 'intro'
    tick(100);
    tick(100);
    tick(100);
    expect(manager.getCurrentSceneId()).toBe('table');
    expect(mounted).toEqual(['menu', 'table']);
    manager.destroy();
  });
});
