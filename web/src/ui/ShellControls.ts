import { ANTE_AMOUNT, PASS_PENALTY, type ClubTableId, type SeatIndex } from '../core/types';
import type { MoveLogEntry, SceneManager, TableTelemetry } from '../scenes/SceneManager';

const SIDEBAR_STORAGE_KEY = 'nine_sidebars_hidden_v1';

const TABLE_STAKES_LABELS: Record<ClubTableId, string> = {
  1: 'Table #1 · Classic',
  2: 'Table #2 · Club Shark',
  3: 'Table #3 · High Stakes',
};

function loadSidebarHidden(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export class ShellControls {
  private readonly manager: SceneManager;
  private readonly appRoot: HTMLElement;
  private readonly leftPanel: HTMLElement;
  private readonly rightPanel: HTMLElement;
  private readonly focusPill: HTMLButtonElement;
  private sidebarsHidden: boolean;

  // Dynamic left panel nodes
  private leftSceneTitle!: HTMLElement;
  private roundBadge!: HTMLElement;
  private potBadge!: HTMLElement;
  private turnStatusEl!: HTMLElement;
  private seatRowsEl!: HTMLElement;
  private moveLogEl!: HTMLElement;

  // Dynamic right panel nodes
  private clubTableLabelEl!: HTMLElement;
  private playerStatusEl!: HTMLElement;
  private leadersListEl!: HTMLElement;
  private soundBtn!: HTMLButtonElement;
  private musicModeBtn!: HTMLButtonElement;
  private graphicsBtn!: HTMLButtonElement;
  private aspectBtn!: HTMLButtonElement;
  private scanlineBtn!: HTMLButtonElement;
  private hideSidebarsBtn!: HTMLButtonElement;
  private fileInput!: HTMLInputElement;

  constructor(params: {
    appRoot: HTMLElement;
    leftHost: HTMLElement;
    rightHost: HTMLElement;
    stageColumn: HTMLElement;
    manager: SceneManager;
  }) {
    this.manager = params.manager;
    this.appRoot = params.appRoot;
    this.leftPanel = params.leftHost;
    this.rightPanel = params.rightHost;
    this.sidebarsHidden = loadSidebarHidden();

    this.buildLeftPanel();
    this.buildRightPanel();

    this.focusPill = this.makeButton('', () => {
      this.setSidebarsHidden(!this.sidebarsHidden);
    });
    this.focusPill.className = 'focus-toggle-pill';
    params.stageColumn.appendChild(this.focusPill);

    this.applySidebarVisibility();
    this.sync();
  }

  private makeEl<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  private makeButton(label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = extraClass ? `shell-btn ${extraClass}` : 'shell-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      onClick();
      btn.blur();
      this.manager.ctx.stage.getCanvas().focus({ preventScroll: true });
    });
    return btn;
  }

  private buildLeftPanel(): void {
    const matchCard = this.makeEl('section', 'panel-card');
    const head = this.makeEl('div', 'panel-card-head');
    this.leftSceneTitle = this.makeEl('span', 'panel-title', 'Card Table');
    const badges = this.makeEl('div', 'panel-badges');
    this.roundBadge = this.makeEl('span', 'pill-badge', 'Round 1');
    this.potBadge = this.makeEl('span', 'pill-badge pill-gold', 'Pot $0');
    badges.append(this.roundBadge, this.potBadge);
    head.append(this.leftSceneTitle, badges);

    this.turnStatusEl = this.makeEl('div', 'turn-banner', 'Ready at the club');
    this.seatRowsEl = this.makeEl('div', 'seat-list');
    matchCard.append(head, this.turnStatusEl, this.seatRowsEl);

    const logCard = this.makeEl('section', 'panel-card panel-card-grow');
    const logHead = this.makeEl('div', 'panel-card-head');
    logHead.append(this.makeEl('span', 'panel-title', 'Move Log'));
    this.moveLogEl = this.makeEl('ul', 'move-log');
    logCard.append(logHead, this.moveLogEl);

    const rulesCard = this.makeEl('section', 'panel-card');
    const rulesHead = this.makeEl('div', 'panel-card-head');
    rulesHead.append(this.makeEl('span', 'panel-title', 'Rules of Nine'));
    const rulesList = this.makeEl('ul', 'rules-list');
    for (const line of [
      '9♦ opens every round',
      '9 opens any suit; play ±1 rank',
      'Playable cards glow gold in hand',
      `No move: Pass (-$${PASS_PENALTY}), Ante $${ANTE_AMOUNT}`,
    ]) {
      rulesList.append(this.makeEl('li', '', line));
    }
    rulesCard.append(rulesHead, rulesList);

    this.leftPanel.append(matchCard, logCard, rulesCard);
  }

  private buildRightPanel(): void {
    const clubCard = this.makeEl('section', 'panel-card');
    const clubHead = this.makeEl('div', 'panel-card-head');
    clubHead.append(this.makeEl('span', 'panel-title', 'Club Room'));
    this.clubTableLabelEl = this.makeEl('span', 'pill-badge pill-gold', 'Table #1');
    clubHead.append(this.clubTableLabelEl);

    this.playerStatusEl = this.makeEl('div', 'profile-line', 'Guest (F4 Sign In)');
    const leadersTitle = this.makeEl('div', 'sub-heading', 'Top Club Leaders');
    this.leadersListEl = this.makeEl('ol', 'leaders-list');
    clubCard.append(clubHead, this.playerStatusEl, leadersTitle, this.leadersListEl);

    const settingsCard = this.makeEl('section', 'panel-card');
    const settingsHead = this.makeEl('div', 'panel-card-head');
    settingsHead.append(this.makeEl('span', 'panel-title', 'Display & Audio'));
    settingsCard.append(settingsHead);

    const settingsGrid = this.makeEl('div', 'btn-grid');
    this.graphicsBtn = this.makeButton('', () => {
      const next = this.manager.ctx.getGraphicsMode() === 'hd' ? 'ega' : 'hd';
      this.manager.ctx.setGraphicsMode(next);
      this.sync();
    });
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
    this.hideSidebarsBtn = this.makeButton('Hide Sidebars', () => {
      this.setSidebarsHidden(true);
    });
    settingsGrid.append(
      this.graphicsBtn,
      this.soundBtn,
      this.musicModeBtn,
      this.aspectBtn,
      this.scanlineBtn,
      this.hideSidebarsBtn,
    );
    settingsCard.append(settingsGrid);

    const navCard = this.makeEl('section', 'panel-card');
    const navHead = this.makeEl('div', 'panel-card-head');
    navHead.append(this.makeEl('span', 'panel-title', 'Navigation & Save'));
    navCard.append(navHead);

    const navGrid = this.makeEl('div', 'btn-grid btn-grid-2col');
    const playBtn = this.makeButton('Deal / Play (F1)', () => {
      this.manager.ctx.goTo('table', 180);
    });
    const tableBtn = this.makeButton('Switch Table (F3)', () => {
      const next = (((this.manager.ctx.config.clubTable % 3) + 1) as ClubTableId);
      this.manager.ctx.config.clubTable = next;
      this.manager.ctx.persistConfig();
      if (this.manager.getCurrentSceneId() === 'menu') {
        this.manager.ctx.goTo('menu', 0);
      }
      this.sync();
    });
    const menuBtn = this.makeButton('Club Menu (Esc)', () => {
      this.manager.ctx.goTo('menu', 180);
    });
    const introBtn = this.makeButton('Intro (F5)', () => {
      this.manager.ctx.goTo('intro', 180);
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
    const resetBtn = this.makeButton('Reset Save', () => {
      this.manager.resetLocalSave();
      this.sync();
    }, 'shell-btn-danger');

    navGrid.append(playBtn, tableBtn, menuBtn, introBtn, exportBtn, importBtn, resetBtn);
    navCard.append(navGrid, this.fileInput);

    this.rightPanel.append(clubCard, settingsCard, navCard);
  }

  private setSidebarsHidden(hidden: boolean): void {
    this.sidebarsHidden = hidden;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, hidden ? '1' : '0');
    } catch {
      // Ignore storage restriction
    }
    this.applySidebarVisibility();
    this.sync();
  }

  private applySidebarVisibility(): void {
    this.appRoot.classList.toggle('sidebars-hidden', this.sidebarsHidden);
    this.focusPill.textContent = this.sidebarsHidden ? 'Show Club Panels' : 'Focus View';
    this.manager.ctx.stage.applyViewportFit();
  }

  private renderTelemetry(telemetry: TableTelemetry | null, playerLabel: string): void {
    const sceneId = this.manager.getCurrentSceneId();
    if (!telemetry) {
      this.leftSceneTitle.textContent = sceneId === 'menu' ? 'Club Lobby' : sceneId === 'dealer' ? 'Dealing...' : 'Monte Carlo 1993';
      this.roundBadge.textContent = 'Lobby';
      this.potBadge.textContent = `Ante $${ANTE_AMOUNT}`;
      this.turnStatusEl.textContent =
        sceneId === 'menu' ? 'Pick F1 Play, F3 Switch Table, or F4 Sign In.' : 'Enter the club lobby to start a deal.';
      this.seatRowsEl.innerHTML = '';
      this.moveLogEl.innerHTML = '';
      this.moveLogEl.append(this.makeEl('li', 'move-empty', 'Deal a round to see live play history.'));
      return;
    }

    this.leftSceneTitle.textContent = 'Active Match';
    this.roundBadge.textContent = `Round #${telemetry.roundNumber}`;
    this.potBadge.textContent = `Pot $${telemetry.bank}`;

    const turnLabel =
      telemetry.phase === 'roundEnd'
        ? 'Round finished'
        : telemetry.phase === 'matchEnd'
          ? 'Match complete'
          : telemetry.currentTurn === 3
            ? `Your turn (${playerLabel})`
            : telemetry.currentTurn === 1
              ? 'Left Rival thinking...'
              : telemetry.currentTurn === 2
                ? 'Right Rival thinking...'
                : 'Dealing ante...';
    this.turnStatusEl.textContent = turnLabel;

    const seats: readonly { seat: SeatIndex; name: string }[] = [
      { seat: 1, name: 'Left Rival' },
      { seat: 2, name: 'Right Rival' },
      { seat: 3, name: playerLabel },
    ];
    this.seatRowsEl.innerHTML = '';
    for (const s of seats) {
      const row = this.makeEl('div', telemetry.currentTurn === s.seat ? 'seat-row seat-row-active' : 'seat-row');
      const left = this.makeEl('span', 'seat-name', s.name);
      const mid = this.makeEl('span', 'seat-cards', `${telemetry.handCounts[s.seat]} cards`);
      const right = this.makeEl('span', 'seat-cash', `$${telemetry.cash[s.seat]}`);
      row.append(left, mid, right);
      this.seatRowsEl.append(row);
    }

    this.moveLogEl.innerHTML = '';
    if (telemetry.moves.length === 0) {
      this.moveLogEl.append(this.makeEl('li', 'move-empty', 'Waiting for 9♦ opening move...'));
    } else {
      for (const m of telemetry.moves) {
        this.moveLogEl.append(this.makeMoveItem(m));
      }
    }
  }

  private makeMoveItem(entry: MoveLogEntry): HTMLLIElement {
    const li = this.makeEl('li', `move-item move-${entry.kind}`, entry.text);
    return li;
  }

  sync(): void {
    const { config, sessionPlayer, audio, highScores, tableTelemetry } = this.manager.ctx;
    const sndOn = config.soundMusicEnabled;
    const unlocked = audio.isUnlocked();
    const playerLabel = sessionPlayer.loggedIn ? sessionPlayer.name : 'You';

    this.soundBtn.textContent = sndOn ? (unlocked ? 'Audio: ON' : 'Audio: Wake') : 'Audio: OFF';
    this.musicModeBtn.textContent = audio.music.getMusicMode() === 'mp3' ? 'Music: MP3' : 'Music: OPL2';
    this.graphicsBtn.textContent = this.manager.ctx.getGraphicsMode() === 'hd' ? 'Graphics: HD' : 'Graphics: EGA 93';
    this.aspectBtn.textContent = this.manager.ctx.stage.getAspectMode() === '1:1' ? 'Aspect: 1:1' : 'Aspect: 4:3';
    this.scanlineBtn.textContent = this.manager.ctx.stage.isScanlinesEnabled() ? 'CRT: ON' : 'CRT: OFF';

    this.clubTableLabelEl.textContent = TABLE_STAKES_LABELS[config.clubTable];
    this.playerStatusEl.textContent = sessionPlayer.loggedIn
      ? `Signed in: ${sessionPlayer.name} (Carryover $${200 + sessionPlayer.clubCarryover})`
      : 'Guest session · Press F4 in Menu to sign in';

    const tableRows = highScores[config.clubTable] ?? [];
    const topRows = [...tableRows]
      .filter((r) => {
        const clean = r.name.trim();
        return clean.length > 0 && !(clean === 'Noname' && r.score === 0);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    this.leadersListEl.innerHTML = '';
    if (topRows.length === 0) {
      this.leadersListEl.append(this.makeEl('li', 'leader-empty', 'No recorded scores yet'));
    } else {
      for (const row of topRows) {
        const li = this.makeEl('li', 'leader-row');
        li.append(this.makeEl('span', 'leader-name', row.name.trim()), this.makeEl('span', 'leader-score', `$${row.score}`));
        this.leadersListEl.append(li);
      }
    }

    this.renderTelemetry(tableTelemetry, playerLabel);
  }
}
