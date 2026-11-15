import { formatCardLabel, type AdvisorRecommendation } from '../core/advisor';
import { getTranslations, SUPPORTED_LANGUAGES, type Language } from '../core/i18n';
import { ANTE_AMOUNT, type Card, type ClubTableId, type SeatIndex } from '../core/types';
import type { MoveLogEntry, SceneManager, TableTelemetry } from '../scenes/SceneManager';
import { AdvisorMascot, type AdvisorMascotMood } from './AdvisorMascot';

const SIDEBAR_STORAGE_KEY = 'nine_sidebars_hidden_v1';

function loadSidebarHidden(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export class ShellControls {
  private readonly advisorMascot = new AdvisorMascot();
  private advisorTitleEl!: HTMLElement;
  private advisorToggleBtn!: HTMLButtonElement;
  private advisorXrayBtn!: HTMLButtonElement;
  private advisorHeadlineEl!: HTMLElement;
  private advisorMetaEl!: HTMLElement;
  private advisorReasonsEl!: HTMLUListElement;
  private advisorCandidatesEl!: HTMLElement;
  private advisorDeductionEl!: HTMLElement;
  private lastAdvisorRenderSig = '';
  private lastLeadersRenderSig = '';
  private lastLangSig: Language | '' = '';
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
  private moveLogTitleEl!: HTMLElement;
  private moveLogEl!: HTMLElement;
  private rulesTitleEl!: HTMLElement;
  private rulesListEl!: HTMLUListElement;

  // Dynamic right panel nodes
  private clubRoomTitleEl!: HTMLElement;
  private clubTableLabelEl!: HTMLElement;
  private playerStatusEl!: HTMLElement;
  private leadersHeadingEl!: HTMLElement;
  private leadersListEl!: HTMLElement;
  private displayTitleEl!: HTMLElement;
  private langBtns = new Map<Language, HTMLButtonElement>();
  private soundBtn!: HTMLButtonElement;
  private musicModeBtn!: HTMLButtonElement;
  private graphicsBtn!: HTMLButtonElement;
  private aspectBtn!: HTMLButtonElement;
  private scanlineBtn!: HTMLButtonElement;
  private hideSidebarsBtn!: HTMLButtonElement;
  private navTitleEl!: HTMLElement;
  private playBtn!: HTMLButtonElement;
  private tableBtn!: HTMLButtonElement;
  private menuBtn!: HTMLButtonElement;
  private introBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private importBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
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
    this.leftSceneTitle = this.makeEl('span', 'panel-title', '');
    const badges = this.makeEl('div', 'panel-badges');
    this.roundBadge = this.makeEl('span', 'pill-badge', '');
    this.potBadge = this.makeEl('span', 'pill-badge pill-gold', '');
    badges.append(this.roundBadge, this.potBadge);
    head.append(this.leftSceneTitle, badges);

    this.turnStatusEl = this.makeEl('div', 'turn-banner', '');
    this.seatRowsEl = this.makeEl('div', 'seat-list');
    matchCard.append(head, this.turnStatusEl, this.seatRowsEl);

    const logCard = this.makeEl('section', 'panel-card panel-card-grow');
    const logHead = this.makeEl('div', 'panel-card-head');
    this.moveLogTitleEl = this.makeEl('span', 'panel-title', '');
    logHead.append(this.moveLogTitleEl);
    this.moveLogEl = this.makeEl('ul', 'move-log');
    logCard.append(logHead, this.moveLogEl);

    const rulesCard = this.makeEl('section', 'panel-card');
    const rulesHead = this.makeEl('div', 'panel-card-head');
    this.rulesTitleEl = this.makeEl('span', 'panel-title', '');
    rulesHead.append(this.rulesTitleEl);
    this.rulesListEl = this.makeEl('ul', 'rules-list');
    rulesCard.append(rulesHead, this.rulesListEl);

    this.leftPanel.append(matchCard, logCard, rulesCard);
  }

  private buildRightPanel(): void {
    const clubCard = this.makeEl('section', 'panel-card');
    const clubHead = this.makeEl('div', 'panel-card-head');
    this.clubRoomTitleEl = this.makeEl('span', 'panel-title', '');
    this.clubTableLabelEl = this.makeEl('span', 'pill-badge pill-gold', '');
    clubHead.append(this.clubRoomTitleEl, this.clubTableLabelEl);

    this.playerStatusEl = this.makeEl('div', 'profile-line', '');
    this.leadersHeadingEl = this.makeEl('div', 'sub-heading', '');
    this.leadersListEl = this.makeEl('ol', 'leaders-list');
    clubCard.append(clubHead, this.playerStatusEl, this.leadersHeadingEl, this.leadersListEl);

    const settingsCard = this.makeEl('section', 'panel-card');
    const settingsHead = this.makeEl('div', 'panel-card-head');
    this.displayTitleEl = this.makeEl('span', 'panel-title', '');
    settingsHead.append(this.displayTitleEl);
    settingsCard.append(settingsHead);

    const langRow = this.makeEl('div', 'lang-segmented');
    for (const item of SUPPORTED_LANGUAGES) {
      const btn = this.makeButton(
        item.shortLabel,
        () => {
          this.manager.ctx.setLanguage(item.code);
          this.sync();
        },
        'lang-btn',
      );
      btn.title = item.nativeLabel;
      this.langBtns.set(item.code, btn);
      langRow.append(btn);
    }
    settingsCard.append(langRow);

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
    this.hideSidebarsBtn = this.makeButton('', () => {
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
    this.navTitleEl = this.makeEl('span', 'panel-title', '');
    navHead.append(this.navTitleEl);
    navCard.append(navHead);

    const navGrid = this.makeEl('div', 'btn-grid btn-grid-2col');
    this.playBtn = this.makeButton('', () => {
      this.manager.ctx.goTo('table', 180);
    });
    this.tableBtn = this.makeButton('', () => {
      const next = (((this.manager.ctx.config.clubTable % 3) + 1) as ClubTableId);
      this.manager.ctx.setClubTable(next);
      this.sync();
    });
    this.menuBtn = this.makeButton('', () => {
      this.manager.ctx.goTo('menu', 180);
    });
    this.introBtn = this.makeButton('', () => {
      this.manager.ctx.goTo('intro', 180);
    });
    this.exportBtn = this.makeButton('', () => {
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

    this.importBtn = this.makeButton('', () => {
      this.fileInput.click();
    });
    this.resetBtn = this.makeButton('', () => {
      this.manager.resetLocalSave();
      this.sync();
    }, 'shell-btn-danger');

    navGrid.append(
      this.playBtn,
      this.tableBtn,
      this.menuBtn,
      this.introBtn,
      this.exportBtn,
      this.importBtn,
      this.resetBtn,
    );
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
    this.advisorTitleEl = document.createElement('h2');
    this.advisorTitleEl.className = 'panel-title';
    titleWrap.append(this.advisorTitleEl);

    const togglesWrap = document.createElement('div');
    togglesWrap.className = 'advisor-toggles';

    this.advisorToggleBtn = document.createElement('button');
    this.advisorToggleBtn.type = 'button';
    this.advisorToggleBtn.className = 'shell-btn advisor-toggle-btn';
    this.advisorToggleBtn.addEventListener('click', () => {
      this.manager.ctx.setCoachMode(!this.manager.ctx.coachMode);
      this.sync();
    });

    this.advisorXrayBtn = document.createElement('button');
    this.advisorXrayBtn.type = 'button';
    this.advisorXrayBtn.className = 'shell-btn advisor-toggle-btn';
    this.advisorXrayBtn.addEventListener('click', () => {
      const next = !this.manager.ctx.advisorXrayMode;
      this.manager.ctx.setAdvisorXrayMode(next);
      if (next && !this.manager.ctx.coachMode) {
        this.manager.ctx.setCoachMode(true);
      }
      this.sync();
    });

    togglesWrap.append(this.advisorXrayBtn, this.advisorToggleBtn);
    header.append(titleWrap, togglesWrap);

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

  private renderAdvisor(inTableScene: boolean, lang: Language): void {
    const t = getTranslations(lang).advisor;
    const coachOn = this.manager.ctx.coachMode;
    const xrayOn = this.manager.ctx.advisorXrayMode;
    const hint: AdvisorRecommendation | null = coachOn ? this.manager.ctx.advisorHint : null;

    let mood: AdvisorMascotMood = 'idle';
    if (!coachOn) {
      mood = 'sleep';
    } else if (hint) {
      mood = hint.action === 'pass' ? 'warnPass' : hint.forced ? 'forced' : 'recommend';
    }
    this.advisorMascot.setMood(mood);

    const sig = `${lang}|${coachOn ? 1 : 0}|${xrayOn ? 1 : 0}|${inTableScene ? 1 : 0}|${
      hint
        ? `${hint.xrayMode ? 1 : 0}|${hint.action}|${hint.headline}|${hint.sampleCount}|${hint.reasons.join(';')}|${hint.candidates.length}|${hint.deduction.unseenTotal}|${hint.deduction.certainLeft.length}|${hint.deduction.certainRight.length}|${hint.deduction.excludedLeftCount}|${hint.deduction.excludedRightCount}`
        : 'none'
    }`;
    if (sig === this.lastAdvisorRenderSig) {
      return;
    }
    this.lastAdvisorRenderSig = sig;

    this.advisorTitleEl.textContent = t.title;
    this.advisorToggleBtn.textContent = coachOn ? t.coachOn : t.coachOff;
    this.advisorToggleBtn.classList.toggle('is-active', coachOn);
    this.advisorXrayBtn.textContent = xrayOn ? t.xrayOn : t.xrayOff;
    this.advisorXrayBtn.classList.toggle('is-xray-active', xrayOn);

    this.advisorHeadlineEl.replaceChildren();
    this.advisorMetaEl.textContent = '';
    this.advisorReasonsEl.replaceChildren();
    this.advisorCandidatesEl.replaceChildren();
    this.advisorDeductionEl.replaceChildren();

    if (!coachOn) {
      this.advisorHeadlineEl.textContent = t.offHeadline;
      this.advisorMetaEl.textContent = t.offMeta;
      this.appendReasonItem(t.offReason);
      return;
    }

    if (!hint) {
      this.advisorHeadlineEl.textContent = inTableScene ? t.watchingHeadline : t.readyHeadline;
      this.advisorMetaEl.textContent = inTableScene ? t.watchingMeta : t.readyMeta;
      this.appendReasonItem(inTableScene ? t.watchingReason : t.readyReason);
      return;
    }

    this.appendCardStyledText(this.advisorHeadlineEl, hint.headline);
    this.advisorMetaEl.textContent = hint.xrayMode
      ? t.xrayMeta
      : hint.isExact
        ? t.exactMeta(hint.sampleCount)
        : t.approxMeta(hint.sampleCount);

    for (const reason of hint.reasons) {
      this.appendReasonItem(reason);
    }

    if (hint.candidates.length > 1) {
      const titleEl = document.createElement('div');
      titleEl.className = 'advisor-subhead';
      titleEl.textContent = t.compareMoves;
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

    const dedMain = document.createElement('div');
    if (hint.xrayMode) {
      dedMain.textContent = t.xrayHandsHeader(
        hint.deduction.certainLeft.length,
        hint.deduction.certainRight.length,
      );
    } else {
      const dedParts: string[] = [t.unseenCards(hint.deduction.unseenTotal)];
      if (hint.deduction.excludedLeftCount > 0 || hint.deduction.excludedRightCount > 0) {
        dedParts.push(
          t.excludedByPasses(hint.deduction.excludedLeftCount, hint.deduction.excludedRightCount),
        );
      }
      dedMain.textContent = dedParts.join(' · ');
    }
    this.advisorDeductionEl.append(dedMain);

    const appendSeatCards = (label: string, cards: readonly Card[]) => {
      if (cards.length === 0) return;
      const line = document.createElement('div');
      line.className = 'advisor-deduction-hand';
      line.append(document.createTextNode(label));
      const shown = hint.xrayMode ? cards : cards.slice(0, 4);
      this.appendCardStyledText(line, shown.map(formatCardLabel).join(', '));
      this.advisorDeductionEl.append(line);
    };

    appendSeatCards(hint.xrayMode ? t.xrayLeftLabel : t.certainLeft, hint.deduction.certainLeft);
    appendSeatCards(hint.xrayMode ? t.xrayRightLabel : t.certainRight, hint.deduction.certainRight);
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
    const t = getTranslations(this.manager.ctx.getLanguage()).shell;
    this.appRoot.classList.toggle('sidebars-hidden', this.sidebarsHidden);
    this.focusPill.textContent = this.sidebarsHidden ? t.showPanels : t.focusView;
    this.manager.ctx.stage.applyViewportFit();
  }

  private formatMoveEntryText(entry: MoveLogEntry, lang: Language, playerLabel: string): string {
    const ev = entry.event;
    if (!ev) return entry.text;
    const t = getTranslations(lang);
    const seatName = (seat: SeatIndex): string =>
      seat === 1 ? t.shell.leftRival : seat === 2 ? t.shell.rightRival : playerLabel;

    if (ev.type === 'round') return t.scenes.logRound(ev.roundNumber, ev.pot);
    if (ev.type === 'play') return t.scenes.logPlay(seatName(ev.seat), ev.cardLabel);
    if (ev.type === 'pass') return t.scenes.logPass(seatName(ev.seat), ev.penalty);
    return t.scenes.logWin(seatName(ev.seat), ev.roundNumber, ev.pot);
  }

  private renderTelemetry(telemetry: TableTelemetry | null, playerLabel: string, lang: Language): void {
    const t = getTranslations(lang).shell;
    const sceneId = this.manager.getCurrentSceneId();
    if (!telemetry) {
      this.leftSceneTitle.textContent =
        sceneId === 'menu' ? t.clubLobby : sceneId === 'dealer' ? t.dealing : t.monteCarloTitle;
      this.roundBadge.textContent = t.lobbyBadge;
      this.potBadge.textContent = t.anteBadge(ANTE_AMOUNT);
      this.turnStatusEl.textContent = sceneId === 'menu' ? t.readyBannerMenu : t.readyBannerIntro;
      this.seatRowsEl.innerHTML = '';
      this.moveLogEl.innerHTML = '';
      this.moveLogEl.append(this.makeEl('li', 'move-empty', t.dealToSeeHistory));
      return;
    }

    this.leftSceneTitle.textContent = t.activeMatch;
    this.roundBadge.textContent = t.roundBadge(telemetry.roundNumber);
    this.potBadge.textContent = t.potBadge(telemetry.bank);

    const turnLabel =
      telemetry.phase === 'roundEnd'
        ? t.roundFinished
        : telemetry.phase === 'matchEnd'
          ? t.matchComplete
          : telemetry.currentTurn === 3
            ? t.yourTurn(playerLabel)
            : telemetry.currentTurn === 1
              ? t.leftThinking
              : telemetry.currentTurn === 2
                ? t.rightThinking
                : t.dealingAnte;
    this.turnStatusEl.textContent = turnLabel;

    const seats: readonly { seat: SeatIndex; name: string }[] = [
      { seat: 1, name: t.leftRival },
      { seat: 2, name: t.rightRival },
      { seat: 3, name: playerLabel },
    ];
    this.seatRowsEl.innerHTML = '';
    for (const s of seats) {
      const row = this.makeEl('div', telemetry.currentTurn === s.seat ? 'seat-row seat-row-active' : 'seat-row');
      const left = this.makeEl('span', 'seat-name', s.name);
      const mid = this.makeEl('span', 'seat-cards', t.seatCards(telemetry.handCounts[s.seat]));
      const right = this.makeEl('span', 'seat-cash', `$${telemetry.cash[s.seat]}`);
      row.append(left, mid, right);
      this.seatRowsEl.append(row);
    }

    this.moveLogEl.innerHTML = '';
    if (telemetry.moves.length === 0) {
      this.moveLogEl.append(this.makeEl('li', 'move-empty', t.waitingOpeningNine));
    } else {
      for (const m of telemetry.moves) {
        const text = this.formatMoveEntryText(m, lang, playerLabel);
        this.moveLogEl.append(this.makeEl('li', `move-item move-${m.kind}`, text));
      }
    }
  }

  private renderStaticLocalizedLabels(lang: Language): void {
    const tr = getTranslations(lang);
    const s = tr.shell;
    if (this.lastLangSig !== lang) {
      this.lastLangSig = lang;
      this.moveLogTitleEl.textContent = s.moveLogTitle;
      this.rulesTitleEl.textContent = s.rulesTitle;
      this.rulesListEl.replaceChildren();
      for (const line of s.rules) {
        this.rulesListEl.append(this.makeEl('li', '', line));
      }
      this.clubRoomTitleEl.textContent = s.clubRoom;
      this.leadersHeadingEl.textContent = s.topClubLeaders;
      this.displayTitleEl.textContent = s.displayAudio;
      this.hideSidebarsBtn.textContent = s.hideSidebars;
      this.navTitleEl.textContent = s.navSave;
      this.playBtn.textContent = s.dealPlay;
      this.tableBtn.textContent = s.switchTable;
      this.menuBtn.textContent = s.clubMenu;
      this.introBtn.textContent = s.intro;
      this.exportBtn.textContent = s.exportScores;
      this.exportBtn.title = s.exportTip;
      this.importBtn.textContent = s.importScores;
      this.importBtn.title = s.importTip;
      this.resetBtn.textContent = s.resetSave;
      this.focusPill.textContent = this.sidebarsHidden ? s.showPanels : s.focusView;
    }

    for (const [code, btn] of this.langBtns.entries()) {
      btn.classList.toggle('is-active', code === lang);
    }
  }

  sync(): void {
    const { config, sessionPlayer, audio, highScores, tableTelemetry } = this.manager.ctx;
    const lang = this.manager.ctx.getLanguage();
    const tr = getTranslations(lang);
    const s = tr.shell;

    this.renderStaticLocalizedLabels(lang);

    const sndOn = config.soundMusicEnabled;
    const unlocked = audio.isUnlocked();
    const playerLabel = sessionPlayer.loggedIn ? sessionPlayer.name : s.you;

    this.soundBtn.textContent = sndOn ? (unlocked ? s.audioOn : s.audioWake) : s.audioOff;
    this.musicModeBtn.textContent = audio.music.getMusicMode() === 'mp3' ? s.musicMp3 : s.musicOpl2;
    this.graphicsBtn.textContent = this.manager.ctx.getGraphicsMode() === 'hd' ? s.graphicsHd : s.graphicsEga;
    this.aspectBtn.textContent = this.manager.ctx.stage.getAspectMode() === '1:1' ? s.aspect1to1 : s.aspect4to3;
    this.scanlineBtn.textContent = this.manager.ctx.stage.isScanlinesEnabled() ? s.crtOn : s.crtOff;

    this.clubTableLabelEl.textContent = tr.tableStakes[config.clubTable];
    this.playerStatusEl.textContent = sessionPlayer.loggedIn
      ? s.signedIn(sessionPlayer.name, sessionPlayer.clubCarryover)
      : s.guestSession;

    const tableRows = highScores[config.clubTable] ?? [];
    const topRows = [...tableRows]
      .filter((r) => {
        const clean = r.name.trim();
        return clean.length > 0 && !(clean === 'Noname' && r.score === 0);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const canSwitch = tableTelemetry === null;
    const leadersSig = `${lang}|${config.clubTable}|${canSwitch ? 1 : 0}|${
      sessionPlayer.loggedIn ? sessionPlayer.name.toLowerCase() : ''
    }|${topRows.map((r) => `${r.name.trim()}:${r.score}:${r.password}`).join(',')}`;

    if (leadersSig !== this.lastLeadersRenderSig) {
      this.lastLeadersRenderSig = leadersSig;
      this.leadersListEl.innerHTML = '';
      if (topRows.length === 0) {
        this.leadersListEl.append(this.makeEl('li', 'leader-empty', s.noScoresYet));
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
              ? s.activePlayerTip(cleanName)
              : s.oneClickSignInTip(cleanName);
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

    this.renderTelemetry(tableTelemetry, playerLabel, lang);
    this.renderAdvisor(tableTelemetry !== null, lang);
  }
}
