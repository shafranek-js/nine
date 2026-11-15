import { ANTE_AMOUNT, PASS_PENALTY, type ClubTableId } from './types.js';

export type Language = 'en' | 'ru' | 'uk' | 'de';

export const DEFAULT_LANGUAGE: Language = 'en';

export const SUPPORTED_LANGUAGES: readonly {
  readonly code: Language;
  readonly shortLabel: string;
  readonly nativeLabel: string;
}[] = [
  { code: 'en', shortLabel: 'EN', nativeLabel: 'English' },
  { code: 'ru', shortLabel: 'RU', nativeLabel: 'Русский' },
  { code: 'uk', shortLabel: 'UK', nativeLabel: 'Українська' },
  { code: 'de', shortLabel: 'DE', nativeLabel: 'Deutsch' },
];

export function normalizeLanguage(raw: string | null | undefined): Language {
  const normalized = raw?.trim().toLowerCase().slice(0, 2);
  if (normalized === 'ru' || normalized === 'uk' || normalized === 'de' || normalized === 'en') {
    return normalized;
  }
  return DEFAULT_LANGUAGE;
}

function pluralRuUk(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 19) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export interface Translations {
  readonly htmlLang: Language;
  readonly docTitle: string;
  readonly tableStakes: Record<ClubTableId, string>;
  readonly shell: {
    readonly cardTable: string;
    readonly activeMatch: string;
    readonly clubLobby: string;
    readonly dealing: string;
    readonly monteCarloTitle: string;
    readonly lobbyBadge: string;
    readonly roundBadge: (roundNumber: number) => string;
    readonly potBadge: (pot: number) => string;
    readonly anteBadge: (ante: number) => string;
    readonly readyBannerMenu: string;
    readonly readyBannerIntro: string;
    readonly roundFinished: string;
    readonly matchComplete: string;
    readonly yourTurn: (player: string) => string;
    readonly leftThinking: string;
    readonly rightThinking: string;
    readonly dealingAnte: string;
    readonly leftRival: string;
    readonly rightRival: string;
    readonly you: string;
    readonly playerDefault: string;
    readonly seatCards: (count: number) => string;
    readonly moveLogTitle: string;
    readonly dealToSeeHistory: string;
    readonly waitingOpeningNine: string;
    readonly rulesTitle: string;
    readonly rules: readonly [string, string, string, string];
    readonly clubRoom: string;
    readonly signedIn: (name: string, carryover: number) => string;
    readonly guestSession: string;
    readonly topClubLeaders: string;
    readonly noScoresYet: string;
    readonly activePlayerTip: (name: string) => string;
    readonly oneClickSignInTip: (name: string) => string;
    readonly displayAudio: string;
    readonly graphicsHd: string;
    readonly graphicsEga: string;
    readonly audioOn: string;
    readonly audioWake: string;
    readonly audioOff: string;
    readonly musicMp3: string;
    readonly musicOpl2: string;
    readonly aspect1to1: string;
    readonly aspect4to3: string;
    readonly crtOn: string;
    readonly crtOff: string;
    readonly hideSidebars: string;
    readonly showPanels: string;
    readonly focusView: string;
    readonly navSave: string;
    readonly dealPlay: string;
    readonly switchTable: string;
    readonly clubMenu: string;
    readonly intro: string;
    readonly exportScores: string;
    readonly exportTip: string;
    readonly importScores: string;
    readonly importTip: string;
    readonly resetSave: string;
  };
  readonly scenes: {
    readonly introPrompt: string;
    readonly dealerWelcome: string;
    readonly menuClubTable: (roman: string) => string;
    readonly menuHighScores: string;
    readonly menuNewPlayer: string;
    readonly menuPassword: string;
    readonly menuClickOrF4: string;
    readonly menuShuffling: string;
    readonly menuBtnPlay: string;
    readonly menuBtnAudioOn: string;
    readonly menuBtnAudioOff: string;
    readonly menuBtnTable: (roman: string) => string;
    readonly menuBtnSignIn: string;
    readonly menuBtnExit: string;
    readonly tableBankLabel: string;
    readonly tableNoLegalMovesPass: (penalty: number) => string;
    readonly matchEndVictory: string;
    readonly matchEndBankrupt: string;
    readonly finalCash: (cash: number) => string;
    readonly clubScore: (score: number) => string;
    readonly continuePrompt: string;
    readonly logRound: (roundNumber: number, pot: number) => string;
    readonly logPlay: (seatName: string, cardLabel: string) => string;
    readonly logPass: (seatName: string, penalty: number) => string;
    readonly logWin: (seatName: string, roundNumber: number, pot: number) => string;
  };
  readonly advisor: {
    readonly title: string;
    readonly coachOn: string;
    readonly coachOff: string;
    readonly offHeadline: string;
    readonly offMeta: string;
    readonly offReason: string;
    readonly watchingHeadline: string;
    readonly watchingMeta: string;
    readonly watchingReason: string;
    readonly readyHeadline: string;
    readonly readyMeta: string;
    readonly readyReason: string;
    readonly exactMeta: (samples: number) => string;
    readonly approxMeta: (samples: number) => string;
    readonly compareMoves: string;
    readonly unseenCards: (count: number) => string;
    readonly excludedByPasses: (leftCount: number, rightCount: number) => string;
    readonly certainLeft: string;
    readonly certainRight: string;
    readonly forcedNineReason: string;
    readonly lastCardWinReason: (bank: number) => string;
    readonly evAheadReason: (card: string, evDiff: number, winPct: number, altPct: number) => string;
    readonly higherWinReason: (card: string, winPct: number, altPct: number) => string;
    readonly openSuitMultipleReason: (cards: string) => string;
    readonly openSuitSingleReason: (card: string) => string;
    readonly closedSuitRiskyReason: string;
    readonly chainExtendReason: (cards: string) => string;
    readonly closeEndReason: string;
    readonly safeDiscardReason: string;
    readonly holdNineReason: (card: string) => string;
    readonly pressureOppPassesReason: (avgPasses: string) => string;
    readonly lowOppCardsReason: (isRight: boolean, count: number) => string;
    readonly deducedCardsReason: (parts: readonly string[]) => string;
    readonly deductionPart: (isRight: boolean, cards: string) => string;
    readonly balancedTempoReason: string;
    readonly forcedPassHeadline: (penalty: number) => string;
    readonly noLegalCardsReason: string;
    readonly waitingCardsReason: (cards: string, hasMore: boolean) => string;
    readonly handEmptyReason: string;
    readonly forcedPlayHeadline: (card: string, winPct: number) => string;
    readonly bestPlayHeadline: (card: string, winPct: number, evStr: string) => string;
  };
}

const EN: Translations = {
  htmlLang: 'en',
  docTitle: 'Monte Carlo / Nine (1993)',
  tableStakes: {
    1: 'Table #1 · Classic',
    2: 'Table #2 · Club Shark',
    3: 'Table #3 · High Stakes',
  },
  shell: {
    cardTable: 'Card Table',
    activeMatch: 'Active Match',
    clubLobby: 'Club Lobby',
    dealing: 'Dealing...',
    monteCarloTitle: 'Monte Carlo 1993',
    lobbyBadge: 'Lobby',
    roundBadge: (n) => `Round #${n}`,
    potBadge: (pot) => `Pot $${pot}`,
    anteBadge: (ante) => `Ante $${ante}`,
    readyBannerMenu: 'Pick F1 Play, F3 Switch Table, or F4 Sign In.',
    readyBannerIntro: 'Enter the club lobby to start a deal.',
    roundFinished: 'Round finished',
    matchComplete: 'Match complete',
    yourTurn: (player) => `Your turn (${player})`,
    leftThinking: 'Left Rival thinking...',
    rightThinking: 'Right Rival thinking...',
    dealingAnte: 'Dealing ante...',
    leftRival: 'Left Rival',
    rightRival: 'Right Rival',
    you: 'You',
    playerDefault: 'Player',
    seatCards: (c) => `${c} ${c === 1 ? 'card' : 'cards'}`,
    moveLogTitle: 'Move Log',
    dealToSeeHistory: 'Deal a round to see live play history.',
    waitingOpeningNine: 'Waiting for 9♦ opening move...',
    rulesTitle: 'Rules of Nine',
    rules: [
      '9♦ opens every round',
      '9 opens any suit; play ±1 rank',
      'Playable cards glow gold in hand',
      `No move: Pass (-$${PASS_PENALTY}), Ante $${ANTE_AMOUNT}`,
    ],
    clubRoom: 'Club Room',
    signedIn: (name, carryover) => `Signed in: ${name} (Carryover $${200 + carryover})`,
    guestSession: 'Guest session · Press F4 in Menu to sign in',
    topClubLeaders: 'Top Club Leaders',
    noScoresYet: 'No recorded scores yet',
    activePlayerTip: (name) => `Active player: ${name}`,
    oneClickSignInTip: (name) => `Sign in as ${name} in one click`,
    displayAudio: 'Display & Audio',
    graphicsHd: 'Graphics: HD',
    graphicsEga: 'Graphics: EGA 93',
    audioOn: 'Audio: ON',
    audioWake: 'Audio: Wake',
    audioOff: 'Audio: OFF',
    musicMp3: 'Music: MP3',
    musicOpl2: 'Music: OPL2',
    aspect1to1: 'Aspect: 1:1',
    aspect4to3: 'Aspect: 4:3',
    crtOn: 'CRT: ON',
    crtOff: 'CRT: OFF',
    hideSidebars: 'Hide Sidebars',
    showPanels: 'Show Club Panels',
    focusView: 'Focus View',
    navSave: 'Navigation & Save',
    dealPlay: 'Deal / Play (F1)',
    switchTable: 'Switch Table (F3)',
    clubMenu: 'Club Menu (Esc)',
    intro: 'Intro (F5)',
    exportScores: 'Export Scores',
    exportTip: 'Download high-scores & profiles (NINE.RES)',
    importScores: 'Import Scores',
    importTip: 'Load high-scores & profiles (NINE.RES)',
    resetSave: 'Reset Save',
  },
  scenes: {
    introPrompt: 'CLICK OR PRESS ANY KEY TO ENTER THE CLUB',
    dealerWelcome: 'WELCOME TO THE NINE CLUB',
    menuClubTable: (roman) => `9♥   CLUB TABLE ${roman}`,
    menuHighScores: '9♠   HIGH SCORES',
    menuNewPlayer: 'NEW PLAYER:',
    menuPassword: 'PASSWORD:',
    menuClickOrF4: 'Click or press F4',
    menuShuffling: 'SHUFFLING THE DECK...',
    menuBtnPlay: 'PLAY',
    menuBtnAudioOn: 'AUDIO: ON',
    menuBtnAudioOff: 'AUDIO: OFF',
    menuBtnTable: (roman) => `TABLE ${roman}`,
    menuBtnSignIn: 'SIGN IN',
    menuBtnExit: 'EXIT',
    tableBankLabel: 'BANK',
    tableNoLegalMovesPass: (penalty) => `NO LEGAL MOVES — PASS -$${penalty}`,
    matchEndVictory: 'VICTORY!',
    matchEndBankrupt: 'BANKRUPT',
    finalCash: (cash) => `FINAL CASH: $${cash}`,
    clubScore: (score) => `CLUB SCORE: ${score}`,
    continuePrompt: 'CLICK OR PRESS ANY KEY TO CONTINUE',
    logRound: (n, pot) => `Round #${n} · Pot $${pot}`,
    logPlay: (seat, card) => `${seat}: ${card}`,
    logPass: (seat, penalty) => `${seat}: pass (-$${penalty})`,
    logWin: (seat, n, pot) => `${seat} won Round #${n} (+$${pot})`,
  },
  advisor: {
    title: 'Advisor',
    coachOn: 'Coach: ON',
    coachOff: 'Coach: OFF',
    offHeadline: 'Hints are paused',
    offMeta: 'Click "Coach: OFF" to enable analysis.',
    offReason: 'Turn on the coach to evaluate hidden cards and explain the strongest move.',
    watchingHeadline: 'Watching the hand…',
    watchingMeta: 'Rivals are playing',
    watchingReason: 'When your turn comes, I will evaluate valid deals and explain the best move.',
    readyHeadline: 'Ready to coach',
    readyMeta: 'Start a match at any table',
    readyReason: 'During your turn, the best move and tactical reasoning will appear here.',
    exactMeta: (s) => `Exact search (${s} ${s === 1 ? 'deal' : 'deals'})`,
    approxMeta: (s) => `Estimate from ${s} deals`,
    compareMoves: 'Move comparison',
    unseenCards: (c) => `Unseen: ${c} ${c === 1 ? 'card' : 'cards'}`,
    excludedByPasses: (l, r) => `Pass exclusions: L ${l}, R ${r}`,
    certainLeft: 'Sure Left: ',
    certainRight: 'Sure Right: ',
    forcedNineReason: 'By the rules, every round opens with 9♦.',
    lastCardWinReason: (bank) => `Final card in hand — playing it immediately wins the $${bank} pot.`,
    evAheadReason: (card, evDiff, winPct, altPct) =>
      `Beats ${card} by +$${evDiff} expected value (${winPct}% win vs ${altPct}%).`,
    higherWinReason: (card, winPct, altPct) => `Higher win rate (${winPct}% vs ${altPct}% for ${card}).`,
    openSuitMultipleReason: (cards) => `Opens a new suit to unlock your ${cards}.`,
    openSuitSingleReason: (card) => `Creates an outlet for ${card} without stranding the nine in hand.`,
    closedSuitRiskyReason: 'Rivals have this suit closed, yet the other lines are even riskier.',
    chainExtendReason: (cards) => `Extends the chain toward your ${cards}.`,
    closeEndReason: 'Seals the edge of the suit so you do not get stuck with a dead card.',
    safeDiscardReason: 'Clean play with no gaps — does not unlock blocked ranks for anyone else.',
    holdNineReason: (card) => `Holds back ${card} — opening that suit now lets rivals shed dead cards.`,
    pressureOppPassesReason: (avg) =>
      `Forces rivals to pass more often (~${avg} passes left in the round), feeding the pot.`,
    lowOppCardsReason: (isRight, count) =>
      `${isRight ? 'Right' : 'Left'} Rival has only ${count} ${count === 1 ? 'card' : 'cards'} left — this helps them the least.`,
    deducedCardsReason: (parts) => `Deduced from earlier passes — ${parts.join('; ')}.`,
    deductionPart: (isRight, cards) => `${isRight ? 'Right' : 'Left'}: ${cards}`,
    balancedTempoReason: 'Best balance of tempo and safety: preserves more legal follow-ups on later turns.',
    forcedPassHeadline: (penalty) => `Forced pass (-$${penalty})`,
    noLegalCardsReason: 'No card in your hand connects to any open suit on the table.',
    waitingCardsReason: (cards, hasMore) => `Waiting for suits/ranks to open: ${cards}${hasMore ? '…' : ''}.`,
    handEmptyReason: 'No cards left in hand.',
    forcedPlayHeadline: (card, winPct) => `Forced play: ${card} · Win ${winPct}%`,
    bestPlayHeadline: (card, winPct, evStr) => `Best play: ${card} · Win ${winPct}% · EV ${evStr}`,
  },
};

const RU: Translations = {
  htmlLang: 'ru',
  docTitle: 'Девятка / Monte Carlo (1993)',
  tableStakes: {
    1: 'Стол №1 · Классика',
    2: 'Стол №2 · Профи',
    3: 'Стол №3 · Высшая лига',
  },
  shell: {
    cardTable: 'Игровой стол',
    activeMatch: 'Текущая партия',
    clubLobby: 'Клубное меню',
    dealing: 'Раздача…',
    monteCarloTitle: 'Девятка 1993',
    lobbyBadge: 'Лобби',
    roundBadge: (n) => `Раунд #${n}`,
    potBadge: (pot) => `Банк $${pot}`,
    anteBadge: (ante) => `Анте $${ante}`,
    readyBannerMenu: 'F1 — Играть, F3 — Стол, F4 — Вход.',
    readyBannerIntro: 'Войдите в клуб, чтобы начать раздачу.',
    roundFinished: 'Раунд завершён',
    matchComplete: 'Матч завершён',
    yourTurn: (player) => `Ваш ход (${player})`,
    leftThinking: 'Думает Левый…',
    rightThinking: 'Думает Правый…',
    dealingAnte: 'Собираем анте…',
    leftRival: 'Левый',
    rightRival: 'Правый',
    you: 'Вы',
    playerDefault: 'Игрок',
    seatCards: (c) => `${c} ${pluralRuUk(c, 'карта', 'карты', 'карт')}`,
    moveLogTitle: 'Журнал ходов',
    dealToSeeHistory: 'Сыграйте раунд, чтобы увидеть историю ходов.',
    waitingOpeningNine: 'Ждём первый ход с 9♦…',
    rulesTitle: 'Правила «Девятки»',
    rules: [
      'Каждый раунд открывает 9♦',
      '9 открывает масть; дальше ±1 ранг',
      'Доступные карты подсвечены золотым',
      `Нет хода: пас (-$${PASS_PENALTY}), анте $${ANTE_AMOUNT}`,
    ],
    clubRoom: 'Клубная комната',
    signedIn: (name, carryover) => `Игрок: ${name} (Перенос $${200 + carryover})`,
    guestSession: 'Гость · Нажмите F4 в меню для входа',
    topClubLeaders: 'Лидеры стола',
    noScoresYet: 'Пока нет сохранённых рекордов',
    activePlayerTip: (name) => `Активный игрок: ${name}`,
    oneClickSignInTip: (name) => `Выбрать игрока ${name} в один клик`,
    displayAudio: 'Экран и звук',
    graphicsHd: 'Графика: HD',
    graphicsEga: 'Графика: EGA 93',
    audioOn: 'Звук: ВКЛ',
    audioWake: 'Звук: Ждёт',
    audioOff: 'Звук: ВЫКЛ',
    musicMp3: 'Музыка: MP3',
    musicOpl2: 'Музыка: OPL2',
    aspect1to1: 'Формат: 1:1',
    aspect4to3: 'Формат: 4:3',
    crtOn: 'CRT: ВКЛ',
    crtOff: 'CRT: ВЫКЛ',
    hideSidebars: 'Скрыть панели',
    showPanels: 'Показать панели',
    focusView: 'На весь экран',
    navSave: 'Навигация и сейв',
    dealPlay: 'Играть (F1)',
    switchTable: 'Сменить стол (F3)',
    clubMenu: 'Меню клуба (Esc)',
    intro: 'Заставка (F5)',
    exportScores: 'Экспорт .RES',
    exportTip: 'Скачать файл рекордов и профилей (NINE.RES)',
    importScores: 'Импорт .RES',
    importTip: 'Загрузить файл рекордов и профилей (NINE.RES)',
    resetSave: 'Сброс сейва',
  },
  scenes: {
    introPrompt: 'КЛИКНИТЕ ИЛИ НАЖМИТЕ ЛЮБУЮ КЛАВИШУ ДЛЯ ВХОДА В КЛУБ',
    dealerWelcome: 'ДОБРО ПОЖАЛОВАТЬ В КЛУБ «ДЕВЯТКА»',
    menuClubTable: (roman) => `9♥   СТОЛ КЛУБА ${roman}`,
    menuHighScores: '9♠   РЕКОРДЫ',
    menuNewPlayer: 'ИГРОК:',
    menuPassword: 'ПАРОЛЬ:',
    menuClickOrF4: 'Кликните или нажмите F4',
    menuShuffling: 'ТАСУЕМ КОЛОДУ…',
    menuBtnPlay: 'ИГРАТЬ',
    menuBtnAudioOn: 'ЗВУК: ВКЛ',
    menuBtnAudioOff: 'ЗВУК: ВЫКЛ',
    menuBtnTable: (roman) => `СТОЛ ${roman}`,
    menuBtnSignIn: 'ВХОД',
    menuBtnExit: 'ВЫХОД',
    tableBankLabel: 'БАНК',
    tableNoLegalMovesPass: (penalty) => `НЕТ ХОДОВ — ПАС -$${penalty}`,
    matchEndVictory: 'ПОБЕДА!',
    matchEndBankrupt: 'БАНКРОТ',
    finalCash: (cash) => `ИТОГО НА РУКАХ: $${cash}`,
    clubScore: (score) => `ОЧКИ КЛУБА: ${score}`,
    continuePrompt: 'КЛИКНИТЕ ИЛИ НАЖМИТЕ КЛАВИШУ',
    logRound: (n, pot) => `Раунд #${n} · Банк $${pot}`,
    logPlay: (seat, card) => `${seat}: ${card}`,
    logPass: (seat, penalty) => `${seat}: пас (-$${penalty})`,
    logWin: (seat, n, pot) => `${seat} выиграл раунд #${n} (+$${pot})`,
  },
  advisor: {
    title: 'Советник',
    coachOn: 'Обучение: ВКЛ',
    coachOff: 'Обучение: ВЫКЛ',
    offHeadline: 'Подсказки выключены',
    offMeta: 'Нажмите «Обучение: ВЫКЛ», чтобы включить разбор.',
    offReason: 'Включите режим обучения — советник оценит скрытые карты и объяснит оптимальный ход.',
    watchingHeadline: 'Слежу за раздачей…',
    watchingMeta: 'Ходят соперники',
    watchingReason: 'Когда наступит ваш ход, я переберу допустимые расклады и объясню лучший выбор.',
    readyHeadline: 'Готов к обучению',
    readyMeta: 'Начните партию за любым столом',
    readyReason: 'Во время вашего хода здесь появится оптимальная карта и аргументация.',
    exactMeta: (s) => `Точный перебор (${s} раскл.)`,
    approxMeta: (s) => `Оценка по ${s} раскл.`,
    compareMoves: 'Сравнение ходов',
    unseenCards: (c) => `Вне руки: ${c} ${pluralRuUk(c, 'карта', 'карты', 'карт')}`,
    excludedByPasses: (l, r) => `Пасы исключили: Л ${l}, П ${r}`,
    certainLeft: 'Точно слева: ',
    certainRight: 'Точно справа: ',
    forcedNineReason: 'По правилам раунд всегда открывается с 9♦.',
    lastCardWinReason: (bank) => `Последняя карта на руке — ход сразу приносит банк $${bank}.`,
    evAheadReason: (card, evDiff, winPct, altPct) =>
      `Сильнее хода ${card} на +$${evDiff} по ожиданию (${winPct}% побед против ${altPct}%).`,
    higherWinReason: (card, winPct, altPct) => `Шанс победы выше (${winPct}% против ${altPct}% у ${card}).`,
    openSuitMultipleReason: (cards) => `Открывает новую масть под твои ${cards}.`,
    openSuitSingleReason: (card) => `Даёт выход для ${card}, не застревая с девяткой на руке.`,
    closedSuitRiskyReason: 'У соперников эта масть закрыта, но остальные варианты ещё рискованнее по раскладу.',
    chainExtendReason: (cards) => `Продвигает цепочку к твоим ${cards}.`,
    closeEndReason: 'Закрывает край масти — больше не держишь тупиковую карту.',
    safeDiscardReason: 'Безопасный сброс без «дыр» — никому не открывает заблокированные ранги.',
    holdNineReason: (card) =>
      `Придерживает ${card} — если открыть эту масть сейчас, соперники сбросят лишние карты.`,
    pressureOppPassesReason: (avg) =>
      `Чаще вынуждает соперников пасовать (~${avg} паса за остаток раунда, пополняя банк).`,
    lowOppCardsReason: (isRight, count) =>
      `У ${isRight ? 'Правого' : 'Левого'} осталось всего ${count} ${pluralRuUk(count, 'карта', 'карты', 'карт')} — этот ход хуже всего помогает ему выйти.`,
    deducedCardsReason: (parts) => `По прошлым пасам точно вычислено — ${parts.join('; ')}.`,
    deductionPart: (isRight, cards) => `у ${isRight ? 'Правого' : 'Левого'}: ${cards}`,
    balancedTempoReason: 'Оптимальный баланс темпа и риска: сохраняет больше легальных ходов на следующие круги.',
    forcedPassHeadline: (penalty) => `Обязательный пас (-$${penalty})`,
    noLegalCardsReason: 'В руке нет ни одной подходящей карты к открытым мастям.',
    waitingCardsReason: (cards, hasMore) =>
      `Ждут открытия мастей/рангов: ${cards}${hasMore ? '…' : ''}.`,
    handEmptyReason: 'Карты закончились.',
    forcedPlayHeadline: (card, winPct) => `Вынужденный ход: ${card} · Шанс ${winPct}%`,
    bestPlayHeadline: (card, winPct, evStr) => `Лучший ход: ${card} · Шанс ${winPct}% · EV ${evStr}`,
  },
};

const UK: Translations = {
  htmlLang: 'uk',
  docTitle: 'Дев’ятка / Monte Carlo (1993)',
  tableStakes: {
    1: 'Стіл №1 · Класика',
    2: 'Стіл №2 · Профі',
    3: 'Стіл №3 · Вища ліга',
  },
  shell: {
    cardTable: 'Ігровий стіл',
    activeMatch: 'Поточна партія',
    clubLobby: 'Меню клубу',
    dealing: 'Роздача…',
    monteCarloTitle: 'Дев’ятка 1993',
    lobbyBadge: 'Лобі',
    roundBadge: (n) => `Раунд #${n}`,
    potBadge: (pot) => `Банк $${pot}`,
    anteBadge: (ante) => `Анте $${ante}`,
    readyBannerMenu: 'F1 — Грати, F3 — Стіл, F4 — Вхід.',
    readyBannerIntro: 'Увійдіть до клубу, щоб почати роздачу.',
    roundFinished: 'Раунд завершено',
    matchComplete: 'Матч завершено',
    yourTurn: (player) => `Ваш хід (${player})`,
    leftThinking: 'Думає Лівий…',
    rightThinking: 'Думає Правий…',
    dealingAnte: 'Збираємо анте…',
    leftRival: 'Лівий',
    rightRival: 'Правий',
    you: 'Ви',
    playerDefault: 'Гравець',
    seatCards: (c) => `${c} ${pluralRuUk(c, 'карта', 'карти', 'карт')}`,
    moveLogTitle: 'Журнал ходів',
    dealToSeeHistory: 'Зіграйте раунд, щоб побачити історію ходів.',
    waitingOpeningNine: 'Чекаємо на перший хід з 9♦…',
    rulesTitle: 'Правила «Дев’ятки»',
    rules: [
      'Кожен раунд відкриває 9♦',
      '9 відкриває масть; далі ±1 ранг',
      'Доступні карти підсвічені золотим',
      `Немає ходу: пас (-$${PASS_PENALTY}), анте $${ANTE_AMOUNT}`,
    ],
    clubRoom: 'Клубна зала',
    signedIn: (name, carryover) => `Гравець: ${name} (Перенос $${200 + carryover})`,
    guestSession: 'Гість · Натисніть F4 у меню для входу',
    topClubLeaders: 'Лідери столу',
    noScoresYet: 'Ще немає збережених рекордів',
    activePlayerTip: (name) => `Активний гравець: ${name}`,
    oneClickSignInTip: (name) => `Обрати гравця ${name} в один клік`,
    displayAudio: 'Екран і звук',
    graphicsHd: 'Графіка: HD',
    graphicsEga: 'Графіка: EGA 93',
    audioOn: 'Звук: УВІМК',
    audioWake: 'Звук: Чекає',
    audioOff: 'Звук: ВИМК',
    musicMp3: 'Музика: MP3',
    musicOpl2: 'Музика: OPL2',
    aspect1to1: 'Формат: 1:1',
    aspect4to3: 'Формат: 4:3',
    crtOn: 'CRT: УВІМК',
    crtOff: 'CRT: ВИМК',
    hideSidebars: 'Сховати панелі',
    showPanels: 'Показати панелі',
    focusView: 'На весь екран',
    navSave: 'Навігація і сейв',
    dealPlay: 'Грати (F1)',
    switchTable: 'Змінити стіл (F3)',
    clubMenu: 'Меню клубу (Esc)',
    intro: 'Заставка (F5)',
    exportScores: 'Експорт .RES',
    exportTip: 'Завантажити файл рекордів і профілів (NINE.RES)',
    importScores: 'Імпорт .RES',
    importTip: 'Відкрити файл рекордів і профілів (NINE.RES)',
    resetSave: 'Скинути сейв',
  },
  scenes: {
    introPrompt: 'КЛІКНІТЬ АБО НАТИСНІТЬ БУДЬ-ЯКУ КЛАВІШУ ДЛЯ ВХОДУ',
    dealerWelcome: 'ЛАСКАВО ПРОСИМО ДО КЛУБУ «ДЕВ’ЯТКА»',
    menuClubTable: (roman) => `9♥   СТІЛ КЛУБУ ${roman}`,
    menuHighScores: '9♠   РЕКОРДИ',
    menuNewPlayer: 'ГРАВЕЦЬ:',
    menuPassword: 'ПАРОЛЬ:',
    menuClickOrF4: 'Клікніть або натисніть F4',
    menuShuffling: 'ТАСУЄМО КОЛОДУ…',
    menuBtnPlay: 'ГРАТИ',
    menuBtnAudioOn: 'ЗВУК: УВІМК',
    menuBtnAudioOff: 'ЗВУК: ВИМК',
    menuBtnTable: (roman) => `СТІЛ ${roman}`,
    menuBtnSignIn: 'ВХІД',
    menuBtnExit: 'ВИХІД',
    tableBankLabel: 'БАНК',
    tableNoLegalMovesPass: (penalty) => `НЕМАЄ ХОДІВ — ПАС -$${penalty}`,
    matchEndVictory: 'ПЕРЕМОГА!',
    matchEndBankrupt: 'БАНКРУТ',
    finalCash: (cash) => `ПІДСУМОК: $${cash}`,
    clubScore: (score) => `ОЧКИ КЛУБУ: ${score}`,
    continuePrompt: 'КЛІКНІТЬ АБО НАТИСНІТЬ КЛАВІШУ',
    logRound: (n, pot) => `Раунд #${n} · Банк $${pot}`,
    logPlay: (seat, card) => `${seat}: ${card}`,
    logPass: (seat, penalty) => `${seat}: пас (-$${penalty})`,
    logWin: (seat, n, pot) => `${seat} виграв раунд #${n} (+$${pot})`,
  },
  advisor: {
    title: 'Радник',
    coachOn: 'Навчання: УВІМК',
    coachOff: 'Навчання: ВИМК',
    offHeadline: 'Підказки вимкнено',
    offMeta: 'Натисніть «Навчання: ВИМК», щоб увімкнути розбір.',
    offReason: 'Увімкніть режим навчання — радник оцінить приховані карти й пояснить найкращий хід.',
    watchingHeadline: 'Стежу за роздачею…',
    watchingMeta: 'Ходять суперники',
    watchingReason: 'Коли настане ваш хід, я проаналізую можливі розклади й підкажу оптимальну карту.',
    readyHeadline: 'Готовий до навчання',
    readyMeta: 'Почніть партію за будь-яким столом',
    readyReason: 'Під час вашого ходу тут з’явиться найкраща карта та пояснення.',
    exactMeta: (s) => `Точний перебір (${s} розкл.)`,
    approxMeta: (s) => `Оцінка по ${s} розкл.`,
    compareMoves: 'Порівняння ходів',
    unseenCards: (c) => `Поза рукою: ${c} ${pluralRuUk(c, 'карта', 'карти', 'карт')}`,
    excludedByPasses: (l, r) => `Паси виключили: Л ${l}, П ${r}`,
    certainLeft: 'Точно зліва: ',
    certainRight: 'Точно справа: ',
    forcedNineReason: 'За правилами кожен раунд завжди відкривається з 9♦.',
    lastCardWinReason: (bank) => `Остання карта на руці — хід одразу забирає банк $${bank}.`,
    evAheadReason: (card, evDiff, winPct, altPct) =>
      `Сильніше ходу ${card} на +$${evDiff} за очікуванням (${winPct}% перемог проти ${altPct}%).`,
    higherWinReason: (card, winPct, altPct) => `Шанс перемоги вищий (${winPct}% проти ${altPct}% у ${card}).`,
    openSuitMultipleReason: (cards) => `Відкриває нову масть під ваші ${cards}.`,
    openSuitSingleReason: (card) => `Дає вихід для ${card}, не застрягаючи з дев’яткою на руці.`,
    closedSuitRiskyReason: 'У суперників ця масть закрита, але інші варіанти ще ризикованіші.',
    chainExtendReason: (cards) => `Продовжує ланцюжок до ваших ${cards}.`,
    closeEndReason: 'Закриває край масті — більше не тримаєте безвихідну карту.',
    safeDiscardReason: 'Безпечний хід без «дірок» — нікому не відкриває заблоковані ранги.',
    holdNineReason: (card) =>
      `Притримує ${card} — якщо відкрити цю масть зараз, суперники скинуть зайві карти.`,
    pressureOppPassesReason: (avg) =>
      `Частіше змушує суперників пасувати (~${avg} пасів до кінця раунду), наповнюючи банк.`,
    lowOppCardsReason: (isRight, count) =>
      `У ${isRight ? 'Правого' : 'Лівого'} лишилося всього ${count} ${pluralRuUk(count, 'карта', 'карти', 'карт')} — цей хід найменше допомагає йому вийти.`,
    deducedCardsReason: (parts) => `За попередніми пасами точно вирахувано — ${parts.join('; ')}.`,
    deductionPart: (isRight, cards) => `у ${isRight ? 'Правого' : 'Лівого'}: ${cards}`,
    balancedTempoReason: 'Оптимальний баланс темпу й ризику: зберігає більше легальних ходів надалі.',
    forcedPassHeadline: (penalty) => `Вимушений пас (-$${penalty})`,
    noLegalCardsReason: 'На руці немає жодної карти, що пасує до відкритих мастей.',
    waitingCardsReason: (cards, hasMore) =>
      `Чекають відкриття мастей/рангів: ${cards}${hasMore ? '…' : ''}.`,
    handEmptyReason: 'Карт на руці більше немає.',
    forcedPlayHeadline: (card, winPct) => `Вимушений хід: ${card} · Шанс ${winPct}%`,
    bestPlayHeadline: (card, winPct, evStr) => `Найкращий хід: ${card} · Шанс ${winPct}% · EV ${evStr}`,
  },
};

const DE: Translations = {
  htmlLang: 'de',
  docTitle: 'Neuner / Monte Carlo (1993)',
  tableStakes: {
    1: 'Tisch #1 · Klassik',
    2: 'Tisch #2 · Klub-Profi',
    3: 'Tisch #3 · High Stakes',
  },
  shell: {
    cardTable: 'Kartentisch',
    activeMatch: 'Laufendes Spiel',
    clubLobby: 'Klub-Lobby',
    dealing: 'Austeilen…',
    monteCarloTitle: 'Monte Carlo 1993',
    lobbyBadge: 'Lobby',
    roundBadge: (n) => `Runde #${n}`,
    potBadge: (pot) => `Pott $${pot}`,
    anteBadge: (ante) => `Ante $${ante}`,
    readyBannerMenu: 'F1 Spielen, F3 Tisch, F4 Anmelden.',
    readyBannerIntro: 'Betritt die Lobby für eine neue Runde.',
    roundFinished: 'Runde beendet',
    matchComplete: 'Partie beendet',
    yourTurn: (player) => `Dein Zug (${player})`,
    leftThinking: 'Linker Gegner überlegt…',
    rightThinking: 'Rechter Gegner überlegt…',
    dealingAnte: 'Einsatz wird gezahlt…',
    leftRival: 'Linker Gegner',
    rightRival: 'Rechter Gegner',
    you: 'Du',
    playerDefault: 'Spieler',
    seatCards: (c) => `${c} ${c === 1 ? 'Karte' : 'Karten'}`,
    moveLogTitle: 'Zugprotokoll',
    dealToSeeHistory: 'Starte eine Runde, um den Verlauf zu sehen.',
    waitingOpeningNine: 'Warte auf Eröffnung mit 9♦…',
    rulesTitle: 'Regeln von Neuner',
    rules: [
      '9♦ eröffnet jede Runde',
      '9 startet jede Farbe; dann ±1 Rang',
      'Spielbare Karten leuchten golden',
      `Kein Zug: Pass (-$${PASS_PENALTY}), Ante $${ANTE_AMOUNT}`,
    ],
    clubRoom: 'Klubraum',
    signedIn: (name, carryover) => `Spieler: ${name} (Übertrag $${200 + carryover})`,
    guestSession: 'Gast · Drücke F4 im Menü zum Anmelden',
    topClubLeaders: 'Klub-Bestenliste',
    noScoresYet: 'Noch keine gespeicherten Punkte',
    activePlayerTip: (name) => `Aktiver Spieler: ${name}`,
    oneClickSignInTip: (name) => `Als ${name} per Klick anmelden`,
    displayAudio: 'Anzeige & Ton',
    graphicsHd: 'Grafik: HD',
    graphicsEga: 'Grafik: EGA 93',
    audioOn: 'Ton: EIN',
    audioWake: 'Ton: Bereit',
    audioOff: 'Ton: AUS',
    musicMp3: 'Musik: MP3',
    musicOpl2: 'Musik: OPL2',
    aspect1to1: 'Format: 1:1',
    aspect4to3: 'Format: 4:3',
    crtOn: 'CRT: EIN',
    crtOff: 'CRT: AUS',
    hideSidebars: 'Leisten aus',
    showPanels: 'Leisten zeigen',
    focusView: 'Fokus-Ansicht',
    navSave: 'Navigation & Save',
    dealPlay: 'Spielen (F1)',
    switchTable: 'Tisch wechseln (F3)',
    clubMenu: 'Klub-Menü (Esc)',
    intro: 'Intro (F5)',
    exportScores: 'Export .RES',
    exportTip: 'Bestenliste & Profile herunterladen (NINE.RES)',
    importScores: 'Import .RES',
    importTip: 'Bestenliste & Profile laden (NINE.RES)',
    resetSave: 'Save zurücksetzen',
  },
  scenes: {
    introPrompt: 'KLICKEN ODER BELIEBIGE TASTE DRÜCKEN',
    dealerWelcome: 'WILLKOMMEN IM NEUNER-KLUB',
    menuClubTable: (roman) => `9♥   KLUB-TISCH ${roman}`,
    menuHighScores: '9♠   BESTENLISTE',
    menuNewPlayer: 'NEUER SPIELER:',
    menuPassword: 'PASSWORT:',
    menuClickOrF4: 'Klicken oder F4 drücken',
    menuShuffling: 'KARTEN WERDEN GEMISCHT…',
    menuBtnPlay: 'SPIELEN',
    menuBtnAudioOn: 'TON: EIN',
    menuBtnAudioOff: 'TON: AUS',
    menuBtnTable: (roman) => `TISCH ${roman}`,
    menuBtnSignIn: 'ANMELDEN',
    menuBtnExit: 'BEENDEN',
    tableBankLabel: 'BANK',
    tableNoLegalMovesPass: (penalty) => `KEIN ZUG — PASSEN -$${penalty}`,
    matchEndVictory: 'SIEG!',
    matchEndBankrupt: 'BANKROTT',
    finalCash: (cash) => `ENDGUTHABEN: $${cash}`,
    clubScore: (score) => `KLUB-PUNKTE: ${score}`,
    continuePrompt: 'KLICKEN ODER TASTE DRÜCKEN',
    logRound: (n, pot) => `Runde #${n} · Pott $${pot}`,
    logPlay: (seat, card) => `${seat}: ${card}`,
    logPass: (seat, penalty) => `${seat}: passt (-$${penalty})`,
    logWin: (seat, n, pot) => `${seat} gewinnt Runde #${n} (+$${pot})`,
  },
  advisor: {
    title: 'Berater',
    coachOn: 'Berater: EIN',
    coachOff: 'Berater: AUS',
    offHeadline: 'Hinweise pausiert',
    offMeta: 'Auf „Berater: AUS“ klicken zum Aktivieren.',
    offReason: 'Aktiviere den Berater, um verdeckte Karten zu bewerten und den besten Zug zu erklären.',
    watchingHeadline: 'Beobachte die Runde…',
    watchingMeta: 'Gegner am Zug',
    watchingReason: 'Sobald du dran bist, berechne ich mögliche Verteilungen und erkläre den besten Zug.',
    readyHeadline: 'Bereit zum Coachen',
    readyMeta: 'Starte eine Partie an einem Tisch',
    readyReason: 'In deinem Zug erscheinen hier die beste Karte und die Begründung.',
    exactMeta: (s) => `Exakte Suche (${s} ${s === 1 ? 'Blatt' : 'Blätter'})`,
    approxMeta: (s) => `Schätzung aus ${s} Blättern`,
    compareMoves: 'Zugvergleich',
    unseenCards: (c) => `Verdeckt: ${c} ${c === 1 ? 'Karte' : 'Karten'}`,
    excludedByPasses: (l, r) => `Pass-Ausschlüsse: L ${l}, R ${r}`,
    certainLeft: 'Sicher Links: ',
    certainRight: 'Sicher Rechts: ',
    forcedNineReason: 'Nach den Regeln eröffnet immer 9♦ die Runde.',
    lastCardWinReason: (bank) => `Letzte Handkarte — dieser Zug gewinnt sofort den $${bank}-Pott.`,
    evAheadReason: (card, evDiff, winPct, altPct) =>
      `Schlägt ${card} um +$${evDiff} Erwartungswert (${winPct}% Sieg vs. ${altPct}%).`,
    higherWinReason: (card, winPct, altPct) => `Höhere Siegchance (${winPct}% vs. ${altPct}% bei ${card}).`,
    openSuitMultipleReason: (cards) => `Öffnet eine neue Farbe für deine ${cards}.`,
    openSuitSingleReason: (card) => `Schafft Anschluss für ${card}, ohne die Neun festzusetzen.`,
    closedSuitRiskyReason: 'Die Gegner blockieren diese Farbe noch, die Alternativen sind aber riskanter.',
    chainExtendReason: (cards) => `Verlängert deine Reihe bis zu ${cards}.`,
    closeEndReason: 'Schließt das Farben-Ende ab — keine blockierte Karte bleibt zurück.',
    safeDiscardReason: 'Sauberes Ablegen ohne Lücken — öffnet Gegnern keine gesperrten Ränge.',
    holdNineReason: (card) =>
      `Hält ${card} zurück — jetzt geöffnet würden Gegner überflüssige Karten loswerden.`,
    pressureOppPassesReason: (avg) =>
      `Zwingt Gegner häufiger zum Passen (~${avg} Pässe im Rest der Runde) und füllt den Pott.`,
    lowOppCardsReason: (isRight, count) =>
      `${isRight ? 'Rechter' : 'Linker'} Gegner hat nur noch ${count} ${count === 1 ? 'Karte' : 'Karten'} — dieser Zug hilft am wenigsten.`,
    deducedCardsReason: (parts) => `Aus früheren Pässen sicher abgeleitet — ${parts.join('; ')}.`,
    deductionPart: (isRight, cards) => `${isRight ? 'Rechts' : 'Links'}: ${cards}`,
    balancedTempoReason: 'Beste Balance aus Tempo und Sicherheit: hält mehr Züge für später offen.',
    forcedPassHeadline: (penalty) => `Erzwungener Pass (-$${penalty})`,
    noLegalCardsReason: 'Keine Handkarte passt an eine der offenen Farben auf dem Tisch.',
    waitingCardsReason: (cards, hasMore) =>
      `Warten auf Öffnung von Farben/Rängen: ${cards}${hasMore ? '…' : ''}.`,
    handEmptyReason: 'Keine Karten mehr auf der Hand.',
    forcedPlayHeadline: (card, winPct) => `Erzwungener Zug: ${card} · Sieg ${winPct}%`,
    bestPlayHeadline: (card, winPct, evStr) => `Bester Zug: ${card} · Sieg ${winPct}% · EV ${evStr}`,
  },
};

const DICTIONARIES: Record<Language, Translations> = {
  en: EN,
  ru: RU,
  uk: UK,
  de: DE,
};

export function getTranslations(lang: Language): Translations {
  return DICTIONARIES[lang] ?? EN;
}
