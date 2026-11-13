unit NineTypes;
{ ============================================================================
  Декомпилированные структуры данных, константы и заголовки драйверов
  Игра: "Девятка" (NINE.EXE, Gamos 1993-1994, Turbo Pascal 6.0/7.0)
  ============================================================================ }

interface

const
  SCREEN_WIDTH  = 640;
  SCREEN_HEIGHT = 350;
  EGA_MODE_640x350x16 = 16;

  SUIT_SPADES   = 1; { V_6.pcc .. V_14.pcc }
  SUIT_CLUBS    = 2; { K_6.pcc .. K_14.pcc }
  SUIT_DIAMONDS = 3; { B_6.pcc .. B_14.pcc (Бубновая девятка = Suit 3, Rank 9) }
  SUIT_HEARTS   = 4; { C_6.pcc .. C_14.pcc }

  RANK_6   = 6;
  RANK_9   = 9;
  RANK_ACE = 14;

type
  { Файл конфигурации Nine.cfg (2 байта: 01 01) }
  TNineConfig = packed record
    SoundMode : Byte; { 0 = без звука, 1 = AdLib / Speaker }
    GameLevel : Byte; { 1..3 = уровень сложности / соперник }
  end;

  { Запись в таблице рекордов Nine.res (3 таблицы x 10 строк x 20 байт = 600 байт)
    Строковые байты [1..8] инвертируются через XOR $FF при чтении и записи (CS:6DE4) }
  THighScoreRow = packed record
    PlayerName : String[8]; { +0x00..+0x08 }
    Score      : Integer;   { +0x09..+0x0A (16-bit signed LE) }
    ExtraTag   : String[8]; { +0x0B..+0x13 }
  end;

  THighScoreTable = array[1..3, 1..10] of THighScoreRow;

  { Дескриптор карты в руке игрока (6 байт, массив по смещению DS:3782h / DS:385Ah) }
  TCardSlot = packed record
    Suit    : Byte;    { +0x00: 1..4 (0 = слот пуст) }
    Rank    : Byte;    { +0x01: 6..14 }
    ScreenX : Integer; { +0x02: координата X на экране }
    ScreenY : Integer; { +0x04: координата Y на экране }
  end;

  { Заголовок виртуального буфера Genus PCX Toolkit (128-байтный PCX Header + 4 битовые плоскости) }
  PGenusVirtualBuf = ^TGenusVirtualBuf;
  TGenusVirtualBuf = packed record
    Manufacturer : Byte;                  { +0x00: $0A }
    Version      : Byte;                  { +0x01: $05 }
    Encoding     : Byte;                  { +0x02: $01 }
    BitsPerPixel : Byte;                  { +0x03: $01 }
    XMin, YMin   : Word;                  { +0x04, +0x06 }
    XMax, YMax   : Word;                  { +0x08, +0x0A }
    HRes, VRes   : Word;                  { +0x0C, +0x0E }
    Palette16    : array[0..47] of Byte;  { +0x10..+0x3F }
    Reserved     : Byte;                  { +0x40 }
    ColorPlanes  : Byte;                  { +0x41: 4 плоскости EGA }
    BytesPerLine : Word;                  { +0x42: ширина одной плоскости в байтах }
    PaletteType  : Word;                  { +0x44 }
    Padding      : array[0..57] of Byte;  { +0x46..+0x7F }
    PlaneData    : array[0..0] of Byte;   { +0x80: 4 плоскости подряд построчно }
  end;

{ Внешние вызовы Genus PCX Programmer's Toolkit v3.53 (сегменты 0ABFh и 0CA3h) }
function  pcxCreateVirtual(Mode: Word; var VBuf: Pointer; MemType, Width, Height: Word): Integer; far;
function  pcxDestroyVirtual(VBuf: Pointer): Integer; far;
function  pcxGetImagePlus(VBuf: Pointer; X1, Y1, X2, Y2, Page, Flag1, Flag2: Word): Integer; far;
function  pcxPutImagePlus(VBuf: Pointer; Mode, X, Y, W, H, Page, Op, F1, F2, DelayMs: Word): Integer; far;
function  pcxCopyImagePlus(X1, Y1, W, H, SrcPage, DstX, DstY, DstPage, Op, F1, F2, DelayMs: Word): Integer; far;
function  pcxLibDisplay(LibName, FileName: String; X, Y, Page: Word): Integer; far;
function  pcxGetLibPalette(Mode: Word; LibName, FileName: String; var Pal): Integer; far;
function  pcxSetDisplayPalette(var Pal): Integer; far;

implementation

function pcxCreateVirtual; begin pcxCreateVirtual := 0; end;
function pcxDestroyVirtual; begin pcxDestroyVirtual := 0; end;
function pcxGetImagePlus; begin pcxGetImagePlus := 0; end;
function pcxPutImagePlus; begin pcxPutImagePlus := 0; end;
function pcxCopyImagePlus; begin pcxCopyImagePlus := 0; end;
function pcxLibDisplay; begin pcxLibDisplay := 0; end;
function pcxGetLibPalette; begin pcxGetLibPalette := 0; end;
function pcxSetDisplayPalette; begin pcxSetDisplayPalette := 0; end;

end.
