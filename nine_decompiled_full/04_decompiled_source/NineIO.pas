unit NineIO;
{ ============================================================================
  Декомпилированный модуль ввода-вывода NINE.EXE
  - Чтение/запись и шифрование таблицы рекордов Nine.res (CS:6DE4..CS:70F2)
  - Загрузка 6 музыкальных блоков из Nine.msc (CS:5381..CS:552B)
  - Конфигурация Nine.cfg (CS:3821, CS:4792)
  ============================================================================ }

interface

uses NineTypes;

var
  HighScores : THighScoreTable;
  MscBuffers : array[1..6] of Pointer;

const
  { Точные размеры 6 блоков внутри файла Nine.msc (в сумме 10 825 байт, CS:53FC..5469) }
  MscChunkSizes : array[1..6] of Word = (
    $060D, { 1549 байт — Track 3 Note Stream }
    $024F, {  591 байт — Track 3 Instruments }
    $09E0, { 2528 байт — Track 2 Note Stream }
    $018C, {  396 байт — Track 2 Instruments }
    $136F, { 4975 байт — Track 1 Note Stream }
    $0312  {  786 байт — Track 1 Instruments }
  );

procedure ToggleNineResEncryption;
procedure LoadNineRes(const FileName: String);
procedure SaveNineRes(const FileName: String);
function  LoadNineMsc(const FileName: String): Boolean;

implementation

{ ============================================================================
  Процедура ToggleNineResEncryption (адрес в бинарнике CS:6E10..6ED4 и CS:702A..70EE)
  Тройной вложенный цикл:
    for Table := 1 to 3 do (шаг 200 байт = $C8)
      for Row := 1 to 10 do (шаг 20 байт = $14)
        for CharIdx := 1 to 8 do
          инвертирует байты имени (+0x00) и тега (+0x0B) операцией XOR $FF!
  ============================================================================ }
procedure ToggleNineResEncryption;
var
  T, R, C : Integer;
begin
  for T := 1 to 3 do
    for R := 1 to 10 do
      for C := 1 to 8 do
      begin
        HighScores[T, R].PlayerName[C] := Chr(Ord(HighScores[T, R].PlayerName[C]) xor $FF);
        HighScores[T, R].ExtraTag[C]   := Chr(Ord(HighScores[T, R].ExtraTag[C]) xor $FF);
      end;
end;

procedure LoadNineRes(const FileName: String);
var
  F: file;
  ReadCount: Word;
begin
  Assign(F, FileName);
  {$I-} Reset(F, 1); {$I+}
  if IOResult = 0 then
  begin
    BlockRead(F, HighScores, SizeOf(HighScores), ReadCount);
    Close(F);
    ToggleNineResEncryption; { Расшифровка XOR $FF в оперативной памяти }
  end;
end;

procedure SaveNineRes(const FileName: String);
var
  F: file;
  WriteCount: Word;
begin
  ToggleNineResEncryption; { Шифрование XOR $FF перед записью на диск }
  Assign(F, FileName);
  {$I-} Rewrite(F, 1); {$I+}
  if IOResult = 0 then
  begin
    BlockWrite(F, HighScores, SizeOf(HighScores), WriteCount);
    Close(F);
  end;
  ToggleNineResEncryption; { Возврат открытых строк в памяти }
end;

{ ============================================================================
  Функция LoadNineMsc (адрес в бинарнике CS:5381..CS:552B)
  Выделяет 6 блоков в куче (размерами $060D, $024F, $09E0, $018C, $136F, $0312)
  и последовательно считывает в них 10 825 байт файла Nine.msc через BlockRead.
  ============================================================================ }
function LoadNineMsc(const FileName: String): Boolean;
var
  F: file;
  I, Actual: Word;
begin
  Assign(F, FileName);
  {$I-} Reset(F, 1); {$I+}
  if IOResult <> 0 then
  begin
    WriteLn('Music-File not found');
    LoadNineMsc := False;
    Exit;
  end;

  for I := 1 to 6 do
  begin
    GetMem(MscBuffers[I], MscChunkSizes[I]);
    BlockRead(F, MscBuffers[I]^, MscChunkSizes[I], Actual);
  end;
  Close(F);
  LoadNineMsc := True;
end;

end.
