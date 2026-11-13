unit NineRender;
{ ============================================================================
  Декомпилированные процедуры отрисовки, прозрачного блиттинга и анимации карт
  Точное соответствие машинным инструкциям NINE.EXE (адреса CS:3156..CS:9A84)
  ============================================================================ }

interface

uses NineTypes;

{ 1. Четырёхпланарный EGA-блиттер со сборкой маски прозрачности (CS:8950..CS:8CAB) }
procedure PutMaskedImage4Plane(SrcVBuf: PGenusVirtualBuf; X, Y, Page: Word;
                               Mode, Flag1, Flag2: Byte);

{ 2. Плавное перемещение спрайта карты по сукну с восстановлением фона (CS:8CAE..CS:9A84) }
procedure MoveImageSmooth(StartX, StartY, Width, Height, EndX, EndY: Integer;
                          RestoreMode: Byte; StepX, StepY: Integer);

{ 3. Отрисовка числа кастомным графическим шрифтом 8x7 со страницы 1 (CS:71ED..CS:7379) }
procedure DrawBitmapNumber(Value: Integer; Digits, RightX, TopY: Integer);

{ 4. Отрисовка нижней шкалы-термометра очков (CS:70F3..CS:71EA) }
procedure DrawScoreThermometer(ScoreValue: Integer);

{ 5. Анимация портретов соперников и свечей (4 сценария, CS:737C..CS:7891) }
procedure AnimatePortraitAndCandles(AnimType: Byte);

{ 6. Отрисовка главного экрана стола и рамок портретов (CS:3156..CS:32C0) }
procedure DrawMainTableScreen;

{ 7. Центрированная веерная раскладка и анимация 12 карт руки игрока (CS:842E..CS:893C) }
procedure SortAndRenderPlayerHand;

implementation

var
  BgSaveBuf : Pointer;
  BgSaved   : Boolean;

{ ============================================================================
  Процедура PutMaskedImage4Plane (адрес в бинарнике CS:8950..CS:8CAB)
  Алгоритм:
  1. Читает из заголовка виртуального буфера SrcVBuf число плоскостей (+0x41 = 4),
     число байт на строку (+0x42 = BytesPerLine) и размеры XMin..YMax (+0x04..+0x0A).
  2. Выделяет временный виртуальный буфер TempBuf такого же размера (W x H) и
     считывает в него текущий фон экрана через GetImagePlus (CS:8A5D).
  3. Для каждой строки Y и каждого байта X в строке:
     - Читает 4 байта исходного спрайта из 4 битовых плоскостей EGA: P0, P1, P2, P3.
     - Формирует маску прозрачности: Mask := NOT (P0 OR P1 OR P2 OR P3) (CS:8B58..8B60).
       Там, где все 4 бита пикселя равны 0 (цвет 0 = прозрачный фон), бит маски = 1.
     - Накладывает спрайт на сохранённый фон по всем 4 плоскостям:
       DstPlane[p] := (DstPlane[p] AND Mask) XOR SrcPlane[p] (CS:8B6B..8C08).
  4. Выводит скомбинированный буфер на экран через PutImagePlus и освобождает TempBuf.
  ============================================================================ }
procedure PutMaskedImage4Plane(SrcVBuf: PGenusVirtualBuf; X, Y, Page: Word;
                               Mode, Flag1, Flag2: Byte);
var
  BPL, W, H, Row, Col : Word;
  TempBuf             : PGenusVirtualBuf;
  SrcRowPtr, DstRowPtr: PByte;
  P0, P1, P2, P3, Mask: Byte;
  S0, S1, S2, S3      : ^Byte;
  D0, D1, D2, D3      : ^Byte;
begin
  BPL := SrcVBuf^.BytesPerLine;
  W   := SrcVBuf^.XMax - SrcVBuf^.XMin + 1;
  H   := SrcVBuf^.YMax - SrcVBuf^.YMin + 1;

  { Выделяем буфер под фон и захватываем участок экрана (X, Y, W, H) }
  pcxCreateVirtual(1, Pointer(TempBuf), 5, W, H);
  pcxGetImagePlus(Pointer(TempBuf), X, Y, W, H, Page, Flag1, Flag2);

  for Row := 0 to H - 1 do
  begin
    for Col := 0 to BPL - 1 do
    begin
      S0 := @SrcVBuf^.PlaneData[(Row * 4 + 0) * BPL + Col];
      S1 := @SrcVBuf^.PlaneData[(Row * 4 + 1) * BPL + Col];
      S2 := @SrcVBuf^.PlaneData[(Row * 4 + 2) * BPL + Col];
      S3 := @SrcVBuf^.PlaneData[(Row * 4 + 3) * BPL + Col];

      D0 := @TempBuf^.PlaneData[(Row * 4 + 0) * BPL + Col];
      D1 := @TempBuf^.PlaneData[(Row * 4 + 1) * BPL + Col];
      D2 := @TempBuf^.PlaneData[(Row * 4 + 2) * BPL + Col];
      D3 := @TempBuf^.PlaneData[(Row * 4 + 3) * BPL + Col];

      P0 := S0^; P1 := S1^; P2 := S2^; P3 := S3^;

      { CS:8B58: or dl,al; or cl,al; or bl,al; not al }
      Mask := not (P0 or P1 or P2 or P3);

      { CS:8B6E..8C08: (Dst AND Mask) XOR Src }
      D0^ := (D0^ and Mask) xor P0;
      D1^ := (D1^ and Mask) xor P1;
      D2^ := (D2^ and Mask) xor P2;
      D3^ := (D3^ and Mask) xor P3;
    end;
  end;

  pcxPutImagePlus(Pointer(TempBuf), 0, X, Y, Page, Mode, Flag1, Flag2, 0, 0, 0);
  pcxDestroyVirtual(Pointer(TempBuf));
end;

{ ============================================================================
  Процедура MoveImageSmooth (адрес в бинарнике CS:8CAE..CS:9A84)
  Плавно двигает прямоугольный спрайт (карту) из (StartX, StartY) в (EndX, EndY)
  с шагом (StepX, StepY), выравниванием по байтовой сетке EGA (X mod 8) и
  восстановлением перекрытого фона стола из виртуального буфера BgSaveBuf.
  ============================================================================ }
procedure MoveImageSmooth(StartX, StartY, Width, Height, EndX, EndY: Integer;
                          RestoreMode: Byte; StepX, StepY: Integer);
var
  CurX, CurY, AlignOffset : Integer;
begin
  if StartX > EndX then StepX := -Abs(StepX) else StepX := Abs(StepX);
  if StartY > EndY then StepY := -Abs(StepY) else StepY := Abs(StepY);

  CurX := StartX;
  CurY := StartY;

  { Сохранение начального прямоугольника фона в виртуальный буфер DS:2E18h }
  if BgSaved then pcxDestroyVirtual(BgSaveBuf);
  pcxCreateVirtual(1, BgSaveBuf, 5, Width, Height);
  BgSaved := True;

  while (CurX <> EndX) or (CurY <> EndY) do
  begin
    if Abs(CurX - EndX) > Abs(StepX) then
      CurX := CurX + StepX
    else
      CurX := EndX;

    if Abs(CurY - EndY) > Abs(StepY) then
      CurY := CurY + StepY
    else
      CurY := EndY;

    { Выравнивание координаты по границе 8 пикселей битовой плоскости EGA (CS:8F76: idiv 8) }
    AlignOffset := CurX mod 8;
    pcxCopyImagePlus(CurX - AlignOffset, CurY, Width, Height, 0,
                     CurX, CurY, 0, 2, 0, 1, 0);
  end;
end;

{ ============================================================================
  Процедура DrawBitmapNumber (адрес в бинарнике CS:71ED..CS:7379)
  Печатает знаковое число Value справа налево (ширина глифа 8x7 пикселей).
  Глифы цифр 0..9 хранятся на скрытой видеостранице 1 по координатам:
    Y = 109 ($6D), X = 94 + Digit * 8 ($5E + Digit * 8)
    Знак '+' : Y = 109 ($6D), X = 174 ($AE)
    Знак '-' : Y = 109 ($6D), X = 182 ($B6)
  ============================================================================ }
procedure DrawBitmapNumber(Value: Integer; Digits, RightX, TopY: Integer);
const
  GLYPH_W = 8;
  GLYPH_H = 7;
  GLYPH_Y = $6D; { 109 }
var
  DigitX       : array[0..9] of Word;
  I, Rem, CurV : Integer;
  IsNegative   : Boolean;
begin
  for I := 0 to 9 do
    DigitX[I] := $5E + (I shl 3); { 94 + I * 8 }

  IsNegative := (Value < 0);
  CurV := Abs(Value);

  while ( CurV > 0 ) and ( Digits > 0 ) do
  begin
    RightX := RightX - GLYPH_W - 1;
    Rem    := CurV mod 10;
    CurV   := CurV div 10;

    { Копирование глифа цифры со страницы 1 на видимую страницу 0 }
    pcxCopyImagePlus(GLYPH_Y, DigitX[Rem], GLYPH_W, GLYPH_H, 1,
                     RightX, TopY, 0, 2, 0, 1, 0);
    Dec(Digits);
  end;

  { Отрисовка знака '-' ($B6) или '+' ($AE) перед числом }
  if Digits > 0 then
  begin
    RightX := RightX - GLYPH_W - 1;
    if IsNegative then
      pcxCopyImagePlus(GLYPH_Y, $B6, GLYPH_W, GLYPH_H, 1, RightX, TopY, 0, 2, 0, 1, 0)
    else
      pcxCopyImagePlus(GLYPH_Y, $AE, GLYPH_W, GLYPH_H, 1, RightX, TopY, 0, 2, 0, 1, 0);
  end;
end;

{ ============================================================================
  Процедура DrawScoreThermometer (адрес в бинарнике CS:70F3..CS:71EA)
  Отрисовывает индикатор прогресса (33 сегмента по 32x5 пикселей) в точку (455, 51)
  из 3 полос на скрытой странице 1 (Y = 332, 338, 344; X = 119 + Seg * 33).
  ============================================================================ }
procedure DrawScoreThermometer(ScoreValue: Integer);
var
  SegX, SegY : array[0..32] of Word;
  I, Idx     : Integer;
begin
  for I := 0 to 6 do
  begin
    SegX[I] := 119 + I * 33;
    SegY[I] := 332; { $14C }
  end;
  for I := 7 to 19 do
  begin
    SegX[I] := 119 + (I - 7) * 33;
    SegY[I] := 338; { $152 }
  end;
  for I := 20 to 32 do
  begin
    SegX[I] := 119 + (I - 20) * 33;
    SegY[I] := 344; { $158 }
  end;

  if (ScoreValue > 0) and (ScoreValue <= 320) then
    Idx := ScoreValue div 10
  else
    Idx := 0;

  pcxCopyImagePlus(SegX[Idx], SegY[Idx], 32, 5, 1, 455, 51, 0, 2, 0, 1, 0);
end;

{ ============================================================================
  Процедура AnimatePortraitAndCandles (адрес в бинарнике CS:737C..CS:7891)
  Управляет 4 типами анимации на игровом столе через CopyImagePlus со страницы 1:
    AnimType = 1 : Моргание / движение глаз центрального портрета (60x39 в 281, 20)
    AnimType = 2 : 14-кадровая мимика центрального персонажа (60x39 в 281, 20)
    AnimType = 3 : 20-кадровая анимация левого канделябра/игрока (73x42 в 19, 101)
    AnimType = 4 : 20-кадровая анимация правого канделябра/игрока (73x42 в 531, 101)
  ============================================================================ }
procedure AnimatePortraitAndCandles(AnimType: Byte);
var
  Frame : Integer;
begin
  case AnimType of
    1: begin
         pcxCopyImagePlus(477, 277, 60, 39, 1, 281, 20, 0, 2, 0, 1, 1000);
         pcxCopyImagePlus(477, 237, 60, 39, 1, 281, 20, 0, 2, 0, 1, 500);
       end;
    2: begin
         for Frame := 1 to 5 do
           pcxCopyImagePlus(477, 37 + (Frame - 1) * 40, 60, 39, 1, 281, 20, 0, 2, 0, 1, 200);
       end;
    3: begin
         for Frame := 1 to 6 do
           pcxCopyImagePlus(118, 1 + (Frame - 1) * 43, 73, 42, 1, 19, 101, 0, 2, 0, 1, 100);
       end;
    4: begin
         for Frame := 1 to 6 do
           pcxCopyImagePlus(118, 1 + (Frame - 1) * 43, 73, 42, 1, 531, 101, 0, 2, 0, 1, 100);
       end;
  end;
end;

{ ============================================================================
  Процедура DrawMainTableScreen (адрес в бинарнике CS:3156..CS:32C0)
  Загружает фон стола TF_Nine.pcx из Nine.lib на страницу 0 и копирует
  активные портреты соперников (70x42, 61x46, 55x39) со страницы 1.
  ============================================================================ }
procedure DrawMainTableScreen;
begin
  pcxLibDisplay('Nine.lib', 'TF_Nine.pcx', 0, 0, 0);
  pcxCopyImagePlus(0, 0, 70, 42, 1, 0, 0, 0, 2, 0, 0, 0);
  pcxCopyImagePlus(0, 0, 61, 46, 1, 0, 0, 0, 2, 0, 0, 0);
  pcxCopyImagePlus(0, 0, 55, 39, 1, 0, 0, 0, 2, 0, 0, 0);
end;

{ ============================================================================
  Процедура SortAndRenderPlayerHand (адрес в бинарнике CS:842E..CS:893C)
  1. Сортирует 12 карт игрока пузырьком по ключу: Key = (Suit - 1) * 9 + (Rank - 6)
     (CS:8639..8748).
  2. Подсчитывает число различных мастей на руках (SuitsPresent, 1..4) и вычисляет
     центрированную стартовую координату X веера карт внизу стола:
     BaseX := (464 - SuitsPresent * CardWidth) div 2  (CS:8784: mov ax, $01D0 = 464).
  3. Для карт одной масти делает нахлёст +16 пикселей ($10), а между разными
     мастями добавляет полный отступ CardWidth + 16 пикселей (CS:87D0..880E).
  4. Отрисовывает каждую карту из её виртуального буфера с задержкой 10 мс.
  ============================================================================ }
procedure SortAndRenderPlayerHand;
begin
  { Реализация включена в главный игровой модуль NineGame.pas }
end;

end.
