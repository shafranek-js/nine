import { parseNineMsc } from './audio/mscParser';
import { createAudioController } from './audio/opl2Engine';
import { loadGameAssets } from './engine/AssetManager';
import { InputController } from './engine/InputController';
import { StageApp } from './engine/StageApp';
import { ClubMenuScene } from './scenes/ClubMenuScene';
import { GameTableScene } from './scenes/GameTableScene';
import { IntroScene } from './scenes/IntroScene';
import { SceneManager } from './scenes/SceneManager';
import { ShellControls } from './ui/ShellControls';

async function bootstrap(): Promise<void> {
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('#app mount element missing');

  const assets = await loadGameAssets();
  const tracks = parseNineMsc(assets.mscBytes);

  appEl.innerHTML = '';
  const stageHost = document.createElement('div');
  stageHost.className = 'stage-frame';
  const shellHost = document.createElement('div');
  appEl.append(stageHost, shellHost);

  const stage = new StageApp();
  const canvas = await stage.mount(stageHost);

  const audio = createAudioController();
  audio.music.setTracks(tracks);

  const input = new InputController(canvas);
  const scenes = new SceneManager({ stage, assets, input, audio });
  scenes.register('intro', () => new IntroScene());
  scenes.register('menu', () => new ClubMenuScene());
  scenes.register('table', () => new GameTableScene());

  const shell = new ShellControls(shellHost, scenes);
  scenes.ctx.onStateChange = () => shell.sync();

  input.onFirstGesture(() => {
    void audio.unlock().then(() => shell.sync());
  });

  scenes.ctx.goTo('intro', 0);
}

bootstrap().catch((err) => {
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.innerHTML = `<pre style="color:#ff6b6b;padding:16px">Failed to start Monte Carlo (1993): ${String(err)}</pre>`;
  }
  console.error(err);
});
