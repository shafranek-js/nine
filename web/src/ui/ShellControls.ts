import type { SceneManager } from '../scenes/SceneManager';

export class ShellControls {
  private readonly bar = document.createElement('div');
  private readonly manager: SceneManager;
  private soundBtn!: HTMLButtonElement;
  private musicModeBtn!: HTMLButtonElement;
  private graphicsBtn!: HTMLButtonElement;
  private aspectBtn!: HTMLButtonElement;
  private scanlineBtn!: HTMLButtonElement;
  private statusSpan!: HTMLSpanElement;
  private fileInput!: HTMLInputElement;

  constructor(host: HTMLElement, manager: SceneManager) {
    this.manager = manager;
    this.bar.className = 'shell-bar';

    this.soundBtn = this.makeButton('', () => {
      void this.manager.ctx.audio.unlock();
      const next = !this.manager.ctx.config.soundMusicEnabled;
      this.manager.ctx.config.soundMusicEnabled = next;
      this.manager.ctx.audio.setEnabled(next);
      this.manager.ctx.persistConfig();
      this.sync();
    });

    this.musicModeBtn = this.makeButton('', () => {
      void this.manager.ctx.audio.unlock();
      const music = this.manager.ctx.audio.music;
      const next = music.getMusicMode() === 'mp3' ? 'adlib' : 'mp3';
      music.setMusicMode(next);
      this.sync();
    });

    this.graphicsBtn = this.makeButton('', () => {
      const next = this.manager.ctx.getGraphicsMode() === 'hd' ? 'ega' : 'hd';
      this.manager.ctx.setGraphicsMode(next);
      this.sync();
    });

    this.aspectBtn = this.makeButton('', () => {
      const next = this.manager.ctx.stage.getAspectMode() === '1:1' ? '4:3' : '1:1';
      this.manager.ctx.stage.setAspectMode(next);
      this.sync();
    });

    this.scanlineBtn = this.makeButton('', () => {
      const next = !this.manager.ctx.stage.isScanlinesEnabled();
      this.manager.ctx.stage.setScanlines(next);
      this.sync();
    });

    const resetBtn = this.makeButton('Reset Save', () => {
      this.manager.resetLocalSave();
      this.sync();
    });

    const exportBtn = this.makeButton('Export NINE.RES', () => {
      const bytes = this.manager.exportNineResBytes();
      const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
        type: 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NINE.RES';
      a.click();
      URL.revokeObjectURL(url);
    });

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.res,.RES';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', async () => {
      const file = this.fileInput.files?.[0];
      if (!file) return;
      const buf = new Uint8Array(await file.arrayBuffer());
      if (buf.length === 600) {
        this.manager.importNineResBytes(buf);
        this.sync();
      }
      this.fileInput.value = '';
    });

    const importBtn = this.makeButton('Import NINE.RES', () => {
      this.fileInput.click();
    });

    this.statusSpan = document.createElement('span');
    this.statusSpan.className = 'shell-status';

    this.bar.append(
      this.soundBtn,
      this.musicModeBtn,
      this.graphicsBtn,
      this.aspectBtn,
      this.scanlineBtn,
      exportBtn,
      importBtn,
      resetBtn,
      this.fileInput,
      this.statusSpan,
    );
    host.appendChild(this.bar);
    this.sync();
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shell-btn';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  sync(): void {
    const { config, sessionPlayer, audio } = this.manager.ctx;
    const sndOn = config.soundMusicEnabled;
    const unlocked = audio.isUnlocked();
    this.soundBtn.textContent = sndOn ? (unlocked ? 'Audio: ON' : 'Audio: ON (click to wake)') : 'Audio: OFF';
    this.musicModeBtn.textContent = audio.music.getMusicMode() === 'mp3' ? 'Music: MP3' : 'Music: AdLib OPL2';
    this.graphicsBtn.textContent = this.manager.ctx.getGraphicsMode() === 'hd' ? 'Graphics: HD' : 'Graphics: EGA 1993';
    this.aspectBtn.textContent =
      this.manager.ctx.stage.getAspectMode() === '1:1' ? 'Aspect: PAR 1:1 (640x350)' : 'Aspect: 4:3 EGA CRT';
    this.scanlineBtn.textContent = this.manager.ctx.stage.isScanlinesEnabled() ? 'CRT Scanlines: ON' : 'CRT Scanlines: OFF';

    const playerPart = sessionPlayer.loggedIn ? `Player: ${sessionPlayer.name}` : 'Not signed in (F4)';
    this.statusSpan.textContent = `Table #${config.clubTable} · ${playerPart} · F1 Play · F2 Audio · F3 Table · F4 Sign In · F5 Intro · Esc Menu`;
  }
}
