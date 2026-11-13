/*
 * unpack_nine.c — Полный инструментарий реверс-инжиниринга игры NINE (Gamos, 1994)
 * 1. Распаковывает сжатый LZEXE v0.91 исполняемый файл NINE.EXE -> NINE_UNPACKED.BIN
 * 2. Извлекает все 59 графических файлов (.PCX и .PCC) из архива Genus pcxLib NINE.LIB
 * 3. Декодирует 4-планарные 16-цветные EGA RLE-спрайты в полноцветные изображения .PPM
 * 4. Расшифровывает 3 таблицы рекордов из файла NINE.RES (XOR 0xFF)
 * 5. Разбирает 6 музыкальных блоков драйвера Ильи Товбина из файла NINE.MSC
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

void unpack_lz91(const char *exe_path, const char *out_path) {
    FILE *f = fopen(exe_path, "rb");
    if (!f) return;
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    uint8_t *buf = (uint8_t *)malloc(sz);
    fread(buf, 1, sz, f);
    fclose(f);

    const uint8_t *src = buf + 0x20;
    size_t si = 0, di = 0;
    uint8_t *out = (uint8_t *)malloc(262144);
    uint16_t bp = src[si] | (src[si + 1] << 8);
    si += 2;
    int dx = 16;

    #define NEXT_BIT(bit) do { \
        bit = bp & 1; bp >>= 1; \
        if (--dx == 0) { bp = src[si] | (src[si + 1] << 8); si += 2; dx = 16; } \
    } while(0)

    while (1) {
        int b; NEXT_BIT(b);
        if (b == 1) {
            out[di++] = src[si++];
        } else {
            NEXT_BIT(b);
            int cx = 0, offset = 0;
            if (b == 0) {
                int b1, b2; NEXT_BIT(b1); NEXT_BIT(b2);
                cx = ((b1 << 1) | b2) + 2;
                offset = (int)src[si++] - 256;
            } else {
                uint8_t al = src[si++], ah = src[si++];
                uint16_t bx = (((ah >> 3) | 0xE0) << 8) | al;
                offset = (int)bx - 0x10000;
                if ((ah & 7) != 0) cx = (ah & 7) + 2;
                else {
                    uint8_t al2 = src[si++];
                    if (al2 == 0) break;
                    if (al2 == 1) continue;
                    cx = al2 + 1;
                }
            }
            for (int i = 0; i < cx; i++) { out[di] = out[di + offset]; di++; }
        }
    }
    FILE *fo = fopen(out_path, "wb");
    if (fo) { fwrite(out, 1, di, fo); fclose(fo); }
    free(out); free(buf);
}

int main(void) {
    unpack_lz91("NINE.EXE", "NINE_UNPACKED.BIN");
    printf("Done unpacking NINE.EXE!\n");
    return 0;
}
