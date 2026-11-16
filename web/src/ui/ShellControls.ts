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
  private advisorAutoBtn!: HTMLButtonElement;
  private advisorHeadlineEl!: HTMLElement;
  private advisorMetaEl!: HTMLElement;
  private advisorReasonsEl!: HTMLUListElement;
  private advisorCandidatesEl!: HTMLElement;
  private advisorDeductionEl!: HTMLElement;
  private lastAdvisorRenderSig = '';
  private lastLeadersRenderSig = '';
  private lastLangSig: Language | '' = '';
  private lastRulesSig = '';
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
  private modeNineBtn!: HTMLButtonElement;
  private modeFanTanBtn!: HTMLButtonElement;
  private fanTanOptsRow!: HTMLElement;
  private fanTanLeadBtn!: HTMLButtonElement;
  private fanTanPenaltyBtn!: HTMLButtonElement;
  private fanTanPendingNoteEl!: HTMLElement;
  private leadersHeadingEl!: HTMLElement;
  private leadersListEl!: HTMLElement;
  private controlsTitleEl!: HTMLElement;
  private playBtn!: HTMLButtonElement;
  private tableBtn!: HTMLButtonElement;
  private menuBtn!: HTMLButtonElement;
  private soundBtn!: HTMLButtonElement;
  private hideSidebarsBtn!: HTMLButtonElement;
  private settingsBtn!: HTMLButtonElement;

  // Settings modal nodes & state
  private settingsOpen = false;
  private resetArmed = false;
  private resetArmTimer: number | null = null;
  private settingsBackdrop!: HTMLElement;
  private settingsModalTitleEl!: HTMLElement;
  private settingsCloseIconBtn!: HTMLButtonElement;
  private settingsDoneBtn!: HTMLButtonElement;
  private settingsLangTitleEl!: HTMLElement;
  private settingsDisplayTitleEl!: HTMLElement;
  private settingsSavesTitleEl!: HTMLElement;
  private langBtns = new Map<Language, HTMLButtonElement>();
  private musicModeBtn!: HTMLButtonElement;
  private graphicsBtn!: HTMLButtonElement;
  private aspectBtn!: HTMLButtonElement;
  private scanlineBtn!: HTMLButtonElement;
  private introBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private importBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private fileInput!: HTMLInputElement;

  private readonly handleModalKeyDown = (e: KeyboardEvent): void => {
    if (!this.settingsOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.setSettingsOpen(false);
    } else if (e.key !== 'Tab') {
      e.stopImmediatePropagation();
    }
  };

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
    this.buildSettingsModal();
    window.addEventListener('keydown', this.handleModalKeyDown, true);

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

    const modeRow = this.makeEl('div', 'mode-segmented');
    this.modeNineBtn = this.makeButton(
      '',
      () => {
        this.manager.ctx.setRuleConfig({ variant: 'nine36' });
        this.sync();
      },
      'lang-btn mode-opt-btn',
    );
    this.modeFanTanBtn = this.makeButton(
      '',
      () => {
        this.manager.ctx.setRuleConfig({ variant: 'fantan52' });
        this.sync();
      },
      'lang-btn mode-opt-btn',
    );
    modeRow.append(this.modeNineBtn, this.modeFanTanBtn);

    this.fanTanOptsRow = this.makeEl('div', 'fantan-opts-row');
    this.fanTanLeadBtn = this.makeButton(
      '',
      () => {
        const cur = this.manager.ctx.ruleConfig.fanTanOpening;
        this.manager.ctx.setRuleConfig({
          fanTanOpening: cur === 'sevenDiamonds' ? 'anySeven' : 'sevenDiamonds',
        });
        this.sync();
      },
      'mode-opt-btn',
    );
    this.fanTanPenaltyBtn = this.makeButton(
      '',
      () => {
        const cur = this.manager.ctx.ruleConfig.fanTanHandPenalty;
        this.manager.ctx.setRuleConfig({
          fanTanHandPenalty: cur > 0 ? 0 : 5,
        });
        this.sync();
      },
      'mode-opt-btn',
    );
    this.fanTanOptsRow.append(this.fanTanLeadBtn, this.fanTanPenaltyBtn);
    this.fanTanPendingNoteEl = this.makeEl('div', 'rules-pending-note is-hidden', '');

    this.leadersHeadingEl = this.makeEl('div', 'sub-heading', '');
    this.leadersListEl = this.makeEl('ol', 'leaders-list');
    clubCard.append(
      clubHead,
      this.playerStatusEl,
      modeRow,
      this.fanTanOptsRow,
      this.fanTanPendingNoteEl,
      this.leadersHeadingEl,
      this.leadersListEl,
    );

    const controlsCard = this.makeEl('section', 'panel-card');
    const controlsHead = this.makeEl('div', 'panel-card-head');
    this.controlsTitleEl = this.makeEl('span', 'panel-title', '');
    controlsHead.append(this.controlsTitleEl);
    controlsCard.append(controlsHead);

    const controlsGrid = this.makeEl('div', 'btn-grid btn-grid-2col');
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
    this.soundBtn = this.makeButton('', () => {
      void this.manager.ctx.audio.unlock();
      const next = !this.manager.ctx.config.soundMusicEnabled;
      this.manager.ctx.config.soundMusicEnabled = next;
      this.manager.ctx.audio.setEnabled(next);
      this.manager.ctx.persistConfig();
      this.sync();
    });
    this.hideSidebarsBtn = this.makeButton('', () => {
      this.setSidebarsHidden(true);
    });
    this.settingsBtn = this.makeButton('', () => {
      this.setSettingsOpen(true);
    });
    controlsGrid.append(
      this.playBtn,
      this.tableBtn,
      this.menuBtn,
      this.soundBtn,
      this.hideSidebarsBtn,
      this.settingsBtn,
    );
    controlsCard.append(controlsGrid);

    const coachCard = this.buildCoachCard();

    this.rightPanel.append(clubCard, controlsCard, coachCard);
  }

  private disarmReset(): void {
    if (this.resetArmTimer !== null) {
      window.clearTimeout(this.resetArmTimer);
      this.resetArmTimer = null;
    }
    this.resetArmed = false;
  }

  private setSettingsOpen(open: boolean): void {
    this.settingsOpen = open;
    if (!open) {
      this.disarmReset();
      this.manager.ctx.stage.getCanvas().focus({ preventScroll: true });
    }
    this.settingsBackdrop.classList.toggle('is-hidden', !open);
    this.sync();
  }

  private buildSettingsModal(): void {
    this.settingsBackdrop = this.makeEl('div', 'settings-backdrop is-hidden');
    this.settingsBackdrop.addEventListener('click', (e) => {
      if (e.target === this.settingsBackdrop) {
        this.setSettingsOpen(false);
      }
    });

    const modal = this.makeEl('div', 'settings-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const header = this.makeEl('div', 'settings-header');
    this.settingsModalTitleEl = this.makeEl('span', 'settings-modal-title', '');
    this.settingsCloseIconBtn = this.makeEl('button', 'settings-close-btn', '✕');
    this.settingsCloseIconBtn.type = 'button';
    this.settingsCloseIconBtn.addEventListener('click', () => {
      this.setSettingsOpen(false);
    });
    header.append(this.settingsModalTitleEl, this.settingsCloseIconBtn);

    // 1. Language section
    const langSection = this.makeEl('div', 'settings-section');
    this.settingsLangTitleEl = this.makeEl('div', 'settings-section-title', '');
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
    langSection.append(this.settingsLangTitleEl, langRow);

    // 2. Display & Audio section
    const displaySection = this.makeEl('div', 'settings-section');
    this.settingsDisplayTitleEl = this.makeEl('div', 'settings-section-title', '');
    const displayGrid = this.makeEl('div', 'btn-grid btn-grid-2col');
    this.graphicsBtn = this.makeButton('', () => {
      const next = this.manager.ctx.getGraphicsMode() === 'hd' ? 'ega' : 'hd';
      this.manager.ctx.setGraphicsMode(next);
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
    this.introBtn = this.makeButton(
      '',
      () => {
        this.setSettingsOpen(false);
        this.manager.ctx.goTo('intro', 180);
      },
      'shell-btn-wide',
    );
    displayGrid.append(
      this.graphicsBtn,
      this.musicModeBtn,
      this.aspectBtn,
      this.scanlineBtn,
      this.introBtn,
    );
    displaySection.append(this.settingsDisplayTitleEl, displayGrid);

    // 3. Saves & DOS Data section
    const savesSection = this.makeEl('div', 'settings-section');
    this.settingsSavesTitleEl = this.makeEl('div', 'settings-section-title', '');
    const savesGrid = this.makeEl('div', 'btn-grid btn-grid-2col');
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
    this.resetBtn = this.makeButton(
      '',
      () => {
        if (!this.resetArmed) {
          this.resetArmed = true;
          this.resetArmTimer = window.setTimeout(() => {
            this.disarmReset();
            this.sync();
          }, 4000);
          this.sync();
          return;
        }
        this.disarmReset();
        this.manager.resetLocalSave();
        this.sync();
      },
      'shell-btn-danger',
    );
    savesGrid.append(this.exportBtn, this.importBtn, this.resetBtn);
    savesSection.append(this.settingsSavesTitleEl, savesGrid, this.fileInput);

    const footer = this.makeEl('div', 'settings-footer');
    this.settingsDoneBtn = this.makeButton(
      '',
      () => {
        this.setSettingsOpen(false);
      },
      'settings-done-btn',
    );
    footer.append(this.settingsDoneBtn);

    modal.append(header, langSection, displaySection, savesSection, footer);
    this.settingsBackdrop.append(modal);
    this.appRoot.append(this.settingsBackdrop);
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

    const makeAdvisorToggle = (onClick: () => void): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shell-btn advisor-toggle-btn';
      btn.addEventListener('click', () => {
        onClick();
        this.sync();
      });
      return btn;
    };

    this.advisorToggleBtn = makeAdvisorToggle(() => {
      this.manager.ctx.setCoachMode(!this.manager.ctx.coachMode);
    });

    this.advisorXrayBtn = makeAdvisorToggle(() => {
      const next = !this.manager.ctx.advisorXrayMode;
      this.manager.ctx.setAdvisorXrayMode(next);
      if (next && !this.manager.ctx.coachMode) {
        this.manager.ctx.setCoachMode(true);
      }
    });

    this.advisorAutoBtn = makeAdvisorToggle(() => {
      const next = !this.manager.ctx.advisorAutoPlayMode;
      this.manager.ctx.setAdvisorAutoPlayMode(next);
      if (next && !this.manager.ctx.coachMode) {
        this.manager.ctx.setCoachMode(true);
      }
    });

    togglesWrap.append(this.advisorAutoBtn, this.advisorXrayBtn, this.advisorToggleBtn);
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
    const autoOn = this.manager.ctx.advisorAutoPlayMode;
    const hint: AdvisorRecommendation | null = coachOn ? this.manager.ctx.advisorHint : null;

    let mood: AdvisorMascotMood = 'idle';
    if (!coachOn) {
      mood = 'sleep';
    } else if (hint) {
      mood = hint.action === 'pass' ? 'warnPass' : hint.forced ? 'forced' : 'recommend';
    }
    this.advisorMascot.setMood(mood);

    const sig = `${lang}|${coachOn ? 1 : 0}|${xrayOn ? 1 : 0}|${autoOn ? 1 : 0}|${inTableScene ? 1 : 0}|${
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
    this.advisorAutoBtn.textContent = autoOn ? t.autoOn : t.autoOff;
    this.advisorAutoBtn.classList.toggle('is-auto-active', autoOn);

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
    const tokenRe = /(10|[2-9JQKA])([♥♦♠♣])/g;
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
      const activeOpening =
        telemetry.ruleConfig?.fanTanOpening ?? this.manager.ctx.ruleConfig.fanTanOpening;
      const waitMsg =
        telemetry.variant === 'fantan52'
          ? t.waitingOpeningFanTan(activeOpening)
          : t.waitingOpeningNine;
      this.moveLogEl.append(this.makeEl('li', 'move-empty', waitMsg));
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
      this.clubRoomTitleEl.textContent = s.clubRoom;
      this.leadersHeadingEl.textContent = s.topClubLeaders;
      this.controlsTitleEl.textContent = s.controlsTitle;
      this.playBtn.textContent = s.dealPlay;
      this.tableBtn.textContent = s.switchTable;
      this.menuBtn.textContent = s.clubMenu;
      this.hideSidebarsBtn.textContent = s.hideSidebars;
      this.settingsBtn.textContent = `⚙ ${s.settingsBtn}`;
      this.settingsModalTitleEl.textContent = s.settingsTitle;
      this.settingsLangTitleEl.textContent = s.settingsLangSection;
      this.settingsDisplayTitleEl.textContent = s.settingsDisplaySection;
      this.settingsSavesTitleEl.textContent = s.settingsSavesSection;
      this.settingsDoneBtn.textContent = s.settingsClose;
      this.introBtn.textContent = s.intro;
      this.exportBtn.textContent = s.exportScores;
      this.exportBtn.title = s.exportTip;
      this.importBtn.textContent = s.importScores;
      this.importBtn.title = s.importTip;
      this.focusPill.textContent = this.sidebarsHidden ? s.showPanels : s.focusView;
    }

    const rc = this.manager.ctx.tableTelemetry?.ruleConfig ?? this.manager.ctx.ruleConfig;
    const rulesSig = `${lang}|${rc.variant}|${rc.fanTanOpening}|${rc.fanTanHandPenalty}`;
    if (this.lastRulesSig !== rulesSig) {
      this.lastRulesSig = rulesSig;
      const lines =
        rc.variant === 'fantan52'
          ? s.fanTanRules(rc.fanTanOpening, rc.fanTanHandPenalty)
          : s.rules;
      this.rulesTitleEl.textContent = rc.variant === 'fantan52' ? s.fanTanRulesTitle : s.rulesTitle;
      this.rulesListEl.replaceChildren();
      for (const line of lines) {
        this.rulesListEl.append(this.makeEl('li', '', line));
      }
    }

    for (const [code, btn] of this.langBtns.entries()) {
      btn.classList.toggle('is-active', code === lang);
    }
  }

  sync(): void {
    const { config, ruleConfig, sessionPlayer, audio, tableTelemetry } = this.manager.ctx;
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
    this.resetBtn.textContent = this.resetArmed ? s.resetSaveConfirm : s.resetSave;
    this.resetBtn.classList.toggle('is-armed', this.resetArmed);

    const isFanTan = ruleConfig.variant === 'fantan52';
    const isEga = this.manager.ctx.getGraphicsMode() === 'ega';
    this.modeNineBtn.textContent = s.modeNine36;
    this.modeFanTanBtn.textContent = s.modeFanTan52;
    this.modeFanTanBtn.title = isEga ? s.fanTanHdOnlyTip : '';
    this.modeNineBtn.classList.toggle('is-active', !isFanTan);
    this.modeFanTanBtn.classList.toggle('is-active', isFanTan);
    this.fanTanOptsRow.classList.toggle('is-hidden', !isFanTan);
    this.fanTanLeadBtn.textContent =
      ruleConfig.fanTanOpening === 'anySeven' ? s.fanTanLeadAny7 : s.fanTanLead7D;
    this.fanTanLeadBtn.classList.toggle('is-active', ruleConfig.fanTanOpening === 'anySeven');
    this.fanTanPenaltyBtn.textContent =
      ruleConfig.fanTanHandPenalty > 0
        ? s.fanTanPenaltyOn(ruleConfig.fanTanHandPenalty)
        : s.fanTanPenaltyOff;
    this.fanTanPenaltyBtn.classList.toggle('is-active', ruleConfig.fanTanHandPenalty > 0);

    const activeMatchRules = tableTelemetry?.ruleConfig;
    const hasPendingRuleChange = Boolean(
      isFanTan &&
        activeMatchRules &&
        activeMatchRules.variant === 'fantan52' &&
        (activeMatchRules.fanTanOpening !== ruleConfig.fanTanOpening ||
          activeMatchRules.fanTanHandPenalty !== ruleConfig.fanTanHandPenalty),
    );
    this.fanTanPendingNoteEl.classList.toggle('is-hidden', !hasPendingRuleChange);
    this.fanTanPendingNoteEl.textContent =
      hasPendingRuleChange && activeMatchRules
        ? s.nextMatchRulesNote(activeMatchRules.fanTanOpening, activeMatchRules.fanTanHandPenalty)
        : '';

    this.clubTableLabelEl.textContent = isFanTan
      ? `${tr.tableStakes[config.clubTable]} · ${s.fanTanLeadersTag}`
      : tr.tableStakes[config.clubTable];
    this.playerStatusEl.textContent = sessionPlayer.loggedIn
      ? s.signedIn(sessionPlayer.name, sessionPlayer.clubCarryover)
      : s.guestSession;

    const activeTables = this.manager.ctx.getHighScoresForVariant();
    const tableRows = activeTables[config.clubTable] ?? [];
    const topRows = [...tableRows]
      .filter((r) => {
        const clean = r.name.trim();
        return clean.length > 0 && !(clean === 'Noname' && r.score === 0);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const canSwitch = tableTelemetry === null;
    const leadersSig = `${lang}|${ruleConfig.variant}|${config.clubTable}|${canSwitch ? 1 : 0}|${
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
