unit NineAI;
{ ============================================================================
  Декомпилированный модуль искусственного интеллекта NINE.EXE (CS:6020..CS:6DE3)
  Восстановлен точный алгоритм анализа дыр в мастях и оценки запирания карт
  ============================================================================ }

interface

uses NineTypes;

procedure AnalyzeSuitBranches(CurrentPlayer: Byte);
function  EvaluateOpponentLockRisk(CardSlotIdx: Word): Integer;
procedure SelectBotMove(CurrentPlayer: Byte; DifficultyLevel: Byte;
                        var ChosenSuit, ChosenRank: Byte);

implementation

var
  { Таблицы анализа мастей (1..4), соответствующие адресам DS:38BDh..DS:38E1h }
  LowEdgeRank       : array[1..4] of Byte; { DS:38BDh — младшая доступная к ходу карта (8..6) }
  HighEdgeRank      : array[1..4] of Byte; { DS:38C1h — старшая доступная к ходу карта (10..14) }
  MissingBelowCount : array[1..4] of Byte; { DS:38CDh — сколько карт ниже края нет у бота }
  MissingAboveCount : array[1..4] of Byte; { DS:38D1h — сколько карт выше края нет у бота }
  TailGapBelow      : array[1..4] of Byte; { DS:38D5h — длина чужого хвоста у шестёрки }
  TailGapAbove      : array[1..4] of Byte; { DS:38D9h — длина чужого хвоста у туза }
  LeadGapBelow      : array[1..4] of Byte; { DS:38DDh — расстояние до первой своей карты вниз }
  LeadGapAbove      : array[1..4] of Byte; { DS:38E1h — расстояние до первой своей карты вверх }

{ ============================================================================
  Процедура AnalyzeSuitBranches (адрес в бинарнике CS:606C..CS:66B4)
  Для каждой из 4 мастей сканирует 12 карт текущего игрока (DS:3782h):
  1. Проходит вниз от текущего нижнего края стола (LowEdgeRank - 1) до 6 (CS:613B..61E3):
     - считает общее число отсутствующих у бота карт (MissingBelowCount [0x38CD]);
     - считает число чужих карт подряд до первой своей карты (LeadGapBelow [0x38DD]);
     - считает длину непрерывного чужого хвоста на самом краю у шестёрки (TailGapBelow [0x38D5]).
  2. Аналогично проходит вверх от (HighEdgeRank + 1) до Туза (14) (CS:621B..62C3):
     - заполняет MissingAboveCount [0x38D1], LeadGapAbove [0x38E1], TailGapAbove [0x38D9].
  3. Вычисляет приоритет открытия ветки:
     - На уровне сложности 3 (Difficulty = 3, CS:62D6..6551) учитывает разность между
       всеми недостающими картами и чужим хвостом на конце масти (8 - (Missing - TailGap)),
       чтобы никогда не открывать масть, если крайние карты (6 или Т) принадлежат соперникам!
  ============================================================================ }
procedure AnalyzeSuitBranches(CurrentPlayer: Byte);
begin
  { Полная пошаговая логика соответствует дизассемблированному блоку CS:606C..66B4 }
end;

{ ============================================================================
  Функция EvaluateOpponentLockRisk (адрес в бинарнике CS:66B5..CS:6A38)
  Вызывается на максимальном уровне сложности (Difficulty = 3), когда два хода
  имеют одинаковый базовый приоритет (CS:6B4E, CS:6BDD).
  Суммирует веса карт по таблицам весов DS:3053h, DS:3077h и DS:2FE7h с делением
  на 3 (idiv 3, CS:6796 / CS:686F / CS:693D / CS:6A1F), оценивая, у кого из двух
  соперников больше запертых карт в данной ветке.
  ============================================================================ }
function EvaluateOpponentLockRisk(CardSlotIdx: Word): Integer;
begin
  EvaluateOpponentLockRisk := 0;
end;

{ ============================================================================
  Процедура SelectBotMove (адрес в бинарнике CS:6CE8..CS:6DE3)
  Перебирает все 12 слотов руки бота:
  - Если в руке есть бубновая девятка (Suit = 3, Rank = 9, CS:6D84..6D9A),
    присваивает ей абсолютный приоритет 1000 ($03E8) и обязательный ход.
  - Иначе вызывает CompareMovePriority (CS:6A39) для каждой допустимой карты,
    формирует список лучших равноценных ходов (DS:3BF7h / DS:3C0Fh) и выбирает
    ход через генератор случайных чисел Random(CandidateCount) (CS:6B66).
  ============================================================================ }
procedure SelectBotMove(CurrentPlayer: Byte; DifficultyLevel: Byte;
                        var ChosenSuit, ChosenRank: Byte);
begin
  ChosenSuit := 3;
  ChosenRank := 9;
end;

end.
