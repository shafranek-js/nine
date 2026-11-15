import { parseNineMsc } from './audio/mscParser';
import { createAudioController } from './audio/opl2Engine';
import { loadGameAssets } from './engine/AssetManager';
import { setHdCourtArt } from './engine/hdCards';
import { setHdCandelabraArt, setHdDealerArt, setHdRivalArt, setHdTrumpeterArt } from './engine/hdCharacters';
import { InputController } from './engine/InputController';
import { StageApp } from './engine/StageApp';
import { ClubMenuScene } from './scenes/ClubMenuScene';
import { DealerTransitionScene } from './scenes/DealerTransitionScene';
import { GameTableScene } from './scenes/GameTableScene';
import { IntroScene } from './scenes/IntroScene';
import { SceneManager } from './scenes/SceneManager';
import { ShellControls } from './ui/ShellControls';

async function bootstrap(): Promise<void> {
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('#app mount element missing');

  const assets = await loadGameAssets();
  setHdCourtArt(assets.hdCourtArt);
  setHdRivalArt(assets.hdRivalArt);
  setHdDealerArt(assets.hdDealerArt);
  setHdTrumpeterArt(assets.hdTrumpeterArt);
  setHdCandelabraArt(assets.hdCandelabraArt);
  const tracks = parseNineMsc(assets.mscBytes);

  appEl.innerHTML = '';
  const workspace = document.createElement('div');
  workspace.className = 'club-workspace';
  const leftPanel = document.createElement('aside');
  leftPanel.className = 'side-panel side-panel-left';
  const stageColumn = document.createElement('main');
  stageColumn.className = 'stage-column';
  const stageHost = document.createElement('div');
  stageHost.className = 'stage-frame';
  stageColumn.appendChild(stageHost);
  const rightPanel = document.createElement('aside');
  rightPanel.className = 'side-panel side-panel-right';
  workspace.append(leftPanel, stageColumn, rightPanel);
  appEl.appendChild(workspace);

  const stage = new StageApp();
  const canvas = await stage.mount(stageHost);

  const audio = createAudioController();
  audio.music.setTracks(tracks);

  const input = new InputController(canvas);
  const scenes = new SceneManager({ stage, assets, input, audio });
  scenes.register('intro', () => new IntroScene());
  scenes.register('dealer', () => new DealerTransitionScene());
  scenes.register('menu', () => new ClubMenuScene());
  scenes.register('table', () => new GameTableScene());

  const shell = new ShellControls({
    appRoot: appEl,
    leftHost: leftPanel,
    rightHost: rightPanel,
    stageColumn,
    manager: scenes,
  });
  scenes.ctx.onStateChange = () => shell.sync();

  input.onFirstGesture(() => {
    const wasUnlocked = audio.isUnlocked();
    void audio.unlock().then(() => {
      if (!wasUnlocked && audio.isUnlocked()) {
        shell.sync();
      }
    });
  });
  if (scenes.ctx.config.soundMusicEnabled) {
    void audio.unlock().then(() => shell.sync());
  }

  scenes.ctx.goTo('intro', 0);
}

bootstrap().catch((err) => {
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.innerHTML = `<pre style="color:#ff6b6b;padding:16px">Failed to start Monte Carlo (1993): ${String(err)}</pre>`;
  }
  console.error(err);
});
