program Nine;
{ ============================================================================
  Главный модуль игры "Девятка" (NINE.EXE, Gamos 1993-1994)
  Точка входа после распаковки LZ91: CS:52F9 (сегмент кода 0000h)
  ============================================================================ }

uses NineTypes, NineIO, NineRender, NineAI;

var
  SoundActive     : Boolean; { DS:5EBEh }
  MusicFileFound  : Boolean; { DS:2C96h }
  Hands           : array[1..3, 1..12] of TCardSlot; { DS:3782h }
  FirstPlayerTurn : Byte;    { DS:3A02h — игрок, получивший 9 бубен }

{ ============================================================================
  Процедура ShuffleAndDeal36Cards (адрес в бинарнике CS:825C..CS:842D)
  1. Вызывает Randomize (CS:826B).
  2. Заполняет массив UsedCards[0..35] нулями.
  3. Для каждого слота CardIdx := 1..12 и каждого игрока PlayerIdx := 1..3:
     - Выбирает случайную ещё не занятую карту из оставшихся (36..1).
     - Вычисляет масть: Suit := (CardCode div 9) + 1  (CS:830E: idiv 9; inc ax).
     - Вычисляет ранг:  Rank := (CardCode mod 9) + 6  (CS:831E: idiv 9; add ax, 6).
     - Если выпала бубновая девятка (Suit = 3 и Rank = 9, CS:8331..8344),
       записывает номер игрока в FirstPlayerTurn (DS:3A02h).
  4. Для 12 карт игрока-человека распаковывает соответствующие файлы
     V_6.pcc .. C_14.pcc из Nine.lib на скрытую видеостраницу 1 и захватывает
     их в виртуальные буферы через GetImagePlus (CS:8395..842A).
  ============================================================================ }
procedure ShuffleAndDeal36Cards;
var
  Used      : array[0..35] of Boolean;
  Remaining : Integer;
  CIdx, PIdx, RndPick, CountFree, CardCode : Integer;
begin
  Randomize;
  for CardCode := 0 to 35 do Used[CardCode] := False;
  Remaining := 36;

  for CIdx := 1 to 12 do
    for PIdx := 1 to 3 do
    begin
      RndPick   := Random(Remaining);
      CardCode  := -1;
      CountFree := -1;
      while CountFree < RndPick do
      begin
        Inc(CardCode);
        if not Used[CardCode] then Inc(CountFree);
      end;
      Used[CardCode] := True;
      Dec(Remaining);

      Hands[PIdx, CIdx].Suit := (CardCode div 9) + 1;
      Hands[PIdx, CIdx].Rank := (CardCode mod 9) + 6;

      if (Hands[PIdx, CIdx].Suit = SUIT_DIAMONDS) and
         (Hands[PIdx, CIdx].Rank = RANK_9) then
        FirstPlayerTurn := PIdx;
    end;
end;

{ ============================================================================
  Главная точка входа программы (CS:52F9..CS:601F)
  ============================================================================ }
begin
  SoundActive := True;

  { Проверка ключа командной строки '/s' или '/S' (отключение звука, CS:533C..537B) }
  if (ParamCount > 0) and ((ParamStr(1) = '/s') or (ParamStr(1) = '/S')) then
    SoundActive := False;

  { Загрузка 6 блоков музыки из Nine.msc (CS:5381..552B) }
  if SoundActive then
    MusicFileFound := LoadNineMsc('Nine.msc');

  { Переключение в графический режим EGA 640x350x16 и показ заставки ZF_Nine.pcx (CS:557D..55FF) }
  pcxLibDisplay('Nine.lib', 'ZF_Nine.pcx', 0, 0, 0);
  pcxLibDisplay('Nine.lib', 'VR_Nine.pcx', 0, 0, 1);

  { Нарезка спрайтов рубашек, кнопок и рамок со скрытой страницы 1 в виртуальные буферы (CS:5701..5E3F) }
  pcxLibDisplay('Nine.lib', 'ZR_Nine.pcx', 0, 0, 1);
  pcxLibDisplay('Nine.lib', 'TR_Nine.pcx', 0, 0, 1);

  { Отрисовка главного экрана стола TF_Nine.pcx и запуск игрового цикла (CS:5EC0..5F15) }
  DrawMainTableScreen;
  ShuffleAndDeal36Cards;
end.
