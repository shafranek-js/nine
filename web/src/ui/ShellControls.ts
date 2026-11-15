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

import { AdvisorMascot, type AdvisorMascotMood } from './AdvisorMascot';
import { formatCardLabel, type AdvisorRecommendation } from '../core/advisor';

export class ShellControls {
  private readonly advisorMascot = new AdvisorMascot();
  private advisorToggleBtn!: HTMLButtonElement;
  private advisorHeadlineEl!: HTMLElement;
  private advisorMetaEl!: HTMLElement;
  private advisorReasonsEl!: HTMLUListElement;
  private advisorCandidatesEl!: HTMLElement;
  private advisorDeductionEl!: HTMLElement;
  private lastAdvisorRenderSig = '';
  private lastLeadersRenderSig = '';
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
      this.manager.ctx.setAspectMode(next);
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
    const exportBtn = this.makeButton('Export Scores', () => {
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
    exportBtn.title = 'Скачать файл рекордов и профилей (NINE.RES)';

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

    const importBtn = this.makeButton('Import Scores', () => {
      this.fileInput.click();
    });
    importBtn.title = 'Загрузить файл рекордов и профилей (NINE.RES)';
    const resetBtn = this.makeButton('Reset Save', () => {
      this.manager.resetLocalSave();
      this.sync();
    }, 'shell-btn-danger');

    navGrid.append(playBtn, tableBtn, menuBtn, introBtn, exportBtn, importBtn, resetBtn);
    navCard.append(navGrid, this.fileInput);

    const coachCard = this.buildCoachCard();

    this.rightPanel.append(clubCard, settingsCard, navCard, coachCard);
  }

  private buildCoachCard(): HTMLElement {
    const card = document.createElement('section');
    card.className = 'panel-card panel-card-grow advisor-card';

    const header = document.createElement('div');
    header.className = 'advisor-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'advisor-title-wrap';
    const title = document.createElement('h2');
    title.className = 'panel-title';
    title.textContent = 'Советник';
    titleWrap.append(title);

    this.advisorToggleBtn = document.createElement('button');
    this.advisorToggleBtn.type = 'button';
    this.advisorToggleBtn.className = 'shell-btn advisor-toggle-btn';
    this.advisorToggleBtn.addEventListener('click', () => {
      this.manager.ctx.setCoachMode(!this.manager.ctx.coachMode);
      this.sync();
    });

    header.append(titleWrap, this.advisorToggleBtn);

    const topRow = document.createElement('div');
    topRow.className = 'advisor-top-row';

    const mascotFrame = document.createElement('div');
    mascotFrame.className = 'advisor-mascot-frame';
    mascotFrame.append(this.advisorMascot.canvas);

    const bubble = document.createElement('div');
    bubble.className = 'advisor-bubble';

    this.advisorHeadlineEl = document.createElement('div');
    this.advisorHeadlineEl.className = 'advisor-headline';

    this.advisorMetaEl = document.createElement('div');
    this.advisorMetaEl.className = 'advisor-meta';

    bubble.append(this.advisorHeadlineEl, this.advisorMetaEl);
    topRow.append(mascotFrame, bubble);

    this.advisorReasonsEl = document.createElement('ul');
    this.advisorReasonsEl.className = 'advisor-reasons';

    this.advisorCandidatesEl = document.createElement('div');
    this.advisorCandidatesEl.className = 'advisor-candidates';

    this.advisorDeductionEl = document.createElement('div');
    this.advisorDeductionEl.className = 'advisor-deduction';

    card.append(
      header,
      topRow,
      this.advisorReasonsEl,
      this.advisorCandidatesEl,
      this.advisorDeductionEl,
    );
    return card;
  }

  private renderAdvisor(inTableScene: boolean): void {
    const coachOn = this.manager.ctx.coachMode;
    const hint: AdvisorRecommendation | null = coachOn ? this.manager.ctx.advisorHint : null;

    let mood: AdvisorMascotMood = 'idle';
    if (!coachOn) {
      mood = 'sleep';
    } else if (hint) {
      mood = hint.action === 'pass' ? 'warnPass' : hint.forced ? 'forced' : 'recommend';
    }
    this.advisorMascot.setMood(mood);

    const sig = `${coachOn ? 1 : 0}|${inTableScene ? 1 : 0}|${
      hint
        ? `${hint.action}|${hint.headline}|${hint.sampleCount}|${hint.reasons.join(';')}|${hint.candidates.length}|${hint.deduction.unseenTotal}|${hint.deduction.excludedLeftCount}|${hint.deduction.excludedRightCount}`
        : 'none'
    }`;
    if (sig === this.lastAdvisorRenderSig) {
      return;
    }
    this.lastAdvisorRenderSig = sig;

    this.advisorToggleBtn.textContent = coachOn ? 'Обучение: ВКЛ' : 'Обучение: ВЫКЛ';
    this.advisorToggleBtn.classList.toggle('is-active', coachOn);

    this.advisorHeadlineEl.replaceChildren();
    this.advisorMetaEl.textContent = '';
    this.advisorReasonsEl.replaceChildren();
    this.advisorCandidatesEl.replaceChildren();
    this.advisorDeductionEl.replaceChildren();

    if (!coachOn) {
      this.advisorHeadlineEl.textContent = 'Подсказки выключены';
      this.advisorMetaEl.textContent = 'Нажмите «Обучение: ВЫКЛ», чтобы включить разбор.';
      this.appendReasonItem(
        'Включите режим обучения — советник оценит скрытые карты и объяснит оптимальный ход.',
      );
      return;
    }

    if (!hint) {
      this.advisorHeadlineEl.textContent = inTableScene ? 'Слежу за раздачей…' : 'Готов к обучению';
      this.advisorMetaEl.textContent = inTableScene
        ? 'Ходят соперники'
        : 'Начните партию за любым столом';
      this.appendReasonItem(
        inTableScene
          ? 'Когда наступит ваш ход, я переберу допустимые расклады и объясню лучший выбор.'
          : 'Во время вашего хода здесь появится оптимальная карта и аргументация.',
      );
      return;
    }

    this.appendCardStyledText(this.advisorHeadlineEl, hint.headline);
    this.advisorMetaEl.textContent = hint.isExact
      ? `Точный перебор (${hint.sampleCount} раскл.)`
      : `Оценка по ${hint.sampleCount} раскл.`;

    for (const reason of hint.reasons) {
      this.appendReasonItem(reason);
    }

    if (hint.candidates.length > 1) {
      const titleEl = document.createElement('div');
      titleEl.className = 'advisor-subhead';
      titleEl.textContent = 'Сравнение ходов';
      this.advisorCandidatesEl.append(titleEl);

      for (let i = 0; i < Math.min(3, hint.candidates.length); i++) {
        const cand = hint.candidates[i];
        const row = document.createElement('div');
        row.className = `advisor-cand-row${i === 0 ? ' is-best' : ''}`;
        if (cand.reasons.length > 0) {
          row.title = cand.reasons.join(' · ');
        }

        const labelSpan = document.createElement('span');
        labelSpan.className = 'advisor-cand-card';
        const prefix = i === 0 ? '★ ' : `${i + 1}. `;
        labelSpan.append(document.createTextNode(prefix));
        this.appendCardStyledText(labelSpan, formatCardLabel(cand.card));

        const statsSpan = document.createElement('span');
        statsSpan.className = 'advisor-cand-stats';
        const winPct = Math.round(cand.winRate * 100);
        const evRounded = Math.round(cand.expectedNetCash);
        const evStr = evRounded >= 0 ? `+$${evRounded}` : `-$${Math.abs(evRounded)}`;
        statsSpan.textContent = `${winPct}% · ${evStr}`;

        row.append(labelSpan, statsSpan);
        this.advisorCandidatesEl.append(row);
      }
    }

    const dedParts: string[] = [`Вне руки: ${hint.deduction.unseenTotal} карт`];
    if (hint.deduction.excludedLeftCount > 0 || hint.deduction.excludedRightCount > 0) {
      dedParts.push(
        `Пасы исключили: Л ${hint.deduction.excludedLeftCount}, П ${hint.deduction.excludedRightCount}`,
      );
    }
    const dedMain = document.createElement('div');
    dedMain.textContent = dedParts.join(' · ');
    this.advisorDeductionEl.append(dedMain);

    if (hint.deduction.certainLeft.length > 0) {
      const leftLine = document.createElement('div');
      leftLine.append(document.createTextNode('Точно слева: '));
      this.appendCardStyledText(
        leftLine,
        hint.deduction.certainLeft.slice(0, 4).map(formatCardLabel).join(', '),
      );
      this.advisorDeductionEl.append(leftLine);
    }
    if (hint.deduction.certainRight.length > 0) {
      const rightLine = document.createElement('div');
      rightLine.append(document.createTextNode('Точно справа: '));
      this.appendCardStyledText(
        rightLine,
        hint.deduction.certainRight.slice(0, 4).map(formatCardLabel).join(', '),
      );
      this.advisorDeductionEl.append(rightLine);
    }
  }

  private appendReasonItem(text: string): void {
    const li = document.createElement('li');
    this.appendCardStyledText(li, text);
    this.advisorReasonsEl.append(li);
  }

  private appendCardStyledText(parent: HTMLElement, text: string): void {
    const tokenRe = /(10|[6789JQKA])([♥♦♠♣])/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenRe.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = document.createElement('span');
      const isRed = match[2] === '♥' || match[2] === '♦';
      span.className = isRed ? 'advisor-card-chip is-red' : 'advisor-card-chip is-black';
      span.textContent = match[0];
      parent.append(span);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parent.append(document.createTextNode(text.slice(lastIndex)));
    }
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
    const canSwitch = tableTelemetry === null;
    const leadersSig = `${config.clubTable}|${canSwitch ? 1 : 0}|${
      sessionPlayer.loggedIn ? sessionPlayer.name.toLowerCase() : ''
    }|${topRows.map((r) => `${r.name.trim()}:${r.score}:${r.password}`).join(',')}`;

    if (leadersSig !== this.lastLeadersRenderSig) {
      this.lastLeadersRenderSig = leadersSig;
      this.leadersListEl.innerHTML = '';
      if (topRows.length === 0) {
        this.leadersListEl.append(this.makeEl('li', 'leader-empty', 'No recorded scores yet'));
      } else {
        for (const row of topRows) {
          const cleanName = row.name.trim();
          const isCurrent =
            sessionPlayer.loggedIn && cleanName.toLowerCase() === sessionPlayer.name.toLowerCase();
          const li = this.makeEl(
            'li',
            `leader-row${canSwitch ? ' is-clickable' : ''}${isCurrent ? ' is-current' : ''}`,
          );
          if (canSwitch && cleanName !== 'Noname') {
            li.title = isCurrent
              ? `Активный игрок: ${cleanName}`
              : `Выбрать игрока ${cleanName} в один клик`;
            li.addEventListener('click', () => {
              this.manager.ctx.signInPlayer(cleanName, row.password);
              this.manager.ctx.audio.sfx.coinChime();
            });
          }
          li.append(
            this.makeEl('span', 'leader-name', isCurrent ? `▶ ${cleanName}` : cleanName),
            this.makeEl('span', 'leader-score', `$${row.score}`),
          );
          this.leadersListEl.append(li);
        }
      }
    }

    this.renderTelemetry(tableTelemetry, playerLabel);
    this.renderAdvisor(tableTelemetry !== null);
  }
}
