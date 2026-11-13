; ============================================================================
; ДИЗАССЕМБЛИРОВАННЫЙ КОД ИГРЫ "ДЕВЯТКА" (NINE.EXE, Gamos 1993-1994)
; Снята защита LZEXE v0.91 (LZ91). Главный кодовый сегмент CS = 0000h (0000h..9000h)
; ============================================================================
; КАРТА КЛЮЧЕВЫХ ПРОЦЕДУР ОТРИСОВКИ И ЛОГИКИ:
;   0x3156 .. 0x37FF : DrawMainTableScreen() — загрузка TF_Nine.pcx и копирование портретов
;   0x3800 .. 0x46E5 : GameMatchController() — управление раундами, окнами GR_Nine/GF_Nine
;   0x46E6 .. 0x5295 : InitCoordinatesAndTables() — инициализация массивов координат карт
;   0x52F9 .. 0x601F : ProgramEntryPoint() — старт программы, загрузка Nine.msc, нарезка спрайтов
;   0x6020 .. 0x606B : RecordCandidateMove() — запись кандидата в список лучших ходов ИИ
;   0x606C .. 0x66B4 : AnalyzeSuitBranches() — подсчёт карт и дыр в мастях (ядро ИИ)
;   0x66B5 .. 0x6A38 : EvaluateOpponentLockRisk() — оценка запирания масти для соперников
;   0x6A39 .. 0x6CE7 : CompareMovePriority() — выбор лучшего хода ИИ с учётом сложности
;   0x6CE8 .. 0x6DE3 : SelectBotMove() — главная точка входа ИИ компьютерного игрока
;   0x6DE4 .. 0x70F2 : LoadAndDecryptNineRes() — чтение/расшифровка Nine.res (XOR 0xFF)
;   0x70F3 .. 0x71EA : DrawScoreThermometer() — отрисовка шкалы очков внизу экрана
;   0x71ED .. 0x7379 : DrawBitmapNumber() — поразрядный вывод чисел 8x7 через CopyImagePlus
;   0x737C .. 0x7891 : AnimatePortraitAndCandles() — 4 сценария мимики и свечей
;   0x7894 .. 0x7E3E : ReadGraphicString() — графический ввод имени игрока с курсором
;   0x7E81 .. 0x8103 : DrawHighScoresTable() — отрисовка таблицы рекордов
;   0x8104 .. 0x825B : ClearTableAndRestoreBackground() — очистка стола между раздачами
;   0x825C .. 0x842D : ShuffleAndDeal36Cards() — тасование колоды, поиск 9 бубен, загрузка карт
;   0x842E .. 0x893C : SortAndRenderPlayerHand() — сортировка руки и центрированная веерная укладка
;   0x8950 .. 0x8CAB : PutMaskedImage4Plane() — 4-планарный EGA блиттер с прозрачностью
;   0x8CAE .. 0x9A84 : MoveImageSmooth() — плавное скольжение карты по сукну с сохранением фона
; ============================================================================


/tmp/nine_build/main_code.bin:     file format binary


Disassembly of section .data:

00000000 <.data>:
       0:	55                   	push   %bp
       1:	89 e5                	mov    %sp,%bp
       3:	83 ec 22             	sub    $0x22,%sp
       6:	80 7e 06 04          	cmpb   $0x4,0x6(%bp)
       a:	75 42                	jne    0x4e
       c:	b8 01 00             	mov    $0x1,%ax
       f:	50                   	push   %ax
      10:	b8 ee 2f             	mov    $0x2fee,%ax
      13:	8c da                	mov    %ds,%dx
      15:	52                   	push   %dx
      16:	50                   	push   %ax
      17:	b8 05 00             	mov    $0x5,%ax
      1a:	50                   	push   %ax
      1b:	b8 45 00             	mov    $0x45,%ax
      1e:	50                   	push   %ax
      1f:	b8 19 00             	mov    $0x19,%ax
      22:	50                   	push   %ax
      23:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
      28:	ff 36 f0 2f          	push   0x2ff0
      2c:	ff 36 ee 2f          	push   0x2fee
      30:	b8 12 01             	mov    $0x112,%ax
      33:	50                   	push   %ax
      34:	b8 47 00             	mov    $0x47,%ax
      37:	50                   	push   %ax
      38:	b8 45 00             	mov    $0x45,%ax
      3b:	50                   	push   %ax
      3c:	b8 19 00             	mov    $0x19,%ax
      3f:	50                   	push   %ax
      40:	31 c0                	xor    %ax,%ax
      42:	50                   	push   %ax
      43:	b0 00                	mov    $0x0,%al
      45:	50                   	push   %ax
      46:	b0 01                	mov    $0x1,%al
      48:	50                   	push   %ax
      49:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
      4e:	b8 01 00             	mov    $0x1,%ax
      51:	50                   	push   %ax
      52:	b8 f2 2f             	mov    $0x2ff2,%ax
      55:	8c da                	mov    %ds,%dx
      57:	52                   	push   %dx
      58:	50                   	push   %ax
      59:	b8 05 00             	mov    $0x5,%ax
      5c:	50                   	push   %ax
      5d:	b8 45 00             	mov    $0x45,%ax
      60:	50                   	push   %ax
      61:	b8 5d 00             	mov    $0x5d,%ax
      64:	50                   	push   %ax
      65:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
      6a:	8a 46 06             	mov    0x6(%bp),%al
      6d:	30 e4                	xor    %ah,%ah
      6f:	3d 04 00             	cmp    $0x4,%ax
      72:	75 4d                	jne    0xc1
      74:	c7 46 fc 04 00       	movw   $0x4,-0x4(%bp)
      79:	8b 46 fc             	mov    -0x4(%bp),%ax
      7c:	89 46 de             	mov    %ax,-0x22(%bp)
      7f:	b8 01 00             	mov    $0x1,%ax
      82:	3b 46 de             	cmp    -0x22(%bp),%ax
      85:	7f 2d                	jg     0xb4
      87:	89 46 fe             	mov    %ax,-0x2(%bp)
      8a:	eb 03                	jmp    0x8f
      8c:	ff 46 fe             	incw   -0x2(%bp)
      8f:	8b 46 fe             	mov    -0x2(%bp),%ax
      92:	40                   	inc    %ax
      93:	8b f8                	mov    %ax,%di
      95:	d1 e7                	shl    %di
      97:	d1 e7                	shl    %di
      99:	c4 85 e6 3c          	les    0x3ce6(%di),%ax
      9d:	8c c2                	mov    %es,%dx
      9f:	8b 7e fe             	mov    -0x2(%bp),%di
      a2:	d1 e7                	shl    %di
      a4:	d1 e7                	shl    %di
      a6:	89 43 e0             	mov    %ax,-0x20(%bp,%di)
      a9:	89 53 e2             	mov    %dx,-0x1e(%bp,%di)
      ac:	8b 46 fe             	mov    -0x2(%bp),%ax
      af:	3b 46 de             	cmp    -0x22(%bp),%ax
      b2:	75 d8                	jne    0x8c
      b4:	c7 46 e2 01 00       	movw   $0x1,-0x1e(%bp)
      b9:	c7 46 e0 11 01       	movw   $0x111,-0x20(%bp)
      be:	e9 1c 01             	jmp    0x1dd
      c1:	3d 05 00             	cmp    $0x5,%ax
      c4:	75 4f                	jne    0x115
      c6:	c7 46 fc 03 00       	movw   $0x3,-0x4(%bp)
      cb:	8b 46 fc             	mov    -0x4(%bp),%ax
      ce:	89 46 de             	mov    %ax,-0x22(%bp)
      d1:	b8 01 00             	mov    $0x1,%ax
      d4:	3b 46 de             	cmp    -0x22(%bp),%ax
      d7:	7f 2f                	jg     0x108
      d9:	89 46 fe             	mov    %ax,-0x2(%bp)
      dc:	eb 03                	jmp    0xe1
      de:	ff 46 fe             	incw   -0x2(%bp)
      e1:	b8 04 00             	mov    $0x4,%ax
      e4:	2b 46 fe             	sub    -0x2(%bp),%ax
      e7:	8b f8                	mov    %ax,%di
      e9:	d1 e7                	shl    %di
      eb:	d1 e7                	shl    %di
      ed:	c4 85 e6 3c          	les    0x3ce6(%di),%ax
      f1:	8c c2                	mov    %es,%dx
      f3:	8b 7e fe             	mov    -0x2(%bp),%di
      f6:	d1 e7                	shl    %di
      f8:	d1 e7                	shl    %di
      fa:	89 43 e0             	mov    %ax,-0x20(%bp,%di)
      fd:	89 53 e2             	mov    %dx,-0x1e(%bp,%di)
     100:	8b 46 fe             	mov    -0x2(%bp),%ax
     103:	3b 46 de             	cmp    -0x22(%bp),%ax
     106:	75 d6                	jne    0xde
     108:	c7 46 e2 01 00       	movw   $0x1,-0x1e(%bp)
     10d:	c7 46 e0 11 01       	movw   $0x111,-0x20(%bp)
     112:	e9 c8 00             	jmp    0x1dd
     115:	3d 03 00             	cmp    $0x3,%ax
     118:	75 49                	jne    0x163
     11a:	c7 46 fc 03 00       	movw   $0x3,-0x4(%bp)
     11f:	8b 46 fc             	mov    -0x4(%bp),%ax
     122:	89 46 de             	mov    %ax,-0x22(%bp)
     125:	b8 01 00             	mov    $0x1,%ax
     128:	3b 46 de             	cmp    -0x22(%bp),%ax
     12b:	7f 2a                	jg     0x157
     12d:	89 46 fe             	mov    %ax,-0x2(%bp)
     130:	eb 03                	jmp    0x135
     132:	ff 46 fe             	incw   -0x2(%bp)
     135:	8b 7e fe             	mov    -0x2(%bp),%di
     138:	d1 e7                	shl    %di
     13a:	d1 e7                	shl    %di
     13c:	c4 85 fa 3c          	les    0x3cfa(%di),%ax
     140:	8c c2                	mov    %es,%dx
     142:	8b 7e fe             	mov    -0x2(%bp),%di
     145:	d1 e7                	shl    %di
     147:	d1 e7                	shl    %di
     149:	89 43 e0             	mov    %ax,-0x20(%bp,%di)
     14c:	89 53 e2             	mov    %dx,-0x1e(%bp,%di)
     14f:	8b 46 fe             	mov    -0x2(%bp),%ax
     152:	3b 46 de             	cmp    -0x22(%bp),%ax
     155:	75 db                	jne    0x132
     157:	c7 46 e2 01 00       	movw   $0x1,-0x1e(%bp)
     15c:	c7 46 e0 00 01       	movw   $0x100,-0x20(%bp)
     161:	eb 7a                	jmp    0x1dd
     163:	3d 01 00             	cmp    $0x1,%ax
     166:	75 29                	jne    0x191
     168:	c7 46 fc 02 00       	movw   $0x2,-0x4(%bp)
     16d:	c4 06 f6 3c          	les    0x3cf6,%ax
     171:	8c c2                	mov    %es,%dx
     173:	89 46 e4             	mov    %ax,-0x1c(%bp)
     176:	89 56 e6             	mov    %dx,-0x1a(%bp)
     179:	c4 06 0a 3d          	les    0x3d0a,%ax
     17d:	8c c2                	mov    %es,%dx
     17f:	89 46 e8             	mov    %ax,-0x18(%bp)
     182:	89 56 ea             	mov    %dx,-0x16(%bp)
     185:	c7 46 e2 01 00       	movw   $0x1,-0x1e(%bp)
     18a:	c7 46 e0 11 01       	movw   $0x111,-0x20(%bp)
     18f:	eb 4c                	jmp    0x1dd
     191:	3d 02 00             	cmp    $0x2,%ax
     194:	75 47                	jne    0x1dd
     196:	c7 46 fc 02 00       	movw   $0x2,-0x4(%bp)
     19b:	8b 46 fc             	mov    -0x4(%bp),%ax
     19e:	89 46 de             	mov    %ax,-0x22(%bp)
     1a1:	b8 01 00             	mov    $0x1,%ax
     1a4:	3b 46 de             	cmp    -0x22(%bp),%ax
     1a7:	7f 2a                	jg     0x1d3
     1a9:	89 46 fe             	mov    %ax,-0x2(%bp)
     1ac:	eb 03                	jmp    0x1b1
     1ae:	ff 46 fe             	incw   -0x2(%bp)
     1b1:	8b 7e fe             	mov    -0x2(%bp),%di
     1b4:	d1 e7                	shl    %di
     1b6:	d1 e7                	shl    %di
     1b8:	c4 85 0a 3d          	les    0x3d0a(%di),%ax
     1bc:	8c c2                	mov    %es,%dx
     1be:	8b 7e fe             	mov    -0x2(%bp),%di
     1c1:	d1 e7                	shl    %di
     1c3:	d1 e7                	shl    %di
     1c5:	89 43 e0             	mov    %ax,-0x20(%bp,%di)
     1c8:	89 53 e2             	mov    %dx,-0x1e(%bp,%di)
     1cb:	8b 46 fe             	mov    -0x2(%bp),%ax
     1ce:	3b 46 de             	cmp    -0x22(%bp),%ax
     1d1:	75 db                	jne    0x1ae
     1d3:	c7 46 e2 01 00       	movw   $0x1,-0x1e(%bp)
     1d8:	c7 46 e0 11 01       	movw   $0x111,-0x20(%bp)
     1dd:	8b 46 fc             	mov    -0x4(%bp),%ax
     1e0:	89 46 de             	mov    %ax,-0x22(%bp)
     1e3:	b8 01 00             	mov    $0x1,%ax
     1e6:	3b 46 de             	cmp    -0x22(%bp),%ax
     1e9:	7e 03                	jle    0x1ee
     1eb:	e9 69 01             	jmp    0x357
     1ee:	89 46 fe             	mov    %ax,-0x2(%bp)
     1f1:	eb 03                	jmp    0x1f6
     1f3:	ff 46 fe             	incw   -0x2(%bp)
     1f6:	ff 36 f0 2f          	push   0x2ff0
     1fa:	ff 36 ee 2f          	push   0x2fee
     1fe:	31 c0                	xor    %ax,%ax
     200:	50                   	push   %ax
     201:	b8 01 00             	mov    $0x1,%ax
     204:	50                   	push   %ax
     205:	b8 44 01             	mov    $0x144,%ax
     208:	50                   	push   %ax
     209:	b8 01 00             	mov    $0x1,%ax
     20c:	50                   	push   %ax
     20d:	b0 02                	mov    $0x2,%al
     20f:	50                   	push   %ax
     210:	b0 00                	mov    $0x0,%al
     212:	50                   	push   %ax
     213:	b0 01                	mov    $0x1,%al
     215:	50                   	push   %ax
     216:	b8 0a 00             	mov    $0xa,%ax
     219:	50                   	push   %ax
     21a:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     21f:	8b 7e fe             	mov    -0x2(%bp),%di
     222:	d1 e7                	shl    %di
     224:	d1 e7                	shl    %di
     226:	ff 73 e2             	push   -0x1e(%bp,%di)
     229:	ff 73 e0             	push   -0x20(%bp,%di)
     22c:	ff 76 e2             	push   -0x1e(%bp)
     22f:	ff 76 e0             	push   -0x20(%bp)
     232:	b8 01 00             	mov    $0x1,%ax
     235:	50                   	push   %ax
     236:	b0 02                	mov    $0x2,%al
     238:	50                   	push   %ax
     239:	b0 00                	mov    $0x0,%al
     23b:	50                   	push   %ax
     23c:	b0 01                	mov    $0x1,%al
     23e:	50                   	push   %ax
     23f:	b8 0a 00             	mov    $0xa,%ax
     242:	50                   	push   %ax
     243:	9a 00 00 95 08       	lcall  $0x895,$0x0
     248:	80 7e 06 05          	cmpb   $0x5,0x6(%bp)
     24c:	75 06                	jne    0x254
     24e:	83 7e fe 01          	cmpw   $0x1,-0x2(%bp)
     252:	75 06                	jne    0x25a
     254:	80 7e 06 04          	cmpb   $0x4,0x6(%bp)
     258:	75 7a                	jne    0x2d4
     25a:	ff 36 f4 2f          	push   0x2ff4
     25e:	ff 36 f2 2f          	push   0x2ff2
     262:	b8 01 00             	mov    $0x1,%ax
     265:	50                   	push   %ax
     266:	b8 11 01             	mov    $0x111,%ax
     269:	50                   	push   %ax
     26a:	b8 45 00             	mov    $0x45,%ax
     26d:	50                   	push   %ax
     26e:	b8 3d 00             	mov    $0x3d,%ax
     271:	50                   	push   %ax
     272:	b8 01 00             	mov    $0x1,%ax
     275:	50                   	push   %ax
     276:	b0 00                	mov    $0x0,%al
     278:	50                   	push   %ax
     279:	b0 01                	mov    $0x1,%al
     27b:	50                   	push   %ax
     27c:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
     281:	ff 36 f4 2f          	push   0x2ff4
     285:	ff 36 f2 2f          	push   0x2ff2
     289:	31 c0                	xor    %ax,%ax
     28b:	50                   	push   %ax
     28c:	b8 12 01             	mov    $0x112,%ax
     28f:	50                   	push   %ax
     290:	b8 14 00             	mov    $0x14,%ax
     293:	50                   	push   %ax
     294:	31 c0                	xor    %ax,%ax
     296:	50                   	push   %ax
     297:	b0 02                	mov    $0x2,%al
     299:	50                   	push   %ax
     29a:	b0 00                	mov    $0x0,%al
     29c:	50                   	push   %ax
     29d:	b0 01                	mov    $0x1,%al
     29f:	50                   	push   %ax
     2a0:	b8 0a 00             	mov    $0xa,%ax
     2a3:	50                   	push   %ax
     2a4:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     2a9:	ff 36 f4 2f          	push   0x2ff4
     2ad:	ff 36 f2 2f          	push   0x2ff2
     2b1:	b8 03 00             	mov    $0x3,%ax
     2b4:	50                   	push   %ax
     2b5:	b8 01 00             	mov    $0x1,%ax
     2b8:	50                   	push   %ax
     2b9:	b8 11 01             	mov    $0x111,%ax
     2bc:	50                   	push   %ax
     2bd:	b8 01 00             	mov    $0x1,%ax
     2c0:	50                   	push   %ax
     2c1:	b0 02                	mov    $0x2,%al
     2c3:	50                   	push   %ax
     2c4:	b0 00                	mov    $0x0,%al
     2c6:	50                   	push   %ax
     2c7:	b0 01                	mov    $0x1,%al
     2c9:	50                   	push   %ax
     2ca:	31 c0                	xor    %ax,%ax
     2cc:	50                   	push   %ax
     2cd:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     2d2:	eb 78                	jmp    0x34c
     2d4:	ff 36 f4 2f          	push   0x2ff4
     2d8:	ff 36 f2 2f          	push   0x2ff2
     2dc:	b8 01 00             	mov    $0x1,%ax
     2df:	50                   	push   %ax
     2e0:	b8 00 01             	mov    $0x100,%ax
     2e3:	50                   	push   %ax
     2e4:	b8 45 00             	mov    $0x45,%ax
     2e7:	50                   	push   %ax
     2e8:	b8 5d 00             	mov    $0x5d,%ax
     2eb:	50                   	push   %ax
     2ec:	b8 01 00             	mov    $0x1,%ax
     2ef:	50                   	push   %ax
     2f0:	b0 00                	mov    $0x0,%al
     2f2:	50                   	push   %ax
     2f3:	b0 01                	mov    $0x1,%al
     2f5:	50                   	push   %ax
     2f6:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
     2fb:	ff 36 f4 2f          	push   0x2ff4
     2ff:	ff 36 f2 2f          	push   0x2ff2
     303:	31 c0                	xor    %ax,%ax
     305:	50                   	push   %ax
     306:	b8 12 01             	mov    $0x112,%ax
     309:	50                   	push   %ax
     30a:	b8 03 00             	mov    $0x3,%ax
     30d:	50                   	push   %ax
     30e:	31 c0                	xor    %ax,%ax
     310:	50                   	push   %ax
     311:	b0 02                	mov    $0x2,%al
     313:	50                   	push   %ax
     314:	b0 00                	mov    $0x0,%al
     316:	50                   	push   %ax
     317:	b0 01                	mov    $0x1,%al
     319:	50                   	push   %ax
     31a:	b8 0a 00             	mov    $0xa,%ax
     31d:	50                   	push   %ax
     31e:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     323:	ff 36 f4 2f          	push   0x2ff4
     327:	ff 36 f2 2f          	push   0x2ff2
     32b:	b8 03 00             	mov    $0x3,%ax
     32e:	50                   	push   %ax
     32f:	b8 01 00             	mov    $0x1,%ax
     332:	50                   	push   %ax
     333:	b8 00 01             	mov    $0x100,%ax
     336:	50                   	push   %ax
     337:	b8 01 00             	mov    $0x1,%ax
     33a:	50                   	push   %ax
     33b:	b0 02                	mov    $0x2,%al
     33d:	50                   	push   %ax
     33e:	b0 00                	mov    $0x0,%al
     340:	50                   	push   %ax
     341:	b0 01                	mov    $0x1,%al
     343:	50                   	push   %ax
     344:	31 c0                	xor    %ax,%ax
     346:	50                   	push   %ax
     347:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     34c:	8b 46 fe             	mov    -0x2(%bp),%ax
     34f:	3b 46 de             	cmp    -0x22(%bp),%ax
     352:	74 03                	je     0x357
     354:	e9 9c fe             	jmp    0x1f3
     357:	ff 36 f4 2f          	push   0x2ff4
     35b:	ff 36 f2 2f          	push   0x2ff2
     35f:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
     364:	80 7e 06 05          	cmpb   $0x5,0x6(%bp)
     368:	75 0d                	jne    0x377
     36a:	ff 36 f0 2f          	push   0x2ff0
     36e:	ff 36 ee 2f          	push   0x2fee
     372:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
     377:	89 ec                	mov    %bp,%sp
     379:	5d                   	pop    %bp
     37a:	ca 02 00             	lret   $0x2
     37d:	55                   	push   %bp
     37e:	89 e5                	mov    %sp,%bp
     380:	83 ec 0e             	sub    $0xe,%sp
     383:	80 7e 08 01          	cmpb   $0x1,0x8(%bp)
     387:	75 07                	jne    0x390
     389:	c7 46 fa 21 00       	movw   $0x21,-0x6(%bp)
     38e:	eb 05                	jmp    0x395
     390:	c7 46 fa 21 02       	movw   $0x221,-0x6(%bp)
     395:	c7 46 f8 65 00       	movw   $0x65,-0x8(%bp)
     39a:	80 7e 06 01          	cmpb   $0x1,0x6(%bp)
     39e:	75 41                	jne    0x3e1
     3a0:	b8 01 00             	mov    $0x1,%ax
     3a3:	50                   	push   %ax
     3a4:	b8 ea 2f             	mov    $0x2fea,%ax
     3a7:	8c da                	mov    %ds,%dx
     3a9:	52                   	push   %dx
     3aa:	50                   	push   %ax
     3ab:	b8 05 00             	mov    $0x5,%ax
     3ae:	50                   	push   %ax
     3af:	b8 3a 00             	mov    $0x3a,%ax
     3b2:	50                   	push   %ax
     3b3:	b8 0b 00             	mov    $0xb,%ax
     3b6:	50                   	push   %ax
     3b7:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
     3bc:	ff 36 ec 2f          	push   0x2fec
     3c0:	ff 36 ea 2f          	push   0x2fea
     3c4:	ff 76 fa             	push   -0x6(%bp)
     3c7:	b8 91 00             	mov    $0x91,%ax
     3ca:	50                   	push   %ax
     3cb:	b8 3a 00             	mov    $0x3a,%ax
     3ce:	50                   	push   %ax
     3cf:	b8 0b 00             	mov    $0xb,%ax
     3d2:	50                   	push   %ax
     3d3:	31 c0                	xor    %ax,%ax
     3d5:	50                   	push   %ax
     3d6:	b0 00                	mov    $0x0,%al
     3d8:	50                   	push   %ax
     3d9:	b0 01                	mov    $0x1,%al
     3db:	50                   	push   %ax
     3dc:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
     3e1:	ff 36 ec 2f          	push   0x2fec
     3e5:	ff 36 ea 2f          	push   0x2fea
     3e9:	31 c0                	xor    %ax,%ax
     3eb:	50                   	push   %ax
     3ec:	b8 18 00             	mov    $0x18,%ax
     3ef:	50                   	push   %ax
     3f0:	b8 8a 00             	mov    $0x8a,%ax
     3f3:	50                   	push   %ax
     3f4:	b8 01 00             	mov    $0x1,%ax
     3f7:	50                   	push   %ax
     3f8:	b0 02                	mov    $0x2,%al
     3fa:	50                   	push   %ax
     3fb:	b0 00                	mov    $0x0,%al
     3fd:	50                   	push   %ax
     3fe:	b0 01                	mov    $0x1,%al
     400:	50                   	push   %ax
     401:	b8 0a 00             	mov    $0xa,%ax
     404:	50                   	push   %ax
     405:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     40a:	8a 46 06             	mov    0x6(%bp),%al
     40d:	30 e4                	xor    %ah,%ah
     40f:	3d 01 00             	cmp    $0x1,%ax
     412:	75 48                	jne    0x45c
     414:	c7 46 fc 03 00       	movw   $0x3,-0x4(%bp)
     419:	8b 46 fc             	mov    -0x4(%bp),%ax
     41c:	89 46 f2             	mov    %ax,-0xe(%bp)
     41f:	b8 01 00             	mov    $0x1,%ax
     422:	3b 46 f2             	cmp    -0xe(%bp),%ax
     425:	7f 32                	jg     0x459
     427:	89 46 fe             	mov    %ax,-0x2(%bp)
     42a:	eb 03                	jmp    0x42f
     42c:	ff 46 fe             	incw   -0x2(%bp)
     42f:	8b 7e fe             	mov    -0x2(%bp),%di
     432:	d1 e7                	shl    %di
     434:	d1 e7                	shl    %di
     436:	c7 85 3a 2e 67 01    	movw   $0x167,0x2e3a(%di)
     43c:	8b 46 fe             	mov    -0x2(%bp),%ax
     43f:	48                   	dec    %ax
     440:	b9 38 00             	mov    $0x38,%cx
     443:	f7 e9                	imul   %cx
     445:	40                   	inc    %ax
     446:	8b 7e fe             	mov    -0x2(%bp),%di
     449:	d1 e7                	shl    %di
     44b:	d1 e7                	shl    %di
     44d:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     451:	8b 46 fe             	mov    -0x2(%bp),%ax
     454:	3b 46 f2             	cmp    -0xe(%bp),%ax
     457:	75 d3                	jne    0x42c
     459:	e9 07 01             	jmp    0x563
     45c:	3d 02 00             	cmp    $0x2,%ax
     45f:	74 03                	je     0x464
     461:	e9 ad 00             	jmp    0x511
     464:	c7 46 fc 07 00       	movw   $0x7,-0x4(%bp)
     469:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     46e:	eb 03                	jmp    0x473
     470:	ff 46 fe             	incw   -0x2(%bp)
     473:	8b 7e fe             	mov    -0x2(%bp),%di
     476:	d1 e7                	shl    %di
     478:	d1 e7                	shl    %di
     47a:	c7 85 3a 2e 67 01    	movw   $0x167,0x2e3a(%di)
     480:	8b 46 fe             	mov    -0x2(%bp),%ax
     483:	48                   	dec    %ax
     484:	b9 38 00             	mov    $0x38,%cx
     487:	f7 e9                	imul   %cx
     489:	05 a9 00             	add    $0xa9,%ax
     48c:	8b 7e fe             	mov    -0x2(%bp),%di
     48f:	d1 e7                	shl    %di
     491:	d1 e7                	shl    %di
     493:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     497:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
     49b:	75 d3                	jne    0x470
     49d:	8b 46 fc             	mov    -0x4(%bp),%ax
     4a0:	48                   	dec    %ax
     4a1:	89 46 f2             	mov    %ax,-0xe(%bp)
     4a4:	b8 04 00             	mov    $0x4,%ax
     4a7:	3b 46 f2             	cmp    -0xe(%bp),%ax
     4aa:	7f 34                	jg     0x4e0
     4ac:	89 46 fe             	mov    %ax,-0x2(%bp)
     4af:	eb 03                	jmp    0x4b4
     4b1:	ff 46 fe             	incw   -0x2(%bp)
     4b4:	8b 7e fe             	mov    -0x2(%bp),%di
     4b7:	d1 e7                	shl    %di
     4b9:	d1 e7                	shl    %di
     4bb:	c7 85 3a 2e a2 01    	movw   $0x1a2,0x2e3a(%di)
     4c1:	8b 46 fe             	mov    -0x2(%bp),%ax
     4c4:	2d 04 00             	sub    $0x4,%ax
     4c7:	b9 38 00             	mov    $0x38,%cx
     4ca:	f7 e9                	imul   %cx
     4cc:	40                   	inc    %ax
     4cd:	8b 7e fe             	mov    -0x2(%bp),%di
     4d0:	d1 e7                	shl    %di
     4d2:	d1 e7                	shl    %di
     4d4:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     4d8:	8b 46 fe             	mov    -0x2(%bp),%ax
     4db:	3b 46 f2             	cmp    -0xe(%bp),%ax
     4de:	75 d1                	jne    0x4b1
     4e0:	8b 7e fc             	mov    -0x4(%bp),%di
     4e3:	d1 e7                	shl    %di
     4e5:	d1 e7                	shl    %di
     4e7:	c7 85 3a 2e a2 01    	movw   $0x1a2,0x2e3a(%di)
     4ed:	80 7e 08 01          	cmpb   $0x1,0x8(%bp)
     4f1:	75 0f                	jne    0x502
     4f3:	8b 7e fc             	mov    -0x4(%bp),%di
     4f6:	d1 e7                	shl    %di
     4f8:	d1 e7                	shl    %di
     4fa:	c7 85 3c 2e a9 00    	movw   $0xa9,0x2e3c(%di)
     500:	eb 0d                	jmp    0x50f
     502:	8b 7e fc             	mov    -0x4(%bp),%di
     505:	d1 e7                	shl    %di
     507:	d1 e7                	shl    %di
     509:	c7 85 3c 2e 19 01    	movw   $0x119,0x2e3c(%di)
     50f:	eb 52                	jmp    0x563
     511:	3d 03 00             	cmp    $0x3,%ax
     514:	75 2b                	jne    0x541
     516:	c7 46 fc 03 00       	movw   $0x3,-0x4(%bp)
     51b:	c7 06 3e 2e a2 01    	movw   $0x1a2,0x2e3e
     521:	c7 06 40 2e e1 00    	movw   $0xe1,0x2e40
     527:	c7 06 42 2e 67 01    	movw   $0x167,0x2e42
     52d:	c7 06 44 2e 39 00    	movw   $0x39,0x2e44
     533:	c7 06 46 2e 67 01    	movw   $0x167,0x2e46
     539:	c7 06 48 2e 01 00    	movw   $0x1,0x2e48
     53f:	eb 22                	jmp    0x563
     541:	3d 04 00             	cmp    $0x4,%ax
     544:	75 1d                	jne    0x563
     546:	c7 46 fc 02 00       	movw   $0x2,-0x4(%bp)
     54b:	c7 06 3e 2e 67 01    	movw   $0x167,0x2e3e
     551:	c7 06 40 2e 39 00    	movw   $0x39,0x2e40
     557:	c7 06 42 2e 67 01    	movw   $0x167,0x2e42
     55d:	c7 06 44 2e 01 00    	movw   $0x1,0x2e44
     563:	8b 46 fc             	mov    -0x4(%bp),%ax
     566:	a3 ce 2f             	mov    %ax,0x2fce
     569:	31 c0                	xor    %ax,%ax
     56b:	a3 32 2e             	mov    %ax,0x2e32
     56e:	31 c0                	xor    %ax,%ax
     570:	a3 34 2e             	mov    %ax,0x2e34
     573:	c7 06 36 2e 3c 00    	movw   $0x3c,0x2e36
     579:	c7 06 d0 2f 18 00    	movw   $0x18,0x2fd0
     57f:	c7 06 d2 2f 5e 00    	movw   $0x5e,0x2fd2
     585:	ff 76 fa             	push   -0x6(%bp)
     588:	b8 65 00             	mov    $0x65,%ax
     58b:	50                   	push   %ax
     58c:	b8 3a 00             	mov    $0x3a,%ax
     58f:	50                   	push   %ax
     590:	b8 37 00             	mov    $0x37,%ax
     593:	50                   	push   %ax
     594:	ff 76 fa             	push   -0x6(%bp)
     597:	b8 65 00             	mov    $0x65,%ax
     59a:	50                   	push   %ax
     59b:	b0 00                	mov    $0x0,%al
     59d:	50                   	push   %ax
     59e:	b0 01                	mov    $0x1,%al
     5a0:	50                   	push   %ax
     5a1:	b0 01                	mov    $0x1,%al
     5a3:	50                   	push   %ax
     5a4:	b0 02                	mov    $0x2,%al
     5a6:	50                   	push   %ax
     5a7:	b0 00                	mov    $0x0,%al
     5a9:	50                   	push   %ax
     5aa:	b0 01                	mov    $0x1,%al
     5ac:	50                   	push   %ax
     5ad:	9a 5e 03 95 08       	lcall  $0x895,$0x35e
     5b2:	80 7e 06 03          	cmpb   $0x3,0x6(%bp)
     5b6:	75 0d                	jne    0x5c5
     5b8:	ff 36 ec 2f          	push   0x2fec
     5bc:	ff 36 ea 2f          	push   0x2fea
     5c0:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
     5c5:	89 ec                	mov    %bp,%sp
     5c7:	5d                   	pop    %bp
     5c8:	ca 04 00             	lret   $0x4
     5cb:	55                   	push   %bp
     5cc:	89 e5                	mov    %sp,%bp
     5ce:	83 ec 0c             	sub    $0xc,%sp
     5d1:	80 7e 06 01          	cmpb   $0x1,0x6(%bp)
     5d5:	75 07                	jne    0x5de
     5d7:	c7 46 fa 21 00       	movw   $0x21,-0x6(%bp)
     5dc:	eb 05                	jmp    0x5e3
     5de:	c7 46 fa 21 02       	movw   $0x221,-0x6(%bp)
     5e3:	c7 46 f8 65 00       	movw   $0x65,-0x8(%bp)
     5e8:	b8 01 00             	mov    $0x1,%ax
     5eb:	50                   	push   %ax
     5ec:	b8 ea 2f             	mov    $0x2fea,%ax
     5ef:	8c da                	mov    %ds,%dx
     5f1:	52                   	push   %dx
     5f2:	50                   	push   %ax
     5f3:	b8 05 00             	mov    $0x5,%ax
     5f6:	50                   	push   %ax
     5f7:	b8 3a 00             	mov    $0x3a,%ax
     5fa:	50                   	push   %ax
     5fb:	b8 0b 00             	mov    $0xb,%ax
     5fe:	50                   	push   %ax
     5ff:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
     604:	ff 36 ec 2f          	push   0x2fec
     608:	ff 36 ea 2f          	push   0x2fea
     60c:	ff 76 fa             	push   -0x6(%bp)
     60f:	b8 91 00             	mov    $0x91,%ax
     612:	50                   	push   %ax
     613:	b8 3a 00             	mov    $0x3a,%ax
     616:	50                   	push   %ax
     617:	b8 0b 00             	mov    $0xb,%ax
     61a:	50                   	push   %ax
     61b:	31 c0                	xor    %ax,%ax
     61d:	50                   	push   %ax
     61e:	b0 00                	mov    $0x0,%al
     620:	50                   	push   %ax
     621:	b0 01                	mov    $0x1,%al
     623:	50                   	push   %ax
     624:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
     629:	ff 36 ec 2f          	push   0x2fec
     62d:	ff 36 ea 2f          	push   0x2fea
     631:	31 c0                	xor    %ax,%ax
     633:	50                   	push   %ax
     634:	b8 18 00             	mov    $0x18,%ax
     637:	50                   	push   %ax
     638:	b8 8a 00             	mov    $0x8a,%ax
     63b:	50                   	push   %ax
     63c:	b8 01 00             	mov    $0x1,%ax
     63f:	50                   	push   %ax
     640:	b0 02                	mov    $0x2,%al
     642:	50                   	push   %ax
     643:	b0 00                	mov    $0x0,%al
     645:	50                   	push   %ax
     646:	b0 01                	mov    $0x1,%al
     648:	50                   	push   %ax
     649:	b8 0a 00             	mov    $0xa,%ax
     64c:	50                   	push   %ax
     64d:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
     652:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     657:	eb 03                	jmp    0x65c
     659:	ff 46 fe             	incw   -0x2(%bp)
     65c:	8b 7e fe             	mov    -0x2(%bp),%di
     65f:	d1 e7                	shl    %di
     661:	d1 e7                	shl    %di
     663:	c7 85 3a 2e 67 01    	movw   $0x167,0x2e3a(%di)
     669:	8b 46 fe             	mov    -0x2(%bp),%ax
     66c:	48                   	dec    %ax
     66d:	b9 38 00             	mov    $0x38,%cx
     670:	f7 e9                	imul   %cx
     672:	40                   	inc    %ax
     673:	8b 7e fe             	mov    -0x2(%bp),%di
     676:	d1 e7                	shl    %di
     678:	d1 e7                	shl    %di
     67a:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     67e:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
     682:	75 d5                	jne    0x659
     684:	c7 46 fe 04 00       	movw   $0x4,-0x2(%bp)
     689:	eb 03                	jmp    0x68e
     68b:	ff 46 fe             	incw   -0x2(%bp)
     68e:	8b 7e fe             	mov    -0x2(%bp),%di
     691:	d1 e7                	shl    %di
     693:	d1 e7                	shl    %di
     695:	c7 85 3a 2e 67 01    	movw   $0x167,0x2e3a(%di)
     69b:	8b 46 fe             	mov    -0x2(%bp),%ax
     69e:	2d 04 00             	sub    $0x4,%ax
     6a1:	b9 38 00             	mov    $0x38,%cx
     6a4:	f7 e9                	imul   %cx
     6a6:	05 a9 00             	add    $0xa9,%ax
     6a9:	8b 7e fe             	mov    -0x2(%bp),%di
     6ac:	d1 e7                	shl    %di
     6ae:	d1 e7                	shl    %di
     6b0:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     6b4:	83 7e fe 06          	cmpw   $0x6,-0x2(%bp)
     6b8:	75 d1                	jne    0x68b
     6ba:	c7 06 56 2e a2 01    	movw   $0x1a2,0x2e56
     6c0:	c7 06 58 2e 01 00    	movw   $0x1,0x2e58
     6c6:	c7 46 fe 08 00       	movw   $0x8,-0x2(%bp)
     6cb:	eb 03                	jmp    0x6d0
     6cd:	ff 46 fe             	incw   -0x2(%bp)
     6d0:	8b 7e fe             	mov    -0x2(%bp),%di
     6d3:	d1 e7                	shl    %di
     6d5:	d1 e7                	shl    %di
     6d7:	c7 85 3a 2e 2c 01    	movw   $0x12c,0x2e3a(%di)
     6dd:	8b 46 fe             	mov    -0x2(%bp),%ax
     6e0:	2d 08 00             	sub    $0x8,%ax
     6e3:	b9 38 00             	mov    $0x38,%cx
     6e6:	f7 e9                	imul   %cx
     6e8:	40                   	inc    %ax
     6e9:	8b 7e fe             	mov    -0x2(%bp),%di
     6ec:	d1 e7                	shl    %di
     6ee:	d1 e7                	shl    %di
     6f0:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     6f4:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
     6f8:	75 d3                	jne    0x6cd
     6fa:	c7 46 fe 0b 00       	movw   $0xb,-0x2(%bp)
     6ff:	eb 03                	jmp    0x704
     701:	ff 46 fe             	incw   -0x2(%bp)
     704:	8b 7e fe             	mov    -0x2(%bp),%di
     707:	d1 e7                	shl    %di
     709:	d1 e7                	shl    %di
     70b:	c7 85 3a 2e 2c 01    	movw   $0x12c,0x2e3a(%di)
     711:	8b 46 fe             	mov    -0x2(%bp),%ax
     714:	2d 0b 00             	sub    $0xb,%ax
     717:	b9 38 00             	mov    $0x38,%cx
     71a:	f7 e9                	imul   %cx
     71c:	05 39 00             	add    $0x39,%ax
     71f:	8b 7e fe             	mov    -0x2(%bp),%di
     722:	d1 e7                	shl    %di
     724:	d1 e7                	shl    %di
     726:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     72a:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
     72e:	75 d1                	jne    0x701
     730:	c7 46 fe 0b 00       	movw   $0xb,-0x2(%bp)
     735:	eb 03                	jmp    0x73a
     737:	ff 46 fe             	incw   -0x2(%bp)
     73a:	8b 7e fe             	mov    -0x2(%bp),%di
     73d:	d1 e7                	shl    %di
     73f:	d1 e7                	shl    %di
     741:	c7 85 3a 2e 2c 01    	movw   $0x12c,0x2e3a(%di)
     747:	8b 46 fe             	mov    -0x2(%bp),%ax
     74a:	2d 0b 00             	sub    $0xb,%ax
     74d:	b9 38 00             	mov    $0x38,%cx
     750:	f7 e9                	imul   %cx
     752:	05 39 00             	add    $0x39,%ax
     755:	8b 7e fe             	mov    -0x2(%bp),%di
     758:	d1 e7                	shl    %di
     75a:	d1 e7                	shl    %di
     75c:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     760:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
     764:	75 d1                	jne    0x737
     766:	c7 06 6e 2e 67 01    	movw   $0x167,0x2e6e
     76c:	c7 06 70 2e 19 01    	movw   $0x119,0x2e70
     772:	c7 06 72 2e a2 01    	movw   $0x1a2,0x2e72
     778:	c7 06 74 2e e1 00    	movw   $0xe1,0x2e74
     77e:	c7 06 76 2e 67 01    	movw   $0x167,0x2e76
     784:	c7 06 78 2e 01 00    	movw   $0x1,0x2e78
     78a:	c7 46 fc 0f 00       	movw   $0xf,-0x4(%bp)
     78f:	8b 46 fc             	mov    -0x4(%bp),%ax
     792:	a3 ce 2f             	mov    %ax,0x2fce
     795:	31 c0                	xor    %ax,%ax
     797:	a3 32 2e             	mov    %ax,0x2e32
     79a:	31 c0                	xor    %ax,%ax
     79c:	a3 34 2e             	mov    %ax,0x2e34
     79f:	c7 06 36 2e c8 00    	movw   $0xc8,0x2e36
     7a5:	c7 06 d0 2f 18 00    	movw   $0x18,0x2fd0
     7ab:	c7 06 d2 2f 5e 00    	movw   $0x5e,0x2fd2
     7b1:	ff 76 fa             	push   -0x6(%bp)
     7b4:	b8 65 00             	mov    $0x65,%ax
     7b7:	50                   	push   %ax
     7b8:	b8 3a 00             	mov    $0x3a,%ax
     7bb:	50                   	push   %ax
     7bc:	b8 37 00             	mov    $0x37,%ax
     7bf:	50                   	push   %ax
     7c0:	ff 76 fa             	push   -0x6(%bp)
     7c3:	b8 65 00             	mov    $0x65,%ax
     7c6:	50                   	push   %ax
     7c7:	b0 00                	mov    $0x0,%al
     7c9:	50                   	push   %ax
     7ca:	b0 01                	mov    $0x1,%al
     7cc:	50                   	push   %ax
     7cd:	b0 01                	mov    $0x1,%al
     7cf:	50                   	push   %ax
     7d0:	b0 02                	mov    $0x2,%al
     7d2:	50                   	push   %ax
     7d3:	b0 00                	mov    $0x0,%al
     7d5:	50                   	push   %ax
     7d6:	b0 01                	mov    $0x1,%al
     7d8:	50                   	push   %ax
     7d9:	9a 5e 03 95 08       	lcall  $0x895,$0x35e
     7de:	c7 06 3e 2e 2c 01    	movw   $0x12c,0x2e3e
     7e4:	c7 06 40 2e a9 00    	movw   $0xa9,0x2e40
     7ea:	c7 06 42 2e 67 01    	movw   $0x167,0x2e42
     7f0:	c7 06 44 2e 01 00    	movw   $0x1,0x2e44
     7f6:	c7 46 fc 02 00       	movw   $0x2,-0x4(%bp)
     7fb:	8b 46 fc             	mov    -0x4(%bp),%ax
     7fe:	a3 ce 2f             	mov    %ax,0x2fce
     801:	31 c0                	xor    %ax,%ax
     803:	a3 32 2e             	mov    %ax,0x2e32
     806:	31 c0                	xor    %ax,%ax
     808:	a3 34 2e             	mov    %ax,0x2e34
     80b:	c7 06 36 2e f4 01    	movw   $0x1f4,0x2e36
     811:	c7 06 d0 2f 18 00    	movw   $0x18,0x2fd0
     817:	c7 06 d2 2f 5e 00    	movw   $0x5e,0x2fd2
     81d:	ff 76 fa             	push   -0x6(%bp)
     820:	b8 65 00             	mov    $0x65,%ax
     823:	50                   	push   %ax
     824:	b8 3a 00             	mov    $0x3a,%ax
     827:	50                   	push   %ax
     828:	b8 37 00             	mov    $0x37,%ax
     82b:	50                   	push   %ax
     82c:	ff 76 fa             	push   -0x6(%bp)
     82f:	b8 65 00             	mov    $0x65,%ax
     832:	50                   	push   %ax
     833:	b0 00                	mov    $0x0,%al
     835:	50                   	push   %ax
     836:	b0 01                	mov    $0x1,%al
     838:	50                   	push   %ax
     839:	b0 01                	mov    $0x1,%al
     83b:	50                   	push   %ax
     83c:	b0 02                	mov    $0x2,%al
     83e:	50                   	push   %ax
     83f:	b0 00                	mov    $0x0,%al
     841:	50                   	push   %ax
     842:	b0 01                	mov    $0x1,%al
     844:	50                   	push   %ax
     845:	9a 5e 03 95 08       	lcall  $0x895,$0x35e
     84a:	ff 36 ec 2f          	push   0x2fec
     84e:	ff 36 ea 2f          	push   0x2fea
     852:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
     857:	89 ec                	mov    %bp,%sp
     859:	5d                   	pop    %bp
     85a:	ca 02 00             	lret   $0x2
     85d:	55                   	push   %bp
     85e:	89 e5                	mov    %sp,%bp
     860:	83 ec 14             	sub    $0x14,%sp
     863:	c7 06 ce 2f 03 00    	movw   $0x3,0x2fce
     869:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     86e:	eb 03                	jmp    0x873
     870:	ff 46 fe             	incw   -0x2(%bp)
     873:	8b 7e fe             	mov    -0x2(%bp),%di
     876:	d1 e7                	shl    %di
     878:	d1 e7                	shl    %di
     87a:	c7 85 3a 2e 0a 00    	movw   $0xa,0x2e3a(%di)
     880:	8b 46 fe             	mov    -0x2(%bp),%ax
     883:	48                   	dec    %ax
     884:	b9 0c 00             	mov    $0xc,%cx
     887:	f7 e9                	imul   %cx
     889:	05 dc 00             	add    $0xdc,%ax
     88c:	8b 7e fe             	mov    -0x2(%bp),%di
     88f:	d1 e7                	shl    %di
     891:	d1 e7                	shl    %di
     893:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     897:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
     89b:	75 d3                	jne    0x870
     89d:	31 c0                	xor    %ax,%ax
     89f:	a3 36 2e             	mov    %ax,0x2e36
     8a2:	c7 06 32 2e 18 00    	movw   $0x18,0x2e32
     8a8:	31 c0                	xor    %ax,%ax
     8aa:	a3 34 2e             	mov    %ax,0x2e34
     8ad:	ff 76 0c             	push   0xc(%bp)
     8b0:	ff 76 0a             	push   0xa(%bp)
     8b3:	b8 1c 00             	mov    $0x1c,%ax
     8b6:	50                   	push   %ax
     8b7:	b8 0b 00             	mov    $0xb,%ax
     8ba:	50                   	push   %ax
     8bb:	ff 76 08             	push   0x8(%bp)
     8be:	ff 76 0a             	push   0xa(%bp)
     8c1:	b0 02                	mov    $0x2,%al
     8c3:	50                   	push   %ax
     8c4:	b0 01                	mov    $0x1,%al
     8c6:	50                   	push   %ax
     8c7:	b0 00                	mov    $0x0,%al
     8c9:	50                   	push   %ax
     8ca:	b0 02                	mov    $0x2,%al
     8cc:	50                   	push   %ax
     8cd:	b0 00                	mov    $0x0,%al
     8cf:	50                   	push   %ax
     8d0:	b0 01                	mov    $0x1,%al
     8d2:	50                   	push   %ax
     8d3:	9a 5e 03 95 08       	lcall  $0x895,$0x35e
     8d8:	c7 06 d4 2f 1c 00    	movw   $0x1c,0x2fd4
     8de:	c7 06 d6 2f 0b 00    	movw   $0xb,0x2fd6
     8e4:	c6 06 d8 2f 01       	movb   $0x1,0x2fd8
     8e9:	c7 06 ce 2f 03 00    	movw   $0x3,0x2fce
     8ef:	a1 da 2f             	mov    0x2fda,%ax
     8f2:	3d 02 00             	cmp    $0x2,%ax
     8f5:	75 1a                	jne    0x911
     8f7:	a1 40 2e             	mov    0x2e40,%ax
     8fa:	89 46 fc             	mov    %ax,-0x4(%bp)
     8fd:	a1 44 2e             	mov    0x2e44,%ax
     900:	a3 40 2e             	mov    %ax,0x2e40
     903:	a1 48 2e             	mov    0x2e48,%ax
     906:	a3 44 2e             	mov    %ax,0x2e44
     909:	8b 46 fc             	mov    -0x4(%bp),%ax
     90c:	a3 48 2e             	mov    %ax,0x2e48
     90f:	eb 1d                	jmp    0x92e
     911:	3d 03 00             	cmp    $0x3,%ax
     914:	75 18                	jne    0x92e
     916:	a1 40 2e             	mov    0x2e40,%ax
     919:	89 46 fc             	mov    %ax,-0x4(%bp)
     91c:	a1 48 2e             	mov    0x2e48,%ax
     91f:	a3 40 2e             	mov    %ax,0x2e40
     922:	a1 44 2e             	mov    0x2e44,%ax
     925:	a3 48 2e             	mov    %ax,0x2e48
     928:	8b 46 fc             	mov    -0x4(%bp),%ax
     92b:	a3 44 2e             	mov    %ax,0x2e44
     92e:	31 c0                	xor    %ax,%ax
     930:	a3 36 2e             	mov    %ax,0x2e36
     933:	c7 06 e8 3c 14 00    	movw   $0x14,0x3ce8
     939:	8b 46 0c             	mov    0xc(%bp),%ax
     93c:	3b 46 08             	cmp    0x8(%bp),%ax
     93f:	73 14                	jae    0x955
     941:	8b 46 08             	mov    0x8(%bp),%ax
     944:	05 3c 00             	add    $0x3c,%ax
     947:	89 46 f2             	mov    %ax,-0xe(%bp)
     94a:	8b 46 08             	mov    0x8(%bp),%ax
     94d:	05 1e 00             	add    $0x1e,%ax
     950:	89 46 fa             	mov    %ax,-0x6(%bp)
     953:	eb 18                	jmp    0x96d
     955:	8b 46 08             	mov    0x8(%bp),%ax
     958:	2d 3c 00             	sub    $0x3c,%ax
     95b:	2d 1e 00             	sub    $0x1e,%ax
     95e:	89 46 f2             	mov    %ax,-0xe(%bp)
     961:	8b 46 08             	mov    0x8(%bp),%ax
     964:	2d 1e 00             	sub    $0x1e,%ax
     967:	2d 0f 00             	sub    $0xf,%ax
     96a:	89 46 fa             	mov    %ax,-0x6(%bp)
     96d:	8b 46 0a             	mov    0xa(%bp),%ax
     970:	03 46 06             	add    0x6(%bp),%ax
     973:	31 d2                	xor    %dx,%dx
     975:	b9 02 00             	mov    $0x2,%cx
     978:	f7 f1                	div    %cx
     97a:	89 46 f0             	mov    %ax,-0x10(%bp)
     97d:	8b 46 0a             	mov    0xa(%bp),%ax
     980:	31 d2                	xor    %dx,%dx
     982:	8b c8                	mov    %ax,%cx
     984:	8b da                	mov    %dx,%bx
     986:	8b 46 f0             	mov    -0x10(%bp),%ax
     989:	99                   	cwtd
     98a:	2b c1                	sub    %cx,%ax
     98c:	1b d3                	sbb    %bx,%dx
     98e:	b9 02 00             	mov    $0x2,%cx
     991:	31 db                	xor    %bx,%bx
     993:	9a 94 02 ce 1d       	lcall  $0x1dce,$0x294
     998:	52                   	push   %dx
     999:	50                   	push   %ax
     99a:	8b 46 f0             	mov    -0x10(%bp),%ax
     99d:	99                   	cwtd
     99e:	8b c8                	mov    %ax,%cx
     9a0:	8b da                	mov    %dx,%bx
     9a2:	8b 46 0a             	mov    0xa(%bp),%ax
     9a5:	31 d2                	xor    %dx,%dx
     9a7:	03 c1                	add    %cx,%ax
     9a9:	13 d3                	adc    %bx,%dx
     9ab:	b9 02 00             	mov    $0x2,%cx
     9ae:	31 db                	xor    %bx,%bx
     9b0:	9a 94 02 ce 1d       	lcall  $0x1dce,$0x294
     9b5:	59                   	pop    %cx
     9b6:	5b                   	pop    %bx
     9b7:	2b c1                	sub    %cx,%ax
     9b9:	1b d3                	sbb    %bx,%dx
     9bb:	89 46 f8             	mov    %ax,-0x8(%bp)
     9be:	8b 46 0a             	mov    0xa(%bp),%ax
     9c1:	3b 46 06             	cmp    0x6(%bp),%ax
     9c4:	73 09                	jae    0x9cf
     9c6:	8b 46 f8             	mov    -0x8(%bp),%ax
     9c9:	40                   	inc    %ax
     9ca:	89 46 f8             	mov    %ax,-0x8(%bp)
     9cd:	eb 07                	jmp    0x9d6
     9cf:	8b 46 f8             	mov    -0x8(%bp),%ax
     9d2:	48                   	dec    %ax
     9d3:	89 46 f8             	mov    %ax,-0x8(%bp)
     9d6:	b0 00                	mov    $0x0,%al
     9d8:	50                   	push   %ax
     9d9:	b0 00                	mov    $0x0,%al
     9db:	50                   	push   %ax
     9dc:	ff 76 08             	push   0x8(%bp)
     9df:	ff 76 0a             	push   0xa(%bp)
     9e2:	ff 76 fa             	push   -0x6(%bp)
     9e5:	ff 76 f8             	push   -0x8(%bp)
     9e8:	ff 76 f2             	push   -0xe(%bp)
     9eb:	ff 76 f0             	push   -0x10(%bp)
     9ee:	ff 36 e8 3c          	push   0x3ce8
     9f2:	b0 02                	mov    $0x2,%al
     9f4:	50                   	push   %ax
     9f5:	b0 00                	mov    $0x0,%al
     9f7:	50                   	push   %ax
     9f8:	b0 01                	mov    $0x1,%al
     9fa:	50                   	push   %ax
     9fb:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     a00:	c7 06 d4 2f 1c 00    	movw   $0x1c,0x2fd4
     a06:	c7 06 d6 2f 0b 00    	movw   $0xb,0x2fd6
     a0c:	c6 06 d8 2f 01       	movb   $0x1,0x2fd8
     a11:	c7 06 ce 2f 03 00    	movw   $0x3,0x2fce
     a17:	a1 da 2f             	mov    0x2fda,%ax
     a1a:	3d 02 00             	cmp    $0x2,%ax
     a1d:	75 1a                	jne    0xa39
     a1f:	a1 40 2e             	mov    0x2e40,%ax
     a22:	89 46 fc             	mov    %ax,-0x4(%bp)
     a25:	a1 44 2e             	mov    0x2e44,%ax
     a28:	a3 40 2e             	mov    %ax,0x2e40
     a2b:	a1 48 2e             	mov    0x2e48,%ax
     a2e:	a3 44 2e             	mov    %ax,0x2e44
     a31:	8b 46 fc             	mov    -0x4(%bp),%ax
     a34:	a3 48 2e             	mov    %ax,0x2e48
     a37:	eb 1d                	jmp    0xa56
     a39:	3d 03 00             	cmp    $0x3,%ax
     a3c:	75 18                	jne    0xa56
     a3e:	a1 40 2e             	mov    0x2e40,%ax
     a41:	89 46 fc             	mov    %ax,-0x4(%bp)
     a44:	a1 48 2e             	mov    0x2e48,%ax
     a47:	a3 40 2e             	mov    %ax,0x2e40
     a4a:	a1 44 2e             	mov    0x2e44,%ax
     a4d:	a3 48 2e             	mov    %ax,0x2e48
     a50:	8b 46 fc             	mov    -0x4(%bp),%ax
     a53:	a3 44 2e             	mov    %ax,0x2e44
     a56:	31 c0                	xor    %ax,%ax
     a58:	a3 36 2e             	mov    %ax,0x2e36
     a5b:	c7 06 e8 3c 14 00    	movw   $0x14,0x3ce8
     a61:	8b 46 0c             	mov    0xc(%bp),%ax
     a64:	3b 46 08             	cmp    0x8(%bp),%ax
     a67:	73 14                	jae    0xa7d
     a69:	8b 46 08             	mov    0x8(%bp),%ax
     a6c:	05 3c 00             	add    $0x3c,%ax
     a6f:	89 46 f6             	mov    %ax,-0xa(%bp)
     a72:	8b 46 08             	mov    0x8(%bp),%ax
     a75:	05 1e 00             	add    $0x1e,%ax
     a78:	89 46 fa             	mov    %ax,-0x6(%bp)
     a7b:	eb 18                	jmp    0xa95
     a7d:	8b 46 08             	mov    0x8(%bp),%ax
     a80:	2d 3c 00             	sub    $0x3c,%ax
     a83:	2d 1e 00             	sub    $0x1e,%ax
     a86:	89 46 f6             	mov    %ax,-0xa(%bp)
     a89:	8b 46 08             	mov    0x8(%bp),%ax
     a8c:	2d 1e 00             	sub    $0x1e,%ax
     a8f:	2d 0f 00             	sub    $0xf,%ax
     a92:	89 46 fa             	mov    %ax,-0x6(%bp)
     a95:	8b 46 0a             	mov    0xa(%bp),%ax
     a98:	03 46 06             	add    0x6(%bp),%ax
     a9b:	31 d2                	xor    %dx,%dx
     a9d:	b9 02 00             	mov    $0x2,%cx
     aa0:	f7 f1                	div    %cx
     aa2:	89 46 f4             	mov    %ax,-0xc(%bp)
     aa5:	8b 46 f4             	mov    -0xc(%bp),%ax
     aa8:	99                   	cwtd
     aa9:	8b c8                	mov    %ax,%cx
     aab:	8b da                	mov    %dx,%bx
     aad:	8b 46 06             	mov    0x6(%bp),%ax
     ab0:	31 d2                	xor    %dx,%dx
     ab2:	2b c1                	sub    %cx,%ax
     ab4:	1b d3                	sbb    %bx,%dx
     ab6:	b9 02 00             	mov    $0x2,%cx
     ab9:	31 db                	xor    %bx,%bx
     abb:	9a 94 02 ce 1d       	lcall  $0x1dce,$0x294
     ac0:	52                   	push   %dx
     ac1:	50                   	push   %ax
     ac2:	8b 46 06             	mov    0x6(%bp),%ax
     ac5:	31 d2                	xor    %dx,%dx
     ac7:	8b c8                	mov    %ax,%cx
     ac9:	8b da                	mov    %dx,%bx
     acb:	8b 46 f4             	mov    -0xc(%bp),%ax
     ace:	99                   	cwtd
     acf:	03 c1                	add    %cx,%ax
     ad1:	13 d3                	adc    %bx,%dx
     ad3:	b9 02 00             	mov    $0x2,%cx
     ad6:	31 db                	xor    %bx,%bx
     ad8:	9a 94 02 ce 1d       	lcall  $0x1dce,$0x294
     add:	59                   	pop    %cx
     ade:	5b                   	pop    %bx
     adf:	03 c1                	add    %cx,%ax
     ae1:	13 d3                	adc    %bx,%dx
     ae3:	89 46 f8             	mov    %ax,-0x8(%bp)
     ae6:	b0 00                	mov    $0x0,%al
     ae8:	50                   	push   %ax
     ae9:	b0 00                	mov    $0x0,%al
     aeb:	50                   	push   %ax
     aec:	ff 76 f6             	push   -0xa(%bp)
     aef:	ff 76 f4             	push   -0xc(%bp)
     af2:	ff 76 fa             	push   -0x6(%bp)
     af5:	ff 76 f8             	push   -0x8(%bp)
     af8:	ff 76 08             	push   0x8(%bp)
     afb:	ff 76 06             	push   0x6(%bp)
     afe:	ff 36 e8 3c          	push   0x3ce8
     b02:	b0 02                	mov    $0x2,%al
     b04:	50                   	push   %ax
     b05:	b0 00                	mov    $0x0,%al
     b07:	50                   	push   %ax
     b08:	b0 01                	mov    $0x1,%al
     b0a:	50                   	push   %ax
     b0b:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     b10:	89 ec                	mov    %bp,%sp
     b12:	5d                   	pop    %bp
     b13:	ca 08 00             	lret   $0x8
     b16:	55                   	push   %bp
     b17:	89 e5                	mov    %sp,%bp
     b19:	83 ec 08             	sub    $0x8,%sp
     b1c:	c7 06 e8 3c 14 00    	movw   $0x14,0x3ce8
     b22:	8a 46 06             	mov    0x6(%bp),%al
     b25:	30 e4                	xor    %ah,%ah
     b27:	3d 01 00             	cmp    $0x1,%ax
     b2a:	74 08                	je     0xb34
     b2c:	3d 02 00             	cmp    $0x2,%ax
     b2f:	74 03                	je     0xb34
     b31:	e9 94 00             	jmp    0xbc8
     b34:	c7 06 d4 2f 09 00    	movw   $0x9,0x2fd4
     b3a:	c7 06 d6 2f 07 00    	movw   $0x7,0x2fd6
     b40:	c6 06 d8 2f 02       	movb   $0x2,0x2fd8
     b45:	c7 06 ce 2f 01 00    	movw   $0x1,0x2fce
     b4b:	c7 06 3e 2e 61 00    	movw   $0x61,0x2e3e
     b51:	c7 06 40 2e 4e 01    	movw   $0x14e,0x2e40
     b57:	c7 06 36 2e 05 00    	movw   $0x5,0x2e36
     b5d:	80 7e 06 01          	cmpb   $0x1,0x6(%bp)
     b61:	75 32                	jne    0xb95
     b63:	b0 01                	mov    $0x1,%al
     b65:	50                   	push   %ax
     b66:	b0 00                	mov    $0x0,%al
     b68:	50                   	push   %ax
     b69:	b8 57 00             	mov    $0x57,%ax
     b6c:	50                   	push   %ax
     b6d:	b8 69 00             	mov    $0x69,%ax
     b70:	50                   	push   %ax
     b71:	b8 bf 00             	mov    $0xbf,%ax
     b74:	50                   	push   %ax
     b75:	b8 3d 00             	mov    $0x3d,%ax
     b78:	50                   	push   %ax
     b79:	b8 34 01             	mov    $0x134,%ax
     b7c:	50                   	push   %ax
     b7d:	b8 3c 00             	mov    $0x3c,%ax
     b80:	50                   	push   %ax
     b81:	ff 36 e8 3c          	push   0x3ce8
     b85:	b0 02                	mov    $0x2,%al
     b87:	50                   	push   %ax
     b88:	b0 00                	mov    $0x0,%al
     b8a:	50                   	push   %ax
     b8b:	b0 01                	mov    $0x1,%al
     b8d:	50                   	push   %ax
     b8e:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     b93:	eb 30                	jmp    0xbc5
     b95:	b0 01                	mov    $0x1,%al
     b97:	50                   	push   %ax
     b98:	b0 00                	mov    $0x0,%al
     b9a:	50                   	push   %ax
     b9b:	b8 1e 02             	mov    $0x21e,%ax
     b9e:	50                   	push   %ax
     b9f:	b8 75 00             	mov    $0x75,%ax
     ba2:	50                   	push   %ax
     ba3:	b8 cd 01             	mov    $0x1cd,%ax
     ba6:	50                   	push   %ax
     ba7:	b8 53 00             	mov    $0x53,%ax
     baa:	50                   	push   %ax
     bab:	b8 47 01             	mov    $0x147,%ax
     bae:	50                   	push   %ax
     baf:	b8 3c 00             	mov    $0x3c,%ax
     bb2:	50                   	push   %ax
     bb3:	ff 36 e8 3c          	push   0x3ce8
     bb7:	b0 02                	mov    $0x2,%al
     bb9:	50                   	push   %ax
     bba:	b0 00                	mov    $0x0,%al
     bbc:	50                   	push   %ax
     bbd:	b0 01                	mov    $0x1,%al
     bbf:	50                   	push   %ax
     bc0:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     bc5:	e9 1a 01             	jmp    0xce2
     bc8:	3d 03 00             	cmp    $0x3,%ax
     bcb:	74 03                	je     0xbd0
     bcd:	e9 12 01             	jmp    0xce2
     bd0:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
     bd5:	eb 03                	jmp    0xbda
     bd7:	ff 46 f8             	incw   -0x8(%bp)
     bda:	c7 06 ce 2f 01 00    	movw   $0x1,0x2fce
     be0:	c7 06 3e 2e 55 00    	movw   $0x55,0x2e3e
     be6:	8b 46 f8             	mov    -0x8(%bp),%ax
     be9:	48                   	dec    %ax
     bea:	b9 18 00             	mov    $0x18,%cx
     bed:	f7 e9                	imul   %cx
     bef:	05 ce 00             	add    $0xce,%ax
     bf2:	a3 40 2e             	mov    %ax,0x2e40
     bf5:	31 c0                	xor    %ax,%ax
     bf7:	a3 32 2e             	mov    %ax,0x2e32
     bfa:	c7 06 34 2e 0f 00    	movw   $0xf,0x2e34
     c00:	8b 46 f8             	mov    -0x8(%bp),%ax
     c03:	48                   	dec    %ax
     c04:	8b d8                	mov    %ax,%bx
     c06:	a1 34 2e             	mov    0x2e34,%ax
     c09:	b9 03 00             	mov    $0x3,%cx
     c0c:	f7 e9                	imul   %cx
     c0e:	f7 eb                	imul   %bx
     c10:	8b d0                	mov    %ax,%dx
     c12:	b8 43 01             	mov    $0x143,%ax
     c15:	2b c2                	sub    %dx,%ax
     c17:	89 46 fe             	mov    %ax,-0x2(%bp)
     c1a:	83 7e f8 06          	cmpw   $0x6,-0x8(%bp)
     c1e:	74 11                	je     0xc31
     c20:	a1 34 2e             	mov    0x2e34,%ax
     c23:	d1 e0                	shl    %ax
     c25:	8b d0                	mov    %ax,%dx
     c27:	8b 46 fe             	mov    -0x2(%bp),%ax
     c2a:	2b c2                	sub    %dx,%ax
     c2c:	89 46 fc             	mov    %ax,-0x4(%bp)
     c2f:	eb 05                	jmp    0xc36
     c31:	c7 46 fc 44 00       	movw   $0x44,-0x4(%bp)
     c36:	83 7e f8 01          	cmpw   $0x1,-0x8(%bp)
     c3a:	75 06                	jne    0xc42
     c3c:	c6 46 fb 02          	movb   $0x2,-0x5(%bp)
     c40:	eb 04                	jmp    0xc46
     c42:	c6 46 fb 01          	movb   $0x1,-0x5(%bp)
     c46:	c7 06 36 2e 0a 00    	movw   $0xa,0x2e36
     c4c:	b8 44 01             	mov    $0x144,%ax
     c4f:	50                   	push   %ax
     c50:	ff 76 fe             	push   -0x2(%bp)
     c53:	b8 20 00             	mov    $0x20,%ax
     c56:	50                   	push   %ax
     c57:	b8 17 00             	mov    $0x17,%ax
     c5a:	50                   	push   %ax
     c5b:	b8 44 01             	mov    $0x144,%ax
     c5e:	50                   	push   %ax
     c5f:	ff 76 fc             	push   -0x4(%bp)
     c62:	8a 46 fb             	mov    -0x5(%bp),%al
     c65:	50                   	push   %ax
     c66:	b0 01                	mov    $0x1,%al
     c68:	50                   	push   %ax
     c69:	b0 01                	mov    $0x1,%al
     c6b:	50                   	push   %ax
     c6c:	b0 02                	mov    $0x2,%al
     c6e:	50                   	push   %ax
     c6f:	b0 00                	mov    $0x0,%al
     c71:	50                   	push   %ax
     c72:	b0 01                	mov    $0x1,%al
     c74:	50                   	push   %ax
     c75:	9a 5e 03 95 08       	lcall  $0x895,$0x35e
     c7a:	83 7e f8 06          	cmpw   $0x6,-0x8(%bp)
     c7e:	74 03                	je     0xc83
     c80:	e9 54 ff             	jmp    0xbd7
     c83:	c7 06 d4 2f 20 00    	movw   $0x20,0x2fd4
     c89:	c7 06 d6 2f 17 00    	movw   $0x17,0x2fd6
     c8f:	c6 06 d8 2f 01       	movb   $0x1,0x2fd8
     c94:	c7 06 ce 2f 01 00    	movw   $0x1,0x2fce
     c9a:	c7 06 3e 2e 55 00    	movw   $0x55,0x2e3e
     ca0:	c7 06 40 2e 46 01    	movw   $0x146,0x2e40
     ca6:	c7 06 36 2e 05 00    	movw   $0x5,0x2e36
     cac:	c7 06 e8 3c 0f 00    	movw   $0xf,0x3ce8
     cb2:	b0 01                	mov    $0x1,%al
     cb4:	50                   	push   %ax
     cb5:	b0 00                	mov    $0x0,%al
     cb7:	50                   	push   %ax
     cb8:	b8 44 01             	mov    $0x144,%ax
     cbb:	50                   	push   %ax
     cbc:	b8 35 00             	mov    $0x35,%ax
     cbf:	50                   	push   %ax
     cc0:	b8 3a 01             	mov    $0x13a,%ax
     cc3:	50                   	push   %ax
     cc4:	b8 21 00             	mov    $0x21,%ax
     cc7:	50                   	push   %ax
     cc8:	b8 30 01             	mov    $0x130,%ax
     ccb:	50                   	push   %ax
     ccc:	b8 35 00             	mov    $0x35,%ax
     ccf:	50                   	push   %ax
     cd0:	ff 36 e8 3c          	push   0x3ce8
     cd4:	b0 02                	mov    $0x2,%al
     cd6:	50                   	push   %ax
     cd7:	b0 00                	mov    $0x0,%al
     cd9:	50                   	push   %ax
     cda:	b0 01                	mov    $0x1,%al
     cdc:	50                   	push   %ax
     cdd:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     ce2:	89 ec                	mov    %bp,%sp
     ce4:	5d                   	pop    %bp
     ce5:	ca 02 00             	lret   $0x2
     ce8:	55                   	push   %bp
     ce9:	89 e5                	mov    %sp,%bp
     ceb:	83 ec 08             	sub    $0x8,%sp
     cee:	c7 06 36 2e 05 00    	movw   $0x5,0x2e36
     cf4:	c7 06 e8 3c 14 00    	movw   $0x14,0x3ce8
     cfa:	c7 06 d4 2f 10 00    	movw   $0x10,0x2fd4
     d00:	c7 06 d6 2f 0e 00    	movw   $0xe,0x2fd6
     d06:	c6 06 d8 2f 02       	movb   $0x2,0x2fd8
     d0b:	c7 06 ce 2f 02 00    	movw   $0x2,0x2fce
     d11:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
     d16:	eb 03                	jmp    0xd1b
     d18:	ff 46 f8             	incw   -0x8(%bp)
     d1b:	8b 7e f8             	mov    -0x8(%bp),%di
     d1e:	d1 e7                	shl    %di
     d20:	d1 e7                	shl    %di
     d22:	c7 85 3a 2e 5c 00    	movw   $0x5c,0x2e3a(%di)
     d28:	8b 46 f8             	mov    -0x8(%bp),%ax
     d2b:	48                   	dec    %ax
     d2c:	b9 0f 00             	mov    $0xf,%cx
     d2f:	f7 e9                	imul   %cx
     d31:	05 b0 00             	add    $0xb0,%ax
     d34:	8b 7e f8             	mov    -0x8(%bp),%di
     d37:	d1 e7                	shl    %di
     d39:	d1 e7                	shl    %di
     d3b:	89 85 3c 2e          	mov    %ax,0x2e3c(%di)
     d3f:	83 7e f8 02          	cmpw   $0x2,-0x8(%bp)
     d43:	75 d3                	jne    0xd18
     d45:	31 c0                	xor    %ax,%ax
     d47:	a3 32 2e             	mov    %ax,0x2e32
     d4a:	c7 06 34 2e 0f 00    	movw   $0xf,0x2e34
     d50:	8a 46 06             	mov    0x6(%bp),%al
     d53:	30 e4                	xor    %ah,%ah
     d55:	3d 01 00             	cmp    $0x1,%ax
     d58:	75 33                	jne    0xd8d
     d5a:	b0 01                	mov    $0x1,%al
     d5c:	50                   	push   %ax
     d5d:	b0 00                	mov    $0x0,%al
     d5f:	50                   	push   %ax
     d60:	b8 0a 01             	mov    $0x10a,%ax
     d63:	50                   	push   %ax
     d64:	b8 0d 00             	mov    $0xd,%ax
     d67:	50                   	push   %ax
     d68:	b8 95 00             	mov    $0x95,%ax
     d6b:	50                   	push   %ax
     d6c:	b8 2b 00             	mov    $0x2b,%ax
     d6f:	50                   	push   %ax
     d70:	b8 39 00             	mov    $0x39,%ax
     d73:	50                   	push   %ax
     d74:	b8 75 00             	mov    $0x75,%ax
     d77:	50                   	push   %ax
     d78:	ff 36 e8 3c          	push   0x3ce8
     d7c:	b0 02                	mov    $0x2,%al
     d7e:	50                   	push   %ax
     d7f:	b0 00                	mov    $0x0,%al
     d81:	50                   	push   %ax
     d82:	b0 01                	mov    $0x1,%al
     d84:	50                   	push   %ax
     d85:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     d8a:	e9 04 01             	jmp    0xe91
     d8d:	3d 02 00             	cmp    $0x2,%ax
     d90:	75 33                	jne    0xdc5
     d92:	b0 01                	mov    $0x1,%al
     d94:	50                   	push   %ax
     d95:	b0 00                	mov    $0x0,%al
     d97:	50                   	push   %ax
     d98:	b8 4b 01             	mov    $0x14b,%ax
     d9b:	50                   	push   %ax
     d9c:	b8 35 00             	mov    $0x35,%ax
     d9f:	50                   	push   %ax
     da0:	b8 a6 01             	mov    $0x1a6,%ax
     da3:	50                   	push   %ax
     da4:	b8 1c 00             	mov    $0x1c,%ax
     da7:	50                   	push   %ax
     da8:	b8 34 02             	mov    $0x234,%ax
     dab:	50                   	push   %ax
     dac:	b8 75 00             	mov    $0x75,%ax
     daf:	50                   	push   %ax
     db0:	ff 36 e8 3c          	push   0x3ce8
     db4:	b0 02                	mov    $0x2,%al
     db6:	50                   	push   %ax
     db7:	b0 00                	mov    $0x0,%al
     db9:	50                   	push   %ax
     dba:	b0 01                	mov    $0x1,%al
     dbc:	50                   	push   %ax
     dbd:	9a 78 11 95 08       	lcall  $0x895,$0x1178
     dc2:	e9 cc 00             	jmp    0xe91
     dc5:	3d 03 00             	cmp    $0x3,%ax
     dc8:	74 03                	je     0xdcd
     dca:	e9 c4 00             	jmp    0xe91
     dcd:	c7 06 ce 2f 0f 00    	movw   $0xf,0x2fce
     dd3:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
     dd8:	eb 03                	jmp    0xddd
     dda:	ff 46 f8             	incw   -0x8(%bp)
     ddd:	8b 7e f8             	mov    -0x8(%bp),%di
     de0:	d1 e7                	shl    %di
     de2:	d1 e7                	shl    %di
     de4:	c7 85 3a 2e 2f 00    	movw   $0x2f,0x2e3a(%di)
     dea:	8b 7e f8             	mov    -0x8(%bp),%di
     ded:	d1 e7                	shl    %di
     def:	d1 e7                	shl    %di
     df1:	c7 85 3c 2e bb 00    	movw   $0xbb,0x2e3c(%di)
     df7:	83 7e f8 05          	cmpw   $0x5,-0x8(%bp)
     dfb:	75 dd                	jne    0xdda
     dfd:	c7 46 f8 06 00       	movw   $0x6,-0x8(%bp)
     e02:	eb 03                	jmp    0xe07
     e04:	ff 46 f8             	incw   -0x8(%bp)
     e07:	8b 7e f8             	mov    -0x8(%bp),%di
     e0a:	d1 e7                	shl    %di
     e0c:	d1 e7                	shl    %di
     e0e:	c7 85 3a 2e 2f 00    	movw   $0x2f,0x2e3a(%di)
     e14:	8b 7e f8             	mov    -0x8(%bp),%di
     e17:	d1 e7                	shl    %di
     e19:	d1 e7                	shl    %di
     e1b:	c7 85 3c 2e d2 00    	movw   $0xd2,0x2e3c(%di)
     e21:	83 7e f8 0a          	cmpw   $0xa,-0x8(%bp)
     e25:	75 dd                	jne    0xe04
     e27:	c7 46 f8 0b 00       	movw   $0xb,-0x8(%bp)
     e2c:	eb 03                	jmp    0xe31
     e2e:	ff 46 f8             	incw   -0x8(%bp)
     e31:	8b 7e f8             	mov    -0x8(%bp),%di
     e34:	d1 e7                	shl    %di
     e36:	d1 e7                	shl    %di
     e38:	c7 85 3a 2e 2f 00    	movw   $0x2f,0x2e3a(%di)
     e3e:	8b 7e f8             	mov    -0x8(%bp),%di
     e41:	d1 e7                	shl    %di
     e43:	d1 e7                	shl    %di
     e45:	c7 85 3c 2e e9 00    	movw   $0xe9,0x2e3c(%di)
     e4b:	83 7e f8 0f          	cmpw   $0xf,-0x8(%bp)
     e4f:	75 dd                	jne    0xe2e
     e51:	31 c0                	xor    %ax,%ax
     e53:	a3 32 2e             	mov    %ax,0x2e32
     e56:	c7 06 34 2e 0f 00    	movw   $0xf,0x2e34
     e5c:	c7 06 36 2e 0a 00    	movw   $0xa,0x2e36
     e62:	b8 32 01             	mov    $0x132,%ax
     e65:	50                   	push   %ax
     e66:	b8 4d 00             	mov    $0x4d,%ax
     e69:	50                   	push   %ax
     e6a:	b8 1d 00             	mov    $0x1d,%ax
     e6d:	50                   	push   %ax
     e6e:	b8 16 00             	mov    $0x16,%ax
     e71:	50                   	push   %ax
     e72:	b8 32 01             	mov    $0x132,%ax
     e75:	50                   	push   %ax
     e76:	b8 2f 01             	mov    $0x12f,%ax
     e79:	50                   	push   %ax
     e7a:	b0 02                	mov    $0x2,%al
     e7c:	50                   	push   %ax
     e7d:	b0 01                	mov    $0x1,%al
     e7f:	50                   	push   %ax
     e80:	b0 00                	mov    $0x0,%al
     e82:	50                   	push   %ax
     e83:	b0 02                	mov    $0x2,%al
     e85:	50                   	push   %ax
     e86:	b0 00                	mov    $0x0,%al
     e88:	50                   	push   %ax
     e89:	b0 01                	mov    $0x1,%al
     e8b:	50                   	push   %ax
     e8c:	9a 5e 03 95 08       	lcall  $0x895,$0x35e
     e91:	89 ec                	mov    %bp,%sp
     e93:	5d                   	pop    %bp
     e94:	ca 02 00             	lret   $0x2
     e97:	55                   	push   %bp
     e98:	89 e5                	mov    %sp,%bp
     e9a:	81 ec 1e 01          	sub    $0x11e,%sp
     e9e:	c7 46 fc 0b 00       	movw   $0xb,-0x4(%bp)
     ea3:	80 3e f6 2f 01       	cmpb   $0x1,0x2ff6
     ea8:	74 03                	je     0xead
     eaa:	e9 91 00             	jmp    0xf3e
     ead:	c7 46 84 d1 00       	movw   $0xd1,-0x7c(%bp)
     eb2:	c7 86 5c ff 29 00    	movw   $0x29,-0xa4(%bp)
     eb8:	c7 46 86 dd 01       	movw   $0x1dd,-0x7a(%bp)
     ebd:	c7 86 5e ff 4d 00    	movw   $0x4d,-0xa2(%bp)
     ec3:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     ec8:	eb 03                	jmp    0xecd
     eca:	ff 46 fe             	incw   -0x2(%bp)
     ecd:	8b 46 fe             	mov    -0x2(%bp),%ax
     ed0:	d1 e0                	shl    %ax
     ed2:	40                   	inc    %ax
     ed3:	8b f8                	mov    %ax,%di
     ed5:	d1 e7                	shl    %di
     ed7:	c7 43 82 c0 00       	movw   $0xc0,-0x7e(%bp,%di)
     edc:	8b 46 fe             	mov    -0x2(%bp),%ax
     edf:	d1 e0                	shl    %ax
     ee1:	40                   	inc    %ax
     ee2:	8b f8                	mov    %ax,%di
     ee4:	d1 e7                	shl    %di
     ee6:	c7 83 5a ff 29 00    	movw   $0x29,-0xa6(%bp,%di)
     eec:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
     ef0:	75 d8                	jne    0xeca
     ef2:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     ef7:	eb 03                	jmp    0xefc
     ef9:	ff 46 fe             	incw   -0x2(%bp)
     efc:	8b 46 fe             	mov    -0x2(%bp),%ax
     eff:	d1 e0                	shl    %ax
     f01:	05 02 00             	add    $0x2,%ax
     f04:	8b f8                	mov    %ax,%di
     f06:	d1 e7                	shl    %di
     f08:	c7 43 82 c0 00       	movw   $0xc0,-0x7e(%bp,%di)
     f0d:	8b 46 fe             	mov    -0x2(%bp),%ax
     f10:	d1 e0                	shl    %ax
     f12:	05 02 00             	add    $0x2,%ax
     f15:	8b f8                	mov    %ax,%di
     f17:	d1 e7                	shl    %di
     f19:	c7 83 5a ff 01 00    	movw   $0x1,-0xa6(%bp,%di)
     f1f:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
     f23:	75 d4                	jne    0xef9
     f25:	c7 46 96 dd 01       	movw   $0x1dd,-0x6a(%bp)
     f2a:	c7 86 6e ff 4d 00    	movw   $0x4d,-0x92(%bp)
     f30:	c7 46 98 dd 01       	movw   $0x1dd,-0x68(%bp)
     f35:	c7 86 70 ff ed 00    	movw   $0xed,-0x90(%bp)
     f3b:	e9 8e 00             	jmp    0xfcc
     f3e:	c7 46 84 d1 00       	movw   $0xd1,-0x7c(%bp)
     f43:	c7 86 5c ff 79 00    	movw   $0x79,-0xa4(%bp)
     f49:	c7 46 86 dd 01       	movw   $0x1dd,-0x7a(%bp)
     f4e:	c7 86 5e ff 4d 00    	movw   $0x4d,-0xa2(%bp)
     f54:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     f59:	eb 03                	jmp    0xf5e
     f5b:	ff 46 fe             	incw   -0x2(%bp)
     f5e:	8b 46 fe             	mov    -0x2(%bp),%ax
     f61:	d1 e0                	shl    %ax
     f63:	40                   	inc    %ax
     f64:	8b f8                	mov    %ax,%di
     f66:	d1 e7                	shl    %di
     f68:	c7 43 82 c0 00       	movw   $0xc0,-0x7e(%bp,%di)
     f6d:	8b 46 fe             	mov    -0x2(%bp),%ax
     f70:	d1 e0                	shl    %ax
     f72:	40                   	inc    %ax
     f73:	8b f8                	mov    %ax,%di
     f75:	d1 e7                	shl    %di
     f77:	c7 83 5a ff 79 00    	movw   $0x79,-0xa6(%bp,%di)
     f7d:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
     f81:	75 d8                	jne    0xf5b
     f83:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
     f88:	eb 03                	jmp    0xf8d
     f8a:	ff 46 fe             	incw   -0x2(%bp)
     f8d:	8b 46 fe             	mov    -0x2(%bp),%ax
     f90:	d1 e0                	shl    %ax
     f92:	05 02 00             	add    $0x2,%ax
     f95:	8b f8                	mov    %ax,%di
     f97:	d1 e7                	shl    %di
     f99:	c7 43 82 c0 00       	movw   $0xc0,-0x7e(%bp,%di)
     f9e:	8b 46 fe             	mov    -0x2(%bp),%ax
     fa1:	d1 e0                	shl    %ax
     fa3:	05 02 00             	add    $0x2,%ax
     fa6:	8b f8                	mov    %ax,%di
     fa8:	d1 e7                	shl    %di
     faa:	c7 83 5a ff 51 00    	movw   $0x51,-0xa6(%bp,%di)
     fb0:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
     fb4:	75 d4                	jne    0xf8a
     fb6:	c7 46 96 dd 01       	movw   $0x1dd,-0x6a(%bp)
     fbb:	c7 86 6e ff 4d 00    	movw   $0x4d,-0x92(%bp)
     fc1:	c7 46 98 dd 01       	movw   $0x1dd,-0x68(%bp)
     fc6:	c7 86 70 ff ed 00    	movw   $0xed,-0x90(%bp)
     fcc:	8b 46 fc             	mov    -0x4(%bp),%ax
     fcf:	89 86 e2 fe          	mov    %ax,-0x11e(%bp)
     fd3:	b8 01 00             	mov    $0x1,%ax
     fd6:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
     fda:	7f 27                	jg     0x1003
     fdc:	89 46 fe             	mov    %ax,-0x2(%bp)
     fdf:	eb 03                	jmp    0xfe4
     fe1:	ff 46 fe             	incw   -0x2(%bp)
     fe4:	8b 7e fe             	mov    -0x2(%bp),%di
     fe7:	d1 e7                	shl    %di
     fe9:	c7 83 32 ff 3c 00    	movw   $0x3c,-0xce(%bp,%di)
     fef:	8b 7e fe             	mov    -0x2(%bp),%di
     ff2:	d1 e7                	shl    %di
     ff4:	c7 83 0a ff 27 00    	movw   $0x27,-0xf6(%bp,%di)
     ffa:	8b 46 fe             	mov    -0x2(%bp),%ax
     ffd:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    1001:	75 de                	jne    0xfe1
    1003:	c7 86 34 ff 2b 00    	movw   $0x2b,-0xcc(%bp)
    1009:	c7 86 36 ff 12 00    	movw   $0x12,-0xca(%bp)
    100f:	8b 46 fc             	mov    -0x4(%bp),%ax
    1012:	89 86 e2 fe          	mov    %ax,-0x11e(%bp)
    1016:	b8 01 00             	mov    $0x1,%ax
    1019:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    101d:	7f 25                	jg     0x1044
    101f:	89 46 fe             	mov    %ax,-0x2(%bp)
    1022:	eb 03                	jmp    0x1027
    1024:	ff 46 fe             	incw   -0x2(%bp)
    1027:	8b 7e fe             	mov    -0x2(%bp),%di
    102a:	d1 e7                	shl    %di
    102c:	c7 43 d2 19 01       	movw   $0x119,-0x2e(%bp,%di)
    1031:	8b 7e fe             	mov    -0x2(%bp),%di
    1034:	d1 e7                	shl    %di
    1036:	c7 43 aa 14 00       	movw   $0x14,-0x56(%bp,%di)
    103b:	8b 46 fe             	mov    -0x2(%bp),%ax
    103e:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    1042:	75 e0                	jne    0x1024
    1044:	c7 46 d4 2a 01       	movw   $0x12a,-0x2c(%bp)
    1049:	c7 86 e4 fe 20 03    	movw   $0x320,-0x11c(%bp)
    104f:	c7 86 e6 fe c8 00    	movw   $0xc8,-0x11a(%bp)
    1055:	c7 86 e8 fe c8 00    	movw   $0xc8,-0x118(%bp)
    105b:	c7 86 ea fe c8 00    	movw   $0xc8,-0x116(%bp)
    1061:	c7 86 ec fe c8 00    	movw   $0xc8,-0x114(%bp)
    1067:	c7 86 ee fe c8 00    	movw   $0xc8,-0x112(%bp)
    106d:	c7 86 f0 fe c8 00    	movw   $0xc8,-0x110(%bp)
    1073:	c7 86 f2 fe c8 00    	movw   $0xc8,-0x10e(%bp)
    1079:	c7 86 f4 fe c8 00    	movw   $0xc8,-0x10c(%bp)
    107f:	c7 86 f6 fe c8 00    	movw   $0xc8,-0x10a(%bp)
    1085:	c7 86 f8 fe c8 00    	movw   $0xc8,-0x108(%bp)
    108b:	8b 46 fc             	mov    -0x4(%bp),%ax
    108e:	89 86 e2 fe          	mov    %ax,-0x11e(%bp)
    1092:	b8 01 00             	mov    $0x1,%ax
    1095:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    1099:	7e 03                	jle    0x109e
    109b:	e9 99 00             	jmp    0x1137
    109e:	89 46 fe             	mov    %ax,-0x2(%bp)
    10a1:	eb 03                	jmp    0x10a6
    10a3:	ff 46 fe             	incw   -0x2(%bp)
    10a6:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    10ab:	75 15                	jne    0x10c2
    10ad:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    10b1:	7e 0f                	jle    0x10c2
    10b3:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    10b7:	7d 09                	jge    0x10c2
    10b9:	b8 88 13             	mov    $0x1388,%ax
    10bc:	50                   	push   %ax
    10bd:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    10c2:	8b 7e fe             	mov    -0x2(%bp),%di
    10c5:	d1 e7                	shl    %di
    10c7:	ff 73 82             	push   -0x7e(%bp,%di)
    10ca:	8b 7e fe             	mov    -0x2(%bp),%di
    10cd:	d1 e7                	shl    %di
    10cf:	ff b3 5a ff          	push   -0xa6(%bp,%di)
    10d3:	8b 7e fe             	mov    -0x2(%bp),%di
    10d6:	d1 e7                	shl    %di
    10d8:	ff b3 32 ff          	push   -0xce(%bp,%di)
    10dc:	8b 7e fe             	mov    -0x2(%bp),%di
    10df:	d1 e7                	shl    %di
    10e1:	ff b3 0a ff          	push   -0xf6(%bp,%di)
    10e5:	b8 01 00             	mov    $0x1,%ax
    10e8:	50                   	push   %ax
    10e9:	8b 7e fe             	mov    -0x2(%bp),%di
    10ec:	d1 e7                	shl    %di
    10ee:	ff 73 d2             	push   -0x2e(%bp,%di)
    10f1:	8b 7e fe             	mov    -0x2(%bp),%di
    10f4:	d1 e7                	shl    %di
    10f6:	ff 73 aa             	push   -0x56(%bp,%di)
    10f9:	31 c0                	xor    %ax,%ax
    10fb:	50                   	push   %ax
    10fc:	b0 02                	mov    $0x2,%al
    10fe:	50                   	push   %ax
    10ff:	b0 00                	mov    $0x0,%al
    1101:	50                   	push   %ax
    1102:	b0 01                	mov    $0x1,%al
    1104:	50                   	push   %ax
    1105:	8b 7e fe             	mov    -0x2(%bp),%di
    1108:	d1 e7                	shl    %di
    110a:	ff b3 e2 fe          	push   -0x11e(%bp,%di)
    110e:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    1113:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    1118:	75 11                	jne    0x112b
    111a:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    111e:	7e 0b                	jle    0x112b
    1120:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    1124:	7d 05                	jge    0x112b
    1126:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    112b:	8b 46 fe             	mov    -0x2(%bp),%ax
    112e:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    1132:	74 03                	je     0x1137
    1134:	e9 6c ff             	jmp    0x10a3
    1137:	89 ec                	mov    %bp,%sp
    1139:	5d                   	pop    %bp
    113a:	cb                   	lret
    113b:	55                   	push   %bp
    113c:	89 e5                	mov    %sp,%bp
    113e:	81 ec 8a 00          	sub    $0x8a,%sp
    1142:	8a 46 06             	mov    0x6(%bp),%al
    1145:	30 e4                	xor    %ah,%ah
    1147:	3d 01 00             	cmp    $0x1,%ax
    114a:	74 03                	je     0x114f
    114c:	e9 e3 00             	jmp    0x1232
    114f:	c7 46 f8 04 00       	movw   $0x4,-0x8(%bp)
    1154:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    1159:	eb 03                	jmp    0x115e
    115b:	ff 46 fe             	incw   -0x2(%bp)
    115e:	8b 7e fe             	mov    -0x2(%bp),%di
    1161:	d1 e7                	shl    %di
    1163:	c7 43 c6 1a 02       	movw   $0x21a,-0x3a(%bp,%di)
    1168:	8b 46 fe             	mov    -0x2(%bp),%ax
    116b:	48                   	dec    %ax
    116c:	b9 21 00             	mov    $0x21,%cx
    116f:	f7 e9                	imul   %cx
    1171:	05 25 00             	add    $0x25,%ax
    1174:	8b 7e fe             	mov    -0x2(%bp),%di
    1177:	d1 e7                	shl    %di
    1179:	89 43 9e             	mov    %ax,-0x62(%bp,%di)
    117c:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    1180:	75 d9                	jne    0x115b
    1182:	c7 46 ce 1a 02       	movw   $0x21a,-0x32(%bp)
    1187:	c7 46 a6 88 00       	movw   $0x88,-0x5a(%bp)
    118c:	80 7e 08 01          	cmpb   $0x1,0x8(%bp)
    1190:	75 07                	jne    0x1199
    1192:	c7 46 f6 2a 00       	movw   $0x2a,-0xa(%bp)
    1197:	eb 05                	jmp    0x119e
    1199:	c7 46 f6 2a 02       	movw   $0x22a,-0xa(%bp)
    119e:	c7 46 f4 65 00       	movw   $0x65,-0xc(%bp)
    11a3:	c7 46 f2 29 00       	movw   $0x29,-0xe(%bp)
    11a8:	c7 46 f0 20 00       	movw   $0x20,-0x10(%bp)
    11ad:	31 c0                	xor    %ax,%ax
    11af:	89 86 78 ff          	mov    %ax,-0x88(%bp)
    11b3:	c7 86 7a ff 2c 01    	movw   $0x12c,-0x86(%bp)
    11b9:	c7 86 7c ff bc 02    	movw   $0x2bc,-0x84(%bp)
    11bf:	31 c0                	xor    %ax,%ax
    11c1:	89 86 7e ff          	mov    %ax,-0x82(%bp)
    11c5:	c6 06 e6 3c 01       	movb   $0x1,0x3ce6
    11ca:	8b 46 f8             	mov    -0x8(%bp),%ax
    11cd:	89 86 76 ff          	mov    %ax,-0x8a(%bp)
    11d1:	b8 01 00             	mov    $0x1,%ax
    11d4:	3b 86 76 ff          	cmp    -0x8a(%bp),%ax
    11d8:	7f 55                	jg     0x122f
    11da:	89 46 fe             	mov    %ax,-0x2(%bp)
    11dd:	eb 03                	jmp    0x11e2
    11df:	ff 46 fe             	incw   -0x2(%bp)
    11e2:	8b 7e fe             	mov    -0x2(%bp),%di
    11e5:	d1 e7                	shl    %di
    11e7:	ff 73 c6             	push   -0x3a(%bp,%di)
    11ea:	8b 7e fe             	mov    -0x2(%bp),%di
    11ed:	d1 e7                	shl    %di
    11ef:	ff 73 9e             	push   -0x62(%bp,%di)
    11f2:	ff 76 f2             	push   -0xe(%bp)
    11f5:	ff 76 f0             	push   -0x10(%bp)
    11f8:	b8 01 00             	mov    $0x1,%ax
    11fb:	50                   	push   %ax
    11fc:	ff 76 f6             	push   -0xa(%bp)
    11ff:	ff 76 f4             	push   -0xc(%bp)
    1202:	31 c0                	xor    %ax,%ax
    1204:	50                   	push   %ax
    1205:	b0 02                	mov    $0x2,%al
    1207:	50                   	push   %ax
    1208:	b0 00                	mov    $0x0,%al
    120a:	50                   	push   %ax
    120b:	b0 01                	mov    $0x1,%al
    120d:	50                   	push   %ax
    120e:	8b 7e fe             	mov    -0x2(%bp),%di
    1211:	d1 e7                	shl    %di
    1213:	ff b3 76 ff          	push   -0x8a(%bp,%di)
    1217:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    121c:	bf d6 3c             	mov    $0x3cd6,%di
    121f:	1e                   	push   %ds
    1220:	57                   	push   %di
    1221:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    1226:	8b 46 fe             	mov    -0x2(%bp),%ax
    1229:	3b 86 76 ff          	cmp    -0x8a(%bp),%ax
    122d:	75 b0                	jne    0x11df
    122f:	e9 cd 00             	jmp    0x12ff
    1232:	3d 00 00             	cmp    $0x0,%ax
    1235:	74 03                	je     0x123a
    1237:	e9 c5 00             	jmp    0x12ff
    123a:	c7 46 f8 02 00       	movw   $0x2,-0x8(%bp)
    123f:	c7 46 c8 1a 02       	movw   $0x21a,-0x38(%bp)
    1244:	c7 46 a0 a9 00       	movw   $0xa9,-0x60(%bp)
    1249:	c7 46 ca 1a 02       	movw   $0x21a,-0x36(%bp)
    124e:	c7 46 a2 25 00       	movw   $0x25,-0x5e(%bp)
    1253:	80 7e 08 01          	cmpb   $0x1,0x8(%bp)
    1257:	75 07                	jne    0x1260
    1259:	c7 46 f6 2a 00       	movw   $0x2a,-0xa(%bp)
    125e:	eb 05                	jmp    0x1265
    1260:	c7 46 f6 2a 02       	movw   $0x22a,-0xa(%bp)
    1265:	c7 46 f4 65 00       	movw   $0x65,-0xc(%bp)
    126a:	c7 46 f2 29 00       	movw   $0x29,-0xe(%bp)
    126f:	c7 46 f0 20 00       	movw   $0x20,-0x10(%bp)
    1274:	c7 86 78 ff f4 01    	movw   $0x1f4,-0x88(%bp)
    127a:	31 c0                	xor    %ax,%ax
    127c:	89 86 7a ff          	mov    %ax,-0x86(%bp)
    1280:	c6 06 e6 3c 00       	movb   $0x0,0x3ce6
    1285:	b8 3c 00             	mov    $0x3c,%ax
    1288:	50                   	push   %ax
    1289:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    128e:	8b 46 f8             	mov    -0x8(%bp),%ax
    1291:	89 86 76 ff          	mov    %ax,-0x8a(%bp)
    1295:	b8 01 00             	mov    $0x1,%ax
    1298:	3b 86 76 ff          	cmp    -0x8a(%bp),%ax
    129c:	7f 57                	jg     0x12f5
    129e:	89 46 fe             	mov    %ax,-0x2(%bp)
    12a1:	eb 03                	jmp    0x12a6
    12a3:	ff 46 fe             	incw   -0x2(%bp)
    12a6:	80 3e 06 3a 00       	cmpb   $0x0,0x3a06
    12ab:	74 05                	je     0x12b2
    12ad:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    12b2:	8b 7e fe             	mov    -0x2(%bp),%di
    12b5:	d1 e7                	shl    %di
    12b7:	ff 73 c6             	push   -0x3a(%bp,%di)
    12ba:	8b 7e fe             	mov    -0x2(%bp),%di
    12bd:	d1 e7                	shl    %di
    12bf:	ff 73 9e             	push   -0x62(%bp,%di)
    12c2:	ff 76 f2             	push   -0xe(%bp)
    12c5:	ff 76 f0             	push   -0x10(%bp)
    12c8:	b8 01 00             	mov    $0x1,%ax
    12cb:	50                   	push   %ax
    12cc:	ff 76 f6             	push   -0xa(%bp)
    12cf:	ff 76 f4             	push   -0xc(%bp)
    12d2:	31 c0                	xor    %ax,%ax
    12d4:	50                   	push   %ax
    12d5:	b0 02                	mov    $0x2,%al
    12d7:	50                   	push   %ax
    12d8:	b0 00                	mov    $0x0,%al
    12da:	50                   	push   %ax
    12db:	b0 01                	mov    $0x1,%al
    12dd:	50                   	push   %ax
    12de:	8b 7e fe             	mov    -0x2(%bp),%di
    12e1:	d1 e7                	shl    %di
    12e3:	ff b3 76 ff          	push   -0x8a(%bp,%di)
    12e7:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    12ec:	8b 46 fe             	mov    -0x2(%bp),%ax
    12ef:	3b 86 76 ff          	cmp    -0x8a(%bp),%ax
    12f3:	75 ae                	jne    0x12a3
    12f5:	bf d2 3c             	mov    $0x3cd2,%di
    12f8:	1e                   	push   %ds
    12f9:	57                   	push   %di
    12fa:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    12ff:	89 ec                	mov    %bp,%sp
    1301:	5d                   	pop    %bp
    1302:	ca 04 00             	lret   $0x4
    1305:	55                   	push   %bp
    1306:	89 e5                	mov    %sp,%bp
    1308:	83 ec 06             	sub    $0x6,%sp
    130b:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    1310:	83 3e f6 3b 01       	cmpw   $0x1,0x3bf6
    1315:	7e 3d                	jle    0x1354
    1317:	a1 f6 3b             	mov    0x3bf6,%ax
    131a:	89 46 fa             	mov    %ax,-0x6(%bp)
    131d:	b8 02 00             	mov    $0x2,%ax
    1320:	3b 46 fa             	cmp    -0x6(%bp),%ax
    1323:	7f 2f                	jg     0x1354
    1325:	89 46 fe             	mov    %ax,-0x2(%bp)
    1328:	eb 03                	jmp    0x132d
    132a:	ff 46 fe             	incw   -0x2(%bp)
    132d:	8b 7e fe             	mov    -0x2(%bp),%di
    1330:	8a 85 f7 3b          	mov    0x3bf7(%di),%al
    1334:	3a 06 f8 3b          	cmp    0x3bf8,%al
    1338:	75 0d                	jne    0x1347
    133a:	8b 7e fe             	mov    -0x2(%bp),%di
    133d:	8a 85 0f 3c          	mov    0x3c0f(%di),%al
    1341:	3a 06 10 3c          	cmp    0x3c10,%al
    1345:	74 05                	je     0x134c
    1347:	c7 46 fc 02 00       	movw   $0x2,-0x4(%bp)
    134c:	8b 46 fe             	mov    -0x2(%bp),%ax
    134f:	3b 46 fa             	cmp    -0x6(%bp),%ax
    1352:	75 d6                	jne    0x132a
    1354:	83 7e fc 01          	cmpw   $0x1,-0x4(%bp)
    1358:	7e 3e                	jle    0x1398
    135a:	c6 06 28 3c 01       	movb   $0x1,0x3c28
    135f:	a1 f6 3b             	mov    0x3bf6,%ax
    1362:	89 46 fa             	mov    %ax,-0x6(%bp)
    1365:	b8 01 00             	mov    $0x1,%ax
    1368:	3b 46 fa             	cmp    -0x6(%bp),%ax
    136b:	7f 29                	jg     0x1396
    136d:	89 46 fe             	mov    %ax,-0x2(%bp)
    1370:	eb 03                	jmp    0x1375
    1372:	ff 46 fe             	incw   -0x2(%bp)
    1375:	8b 7e fe             	mov    -0x2(%bp),%di
    1378:	80 bd 0f 3c 06       	cmpb   $0x6,0x3c0f(%di)
    137d:	74 0a                	je     0x1389
    137f:	8b 7e fe             	mov    -0x2(%bp),%di
    1382:	80 bd 0f 3c 0e       	cmpb   $0xe,0x3c0f(%di)
    1387:	75 05                	jne    0x138e
    1389:	c6 06 28 3c 00       	movb   $0x0,0x3c28
    138e:	8b 46 fe             	mov    -0x2(%bp),%ax
    1391:	3b 46 fa             	cmp    -0x6(%bp),%ax
    1394:	75 dc                	jne    0x1372
    1396:	eb 05                	jmp    0x139d
    1398:	c6 06 28 3c 00       	movb   $0x0,0x3c28
    139d:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    13a2:	75 0c                	jne    0x13b0
    13a4:	80 3e ac 30 01       	cmpb   $0x1,0x30ac
    13a9:	74 05                	je     0x13b0
    13ab:	c6 06 28 3c 00       	movb   $0x0,0x3c28
    13b0:	89 ec                	mov    %bp,%sp
    13b2:	5d                   	pop    %bp
    13b3:	cb                   	lret
    13b4:	80 03 00             	addb   $0x0,(%bp,%di)
	...
    13d3:	00 55 89             	add    %dl,-0x77(%di)
    13d6:	e5 83                	in     $0x83,%ax
    13d8:	ec                   	in     (%dx),%al
    13d9:	42                   	inc    %dx
    13da:	0e                   	push   %cs
    13db:	e8 27 ff             	call   0x1305
    13de:	83 3e f2 3b 03       	cmpw   $0x3,0x3bf2
    13e3:	7e 10                	jle    0x13f5
    13e5:	a0 f2 3b             	mov    0x3bf2,%al
    13e8:	50                   	push   %ax
    13e9:	bf b4 13             	mov    $0x13b4,%di
    13ec:	0e                   	push   %cs
    13ed:	57                   	push   %di
    13ee:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    13f3:	74 06                	je     0x13fb
    13f5:	c6 46 e7 01          	movb   $0x1,-0x19(%bp)
    13f9:	eb 04                	jmp    0x13ff
    13fb:	c6 46 e7 02          	movb   $0x2,-0x19(%bp)
    13ff:	80 7e e7 01          	cmpb   $0x1,-0x19(%bp)
    1403:	75 1a                	jne    0x141f
    1405:	c7 46 e0 01 00       	movw   $0x1,-0x20(%bp)
    140a:	80 3e 02 3a 01       	cmpb   $0x1,0x3a02
    140f:	75 07                	jne    0x1418
    1411:	c7 46 e4 0a 00       	movw   $0xa,-0x1c(%bp)
    1416:	eb 05                	jmp    0x141d
    1418:	c7 46 e4 0a 02       	movw   $0x20a,-0x1c(%bp)
    141d:	eb 18                	jmp    0x1437
    141f:	c7 46 e0 18 00       	movw   $0x18,-0x20(%bp)
    1424:	80 3e 02 3a 01       	cmpb   $0x1,0x3a02
    1429:	75 07                	jne    0x1432
    142b:	c7 46 e4 21 00       	movw   $0x21,-0x1c(%bp)
    1430:	eb 05                	jmp    0x1437
    1432:	c7 46 e4 21 02       	movw   $0x221,-0x1c(%bp)
    1437:	c7 46 de 5e 00       	movw   $0x5e,-0x22(%bp)
    143c:	c7 46 e2 65 00       	movw   $0x65,-0x1e(%bp)
    1441:	c7 46 d8 01 00       	movw   $0x1,-0x28(%bp)
    1446:	80 3e 02 3a 01       	cmpb   $0x1,0x3a02
    144b:	75 07                	jne    0x1454
    144d:	c7 46 dc 0a 00       	movw   $0xa,-0x24(%bp)
    1452:	eb 05                	jmp    0x1459
    1454:	c7 46 dc 0a 02       	movw   $0x20a,-0x24(%bp)
    1459:	c7 46 d6 5e 00       	movw   $0x5e,-0x2a(%bp)
    145e:	c7 46 da 65 00       	movw   $0x65,-0x26(%bp)
    1463:	b8 01 00             	mov    $0x1,%ax
    1466:	50                   	push   %ax
    1467:	8d 46 e8             	lea    -0x18(%bp),%ax
    146a:	8c d2                	mov    %ss,%dx
    146c:	52                   	push   %dx
    146d:	50                   	push   %ax
    146e:	b8 05 00             	mov    $0x5,%ax
    1471:	50                   	push   %ax
    1472:	b8 6b 00             	mov    $0x6b,%ax
    1475:	50                   	push   %ax
    1476:	b8 28 00             	mov    $0x28,%ax
    1479:	50                   	push   %ax
    147a:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    147f:	ff 76 ea             	push   -0x16(%bp)
    1482:	ff 76 e8             	push   -0x18(%bp)
    1485:	ff 76 dc             	push   -0x24(%bp)
    1488:	ff 76 da             	push   -0x26(%bp)
    148b:	b8 6b 00             	mov    $0x6b,%ax
    148e:	50                   	push   %ax
    148f:	b8 28 00             	mov    $0x28,%ax
    1492:	50                   	push   %ax
    1493:	31 c0                	xor    %ax,%ax
    1495:	50                   	push   %ax
    1496:	b0 00                	mov    $0x0,%al
    1498:	50                   	push   %ax
    1499:	b0 01                	mov    $0x1,%al
    149b:	50                   	push   %ax
    149c:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    14a1:	b8 01 00             	mov    $0x1,%ax
    14a4:	50                   	push   %ax
    14a5:	8d 46 ec             	lea    -0x14(%bp),%ax
    14a8:	8c d2                	mov    %ss,%dx
    14aa:	52                   	push   %dx
    14ab:	50                   	push   %ax
    14ac:	b8 05 00             	mov    $0x5,%ax
    14af:	50                   	push   %ax
    14b0:	b8 6b 00             	mov    $0x6b,%ax
    14b3:	50                   	push   %ax
    14b4:	b8 26 00             	mov    $0x26,%ax
    14b7:	50                   	push   %ax
    14b8:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    14bd:	ff 76 ee             	push   -0x12(%bp)
    14c0:	ff 76 ec             	push   -0x14(%bp)
    14c3:	ff 76 dc             	push   -0x24(%bp)
    14c6:	8b 46 da             	mov    -0x26(%bp),%ax
    14c9:	05 28 00             	add    $0x28,%ax
    14cc:	50                   	push   %ax
    14cd:	b8 6b 00             	mov    $0x6b,%ax
    14d0:	50                   	push   %ax
    14d1:	b8 26 00             	mov    $0x26,%ax
    14d4:	50                   	push   %ax
    14d5:	31 c0                	xor    %ax,%ax
    14d7:	50                   	push   %ax
    14d8:	b0 00                	mov    $0x0,%al
    14da:	50                   	push   %ax
    14db:	b0 01                	mov    $0x1,%al
    14dd:	50                   	push   %ax
    14de:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    14e3:	80 3e 28 3c 00       	cmpb   $0x0,0x3c28
    14e8:	74 2c                	je     0x1516
    14ea:	80 3e 02 3a 01       	cmpb   $0x1,0x3a02
    14ef:	75 0a                	jne    0x14fb
    14f1:	b0 03                	mov    $0x3,%al
    14f3:	50                   	push   %ax
    14f4:	9a 5c 13 02 06       	lcall  $0x602,$0x135c
    14f9:	eb 08                	jmp    0x1503
    14fb:	b0 04                	mov    $0x4,%al
    14fd:	50                   	push   %ax
    14fe:	9a 5c 13 02 06       	lcall  $0x602,$0x135c
    1503:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    1508:	3d 1b 01             	cmp    $0x11b,%ax
    150b:	75 03                	jne    0x1510
    150d:	e9 0c 07             	jmp    0x1c1c
    1510:	c6 46 cd 02          	movb   $0x2,-0x33(%bp)
    1514:	eb 04                	jmp    0x151a
    1516:	c6 46 cd 01          	movb   $0x1,-0x33(%bp)
    151a:	c7 46 f0 3c 00       	movw   $0x3c,-0x10(%bp)
    151f:	c7 46 f2 64 00       	movw   $0x64,-0xe(%bp)
    1524:	c7 46 f6 a0 00       	movw   $0xa0,-0xa(%bp)
    1529:	c7 46 f8 14 00       	movw   $0x14,-0x8(%bp)
    152e:	83 3e f2 3b 06       	cmpw   $0x6,0x3bf2
    1533:	7e 07                	jle    0x153c
    1535:	c7 46 f4 b4 00       	movw   $0xb4,-0xc(%bp)
    153a:	eb 05                	jmp    0x1541
    153c:	c7 46 f4 64 00       	movw   $0x64,-0xc(%bp)
    1541:	c6 46 cc 05          	movb   $0x5,-0x34(%bp)
    1545:	a1 f2 3b             	mov    0x3bf2,%ax
    1548:	d1 e0                	shl    %ax
    154a:	8b f0                	mov    %ax,%si
    154c:	d1 e0                	shl    %ax
    154e:	03 c6                	add    %si,%ax
    1550:	8b c8                	mov    %ax,%cx
    1552:	a0 02 3a             	mov    0x3a02,%al
    1555:	30 e4                	xor    %ah,%ah
    1557:	ba 48 00             	mov    $0x48,%dx
    155a:	f7 e2                	mul    %dx
    155c:	8b f8                	mov    %ax,%di
    155e:	03 f9                	add    %cx,%di
    1560:	81 c7 82 37          	add    $0x3782,%di
    1564:	89 7e be             	mov    %di,-0x42(%bp)
    1567:	8c 5e c0             	mov    %ds,-0x40(%bp)
    156a:	8d 7e c8             	lea    -0x38(%bp),%di
    156d:	16                   	push   %ss
    156e:	57                   	push   %di
    156f:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    1574:	ff 76 ee             	push   -0x12(%bp)
    1577:	ff 76 ec             	push   -0x14(%bp)
    157a:	31 c0                	xor    %ax,%ax
    157c:	50                   	push   %ax
    157d:	ff 76 d8             	push   -0x28(%bp)
    1580:	8b 46 d6             	mov    -0x2a(%bp),%ax
    1583:	05 28 00             	add    $0x28,%ax
    1586:	50                   	push   %ax
    1587:	b8 01 00             	mov    $0x1,%ax
    158a:	50                   	push   %ax
    158b:	b0 02                	mov    $0x2,%al
    158d:	50                   	push   %ax
    158e:	b0 00                	mov    $0x0,%al
    1590:	50                   	push   %ax
    1591:	b0 01                	mov    $0x1,%al
    1593:	50                   	push   %ax
    1594:	31 c0                	xor    %ax,%ax
    1596:	50                   	push   %ax
    1597:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    159c:	80 7e cd 03          	cmpb   $0x3,-0x33(%bp)
    15a0:	73 3b                	jae    0x15dd
    15a2:	8a 46 cd             	mov    -0x33(%bp),%al
    15a5:	30 e4                	xor    %ah,%ah
    15a7:	d1 e0                	shl    %ax
    15a9:	d1 e0                	shl    %ax
    15ab:	8b c8                	mov    %ax,%cx
    15ad:	8a 46 e7             	mov    -0x19(%bp),%al
    15b0:	98                   	cbtw
    15b1:	ba 30 00             	mov    $0x30,%dx
    15b4:	f7 e2                	mul    %dx
    15b6:	8b f8                	mov    %ax,%di
    15b8:	03 f9                	add    %cx,%di
    15ba:	ff b5 1c 3c          	push   0x3c1c(%di)
    15be:	ff b5 1a 3c          	push   0x3c1a(%di)
    15c2:	ff 76 e0             	push   -0x20(%bp)
    15c5:	ff 76 de             	push   -0x22(%bp)
    15c8:	b8 01 00             	mov    $0x1,%ax
    15cb:	50                   	push   %ax
    15cc:	b0 02                	mov    $0x2,%al
    15ce:	50                   	push   %ax
    15cf:	b0 00                	mov    $0x0,%al
    15d1:	50                   	push   %ax
    15d2:	b0 01                	mov    $0x1,%al
    15d4:	50                   	push   %ax
    15d5:	31 c0                	xor    %ax,%ax
    15d7:	50                   	push   %ax
    15d8:	9a 00 00 95 08       	lcall  $0x895,$0x0
    15dd:	80 7e cd 03          	cmpb   $0x3,-0x33(%bp)
    15e1:	74 03                	je     0x15e6
    15e3:	e9 01 02             	jmp    0x17e7
    15e6:	a1 f2 3b             	mov    0x3bf2,%ax
    15e9:	3d 01 00             	cmp    $0x1,%ax
    15ec:	75 26                	jne    0x1614
    15ee:	ff 36 58 3c          	push   0x3c58
    15f2:	ff 36 56 3c          	push   0x3c56
    15f6:	ff 76 e0             	push   -0x20(%bp)
    15f9:	ff 76 de             	push   -0x22(%bp)
    15fc:	b8 01 00             	mov    $0x1,%ax
    15ff:	50                   	push   %ax
    1600:	b0 02                	mov    $0x2,%al
    1602:	50                   	push   %ax
    1603:	b0 00                	mov    $0x0,%al
    1605:	50                   	push   %ax
    1606:	b0 01                	mov    $0x1,%al
    1608:	50                   	push   %ax
    1609:	31 c0                	xor    %ax,%ax
    160b:	50                   	push   %ax
    160c:	9a 00 00 95 08       	lcall  $0x895,$0x0
    1611:	e9 d3 01             	jmp    0x17e7
    1614:	3d 02 00             	cmp    $0x2,%ax
    1617:	75 26                	jne    0x163f
    1619:	ff 36 5c 3c          	push   0x3c5c
    161d:	ff 36 5a 3c          	push   0x3c5a
    1621:	ff 76 e0             	push   -0x20(%bp)
    1624:	ff 76 de             	push   -0x22(%bp)
    1627:	b8 01 00             	mov    $0x1,%ax
    162a:	50                   	push   %ax
    162b:	b0 02                	mov    $0x2,%al
    162d:	50                   	push   %ax
    162e:	b0 00                	mov    $0x0,%al
    1630:	50                   	push   %ax
    1631:	b0 01                	mov    $0x1,%al
    1633:	50                   	push   %ax
    1634:	31 c0                	xor    %ax,%ax
    1636:	50                   	push   %ax
    1637:	9a 00 00 95 08       	lcall  $0x895,$0x0
    163c:	e9 a8 01             	jmp    0x17e7
    163f:	3d 03 00             	cmp    $0x3,%ax
    1642:	75 26                	jne    0x166a
    1644:	ff 36 60 3c          	push   0x3c60
    1648:	ff 36 5e 3c          	push   0x3c5e
    164c:	ff 76 e0             	push   -0x20(%bp)
    164f:	ff 76 de             	push   -0x22(%bp)
    1652:	b8 01 00             	mov    $0x1,%ax
    1655:	50                   	push   %ax
    1656:	b0 02                	mov    $0x2,%al
    1658:	50                   	push   %ax
    1659:	b0 00                	mov    $0x0,%al
    165b:	50                   	push   %ax
    165c:	b0 01                	mov    $0x1,%al
    165e:	50                   	push   %ax
    165f:	31 c0                	xor    %ax,%ax
    1661:	50                   	push   %ax
    1662:	9a 00 00 95 08       	lcall  $0x895,$0x0
    1667:	e9 7d 01             	jmp    0x17e7
    166a:	3d 04 00             	cmp    $0x4,%ax
    166d:	75 26                	jne    0x1695
    166f:	ff 36 90 3c          	push   0x3c90
    1673:	ff 36 8e 3c          	push   0x3c8e
    1677:	ff 76 e0             	push   -0x20(%bp)
    167a:	ff 76 de             	push   -0x22(%bp)
    167d:	b8 01 00             	mov    $0x1,%ax
    1680:	50                   	push   %ax
    1681:	b0 02                	mov    $0x2,%al
    1683:	50                   	push   %ax
    1684:	b0 00                	mov    $0x0,%al
    1686:	50                   	push   %ax
    1687:	b0 01                	mov    $0x1,%al
    1689:	50                   	push   %ax
    168a:	31 c0                	xor    %ax,%ax
    168c:	50                   	push   %ax
    168d:	9a 00 00 95 08       	lcall  $0x895,$0x0
    1692:	e9 52 01             	jmp    0x17e7
    1695:	3d 05 00             	cmp    $0x5,%ax
    1698:	75 26                	jne    0x16c0
    169a:	ff 36 8c 3c          	push   0x3c8c
    169e:	ff 36 8a 3c          	push   0x3c8a
    16a2:	ff 76 e0             	push   -0x20(%bp)
    16a5:	ff 76 de             	push   -0x22(%bp)
    16a8:	b8 01 00             	mov    $0x1,%ax
    16ab:	50                   	push   %ax
    16ac:	b0 02                	mov    $0x2,%al
    16ae:	50                   	push   %ax
    16af:	b0 00                	mov    $0x0,%al
    16b1:	50                   	push   %ax
    16b2:	b0 01                	mov    $0x1,%al
    16b4:	50                   	push   %ax
    16b5:	31 c0                	xor    %ax,%ax
    16b7:	50                   	push   %ax
    16b8:	9a 00 00 95 08       	lcall  $0x895,$0x0
    16bd:	e9 27 01             	jmp    0x17e7
    16c0:	3d 06 00             	cmp    $0x6,%ax
    16c3:	75 26                	jne    0x16eb
    16c5:	ff 36 88 3c          	push   0x3c88
    16c9:	ff 36 86 3c          	push   0x3c86
    16cd:	ff 76 e0             	push   -0x20(%bp)
    16d0:	ff 76 de             	push   -0x22(%bp)
    16d3:	b8 01 00             	mov    $0x1,%ax
    16d6:	50                   	push   %ax
    16d7:	b0 02                	mov    $0x2,%al
    16d9:	50                   	push   %ax
    16da:	b0 00                	mov    $0x0,%al
    16dc:	50                   	push   %ax
    16dd:	b0 01                	mov    $0x1,%al
    16df:	50                   	push   %ax
    16e0:	31 c0                	xor    %ax,%ax
    16e2:	50                   	push   %ax
    16e3:	9a 00 00 95 08       	lcall  $0x895,$0x0
    16e8:	e9 fc 00             	jmp    0x17e7
    16eb:	3d 07 00             	cmp    $0x7,%ax
    16ee:	75 26                	jne    0x1716
    16f0:	ff 36 64 3c          	push   0x3c64
    16f4:	ff 36 62 3c          	push   0x3c62
    16f8:	ff 76 e0             	push   -0x20(%bp)
    16fb:	ff 76 de             	push   -0x22(%bp)
    16fe:	b8 01 00             	mov    $0x1,%ax
    1701:	50                   	push   %ax
    1702:	b0 02                	mov    $0x2,%al
    1704:	50                   	push   %ax
    1705:	b0 00                	mov    $0x0,%al
    1707:	50                   	push   %ax
    1708:	b0 01                	mov    $0x1,%al
    170a:	50                   	push   %ax
    170b:	31 c0                	xor    %ax,%ax
    170d:	50                   	push   %ax
    170e:	9a 00 00 95 08       	lcall  $0x895,$0x0
    1713:	e9 d1 00             	jmp    0x17e7
    1716:	3d 08 00             	cmp    $0x8,%ax
    1719:	75 26                	jne    0x1741
    171b:	ff 36 68 3c          	push   0x3c68
    171f:	ff 36 66 3c          	push   0x3c66
    1723:	ff 76 e0             	push   -0x20(%bp)
    1726:	ff 76 de             	push   -0x22(%bp)
    1729:	b8 01 00             	mov    $0x1,%ax
    172c:	50                   	push   %ax
    172d:	b0 02                	mov    $0x2,%al
    172f:	50                   	push   %ax
    1730:	b0 00                	mov    $0x0,%al
    1732:	50                   	push   %ax
    1733:	b0 01                	mov    $0x1,%al
    1735:	50                   	push   %ax
    1736:	31 c0                	xor    %ax,%ax
    1738:	50                   	push   %ax
    1739:	9a 00 00 95 08       	lcall  $0x895,$0x0
    173e:	e9 a6 00             	jmp    0x17e7
    1741:	3d 09 00             	cmp    $0x9,%ax
    1744:	75 25                	jne    0x176b
    1746:	ff 36 6c 3c          	push   0x3c6c
    174a:	ff 36 6a 3c          	push   0x3c6a
    174e:	ff 76 e0             	push   -0x20(%bp)
    1751:	ff 76 de             	push   -0x22(%bp)
    1754:	b8 01 00             	mov    $0x1,%ax
    1757:	50                   	push   %ax
    1758:	b0 02                	mov    $0x2,%al
    175a:	50                   	push   %ax
    175b:	b0 00                	mov    $0x0,%al
    175d:	50                   	push   %ax
    175e:	b0 01                	mov    $0x1,%al
    1760:	50                   	push   %ax
    1761:	31 c0                	xor    %ax,%ax
    1763:	50                   	push   %ax
    1764:	9a 00 00 95 08       	lcall  $0x895,$0x0
    1769:	eb 7c                	jmp    0x17e7
    176b:	3d 0a 00             	cmp    $0xa,%ax
    176e:	75 25                	jne    0x1795
    1770:	ff 36 9c 3c          	push   0x3c9c
    1774:	ff 36 9a 3c          	push   0x3c9a
    1778:	ff 76 e0             	push   -0x20(%bp)
    177b:	ff 76 de             	push   -0x22(%bp)
    177e:	b8 01 00             	mov    $0x1,%ax
    1781:	50                   	push   %ax
    1782:	b0 02                	mov    $0x2,%al
    1784:	50                   	push   %ax
    1785:	b0 00                	mov    $0x0,%al
    1787:	50                   	push   %ax
    1788:	b0 01                	mov    $0x1,%al
    178a:	50                   	push   %ax
    178b:	31 c0                	xor    %ax,%ax
    178d:	50                   	push   %ax
    178e:	9a 00 00 95 08       	lcall  $0x895,$0x0
    1793:	eb 52                	jmp    0x17e7
    1795:	3d 0b 00             	cmp    $0xb,%ax
    1798:	75 25                	jne    0x17bf
    179a:	ff 36 98 3c          	push   0x3c98
    179e:	ff 36 96 3c          	push   0x3c96
    17a2:	ff 76 e0             	push   -0x20(%bp)
    17a5:	ff 76 de             	push   -0x22(%bp)
    17a8:	b8 01 00             	mov    $0x1,%ax
    17ab:	50                   	push   %ax
    17ac:	b0 02                	mov    $0x2,%al
    17ae:	50                   	push   %ax
    17af:	b0 00                	mov    $0x0,%al
    17b1:	50                   	push   %ax
    17b2:	b0 01                	mov    $0x1,%al
    17b4:	50                   	push   %ax
    17b5:	31 c0                	xor    %ax,%ax
    17b7:	50                   	push   %ax
    17b8:	9a 00 00 95 08       	lcall  $0x895,$0x0
    17bd:	eb 28                	jmp    0x17e7
    17bf:	3d 0c 00             	cmp    $0xc,%ax
    17c2:	75 23                	jne    0x17e7
    17c4:	ff 36 94 3c          	push   0x3c94
    17c8:	ff 36 92 3c          	push   0x3c92
    17cc:	ff 76 e0             	push   -0x20(%bp)
    17cf:	ff 76 de             	push   -0x22(%bp)
    17d2:	b8 01 00             	mov    $0x1,%ax
    17d5:	50                   	push   %ax
    17d6:	b0 02                	mov    $0x2,%al
    17d8:	50                   	push   %ax
    17d9:	b0 00                	mov    $0x0,%al
    17db:	50                   	push   %ax
    17dc:	b0 01                	mov    $0x1,%al
    17de:	50                   	push   %ax
    17df:	31 c0                	xor    %ax,%ax
    17e1:	50                   	push   %ax
    17e2:	9a 00 00 95 08       	lcall  $0x895,$0x0
    17e7:	80 7e cd 04          	cmpb   $0x4,-0x33(%bp)
    17eb:	75 78                	jne    0x1865
    17ed:	a1 f2 3b             	mov    0x3bf2,%ax
    17f0:	d1 e0                	shl    %ax
    17f2:	8b c8                	mov    %ax,%cx
    17f4:	a0 02 3a             	mov    0x3a02,%al
    17f7:	30 e4                	xor    %ah,%ah
    17f9:	ba 18 00             	mov    $0x18,%dx
    17fc:	f7 e2                	mul    %dx
    17fe:	8b f8                	mov    %ax,%di
    1800:	03 f9                	add    %cx,%di
    1802:	8b 85 f0 39          	mov    0x39f0(%di),%ax
    1806:	03 46 e0             	add    -0x20(%bp),%ax
    1809:	2b 46 e4             	sub    -0x1c(%bp),%ax
    180c:	50                   	push   %ax
    180d:	a1 f2 3b             	mov    0x3bf2,%ax
    1810:	d1 e0                	shl    %ax
    1812:	8b c8                	mov    %ax,%cx
    1814:	a0 02 3a             	mov    0x3a02,%al
    1817:	30 e4                	xor    %ah,%ah
    1819:	ba 18 00             	mov    $0x18,%dx
    181c:	f7 e2                	mul    %dx
    181e:	8b f8                	mov    %ax,%di
    1820:	03 f9                	add    %cx,%di
    1822:	8b 85 38 3a          	mov    0x3a38(%di),%ax
    1826:	03 46 de             	add    -0x22(%bp),%ax
    1829:	2b 46 e2             	sub    -0x1e(%bp),%ax
    182c:	50                   	push   %ax
    182d:	ff 36 9a 3a          	push   0x3a9a
    1831:	ff 36 a0 3a          	push   0x3aa0
    1835:	b8 01 00             	mov    $0x1,%ax
    1838:	50                   	push   %ax
    1839:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    183e:	ff 76 ee             	push   -0x12(%bp)
    1841:	ff 76 ec             	push   -0x14(%bp)
    1844:	ff 76 d8             	push   -0x28(%bp)
    1847:	8b 46 d6             	mov    -0x2a(%bp),%ax
    184a:	05 28 00             	add    $0x28,%ax
    184d:	50                   	push   %ax
    184e:	b8 6b 00             	mov    $0x6b,%ax
    1851:	50                   	push   %ax
    1852:	b8 26 00             	mov    $0x26,%ax
    1855:	50                   	push   %ax
    1856:	b8 01 00             	mov    $0x1,%ax
    1859:	50                   	push   %ax
    185a:	b0 00                	mov    $0x0,%al
    185c:	50                   	push   %ax
    185d:	b0 01                	mov    $0x1,%al
    185f:	50                   	push   %ax
    1860:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    1865:	80 7e cd 04          	cmpb   $0x4,-0x33(%bp)
    1869:	73 03                	jae    0x186e
    186b:	e9 85 00             	jmp    0x18f3
    186e:	80 3e 02 3a 01       	cmpb   $0x1,0x3a02
    1873:	75 40                	jne    0x18b5
    1875:	8a 46 cd             	mov    -0x33(%bp),%al
    1878:	30 e4                	xor    %ah,%ah
    187a:	05 05 00             	add    $0x5,%ax
    187d:	d1 e0                	shl    %ax
    187f:	d1 e0                	shl    %ax
    1881:	8b c8                	mov    %ax,%cx
    1883:	8a 46 e7             	mov    -0x19(%bp),%al
    1886:	98                   	cbtw
    1887:	ba 30 00             	mov    $0x30,%dx
    188a:	f7 e2                	mul    %dx
    188c:	8b f8                	mov    %ax,%di
    188e:	03 f9                	add    %cx,%di
    1890:	ff b5 1c 3c          	push   0x3c1c(%di)
    1894:	ff b5 1a 3c          	push   0x3c1a(%di)
    1898:	ff 76 e0             	push   -0x20(%bp)
    189b:	ff 76 de             	push   -0x22(%bp)
    189e:	b8 01 00             	mov    $0x1,%ax
    18a1:	50                   	push   %ax
    18a2:	b0 02                	mov    $0x2,%al
    18a4:	50                   	push   %ax
    18a5:	b0 00                	mov    $0x0,%al
    18a7:	50                   	push   %ax
    18a8:	b0 01                	mov    $0x1,%al
    18aa:	50                   	push   %ax
    18ab:	31 c0                	xor    %ax,%ax
    18ad:	50                   	push   %ax
    18ae:	9a 00 00 95 08       	lcall  $0x895,$0x0
    18b3:	eb 3e                	jmp    0x18f3
    18b5:	8a 46 cd             	mov    -0x33(%bp),%al
    18b8:	30 e4                	xor    %ah,%ah
    18ba:	05 07 00             	add    $0x7,%ax
    18bd:	d1 e0                	shl    %ax
    18bf:	d1 e0                	shl    %ax
    18c1:	8b c8                	mov    %ax,%cx
    18c3:	8a 46 e7             	mov    -0x19(%bp),%al
    18c6:	98                   	cbtw
    18c7:	ba 30 00             	mov    $0x30,%dx
    18ca:	f7 e2                	mul    %dx
    18cc:	8b f8                	mov    %ax,%di
    18ce:	03 f9                	add    %cx,%di
    18d0:	ff b5 1c 3c          	push   0x3c1c(%di)
    18d4:	ff b5 1a 3c          	push   0x3c1a(%di)
    18d8:	ff 76 e0             	push   -0x20(%bp)
    18db:	ff 76 de             	push   -0x22(%bp)
    18de:	b8 01 00             	mov    $0x1,%ax
    18e1:	50                   	push   %ax
    18e2:	b0 02                	mov    $0x2,%al
    18e4:	50                   	push   %ax
    18e5:	b0 00                	mov    $0x0,%al
    18e7:	50                   	push   %ax
    18e8:	b0 01                	mov    $0x1,%al
    18ea:	50                   	push   %ax
    18eb:	31 c0                	xor    %ax,%ax
    18ed:	50                   	push   %ax
    18ee:	9a 00 00 95 08       	lcall  $0x895,$0x0
    18f3:	80 3e 28 3c 00       	cmpb   $0x0,0x3c28
    18f8:	74 34                	je     0x192e
    18fa:	80 7e cd 02          	cmpb   $0x2,-0x33(%bp)
    18fe:	75 2e                	jne    0x192e
    1900:	ff 76 d8             	push   -0x28(%bp)
    1903:	ff 76 d6             	push   -0x2a(%bp)
    1906:	b8 6b 00             	mov    $0x6b,%ax
    1909:	50                   	push   %ax
    190a:	b8 4e 00             	mov    $0x4e,%ax
    190d:	50                   	push   %ax
    190e:	b8 01 00             	mov    $0x1,%ax
    1911:	50                   	push   %ax
    1912:	ff 76 dc             	push   -0x24(%bp)
    1915:	ff 76 da             	push   -0x26(%bp)
    1918:	31 c0                	xor    %ax,%ax
    191a:	50                   	push   %ax
    191b:	b0 02                	mov    $0x2,%al
    191d:	50                   	push   %ax
    191e:	b0 00                	mov    $0x0,%al
    1920:	50                   	push   %ax
    1921:	b0 01                	mov    $0x1,%al
    1923:	50                   	push   %ax
    1924:	31 c0                	xor    %ax,%ax
    1926:	50                   	push   %ax
    1927:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    192c:	eb 2c                	jmp    0x195a
    192e:	ff 76 e0             	push   -0x20(%bp)
    1931:	ff 76 de             	push   -0x22(%bp)
    1934:	ff 36 ae 3c          	push   0x3cae
    1938:	b8 4e 00             	mov    $0x4e,%ax
    193b:	50                   	push   %ax
    193c:	b8 01 00             	mov    $0x1,%ax
    193f:	50                   	push   %ax
    1940:	ff 76 e4             	push   -0x1c(%bp)
    1943:	ff 76 e2             	push   -0x1e(%bp)
    1946:	31 c0                	xor    %ax,%ax
    1948:	50                   	push   %ax
    1949:	b0 02                	mov    $0x2,%al
    194b:	50                   	push   %ax
    194c:	b0 00                	mov    $0x0,%al
    194e:	50                   	push   %ax
    194f:	b0 01                	mov    $0x1,%al
    1951:	50                   	push   %ax
    1952:	31 c0                	xor    %ax,%ax
    1954:	50                   	push   %ax
    1955:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    195a:	ff 76 d8             	push   -0x28(%bp)
    195d:	ff 76 d6             	push   -0x2a(%bp)
    1960:	b8 6b 00             	mov    $0x6b,%ax
    1963:	50                   	push   %ax
    1964:	b8 28 00             	mov    $0x28,%ax
    1967:	50                   	push   %ax
    1968:	b8 01 00             	mov    $0x1,%ax
    196b:	50                   	push   %ax
    196c:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    1971:	8d 7e c8             	lea    -0x38(%bp),%di
    1974:	16                   	push   %ss
    1975:	57                   	push   %di
    1976:	8d 7e c2             	lea    -0x3e(%bp),%di
    1979:	16                   	push   %ss
    197a:	57                   	push   %di
    197b:	9a ad 0f a3 0c       	lcall  $0xca3,$0xfad
    1980:	9a 00 00 bf 0a       	lcall  $0xabf,$0x0
    1985:	9a 00 00 85 0c       	lcall  $0xc85,$0x0
    198a:	8a 46 cd             	mov    -0x33(%bp),%al
    198d:	30 e4                	xor    %ah,%ah
    198f:	8b f8                	mov    %ax,%di
    1991:	d1 e7                	shl    %di
    1993:	8b 43 ee             	mov    -0x12(%bp,%di),%ax
    1996:	31 d2                	xor    %dx,%dx
    1998:	9a 6e 0c ce 1d       	lcall  $0x1dce,$0xc6e
    199d:	52                   	push   %dx
    199e:	53                   	push   %bx
    199f:	50                   	push   %ax
    19a0:	b8 8a 00             	mov    $0x8a,%ax
    19a3:	31 db                	xor    %bx,%bx
    19a5:	ba 00 7a             	mov    $0x7a00,%dx
    19a8:	8b 4e c2             	mov    -0x3e(%bp),%cx
    19ab:	8b 76 c4             	mov    -0x3c(%bp),%si
    19ae:	8b 7e c6             	mov    -0x3a(%bp),%di
    19b1:	9a 5a 0c ce 1d       	lcall  $0x1dce,$0xc5a
    19b6:	59                   	pop    %cx
    19b7:	5e                   	pop    %si
    19b8:	5f                   	pop    %di
    19b9:	9a 6a 0c ce 1d       	lcall  $0x1dce,$0xc6a
    19be:	72 b1                	jb     0x1971
    19c0:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    19c5:	3d 1b 01             	cmp    $0x11b,%ax
    19c8:	75 03                	jne    0x19cd
    19ca:	e9 4f 02             	jmp    0x1c1c
    19cd:	fe 46 cd             	incb   -0x33(%bp)
    19d0:	8a 46 cd             	mov    -0x33(%bp),%al
    19d3:	3a 46 cc             	cmp    -0x34(%bp),%al
    19d6:	77 03                	ja     0x19db
    19d8:	e9 8f fb             	jmp    0x156a
    19db:	a1 f2 3b             	mov    0x3bf2,%ax
    19de:	d1 e0                	shl    %ax
    19e0:	8b f0                	mov    %ax,%si
    19e2:	d1 e0                	shl    %ax
    19e4:	03 c6                	add    %si,%ax
    19e6:	8b c8                	mov    %ax,%cx
    19e8:	a0 02 3a             	mov    0x3a02,%al
    19eb:	30 e4                	xor    %ah,%ah
    19ed:	ba 48 00             	mov    $0x48,%dx
    19f0:	f7 e2                	mul    %dx
    19f2:	8b f8                	mov    %ax,%di
    19f4:	03 f9                	add    %cx,%di
    19f6:	81 c7 82 37          	add    $0x3782,%di
    19fa:	89 7e be             	mov    %di,-0x42(%bp)
    19fd:	8c 5e c0             	mov    %ds,-0x40(%bp)
    1a00:	80 3e 02 3a 01       	cmpb   $0x1,0x3a02
    1a05:	75 2f                	jne    0x1a36
    1a07:	83 3e f2 3b 03       	cmpw   $0x3,0x3bf2
    1a0c:	7e 10                	jle    0x1a1e
    1a0e:	a0 f2 3b             	mov    0x3bf2,%al
    1a11:	50                   	push   %ax
    1a12:	bf b4 13             	mov    $0x13b4,%di
    1a15:	0e                   	push   %cs
    1a16:	57                   	push   %di
    1a17:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    1a1c:	74 0c                	je     0x1a2a
    1a1e:	c7 46 d4 40 00       	movw   $0x40,-0x2c(%bp)
    1a23:	c7 46 d2 8a 00       	movw   $0x8a,-0x2e(%bp)
    1a28:	eb 0a                	jmp    0x1a34
    1a2a:	c7 46 d4 66 00       	movw   $0x66,-0x2c(%bp)
    1a2f:	c7 46 d2 89 00       	movw   $0x89,-0x2e(%bp)
    1a34:	eb 2d                	jmp    0x1a63
    1a36:	83 3e f2 3b 03       	cmpw   $0x3,0x3bf2
    1a3b:	7e 10                	jle    0x1a4d
    1a3d:	a0 f2 3b             	mov    0x3bf2,%al
    1a40:	50                   	push   %ax
    1a41:	bf b4 13             	mov    $0x13b4,%di
    1a44:	0e                   	push   %cs
    1a45:	57                   	push   %di
    1a46:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    1a4b:	74 0c                	je     0x1a59
    1a4d:	c7 46 d4 fd 01       	movw   $0x1fd,-0x2c(%bp)
    1a52:	c7 46 d2 89 00       	movw   $0x89,-0x2e(%bp)
    1a57:	eb 0a                	jmp    0x1a63
    1a59:	c7 46 d4 20 02       	movw   $0x220,-0x2c(%bp)
    1a5e:	c7 46 d2 8a 00       	movw   $0x8a,-0x2e(%bp)
    1a63:	a1 4e 3b             	mov    0x3b4e,%ax
    1a66:	31 d2                	xor    %dx,%dx
    1a68:	b9 03 00             	mov    $0x3,%cx
    1a6b:	f7 f1                	div    %cx
    1a6d:	8b d8                	mov    %ax,%bx
    1a6f:	c4 7e be             	les    -0x42(%bp),%di
    1a72:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1a76:	98                   	cbtw
    1a77:	d1 e0                	shl    %ax
    1a79:	8b c8                	mov    %ax,%cx
    1a7b:	c4 7e be             	les    -0x42(%bp),%di
    1a7e:	26 8a 05             	mov    %es:(%di),%al
    1a81:	98                   	cbtw
    1a82:	ba 12 00             	mov    $0x12,%dx
    1a85:	f7 e2                	mul    %dx
    1a87:	8b f8                	mov    %ax,%di
    1a89:	03 f9                	add    %cx,%di
    1a8b:	8b 85 a0 3a          	mov    0x3aa0(%di),%ax
    1a8f:	03 c3                	add    %bx,%ax
    1a91:	89 46 d0             	mov    %ax,-0x30(%bp)
    1a94:	a1 50 3b             	mov    0x3b50,%ax
    1a97:	31 d2                	xor    %dx,%dx
    1a99:	b9 02 00             	mov    $0x2,%cx
    1a9c:	f7 f1                	div    %cx
    1a9e:	8b d8                	mov    %ax,%bx
    1aa0:	c4 7e be             	les    -0x42(%bp),%di
    1aa3:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1aa7:	98                   	cbtw
    1aa8:	d1 e0                	shl    %ax
    1aaa:	8b c8                	mov    %ax,%cx
    1aac:	c4 7e be             	les    -0x42(%bp),%di
    1aaf:	26 8a 05             	mov    %es:(%di),%al
    1ab2:	98                   	cbtw
    1ab3:	ba 12 00             	mov    $0x12,%dx
    1ab6:	f7 e2                	mul    %dx
    1ab8:	8b f8                	mov    %ax,%di
    1aba:	03 f9                	add    %cx,%di
    1abc:	8b 85 e8 3a          	mov    0x3ae8(%di),%ax
    1ac0:	03 c3                	add    %bx,%ax
    1ac2:	89 46 ce             	mov    %ax,-0x32(%bp)
    1ac5:	ff 76 d4             	push   -0x2c(%bp)
    1ac8:	ff 76 d2             	push   -0x2e(%bp)
    1acb:	ff 76 d0             	push   -0x30(%bp)
    1ace:	ff 76 ce             	push   -0x32(%bp)
    1ad1:	0e                   	push   %cs
    1ad2:	e8 88 ed             	call   0x85d
    1ad5:	c4 7e be             	les    -0x42(%bp),%di
    1ad8:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1adc:	98                   	cbtw
    1add:	d1 e0                	shl    %ax
    1adf:	d1 e0                	shl    %ax
    1ae1:	8b c8                	mov    %ax,%cx
    1ae3:	c4 7e be             	les    -0x42(%bp),%di
    1ae6:	26 8a 05             	mov    %es:(%di),%al
    1ae9:	98                   	cbtw
    1aea:	ba 24 00             	mov    $0x24,%dx
    1aed:	f7 e2                	mul    %dx
    1aef:	8b f8                	mov    %ax,%di
    1af1:	03 f9                	add    %cx,%di
    1af3:	ff b5 38 39          	push   0x3938(%di)
    1af7:	ff b5 36 39          	push   0x3936(%di)
    1afb:	31 c0                	xor    %ax,%ax
    1afd:	50                   	push   %ax
    1afe:	c4 7e be             	les    -0x42(%bp),%di
    1b01:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1b05:	98                   	cbtw
    1b06:	d1 e0                	shl    %ax
    1b08:	8b c8                	mov    %ax,%cx
    1b0a:	c4 7e be             	les    -0x42(%bp),%di
    1b0d:	26 8a 05             	mov    %es:(%di),%al
    1b10:	98                   	cbtw
    1b11:	ba 12 00             	mov    $0x12,%dx
    1b14:	f7 e2                	mul    %dx
    1b16:	8b f8                	mov    %ax,%di
    1b18:	03 f9                	add    %cx,%di
    1b1a:	ff b5 a0 3a          	push   0x3aa0(%di)
    1b1e:	c4 7e be             	les    -0x42(%bp),%di
    1b21:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1b25:	98                   	cbtw
    1b26:	d1 e0                	shl    %ax
    1b28:	8b c8                	mov    %ax,%cx
    1b2a:	c4 7e be             	les    -0x42(%bp),%di
    1b2d:	26 8a 05             	mov    %es:(%di),%al
    1b30:	98                   	cbtw
    1b31:	ba 12 00             	mov    $0x12,%dx
    1b34:	f7 e2                	mul    %dx
    1b36:	8b f8                	mov    %ax,%di
    1b38:	03 f9                	add    %cx,%di
    1b3a:	ff b5 e8 3a          	push   0x3ae8(%di)
    1b3e:	31 c0                	xor    %ax,%ax
    1b40:	50                   	push   %ax
    1b41:	b0 02                	mov    $0x2,%al
    1b43:	50                   	push   %ax
    1b44:	b0 00                	mov    $0x0,%al
    1b46:	50                   	push   %ax
    1b47:	b0 01                	mov    $0x1,%al
    1b49:	50                   	push   %ax
    1b4a:	31 c0                	xor    %ax,%ax
    1b4c:	50                   	push   %ax
    1b4d:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    1b52:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    1b57:	75 1e                	jne    0x1b77
    1b59:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    1b5e:	eb 03                	jmp    0x1b63
    1b60:	ff 46 fe             	incw   -0x2(%bp)
    1b63:	b8 14 00             	mov    $0x14,%ax
    1b66:	50                   	push   %ax
    1b67:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    1b6c:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    1b71:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    1b75:	75 e9                	jne    0x1b60
    1b77:	ff 76 ea             	push   -0x16(%bp)
    1b7a:	ff 76 e8             	push   -0x18(%bp)
    1b7d:	31 c0                	xor    %ax,%ax
    1b7f:	50                   	push   %ax
    1b80:	ff 76 d8             	push   -0x28(%bp)
    1b83:	ff 76 d6             	push   -0x2a(%bp)
    1b86:	b8 01 00             	mov    $0x1,%ax
    1b89:	50                   	push   %ax
    1b8a:	b0 02                	mov    $0x2,%al
    1b8c:	50                   	push   %ax
    1b8d:	b0 00                	mov    $0x0,%al
    1b8f:	50                   	push   %ax
    1b90:	b0 01                	mov    $0x1,%al
    1b92:	50                   	push   %ax
    1b93:	31 c0                	xor    %ax,%ax
    1b95:	50                   	push   %ax
    1b96:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    1b9b:	ff 76 ee             	push   -0x12(%bp)
    1b9e:	ff 76 ec             	push   -0x14(%bp)
    1ba1:	31 c0                	xor    %ax,%ax
    1ba3:	50                   	push   %ax
    1ba4:	ff 76 d8             	push   -0x28(%bp)
    1ba7:	8b 46 d6             	mov    -0x2a(%bp),%ax
    1baa:	05 28 00             	add    $0x28,%ax
    1bad:	50                   	push   %ax
    1bae:	b8 01 00             	mov    $0x1,%ax
    1bb1:	50                   	push   %ax
    1bb2:	b0 02                	mov    $0x2,%al
    1bb4:	50                   	push   %ax
    1bb5:	b0 00                	mov    $0x0,%al
    1bb7:	50                   	push   %ax
    1bb8:	b0 01                	mov    $0x1,%al
    1bba:	50                   	push   %ax
    1bbb:	31 c0                	xor    %ax,%ax
    1bbd:	50                   	push   %ax
    1bbe:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    1bc3:	ff 76 d8             	push   -0x28(%bp)
    1bc6:	ff 76 d6             	push   -0x2a(%bp)
    1bc9:	b8 6b 00             	mov    $0x6b,%ax
    1bcc:	50                   	push   %ax
    1bcd:	ff 36 b0 3c          	push   0x3cb0
    1bd1:	b8 01 00             	mov    $0x1,%ax
    1bd4:	50                   	push   %ax
    1bd5:	ff 76 dc             	push   -0x24(%bp)
    1bd8:	ff 76 da             	push   -0x26(%bp)
    1bdb:	31 c0                	xor    %ax,%ax
    1bdd:	50                   	push   %ax
    1bde:	b0 02                	mov    $0x2,%al
    1be0:	50                   	push   %ax
    1be1:	b0 00                	mov    $0x0,%al
    1be3:	50                   	push   %ax
    1be4:	b0 01                	mov    $0x1,%al
    1be6:	50                   	push   %ax
    1be7:	31 c0                	xor    %ax,%ax
    1be9:	50                   	push   %ax
    1bea:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    1bef:	ff 76 d8             	push   -0x28(%bp)
    1bf2:	ff 76 d6             	push   -0x2a(%bp)
    1bf5:	b8 6b 00             	mov    $0x6b,%ax
    1bf8:	50                   	push   %ax
    1bf9:	b8 28 00             	mov    $0x28,%ax
    1bfc:	50                   	push   %ax
    1bfd:	b8 01 00             	mov    $0x1,%ax
    1c00:	50                   	push   %ax
    1c01:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    1c06:	ff 76 ee             	push   -0x12(%bp)
    1c09:	ff 76 ec             	push   -0x14(%bp)
    1c0c:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    1c11:	ff 76 ea             	push   -0x16(%bp)
    1c14:	ff 76 e8             	push   -0x18(%bp)
    1c17:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    1c1c:	89 ec                	mov    %bp,%sp
    1c1e:	5d                   	pop    %bp
    1c1f:	cb                   	lret
    1c20:	55                   	push   %bp
    1c21:	89 e5                	mov    %sp,%bp
    1c23:	83 ec 06             	sub    $0x6,%sp
    1c26:	80 3e f4 3b 00       	cmpb   $0x0,0x3bf4
    1c2b:	74 03                	je     0x1c30
    1c2d:	e9 cc 00             	jmp    0x1cfc
    1c30:	a1 f2 3b             	mov    0x3bf2,%ax
    1c33:	d1 e0                	shl    %ax
    1c35:	8b f0                	mov    %ax,%si
    1c37:	d1 e0                	shl    %ax
    1c39:	03 c6                	add    %si,%ax
    1c3b:	8b c8                	mov    %ax,%cx
    1c3d:	a0 02 3a             	mov    0x3a02,%al
    1c40:	30 e4                	xor    %ah,%ah
    1c42:	ba 48 00             	mov    $0x48,%dx
    1c45:	f7 e2                	mul    %dx
    1c47:	8b f8                	mov    %ax,%di
    1c49:	03 f9                	add    %cx,%di
    1c4b:	81 c7 82 37          	add    $0x3782,%di
    1c4f:	89 7e fa             	mov    %di,-0x6(%bp)
    1c52:	8c 5e fc             	mov    %ds,-0x4(%bp)
    1c55:	a0 02 3a             	mov    0x3a02,%al
    1c58:	30 e4                	xor    %ah,%ah
    1c5a:	8b f8                	mov    %ax,%di
    1c5c:	fe 8d a9 30          	decb   0x30a9(%di)
    1c60:	fe 06 08 3a          	incb   0x3a08
    1c64:	a0 08 3a             	mov    0x3a08,%al
    1c67:	50                   	push   %ax
    1c68:	c4 7e fa             	les    -0x6(%bp),%di
    1c6b:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1c6f:	98                   	cbtw
    1c70:	8b d8                	mov    %ax,%bx
    1c72:	c4 7e fa             	les    -0x6(%bp),%di
    1c75:	26 8a 05             	mov    %es:(%di),%al
    1c78:	98                   	cbtw
    1c79:	ba 09 00             	mov    $0x9,%dx
    1c7c:	f7 e2                	mul    %dx
    1c7e:	8b c8                	mov    %ax,%cx
    1c80:	a0 02 3a             	mov    0x3a02,%al
    1c83:	30 e4                	xor    %ah,%ah
    1c85:	ba 24 00             	mov    $0x24,%dx
    1c88:	f7 e2                	mul    %dx
    1c8a:	8b f8                	mov    %ax,%di
    1c8c:	03 f9                	add    %cx,%di
    1c8e:	03 fb                	add    %bx,%di
    1c90:	58                   	pop    %ax
    1c91:	88 85 e7 2f          	mov    %al,0x2fe7(%di)
    1c95:	8a 1e 08 3a          	mov    0x3a08,%bl
    1c99:	c4 7e fa             	les    -0x6(%bp),%di
    1c9c:	26 8a 45 01          	mov    %es:0x1(%di),%al
    1ca0:	98                   	cbtw
    1ca1:	8b c8                	mov    %ax,%cx
    1ca3:	c4 7e fa             	les    -0x6(%bp),%di
    1ca6:	26 8a 05             	mov    %es:(%di),%al
    1ca9:	98                   	cbtw
    1caa:	ba 09 00             	mov    $0x9,%dx
    1cad:	f7 e2                	mul    %dx
    1caf:	8b f8                	mov    %ax,%di
    1cb1:	03 f9                	add    %cx,%di
    1cb3:	88 9d 77 30          	mov    %bl,0x3077(%di)
    1cb7:	0e                   	push   %cs
    1cb8:	e8 19 f7             	call   0x13d4
    1cbb:	c4 7e fa             	les    -0x6(%bp),%di
    1cbe:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    1cc3:	7f 0d                	jg     0x1cd2
    1cc5:	c4 7e fa             	les    -0x6(%bp),%di
    1cc8:	26 8a 05             	mov    %es:(%di),%al
    1ccb:	98                   	cbtw
    1ccc:	8b f8                	mov    %ax,%di
    1cce:	fe 8d bd 38          	decb   0x38bd(%di)
    1cd2:	c4 7e fa             	les    -0x6(%bp),%di
    1cd5:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    1cda:	7c 0d                	jl     0x1ce9
    1cdc:	c4 7e fa             	les    -0x6(%bp),%di
    1cdf:	26 8a 05             	mov    %es:(%di),%al
    1ce2:	98                   	cbtw
    1ce3:	8b f8                	mov    %ax,%di
    1ce5:	fe 85 c1 38          	incb   0x38c1(%di)
    1ce9:	b8 2c 01             	mov    $0x12c,%ax
    1cec:	50                   	push   %ax
    1ced:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    1cf2:	c4 7e fa             	les    -0x6(%bp),%di
    1cf5:	26 c6 05 00          	movb   $0x0,%es:(%di)
    1cf9:	e9 21 01             	jmp    0x1e1d
    1cfc:	a0 02 3a             	mov    0x3a02,%al
    1cff:	30 e4                	xor    %ah,%ah
    1d01:	8b f8                	mov    %ax,%di
    1d03:	d1 e7                	shl    %di
    1d05:	83 bd a6 38 00       	cmpw   $0x0,0x38a6(%di)
    1d0a:	7f 0b                	jg     0x1d17
    1d0c:	a0 02 3a             	mov    0x3a02,%al
    1d0f:	50                   	push   %ax
    1d10:	0e                   	push   %cs
    1d11:	e8 b7 e8             	call   0x5cb
    1d14:	e9 a5 00             	jmp    0x1dbc
    1d17:	b0 04                	mov    $0x4,%al
    1d19:	50                   	push   %ax
    1d1a:	0e                   	push   %cs
    1d1b:	e8 e2 e2             	call   0x0
    1d1e:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    1d23:	3d 1b 01             	cmp    $0x11b,%ax
    1d26:	75 03                	jne    0x1d2b
    1d28:	e9 f2 00             	jmp    0x1e1d
    1d2b:	a0 02 3a             	mov    0x3a02,%al
    1d2e:	50                   	push   %ax
    1d2f:	b0 01                	mov    $0x1,%al
    1d31:	50                   	push   %ax
    1d32:	0e                   	push   %cs
    1d33:	e8 47 e6             	call   0x37d
    1d36:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    1d3b:	3d 1b 01             	cmp    $0x11b,%ax
    1d3e:	75 03                	jne    0x1d43
    1d40:	e9 da 00             	jmp    0x1e1d
    1d43:	a0 02 3a             	mov    0x3a02,%al
    1d46:	50                   	push   %ax
    1d47:	b0 02                	mov    $0x2,%al
    1d49:	50                   	push   %ax
    1d4a:	0e                   	push   %cs
    1d4b:	e8 2f e6             	call   0x37d
    1d4e:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    1d53:	3d 1b 01             	cmp    $0x11b,%ax
    1d56:	75 03                	jne    0x1d5b
    1d58:	e9 c2 00             	jmp    0x1e1d
    1d5b:	a0 02 3a             	mov    0x3a02,%al
    1d5e:	50                   	push   %ax
    1d5f:	0e                   	push   %cs
    1d60:	e8 b3 ed             	call   0xb16
    1d63:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    1d68:	75 27                	jne    0x1d91
    1d6a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    1d6f:	eb 03                	jmp    0x1d74
    1d71:	ff 46 fe             	incw   -0x2(%bp)
    1d74:	b8 70 17             	mov    $0x1770,%ax
    1d77:	50                   	push   %ax
    1d78:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    1d7d:	b8 05 00             	mov    $0x5,%ax
    1d80:	50                   	push   %ax
    1d81:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    1d86:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    1d8b:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    1d8f:	75 e0                	jne    0x1d71
    1d91:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    1d96:	3d 1b 01             	cmp    $0x11b,%ax
    1d99:	75 03                	jne    0x1d9e
    1d9b:	e9 7f 00             	jmp    0x1e1d
    1d9e:	a0 02 3a             	mov    0x3a02,%al
    1da1:	50                   	push   %ax
    1da2:	b0 03                	mov    $0x3,%al
    1da4:	50                   	push   %ax
    1da5:	0e                   	push   %cs
    1da6:	e8 d4 e5             	call   0x37d
    1da9:	b0 05                	mov    $0x5,%al
    1dab:	50                   	push   %ax
    1dac:	0e                   	push   %cs
    1dad:	e8 50 e2             	call   0x0
    1db0:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    1db5:	3d 1b 01             	cmp    $0x11b,%ax
    1db8:	75 02                	jne    0x1dbc
    1dba:	eb 61                	jmp    0x1e1d
    1dbc:	a0 02 3a             	mov    0x3a02,%al
    1dbf:	30 e4                	xor    %ah,%ah
    1dc1:	8b f8                	mov    %ax,%di
    1dc3:	d1 e7                	shl    %di
    1dc5:	8b 85 a6 38          	mov    0x38a6(%di),%ax
    1dc9:	2d 0a 00             	sub    $0xa,%ax
    1dcc:	8b d0                	mov    %ax,%dx
    1dce:	a0 02 3a             	mov    0x3a02,%al
    1dd1:	30 e4                	xor    %ah,%ah
    1dd3:	8b f8                	mov    %ax,%di
    1dd5:	d1 e7                	shl    %di
    1dd7:	89 95 a6 38          	mov    %dx,0x38a6(%di)
    1ddb:	a0 02 3a             	mov    0x3a02,%al
    1dde:	30 e4                	xor    %ah,%ah
    1de0:	8b f8                	mov    %ax,%di
    1de2:	d1 e7                	shl    %di
    1de4:	ff b5 a6 38          	push   0x38a6(%di)
    1de8:	b8 04 00             	mov    $0x4,%ax
    1deb:	50                   	push   %ax
    1dec:	a0 02 3a             	mov    0x3a02,%al
    1def:	30 e4                	xor    %ah,%ah
    1df1:	8b f8                	mov    %ax,%di
    1df3:	d1 e7                	shl    %di
    1df5:	ff b5 ac 38          	push   0x38ac(%di)
    1df9:	a0 02 3a             	mov    0x3a02,%al
    1dfc:	30 e4                	xor    %ah,%ah
    1dfe:	8b f8                	mov    %ax,%di
    1e00:	d1 e7                	shl    %di
    1e02:	ff b5 b2 38          	push   0x38b2(%di)
    1e06:	9a cd 11 02 06       	lcall  $0x602,$0x11cd
    1e0b:	a1 bc 38             	mov    0x38bc,%ax
    1e0e:	05 0a 00             	add    $0xa,%ax
    1e11:	a3 bc 38             	mov    %ax,0x38bc
    1e14:	ff 36 bc 38          	push   0x38bc
    1e18:	9a d3 10 02 06       	lcall  $0x602,$0x10d3
    1e1d:	89 ec                	mov    %bp,%sp
    1e1f:	5d                   	pop    %bp
    1e20:	cb                   	lret
    1e21:	55                   	push   %bp
    1e22:	89 e5                	mov    %sp,%bp
    1e24:	83 ec 08             	sub    $0x8,%sp
    1e27:	c6 46 ff 00          	movb   $0x0,-0x1(%bp)
    1e2b:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    1e30:	eb 03                	jmp    0x1e35
    1e32:	ff 46 fc             	incw   -0x4(%bp)
    1e35:	8b 46 fc             	mov    -0x4(%bp),%ax
    1e38:	d1 e0                	shl    %ax
    1e3a:	8b f0                	mov    %ax,%si
    1e3c:	d1 e0                	shl    %ax
    1e3e:	03 c6                	add    %si,%ax
    1e40:	8b c8                	mov    %ax,%cx
    1e42:	a0 02 3a             	mov    0x3a02,%al
    1e45:	30 e4                	xor    %ah,%ah
    1e47:	ba 48 00             	mov    $0x48,%dx
    1e4a:	f7 e2                	mul    %dx
    1e4c:	8b f8                	mov    %ax,%di
    1e4e:	03 f9                	add    %cx,%di
    1e50:	81 c7 82 37          	add    $0x3782,%di
    1e54:	89 7e f8             	mov    %di,-0x8(%bp)
    1e57:	8c 5e fa             	mov    %ds,-0x6(%bp)
    1e5a:	c4 7e f8             	les    -0x8(%bp),%di
    1e5d:	26 80 3d 00          	cmpb   $0x0,%es:(%di)
    1e61:	74 6d                	je     0x1ed0
    1e63:	8b 46 08             	mov    0x8(%bp),%ax
    1e66:	99                   	cwtd
    1e67:	8b c8                	mov    %ax,%cx
    1e69:	8b da                	mov    %dx,%bx
    1e6b:	c4 7e f8             	les    -0x8(%bp),%di
    1e6e:	26 8b 45 02          	mov    %es:0x2(%di),%ax
    1e72:	31 d2                	xor    %dx,%dx
    1e74:	3b d3                	cmp    %bx,%dx
    1e76:	7c 06                	jl     0x1e7e
    1e78:	7f 56                	jg     0x1ed0
    1e7a:	3b c1                	cmp    %cx,%ax
    1e7c:	77 52                	ja     0x1ed0
    1e7e:	c4 7e f8             	les    -0x8(%bp),%di
    1e81:	26 8b 45 02          	mov    %es:0x2(%di),%ax
    1e85:	8b 7e fc             	mov    -0x4(%bp),%di
    1e88:	d1 e7                	shl    %di
    1e8a:	03 85 a4 3a          	add    0x3aa4(%di),%ax
    1e8e:	31 d2                	xor    %dx,%dx
    1e90:	8b c8                	mov    %ax,%cx
    1e92:	8b da                	mov    %dx,%bx
    1e94:	8b 46 08             	mov    0x8(%bp),%ax
    1e97:	99                   	cwtd
    1e98:	3b d3                	cmp    %bx,%dx
    1e9a:	7c 06                	jl     0x1ea2
    1e9c:	7f 32                	jg     0x1ed0
    1e9e:	3b c1                	cmp    %cx,%ax
    1ea0:	73 2e                	jae    0x1ed0
    1ea2:	8b 46 06             	mov    0x6(%bp),%ax
    1ea5:	99                   	cwtd
    1ea6:	8b c8                	mov    %ax,%cx
    1ea8:	8b da                	mov    %dx,%bx
    1eaa:	c4 7e f8             	les    -0x8(%bp),%di
    1ead:	26 8b 45 04          	mov    %es:0x4(%di),%ax
    1eb1:	31 d2                	xor    %dx,%dx
    1eb3:	3b d3                	cmp    %bx,%dx
    1eb5:	7c 06                	jl     0x1ebd
    1eb7:	7f 17                	jg     0x1ed0
    1eb9:	3b c1                	cmp    %cx,%ax
    1ebb:	77 13                	ja     0x1ed0
    1ebd:	81 7e 06 5e 01       	cmpw   $0x15e,0x6(%bp)
    1ec2:	7d 0c                	jge    0x1ed0
    1ec4:	c6 46 ff 01          	movb   $0x1,-0x1(%bp)
    1ec8:	8b 46 fc             	mov    -0x4(%bp),%ax
    1ecb:	a3 04 3a             	mov    %ax,0x3a04
    1ece:	eb 09                	jmp    0x1ed9
    1ed0:	83 7e fc 0c          	cmpw   $0xc,-0x4(%bp)
    1ed4:	74 03                	je     0x1ed9
    1ed6:	e9 59 ff             	jmp    0x1e32
    1ed9:	8a 46 ff             	mov    -0x1(%bp),%al
    1edc:	89 ec                	mov    %bp,%sp
    1ede:	5d                   	pop    %bp
    1edf:	ca 04 00             	lret   $0x4
    1ee2:	55                   	push   %bp
    1ee3:	89 e5                	mov    %sp,%bp
    1ee5:	83 ec 0c             	sub    $0xc,%sp
    1ee8:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    1eed:	eb 03                	jmp    0x1ef2
    1eef:	ff 46 fe             	incw   -0x2(%bp)
    1ef2:	8b 46 fe             	mov    -0x2(%bp),%ax
    1ef5:	d1 e0                	shl    %ax
    1ef7:	8b f0                	mov    %ax,%si
    1ef9:	d1 e0                	shl    %ax
    1efb:	03 c6                	add    %si,%ax
    1efd:	8b c8                	mov    %ax,%cx
    1eff:	8a 46 06             	mov    0x6(%bp),%al
    1f02:	30 e4                	xor    %ah,%ah
    1f04:	ba 48 00             	mov    $0x48,%dx
    1f07:	f7 e2                	mul    %dx
    1f09:	8b f8                	mov    %ax,%di
    1f0b:	03 f9                	add    %cx,%di
    1f0d:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    1f12:	74 03                	je     0x1f17
    1f14:	e9 f5 00             	jmp    0x200c
    1f17:	8b 46 fe             	mov    -0x2(%bp),%ax
    1f1a:	3d 0b 00             	cmp    $0xb,%ax
    1f1d:	7e 03                	jle    0x1f22
    1f1f:	e9 ea 00             	jmp    0x200c
    1f22:	89 46 fc             	mov    %ax,-0x4(%bp)
    1f25:	eb 03                	jmp    0x1f2a
    1f27:	ff 46 fc             	incw   -0x4(%bp)
    1f2a:	8b 46 fc             	mov    -0x4(%bp),%ax
    1f2d:	d1 e0                	shl    %ax
    1f2f:	8b f0                	mov    %ax,%si
    1f31:	d1 e0                	shl    %ax
    1f33:	03 c6                	add    %si,%ax
    1f35:	8b c8                	mov    %ax,%cx
    1f37:	8a 46 06             	mov    0x6(%bp),%al
    1f3a:	30 e4                	xor    %ah,%ah
    1f3c:	ba 48 00             	mov    $0x48,%dx
    1f3f:	f7 e2                	mul    %dx
    1f41:	8b f8                	mov    %ax,%di
    1f43:	03 f9                	add    %cx,%di
    1f45:	81 c7 82 37          	add    $0x3782,%di
    1f49:	1e                   	push   %ds
    1f4a:	57                   	push   %di
    1f4b:	8d 7e f6             	lea    -0xa(%bp),%di
    1f4e:	16                   	push   %ss
    1f4f:	57                   	push   %di
    1f50:	b8 06 00             	mov    $0x6,%ax
    1f53:	50                   	push   %ax
    1f54:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    1f59:	8b 46 fc             	mov    -0x4(%bp),%ax
    1f5c:	40                   	inc    %ax
    1f5d:	d1 e0                	shl    %ax
    1f5f:	8b f0                	mov    %ax,%si
    1f61:	d1 e0                	shl    %ax
    1f63:	03 c6                	add    %si,%ax
    1f65:	8b c8                	mov    %ax,%cx
    1f67:	8a 46 06             	mov    0x6(%bp),%al
    1f6a:	30 e4                	xor    %ah,%ah
    1f6c:	ba 48 00             	mov    $0x48,%dx
    1f6f:	f7 e2                	mul    %dx
    1f71:	8b f8                	mov    %ax,%di
    1f73:	03 f9                	add    %cx,%di
    1f75:	81 c7 82 37          	add    $0x3782,%di
    1f79:	1e                   	push   %ds
    1f7a:	57                   	push   %di
    1f7b:	8b 46 fc             	mov    -0x4(%bp),%ax
    1f7e:	d1 e0                	shl    %ax
    1f80:	8b f0                	mov    %ax,%si
    1f82:	d1 e0                	shl    %ax
    1f84:	03 c6                	add    %si,%ax
    1f86:	8b c8                	mov    %ax,%cx
    1f88:	8a 46 06             	mov    0x6(%bp),%al
    1f8b:	30 e4                	xor    %ah,%ah
    1f8d:	ba 48 00             	mov    $0x48,%dx
    1f90:	f7 e2                	mul    %dx
    1f92:	8b f8                	mov    %ax,%di
    1f94:	03 f9                	add    %cx,%di
    1f96:	81 c7 82 37          	add    $0x3782,%di
    1f9a:	1e                   	push   %ds
    1f9b:	57                   	push   %di
    1f9c:	b8 06 00             	mov    $0x6,%ax
    1f9f:	50                   	push   %ax
    1fa0:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    1fa5:	8d 7e f6             	lea    -0xa(%bp),%di
    1fa8:	16                   	push   %ss
    1fa9:	57                   	push   %di
    1faa:	8b 46 fc             	mov    -0x4(%bp),%ax
    1fad:	40                   	inc    %ax
    1fae:	d1 e0                	shl    %ax
    1fb0:	8b f0                	mov    %ax,%si
    1fb2:	d1 e0                	shl    %ax
    1fb4:	03 c6                	add    %si,%ax
    1fb6:	8b c8                	mov    %ax,%cx
    1fb8:	8a 46 06             	mov    0x6(%bp),%al
    1fbb:	30 e4                	xor    %ah,%ah
    1fbd:	ba 48 00             	mov    $0x48,%dx
    1fc0:	f7 e2                	mul    %dx
    1fc2:	8b f8                	mov    %ax,%di
    1fc4:	03 f9                	add    %cx,%di
    1fc6:	81 c7 82 37          	add    $0x3782,%di
    1fca:	1e                   	push   %ds
    1fcb:	57                   	push   %di
    1fcc:	b8 06 00             	mov    $0x6,%ax
    1fcf:	50                   	push   %ax
    1fd0:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    1fd5:	80 7e 06 03          	cmpb   $0x3,0x6(%bp)
    1fd9:	75 28                	jne    0x2003
    1fdb:	8b 7e fc             	mov    -0x4(%bp),%di
    1fde:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    1fe2:	88 46 f5             	mov    %al,-0xb(%bp)
    1fe5:	8b 46 fc             	mov    -0x4(%bp),%ax
    1fe8:	40                   	inc    %ax
    1fe9:	8b f8                	mov    %ax,%di
    1feb:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    1fef:	8b 7e fc             	mov    -0x4(%bp),%di
    1ff2:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    1ff6:	8a 56 f5             	mov    -0xb(%bp),%dl
    1ff9:	8b 46 fc             	mov    -0x4(%bp),%ax
    1ffc:	40                   	inc    %ax
    1ffd:	8b f8                	mov    %ax,%di
    1fff:	88 95 dd 2f          	mov    %dl,0x2fdd(%di)
    2003:	83 7e fc 0b          	cmpw   $0xb,-0x4(%bp)
    2007:	74 03                	je     0x200c
    2009:	e9 1b ff             	jmp    0x1f27
    200c:	83 7e fe 0b          	cmpw   $0xb,-0x2(%bp)
    2010:	74 03                	je     0x2015
    2012:	e9 da fe             	jmp    0x1eef
    2015:	89 ec                	mov    %bp,%sp
    2017:	5d                   	pop    %bp
    2018:	ca 02 00             	lret   $0x2
    201b:	55                   	push   %bp
    201c:	89 e5                	mov    %sp,%bp
    201e:	83 ec 06             	sub    $0x6,%sp
    2021:	a1 04 3a             	mov    0x3a04,%ax
    2024:	d1 e0                	shl    %ax
    2026:	8b f0                	mov    %ax,%si
    2028:	d1 e0                	shl    %ax
    202a:	03 c6                	add    %si,%ax
    202c:	8b c8                	mov    %ax,%cx
    202e:	a0 02 3a             	mov    0x3a02,%al
    2031:	30 e4                	xor    %ah,%ah
    2033:	ba 48 00             	mov    $0x48,%dx
    2036:	f7 e2                	mul    %dx
    2038:	8b f8                	mov    %ax,%di
    203a:	03 f9                	add    %cx,%di
    203c:	81 c7 82 37          	add    $0x3782,%di
    2040:	89 7e fa             	mov    %di,-0x6(%bp)
    2043:	8c 5e fc             	mov    %ds,-0x4(%bp)
    2046:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    204b:	75 03                	jne    0x2050
    204d:	e9 f2 00             	jmp    0x2142
    2050:	ff 36 80 45          	push   0x4580
    2054:	ff 36 82 45          	push   0x4582
    2058:	9a 43 08 a3 0c       	lcall  $0xca3,$0x843
    205d:	bf 80 45             	mov    $0x4580,%di
    2060:	1e                   	push   %ds
    2061:	57                   	push   %di
    2062:	bf 82 45             	mov    $0x4582,%di
    2065:	1e                   	push   %ds
    2066:	57                   	push   %di
    2067:	bf 84 45             	mov    $0x4584,%di
    206a:	1e                   	push   %ds
    206b:	57                   	push   %di
    206c:	9a 76 08 a3 0c       	lcall  $0xca3,$0x876
    2071:	9a 00 00 85 0c       	lcall  $0xc85,$0x0
    2076:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    207b:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    2080:	3d 1b 01             	cmp    $0x11b,%ax
    2083:	75 03                	jne    0x2088
    2085:	e9 2b 03             	jmp    0x23b3
    2088:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    208d:	74 03                	je     0x2092
    208f:	e9 90 00             	jmp    0x2122
    2092:	bf d2 3c             	mov    $0x3cd2,%di
    2095:	1e                   	push   %ds
    2096:	57                   	push   %di
    2097:	bf da 3c             	mov    $0x3cda,%di
    209a:	1e                   	push   %ds
    209b:	57                   	push   %di
    209c:	9a ad 0f a3 0c       	lcall  $0xca3,$0xfad
    20a1:	a1 da 3c             	mov    0x3cda,%ax
    20a4:	8b 1e dc 3c          	mov    0x3cdc,%bx
    20a8:	8b 16 de 3c          	mov    0x3cde,%dx
    20ac:	9a 7a 0c ce 1d       	lcall  $0x1dce,$0xc7a
    20b1:	83 fa 00             	cmp    $0x0,%dx
    20b4:	7f 07                	jg     0x20bd
    20b6:	7c 29                	jl     0x20e1
    20b8:	3d 0a 00             	cmp    $0xa,%ax
    20bb:	72 24                	jb     0x20e1
    20bd:	a0 f6 2f             	mov    0x2ff6,%al
    20c0:	30 e4                	xor    %ah,%ah
    20c2:	8b d0                	mov    %ax,%dx
    20c4:	b8 03 00             	mov    $0x3,%ax
    20c7:	2b c2                	sub    %dx,%ax
    20c9:	a2 f6 2f             	mov    %al,0x2ff6
    20cc:	a0 f6 2f             	mov    0x2ff6,%al
    20cf:	50                   	push   %ax
    20d0:	b0 01                	mov    $0x1,%al
    20d2:	50                   	push   %ax
    20d3:	0e                   	push   %cs
    20d4:	e8 64 f0             	call   0x113b
    20d7:	bf d2 3c             	mov    $0x3cd2,%di
    20da:	1e                   	push   %ds
    20db:	57                   	push   %di
    20dc:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    20e1:	80 3e e6 3c 00       	cmpb   $0x0,0x3ce6
    20e6:	74 3a                	je     0x2122
    20e8:	bf d6 3c             	mov    $0x3cd6,%di
    20eb:	1e                   	push   %ds
    20ec:	57                   	push   %di
    20ed:	bf e0 3c             	mov    $0x3ce0,%di
    20f0:	1e                   	push   %ds
    20f1:	57                   	push   %di
    20f2:	9a ad 0f a3 0c       	lcall  $0xca3,$0xfad
    20f7:	a1 e0 3c             	mov    0x3ce0,%ax
    20fa:	8b 1e e2 3c          	mov    0x3ce2,%bx
    20fe:	8b 16 e4 3c          	mov    0x3ce4,%dx
    2102:	9a 7a 0c ce 1d       	lcall  $0x1dce,$0xc7a
    2107:	83 fa 00             	cmp    $0x0,%dx
    210a:	7f 07                	jg     0x2113
    210c:	7c 14                	jl     0x2122
    210e:	3d 03 00             	cmp    $0x3,%ax
    2111:	72 0f                	jb     0x2122
    2113:	0e                   	push   %cs
    2114:	e8 80 ed             	call   0xe97
    2117:	a0 f6 2f             	mov    0x2ff6,%al
    211a:	50                   	push   %ax
    211b:	b0 00                	mov    $0x0,%al
    211d:	50                   	push   %ax
    211e:	0e                   	push   %cs
    211f:	e8 19 f0             	call   0x113b
    2122:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    2127:	74 03                	je     0x212c
    2129:	e9 31 ff             	jmp    0x205d
    212c:	ff 36 80 45          	push   0x4580
    2130:	ff 36 82 45          	push   0x4582
    2134:	0e                   	push   %cs
    2135:	e8 e9 fc             	call   0x1e21
    2138:	08 c0                	or     %al,%al
    213a:	75 03                	jne    0x213f
    213c:	e9 1e ff             	jmp    0x205d
    213f:	e9 71 02             	jmp    0x23b3
    2142:	9a 00 00 85 0c       	lcall  $0xc85,$0x0
    2147:	9a 4b 0b 13 1b       	lcall  $0x1b13,$0xb4b
    214c:	08 c0                	or     %al,%al
    214e:	75 03                	jne    0x2153
    2150:	e9 b9 01             	jmp    0x230c
    2153:	9a 5d 0b 13 1b       	lcall  $0x1b13,$0xb5d
    2158:	a3 8c 45             	mov    %ax,0x458c
    215b:	a1 8c 45             	mov    0x458c,%ax
    215e:	3d 00 4d             	cmp    $0x4d00,%ax
    2161:	74 03                	je     0x2166
    2163:	e9 ce 00             	jmp    0x2234
    2166:	a1 04 3a             	mov    0x3a04,%ax
    2169:	40                   	inc    %ax
    216a:	89 46 fe             	mov    %ax,-0x2(%bp)
    216d:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    2171:	7d 27                	jge    0x219a
    2173:	8b 46 fe             	mov    -0x2(%bp),%ax
    2176:	d1 e0                	shl    %ax
    2178:	8b f0                	mov    %ax,%si
    217a:	d1 e0                	shl    %ax
    217c:	03 c6                	add    %si,%ax
    217e:	8b c8                	mov    %ax,%cx
    2180:	a0 02 3a             	mov    0x3a02,%al
    2183:	30 e4                	xor    %ah,%ah
    2185:	ba 48 00             	mov    $0x48,%dx
    2188:	f7 e2                	mul    %dx
    218a:	8b f8                	mov    %ax,%di
    218c:	03 f9                	add    %cx,%di
    218e:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    2193:	75 05                	jne    0x219a
    2195:	ff 46 fe             	incw   -0x2(%bp)
    2198:	eb d3                	jmp    0x216d
    219a:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    219e:	7e 03                	jle    0x21a3
    21a0:	e9 8e 00             	jmp    0x2231
    21a3:	8b 46 fe             	mov    -0x2(%bp),%ax
    21a6:	d1 e0                	shl    %ax
    21a8:	8b f0                	mov    %ax,%si
    21aa:	d1 e0                	shl    %ax
    21ac:	03 c6                	add    %si,%ax
    21ae:	8b c8                	mov    %ax,%cx
    21b0:	a0 02 3a             	mov    0x3a02,%al
    21b3:	30 e4                	xor    %ah,%ah
    21b5:	ba 48 00             	mov    $0x48,%dx
    21b8:	f7 e2                	mul    %dx
    21ba:	8b f8                	mov    %ax,%di
    21bc:	03 f9                	add    %cx,%di
    21be:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    21c3:	74 6c                	je     0x2231
    21c5:	8b 7e fe             	mov    -0x2(%bp),%di
    21c8:	d1 e7                	shl    %di
    21ca:	8b 85 a4 3a          	mov    0x3aa4(%di),%ax
    21ce:	31 d2                	xor    %dx,%dx
    21d0:	b9 02 00             	mov    $0x2,%cx
    21d3:	f7 f1                	div    %cx
    21d5:	8b d8                	mov    %ax,%bx
    21d7:	8b 46 fe             	mov    -0x2(%bp),%ax
    21da:	d1 e0                	shl    %ax
    21dc:	8b f0                	mov    %ax,%si
    21de:	d1 e0                	shl    %ax
    21e0:	03 c6                	add    %si,%ax
    21e2:	8b c8                	mov    %ax,%cx
    21e4:	a0 02 3a             	mov    0x3a02,%al
    21e7:	30 e4                	xor    %ah,%ah
    21e9:	ba 48 00             	mov    $0x48,%dx
    21ec:	f7 e2                	mul    %dx
    21ee:	8b f8                	mov    %ax,%di
    21f0:	03 f9                	add    %cx,%di
    21f2:	8b 85 84 37          	mov    0x3784(%di),%ax
    21f6:	03 c3                	add    %bx,%ax
    21f8:	a3 80 45             	mov    %ax,0x4580
    21fb:	a1 a4 3a             	mov    0x3aa4,%ax
    21fe:	31 d2                	xor    %dx,%dx
    2200:	b9 02 00             	mov    $0x2,%cx
    2203:	f7 f1                	div    %cx
    2205:	8b d8                	mov    %ax,%bx
    2207:	8b 46 fe             	mov    -0x2(%bp),%ax
    220a:	d1 e0                	shl    %ax
    220c:	8b f0                	mov    %ax,%si
    220e:	d1 e0                	shl    %ax
    2210:	03 c6                	add    %si,%ax
    2212:	8b c8                	mov    %ax,%cx
    2214:	a0 02 3a             	mov    0x3a02,%al
    2217:	30 e4                	xor    %ah,%ah
    2219:	ba 48 00             	mov    $0x48,%dx
    221c:	f7 e2                	mul    %dx
    221e:	8b f8                	mov    %ax,%di
    2220:	03 f9                	add    %cx,%di
    2222:	8b 85 86 37          	mov    0x3786(%di),%ax
    2226:	03 c3                	add    %bx,%ax
    2228:	a3 82 45             	mov    %ax,0x4582
    222b:	8b 46 fe             	mov    -0x2(%bp),%ax
    222e:	a3 04 3a             	mov    %ax,0x3a04
    2231:	e9 d3 00             	jmp    0x2307
    2234:	3d 00 4b             	cmp    $0x4b00,%ax
    2237:	74 03                	je     0x223c
    2239:	e9 cb 00             	jmp    0x2307
    223c:	a1 04 3a             	mov    0x3a04,%ax
    223f:	48                   	dec    %ax
    2240:	89 46 fe             	mov    %ax,-0x2(%bp)
    2243:	83 7e fe 01          	cmpw   $0x1,-0x2(%bp)
    2247:	7e 27                	jle    0x2270
    2249:	8b 46 fe             	mov    -0x2(%bp),%ax
    224c:	d1 e0                	shl    %ax
    224e:	8b f0                	mov    %ax,%si
    2250:	d1 e0                	shl    %ax
    2252:	03 c6                	add    %si,%ax
    2254:	8b c8                	mov    %ax,%cx
    2256:	a0 02 3a             	mov    0x3a02,%al
    2259:	30 e4                	xor    %ah,%ah
    225b:	ba 48 00             	mov    $0x48,%dx
    225e:	f7 e2                	mul    %dx
    2260:	8b f8                	mov    %ax,%di
    2262:	03 f9                	add    %cx,%di
    2264:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    2269:	75 05                	jne    0x2270
    226b:	ff 4e fe             	decw   -0x2(%bp)
    226e:	eb d3                	jmp    0x2243
    2270:	83 7e fe 01          	cmpw   $0x1,-0x2(%bp)
    2274:	7d 03                	jge    0x2279
    2276:	e9 8e 00             	jmp    0x2307
    2279:	8b 46 fe             	mov    -0x2(%bp),%ax
    227c:	d1 e0                	shl    %ax
    227e:	8b f0                	mov    %ax,%si
    2280:	d1 e0                	shl    %ax
    2282:	03 c6                	add    %si,%ax
    2284:	8b c8                	mov    %ax,%cx
    2286:	a0 02 3a             	mov    0x3a02,%al
    2289:	30 e4                	xor    %ah,%ah
    228b:	ba 48 00             	mov    $0x48,%dx
    228e:	f7 e2                	mul    %dx
    2290:	8b f8                	mov    %ax,%di
    2292:	03 f9                	add    %cx,%di
    2294:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    2299:	74 6c                	je     0x2307
    229b:	8b 7e fe             	mov    -0x2(%bp),%di
    229e:	d1 e7                	shl    %di
    22a0:	8b 85 a4 3a          	mov    0x3aa4(%di),%ax
    22a4:	31 d2                	xor    %dx,%dx
    22a6:	b9 02 00             	mov    $0x2,%cx
    22a9:	f7 f1                	div    %cx
    22ab:	8b d8                	mov    %ax,%bx
    22ad:	8b 46 fe             	mov    -0x2(%bp),%ax
    22b0:	d1 e0                	shl    %ax
    22b2:	8b f0                	mov    %ax,%si
    22b4:	d1 e0                	shl    %ax
    22b6:	03 c6                	add    %si,%ax
    22b8:	8b c8                	mov    %ax,%cx
    22ba:	a0 02 3a             	mov    0x3a02,%al
    22bd:	30 e4                	xor    %ah,%ah
    22bf:	ba 48 00             	mov    $0x48,%dx
    22c2:	f7 e2                	mul    %dx
    22c4:	8b f8                	mov    %ax,%di
    22c6:	03 f9                	add    %cx,%di
    22c8:	8b 85 84 37          	mov    0x3784(%di),%ax
    22cc:	03 c3                	add    %bx,%ax
    22ce:	a3 80 45             	mov    %ax,0x4580
    22d1:	a1 a4 3a             	mov    0x3aa4,%ax
    22d4:	31 d2                	xor    %dx,%dx
    22d6:	b9 02 00             	mov    $0x2,%cx
    22d9:	f7 f1                	div    %cx
    22db:	8b d8                	mov    %ax,%bx
    22dd:	8b 46 fe             	mov    -0x2(%bp),%ax
    22e0:	d1 e0                	shl    %ax
    22e2:	8b f0                	mov    %ax,%si
    22e4:	d1 e0                	shl    %ax
    22e6:	03 c6                	add    %si,%ax
    22e8:	8b c8                	mov    %ax,%cx
    22ea:	a0 02 3a             	mov    0x3a02,%al
    22ed:	30 e4                	xor    %ah,%ah
    22ef:	ba 48 00             	mov    $0x48,%dx
    22f2:	f7 e2                	mul    %dx
    22f4:	8b f8                	mov    %ax,%di
    22f6:	03 f9                	add    %cx,%di
    22f8:	8b 85 86 37          	mov    0x3786(%di),%ax
    22fc:	03 c3                	add    %bx,%ax
    22fe:	a3 82 45             	mov    %ax,0x4582
    2301:	8b 46 fe             	mov    -0x2(%bp),%ax
    2304:	a3 04 3a             	mov    %ax,0x3a04
    2307:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    230c:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    2311:	3d 1b 01             	cmp    $0x11b,%ax
    2314:	75 03                	jne    0x2319
    2316:	e9 9a 00             	jmp    0x23b3
    2319:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    231e:	74 03                	je     0x2323
    2320:	e9 90 00             	jmp    0x23b3
    2323:	bf d2 3c             	mov    $0x3cd2,%di
    2326:	1e                   	push   %ds
    2327:	57                   	push   %di
    2328:	bf da 3c             	mov    $0x3cda,%di
    232b:	1e                   	push   %ds
    232c:	57                   	push   %di
    232d:	9a ad 0f a3 0c       	lcall  $0xca3,$0xfad
    2332:	a1 da 3c             	mov    0x3cda,%ax
    2335:	8b 1e dc 3c          	mov    0x3cdc,%bx
    2339:	8b 16 de 3c          	mov    0x3cde,%dx
    233d:	9a 7a 0c ce 1d       	lcall  $0x1dce,$0xc7a
    2342:	83 fa 00             	cmp    $0x0,%dx
    2345:	7f 07                	jg     0x234e
    2347:	7c 29                	jl     0x2372
    2349:	3d 0a 00             	cmp    $0xa,%ax
    234c:	72 24                	jb     0x2372
    234e:	a0 f6 2f             	mov    0x2ff6,%al
    2351:	30 e4                	xor    %ah,%ah
    2353:	8b d0                	mov    %ax,%dx
    2355:	b8 03 00             	mov    $0x3,%ax
    2358:	2b c2                	sub    %dx,%ax
    235a:	a2 f6 2f             	mov    %al,0x2ff6
    235d:	a0 f6 2f             	mov    0x2ff6,%al
    2360:	50                   	push   %ax
    2361:	b0 01                	mov    $0x1,%al
    2363:	50                   	push   %ax
    2364:	0e                   	push   %cs
    2365:	e8 d3 ed             	call   0x113b
    2368:	bf d2 3c             	mov    $0x3cd2,%di
    236b:	1e                   	push   %ds
    236c:	57                   	push   %di
    236d:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    2372:	80 3e e6 3c 00       	cmpb   $0x0,0x3ce6
    2377:	74 3a                	je     0x23b3
    2379:	bf d6 3c             	mov    $0x3cd6,%di
    237c:	1e                   	push   %ds
    237d:	57                   	push   %di
    237e:	bf e0 3c             	mov    $0x3ce0,%di
    2381:	1e                   	push   %ds
    2382:	57                   	push   %di
    2383:	9a ad 0f a3 0c       	lcall  $0xca3,$0xfad
    2388:	a1 e0 3c             	mov    0x3ce0,%ax
    238b:	8b 1e e2 3c          	mov    0x3ce2,%bx
    238f:	8b 16 e4 3c          	mov    0x3ce4,%dx
    2393:	9a 7a 0c ce 1d       	lcall  $0x1dce,$0xc7a
    2398:	83 fa 00             	cmp    $0x0,%dx
    239b:	7f 07                	jg     0x23a4
    239d:	7c 14                	jl     0x23b3
    239f:	3d 03 00             	cmp    $0x3,%ax
    23a2:	72 0f                	jb     0x23b3
    23a4:	0e                   	push   %cs
    23a5:	e8 ef ea             	call   0xe97
    23a8:	a0 f6 2f             	mov    0x2ff6,%al
    23ab:	50                   	push   %ax
    23ac:	b0 00                	mov    $0x0,%al
    23ae:	50                   	push   %ax
    23af:	0e                   	push   %cs
    23b0:	e8 88 ed             	call   0x113b
    23b3:	89 ec                	mov    %bp,%sp
    23b5:	5d                   	pop    %bp
    23b6:	cb                   	lret
    23b7:	00 fe                	add    %bh,%dh
    23b9:	07                   	pop    %es
	...
    23d6:	00 00                	add    %al,(%bx,%si)
    23d8:	fe                   	(bad)
    23d9:	ff 01                	incw   (%bx,%di)
	...
    23f7:	55                   	push   %bp
    23f8:	89 e5                	mov    %sp,%bp
    23fa:	83 ec 3e             	sub    $0x3e,%sp
    23fd:	31 c0                	xor    %ax,%ax
    23ff:	a3 04 3a             	mov    %ax,0x3a04
    2402:	c6 06 e6 3c 00       	movb   $0x0,0x3ce6
    2407:	c6 06 f6 2f 02       	movb   $0x2,0x2ff6
    240c:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    2411:	eb 03                	jmp    0x2416
    2413:	ff 46 fe             	incw   -0x2(%bp)
    2416:	8b 46 fe             	mov    -0x2(%bp),%ax
    2419:	d1 e0                	shl    %ax
    241b:	8b f0                	mov    %ax,%si
    241d:	d1 e0                	shl    %ax
    241f:	03 c6                	add    %si,%ax
    2421:	8b c8                	mov    %ax,%cx
    2423:	a0 02 3a             	mov    0x3a02,%al
    2426:	30 e4                	xor    %ah,%ah
    2428:	ba 48 00             	mov    $0x48,%dx
    242b:	f7 e2                	mul    %dx
    242d:	8b f8                	mov    %ax,%di
    242f:	03 f9                	add    %cx,%di
    2431:	81 c7 82 37          	add    $0x3782,%di
    2435:	89 7e c2             	mov    %di,-0x3e(%bp)
    2438:	8c 5e c4             	mov    %ds,-0x3c(%bp)
    243b:	c4 7e c2             	les    -0x3e(%bp),%di
    243e:	26 80 3d 00          	cmpb   $0x0,%es:(%di)
    2442:	75 03                	jne    0x2447
    2444:	e9 8b 00             	jmp    0x24d2
    2447:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    244c:	eb 03                	jmp    0x2451
    244e:	ff 46 fc             	incw   -0x4(%bp)
    2451:	c4 7e c2             	les    -0x3e(%bp),%di
    2454:	26 8a 05             	mov    %es:(%di),%al
    2457:	98                   	cbtw
    2458:	8b 7e fc             	mov    -0x4(%bp),%di
    245b:	d1 e7                	shl    %di
    245d:	d1 e7                	shl    %di
    245f:	03 f8                	add    %ax,%di
    2461:	8a 85 b9 38          	mov    0x38b9(%di),%al
    2465:	c4 7e c2             	les    -0x3e(%bp),%di
    2468:	26 3a 45 01          	cmp    %es:0x1(%di),%al
    246c:	75 5b                	jne    0x24c9
    246e:	83 3e 04 3a 00       	cmpw   $0x0,0x3a04
    2473:	75 54                	jne    0x24c9
    2475:	80 3e 03 3a 01       	cmpb   $0x1,0x3a03
    247a:	75 13                	jne    0x248f
    247c:	c4 7e c2             	les    -0x3e(%bp),%di
    247f:	26 80 3d 03          	cmpb   $0x3,%es:(%di)
    2483:	75 44                	jne    0x24c9
    2485:	c4 7e c2             	les    -0x3e(%bp),%di
    2488:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    248d:	75 3a                	jne    0x24c9
    248f:	8b 46 fe             	mov    -0x2(%bp),%ax
    2492:	a3 04 3a             	mov    %ax,0x3a04
    2495:	8b 3e 04 3a          	mov    0x3a04,%di
    2499:	d1 e7                	shl    %di
    249b:	8b 85 a4 3a          	mov    0x3aa4(%di),%ax
    249f:	31 d2                	xor    %dx,%dx
    24a1:	b9 02 00             	mov    $0x2,%cx
    24a4:	f7 f1                	div    %cx
    24a6:	c4 7e c2             	les    -0x3e(%bp),%di
    24a9:	26 03 45 02          	add    %es:0x2(%di),%ax
    24ad:	a3 80 45             	mov    %ax,0x4580
    24b0:	a1 a4 3a             	mov    0x3aa4,%ax
    24b3:	31 d2                	xor    %dx,%dx
    24b5:	b9 02 00             	mov    $0x2,%cx
    24b8:	f7 f1                	div    %cx
    24ba:	c4 7e c2             	les    -0x3e(%bp),%di
    24bd:	26 03 45 04          	add    %es:0x4(%di),%ax
    24c1:	a3 82 45             	mov    %ax,0x4582
    24c4:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    24c9:	83 7e fc 02          	cmpw   $0x2,-0x4(%bp)
    24cd:	74 03                	je     0x24d2
    24cf:	e9 7c ff             	jmp    0x244e
    24d2:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    24d6:	74 03                	je     0x24db
    24d8:	e9 38 ff             	jmp    0x2413
    24db:	83 3e 04 3a 00       	cmpw   $0x0,0x3a04
    24e0:	74 03                	je     0x24e5
    24e2:	e9 cc 00             	jmp    0x25b1
    24e5:	b0 04                	mov    $0x4,%al
    24e7:	50                   	push   %ax
    24e8:	0e                   	push   %cs
    24e9:	e8 14 db             	call   0x0
    24ec:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    24f1:	3d 1b 01             	cmp    $0x11b,%ax
    24f4:	75 03                	jne    0x24f9
    24f6:	e9 50 07             	jmp    0x2c49
    24f9:	a0 02 3a             	mov    0x3a02,%al
    24fc:	50                   	push   %ax
    24fd:	0e                   	push   %cs
    24fe:	e8 15 e6             	call   0xb16
    2501:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    2506:	75 27                	jne    0x252f
    2508:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    250d:	eb 03                	jmp    0x2512
    250f:	ff 46 fe             	incw   -0x2(%bp)
    2512:	b8 70 17             	mov    $0x1770,%ax
    2515:	50                   	push   %ax
    2516:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    251b:	b8 05 00             	mov    $0x5,%ax
    251e:	50                   	push   %ax
    251f:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    2524:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    2529:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    252d:	75 e0                	jne    0x250f
    252f:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    2534:	3d 1b 01             	cmp    $0x11b,%ax
    2537:	75 03                	jne    0x253c
    2539:	e9 0d 07             	jmp    0x2c49
    253c:	b0 05                	mov    $0x5,%al
    253e:	50                   	push   %ax
    253f:	0e                   	push   %cs
    2540:	e8 bd da             	call   0x0
    2543:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    2548:	3d 1b 01             	cmp    $0x11b,%ax
    254b:	75 03                	jne    0x2550
    254d:	e9 f9 06             	jmp    0x2c49
    2550:	a0 02 3a             	mov    0x3a02,%al
    2553:	30 e4                	xor    %ah,%ah
    2555:	8b f8                	mov    %ax,%di
    2557:	d1 e7                	shl    %di
    2559:	8b 85 a6 38          	mov    0x38a6(%di),%ax
    255d:	2d 0a 00             	sub    $0xa,%ax
    2560:	8b d0                	mov    %ax,%dx
    2562:	a0 02 3a             	mov    0x3a02,%al
    2565:	30 e4                	xor    %ah,%ah
    2567:	8b f8                	mov    %ax,%di
    2569:	d1 e7                	shl    %di
    256b:	89 95 a6 38          	mov    %dx,0x38a6(%di)
    256f:	a0 02 3a             	mov    0x3a02,%al
    2572:	30 e4                	xor    %ah,%ah
    2574:	8b f8                	mov    %ax,%di
    2576:	d1 e7                	shl    %di
    2578:	ff b5 a6 38          	push   0x38a6(%di)
    257c:	b8 04 00             	mov    $0x4,%ax
    257f:	50                   	push   %ax
    2580:	a0 02 3a             	mov    0x3a02,%al
    2583:	30 e4                	xor    %ah,%ah
    2585:	8b f8                	mov    %ax,%di
    2587:	d1 e7                	shl    %di
    2589:	ff b5 ac 38          	push   0x38ac(%di)
    258d:	a0 02 3a             	mov    0x3a02,%al
    2590:	30 e4                	xor    %ah,%ah
    2592:	8b f8                	mov    %ax,%di
    2594:	d1 e7                	shl    %di
    2596:	ff b5 b2 38          	push   0x38b2(%di)
    259a:	9a cd 11 02 06       	lcall  $0x602,$0x11cd
    259f:	a1 bc 38             	mov    0x38bc,%ax
    25a2:	05 0a 00             	add    $0xa,%ax
    25a5:	a3 bc 38             	mov    %ax,0x38bc
    25a8:	ff 36 bc 38          	push   0x38bc
    25ac:	9a d3 10 02 06       	lcall  $0x602,$0x10d3
    25b1:	bf d2 3c             	mov    $0x3cd2,%di
    25b4:	1e                   	push   %ds
    25b5:	57                   	push   %di
    25b6:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    25bb:	c6 06 06 3a 00       	movb   $0x0,0x3a06
    25c0:	83 3e 04 3a 00       	cmpw   $0x0,0x3a04
    25c5:	75 03                	jne    0x25ca
    25c7:	e9 f6 00             	jmp    0x26c0
    25ca:	31 c0                	xor    %ax,%ax
    25cc:	a3 8c 45             	mov    %ax,0x458c
    25cf:	0e                   	push   %cs
    25d0:	e8 48 fa             	call   0x201b
    25d3:	81 3e 8c 45 0d 1c    	cmpw   $0x1c0d,0x458c
    25d9:	74 0f                	je     0x25ea
    25db:	81 3e 8c 45 1b 01    	cmpw   $0x11b,0x458c
    25e1:	74 07                	je     0x25ea
    25e3:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    25e8:	75 e0                	jne    0x25ca
    25ea:	81 3e 8c 45 0d 1c    	cmpw   $0x1c0d,0x458c
    25f0:	74 0a                	je     0x25fc
    25f2:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    25f7:	74 03                	je     0x25fc
    25f9:	e9 87 00             	jmp    0x2683
    25fc:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    2601:	eb 03                	jmp    0x2606
    2603:	ff 46 fe             	incw   -0x2(%bp)
    2606:	a1 04 3a             	mov    0x3a04,%ax
    2609:	d1 e0                	shl    %ax
    260b:	8b f0                	mov    %ax,%si
    260d:	d1 e0                	shl    %ax
    260f:	03 c6                	add    %si,%ax
    2611:	8b c8                	mov    %ax,%cx
    2613:	a0 02 3a             	mov    0x3a02,%al
    2616:	30 e4                	xor    %ah,%ah
    2618:	ba 48 00             	mov    $0x48,%dx
    261b:	f7 e2                	mul    %dx
    261d:	8b f8                	mov    %ax,%di
    261f:	03 f9                	add    %cx,%di
    2621:	8a 85 83 37          	mov    0x3783(%di),%al
    2625:	88 46 f9             	mov    %al,-0x7(%bp)
    2628:	a1 04 3a             	mov    0x3a04,%ax
    262b:	d1 e0                	shl    %ax
    262d:	8b f0                	mov    %ax,%si
    262f:	d1 e0                	shl    %ax
    2631:	03 c6                	add    %si,%ax
    2633:	8b c8                	mov    %ax,%cx
    2635:	a0 02 3a             	mov    0x3a02,%al
    2638:	30 e4                	xor    %ah,%ah
    263a:	ba 48 00             	mov    $0x48,%dx
    263d:	f7 e2                	mul    %dx
    263f:	8b f8                	mov    %ax,%di
    2641:	03 f9                	add    %cx,%di
    2643:	8a 85 82 37          	mov    0x3782(%di),%al
    2647:	88 46 f8             	mov    %al,-0x8(%bp)
    264a:	8a 46 f8             	mov    -0x8(%bp),%al
    264d:	98                   	cbtw
    264e:	8b 7e fe             	mov    -0x2(%bp),%di
    2651:	d1 e7                	shl    %di
    2653:	d1 e7                	shl    %di
    2655:	03 f8                	add    %ax,%di
    2657:	8a 85 b9 38          	mov    0x38b9(%di),%al
    265b:	3a 46 f9             	cmp    -0x7(%bp),%al
    265e:	75 05                	jne    0x2665
    2660:	c6 06 06 3a 01       	movb   $0x1,0x3a06
    2665:	80 3e 03 3a 01       	cmpb   $0x1,0x3a03
    266a:	75 11                	jne    0x267d
    266c:	80 7e f8 03          	cmpb   $0x3,-0x8(%bp)
    2670:	75 06                	jne    0x2678
    2672:	80 7e f9 09          	cmpb   $0x9,-0x7(%bp)
    2676:	74 05                	je     0x267d
    2678:	c6 06 06 3a 00       	movb   $0x0,0x3a06
    267d:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    2681:	75 80                	jne    0x2603
    2683:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    2688:	3d 1b 01             	cmp    $0x11b,%ax
    268b:	75 03                	jne    0x2690
    268d:	e9 b9 05             	jmp    0x2c49
    2690:	80 3e 06 3a 00       	cmpb   $0x0,0x3a06
    2695:	75 1f                	jne    0x26b6
    2697:	b8 dc 00             	mov    $0xdc,%ax
    269a:	50                   	push   %ax
    269b:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    26a0:	b8 c8 00             	mov    $0xc8,%ax
    26a3:	50                   	push   %ax
    26a4:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    26a9:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    26ae:	b0 02                	mov    $0x2,%al
    26b0:	50                   	push   %ax
    26b1:	9a 5c 13 02 06       	lcall  $0x602,$0x135c
    26b6:	80 3e 06 3a 00       	cmpb   $0x0,0x3a06
    26bb:	75 03                	jne    0x26c0
    26bd:	e9 0a ff             	jmp    0x25ca
    26c0:	80 3e 06 3a 00       	cmpb   $0x0,0x3a06
    26c5:	75 03                	jne    0x26ca
    26c7:	e9 7a 05             	jmp    0x2c44
    26ca:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    26cf:	74 20                	je     0x26f1
    26d1:	bf 80 45             	mov    $0x4580,%di
    26d4:	1e                   	push   %ds
    26d5:	57                   	push   %di
    26d6:	bf 82 45             	mov    $0x4582,%di
    26d9:	1e                   	push   %ds
    26da:	57                   	push   %di
    26db:	bf 84 45             	mov    $0x4584,%di
    26de:	1e                   	push   %ds
    26df:	57                   	push   %di
    26e0:	9a 76 08 a3 0c       	lcall  $0xca3,$0x876
    26e5:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    26ea:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    26ef:	74 e0                	je     0x26d1
    26f1:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    26f6:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    26fb:	eb 03                	jmp    0x2700
    26fd:	ff 46 fe             	incw   -0x2(%bp)
    2700:	8b 7e fe             	mov    -0x2(%bp),%di
    2703:	d1 e7                	shl    %di
    2705:	31 c0                	xor    %ax,%ax
    2707:	89 43 f0             	mov    %ax,-0x10(%bp,%di)
    270a:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    270e:	75 ed                	jne    0x26fd
    2710:	a1 04 3a             	mov    0x3a04,%ax
    2713:	48                   	dec    %ax
    2714:	89 46 c4             	mov    %ax,-0x3c(%bp)
    2717:	b8 01 00             	mov    $0x1,%ax
    271a:	3b 46 c4             	cmp    -0x3c(%bp),%ax
    271d:	7f 3a                	jg     0x2759
    271f:	89 46 fe             	mov    %ax,-0x2(%bp)
    2722:	eb 03                	jmp    0x2727
    2724:	ff 46 fe             	incw   -0x2(%bp)
    2727:	8b 46 fe             	mov    -0x2(%bp),%ax
    272a:	d1 e0                	shl    %ax
    272c:	8b f0                	mov    %ax,%si
    272e:	d1 e0                	shl    %ax
    2730:	03 c6                	add    %si,%ax
    2732:	8b c8                	mov    %ax,%cx
    2734:	a0 02 3a             	mov    0x3a02,%al
    2737:	30 e4                	xor    %ah,%ah
    2739:	ba 48 00             	mov    $0x48,%dx
    273c:	f7 e2                	mul    %dx
    273e:	8b f8                	mov    %ax,%di
    2740:	03 f9                	add    %cx,%di
    2742:	8a 85 82 37          	mov    0x3782(%di),%al
    2746:	3a 46 f8             	cmp    -0x8(%bp),%al
    2749:	75 06                	jne    0x2751
    274b:	8b 46 fe             	mov    -0x2(%bp),%ax
    274e:	89 46 f2             	mov    %ax,-0xe(%bp)
    2751:	8b 46 fe             	mov    -0x2(%bp),%ax
    2754:	3b 46 c4             	cmp    -0x3c(%bp),%ax
    2757:	75 cb                	jne    0x2724
    2759:	a1 04 3a             	mov    0x3a04,%ax
    275c:	40                   	inc    %ax
    275d:	89 46 c4             	mov    %ax,-0x3c(%bp)
    2760:	b8 0c 00             	mov    $0xc,%ax
    2763:	3b 46 c4             	cmp    -0x3c(%bp),%ax
    2766:	7c 3a                	jl     0x27a2
    2768:	89 46 fe             	mov    %ax,-0x2(%bp)
    276b:	eb 03                	jmp    0x2770
    276d:	ff 4e fe             	decw   -0x2(%bp)
    2770:	8b 46 fe             	mov    -0x2(%bp),%ax
    2773:	d1 e0                	shl    %ax
    2775:	8b f0                	mov    %ax,%si
    2777:	d1 e0                	shl    %ax
    2779:	03 c6                	add    %si,%ax
    277b:	8b c8                	mov    %ax,%cx
    277d:	a0 02 3a             	mov    0x3a02,%al
    2780:	30 e4                	xor    %ah,%ah
    2782:	ba 48 00             	mov    $0x48,%dx
    2785:	f7 e2                	mul    %dx
    2787:	8b f8                	mov    %ax,%di
    2789:	03 f9                	add    %cx,%di
    278b:	8a 85 82 37          	mov    0x3782(%di),%al
    278f:	3a 46 f8             	cmp    -0x8(%bp),%al
    2792:	75 06                	jne    0x279a
    2794:	8b 46 fe             	mov    -0x2(%bp),%ax
    2797:	89 46 f6             	mov    %ax,-0xa(%bp)
    279a:	8b 46 fe             	mov    -0x2(%bp),%ax
    279d:	3b 46 c4             	cmp    -0x3c(%bp),%ax
    27a0:	75 cb                	jne    0x276d
    27a2:	83 7e f2 00          	cmpw   $0x0,-0xe(%bp)
    27a6:	74 65                	je     0x280d
    27a8:	8b 7e f2             	mov    -0xe(%bp),%di
    27ab:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    27af:	30 e4                	xor    %ah,%ah
    27b1:	8b f8                	mov    %ax,%di
    27b3:	d1 e7                	shl    %di
    27b5:	d1 e7                	shl    %di
    27b7:	ff b5 e4 38          	push   0x38e4(%di)
    27bb:	ff b5 e2 38          	push   0x38e2(%di)
    27bf:	31 c0                	xor    %ax,%ax
    27c1:	50                   	push   %ax
    27c2:	31 c0                	xor    %ax,%ax
    27c4:	50                   	push   %ax
    27c5:	31 c0                	xor    %ax,%ax
    27c7:	50                   	push   %ax
    27c8:	b8 01 00             	mov    $0x1,%ax
    27cb:	50                   	push   %ax
    27cc:	b0 02                	mov    $0x2,%al
    27ce:	50                   	push   %ax
    27cf:	b0 00                	mov    $0x0,%al
    27d1:	50                   	push   %ax
    27d2:	b0 01                	mov    $0x1,%al
    27d4:	50                   	push   %ax
    27d5:	b8 05 00             	mov    $0x5,%ax
    27d8:	50                   	push   %ax
    27d9:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    27de:	b8 10 00             	mov    $0x10,%ax
    27e1:	50                   	push   %ax
    27e2:	31 c0                	xor    %ax,%ax
    27e4:	50                   	push   %ax
    27e5:	ff 36 9e 3a          	push   0x3a9e
    27e9:	ff 36 a4 3a          	push   0x3aa4
    27ed:	b8 01 00             	mov    $0x1,%ax
    27f0:	50                   	push   %ax
    27f1:	31 c0                	xor    %ax,%ax
    27f3:	50                   	push   %ax
    27f4:	31 c0                	xor    %ax,%ax
    27f6:	50                   	push   %ax
    27f7:	b8 01 00             	mov    $0x1,%ax
    27fa:	50                   	push   %ax
    27fb:	b0 02                	mov    $0x2,%al
    27fd:	50                   	push   %ax
    27fe:	b0 00                	mov    $0x0,%al
    2800:	50                   	push   %ax
    2801:	b0 01                	mov    $0x1,%al
    2803:	50                   	push   %ax
    2804:	b8 0a 00             	mov    $0xa,%ax
    2807:	50                   	push   %ax
    2808:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    280d:	83 7e f6 00          	cmpw   $0x0,-0xa(%bp)
    2811:	74 78                	je     0x288b
    2813:	8b 7e f6             	mov    -0xa(%bp),%di
    2816:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    281a:	30 e4                	xor    %ah,%ah
    281c:	8b f8                	mov    %ax,%di
    281e:	d1 e7                	shl    %di
    2820:	d1 e7                	shl    %di
    2822:	ff b5 e4 38          	push   0x38e4(%di)
    2826:	ff b5 e2 38          	push   0x38e2(%di)
    282a:	31 c0                	xor    %ax,%ax
    282c:	50                   	push   %ax
    282d:	b8 10 00             	mov    $0x10,%ax
    2830:	50                   	push   %ax
    2831:	31 c0                	xor    %ax,%ax
    2833:	50                   	push   %ax
    2834:	b8 01 00             	mov    $0x1,%ax
    2837:	50                   	push   %ax
    2838:	b0 02                	mov    $0x2,%al
    283a:	50                   	push   %ax
    283b:	b0 00                	mov    $0x0,%al
    283d:	50                   	push   %ax
    283e:	b0 01                	mov    $0x1,%al
    2840:	50                   	push   %ax
    2841:	b8 05 00             	mov    $0x5,%ax
    2844:	50                   	push   %ax
    2845:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    284a:	83 7e f2 00          	cmpw   $0x0,-0xe(%bp)
    284e:	75 07                	jne    0x2857
    2850:	c7 46 ee 68 00       	movw   $0x68,-0x12(%bp)
    2855:	eb 05                	jmp    0x285c
    2857:	c7 46 ee 6c 00       	movw   $0x6c,-0x12(%bp)
    285c:	ff 76 ee             	push   -0x12(%bp)
    285f:	31 c0                	xor    %ax,%ax
    2861:	50                   	push   %ax
    2862:	b8 03 00             	mov    $0x3,%ax
    2865:	50                   	push   %ax
    2866:	ff 36 a4 3a          	push   0x3aa4
    286a:	b8 01 00             	mov    $0x1,%ax
    286d:	50                   	push   %ax
    286e:	b8 10 00             	mov    $0x10,%ax
    2871:	50                   	push   %ax
    2872:	31 c0                	xor    %ax,%ax
    2874:	50                   	push   %ax
    2875:	b8 01 00             	mov    $0x1,%ax
    2878:	50                   	push   %ax
    2879:	b0 02                	mov    $0x2,%al
    287b:	50                   	push   %ax
    287c:	b0 00                	mov    $0x0,%al
    287e:	50                   	push   %ax
    287f:	b0 01                	mov    $0x1,%al
    2881:	50                   	push   %ax
    2882:	b8 05 00             	mov    $0x5,%ax
    2885:	50                   	push   %ax
    2886:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    288b:	83 7e f6 00          	cmpw   $0x0,-0xa(%bp)
    288f:	74 07                	je     0x2898
    2891:	c7 46 f0 20 00       	movw   $0x20,-0x10(%bp)
    2896:	eb 06                	jmp    0x289e
    2898:	a1 9e 3a             	mov    0x3a9e,%ax
    289b:	89 46 f0             	mov    %ax,-0x10(%bp)
    289e:	31 c0                	xor    %ax,%ax
    28a0:	50                   	push   %ax
    28a1:	31 c0                	xor    %ax,%ax
    28a3:	50                   	push   %ax
    28a4:	ff 76 f0             	push   -0x10(%bp)
    28a7:	ff 36 a4 3a          	push   0x3aa4
    28ab:	b8 01 00             	mov    $0x1,%ax
    28ae:	50                   	push   %ax
    28af:	a1 04 3a             	mov    0x3a04,%ax
    28b2:	d1 e0                	shl    %ax
    28b4:	8b f0                	mov    %ax,%si
    28b6:	d1 e0                	shl    %ax
    28b8:	03 c6                	add    %si,%ax
    28ba:	8b c8                	mov    %ax,%cx
    28bc:	a0 02 3a             	mov    0x3a02,%al
    28bf:	30 e4                	xor    %ah,%ah
    28c1:	ba 48 00             	mov    $0x48,%dx
    28c4:	f7 e2                	mul    %dx
    28c6:	8b f8                	mov    %ax,%di
    28c8:	03 f9                	add    %cx,%di
    28ca:	ff b5 84 37          	push   0x3784(%di)
    28ce:	ff 36 82 3a          	push   0x3a82
    28d2:	31 c0                	xor    %ax,%ax
    28d4:	50                   	push   %ax
    28d5:	b0 02                	mov    $0x2,%al
    28d7:	50                   	push   %ax
    28d8:	b0 00                	mov    $0x0,%al
    28da:	50                   	push   %ax
    28db:	b0 01                	mov    $0x1,%al
    28dd:	50                   	push   %ax
    28de:	b8 0a 00             	mov    $0xa,%ax
    28e1:	50                   	push   %ax
    28e2:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    28e7:	31 c0                	xor    %ax,%ax
    28e9:	50                   	push   %ax
    28ea:	31 c0                	xor    %ax,%ax
    28ec:	50                   	push   %ax
    28ed:	a1 9e 3a             	mov    0x3a9e,%ax
    28f0:	05 10 00             	add    $0x10,%ax
    28f3:	50                   	push   %ax
    28f4:	ff 36 a4 3a          	push   0x3aa4
    28f8:	b8 01 00             	mov    $0x1,%ax
    28fb:	50                   	push   %ax
    28fc:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    2901:	a0 02 3a             	mov    0x3a02,%al
    2904:	30 e4                	xor    %ah,%ah
    2906:	8b f8                	mov    %ax,%di
    2908:	fe 8d a9 30          	decb   0x30a9(%di)
    290c:	fe 06 08 3a          	incb   0x3a08
    2910:	a0 08 3a             	mov    0x3a08,%al
    2913:	50                   	push   %ax
    2914:	8a 46 f9             	mov    -0x7(%bp),%al
    2917:	98                   	cbtw
    2918:	8b d8                	mov    %ax,%bx
    291a:	8a 46 f8             	mov    -0x8(%bp),%al
    291d:	98                   	cbtw
    291e:	ba 09 00             	mov    $0x9,%dx
    2921:	f7 e2                	mul    %dx
    2923:	8b c8                	mov    %ax,%cx
    2925:	a0 02 3a             	mov    0x3a02,%al
    2928:	30 e4                	xor    %ah,%ah
    292a:	ba 24 00             	mov    $0x24,%dx
    292d:	f7 e2                	mul    %dx
    292f:	8b f8                	mov    %ax,%di
    2931:	03 f9                	add    %cx,%di
    2933:	03 fb                	add    %bx,%di
    2935:	58                   	pop    %ax
    2936:	88 85 e7 2f          	mov    %al,0x2fe7(%di)
    293a:	8a 1e 08 3a          	mov    0x3a08,%bl
    293e:	8a 46 f9             	mov    -0x7(%bp),%al
    2941:	98                   	cbtw
    2942:	8b c8                	mov    %ax,%cx
    2944:	8a 46 f8             	mov    -0x8(%bp),%al
    2947:	98                   	cbtw
    2948:	ba 09 00             	mov    $0x9,%dx
    294b:	f7 e2                	mul    %dx
    294d:	8b f8                	mov    %ax,%di
    294f:	03 f9                	add    %cx,%di
    2951:	88 9d 77 30          	mov    %bl,0x3077(%di)
    2955:	8a 46 f9             	mov    -0x7(%bp),%al
    2958:	98                   	cbtw
    2959:	d1 e0                	shl    %ax
    295b:	d1 e0                	shl    %ax
    295d:	8b c8                	mov    %ax,%cx
    295f:	8a 46 f8             	mov    -0x8(%bp),%al
    2962:	98                   	cbtw
    2963:	ba 24 00             	mov    $0x24,%dx
    2966:	f7 e2                	mul    %dx
    2968:	8b f8                	mov    %ax,%di
    296a:	03 f9                	add    %cx,%di
    296c:	ff b5 38 39          	push   0x3938(%di)
    2970:	ff b5 36 39          	push   0x3936(%di)
    2974:	31 c0                	xor    %ax,%ax
    2976:	50                   	push   %ax
    2977:	8a 46 f9             	mov    -0x7(%bp),%al
    297a:	98                   	cbtw
    297b:	d1 e0                	shl    %ax
    297d:	8b c8                	mov    %ax,%cx
    297f:	8a 46 f8             	mov    -0x8(%bp),%al
    2982:	98                   	cbtw
    2983:	ba 12 00             	mov    $0x12,%dx
    2986:	f7 e2                	mul    %dx
    2988:	8b f8                	mov    %ax,%di
    298a:	03 f9                	add    %cx,%di
    298c:	ff b5 a0 3a          	push   0x3aa0(%di)
    2990:	8a 46 f9             	mov    -0x7(%bp),%al
    2993:	98                   	cbtw
    2994:	d1 e0                	shl    %ax
    2996:	8b c8                	mov    %ax,%cx
    2998:	8a 46 f8             	mov    -0x8(%bp),%al
    299b:	98                   	cbtw
    299c:	ba 12 00             	mov    $0x12,%dx
    299f:	f7 e2                	mul    %dx
    29a1:	8b f8                	mov    %ax,%di
    29a3:	03 f9                	add    %cx,%di
    29a5:	ff b5 e8 3a          	push   0x3ae8(%di)
    29a9:	31 c0                	xor    %ax,%ax
    29ab:	50                   	push   %ax
    29ac:	b0 02                	mov    $0x2,%al
    29ae:	50                   	push   %ax
    29af:	b0 00                	mov    $0x0,%al
    29b1:	50                   	push   %ax
    29b2:	b0 01                	mov    $0x1,%al
    29b4:	50                   	push   %ax
    29b5:	31 c0                	xor    %ax,%ax
    29b7:	50                   	push   %ax
    29b8:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    29bd:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    29c2:	75 1e                	jne    0x29e2
    29c4:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    29c9:	eb 03                	jmp    0x29ce
    29cb:	ff 46 fe             	incw   -0x2(%bp)
    29ce:	b8 14 00             	mov    $0x14,%ax
    29d1:	50                   	push   %ax
    29d2:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    29d7:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    29dc:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    29e0:	75 e9                	jne    0x29cb
    29e2:	83 7e f2 00          	cmpw   $0x0,-0xe(%bp)
    29e6:	75 11                	jne    0x29f9
    29e8:	83 7e f6 00          	cmpw   $0x0,-0xa(%bp)
    29ec:	75 0b                	jne    0x29f9
    29ee:	a1 9e 3a             	mov    0x3a9e,%ax
    29f1:	05 10 00             	add    $0x10,%ax
    29f4:	89 46 ee             	mov    %ax,-0x12(%bp)
    29f7:	eb 05                	jmp    0x29fe
    29f9:	c7 46 ee 10 00       	movw   $0x10,-0x12(%bp)
    29fe:	a1 04 3a             	mov    0x3a04,%ax
    2a01:	d1 e0                	shl    %ax
    2a03:	8b f0                	mov    %ax,%si
    2a05:	d1 e0                	shl    %ax
    2a07:	03 c6                	add    %si,%ax
    2a09:	8b c8                	mov    %ax,%cx
    2a0b:	a0 02 3a             	mov    0x3a02,%al
    2a0e:	30 e4                	xor    %ah,%ah
    2a10:	ba 48 00             	mov    $0x48,%dx
    2a13:	f7 e2                	mul    %dx
    2a15:	8b f8                	mov    %ax,%di
    2a17:	03 f9                	add    %cx,%di
    2a19:	c6 85 82 37 00       	movb   $0x0,0x3782(%di)
    2a1e:	a0 02 3a             	mov    0x3a02,%al
    2a21:	50                   	push   %ax
    2a22:	0e                   	push   %cs
    2a23:	e8 bc f4             	call   0x1ee2
    2a26:	83 7e f6 00          	cmpw   $0x0,-0xa(%bp)
    2a2a:	75 18                	jne    0x2a44
    2a2c:	a1 04 3a             	mov    0x3a04,%ax
    2a2f:	48                   	dec    %ax
    2a30:	09 c0                	or     %ax,%ax
    2a32:	7e 10                	jle    0x2a44
    2a34:	8b 16 9e 3a          	mov    0x3a9e,%dx
    2a38:	a1 04 3a             	mov    0x3a04,%ax
    2a3b:	48                   	dec    %ax
    2a3c:	8b f8                	mov    %ax,%di
    2a3e:	d1 e7                	shl    %di
    2a40:	89 95 a4 3a          	mov    %dx,0x3aa4(%di)
    2a44:	a1 04 3a             	mov    0x3a04,%ax
    2a47:	d1 e0                	shl    %ax
    2a49:	8b f0                	mov    %ax,%si
    2a4b:	d1 e0                	shl    %ax
    2a4d:	03 c6                	add    %si,%ax
    2a4f:	8b c8                	mov    %ax,%cx
    2a51:	a0 02 3a             	mov    0x3a02,%al
    2a54:	30 e4                	xor    %ah,%ah
    2a56:	ba 48 00             	mov    $0x48,%dx
    2a59:	f7 e2                	mul    %dx
    2a5b:	8b f8                	mov    %ax,%di
    2a5d:	03 f9                	add    %cx,%di
    2a5f:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    2a64:	75 03                	jne    0x2a69
    2a66:	e9 2a 01             	jmp    0x2b93
    2a69:	a1 04 3a             	mov    0x3a04,%ax
    2a6c:	d1 e0                	shl    %ax
    2a6e:	8b f0                	mov    %ax,%si
    2a70:	d1 e0                	shl    %ax
    2a72:	03 c6                	add    %si,%ax
    2a74:	8b c8                	mov    %ax,%cx
    2a76:	a0 02 3a             	mov    0x3a02,%al
    2a79:	30 e4                	xor    %ah,%ah
    2a7b:	ba 48 00             	mov    $0x48,%dx
    2a7e:	f7 e2                	mul    %dx
    2a80:	8b f8                	mov    %ax,%di
    2a82:	03 f9                	add    %cx,%di
    2a84:	8b 85 84 37          	mov    0x3784(%di),%ax
    2a88:	89 46 e8             	mov    %ax,-0x18(%bp)
    2a8b:	a1 9e 3a             	mov    0x3a9e,%ax
    2a8e:	31 d2                	xor    %dx,%dx
    2a90:	52                   	push   %dx
    2a91:	50                   	push   %ax
    2a92:	8b 46 ee             	mov    -0x12(%bp),%ax
    2a95:	99                   	cwtd
    2a96:	52                   	push   %dx
    2a97:	50                   	push   %ax
    2a98:	a0 02 3a             	mov    0x3a02,%al
    2a9b:	30 e4                	xor    %ah,%ah
    2a9d:	8b f8                	mov    %ax,%di
    2a9f:	8a 85 a9 30          	mov    0x30a9(%di),%al
    2aa3:	30 e4                	xor    %ah,%ah
    2aa5:	d1 e0                	shl    %ax
    2aa7:	8b f0                	mov    %ax,%si
    2aa9:	d1 e0                	shl    %ax
    2aab:	03 c6                	add    %si,%ax
    2aad:	8b c8                	mov    %ax,%cx
    2aaf:	a0 02 3a             	mov    0x3a02,%al
    2ab2:	30 e4                	xor    %ah,%ah
    2ab4:	ba 48 00             	mov    $0x48,%dx
    2ab7:	f7 e2                	mul    %dx
    2ab9:	8b f8                	mov    %ax,%di
    2abb:	03 f9                	add    %cx,%di
    2abd:	8b 85 84 37          	mov    0x3784(%di),%ax
    2ac1:	31 d2                	xor    %dx,%dx
    2ac3:	59                   	pop    %cx
    2ac4:	5b                   	pop    %bx
    2ac5:	03 c1                	add    %cx,%ax
    2ac7:	13 d3                	adc    %bx,%dx
    2ac9:	59                   	pop    %cx
    2aca:	5b                   	pop    %bx
    2acb:	03 c1                	add    %cx,%ax
    2acd:	13 d3                	adc    %bx,%dx
    2acf:	89 46 e0             	mov    %ax,-0x20(%bp)
    2ad2:	ff 76 e8             	push   -0x18(%bp)
    2ad5:	ff 36 82 3a          	push   0x3a82
    2ad9:	8b 46 e0             	mov    -0x20(%bp),%ax
    2adc:	2b 46 e8             	sub    -0x18(%bp),%ax
    2adf:	40                   	inc    %ax
    2ae0:	50                   	push   %ax
    2ae1:	ff 36 a4 3a          	push   0x3aa4
    2ae5:	31 c0                	xor    %ax,%ax
    2ae7:	50                   	push   %ax
    2ae8:	8b 46 e8             	mov    -0x18(%bp),%ax
    2aeb:	2b 46 ee             	sub    -0x12(%bp),%ax
    2aee:	50                   	push   %ax
    2aef:	ff 36 82 3a          	push   0x3a82
    2af3:	31 c0                	xor    %ax,%ax
    2af5:	50                   	push   %ax
    2af6:	b0 02                	mov    $0x2,%al
    2af8:	50                   	push   %ax
    2af9:	b0 00                	mov    $0x0,%al
    2afb:	50                   	push   %ax
    2afc:	b0 01                	mov    $0x1,%al
    2afe:	50                   	push   %ax
    2aff:	b8 14 00             	mov    $0x14,%ax
    2b02:	50                   	push   %ax
    2b03:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    2b08:	a0 02 3a             	mov    0x3a02,%al
    2b0b:	30 e4                	xor    %ah,%ah
    2b0d:	8b f8                	mov    %ax,%di
    2b0f:	8a 85 a9 30          	mov    0x30a9(%di),%al
    2b13:	30 e4                	xor    %ah,%ah
    2b15:	89 46 c4             	mov    %ax,-0x3c(%bp)
    2b18:	a1 04 3a             	mov    0x3a04,%ax
    2b1b:	3b 46 c4             	cmp    -0x3c(%bp),%ax
    2b1e:	7f 73                	jg     0x2b93
    2b20:	89 46 fe             	mov    %ax,-0x2(%bp)
    2b23:	eb 03                	jmp    0x2b28
    2b25:	ff 46 fe             	incw   -0x2(%bp)
    2b28:	8b 46 ee             	mov    -0x12(%bp),%ax
    2b2b:	99                   	cwtd
    2b2c:	52                   	push   %dx
    2b2d:	50                   	push   %ax
    2b2e:	8b 46 fe             	mov    -0x2(%bp),%ax
    2b31:	d1 e0                	shl    %ax
    2b33:	8b f0                	mov    %ax,%si
    2b35:	d1 e0                	shl    %ax
    2b37:	03 c6                	add    %si,%ax
    2b39:	8b c8                	mov    %ax,%cx
    2b3b:	a0 02 3a             	mov    0x3a02,%al
    2b3e:	30 e4                	xor    %ah,%ah
    2b40:	ba 48 00             	mov    $0x48,%dx
    2b43:	f7 e2                	mul    %dx
    2b45:	8b f8                	mov    %ax,%di
    2b47:	03 f9                	add    %cx,%di
    2b49:	8b 85 84 37          	mov    0x3784(%di),%ax
    2b4d:	31 d2                	xor    %dx,%dx
    2b4f:	59                   	pop    %cx
    2b50:	5b                   	pop    %bx
    2b51:	2b c1                	sub    %cx,%ax
    2b53:	1b d3                	sbb    %bx,%dx
    2b55:	8b d8                	mov    %ax,%bx
    2b57:	8b 46 fe             	mov    -0x2(%bp),%ax
    2b5a:	d1 e0                	shl    %ax
    2b5c:	8b f0                	mov    %ax,%si
    2b5e:	d1 e0                	shl    %ax
    2b60:	03 c6                	add    %si,%ax
    2b62:	8b c8                	mov    %ax,%cx
    2b64:	a0 02 3a             	mov    0x3a02,%al
    2b67:	30 e4                	xor    %ah,%ah
    2b69:	ba 48 00             	mov    $0x48,%dx
    2b6c:	f7 e2                	mul    %dx
    2b6e:	8b f8                	mov    %ax,%di
    2b70:	03 f9                	add    %cx,%di
    2b72:	89 9d 84 37          	mov    %bx,0x3784(%di)
    2b76:	8b 46 fe             	mov    -0x2(%bp),%ax
    2b79:	40                   	inc    %ax
    2b7a:	8b f8                	mov    %ax,%di
    2b7c:	d1 e7                	shl    %di
    2b7e:	8b 85 a4 3a          	mov    0x3aa4(%di),%ax
    2b82:	8b 7e fe             	mov    -0x2(%bp),%di
    2b85:	d1 e7                	shl    %di
    2b87:	89 85 a4 3a          	mov    %ax,0x3aa4(%di)
    2b8b:	8b 46 fe             	mov    -0x2(%bp),%ax
    2b8e:	3b 46 c4             	cmp    -0x3c(%bp),%ax
    2b91:	75 92                	jne    0x2b25
    2b93:	a0 02 3a             	mov    0x3a02,%al
    2b96:	30 e4                	xor    %ah,%ah
    2b98:	8b f8                	mov    %ax,%di
    2b9a:	80 bd a9 30 00       	cmpb   $0x0,0x30a9(%di)
    2b9f:	76 19                	jbe    0x2bba
    2ba1:	8b 16 9e 3a          	mov    0x3a9e,%dx
    2ba5:	a0 02 3a             	mov    0x3a02,%al
    2ba8:	30 e4                	xor    %ah,%ah
    2baa:	8b f8                	mov    %ax,%di
    2bac:	8a 85 a9 30          	mov    0x30a9(%di),%al
    2bb0:	30 e4                	xor    %ah,%ah
    2bb2:	8b f8                	mov    %ax,%di
    2bb4:	d1 e7                	shl    %di
    2bb6:	89 95 a4 3a          	mov    %dx,0x3aa4(%di)
    2bba:	80 3e e6 3c 00       	cmpb   $0x0,0x3ce6
    2bbf:	74 0b                	je     0x2bcc
    2bc1:	a0 f6 2f             	mov    0x2ff6,%al
    2bc4:	50                   	push   %ax
    2bc5:	b0 00                	mov    $0x0,%al
    2bc7:	50                   	push   %ax
    2bc8:	0e                   	push   %cs
    2bc9:	e8 6f e5             	call   0x113b
    2bcc:	80 7e f9 09          	cmpb   $0x9,-0x7(%bp)
    2bd0:	7f 0a                	jg     0x2bdc
    2bd2:	8a 46 f8             	mov    -0x8(%bp),%al
    2bd5:	98                   	cbtw
    2bd6:	8b f8                	mov    %ax,%di
    2bd8:	fe 8d bd 38          	decb   0x38bd(%di)
    2bdc:	80 7e f9 09          	cmpb   $0x9,-0x7(%bp)
    2be0:	7c 0a                	jl     0x2bec
    2be2:	8a 46 f8             	mov    -0x8(%bp),%al
    2be5:	98                   	cbtw
    2be6:	8b f8                	mov    %ax,%di
    2be8:	fe 85 c1 38          	incb   0x38c1(%di)
    2bec:	80 7e f9 09          	cmpb   $0x9,-0x7(%bp)
    2bf0:	75 06                	jne    0x2bf8
    2bf2:	80 7e f8 03          	cmpb   $0x3,-0x8(%bp)
    2bf6:	75 39                	jne    0x2c31
    2bf8:	a0 08 3a             	mov    0x3a08,%al
    2bfb:	50                   	push   %ax
    2bfc:	bf b7 23             	mov    $0x23b7,%di
    2bff:	0e                   	push   %cs
    2c00:	57                   	push   %di
    2c01:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    2c06:	74 06                	je     0x2c0e
    2c08:	80 7e f9 08          	cmpb   $0x8,-0x7(%bp)
    2c0c:	74 23                	je     0x2c31
    2c0e:	a0 08 3a             	mov    0x3a08,%al
    2c11:	50                   	push   %ax
    2c12:	bf d7 23             	mov    $0x23d7,%di
    2c15:	0e                   	push   %cs
    2c16:	57                   	push   %di
    2c17:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    2c1c:	74 06                	je     0x2c24
    2c1e:	80 7e f9 0a          	cmpb   $0xa,-0x7(%bp)
    2c22:	74 0d                	je     0x2c31
    2c24:	80 3e 08 3a 18       	cmpb   $0x18,0x3a08
    2c29:	77 10                	ja     0x2c3b
    2c2b:	80 7e f9 0b          	cmpb   $0xb,-0x7(%bp)
    2c2f:	75 0a                	jne    0x2c3b
    2c31:	b0 01                	mov    $0x1,%al
    2c33:	50                   	push   %ax
    2c34:	9a 5c 13 02 06       	lcall  $0x602,$0x135c
    2c39:	eb 09                	jmp    0x2c44
    2c3b:	b8 2c 01             	mov    $0x12c,%ax
    2c3e:	50                   	push   %ax
    2c3f:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    2c44:	31 c0                	xor    %ax,%ax
    2c46:	a3 8c 45             	mov    %ax,0x458c
    2c49:	89 ec                	mov    %bp,%sp
    2c4b:	5d                   	pop    %bp
    2c4c:	cb                   	lret
    2c4d:	55                   	push   %bp
    2c4e:	89 e5                	mov    %sp,%bp
    2c50:	83 ec 10             	sub    $0x10,%sp
    2c53:	80 7e 06 02          	cmpb   $0x2,0x6(%bp)
    2c57:	75 6d                	jne    0x2cc6
    2c59:	c7 46 f0 02 00       	movw   $0x2,-0x10(%bp)
    2c5e:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    2c63:	75 07                	jne    0x2c6c
    2c65:	c7 46 f2 01 00       	movw   $0x1,-0xe(%bp)
    2c6a:	eb 05                	jmp    0x2c71
    2c6c:	c7 46 f2 03 00       	movw   $0x3,-0xe(%bp)
    2c71:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    2c76:	eb 03                	jmp    0x2c7b
    2c78:	ff 46 fe             	incw   -0x2(%bp)
    2c7b:	8b 7e fe             	mov    -0x2(%bp),%di
    2c7e:	d1 e7                	shl    %di
    2c80:	8b 7b ee             	mov    -0x12(%bp,%di),%di
    2c83:	d1 e7                	shl    %di
    2c85:	ff b5 a2 37          	push   0x37a2(%di)
    2c89:	8b 7e fe             	mov    -0x2(%bp),%di
    2c8c:	d1 e7                	shl    %di
    2c8e:	8b 7b ee             	mov    -0x12(%bp,%di),%di
    2c91:	d1 e7                	shl    %di
    2c93:	ff b5 a8 37          	push   0x37a8(%di)
    2c97:	b8 3d 00             	mov    $0x3d,%ax
    2c9a:	50                   	push   %ax
    2c9b:	b8 2e 00             	mov    $0x2e,%ax
    2c9e:	50                   	push   %ax
    2c9f:	b8 01 00             	mov    $0x1,%ax
    2ca2:	50                   	push   %ax
    2ca3:	ff 36 26 37          	push   0x3726
    2ca7:	ff 36 30 37          	push   0x3730
    2cab:	31 c0                	xor    %ax,%ax
    2cad:	50                   	push   %ax
    2cae:	b0 02                	mov    $0x2,%al
    2cb0:	50                   	push   %ax
    2cb1:	b0 00                	mov    $0x0,%al
    2cb3:	50                   	push   %ax
    2cb4:	b0 00                	mov    $0x0,%al
    2cb6:	50                   	push   %ax
    2cb7:	b8 64 00             	mov    $0x64,%ax
    2cba:	50                   	push   %ax
    2cbb:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    2cc0:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    2cc4:	75 b2                	jne    0x2c78
    2cc6:	80 7e 06 03          	cmpb   $0x3,0x6(%bp)
    2cca:	74 03                	je     0x2ccf
    2ccc:	e9 44 01             	jmp    0x2e13
    2ccf:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    2cd4:	a0 ba 38             	mov    0x38ba,%al
    2cd7:	30 e4                	xor    %ah,%ah
    2cd9:	8b f8                	mov    %ax,%di
    2cdb:	d1 e7                	shl    %di
    2cdd:	ff b5 ae 37          	push   0x37ae(%di)
    2ce1:	a0 ba 38             	mov    0x38ba,%al
    2ce4:	30 e4                	xor    %ah,%ah
    2ce6:	8b f8                	mov    %ax,%di
    2ce8:	d1 e7                	shl    %di
    2cea:	ff b5 b4 37          	push   0x37b4(%di)
    2cee:	b8 37 00             	mov    $0x37,%ax
    2cf1:	50                   	push   %ax
    2cf2:	b8 27 00             	mov    $0x27,%ax
    2cf5:	50                   	push   %ax
    2cf6:	b8 01 00             	mov    $0x1,%ax
    2cf9:	50                   	push   %ax
    2cfa:	ff 36 28 37          	push   0x3728
    2cfe:	ff 36 32 37          	push   0x3732
    2d02:	31 c0                	xor    %ax,%ax
    2d04:	50                   	push   %ax
    2d05:	b0 02                	mov    $0x2,%al
    2d07:	50                   	push   %ax
    2d08:	b0 00                	mov    $0x0,%al
    2d0a:	50                   	push   %ax
    2d0b:	b0 00                	mov    $0x0,%al
    2d0d:	50                   	push   %ax
    2d0e:	31 c0                	xor    %ax,%ax
    2d10:	50                   	push   %ax
    2d11:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    2d16:	b8 95 01             	mov    $0x195,%ax
    2d19:	50                   	push   %ax
    2d1a:	b8 69 00             	mov    $0x69,%ax
    2d1d:	50                   	push   %ax
    2d1e:	ff 36 04 37          	push   0x3704
    2d22:	ff 36 06 37          	push   0x3706
    2d26:	b8 01 00             	mov    $0x1,%ax
    2d29:	50                   	push   %ax
    2d2a:	ff 36 e4 36          	push   0x36e4
    2d2e:	ff 36 e6 36          	push   0x36e6
    2d32:	31 c0                	xor    %ax,%ax
    2d34:	50                   	push   %ax
    2d35:	b0 02                	mov    $0x2,%al
    2d37:	50                   	push   %ax
    2d38:	b0 00                	mov    $0x0,%al
    2d3a:	50                   	push   %ax
    2d3b:	b0 00                	mov    $0x0,%al
    2d3d:	50                   	push   %ax
    2d3e:	31 c0                	xor    %ax,%ax
    2d40:	50                   	push   %ax
    2d41:	9a cb 0a bf 0a       	lcall  $0xabf,$0xacb
    2d46:	a0 ba 38             	mov    0x38ba,%al
    2d49:	30 e4                	xor    %ah,%ah
    2d4b:	8b f8                	mov    %ax,%di
    2d4d:	d1 e7                	shl    %di
    2d4f:	ff b5 ea 36          	push   0x36ea(%di)
    2d53:	a0 ba 38             	mov    0x38ba,%al
    2d56:	30 e4                	xor    %ah,%ah
    2d58:	8b f8                	mov    %ax,%di
    2d5a:	d1 e7                	shl    %di
    2d5c:	ff b5 f0 36          	push   0x36f0(%di)
    2d60:	ff 36 04 37          	push   0x3704
    2d64:	ff 36 06 37          	push   0x3706
    2d68:	b8 01 00             	mov    $0x1,%ax
    2d6b:	50                   	push   %ax
    2d6c:	ff 36 e4 36          	push   0x36e4
    2d70:	ff 36 e6 36          	push   0x36e6
    2d74:	31 c0                	xor    %ax,%ax
    2d76:	50                   	push   %ax
    2d77:	b0 02                	mov    $0x2,%al
    2d79:	50                   	push   %ax
    2d7a:	b0 00                	mov    $0x0,%al
    2d7c:	50                   	push   %ax
    2d7d:	b0 00                	mov    $0x0,%al
    2d7f:	50                   	push   %ax
    2d80:	31 c0                	xor    %ax,%ax
    2d82:	50                   	push   %ax
    2d83:	9a cb 0a bf 0a       	lcall  $0xabf,$0xacb
    2d88:	b8 95 01             	mov    $0x195,%ax
    2d8b:	50                   	push   %ax
    2d8c:	b8 69 00             	mov    $0x69,%ax
    2d8f:	50                   	push   %ax
    2d90:	ff 36 08 37          	push   0x3708
    2d94:	ff 36 0a 37          	push   0x370a
    2d98:	b8 01 00             	mov    $0x1,%ax
    2d9b:	50                   	push   %ax
    2d9c:	ff 36 e8 36          	push   0x36e8
    2da0:	ff 36 ea 36          	push   0x36ea
    2da4:	31 c0                	xor    %ax,%ax
    2da6:	50                   	push   %ax
    2da7:	b0 02                	mov    $0x2,%al
    2da9:	50                   	push   %ax
    2daa:	b0 00                	mov    $0x0,%al
    2dac:	50                   	push   %ax
    2dad:	b0 00                	mov    $0x0,%al
    2daf:	50                   	push   %ax
    2db0:	31 c0                	xor    %ax,%ax
    2db2:	50                   	push   %ax
    2db3:	9a cb 0a bf 0a       	lcall  $0xabf,$0xacb
    2db8:	a0 ba 38             	mov    0x38ba,%al
    2dbb:	30 e4                	xor    %ah,%ah
    2dbd:	8b f8                	mov    %ax,%di
    2dbf:	d1 e7                	shl    %di
    2dc1:	ff b5 f6 36          	push   0x36f6(%di)
    2dc5:	a0 ba 38             	mov    0x38ba,%al
    2dc8:	30 e4                	xor    %ah,%ah
    2dca:	8b f8                	mov    %ax,%di
    2dcc:	d1 e7                	shl    %di
    2dce:	ff b5 fc 36          	push   0x36fc(%di)
    2dd2:	ff 36 08 37          	push   0x3708
    2dd6:	ff 36 0a 37          	push   0x370a
    2dda:	b8 01 00             	mov    $0x1,%ax
    2ddd:	50                   	push   %ax
    2dde:	ff 36 e8 36          	push   0x36e8
    2de2:	ff 36 ea 36          	push   0x36ea
    2de6:	31 c0                	xor    %ax,%ax
    2de8:	50                   	push   %ax
    2de9:	b0 02                	mov    $0x2,%al
    2deb:	50                   	push   %ax
    2dec:	b0 00                	mov    $0x0,%al
    2dee:	50                   	push   %ax
    2def:	b0 00                	mov    $0x0,%al
    2df1:	50                   	push   %ax
    2df2:	31 c0                	xor    %ax,%ax
    2df4:	50                   	push   %ax
    2df5:	9a cb 0a bf 0a       	lcall  $0xabf,$0xacb
    2dfa:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    2dff:	74 0d                	je     0x2e0e
    2e01:	ff 36 80 45          	push   0x4580
    2e05:	ff 36 82 45          	push   0x4582
    2e09:	9a 43 08 a3 0c       	lcall  $0xca3,$0x843
    2e0e:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    2e13:	80 7e 06 04          	cmpb   $0x4,0x6(%bp)
    2e17:	75 30                	jne    0x2e49
    2e19:	ff 36 be 37          	push   0x37be
    2e1d:	ff 36 c2 37          	push   0x37c2
    2e21:	b8 40 00             	mov    $0x40,%ax
    2e24:	50                   	push   %ax
    2e25:	b8 22 00             	mov    $0x22,%ax
    2e28:	50                   	push   %ax
    2e29:	b8 01 00             	mov    $0x1,%ax
    2e2c:	50                   	push   %ax
    2e2d:	ff 36 2a 37          	push   0x372a
    2e31:	ff 36 34 37          	push   0x3734
    2e35:	31 c0                	xor    %ax,%ax
    2e37:	50                   	push   %ax
    2e38:	b0 02                	mov    $0x2,%al
    2e3a:	50                   	push   %ax
    2e3b:	b0 00                	mov    $0x0,%al
    2e3d:	50                   	push   %ax
    2e3e:	b0 00                	mov    $0x0,%al
    2e40:	50                   	push   %ax
    2e41:	31 c0                	xor    %ax,%ax
    2e43:	50                   	push   %ax
    2e44:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    2e49:	80 7e 06 05          	cmpb   $0x5,0x6(%bp)
    2e4d:	74 03                	je     0x2e52
    2e4f:	e9 96 00             	jmp    0x2ee8
    2e52:	b8 3c 00             	mov    $0x3c,%ax
    2e55:	50                   	push   %ax
    2e56:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    2e5b:	c7 46 f6 fa 00       	movw   $0xfa,-0xa(%bp)
    2e60:	c7 46 f8 fa 00       	movw   $0xfa,-0x8(%bp)
    2e65:	c7 46 fa fa 00       	movw   $0xfa,-0x6(%bp)
    2e6a:	c7 46 f0 50 00       	movw   $0x50,-0x10(%bp)
    2e6f:	c7 46 f2 78 00       	movw   $0x78,-0xe(%bp)
    2e74:	c7 46 f4 a0 00       	movw   $0xa0,-0xc(%bp)
    2e79:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    2e7e:	eb 03                	jmp    0x2e83
    2e80:	ff 46 fe             	incw   -0x2(%bp)
    2e83:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    2e88:	75 0d                	jne    0x2e97
    2e8a:	8b 7e fe             	mov    -0x2(%bp),%di
    2e8d:	d1 e7                	shl    %di
    2e8f:	ff 73 ee             	push   -0x12(%bp,%di)
    2e92:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    2e97:	8b 7e fe             	mov    -0x2(%bp),%di
    2e9a:	d1 e7                	shl    %di
    2e9c:	ff b5 c2 37          	push   0x37c2(%di)
    2ea0:	8b 7e fe             	mov    -0x2(%bp),%di
    2ea3:	d1 e7                	shl    %di
    2ea5:	ff b5 c8 37          	push   0x37c8(%di)
    2ea9:	b8 34 00             	mov    $0x34,%ax
    2eac:	50                   	push   %ax
    2ead:	b8 27 00             	mov    $0x27,%ax
    2eb0:	50                   	push   %ax
    2eb1:	b8 01 00             	mov    $0x1,%ax
    2eb4:	50                   	push   %ax
    2eb5:	ff 36 2c 37          	push   0x372c
    2eb9:	ff 36 36 37          	push   0x3736
    2ebd:	31 c0                	xor    %ax,%ax
    2ebf:	50                   	push   %ax
    2ec0:	b0 02                	mov    $0x2,%al
    2ec2:	50                   	push   %ax
    2ec3:	b0 00                	mov    $0x0,%al
    2ec5:	50                   	push   %ax
    2ec6:	b0 00                	mov    $0x0,%al
    2ec8:	50                   	push   %ax
    2ec9:	8b 7e fe             	mov    -0x2(%bp),%di
    2ecc:	d1 e7                	shl    %di
    2ece:	ff 73 f4             	push   -0xc(%bp,%di)
    2ed1:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    2ed6:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    2edb:	75 05                	jne    0x2ee2
    2edd:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    2ee2:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    2ee6:	75 98                	jne    0x2e80
    2ee8:	89 ec                	mov    %bp,%sp
    2eea:	5d                   	pop    %bp
    2eeb:	ca 02 00             	lret   $0x2
    2eee:	55                   	push   %bp
    2eef:	89 e5                	mov    %sp,%bp
    2ef1:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    2ef6:	75 07                	jne    0x2eff
    2ef8:	c6 06 ba 38 01       	movb   $0x1,0x38ba
    2efd:	eb 09                	jmp    0x2f08
    2eff:	a0 ba 38             	mov    0x38ba,%al
    2f02:	30 e4                	xor    %ah,%ah
    2f04:	40                   	inc    %ax
    2f05:	a2 ba 38             	mov    %al,0x38ba
    2f08:	b0 03                	mov    $0x3,%al
    2f0a:	50                   	push   %ax
    2f0b:	0e                   	push   %cs
    2f0c:	e8 3e fd             	call   0x2c4d
    2f0f:	89 ec                	mov    %bp,%sp
    2f11:	5d                   	pop    %bp
    2f12:	cb                   	lret
    2f13:	55                   	push   %bp
    2f14:	89 e5                	mov    %sp,%bp
    2f16:	83 ec 04             	sub    $0x4,%sp
    2f19:	c6 46 ff 00          	movb   $0x0,-0x1(%bp)
    2f1d:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    2f22:	eb 03                	jmp    0x2f27
    2f24:	ff 46 fc             	incw   -0x4(%bp)
    2f27:	a1 80 45             	mov    0x4580,%ax
    2f2a:	8b 7e fc             	mov    -0x4(%bp),%di
    2f2d:	d1 e7                	shl    %di
    2f2f:	3b 85 4a 37          	cmp    0x374a(%di),%ax
    2f33:	7c 39                	jl     0x2f6e
    2f35:	a1 80 45             	mov    0x4580,%ax
    2f38:	8b 7e fc             	mov    -0x4(%bp),%di
    2f3b:	d1 e7                	shl    %di
    2f3d:	3b 85 72 37          	cmp    0x3772(%di),%ax
    2f41:	7f 2b                	jg     0x2f6e
    2f43:	a1 82 45             	mov    0x4582,%ax
    2f46:	8b 7e fc             	mov    -0x4(%bp),%di
    2f49:	d1 e7                	shl    %di
    2f4b:	3b 85 5e 37          	cmp    0x375e(%di),%ax
    2f4f:	7c 1d                	jl     0x2f6e
    2f51:	a1 82 45             	mov    0x4582,%ax
    2f54:	8b 7e fc             	mov    -0x4(%bp),%di
    2f57:	d1 e7                	shl    %di
    2f59:	3b 85 86 37          	cmp    0x3786(%di),%ax
    2f5d:	7f 0f                	jg     0x2f6e
    2f5f:	8a 46 fc             	mov    -0x4(%bp),%al
    2f62:	c4 7e 06             	les    0x6(%bp),%di
    2f65:	26 88 05             	mov    %al,%es:(%di)
    2f68:	c6 46 ff 01          	movb   $0x1,-0x1(%bp)
    2f6c:	eb 06                	jmp    0x2f74
    2f6e:	83 7e fc 0a          	cmpw   $0xa,-0x4(%bp)
    2f72:	75 b0                	jne    0x2f24
    2f74:	8a 46 ff             	mov    -0x1(%bp),%al
    2f77:	89 ec                	mov    %bp,%sp
    2f79:	5d                   	pop    %bp
    2f7a:	ca 04 00             	lret   $0x4
    2f7d:	55                   	push   %bp
    2f7e:	89 e5                	mov    %sp,%bp
    2f80:	83 ec 04             	sub    $0x4,%sp
    2f83:	c6 46 ff 00          	movb   $0x0,-0x1(%bp)
    2f87:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    2f8c:	eb 03                	jmp    0x2f91
    2f8e:	ff 46 fc             	incw   -0x4(%bp)
    2f91:	a1 80 45             	mov    0x4580,%ax
    2f94:	8b 7e fc             	mov    -0x4(%bp),%di
    2f97:	d1 e7                	shl    %di
    2f99:	3b 85 22 37          	cmp    0x3722(%di),%ax
    2f9d:	7c 39                	jl     0x2fd8
    2f9f:	a1 80 45             	mov    0x4580,%ax
    2fa2:	8b 7e fc             	mov    -0x4(%bp),%di
    2fa5:	d1 e7                	shl    %di
    2fa7:	3b 85 36 37          	cmp    0x3736(%di),%ax
    2fab:	7f 2b                	jg     0x2fd8
    2fad:	a1 82 45             	mov    0x4582,%ax
    2fb0:	8b 7e fc             	mov    -0x4(%bp),%di
    2fb3:	d1 e7                	shl    %di
    2fb5:	3b 85 2c 37          	cmp    0x372c(%di),%ax
    2fb9:	7c 1d                	jl     0x2fd8
    2fbb:	a1 82 45             	mov    0x4582,%ax
    2fbe:	8b 7e fc             	mov    -0x4(%bp),%di
    2fc1:	d1 e7                	shl    %di
    2fc3:	3b 85 40 37          	cmp    0x3740(%di),%ax
    2fc7:	7f 0f                	jg     0x2fd8
    2fc9:	8a 46 fc             	mov    -0x4(%bp),%al
    2fcc:	c4 7e 06             	les    0x6(%bp),%di
    2fcf:	26 88 05             	mov    %al,%es:(%di)
    2fd2:	c6 46 ff 01          	movb   $0x1,-0x1(%bp)
    2fd6:	eb 06                	jmp    0x2fde
    2fd8:	83 7e fc 05          	cmpw   $0x5,-0x4(%bp)
    2fdc:	75 b0                	jne    0x2f8e
    2fde:	8a 46 ff             	mov    -0x1(%bp),%al
    2fe1:	89 ec                	mov    %bp,%sp
    2fe3:	5d                   	pop    %bp
    2fe4:	ca 04 00             	lret   $0x4
    2fe7:	55                   	push   %bp
    2fe8:	89 e5                	mov    %sp,%bp
    2fea:	83 ec 04             	sub    $0x4,%sp
    2fed:	c6 46 ff 00          	movb   $0x0,-0x1(%bp)
    2ff1:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    2ff6:	eb 03                	jmp    0x2ffb
    2ff8:	ff 46 fc             	incw   -0x4(%bp)
    2ffb:	a1 80 45             	mov    0x4580,%ax
    2ffe:	8b 7e fc             	mov    -0x4(%bp),%di
    3001:	d1 e7                	shl    %di
    3003:	3b 85 0e 37          	cmp    0x370e(%di),%ax
    3007:	7c 3f                	jl     0x3048
    3009:	8b 7e fc             	mov    -0x4(%bp),%di
    300c:	d1 e7                	shl    %di
    300e:	8b 85 0e 37          	mov    0x370e(%di),%ax
    3012:	05 1f 00             	add    $0x1f,%ax
    3015:	3b 06 80 45          	cmp    0x4580,%ax
    3019:	7c 2d                	jl     0x3048
    301b:	a1 82 45             	mov    0x4582,%ax
    301e:	8b 7e fc             	mov    -0x4(%bp),%di
    3021:	d1 e7                	shl    %di
    3023:	3b 85 18 37          	cmp    0x3718(%di),%ax
    3027:	7c 1f                	jl     0x3048
    3029:	8b 7e fc             	mov    -0x4(%bp),%di
    302c:	d1 e7                	shl    %di
    302e:	8b 85 18 37          	mov    0x3718(%di),%ax
    3032:	05 19 00             	add    $0x19,%ax
    3035:	3b 06 82 45          	cmp    0x4582,%ax
    3039:	7c 0d                	jl     0x3048
    303b:	8a 46 fc             	mov    -0x4(%bp),%al
    303e:	c4 7e 06             	les    0x6(%bp),%di
    3041:	26 88 05             	mov    %al,%es:(%di)
    3044:	c6 46 ff 01          	movb   $0x1,-0x1(%bp)
    3048:	83 7e fc 05          	cmpw   $0x5,-0x4(%bp)
    304c:	75 aa                	jne    0x2ff8
    304e:	8a 46 ff             	mov    -0x1(%bp),%al
    3051:	89 ec                	mov    %bp,%sp
    3053:	5d                   	pop    %bp
    3054:	ca 04 00             	lret   $0x4
    3057:	55                   	push   %bp
    3058:	89 e5                	mov    %sp,%bp
    305a:	83 ec 04             	sub    $0x4,%sp
    305d:	b8 01 00             	mov    $0x1,%ax
    3060:	50                   	push   %ax
    3061:	8d 46 fc             	lea    -0x4(%bp),%ax
    3064:	8c d2                	mov    %ss,%dx
    3066:	52                   	push   %dx
    3067:	50                   	push   %ax
    3068:	b8 05 00             	mov    $0x5,%ax
    306b:	50                   	push   %ax
    306c:	b8 1f 00             	mov    $0x1f,%ax
    306f:	50                   	push   %ax
    3070:	b8 19 00             	mov    $0x19,%ax
    3073:	50                   	push   %ax
    3074:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    3079:	ff 76 fe             	push   -0x2(%bp)
    307c:	ff 76 fc             	push   -0x4(%bp)
    307f:	8b 7e 06             	mov    0x6(%bp),%di
    3082:	d1 e7                	shl    %di
    3084:	ff b5 0e 37          	push   0x370e(%di)
    3088:	8b 7e 06             	mov    0x6(%bp),%di
    308b:	d1 e7                	shl    %di
    308d:	ff b5 18 37          	push   0x3718(%di)
    3091:	b8 1f 00             	mov    $0x1f,%ax
    3094:	50                   	push   %ax
    3095:	b8 19 00             	mov    $0x19,%ax
    3098:	50                   	push   %ax
    3099:	31 c0                	xor    %ax,%ax
    309b:	50                   	push   %ax
    309c:	b0 00                	mov    $0x0,%al
    309e:	50                   	push   %ax
    309f:	b0 00                	mov    $0x0,%al
    30a1:	50                   	push   %ax
    30a2:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    30a7:	8b 7e 06             	mov    0x6(%bp),%di
    30aa:	d1 e7                	shl    %di
    30ac:	8b 85 0e 37          	mov    0x370e(%di),%ax
    30b0:	05 02 00             	add    $0x2,%ax
    30b3:	50                   	push   %ax
    30b4:	8b 7e 06             	mov    0x6(%bp),%di
    30b7:	d1 e7                	shl    %di
    30b9:	8b 85 18 37          	mov    0x3718(%di),%ax
    30bd:	05 02 00             	add    $0x2,%ax
    30c0:	50                   	push   %ax
    30c1:	b8 1c 00             	mov    $0x1c,%ax
    30c4:	50                   	push   %ax
    30c5:	b8 16 00             	mov    $0x16,%ax
    30c8:	50                   	push   %ax
    30c9:	31 c0                	xor    %ax,%ax
    30cb:	50                   	push   %ax
    30cc:	8b 7e 06             	mov    0x6(%bp),%di
    30cf:	d1 e7                	shl    %di
    30d1:	8b 85 0e 37          	mov    0x370e(%di),%ax
    30d5:	40                   	inc    %ax
    30d6:	50                   	push   %ax
    30d7:	8b 7e 06             	mov    0x6(%bp),%di
    30da:	d1 e7                	shl    %di
    30dc:	8b 85 18 37          	mov    0x3718(%di),%ax
    30e0:	40                   	inc    %ax
    30e1:	50                   	push   %ax
    30e2:	31 c0                	xor    %ax,%ax
    30e4:	50                   	push   %ax
    30e5:	b0 02                	mov    $0x2,%al
    30e7:	50                   	push   %ax
    30e8:	b0 00                	mov    $0x0,%al
    30ea:	50                   	push   %ax
    30eb:	b0 00                	mov    $0x0,%al
    30ed:	50                   	push   %ax
    30ee:	31 c0                	xor    %ax,%ax
    30f0:	50                   	push   %ax
    30f1:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    30f6:	bf 80 45             	mov    $0x4580,%di
    30f9:	1e                   	push   %ds
    30fa:	57                   	push   %di
    30fb:	bf 82 45             	mov    $0x4582,%di
    30fe:	1e                   	push   %ds
    30ff:	57                   	push   %di
    3100:	bf 84 45             	mov    $0x4584,%di
    3103:	1e                   	push   %ds
    3104:	57                   	push   %di
    3105:	9a 76 08 a3 0c       	lcall  $0xca3,$0x876
    310a:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    310f:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    3114:	74 e0                	je     0x30f6
    3116:	ff 76 fe             	push   -0x2(%bp)
    3119:	ff 76 fc             	push   -0x4(%bp)
    311c:	31 c0                	xor    %ax,%ax
    311e:	50                   	push   %ax
    311f:	8b 7e 06             	mov    0x6(%bp),%di
    3122:	d1 e7                	shl    %di
    3124:	ff b5 0e 37          	push   0x370e(%di)
    3128:	8b 7e 06             	mov    0x6(%bp),%di
    312b:	d1 e7                	shl    %di
    312d:	ff b5 18 37          	push   0x3718(%di)
    3131:	31 c0                	xor    %ax,%ax
    3133:	50                   	push   %ax
    3134:	b0 02                	mov    $0x2,%al
    3136:	50                   	push   %ax
    3137:	b0 00                	mov    $0x0,%al
    3139:	50                   	push   %ax
    313a:	b0 00                	mov    $0x0,%al
    313c:	50                   	push   %ax
    313d:	31 c0                	xor    %ax,%ax
    313f:	50                   	push   %ax
    3140:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    3145:	ff 76 fe             	push   -0x2(%bp)
    3148:	ff 76 fc             	push   -0x4(%bp)
    314b:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    3150:	89 ec                	mov    %bp,%sp
    3152:	5d                   	pop    %bp
    3153:	ca 02 00             	lret   $0x2
    3156:	08 4e 69             	or     %cl,0x69(%bp)
    3159:	6e                   	outsb  %ds:(%si),(%dx)
    315a:	65 2e 6c             	gs cs insb (%dx),%es:(%di)
    315d:	69 62 0b 54 46       	imul   $0x4654,0xb(%bp,%si),%sp
    3162:	5f                   	pop    %di
    3163:	4e                   	dec    %si
    3164:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    3169:	63 78 55             	arpl   %di,0x55(%bx,%si)
    316c:	89 e5                	mov    %sp,%bp
    316e:	83 ec 02             	sub    $0x2,%sp
    3171:	bf 56 31             	mov    $0x3156,%di
    3174:	0e                   	push   %cs
    3175:	57                   	push   %di
    3176:	bf 5f 31             	mov    $0x315f,%di
    3179:	0e                   	push   %cs
    317a:	57                   	push   %di
    317b:	31 c0                	xor    %ax,%ax
    317d:	50                   	push   %ax
    317e:	31 c0                	xor    %ax,%ax
    3180:	50                   	push   %ax
    3181:	31 c0                	xor    %ax,%ax
    3183:	50                   	push   %ax
    3184:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    3189:	80 3e 0d 37 01       	cmpb   $0x1,0x370d
    318e:	75 30                	jne    0x31c0
    3190:	ff 36 9c 37          	push   0x379c
    3194:	ff 36 a0 37          	push   0x37a0
    3198:	b8 46 00             	mov    $0x46,%ax
    319b:	50                   	push   %ax
    319c:	b8 2a 00             	mov    $0x2a,%ax
    319f:	50                   	push   %ax
    31a0:	b8 01 00             	mov    $0x1,%ax
    31a3:	50                   	push   %ax
    31a4:	ff 36 24 37          	push   0x3724
    31a8:	ff 36 2e 37          	push   0x372e
    31ac:	31 c0                	xor    %ax,%ax
    31ae:	50                   	push   %ax
    31af:	b0 02                	mov    $0x2,%al
    31b1:	50                   	push   %ax
    31b2:	b0 00                	mov    $0x0,%al
    31b4:	50                   	push   %ax
    31b5:	b0 00                	mov    $0x0,%al
    31b7:	50                   	push   %ax
    31b8:	31 c0                	xor    %ax,%ax
    31ba:	50                   	push   %ax
    31bb:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    31c0:	80 3e 0c 37 00       	cmpb   $0x0,0x370c
    31c5:	75 30                	jne    0x31f7
    31c7:	ff 36 a8 37          	push   0x37a8
    31cb:	ff 36 ae 37          	push   0x37ae
    31cf:	b8 3d 00             	mov    $0x3d,%ax
    31d2:	50                   	push   %ax
    31d3:	b8 2e 00             	mov    $0x2e,%ax
    31d6:	50                   	push   %ax
    31d7:	b8 01 00             	mov    $0x1,%ax
    31da:	50                   	push   %ax
    31db:	ff 36 26 37          	push   0x3726
    31df:	ff 36 30 37          	push   0x3730
    31e3:	31 c0                	xor    %ax,%ax
    31e5:	50                   	push   %ax
    31e6:	b0 02                	mov    $0x2,%al
    31e8:	50                   	push   %ax
    31e9:	b0 00                	mov    $0x0,%al
    31eb:	50                   	push   %ax
    31ec:	b0 00                	mov    $0x0,%al
    31ee:	50                   	push   %ax
    31ef:	31 c0                	xor    %ax,%ax
    31f1:	50                   	push   %ax
    31f2:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    31f7:	a0 ba 38             	mov    0x38ba,%al
    31fa:	30 e4                	xor    %ah,%ah
    31fc:	8b f8                	mov    %ax,%di
    31fe:	d1 e7                	shl    %di
    3200:	ff b5 ae 37          	push   0x37ae(%di)
    3204:	a0 ba 38             	mov    0x38ba,%al
    3207:	30 e4                	xor    %ah,%ah
    3209:	8b f8                	mov    %ax,%di
    320b:	d1 e7                	shl    %di
    320d:	ff b5 b4 37          	push   0x37b4(%di)
    3211:	b8 37 00             	mov    $0x37,%ax
    3214:	50                   	push   %ax
    3215:	b8 27 00             	mov    $0x27,%ax
    3218:	50                   	push   %ax
    3219:	b8 01 00             	mov    $0x1,%ax
    321c:	50                   	push   %ax
    321d:	ff 36 28 37          	push   0x3728
    3221:	ff 36 32 37          	push   0x3732
    3225:	31 c0                	xor    %ax,%ax
    3227:	50                   	push   %ax
    3228:	b0 02                	mov    $0x2,%al
    322a:	50                   	push   %ax
    322b:	b0 00                	mov    $0x0,%al
    322d:	50                   	push   %ax
    322e:	b0 00                	mov    $0x0,%al
    3230:	50                   	push   %ax
    3231:	31 c0                	xor    %ax,%ax
    3233:	50                   	push   %ax
    3234:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    3239:	a0 ba 38             	mov    0x38ba,%al
    323c:	30 e4                	xor    %ah,%ah
    323e:	8b f8                	mov    %ax,%di
    3240:	d1 e7                	shl    %di
    3242:	ff b5 ea 36          	push   0x36ea(%di)
    3246:	a0 ba 38             	mov    0x38ba,%al
    3249:	30 e4                	xor    %ah,%ah
    324b:	8b f8                	mov    %ax,%di
    324d:	d1 e7                	shl    %di
    324f:	ff b5 f0 36          	push   0x36f0(%di)
    3253:	ff 36 04 37          	push   0x3704
    3257:	ff 36 06 37          	push   0x3706
    325b:	b8 01 00             	mov    $0x1,%ax
    325e:	50                   	push   %ax
    325f:	ff 36 e4 36          	push   0x36e4
    3263:	ff 36 e6 36          	push   0x36e6
    3267:	31 c0                	xor    %ax,%ax
    3269:	50                   	push   %ax
    326a:	b0 02                	mov    $0x2,%al
    326c:	50                   	push   %ax
    326d:	b0 00                	mov    $0x0,%al
    326f:	50                   	push   %ax
    3270:	b0 00                	mov    $0x0,%al
    3272:	50                   	push   %ax
    3273:	31 c0                	xor    %ax,%ax
    3275:	50                   	push   %ax
    3276:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    327b:	a0 ba 38             	mov    0x38ba,%al
    327e:	30 e4                	xor    %ah,%ah
    3280:	8b f8                	mov    %ax,%di
    3282:	d1 e7                	shl    %di
    3284:	ff b5 f6 36          	push   0x36f6(%di)
    3288:	a0 ba 38             	mov    0x38ba,%al
    328b:	30 e4                	xor    %ah,%ah
    328d:	8b f8                	mov    %ax,%di
    328f:	d1 e7                	shl    %di
    3291:	ff b5 fc 36          	push   0x36fc(%di)
    3295:	ff 36 08 37          	push   0x3708
    3299:	ff 36 0a 37          	push   0x370a
    329d:	b8 01 00             	mov    $0x1,%ax
    32a0:	50                   	push   %ax
    32a1:	ff 36 e8 36          	push   0x36e8
    32a5:	ff 36 ea 36          	push   0x36ea
    32a9:	31 c0                	xor    %ax,%ax
    32ab:	50                   	push   %ax
    32ac:	b0 02                	mov    $0x2,%al
    32ae:	50                   	push   %ax
    32af:	b0 00                	mov    $0x0,%al
    32b1:	50                   	push   %ax
    32b2:	b0 00                	mov    $0x0,%al
    32b4:	50                   	push   %ax
    32b5:	31 c0                	xor    %ax,%ax
    32b7:	50                   	push   %ax
    32b8:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    32bd:	89 ec                	mov    %bp,%sp
    32bf:	5d                   	pop    %bp
    32c0:	cb                   	lret
    32c1:	55                   	push   %bp
    32c2:	89 e5                	mov    %sp,%bp
    32c4:	83 ec 08             	sub    $0x8,%sp
    32c7:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    32cc:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    32d1:	eb 03                	jmp    0x32d6
    32d3:	ff 46 fc             	incw   -0x4(%bp)
    32d6:	8b 7e fc             	mov    -0x4(%bp),%di
    32d9:	8a 85 ff ff          	mov    -0x1(%di),%al
    32dd:	30 e4                	xor    %ah,%ah
    32df:	8b 7e fa             	mov    -0x6(%bp),%di
    32e2:	d1 e7                	shl    %di
    32e4:	89 85 5c 5c          	mov    %ax,0x5c5c(%di)
    32e8:	8b 7e fc             	mov    -0x4(%bp),%di
    32eb:	8a 85 29 00          	mov    0x29(%di),%al
    32ef:	30 e4                	xor    %ah,%ah
    32f1:	8b 7e fa             	mov    -0x6(%bp),%di
    32f4:	d1 e7                	shl    %di
    32f6:	89 85 04 5a          	mov    %ax,0x5a04(%di)
    32fa:	ff 46 fa             	incw   -0x6(%bp)
    32fd:	8b 7e fa             	mov    -0x6(%bp),%di
    3300:	d1 e7                	shl    %di
    3302:	31 c0                	xor    %ax,%ax
    3304:	89 85 5c 5c          	mov    %ax,0x5c5c(%di)
    3308:	8b 7e fa             	mov    -0x6(%bp),%di
    330b:	d1 e7                	shl    %di
    330d:	31 c0                	xor    %ax,%ax
    330f:	89 85 04 5a          	mov    %ax,0x5a04(%di)
    3313:	ff 46 fa             	incw   -0x6(%bp)
    3316:	83 7e fc 29          	cmpw   $0x29,-0x4(%bp)
    331a:	75 b7                	jne    0x32d3
    331c:	83 3e be 5e 00       	cmpw   $0x0,0x5ebe
    3321:	75 17                	jne    0x333a
    3323:	b8 52 00             	mov    $0x52,%ax
    3326:	50                   	push   %ax
    3327:	b8 0c 00             	mov    $0xc,%ax
    332a:	50                   	push   %ax
    332b:	b8 81 00             	mov    $0x81,%ax
    332e:	31 db                	xor    %bx,%bx
    3330:	31 d2                	xor    %dx,%dx
    3332:	52                   	push   %dx
    3333:	53                   	push   %bx
    3334:	50                   	push   %ax
    3335:	9a 2e 00 f5 1b       	lcall  $0x1bf5,$0x2e
    333a:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    333f:	75 11                	jne    0x3352
    3341:	c6 06 f7 2f 01       	movb   $0x1,0x2ff7
    3346:	9a a3 02 f5 1b       	lcall  $0x1bf5,$0x2a3
    334b:	9a 58 02 f5 1b       	lcall  $0x1bf5,$0x258
    3350:	eb 05                	jmp    0x3357
    3352:	c6 06 f7 2f 00       	movb   $0x0,0x2ff7
    3357:	ff 36 80 45          	push   0x4580
    335b:	ff 36 82 45          	push   0x4582
    335f:	9a 43 08 a3 0c       	lcall  $0xca3,$0x843
    3364:	c7 06 8c 45 20 39    	movw   $0x3920,0x458c
    336a:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    336f:	75 03                	jne    0x3374
    3371:	e9 9b 00             	jmp    0x340f
    3374:	bf 80 45             	mov    $0x4580,%di
    3377:	1e                   	push   %ds
    3378:	57                   	push   %di
    3379:	bf 82 45             	mov    $0x4582,%di
    337c:	1e                   	push   %ds
    337d:	57                   	push   %di
    337e:	bf 84 45             	mov    $0x4584,%di
    3381:	1e                   	push   %ds
    3382:	57                   	push   %di
    3383:	9a 76 08 a3 0c       	lcall  $0xca3,$0x876
    3388:	9a 4d 09 a3 0c       	lcall  $0xca3,$0x94d
    338d:	9a 4b 0b 13 1b       	lcall  $0x1b13,$0xb4b
    3392:	08 c0                	or     %al,%al
    3394:	74 08                	je     0x339e
    3396:	9a 5d 0b 13 1b       	lcall  $0x1b13,$0xb5d
    339b:	a3 8c 45             	mov    %ax,0x458c
    339e:	bf 0e 37             	mov    $0x370e,%di
    33a1:	1e                   	push   %ds
    33a2:	57                   	push   %di
    33a3:	0e                   	push   %cs
    33a4:	e8 d6 fb             	call   0x2f7d
    33a7:	08 c0                	or     %al,%al
    33a9:	75 0d                	jne    0x33b8
    33ab:	bf 0e 37             	mov    $0x370e,%di
    33ae:	1e                   	push   %ds
    33af:	57                   	push   %di
    33b0:	0e                   	push   %cs
    33b1:	e8 33 fc             	call   0x2fe7
    33b4:	08 c0                	or     %al,%al
    33b6:	74 55                	je     0x340d
    33b8:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    33bd:	75 4e                	jne    0x340d
    33bf:	a0 0e 37             	mov    0x370e,%al
    33c2:	30 e4                	xor    %ah,%ah
    33c4:	50                   	push   %ax
    33c5:	0e                   	push   %cs
    33c6:	e8 8e fc             	call   0x3057
    33c9:	a0 0e 37             	mov    0x370e,%al
    33cc:	30 e4                	xor    %ah,%ah
    33ce:	3d 01 00             	cmp    $0x1,%ax
    33d1:	75 08                	jne    0x33db
    33d3:	c7 06 8c 45 00 3b    	movw   $0x3b00,0x458c
    33d9:	eb 32                	jmp    0x340d
    33db:	3d 02 00             	cmp    $0x2,%ax
    33de:	75 08                	jne    0x33e8
    33e0:	c7 06 8c 45 00 3c    	movw   $0x3c00,0x458c
    33e6:	eb 25                	jmp    0x340d
    33e8:	3d 03 00             	cmp    $0x3,%ax
    33eb:	75 08                	jne    0x33f5
    33ed:	c7 06 8c 45 00 3d    	movw   $0x3d00,0x458c
    33f3:	eb 18                	jmp    0x340d
    33f5:	3d 04 00             	cmp    $0x4,%ax
    33f8:	75 08                	jne    0x3402
    33fa:	c7 06 8c 45 00 3e    	movw   $0x3e00,0x458c
    3400:	eb 0b                	jmp    0x340d
    3402:	3d 05 00             	cmp    $0x5,%ax
    3405:	75 06                	jne    0x340d
    3407:	c7 06 8c 45 00 3f    	movw   $0x3f00,0x458c
    340d:	eb 11                	jmp    0x3420
    340f:	9a 4b 0b 13 1b       	lcall  $0x1b13,$0xb4b
    3414:	08 c0                	or     %al,%al
    3416:	74 08                	je     0x3420
    3418:	9a 5d 0b 13 1b       	lcall  $0x1b13,$0xb5d
    341d:	a3 8c 45             	mov    %ax,0x458c
    3420:	c6 46 f8 00          	movb   $0x0,-0x8(%bp)
    3424:	8d 7e f9             	lea    -0x7(%bp),%di
    3427:	16                   	push   %ss
    3428:	57                   	push   %di
    3429:	0e                   	push   %cs
    342a:	e8 e6 fa             	call   0x2f13
    342d:	08 c0                	or     %al,%al
    342f:	74 3f                	je     0x3470
    3431:	80 3e 84 45 01       	cmpb   $0x1,0x4584
    3436:	75 38                	jne    0x3470
    3438:	c7 06 8c 45 00 3e    	movw   $0x3e00,0x458c
    343e:	c6 46 f8 01          	movb   $0x1,-0x8(%bp)
    3442:	8a 46 f9             	mov    -0x7(%bp),%al
    3445:	30 e4                	xor    %ah,%ah
    3447:	ba 14 00             	mov    $0x14,%dx
    344a:	f7 e2                	mul    %dx
    344c:	8b c8                	mov    %ax,%cx
    344e:	a0 ba 38             	mov    0x38ba,%al
    3451:	30 e4                	xor    %ah,%ah
    3453:	ba c8 00             	mov    $0xc8,%dx
    3456:	f7 e2                	mul    %dx
    3458:	8b f8                	mov    %ax,%di
    345a:	03 f9                	add    %cx,%di
    345c:	81 c7 d2 2f          	add    $0x2fd2,%di
    3460:	1e                   	push   %ds
    3461:	57                   	push   %di
    3462:	bf 8e 36             	mov    $0x368e,%di
    3465:	1e                   	push   %ds
    3466:	57                   	push   %di
    3467:	b8 08 00             	mov    $0x8,%ax
    346a:	50                   	push   %ax
    346b:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    3470:	a1 8c 45             	mov    0x458c,%ax
    3473:	3d 00 3b             	cmp    $0x3b00,%ax
    3476:	74 03                	je     0x347b
    3478:	e9 bc 00             	jmp    0x3537
    347b:	80 3e 0d 37 01       	cmpb   $0x1,0x370d
    3480:	74 03                	je     0x3485
    3482:	e9 af 00             	jmp    0x3534
    3485:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    348a:	c6 06 8c 36 00       	movb   $0x0,0x368c
    348f:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    3494:	eb 03                	jmp    0x3499
    3496:	ff 46 fc             	incw   -0x4(%bp)
    3499:	8b 46 fc             	mov    -0x4(%bp),%ax
    349c:	ba 14 00             	mov    $0x14,%dx
    349f:	f7 e2                	mul    %dx
    34a1:	8b c8                	mov    %ax,%cx
    34a3:	a0 ba 38             	mov    0x38ba,%al
    34a6:	30 e4                	xor    %ah,%ah
    34a8:	ba c8 00             	mov    $0xc8,%dx
    34ab:	f7 e2                	mul    %dx
    34ad:	8b f8                	mov    %ax,%di
    34af:	03 f9                	add    %cx,%di
    34b1:	81 c7 d2 2f          	add    $0x2fd2,%di
    34b5:	1e                   	push   %ds
    34b6:	57                   	push   %di
    34b7:	bf 8e 36             	mov    $0x368e,%di
    34ba:	1e                   	push   %ds
    34bb:	57                   	push   %di
    34bc:	9a 24 07 ce 1d       	lcall  $0x1dce,$0x724
    34c1:	75 0b                	jne    0x34ce
    34c3:	c6 06 8c 36 01       	movb   $0x1,0x368c
    34c8:	8a 46 fc             	mov    -0x4(%bp),%al
    34cb:	88 46 f9             	mov    %al,-0x7(%bp)
    34ce:	83 7e fc 0a          	cmpw   $0xa,-0x4(%bp)
    34d2:	75 c2                	jne    0x3496
    34d4:	80 3e 8c 36 00       	cmpb   $0x0,0x368c
    34d9:	74 26                	je     0x3501
    34db:	8a 46 f9             	mov    -0x7(%bp),%al
    34de:	30 e4                	xor    %ah,%ah
    34e0:	ba 14 00             	mov    $0x14,%dx
    34e3:	f7 e2                	mul    %dx
    34e5:	8b c8                	mov    %ax,%cx
    34e7:	a0 ba 38             	mov    0x38ba,%al
    34ea:	30 e4                	xor    %ah,%ah
    34ec:	ba c8 00             	mov    $0xc8,%dx
    34ef:	f7 e2                	mul    %dx
    34f1:	8b f8                	mov    %ax,%di
    34f3:	03 f9                	add    %cx,%di
    34f5:	8b 85 db 2f          	mov    0x2fdb(%di),%ax
    34f9:	2d c8 00             	sub    $0xc8,%ax
    34fc:	a3 b6 36             	mov    %ax,0x36b6
    34ff:	eb 05                	jmp    0x3506
    3501:	31 c0                	xor    %ax,%ax
    3503:	a3 b6 36             	mov    %ax,0x36b6
    3506:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    350b:	75 05                	jne    0x3512
    350d:	9a 8a 02 f5 1b       	lcall  $0x1bf5,$0x28a
    3512:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    3517:	75 16                	jne    0x352f
    3519:	9a 34 02 f5 1b       	lcall  $0x1bf5,$0x234
    351e:	bf 18 40             	mov    $0x4018,%di
    3521:	1e                   	push   %ds
    3522:	57                   	push   %di
    3523:	bf 1c 40             	mov    $0x401c,%di
    3526:	1e                   	push   %ds
    3527:	57                   	push   %di
    3528:	9a d1 01 f5 1b       	lcall  $0x1bf5,$0x1d1
    352d:	eb 05                	jmp    0x3534
    352f:	9a 60 01 f5 1b       	lcall  $0x1bf5,$0x160
    3534:	e9 aa 02             	jmp    0x37e1
    3537:	3d 00 3c             	cmp    $0x3c00,%ax
    353a:	75 4f                	jne    0x358b
    353c:	a0 0c 37             	mov    0x370c,%al
    353f:	30 e4                	xor    %ah,%ah
    3541:	8b d0                	mov    %ax,%dx
    3543:	b8 01 00             	mov    $0x1,%ax
    3546:	2b c2                	sub    %dx,%ax
    3548:	a2 0c 37             	mov    %al,0x370c
    354b:	b0 02                	mov    $0x2,%al
    354d:	50                   	push   %ax
    354e:	0e                   	push   %cs
    354f:	e8 fb f6             	call   0x2c4d
    3552:	80 3e 0c 37 00       	cmpb   $0x0,0x370c
    3557:	75 05                	jne    0x355e
    3559:	9a 8a 02 f5 1b       	lcall  $0x1bf5,$0x28a
    355e:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    3563:	75 1d                	jne    0x3582
    3565:	80 3e f7 2f 00       	cmpb   $0x0,0x2ff7
    356a:	74 07                	je     0x3573
    356c:	9a 71 02 f5 1b       	lcall  $0x1bf5,$0x271
    3571:	eb 0f                	jmp    0x3582
    3573:	9a a3 02 f5 1b       	lcall  $0x1bf5,$0x2a3
    3578:	9a 58 02 f5 1b       	lcall  $0x1bf5,$0x258
    357d:	c6 06 f7 2f 01       	movb   $0x1,0x2ff7
    3582:	c7 06 8c 45 20 39    	movw   $0x3920,0x458c
    3588:	e9 56 02             	jmp    0x37e1
    358b:	3d 00 3d             	cmp    $0x3d00,%ax
    358e:	75 0d                	jne    0x359d
    3590:	0e                   	push   %cs
    3591:	e8 5a f9             	call   0x2eee
    3594:	c7 06 8c 45 20 39    	movw   $0x3920,0x458c
    359a:	e9 44 02             	jmp    0x37e1
    359d:	3d 00 3e             	cmp    $0x3e00,%ax
    35a0:	74 03                	je     0x35a5
    35a2:	e9 0c 02             	jmp    0x37b1
    35a5:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    35aa:	b0 04                	mov    $0x4,%al
    35ac:	50                   	push   %ax
    35ad:	0e                   	push   %cs
    35ae:	e8 9c f6             	call   0x2c4d
    35b1:	31 c0                	xor    %ax,%ax
    35b3:	a3 26 3d             	mov    %ax,0x3d26
    35b6:	80 7e f8 00          	cmpb   $0x0,-0x8(%bp)
    35ba:	75 0d                	jne    0x35c9
    35bc:	b0 01                	mov    $0x1,%al
    35be:	50                   	push   %ax
    35bf:	bf 8e 36             	mov    $0x368e,%di
    35c2:	1e                   	push   %ds
    35c3:	57                   	push   %di
    35c4:	9a c8 19 02 06       	lcall  $0x602,$0x19c8
    35c9:	81 3e 26 3d 1b 01    	cmpw   $0x11b,0x3d26
    35cf:	75 03                	jne    0x35d4
    35d1:	e9 08 01             	jmp    0x36dc
    35d4:	b8 90 01             	mov    $0x190,%ax
    35d7:	50                   	push   %ax
    35d8:	b8 d9 00             	mov    $0xd9,%ax
    35db:	50                   	push   %ax
    35dc:	b8 58 00             	mov    $0x58,%ax
    35df:	50                   	push   %ax
    35e0:	b8 07 00             	mov    $0x7,%ax
    35e3:	50                   	push   %ax
    35e4:	b8 01 00             	mov    $0x1,%ax
    35e7:	50                   	push   %ax
    35e8:	b8 c0 00             	mov    $0xc0,%ax
    35eb:	50                   	push   %ax
    35ec:	b8 e4 00             	mov    $0xe4,%ax
    35ef:	50                   	push   %ax
    35f0:	31 c0                	xor    %ax,%ax
    35f2:	50                   	push   %ax
    35f3:	9a eb 08 bf 0a       	lcall  $0xabf,$0x8eb
    35f8:	c6 06 8c 36 00       	movb   $0x0,0x368c
    35fd:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    3602:	eb 03                	jmp    0x3607
    3604:	ff 46 fc             	incw   -0x4(%bp)
    3607:	8b 46 fc             	mov    -0x4(%bp),%ax
    360a:	ba 14 00             	mov    $0x14,%dx
    360d:	f7 e2                	mul    %dx
    360f:	8b c8                	mov    %ax,%cx
    3611:	a0 ba 38             	mov    0x38ba,%al
    3614:	30 e4                	xor    %ah,%ah
    3616:	ba c8 00             	mov    $0xc8,%dx
    3619:	f7 e2                	mul    %dx
    361b:	8b f8                	mov    %ax,%di
    361d:	03 f9                	add    %cx,%di
    361f:	81 c7 d2 2f          	add    $0x2fd2,%di
    3623:	1e                   	push   %ds
    3624:	57                   	push   %di
    3625:	bf 8e 36             	mov    $0x368e,%di
    3628:	1e                   	push   %ds
    3629:	57                   	push   %di
    362a:	9a 24 07 ce 1d       	lcall  $0x1dce,$0x724
    362f:	75 37                	jne    0x3668
    3631:	c6 06 8c 36 01       	movb   $0x1,0x368c
    3636:	8b 46 fc             	mov    -0x4(%bp),%ax
    3639:	ba 14 00             	mov    $0x14,%dx
    363c:	f7 e2                	mul    %dx
    363e:	8b c8                	mov    %ax,%cx
    3640:	a0 ba 38             	mov    0x38ba,%al
    3643:	30 e4                	xor    %ah,%ah
    3645:	ba c8 00             	mov    $0xc8,%dx
    3648:	f7 e2                	mul    %dx
    364a:	8b f8                	mov    %ax,%di
    364c:	03 f9                	add    %cx,%di
    364e:	81 c7 dd 2f          	add    $0x2fdd,%di
    3652:	1e                   	push   %ds
    3653:	57                   	push   %di
    3654:	bf ac 36             	mov    $0x36ac,%di
    3657:	1e                   	push   %ds
    3658:	57                   	push   %di
    3659:	b8 08 00             	mov    $0x8,%ax
    365c:	50                   	push   %ax
    365d:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    3662:	8a 46 fc             	mov    -0x4(%bp),%al
    3665:	88 46 f9             	mov    %al,-0x7(%bp)
    3668:	83 7e fc 0a          	cmpw   $0xa,-0x4(%bp)
    366c:	75 96                	jne    0x3604
    366e:	80 3e 8c 36 00       	cmpb   $0x0,0x368c
    3673:	74 31                	je     0x36a6
    3675:	b0 00                	mov    $0x0,%al
    3677:	50                   	push   %ax
    3678:	bf 98 36             	mov    $0x3698,%di
    367b:	1e                   	push   %ds
    367c:	57                   	push   %di
    367d:	9a c8 19 02 06       	lcall  $0x602,$0x19c8
    3682:	81 3e 26 3d 1b 01    	cmpw   $0x11b,0x3d26
    3688:	74 1a                	je     0x36a4
    368a:	bf 98 36             	mov    $0x3698,%di
    368d:	1e                   	push   %ds
    368e:	57                   	push   %di
    368f:	bf ac 36             	mov    $0x36ac,%di
    3692:	1e                   	push   %ds
    3693:	57                   	push   %di
    3694:	9a 24 07 ce 1d       	lcall  $0x1dce,$0x724
    3699:	74 09                	je     0x36a4
    369b:	c7 06 8c 45 00 3f    	movw   $0x3f00,0x458c
    36a1:	e9 57 01             	jmp    0x37fb
    36a4:	eb 12                	jmp    0x36b8
    36a6:	c6 06 98 36 00       	movb   $0x0,0x3698
    36ab:	b0 00                	mov    $0x0,%al
    36ad:	50                   	push   %ax
    36ae:	bf 98 36             	mov    $0x3698,%di
    36b1:	1e                   	push   %ds
    36b2:	57                   	push   %di
    36b3:	9a c8 19 02 06       	lcall  $0x602,$0x19c8
    36b8:	b8 90 01             	mov    $0x190,%ax
    36bb:	50                   	push   %ax
    36bc:	b8 d1 00             	mov    $0xd1,%ax
    36bf:	50                   	push   %ax
    36c0:	b8 58 00             	mov    $0x58,%ax
    36c3:	50                   	push   %ax
    36c4:	b8 07 00             	mov    $0x7,%ax
    36c7:	50                   	push   %ax
    36c8:	b8 01 00             	mov    $0x1,%ax
    36cb:	50                   	push   %ax
    36cc:	b8 c0 00             	mov    $0xc0,%ax
    36cf:	50                   	push   %ax
    36d0:	b8 e4 00             	mov    $0xe4,%ax
    36d3:	50                   	push   %ax
    36d4:	31 c0                	xor    %ax,%ax
    36d6:	50                   	push   %ax
    36d7:	9a eb 08 bf 0a       	lcall  $0xabf,$0x8eb
    36dc:	81 3e 26 3d 1b 01    	cmpw   $0x11b,0x3d26
    36e2:	74 6f                	je     0x3753
    36e4:	c6 06 0d 37 01       	movb   $0x1,0x370d
    36e9:	80 3e 8c 36 00       	cmpb   $0x0,0x368c
    36ee:	74 26                	je     0x3716
    36f0:	8a 46 f9             	mov    -0x7(%bp),%al
    36f3:	30 e4                	xor    %ah,%ah
    36f5:	ba 14 00             	mov    $0x14,%dx
    36f8:	f7 e2                	mul    %dx
    36fa:	8b c8                	mov    %ax,%cx
    36fc:	a0 ba 38             	mov    0x38ba,%al
    36ff:	30 e4                	xor    %ah,%ah
    3701:	ba c8 00             	mov    $0xc8,%dx
    3704:	f7 e2                	mul    %dx
    3706:	8b f8                	mov    %ax,%di
    3708:	03 f9                	add    %cx,%di
    370a:	8b 85 db 2f          	mov    0x2fdb(%di),%ax
    370e:	2d c8 00             	sub    $0xc8,%ax
    3711:	a3 b6 36             	mov    %ax,0x36b6
    3714:	eb 05                	jmp    0x371b
    3716:	31 c0                	xor    %ax,%ax
    3718:	a3 b6 36             	mov    %ax,0x36b6
    371b:	ff 36 9c 37          	push   0x379c
    371f:	ff 36 a0 37          	push   0x37a0
    3723:	b8 46 00             	mov    $0x46,%ax
    3726:	50                   	push   %ax
    3727:	b8 2a 00             	mov    $0x2a,%ax
    372a:	50                   	push   %ax
    372b:	b8 01 00             	mov    $0x1,%ax
    372e:	50                   	push   %ax
    372f:	ff 36 24 37          	push   0x3724
    3733:	ff 36 2e 37          	push   0x372e
    3737:	31 c0                	xor    %ax,%ax
    3739:	50                   	push   %ax
    373a:	9a eb 08 bf 0a       	lcall  $0xabf,$0x8eb
    373f:	a1 10 37             	mov    0x3710,%ax
    3742:	05 0f 00             	add    $0xf,%ax
    3745:	a3 80 45             	mov    %ax,0x4580
    3748:	a1 1a 37             	mov    0x371a,%ax
    374b:	05 0c 00             	add    $0xc,%ax
    374e:	a3 82 45             	mov    %ax,0x4582
    3751:	eb 12                	jmp    0x3765
    3753:	a1 16 37             	mov    0x3716,%ax
    3756:	05 0f 00             	add    $0xf,%ax
    3759:	a3 80 45             	mov    %ax,0x4580
    375c:	a1 20 37             	mov    0x3720,%ax
    375f:	05 0c 00             	add    $0xc,%ax
    3762:	a3 82 45             	mov    %ax,0x4582
    3765:	ff 36 bc 37          	push   0x37bc
    3769:	ff 36 c0 37          	push   0x37c0
    376d:	b8 40 00             	mov    $0x40,%ax
    3770:	50                   	push   %ax
    3771:	b8 22 00             	mov    $0x22,%ax
    3774:	50                   	push   %ax
    3775:	b8 01 00             	mov    $0x1,%ax
    3778:	50                   	push   %ax
    3779:	ff 36 2a 37          	push   0x372a
    377d:	ff 36 34 37          	push   0x3734
    3781:	31 c0                	xor    %ax,%ax
    3783:	50                   	push   %ax
    3784:	b0 02                	mov    $0x2,%al
    3786:	50                   	push   %ax
    3787:	b0 00                	mov    $0x0,%al
    3789:	50                   	push   %ax
    378a:	b0 00                	mov    $0x0,%al
    378c:	50                   	push   %ax
    378d:	31 c0                	xor    %ax,%ax
    378f:	50                   	push   %ax
    3790:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    3795:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    379a:	74 0d                	je     0x37a9
    379c:	ff 36 80 45          	push   0x4580
    37a0:	ff 36 82 45          	push   0x4582
    37a4:	9a 43 08 a3 0c       	lcall  $0xca3,$0x843
    37a9:	c7 06 8c 45 20 39    	movw   $0x3920,0x458c
    37af:	eb 30                	jmp    0x37e1
    37b1:	3d 00 3f             	cmp    $0x3f00,%ax
    37b4:	75 2b                	jne    0x37e1
    37b6:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    37bb:	75 05                	jne    0x37c2
    37bd:	9a 8a 02 f5 1b       	lcall  $0x1bf5,$0x28a
    37c2:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    37c7:	75 07                	jne    0x37d0
    37c9:	9a 34 02 f5 1b       	lcall  $0x1bf5,$0x234
    37ce:	eb 05                	jmp    0x37d5
    37d0:	9a 60 01 f5 1b       	lcall  $0x1bf5,$0x160
    37d5:	b0 05                	mov    $0x5,%al
    37d7:	50                   	push   %ax
    37d8:	0e                   	push   %cs
    37d9:	e8 71 f4             	call   0x2c4d
    37dc:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    37e1:	81 3e 8c 45 00 3b    	cmpw   $0x3b00,0x458c
    37e7:	75 07                	jne    0x37f0
    37e9:	80 3e 0d 37 01       	cmpb   $0x1,0x370d
    37ee:	74 0b                	je     0x37fb
    37f0:	81 3e 8c 45 00 3f    	cmpw   $0x3f00,0x458c
    37f6:	74 03                	je     0x37fb
    37f8:	e9 6f fb             	jmp    0x336a
    37fb:	89 ec                	mov    %bp,%sp
    37fd:	5d                   	pop    %bp
    37fe:	cb                   	lret
    37ff:	08 4e 69             	or     %cl,0x69(%bp)
    3802:	6e                   	outsb  %ds:(%si),(%dx)
    3803:	65 2e 6c             	gs cs insb (%dx),%es:(%di)
    3806:	69 62 0b 47 52       	imul   $0x5247,0xb(%bp,%si),%sp
    380b:	5f                   	pop    %di
    380c:	4e                   	dec    %si
    380d:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    3812:	63 78 0b             	arpl   %di,0xb(%bx,%si)
    3815:	47                   	inc    %di
    3816:	46                   	inc    %si
    3817:	5f                   	pop    %di
    3818:	4e                   	dec    %si
    3819:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    381e:	63 78 08             	arpl   %di,0x8(%bx,%si)
    3821:	4e                   	dec    %si
    3822:	69 6e 65 2e 63       	imul   $0x632e,0x65(%bp),%bp
    3827:	66 67 06             	addr32 pushl %es
    382a:	4e                   	dec    %si
    382b:	6f                   	outsw  %ds:(%si),(%dx)
    382c:	6e                   	outsb  %ds:(%si),(%dx)
    382d:	61                   	popa
    382e:	6d                   	insw   (%dx),%es:(%di)
    382f:	65 06                	gs push %es
    3831:	40                   	inc    %ax
    3832:	40                   	inc    %ax
    3833:	40                   	inc    %ax
    3834:	40                   	inc    %ax
    3835:	40                   	inc    %ax
    3836:	40                   	inc    %ax
    3837:	0b 54 52             	or     0x52(%si),%dx
    383a:	5f                   	pop    %di
    383b:	4e                   	dec    %si
    383c:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    3841:	63 78 55             	arpl   %di,0x55(%bx,%si)
    3844:	89 e5                	mov    %sp,%bp
    3846:	83 ec 1e             	sub    $0x1e,%sp
    3849:	0e                   	push   %cs
    384a:	e8 74 fa             	call   0x32c1
    384d:	81 3e 8c 45 00 3b    	cmpw   $0x3b00,0x458c
    3853:	74 03                	je     0x3858
    3855:	e9 b2 01             	jmp    0x3a0a
    3858:	bf 3c 3c             	mov    $0x3c3c,%di
    385b:	1e                   	push   %ds
    385c:	57                   	push   %di
    385d:	b8 3c 00             	mov    $0x3c,%ax
    3860:	50                   	push   %ax
    3861:	9a f4 0c a3 0c       	lcall  $0xca3,$0xcf4
    3866:	bf ff 37             	mov    $0x37ff,%di
    3869:	0e                   	push   %cs
    386a:	57                   	push   %di
    386b:	bf 08 38             	mov    $0x3808,%di
    386e:	0e                   	push   %cs
    386f:	57                   	push   %di
    3870:	31 c0                	xor    %ax,%ax
    3872:	50                   	push   %ax
    3873:	31 c0                	xor    %ax,%ax
    3875:	50                   	push   %ax
    3876:	b8 01 00             	mov    $0x1,%ax
    3879:	50                   	push   %ax
    387a:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    387f:	80 3e 30 2c 00       	cmpb   $0x0,0x2c30
    3884:	75 74                	jne    0x38fa
    3886:	ff 36 2e 40          	push   0x402e
    388a:	ff 36 2c 40          	push   0x402c
    388e:	b8 2f 00             	mov    $0x2f,%ax
    3891:	50                   	push   %ax
    3892:	b8 ad 00             	mov    $0xad,%ax
    3895:	50                   	push   %ax
    3896:	b8 35 00             	mov    $0x35,%ax
    3899:	50                   	push   %ax
    389a:	b8 b9 00             	mov    $0xb9,%ax
    389d:	50                   	push   %ax
    389e:	b8 01 00             	mov    $0x1,%ax
    38a1:	50                   	push   %ax
    38a2:	9a fb 01 a3 0c       	lcall  $0xca3,$0x1fb
    38a7:	c7 46 fe 02 00       	movw   $0x2,-0x2(%bp)
    38ac:	eb 03                	jmp    0x38b1
    38ae:	ff 46 fe             	incw   -0x2(%bp)
    38b1:	8b 7e fe             	mov    -0x2(%bp),%di
    38b4:	d1 e7                	shl    %di
    38b6:	d1 e7                	shl    %di
    38b8:	ff b5 2a 40          	push   0x402a(%di)
    38bc:	ff b5 28 40          	push   0x4028(%di)
    38c0:	8b 46 fe             	mov    -0x2(%bp),%ax
    38c3:	2d 02 00             	sub    $0x2,%ax
    38c6:	b9 03 00             	mov    $0x3,%cx
    38c9:	d3 e0                	shl    %cl,%ax
    38cb:	05 27 00             	add    $0x27,%ax
    38ce:	50                   	push   %ax
    38cf:	b8 ad 00             	mov    $0xad,%ax
    38d2:	50                   	push   %ax
    38d3:	8b 46 fe             	mov    -0x2(%bp),%ax
    38d6:	2d 02 00             	sub    $0x2,%ax
    38d9:	b9 03 00             	mov    $0x3,%cx
    38dc:	d3 e0                	shl    %cl,%ax
    38de:	05 2d 00             	add    $0x2d,%ax
    38e1:	50                   	push   %ax
    38e2:	b8 b9 00             	mov    $0xb9,%ax
    38e5:	50                   	push   %ax
    38e6:	b8 01 00             	mov    $0x1,%ax
    38e9:	50                   	push   %ax
    38ea:	9a fb 01 a3 0c       	lcall  $0xca3,$0x1fb
    38ef:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    38f3:	75 b9                	jne    0x38ae
    38f5:	c6 06 30 2c 01       	movb   $0x1,0x2c30
    38fa:	31 c0                	xor    %ax,%ax
    38fc:	50                   	push   %ax
    38fd:	31 c0                	xor    %ax,%ax
    38ff:	50                   	push   %ax
    3900:	b8 7f 02             	mov    $0x27f,%ax
    3903:	50                   	push   %ax
    3904:	b8 5d 01             	mov    $0x15d,%ax
    3907:	50                   	push   %ax
    3908:	b0 01                	mov    $0x1,%al
    390a:	50                   	push   %ax
    390b:	9a 2c 0a f5 17       	lcall  $0x17f5,$0xa2c
    3910:	9a c3 0a f5 17       	lcall  $0x17f5,$0xac3
    3915:	ff 36 18 39          	push   0x3918
    3919:	ff 36 16 39          	push   0x3916
    391d:	31 c0                	xor    %ax,%ax
    391f:	50                   	push   %ax
    3920:	b8 17 01             	mov    $0x117,%ax
    3923:	50                   	push   %ax
    3924:	b8 9a 00             	mov    $0x9a,%ax
    3927:	50                   	push   %ax
    3928:	31 c0                	xor    %ax,%ax
    392a:	50                   	push   %ax
    392b:	b0 02                	mov    $0x2,%al
    392d:	50                   	push   %ax
    392e:	b0 00                	mov    $0x0,%al
    3930:	50                   	push   %ax
    3931:	b0 00                	mov    $0x0,%al
    3933:	50                   	push   %ax
    3934:	b8 0a 00             	mov    $0xa,%ax
    3937:	50                   	push   %ax
    3938:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    393d:	bf 3c 3c             	mov    $0x3c3c,%di
    3940:	1e                   	push   %ds
    3941:	57                   	push   %di
    3942:	b8 3c 00             	mov    $0x3c,%ax
    3945:	50                   	push   %ax
    3946:	9a 5b 0a a3 0c       	lcall  $0xca3,$0xa5b
    394b:	b8 c8 00             	mov    $0xc8,%ax
    394e:	50                   	push   %ax
    394f:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    3954:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3959:	eb 03                	jmp    0x395e
    395b:	ff 46 fe             	incw   -0x2(%bp)
    395e:	8b 7e fe             	mov    -0x2(%bp),%di
    3961:	d1 e7                	shl    %di
    3963:	d1 e7                	shl    %di
    3965:	ff b5 18 39          	push   0x3918(%di)
    3969:	ff b5 16 39          	push   0x3916(%di)
    396d:	31 c0                	xor    %ax,%ax
    396f:	50                   	push   %ax
    3970:	b8 1b 01             	mov    $0x11b,%ax
    3973:	50                   	push   %ax
    3974:	b8 ab 00             	mov    $0xab,%ax
    3977:	50                   	push   %ax
    3978:	31 c0                	xor    %ax,%ax
    397a:	50                   	push   %ax
    397b:	b0 02                	mov    $0x2,%al
    397d:	50                   	push   %ax
    397e:	b0 00                	mov    $0x0,%al
    3980:	50                   	push   %ax
    3981:	b0 00                	mov    $0x0,%al
    3983:	50                   	push   %ax
    3984:	b8 8c 00             	mov    $0x8c,%ax
    3987:	50                   	push   %ax
    3988:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    398d:	83 7e fe 0b          	cmpw   $0xb,-0x2(%bp)
    3991:	75 c8                	jne    0x395b
    3993:	b8 20 03             	mov    $0x320,%ax
    3996:	50                   	push   %ax
    3997:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    399c:	c7 46 fe 0c 00       	movw   $0xc,-0x2(%bp)
    39a1:	eb 03                	jmp    0x39a6
    39a3:	ff 46 fe             	incw   -0x2(%bp)
    39a6:	8b 7e fe             	mov    -0x2(%bp),%di
    39a9:	d1 e7                	shl    %di
    39ab:	d1 e7                	shl    %di
    39ad:	ff b5 18 39          	push   0x3918(%di)
    39b1:	ff b5 16 39          	push   0x3916(%di)
    39b5:	31 c0                	xor    %ax,%ax
    39b7:	50                   	push   %ax
    39b8:	b8 1b 01             	mov    $0x11b,%ax
    39bb:	50                   	push   %ax
    39bc:	b8 ab 00             	mov    $0xab,%ax
    39bf:	50                   	push   %ax
    39c0:	31 c0                	xor    %ax,%ax
    39c2:	50                   	push   %ax
    39c3:	b0 02                	mov    $0x2,%al
    39c5:	50                   	push   %ax
    39c6:	b0 00                	mov    $0x0,%al
    39c8:	50                   	push   %ax
    39c9:	b0 00                	mov    $0x0,%al
    39cb:	50                   	push   %ax
    39cc:	b8 8c 00             	mov    $0x8c,%ax
    39cf:	50                   	push   %ax
    39d0:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    39d5:	83 7e fe 16          	cmpw   $0x16,-0x2(%bp)
    39d9:	75 c8                	jne    0x39a3
    39db:	b8 c8 00             	mov    $0xc8,%ax
    39de:	50                   	push   %ax
    39df:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    39e4:	bf 3c 3c             	mov    $0x3c3c,%di
    39e7:	1e                   	push   %ds
    39e8:	57                   	push   %di
    39e9:	b8 3c 00             	mov    $0x3c,%ax
    39ec:	50                   	push   %ax
    39ed:	9a f4 0c a3 0c       	lcall  $0xca3,$0xcf4
    39f2:	bf ff 37             	mov    $0x37ff,%di
    39f5:	0e                   	push   %cs
    39f6:	57                   	push   %di
    39f7:	bf 14 38             	mov    $0x3814,%di
    39fa:	0e                   	push   %cs
    39fb:	57                   	push   %di
    39fc:	31 c0                	xor    %ax,%ax
    39fe:	50                   	push   %ax
    39ff:	31 c0                	xor    %ax,%ax
    3a01:	50                   	push   %ax
    3a02:	31 c0                	xor    %ax,%ax
    3a04:	50                   	push   %ax
    3a05:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    3a0a:	81 3e 8c 45 00 3f    	cmpw   $0x3f00,0x458c
    3a10:	75 55                	jne    0x3a67
    3a12:	bf e0 35             	mov    $0x35e0,%di
    3a15:	1e                   	push   %ds
    3a16:	57                   	push   %di
    3a17:	bf 20 38             	mov    $0x3820,%di
    3a1a:	0e                   	push   %cs
    3a1b:	57                   	push   %di
    3a1c:	9a 5e 13 ce 1d       	lcall  $0x1dce,$0x135e
    3a21:	bf e0 35             	mov    $0x35e0,%di
    3a24:	1e                   	push   %ds
    3a25:	57                   	push   %di
    3a26:	b8 02 00             	mov    $0x2,%ax
    3a29:	50                   	push   %ax
    3a2a:	9a 95 13 ce 1d       	lcall  $0x1dce,$0x1395
    3a2f:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    3a34:	75 07                	jne    0x3a3d
    3a36:	c6 06 de 35 01       	movb   $0x1,0x35de
    3a3b:	eb 05                	jmp    0x3a42
    3a3d:	c6 06 de 35 00       	movb   $0x0,0x35de
    3a42:	a0 ba 38             	mov    0x38ba,%al
    3a45:	a2 df 35             	mov    %al,0x35df
    3a48:	bf e0 35             	mov    $0x35e0,%di
    3a4b:	1e                   	push   %ds
    3a4c:	57                   	push   %di
    3a4d:	bf de 35             	mov    $0x35de,%di
    3a50:	1e                   	push   %ds
    3a51:	57                   	push   %di
    3a52:	9a 48 14 ce 1d       	lcall  $0x1dce,$0x1448
    3a57:	83 c4 04             	add    $0x4,%sp
    3a5a:	bf e0 35             	mov    $0x35e0,%di
    3a5d:	1e                   	push   %ds
    3a5e:	57                   	push   %di
    3a5f:	9a 0d 14 ce 1d       	lcall  $0x1dce,$0x140d
    3a64:	e9 46 09             	jmp    0x43ad
    3a67:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3a6c:	eb 03                	jmp    0x3a71
    3a6e:	ff 46 fe             	incw   -0x2(%bp)
    3a71:	8b 7e fe             	mov    -0x2(%bp),%di
    3a74:	d1 e7                	shl    %di
    3a76:	c7 85 a6 38 c8 00    	movw   $0xc8,0x38a6(%di)
    3a7c:	8b 7e fe             	mov    -0x2(%bp),%di
    3a7f:	d1 e7                	shl    %di
    3a81:	ff b5 a6 38          	push   0x38a6(%di)
    3a85:	b8 04 00             	mov    $0x4,%ax
    3a88:	50                   	push   %ax
    3a89:	8b 7e fe             	mov    -0x2(%bp),%di
    3a8c:	d1 e7                	shl    %di
    3a8e:	ff b5 ac 38          	push   0x38ac(%di)
    3a92:	8b 7e fe             	mov    -0x2(%bp),%di
    3a95:	d1 e7                	shl    %di
    3a97:	ff b5 b2 38          	push   0x38b2(%di)
    3a9b:	9a cd 11 02 06       	lcall  $0x602,$0x11cd
    3aa0:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3aa4:	75 c8                	jne    0x3a6e
    3aa6:	c6 06 07 3a 00       	movb   $0x0,0x3a07
    3aab:	83 3e be 5e 00       	cmpw   $0x0,0x5ebe
    3ab0:	75 05                	jne    0x3ab7
    3ab2:	c6 06 0c 37 01       	movb   $0x1,0x370c
    3ab7:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    3abc:	75 1d                	jne    0x3adb
    3abe:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    3ac3:	75 11                	jne    0x3ad6
    3ac5:	c6 06 f8 2f 01       	movb   $0x1,0x2ff8
    3aca:	9a a3 02 f5 1b       	lcall  $0x1bf5,$0x2a3
    3acf:	9a 58 02 f5 1b       	lcall  $0x1bf5,$0x258
    3ad4:	eb 05                	jmp    0x3adb
    3ad6:	c6 06 f8 2f 00       	movb   $0x0,0x2ff8
    3adb:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3ae0:	eb 03                	jmp    0x3ae5
    3ae2:	ff 46 fe             	incw   -0x2(%bp)
    3ae5:	b8 01 00             	mov    $0x1,%ax
    3ae8:	50                   	push   %ax
    3ae9:	8b 7e fe             	mov    -0x2(%bp),%di
    3aec:	d1 e7                	shl    %di
    3aee:	d1 e7                	shl    %di
    3af0:	8d 85 e2 38          	lea    0x38e2(%di),%ax
    3af4:	8c da                	mov    %ds,%dx
    3af6:	52                   	push   %dx
    3af7:	50                   	push   %ax
    3af8:	b8 05 00             	mov    $0x5,%ax
    3afb:	50                   	push   %ax
    3afc:	ff 36 9e 3a          	push   0x3a9e
    3b00:	ff 36 a4 3a          	push   0x3aa4
    3b04:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    3b09:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    3b0d:	75 d3                	jne    0x3ae2
    3b0f:	bf 3c 3c             	mov    $0x3c3c,%di
    3b12:	1e                   	push   %ds
    3b13:	57                   	push   %di
    3b14:	b8 3c 00             	mov    $0x3c,%ax
    3b17:	50                   	push   %ax
    3b18:	9a 5b 0a a3 0c       	lcall  $0xca3,$0xa5b
    3b1d:	bf 5c 40             	mov    $0x405c,%di
    3b20:	1e                   	push   %ds
    3b21:	57                   	push   %di
    3b22:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    3b27:	9a 45 22 02 06       	lcall  $0x602,$0x2245
    3b2c:	31 c0                	xor    %ax,%ax
    3b2e:	a3 8c 45             	mov    %ax,0x458c
    3b31:	31 c0                	xor    %ax,%ax
    3b33:	a3 bc 38             	mov    %ax,0x38bc
    3b36:	ff 36 bc 38          	push   0x38bc
    3b3a:	9a d3 10 02 06       	lcall  $0x602,$0x10d3
    3b3f:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    3b44:	3d 1b 01             	cmp    $0x11b,%ax
    3b47:	74 07                	je     0x3b50
    3b49:	b0 04                	mov    $0x4,%al
    3b4b:	50                   	push   %ax
    3b4c:	0e                   	push   %cs
    3b4d:	e8 b0 c4             	call   0x0
    3b50:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3b55:	eb 03                	jmp    0x3b5a
    3b57:	ff 46 fe             	incw   -0x2(%bp)
    3b5a:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    3b5f:	3d 1b 01             	cmp    $0x11b,%ax
    3b62:	75 03                	jne    0x3b67
    3b64:	e9 ae 00             	jmp    0x3c15
    3b67:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3b6b:	74 16                	je     0x3b83
    3b6d:	8a 46 fe             	mov    -0x2(%bp),%al
    3b70:	50                   	push   %ax
    3b71:	b0 01                	mov    $0x1,%al
    3b73:	50                   	push   %ax
    3b74:	0e                   	push   %cs
    3b75:	e8 05 c8             	call   0x37d
    3b78:	8a 46 fe             	mov    -0x2(%bp),%al
    3b7b:	50                   	push   %ax
    3b7c:	b0 02                	mov    $0x2,%al
    3b7e:	50                   	push   %ax
    3b7f:	0e                   	push   %cs
    3b80:	e8 fa c7             	call   0x37d
    3b83:	8a 46 fe             	mov    -0x2(%bp),%al
    3b86:	50                   	push   %ax
    3b87:	0e                   	push   %cs
    3b88:	e8 8b cf             	call   0xb16
    3b8b:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    3b90:	75 27                	jne    0x3bb9
    3b92:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    3b97:	eb 03                	jmp    0x3b9c
    3b99:	ff 46 fc             	incw   -0x4(%bp)
    3b9c:	b8 70 17             	mov    $0x1770,%ax
    3b9f:	50                   	push   %ax
    3ba0:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    3ba5:	b8 05 00             	mov    $0x5,%ax
    3ba8:	50                   	push   %ax
    3ba9:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    3bae:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    3bb3:	83 7e fc 03          	cmpw   $0x3,-0x4(%bp)
    3bb7:	75 e0                	jne    0x3b99
    3bb9:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3bbd:	74 0b                	je     0x3bca
    3bbf:	8a 46 fe             	mov    -0x2(%bp),%al
    3bc2:	50                   	push   %ax
    3bc3:	b0 03                	mov    $0x3,%al
    3bc5:	50                   	push   %ax
    3bc6:	0e                   	push   %cs
    3bc7:	e8 b3 c7             	call   0x37d
    3bca:	8b 7e fe             	mov    -0x2(%bp),%di
    3bcd:	d1 e7                	shl    %di
    3bcf:	8b 85 a6 38          	mov    0x38a6(%di),%ax
    3bd3:	2d 14 00             	sub    $0x14,%ax
    3bd6:	8b 7e fe             	mov    -0x2(%bp),%di
    3bd9:	d1 e7                	shl    %di
    3bdb:	89 85 a6 38          	mov    %ax,0x38a6(%di)
    3bdf:	8b 7e fe             	mov    -0x2(%bp),%di
    3be2:	d1 e7                	shl    %di
    3be4:	ff b5 a6 38          	push   0x38a6(%di)
    3be8:	b8 04 00             	mov    $0x4,%ax
    3beb:	50                   	push   %ax
    3bec:	8b 7e fe             	mov    -0x2(%bp),%di
    3bef:	d1 e7                	shl    %di
    3bf1:	ff b5 ac 38          	push   0x38ac(%di)
    3bf5:	8b 7e fe             	mov    -0x2(%bp),%di
    3bf8:	d1 e7                	shl    %di
    3bfa:	ff b5 b2 38          	push   0x38b2(%di)
    3bfe:	9a cd 11 02 06       	lcall  $0x602,$0x11cd
    3c03:	a1 bc 38             	mov    0x38bc,%ax
    3c06:	05 14 00             	add    $0x14,%ax
    3c09:	a3 bc 38             	mov    %ax,0x38bc
    3c0c:	ff 36 bc 38          	push   0x38bc
    3c10:	9a d3 10 02 06       	lcall  $0x602,$0x10d3
    3c15:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3c19:	74 03                	je     0x3c1e
    3c1b:	e9 39 ff             	jmp    0x3b57
    3c1e:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    3c23:	3d 1b 01             	cmp    $0x11b,%ax
    3c26:	74 07                	je     0x3c2f
    3c28:	b0 05                	mov    $0x5,%al
    3c2a:	50                   	push   %ax
    3c2b:	0e                   	push   %cs
    3c2c:	e8 d1 c3             	call   0x0
    3c2f:	9a 0e 24 02 06       	lcall  $0x602,$0x240e
    3c34:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3c39:	eb 03                	jmp    0x3c3e
    3c3b:	ff 46 fe             	incw   -0x2(%bp)
    3c3e:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    3c43:	eb 03                	jmp    0x3c48
    3c45:	ff 46 fc             	incw   -0x4(%bp)
    3c48:	8b 46 fc             	mov    -0x4(%bp),%ax
    3c4b:	8b 7e fe             	mov    -0x2(%bp),%di
    3c4e:	d1 e7                	shl    %di
    3c50:	d1 e7                	shl    %di
    3c52:	03 f8                	add    %ax,%di
    3c54:	c6 85 b9 38 09       	movb   $0x9,0x38b9(%di)
    3c59:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    3c5d:	75 e6                	jne    0x3c45
    3c5f:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    3c63:	75 d6                	jne    0x3c3b
    3c65:	c6 06 08 3a 00       	movb   $0x0,0x3a08
    3c6a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3c6f:	eb 03                	jmp    0x3c74
    3c71:	ff 46 fe             	incw   -0x2(%bp)
    3c74:	8b 7e fe             	mov    -0x2(%bp),%di
    3c77:	c6 85 a9 30 0c       	movb   $0xc,0x30a9(%di)
    3c7c:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3c80:	75 ef                	jne    0x3c71
    3c82:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3c87:	eb 03                	jmp    0x3c8c
    3c89:	ff 46 fe             	incw   -0x2(%bp)
    3c8c:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    3c91:	eb 03                	jmp    0x3c96
    3c93:	ff 46 fc             	incw   -0x4(%bp)
    3c96:	c7 46 fa 06 00       	movw   $0x6,-0x6(%bp)
    3c9b:	eb 03                	jmp    0x3ca0
    3c9d:	ff 46 fa             	incw   -0x6(%bp)
    3ca0:	8b 46 fa             	mov    -0x6(%bp),%ax
    3ca3:	8b d8                	mov    %ax,%bx
    3ca5:	8b 46 fc             	mov    -0x4(%bp),%ax
    3ca8:	ba 09 00             	mov    $0x9,%dx
    3cab:	f7 e2                	mul    %dx
    3cad:	8b c8                	mov    %ax,%cx
    3caf:	8b 46 fe             	mov    -0x2(%bp),%ax
    3cb2:	ba 24 00             	mov    $0x24,%dx
    3cb5:	f7 e2                	mul    %dx
    3cb7:	8b f8                	mov    %ax,%di
    3cb9:	03 f9                	add    %cx,%di
    3cbb:	03 fb                	add    %bx,%di
    3cbd:	c6 85 e7 2f 00       	movb   $0x0,0x2fe7(%di)
    3cc2:	83 7e fa 0e          	cmpw   $0xe,-0x6(%bp)
    3cc6:	75 d5                	jne    0x3c9d
    3cc8:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    3ccc:	75 c5                	jne    0x3c93
    3cce:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3cd2:	75 b5                	jne    0x3c89
    3cd4:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3cd9:	eb 03                	jmp    0x3cde
    3cdb:	ff 46 fe             	incw   -0x2(%bp)
    3cde:	c7 46 fc 06 00       	movw   $0x6,-0x4(%bp)
    3ce3:	eb 03                	jmp    0x3ce8
    3ce5:	ff 46 fc             	incw   -0x4(%bp)
    3ce8:	8b 46 fc             	mov    -0x4(%bp),%ax
    3ceb:	8b c8                	mov    %ax,%cx
    3ced:	8b 46 fe             	mov    -0x2(%bp),%ax
    3cf0:	ba 09 00             	mov    $0x9,%dx
    3cf3:	f7 e2                	mul    %dx
    3cf5:	8b f8                	mov    %ax,%di
    3cf7:	03 f9                	add    %cx,%di
    3cf9:	c6 85 77 30 00       	movb   $0x0,0x3077(%di)
    3cfe:	83 7e fc 0e          	cmpw   $0xe,-0x4(%bp)
    3d02:	75 e1                	jne    0x3ce5
    3d04:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    3d08:	75 d1                	jne    0x3cdb
    3d0a:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    3d0f:	75 07                	jne    0x3d18
    3d11:	c6 06 03 3a 01       	movb   $0x1,0x3a03
    3d16:	eb 05                	jmp    0x3d1d
    3d18:	c6 06 03 3a 00       	movb   $0x0,0x3a03
    3d1d:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    3d22:	3d 1b 01             	cmp    $0x11b,%ax
    3d25:	74 6d                	je     0x3d94
    3d27:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    3d2c:	75 06                	jne    0x3d34
    3d2e:	0e                   	push   %cs
    3d2f:	e8 c5 e6             	call   0x23f7
    3d32:	eb 09                	jmp    0x3d3d
    3d34:	9a c8 0c 02 06       	lcall  $0x602,$0xcc8
    3d39:	0e                   	push   %cs
    3d3a:	e8 e3 de             	call   0x1c20
    3d3d:	c6 06 03 3a 00       	movb   $0x0,0x3a03
    3d42:	c6 46 f9 01          	movb   $0x1,-0x7(%bp)
    3d46:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3d4b:	eb 03                	jmp    0x3d50
    3d4d:	ff 46 fe             	incw   -0x2(%bp)
    3d50:	8b 46 fe             	mov    -0x2(%bp),%ax
    3d53:	d1 e0                	shl    %ax
    3d55:	8b f0                	mov    %ax,%si
    3d57:	d1 e0                	shl    %ax
    3d59:	03 c6                	add    %si,%ax
    3d5b:	8b c8                	mov    %ax,%cx
    3d5d:	a0 02 3a             	mov    0x3a02,%al
    3d60:	30 e4                	xor    %ah,%ah
    3d62:	ba 48 00             	mov    $0x48,%dx
    3d65:	f7 e2                	mul    %dx
    3d67:	8b f8                	mov    %ax,%di
    3d69:	03 f9                	add    %cx,%di
    3d6b:	80 bd 82 37 00       	cmpb   $0x0,0x3782(%di)
    3d70:	74 04                	je     0x3d76
    3d72:	c6 46 f9 00          	movb   $0x0,-0x7(%bp)
    3d76:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    3d7a:	75 d1                	jne    0x3d4d
    3d7c:	80 7e f9 00          	cmpb   $0x0,-0x7(%bp)
    3d80:	75 12                	jne    0x3d94
    3d82:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    3d87:	73 06                	jae    0x3d8f
    3d89:	fe 06 02 3a          	incb   0x3a02
    3d8d:	eb 05                	jmp    0x3d94
    3d8f:	c6 06 02 3a 01       	movb   $0x1,0x3a02
    3d94:	80 7e f9 00          	cmpb   $0x0,-0x7(%bp)
    3d98:	75 0b                	jne    0x3da5
    3d9a:	81 3e 8c 45 1b 01    	cmpw   $0x11b,0x458c
    3da0:	74 03                	je     0x3da5
    3da2:	e9 78 ff             	jmp    0x3d1d
    3da5:	81 3e 8c 45 1b 01    	cmpw   $0x11b,0x458c
    3dab:	75 0d                	jne    0x3dba
    3dad:	31 c0                	xor    %ax,%ax
    3daf:	a3 ac 38             	mov    %ax,0x38ac
    3db2:	c6 06 07 3a 01       	movb   $0x1,0x3a07
    3db7:	e9 1e 01             	jmp    0x3ed8
    3dba:	a1 bc 38             	mov    0x38bc,%ax
    3dbd:	31 d2                	xor    %dx,%dx
    3dbf:	8b c8                	mov    %ax,%cx
    3dc1:	8b da                	mov    %dx,%bx
    3dc3:	a0 02 3a             	mov    0x3a02,%al
    3dc6:	30 e4                	xor    %ah,%ah
    3dc8:	8b f8                	mov    %ax,%di
    3dca:	d1 e7                	shl    %di
    3dcc:	8b 85 a6 38          	mov    0x38a6(%di),%ax
    3dd0:	99                   	cwtd
    3dd1:	03 c1                	add    %cx,%ax
    3dd3:	13 d3                	adc    %bx,%dx
    3dd5:	8b d0                	mov    %ax,%dx
    3dd7:	a0 02 3a             	mov    0x3a02,%al
    3dda:	30 e4                	xor    %ah,%ah
    3ddc:	8b f8                	mov    %ax,%di
    3dde:	d1 e7                	shl    %di
    3de0:	89 95 a6 38          	mov    %dx,0x38a6(%di)
    3de4:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    3de9:	74 0b                	je     0x3df6
    3deb:	a0 02 3a             	mov    0x3a02,%al
    3dee:	50                   	push   %ax
    3def:	b0 01                	mov    $0x1,%al
    3df1:	50                   	push   %ax
    3df2:	0e                   	push   %cs
    3df3:	e8 87 c5             	call   0x37d
    3df6:	b0 04                	mov    $0x4,%al
    3df8:	50                   	push   %ax
    3df9:	0e                   	push   %cs
    3dfa:	e8 03 c2             	call   0x0
    3dfd:	a0 02 3a             	mov    0x3a02,%al
    3e00:	30 e4                	xor    %ah,%ah
    3e02:	3d 01 00             	cmp    $0x1,%ax
    3e05:	75 09                	jne    0x3e10
    3e07:	b0 03                	mov    $0x3,%al
    3e09:	50                   	push   %ax
    3e0a:	0e                   	push   %cs
    3e0b:	e8 f2 c1             	call   0x0
    3e0e:	eb 1a                	jmp    0x3e2a
    3e10:	3d 02 00             	cmp    $0x2,%ax
    3e13:	75 09                	jne    0x3e1e
    3e15:	b0 02                	mov    $0x2,%al
    3e17:	50                   	push   %ax
    3e18:	0e                   	push   %cs
    3e19:	e8 e4 c1             	call   0x0
    3e1c:	eb 0c                	jmp    0x3e2a
    3e1e:	3d 03 00             	cmp    $0x3,%ax
    3e21:	75 07                	jne    0x3e2a
    3e23:	b0 01                	mov    $0x1,%al
    3e25:	50                   	push   %ax
    3e26:	0e                   	push   %cs
    3e27:	e8 d6 c1             	call   0x0
    3e2a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3e2f:	eb 03                	jmp    0x3e34
    3e31:	ff 46 fe             	incw   -0x2(%bp)
    3e34:	8b 7e fe             	mov    -0x2(%bp),%di
    3e37:	d1 e7                	shl    %di
    3e39:	83 bd a6 38 00       	cmpw   $0x0,0x38a6(%di)
    3e3e:	7f 05                	jg     0x3e45
    3e40:	c6 06 07 3a 01       	movb   $0x1,0x3a07
    3e45:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3e49:	75 e6                	jne    0x3e31
    3e4b:	a0 02 3a             	mov    0x3a02,%al
    3e4e:	50                   	push   %ax
    3e4f:	0e                   	push   %cs
    3e50:	e8 95 ce             	call   0xce8
    3e53:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    3e58:	75 27                	jne    0x3e81
    3e5a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3e5f:	eb 03                	jmp    0x3e64
    3e61:	ff 46 fe             	incw   -0x2(%bp)
    3e64:	b8 70 17             	mov    $0x1770,%ax
    3e67:	50                   	push   %ax
    3e68:	9a 58 0d 13 1b       	lcall  $0x1b13,$0xd58
    3e6d:	b8 05 00             	mov    $0x5,%ax
    3e70:	50                   	push   %ax
    3e71:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    3e76:	9a 85 0d 13 1b       	lcall  $0x1b13,$0xd85
    3e7b:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    3e7f:	75 e0                	jne    0x3e61
    3e81:	b0 05                	mov    $0x5,%al
    3e83:	50                   	push   %ax
    3e84:	0e                   	push   %cs
    3e85:	e8 78 c1             	call   0x0
    3e88:	80 3e 02 3a 03       	cmpb   $0x3,0x3a02
    3e8d:	74 0b                	je     0x3e9a
    3e8f:	a0 02 3a             	mov    0x3a02,%al
    3e92:	50                   	push   %ax
    3e93:	b0 04                	mov    $0x4,%al
    3e95:	50                   	push   %ax
    3e96:	0e                   	push   %cs
    3e97:	e8 e3 c4             	call   0x37d
    3e9a:	a0 02 3a             	mov    0x3a02,%al
    3e9d:	30 e4                	xor    %ah,%ah
    3e9f:	8b f8                	mov    %ax,%di
    3ea1:	d1 e7                	shl    %di
    3ea3:	ff b5 a6 38          	push   0x38a6(%di)
    3ea7:	b8 04 00             	mov    $0x4,%ax
    3eaa:	50                   	push   %ax
    3eab:	a0 02 3a             	mov    0x3a02,%al
    3eae:	30 e4                	xor    %ah,%ah
    3eb0:	8b f8                	mov    %ax,%di
    3eb2:	d1 e7                	shl    %di
    3eb4:	ff b5 ac 38          	push   0x38ac(%di)
    3eb8:	a0 02 3a             	mov    0x3a02,%al
    3ebb:	30 e4                	xor    %ah,%ah
    3ebd:	8b f8                	mov    %ax,%di
    3ebf:	d1 e7                	shl    %di
    3ec1:	ff b5 b2 38          	push   0x38b2(%di)
    3ec5:	9a cd 11 02 06       	lcall  $0x602,$0x11cd
    3eca:	31 c0                	xor    %ax,%ax
    3ecc:	a3 bc 38             	mov    %ax,0x38bc
    3ecf:	ff 36 bc 38          	push   0x38bc
    3ed3:	9a d3 10 02 06       	lcall  $0x602,$0x10d3
    3ed8:	b8 f4 01             	mov    $0x1f4,%ax
    3edb:	50                   	push   %ax
    3edc:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    3ee1:	9a 7e 09 a3 0c       	lcall  $0xca3,$0x97e
    3ee6:	31 c0                	xor    %ax,%ax
    3ee8:	a3 8c 45             	mov    %ax,0x458c
    3eeb:	bf 3c 3c             	mov    $0x3c3c,%di
    3eee:	1e                   	push   %ds
    3eef:	57                   	push   %di
    3ef0:	b8 3c 00             	mov    $0x3c,%ax
    3ef3:	50                   	push   %ax
    3ef4:	9a f4 0c a3 0c       	lcall  $0xca3,$0xcf4
    3ef9:	80 3e 07 3a 00       	cmpb   $0x0,0x3a07
    3efe:	75 05                	jne    0x3f05
    3f00:	9a e4 20 02 06       	lcall  $0x602,$0x20e4
    3f05:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3f0a:	eb 03                	jmp    0x3f0f
    3f0c:	ff 46 fe             	incw   -0x2(%bp)
    3f0f:	8b 7e fe             	mov    -0x2(%bp),%di
    3f12:	d1 e7                	shl    %di
    3f14:	d1 e7                	shl    %di
    3f16:	ff b5 e4 38          	push   0x38e4(%di)
    3f1a:	ff b5 e2 38          	push   0x38e2(%di)
    3f1e:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    3f23:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    3f27:	75 e3                	jne    0x3f0c
    3f29:	80 3e 07 3a 00       	cmpb   $0x0,0x3a07
    3f2e:	75 03                	jne    0x3f33
    3f30:	e9 a8 fb             	jmp    0x3adb
    3f33:	83 3e be 5e 00       	cmpw   $0x0,0x5ebe
    3f38:	75 05                	jne    0x3f3f
    3f3a:	c6 06 0c 37 00       	movb   $0x0,0x370c
    3f3f:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    3f44:	75 20                	jne    0x3f66
    3f46:	80 3e 0c 37 01       	cmpb   $0x1,0x370c
    3f4b:	75 05                	jne    0x3f52
    3f4d:	9a 8a 02 f5 1b       	lcall  $0x1bf5,$0x28a
    3f52:	9a 34 02 f5 1b       	lcall  $0x1bf5,$0x234
    3f57:	bf 10 40             	mov    $0x4010,%di
    3f5a:	1e                   	push   %ds
    3f5b:	57                   	push   %di
    3f5c:	bf 14 40             	mov    $0x4014,%di
    3f5f:	1e                   	push   %ds
    3f60:	57                   	push   %di
    3f61:	9a d1 01 f5 1b       	lcall  $0x1bf5,$0x1d1
    3f66:	a1 b6 36             	mov    0x36b6,%ax
    3f69:	03 06 ac 38          	add    0x38ac,%ax
    3f6d:	a3 b6 36             	mov    %ax,0x36b6
    3f70:	c6 06 8c 36 00       	movb   $0x0,0x368c
    3f75:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3f7a:	eb 03                	jmp    0x3f7f
    3f7c:	ff 46 fe             	incw   -0x2(%bp)
    3f7f:	8b 46 fe             	mov    -0x2(%bp),%ax
    3f82:	ba 14 00             	mov    $0x14,%dx
    3f85:	f7 e2                	mul    %dx
    3f87:	8b c8                	mov    %ax,%cx
    3f89:	a0 ba 38             	mov    0x38ba,%al
    3f8c:	30 e4                	xor    %ah,%ah
    3f8e:	ba c8 00             	mov    $0xc8,%dx
    3f91:	f7 e2                	mul    %dx
    3f93:	8b f8                	mov    %ax,%di
    3f95:	03 f9                	add    %cx,%di
    3f97:	81 c7 d2 2f          	add    $0x2fd2,%di
    3f9b:	1e                   	push   %ds
    3f9c:	57                   	push   %di
    3f9d:	bf 8e 36             	mov    $0x368e,%di
    3fa0:	1e                   	push   %ds
    3fa1:	57                   	push   %di
    3fa2:	9a 24 07 ce 1d       	lcall  $0x1dce,$0x724
    3fa7:	75 25                	jne    0x3fce
    3fa9:	c6 06 8c 36 01       	movb   $0x1,0x368c
    3fae:	8b 1e b6 36          	mov    0x36b6,%bx
    3fb2:	8b 46 fe             	mov    -0x2(%bp),%ax
    3fb5:	ba 14 00             	mov    $0x14,%dx
    3fb8:	f7 e2                	mul    %dx
    3fba:	8b c8                	mov    %ax,%cx
    3fbc:	a0 ba 38             	mov    0x38ba,%al
    3fbf:	30 e4                	xor    %ah,%ah
    3fc1:	ba c8 00             	mov    $0xc8,%dx
    3fc4:	f7 e2                	mul    %dx
    3fc6:	8b f8                	mov    %ax,%di
    3fc8:	03 f9                	add    %cx,%di
    3fca:	89 9d db 2f          	mov    %bx,0x2fdb(%di)
    3fce:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    3fd2:	75 a8                	jne    0x3f7c
    3fd4:	80 3e 8c 36 00       	cmpb   $0x0,0x368c
    3fd9:	75 03                	jne    0x3fde
    3fdb:	e9 b7 01             	jmp    0x4195
    3fde:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    3fe3:	eb 03                	jmp    0x3fe8
    3fe5:	ff 46 fe             	incw   -0x2(%bp)
    3fe8:	8b 46 fe             	mov    -0x2(%bp),%ax
    3feb:	40                   	inc    %ax
    3fec:	3d 0a 00             	cmp    $0xa,%ax
    3fef:	7e 03                	jle    0x3ff4
    3ff1:	e9 ed 00             	jmp    0x40e1
    3ff4:	89 46 fc             	mov    %ax,-0x4(%bp)
    3ff7:	eb 03                	jmp    0x3ffc
    3ff9:	ff 46 fc             	incw   -0x4(%bp)
    3ffc:	8b 46 fe             	mov    -0x2(%bp),%ax
    3fff:	ba 14 00             	mov    $0x14,%dx
    4002:	f7 e2                	mul    %dx
    4004:	8b c8                	mov    %ax,%cx
    4006:	a0 ba 38             	mov    0x38ba,%al
    4009:	30 e4                	xor    %ah,%ah
    400b:	ba c8 00             	mov    $0xc8,%dx
    400e:	f7 e2                	mul    %dx
    4010:	8b f8                	mov    %ax,%di
    4012:	03 f9                	add    %cx,%di
    4014:	8b 9d db 2f          	mov    0x2fdb(%di),%bx
    4018:	8b 46 fc             	mov    -0x4(%bp),%ax
    401b:	ba 14 00             	mov    $0x14,%dx
    401e:	f7 e2                	mul    %dx
    4020:	8b c8                	mov    %ax,%cx
    4022:	a0 ba 38             	mov    0x38ba,%al
    4025:	30 e4                	xor    %ah,%ah
    4027:	ba c8 00             	mov    $0xc8,%dx
    402a:	f7 e2                	mul    %dx
    402c:	8b f8                	mov    %ax,%di
    402e:	03 f9                	add    %cx,%di
    4030:	8b 85 db 2f          	mov    0x2fdb(%di),%ax
    4034:	3b c3                	cmp    %bx,%ax
    4036:	7f 03                	jg     0x403b
    4038:	e9 9d 00             	jmp    0x40d8
    403b:	8b 46 fe             	mov    -0x2(%bp),%ax
    403e:	ba 14 00             	mov    $0x14,%dx
    4041:	f7 e2                	mul    %dx
    4043:	8b c8                	mov    %ax,%cx
    4045:	a0 ba 38             	mov    0x38ba,%al
    4048:	30 e4                	xor    %ah,%ah
    404a:	ba c8 00             	mov    $0xc8,%dx
    404d:	f7 e2                	mul    %dx
    404f:	8b f8                	mov    %ax,%di
    4051:	03 f9                	add    %cx,%di
    4053:	81 c7 d2 2f          	add    $0x2fd2,%di
    4057:	1e                   	push   %ds
    4058:	57                   	push   %di
    4059:	8d 7e e4             	lea    -0x1c(%bp),%di
    405c:	16                   	push   %ss
    405d:	57                   	push   %di
    405e:	b8 14 00             	mov    $0x14,%ax
    4061:	50                   	push   %ax
    4062:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    4067:	8b 46 fc             	mov    -0x4(%bp),%ax
    406a:	ba 14 00             	mov    $0x14,%dx
    406d:	f7 e2                	mul    %dx
    406f:	8b c8                	mov    %ax,%cx
    4071:	a0 ba 38             	mov    0x38ba,%al
    4074:	30 e4                	xor    %ah,%ah
    4076:	ba c8 00             	mov    $0xc8,%dx
    4079:	f7 e2                	mul    %dx
    407b:	8b f8                	mov    %ax,%di
    407d:	03 f9                	add    %cx,%di
    407f:	81 c7 d2 2f          	add    $0x2fd2,%di
    4083:	1e                   	push   %ds
    4084:	57                   	push   %di
    4085:	8b 46 fe             	mov    -0x2(%bp),%ax
    4088:	ba 14 00             	mov    $0x14,%dx
    408b:	f7 e2                	mul    %dx
    408d:	8b c8                	mov    %ax,%cx
    408f:	a0 ba 38             	mov    0x38ba,%al
    4092:	30 e4                	xor    %ah,%ah
    4094:	ba c8 00             	mov    $0xc8,%dx
    4097:	f7 e2                	mul    %dx
    4099:	8b f8                	mov    %ax,%di
    409b:	03 f9                	add    %cx,%di
    409d:	81 c7 d2 2f          	add    $0x2fd2,%di
    40a1:	1e                   	push   %ds
    40a2:	57                   	push   %di
    40a3:	b8 14 00             	mov    $0x14,%ax
    40a6:	50                   	push   %ax
    40a7:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    40ac:	8d 7e e4             	lea    -0x1c(%bp),%di
    40af:	16                   	push   %ss
    40b0:	57                   	push   %di
    40b1:	8b 46 fc             	mov    -0x4(%bp),%ax
    40b4:	ba 14 00             	mov    $0x14,%dx
    40b7:	f7 e2                	mul    %dx
    40b9:	8b c8                	mov    %ax,%cx
    40bb:	a0 ba 38             	mov    0x38ba,%al
    40be:	30 e4                	xor    %ah,%ah
    40c0:	ba c8 00             	mov    $0xc8,%dx
    40c3:	f7 e2                	mul    %dx
    40c5:	8b f8                	mov    %ax,%di
    40c7:	03 f9                	add    %cx,%di
    40c9:	81 c7 d2 2f          	add    $0x2fd2,%di
    40cd:	1e                   	push   %ds
    40ce:	57                   	push   %di
    40cf:	b8 14 00             	mov    $0x14,%ax
    40d2:	50                   	push   %ax
    40d3:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    40d8:	83 7e fc 0a          	cmpw   $0xa,-0x4(%bp)
    40dc:	74 03                	je     0x40e1
    40de:	e9 18 ff             	jmp    0x3ff9
    40e1:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    40e5:	74 03                	je     0x40ea
    40e7:	e9 fb fe             	jmp    0x3fe5
    40ea:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    40ef:	eb 03                	jmp    0x40f4
    40f1:	ff 46 fe             	incw   -0x2(%bp)
    40f4:	8b 46 fe             	mov    -0x2(%bp),%ax
    40f7:	ba 14 00             	mov    $0x14,%dx
    40fa:	f7 e2                	mul    %dx
    40fc:	8b c8                	mov    %ax,%cx
    40fe:	a0 ba 38             	mov    0x38ba,%al
    4101:	30 e4                	xor    %ah,%ah
    4103:	ba c8 00             	mov    $0xc8,%dx
    4106:	f7 e2                	mul    %dx
    4108:	8b f8                	mov    %ax,%di
    410a:	03 f9                	add    %cx,%di
    410c:	83 bd db 2f 00       	cmpw   $0x0,0x2fdb(%di)
    4111:	7d 76                	jge    0x4189
    4113:	bf 29 38             	mov    $0x3829,%di
    4116:	0e                   	push   %cs
    4117:	57                   	push   %di
    4118:	8b 46 fe             	mov    -0x2(%bp),%ax
    411b:	ba 14 00             	mov    $0x14,%dx
    411e:	f7 e2                	mul    %dx
    4120:	8b c8                	mov    %ax,%cx
    4122:	a0 ba 38             	mov    0x38ba,%al
    4125:	30 e4                	xor    %ah,%ah
    4127:	ba c8 00             	mov    $0xc8,%dx
    412a:	f7 e2                	mul    %dx
    412c:	8b f8                	mov    %ax,%di
    412e:	03 f9                	add    %cx,%di
    4130:	81 c7 d2 2f          	add    $0x2fd2,%di
    4134:	1e                   	push   %ds
    4135:	57                   	push   %di
    4136:	b8 08 00             	mov    $0x8,%ax
    4139:	50                   	push   %ax
    413a:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    413f:	8b 46 fe             	mov    -0x2(%bp),%ax
    4142:	ba 14 00             	mov    $0x14,%dx
    4145:	f7 e2                	mul    %dx
    4147:	8b c8                	mov    %ax,%cx
    4149:	a0 ba 38             	mov    0x38ba,%al
    414c:	30 e4                	xor    %ah,%ah
    414e:	ba c8 00             	mov    $0xc8,%dx
    4151:	f7 e2                	mul    %dx
    4153:	8b f8                	mov    %ax,%di
    4155:	03 f9                	add    %cx,%di
    4157:	31 c0                	xor    %ax,%ax
    4159:	89 85 db 2f          	mov    %ax,0x2fdb(%di)
    415d:	bf 30 38             	mov    $0x3830,%di
    4160:	0e                   	push   %cs
    4161:	57                   	push   %di
    4162:	8b 46 fe             	mov    -0x2(%bp),%ax
    4165:	ba 14 00             	mov    $0x14,%dx
    4168:	f7 e2                	mul    %dx
    416a:	8b c8                	mov    %ax,%cx
    416c:	a0 ba 38             	mov    0x38ba,%al
    416f:	30 e4                	xor    %ah,%ah
    4171:	ba c8 00             	mov    $0xc8,%dx
    4174:	f7 e2                	mul    %dx
    4176:	8b f8                	mov    %ax,%di
    4178:	03 f9                	add    %cx,%di
    417a:	81 c7 dd 2f          	add    $0x2fdd,%di
    417e:	1e                   	push   %ds
    417f:	57                   	push   %di
    4180:	b8 08 00             	mov    $0x8,%ax
    4183:	50                   	push   %ax
    4184:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4189:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    418d:	74 03                	je     0x4192
    418f:	e9 5f ff             	jmp    0x40f1
    4192:	e9 b7 01             	jmp    0x434c
    4195:	31 c0                	xor    %ax,%ax
    4197:	89 46 fe             	mov    %ax,-0x2(%bp)
    419a:	c6 06 8b 36 0b       	movb   $0xb,0x368b
    419f:	ff 46 fe             	incw   -0x2(%bp)
    41a2:	8b 46 fe             	mov    -0x2(%bp),%ax
    41a5:	ba 14 00             	mov    $0x14,%dx
    41a8:	f7 e2                	mul    %dx
    41aa:	8b c8                	mov    %ax,%cx
    41ac:	a0 ba 38             	mov    0x38ba,%al
    41af:	30 e4                	xor    %ah,%ah
    41b1:	ba c8 00             	mov    $0xc8,%dx
    41b4:	f7 e2                	mul    %dx
    41b6:	8b f8                	mov    %ax,%di
    41b8:	03 f9                	add    %cx,%di
    41ba:	8b 85 db 2f          	mov    0x2fdb(%di),%ax
    41be:	3b 06 b6 36          	cmp    0x36b6,%ax
    41c2:	7d 06                	jge    0x41ca
    41c4:	8a 46 fe             	mov    -0x2(%bp),%al
    41c7:	a2 8b 36             	mov    %al,0x368b
    41ca:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    41ce:	7f 22                	jg     0x41f2
    41d0:	8b 46 fe             	mov    -0x2(%bp),%ax
    41d3:	ba 14 00             	mov    $0x14,%dx
    41d6:	f7 e2                	mul    %dx
    41d8:	8b c8                	mov    %ax,%cx
    41da:	a0 ba 38             	mov    0x38ba,%al
    41dd:	30 e4                	xor    %ah,%ah
    41df:	ba c8 00             	mov    $0xc8,%dx
    41e2:	f7 e2                	mul    %dx
    41e4:	8b f8                	mov    %ax,%di
    41e6:	03 f9                	add    %cx,%di
    41e8:	8b 85 db 2f          	mov    0x2fdb(%di),%ax
    41ec:	3b 06 b6 36          	cmp    0x36b6,%ax
    41f0:	7d ad                	jge    0x419f
    41f2:	80 3e 8b 36 0b       	cmpb   $0xb,0x368b
    41f7:	72 0d                	jb     0x4206
    41f9:	81 3e b6 36 c8 00    	cmpw   $0xc8,0x36b6
    41ff:	7e 05                	jle    0x4206
    4201:	c6 06 8b 36 0a       	movb   $0xa,0x368b
    4206:	80 3e 8b 36 0b       	cmpb   $0xb,0x368b
    420b:	72 03                	jb     0x4210
    420d:	e9 3c 01             	jmp    0x434c
    4210:	bf 8e 36             	mov    $0x368e,%di
    4213:	1e                   	push   %ds
    4214:	57                   	push   %di
    4215:	a0 ba 38             	mov    0x38ba,%al
    4218:	30 e4                	xor    %ah,%ah
    421a:	ba c8 00             	mov    $0xc8,%dx
    421d:	f7 e2                	mul    %dx
    421f:	8b f8                	mov    %ax,%di
    4221:	81 c7 9a 30          	add    $0x309a,%di
    4225:	1e                   	push   %ds
    4226:	57                   	push   %di
    4227:	b8 08 00             	mov    $0x8,%ax
    422a:	50                   	push   %ax
    422b:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4230:	8b 0e b6 36          	mov    0x36b6,%cx
    4234:	a0 ba 38             	mov    0x38ba,%al
    4237:	30 e4                	xor    %ah,%ah
    4239:	ba c8 00             	mov    $0xc8,%dx
    423c:	f7 e2                	mul    %dx
    423e:	8b f8                	mov    %ax,%di
    4240:	89 8d a3 30          	mov    %cx,0x30a3(%di)
    4244:	bf 98 36             	mov    $0x3698,%di
    4247:	1e                   	push   %ds
    4248:	57                   	push   %di
    4249:	a0 ba 38             	mov    0x38ba,%al
    424c:	30 e4                	xor    %ah,%ah
    424e:	ba c8 00             	mov    $0xc8,%dx
    4251:	f7 e2                	mul    %dx
    4253:	8b f8                	mov    %ax,%di
    4255:	81 c7 a5 30          	add    $0x30a5,%di
    4259:	1e                   	push   %ds
    425a:	57                   	push   %di
    425b:	b8 08 00             	mov    $0x8,%ax
    425e:	50                   	push   %ax
    425f:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4264:	a0 8b 36             	mov    0x368b,%al
    4267:	30 e4                	xor    %ah,%ah
    4269:	40                   	inc    %ax
    426a:	89 46 e2             	mov    %ax,-0x1e(%bp)
    426d:	b8 0a 00             	mov    $0xa,%ax
    4270:	3b 46 e2             	cmp    -0x1e(%bp),%ax
    4273:	7d 03                	jge    0x4278
    4275:	e9 d4 00             	jmp    0x434c
    4278:	89 46 fe             	mov    %ax,-0x2(%bp)
    427b:	eb 03                	jmp    0x4280
    427d:	ff 4e fe             	decw   -0x2(%bp)
    4280:	8b 46 fe             	mov    -0x2(%bp),%ax
    4283:	48                   	dec    %ax
    4284:	ba 14 00             	mov    $0x14,%dx
    4287:	f7 e2                	mul    %dx
    4289:	8b c8                	mov    %ax,%cx
    428b:	a0 ba 38             	mov    0x38ba,%al
    428e:	30 e4                	xor    %ah,%ah
    4290:	ba c8 00             	mov    $0xc8,%dx
    4293:	f7 e2                	mul    %dx
    4295:	8b f8                	mov    %ax,%di
    4297:	03 f9                	add    %cx,%di
    4299:	81 c7 d2 2f          	add    $0x2fd2,%di
    429d:	1e                   	push   %ds
    429e:	57                   	push   %di
    429f:	8b 46 fe             	mov    -0x2(%bp),%ax
    42a2:	ba 14 00             	mov    $0x14,%dx
    42a5:	f7 e2                	mul    %dx
    42a7:	8b c8                	mov    %ax,%cx
    42a9:	a0 ba 38             	mov    0x38ba,%al
    42ac:	30 e4                	xor    %ah,%ah
    42ae:	ba c8 00             	mov    $0xc8,%dx
    42b1:	f7 e2                	mul    %dx
    42b3:	8b f8                	mov    %ax,%di
    42b5:	03 f9                	add    %cx,%di
    42b7:	81 c7 d2 2f          	add    $0x2fd2,%di
    42bb:	1e                   	push   %ds
    42bc:	57                   	push   %di
    42bd:	b8 14 00             	mov    $0x14,%ax
    42c0:	50                   	push   %ax
    42c1:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    42c6:	bf 8e 36             	mov    $0x368e,%di
    42c9:	1e                   	push   %ds
    42ca:	57                   	push   %di
    42cb:	8b 46 fe             	mov    -0x2(%bp),%ax
    42ce:	48                   	dec    %ax
    42cf:	ba 14 00             	mov    $0x14,%dx
    42d2:	f7 e2                	mul    %dx
    42d4:	8b c8                	mov    %ax,%cx
    42d6:	a0 ba 38             	mov    0x38ba,%al
    42d9:	30 e4                	xor    %ah,%ah
    42db:	ba c8 00             	mov    $0xc8,%dx
    42de:	f7 e2                	mul    %dx
    42e0:	8b f8                	mov    %ax,%di
    42e2:	03 f9                	add    %cx,%di
    42e4:	81 c7 d2 2f          	add    $0x2fd2,%di
    42e8:	1e                   	push   %ds
    42e9:	57                   	push   %di
    42ea:	b8 08 00             	mov    $0x8,%ax
    42ed:	50                   	push   %ax
    42ee:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    42f3:	8b 1e b6 36          	mov    0x36b6,%bx
    42f7:	8b 46 fe             	mov    -0x2(%bp),%ax
    42fa:	48                   	dec    %ax
    42fb:	ba 14 00             	mov    $0x14,%dx
    42fe:	f7 e2                	mul    %dx
    4300:	8b c8                	mov    %ax,%cx
    4302:	a0 ba 38             	mov    0x38ba,%al
    4305:	30 e4                	xor    %ah,%ah
    4307:	ba c8 00             	mov    $0xc8,%dx
    430a:	f7 e2                	mul    %dx
    430c:	8b f8                	mov    %ax,%di
    430e:	03 f9                	add    %cx,%di
    4310:	89 9d db 2f          	mov    %bx,0x2fdb(%di)
    4314:	bf 98 36             	mov    $0x3698,%di
    4317:	1e                   	push   %ds
    4318:	57                   	push   %di
    4319:	8b 46 fe             	mov    -0x2(%bp),%ax
    431c:	48                   	dec    %ax
    431d:	ba 14 00             	mov    $0x14,%dx
    4320:	f7 e2                	mul    %dx
    4322:	8b c8                	mov    %ax,%cx
    4324:	a0 ba 38             	mov    0x38ba,%al
    4327:	30 e4                	xor    %ah,%ah
    4329:	ba c8 00             	mov    $0xc8,%dx
    432c:	f7 e2                	mul    %dx
    432e:	8b f8                	mov    %ax,%di
    4330:	03 f9                	add    %cx,%di
    4332:	81 c7 dd 2f          	add    $0x2fdd,%di
    4336:	1e                   	push   %ds
    4337:	57                   	push   %di
    4338:	b8 08 00             	mov    $0x8,%ax
    433b:	50                   	push   %ax
    433c:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4341:	8b 46 fe             	mov    -0x2(%bp),%ax
    4344:	3b 46 e2             	cmp    -0x1e(%bp),%ax
    4347:	74 03                	je     0x434c
    4349:	e9 31 ff             	jmp    0x427d
    434c:	bf ff 37             	mov    $0x37ff,%di
    434f:	0e                   	push   %cs
    4350:	57                   	push   %di
    4351:	bf 37 38             	mov    $0x3837,%di
    4354:	0e                   	push   %cs
    4355:	57                   	push   %di
    4356:	31 c0                	xor    %ax,%ax
    4358:	50                   	push   %ax
    4359:	31 c0                	xor    %ax,%ax
    435b:	50                   	push   %ax
    435c:	b8 01 00             	mov    $0x1,%ax
    435f:	50                   	push   %ax
    4360:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    4365:	9a 61 1e 02 06       	lcall  $0x602,$0x1e61
    436a:	0e                   	push   %cs
    436b:	e8 fd ed             	call   0x316b
    436e:	bf 3c 3c             	mov    $0x3c3c,%di
    4371:	1e                   	push   %ds
    4372:	57                   	push   %di
    4373:	b8 3c 00             	mov    $0x3c,%ax
    4376:	50                   	push   %ax
    4377:	9a 5b 0a a3 0c       	lcall  $0xca3,$0xa5b
    437c:	a1 18 37             	mov    0x3718,%ax
    437f:	05 0f 00             	add    $0xf,%ax
    4382:	a3 80 45             	mov    %ax,0x4580
    4385:	a1 22 37             	mov    0x3722,%ax
    4388:	05 0c 00             	add    $0xc,%ax
    438b:	a3 82 45             	mov    %ax,0x4582
    438e:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    4393:	74 0d                	je     0x43a2
    4395:	ff 36 80 45          	push   0x4580
    4399:	ff 36 82 45          	push   0x4582
    439d:	9a 43 08 a3 0c       	lcall  $0xca3,$0x843
    43a2:	81 3e 8c 45 00 3f    	cmpw   $0x3f00,0x458c
    43a8:	74 03                	je     0x43ad
    43aa:	e9 9c f4             	jmp    0x3849
    43ad:	89 ec                	mov    %bp,%sp
    43af:	5d                   	pop    %bp
    43b0:	cb                   	lret
    43b1:	55                   	push   %bp
    43b2:	89 e5                	mov    %sp,%bp
    43b4:	83 ec 14             	sub    $0x14,%sp
    43b7:	31 c0                	xor    %ax,%ax
    43b9:	89 46 f8             	mov    %ax,-0x8(%bp)
    43bc:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    43c1:	eb 03                	jmp    0x43c6
    43c3:	ff 46 fe             	incw   -0x2(%bp)
    43c6:	8b 7e fe             	mov    -0x2(%bp),%di
    43c9:	8a 85 6b 00          	mov    0x6b(%di),%al
    43cd:	30 e4                	xor    %ah,%ah
    43cf:	8b 7e fe             	mov    -0x2(%bp),%di
    43d2:	d1 e7                	shl    %di
    43d4:	89 85 5c 5c          	mov    %ax,0x5c5c(%di)
    43d8:	8b 7e fe             	mov    -0x2(%bp),%di
    43db:	8a 85 b1 00          	mov    0xb1(%di),%al
    43df:	30 e4                	xor    %ah,%ah
    43e1:	8b 7e fe             	mov    -0x2(%bp),%di
    43e4:	d1 e7                	shl    %di
    43e6:	89 85 04 5a          	mov    %ax,0x5a04(%di)
    43ea:	83 7e fe 46          	cmpw   $0x46,-0x2(%bp)
    43ee:	75 d3                	jne    0x43c3
    43f0:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    43f5:	eb 03                	jmp    0x43fa
    43f7:	ff 46 fe             	incw   -0x2(%bp)
    43fa:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    43ff:	eb 03                	jmp    0x4404
    4401:	ff 46 fc             	incw   -0x4(%bp)
    4404:	9a e8 08 a3 0c       	lcall  $0xca3,$0x8e8
    4409:	08 c0                	or     %al,%al
    440b:	74 05                	je     0x4412
    440d:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
    4412:	83 7e f8 00          	cmpw   $0x0,-0x8(%bp)
    4416:	75 56                	jne    0x446e
    4418:	8b 46 fc             	mov    -0x4(%bp),%ax
    441b:	d1 e0                	shl    %ax
    441d:	8b 7e fe             	mov    -0x2(%bp),%di
    4420:	b1 03                	mov    $0x3,%cl
    4422:	d3 e7                	shl    %cl,%di
    4424:	03 f8                	add    %ax,%di
    4426:	ff b5 ae 3f          	push   0x3fae(%di)
    442a:	8b 46 fc             	mov    -0x4(%bp),%ax
    442d:	d1 e0                	shl    %ax
    442f:	8b 7e fe             	mov    -0x2(%bp),%di
    4432:	b1 03                	mov    $0x3,%cl
    4434:	d3 e7                	shl    %cl,%di
    4436:	03 f8                	add    %ax,%di
    4438:	ff b5 d6 3f          	push   0x3fd6(%di)
    443c:	ff 36 a4 3f          	push   0x3fa4
    4440:	ff 36 a6 3f          	push   0x3fa6
    4444:	b8 01 00             	mov    $0x1,%ax
    4447:	50                   	push   %ax
    4448:	8b 7e fc             	mov    -0x4(%bp),%di
    444b:	d1 e7                	shl    %di
    444d:	ff b5 a6 3f          	push   0x3fa6(%di)
    4451:	8b 7e fc             	mov    -0x4(%bp),%di
    4454:	d1 e7                	shl    %di
    4456:	ff b5 ae 3f          	push   0x3fae(%di)
    445a:	31 c0                	xor    %ax,%ax
    445c:	50                   	push   %ax
    445d:	b0 02                	mov    $0x2,%al
    445f:	50                   	push   %ax
    4460:	b0 00                	mov    $0x0,%al
    4462:	50                   	push   %ax
    4463:	b0 00                	mov    $0x0,%al
    4465:	50                   	push   %ax
    4466:	31 c0                	xor    %ax,%ax
    4468:	50                   	push   %ax
    4469:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    446e:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    4472:	75 8d                	jne    0x4401
    4474:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    4478:	74 03                	je     0x447d
    447a:	e9 7a ff             	jmp    0x43f7
    447d:	83 3e be 5e 00       	cmpw   $0x0,0x5ebe
    4482:	75 19                	jne    0x449d
    4484:	b8 46 00             	mov    $0x46,%ax
    4487:	50                   	push   %ax
    4488:	b8 04 00             	mov    $0x4,%ax
    448b:	50                   	push   %ax
    448c:	b8 81 9a             	mov    $0x9a81,%ax
    448f:	bb 99 99             	mov    $0x9999,%bx
    4492:	ba 99 19             	mov    $0x1999,%dx
    4495:	52                   	push   %dx
    4496:	53                   	push   %bx
    4497:	50                   	push   %ax
    4498:	9a 2e 00 f5 1b       	lcall  $0x1bf5,$0x2e
    449d:	31 c0                	xor    %ax,%ax
    449f:	89 46 fa             	mov    %ax,-0x6(%bp)
    44a2:	8d 7e f2             	lea    -0xe(%bp),%di
    44a5:	16                   	push   %ss
    44a6:	57                   	push   %di
    44a7:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    44ac:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    44b1:	eb 03                	jmp    0x44b6
    44b3:	ff 46 fe             	incw   -0x2(%bp)
    44b6:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    44bb:	eb 03                	jmp    0x44c0
    44bd:	ff 46 fc             	incw   -0x4(%bp)
    44c0:	9a e8 08 a3 0c       	lcall  $0xca3,$0x8e8
    44c5:	08 c0                	or     %al,%al
    44c7:	74 05                	je     0x44ce
    44c9:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
    44ce:	83 7e f8 00          	cmpw   $0x0,-0x8(%bp)
    44d2:	75 62                	jne    0x4536
    44d4:	8b 46 fc             	mov    -0x4(%bp),%ax
    44d7:	d1 e0                	shl    %ax
    44d9:	8b 7e fe             	mov    -0x2(%bp),%di
    44dc:	d1 e7                	shl    %di
    44de:	8b bd 5e 00          	mov    0x5e(%di),%di
    44e2:	b1 03                	mov    $0x3,%cl
    44e4:	d3 e7                	shl    %cl,%di
    44e6:	03 f8                	add    %ax,%di
    44e8:	ff b5 ae 3f          	push   0x3fae(%di)
    44ec:	8b 46 fc             	mov    -0x4(%bp),%ax
    44ef:	d1 e0                	shl    %ax
    44f1:	8b 7e fe             	mov    -0x2(%bp),%di
    44f4:	d1 e7                	shl    %di
    44f6:	8b bd 5e 00          	mov    0x5e(%di),%di
    44fa:	b1 03                	mov    $0x3,%cl
    44fc:	d3 e7                	shl    %cl,%di
    44fe:	03 f8                	add    %ax,%di
    4500:	ff b5 d6 3f          	push   0x3fd6(%di)
    4504:	ff 36 a4 3f          	push   0x3fa4
    4508:	ff 36 a6 3f          	push   0x3fa6
    450c:	b8 01 00             	mov    $0x1,%ax
    450f:	50                   	push   %ax
    4510:	8b 7e fc             	mov    -0x4(%bp),%di
    4513:	d1 e7                	shl    %di
    4515:	ff b5 a6 3f          	push   0x3fa6(%di)
    4519:	8b 7e fc             	mov    -0x4(%bp),%di
    451c:	d1 e7                	shl    %di
    451e:	ff b5 ae 3f          	push   0x3fae(%di)
    4522:	31 c0                	xor    %ax,%ax
    4524:	50                   	push   %ax
    4525:	b0 02                	mov    $0x2,%al
    4527:	50                   	push   %ax
    4528:	b0 00                	mov    $0x0,%al
    452a:	50                   	push   %ax
    452b:	b0 00                	mov    $0x0,%al
    452d:	50                   	push   %ax
    452e:	31 c0                	xor    %ax,%ax
    4530:	50                   	push   %ax
    4531:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    4536:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    453a:	75 81                	jne    0x44bd
    453c:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    4540:	74 03                	je     0x4545
    4542:	e9 6e ff             	jmp    0x44b3
    4545:	9a bc 02 f5 1b       	lcall  $0x1bf5,$0x2bc
    454a:	9a 58 02 f5 1b       	lcall  $0x1bf5,$0x258
    454f:	9a e8 08 a3 0c       	lcall  $0xca3,$0x8e8
    4554:	08 c0                	or     %al,%al
    4556:	74 05                	je     0x455d
    4558:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
    455d:	8d 7e f2             	lea    -0xe(%bp),%di
    4560:	16                   	push   %ss
    4561:	57                   	push   %di
    4562:	8d 7e ec             	lea    -0x14(%bp),%di
    4565:	16                   	push   %ss
    4566:	57                   	push   %di
    4567:	9a ad 0f a3 0c       	lcall  $0xca3,$0xfad
    456c:	8b 46 ec             	mov    -0x14(%bp),%ax
    456f:	8b 5e ee             	mov    -0x12(%bp),%bx
    4572:	8b 56 f0             	mov    -0x10(%bp),%dx
    4575:	b9 81 ec             	mov    $0xec81,%cx
    4578:	be 51 b8             	mov    $0xb851,%si
    457b:	bf 1e 45             	mov    $0x451e,%di
    457e:	9a 6a 0c ce 1d       	lcall  $0x1dce,$0xc6a
    4583:	73 03                	jae    0x4588
    4585:	e9 af 00             	jmp    0x4637
    4588:	8d 7e f2             	lea    -0xe(%bp),%di
    458b:	16                   	push   %ss
    458c:	57                   	push   %di
    458d:	9a 8d 0f a3 0c       	lcall  $0xca3,$0xf8d
    4592:	ff 46 fa             	incw   -0x6(%bp)
    4595:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    459a:	eb 03                	jmp    0x459f
    459c:	ff 46 fe             	incw   -0x2(%bp)
    459f:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    45a4:	eb 03                	jmp    0x45a9
    45a6:	ff 46 fc             	incw   -0x4(%bp)
    45a9:	9a e8 08 a3 0c       	lcall  $0xca3,$0x8e8
    45ae:	08 c0                	or     %al,%al
    45b0:	74 05                	je     0x45b7
    45b2:	c7 46 f8 01 00       	movw   $0x1,-0x8(%bp)
    45b7:	83 7e fa 0a          	cmpw   $0xa,-0x6(%bp)
    45bb:	7d 68                	jge    0x4625
    45bd:	83 7e f8 00          	cmpw   $0x0,-0x8(%bp)
    45c1:	75 62                	jne    0x4625
    45c3:	8b 46 fc             	mov    -0x4(%bp),%ax
    45c6:	d1 e0                	shl    %ax
    45c8:	8b 7e fe             	mov    -0x2(%bp),%di
    45cb:	d1 e7                	shl    %di
    45cd:	8b bd 5e 00          	mov    0x5e(%di),%di
    45d1:	b1 03                	mov    $0x3,%cl
    45d3:	d3 e7                	shl    %cl,%di
    45d5:	03 f8                	add    %ax,%di
    45d7:	ff b5 ae 3f          	push   0x3fae(%di)
    45db:	8b 46 fc             	mov    -0x4(%bp),%ax
    45de:	d1 e0                	shl    %ax
    45e0:	8b 7e fe             	mov    -0x2(%bp),%di
    45e3:	d1 e7                	shl    %di
    45e5:	8b bd 5e 00          	mov    0x5e(%di),%di
    45e9:	b1 03                	mov    $0x3,%cl
    45eb:	d3 e7                	shl    %cl,%di
    45ed:	03 f8                	add    %ax,%di
    45ef:	ff b5 d6 3f          	push   0x3fd6(%di)
    45f3:	ff 36 a4 3f          	push   0x3fa4
    45f7:	ff 36 a6 3f          	push   0x3fa6
    45fb:	b8 01 00             	mov    $0x1,%ax
    45fe:	50                   	push   %ax
    45ff:	8b 7e fc             	mov    -0x4(%bp),%di
    4602:	d1 e7                	shl    %di
    4604:	ff b5 a6 3f          	push   0x3fa6(%di)
    4608:	8b 7e fc             	mov    -0x4(%bp),%di
    460b:	d1 e7                	shl    %di
    460d:	ff b5 ae 3f          	push   0x3fae(%di)
    4611:	31 c0                	xor    %ax,%ax
    4613:	50                   	push   %ax
    4614:	b0 02                	mov    $0x2,%al
    4616:	50                   	push   %ax
    4617:	b0 00                	mov    $0x0,%al
    4619:	50                   	push   %ax
    461a:	b0 00                	mov    $0x0,%al
    461c:	50                   	push   %ax
    461d:	31 c0                	xor    %ax,%ax
    461f:	50                   	push   %ax
    4620:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    4625:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    4629:	74 03                	je     0x462e
    462b:	e9 78 ff             	jmp    0x45a6
    462e:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    4632:	74 03                	je     0x4637
    4634:	e9 65 ff             	jmp    0x459c
    4637:	83 7e f8 01          	cmpw   $0x1,-0x8(%bp)
    463b:	74 0c                	je     0x4649
    463d:	9a d5 02 f5 1b       	lcall  $0x1bf5,$0x2d5
    4642:	09 c0                	or     %ax,%ax
    4644:	74 03                	je     0x4649
    4646:	e9 06 ff             	jmp    0x454f
    4649:	9a 8a 02 f5 1b       	lcall  $0x1bf5,$0x28a
    464e:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    4653:	75 07                	jne    0x465c
    4655:	9a 34 02 f5 1b       	lcall  $0x1bf5,$0x234
    465a:	eb 05                	jmp    0x4661
    465c:	9a 60 01 f5 1b       	lcall  $0x1bf5,$0x160
    4661:	c7 46 fe 04 00       	movw   $0x4,-0x2(%bp)
    4666:	eb 03                	jmp    0x466b
    4668:	ff 4e fe             	decw   -0x2(%bp)
    466b:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    4670:	eb 03                	jmp    0x4675
    4672:	ff 46 fc             	incw   -0x4(%bp)
    4675:	9a e8 08 a3 0c       	lcall  $0xca3,$0x8e8
    467a:	08 c0                	or     %al,%al
    467c:	74 02                	je     0x4680
    467e:	eb 62                	jmp    0x46e2
    4680:	8b 46 fc             	mov    -0x4(%bp),%ax
    4683:	d1 e0                	shl    %ax
    4685:	8b 7e fe             	mov    -0x2(%bp),%di
    4688:	b1 03                	mov    $0x3,%cl
    468a:	d3 e7                	shl    %cl,%di
    468c:	03 f8                	add    %ax,%di
    468e:	ff b5 ae 3f          	push   0x3fae(%di)
    4692:	8b 46 fc             	mov    -0x4(%bp),%ax
    4695:	d1 e0                	shl    %ax
    4697:	8b 7e fe             	mov    -0x2(%bp),%di
    469a:	b1 03                	mov    $0x3,%cl
    469c:	d3 e7                	shl    %cl,%di
    469e:	03 f8                	add    %ax,%di
    46a0:	ff b5 d6 3f          	push   0x3fd6(%di)
    46a4:	ff 36 a4 3f          	push   0x3fa4
    46a8:	ff 36 a6 3f          	push   0x3fa6
    46ac:	b8 01 00             	mov    $0x1,%ax
    46af:	50                   	push   %ax
    46b0:	8b 7e fc             	mov    -0x4(%bp),%di
    46b3:	d1 e7                	shl    %di
    46b5:	ff b5 a6 3f          	push   0x3fa6(%di)
    46b9:	8b 7e fc             	mov    -0x4(%bp),%di
    46bc:	d1 e7                	shl    %di
    46be:	ff b5 ae 3f          	push   0x3fae(%di)
    46c2:	31 c0                	xor    %ax,%ax
    46c4:	50                   	push   %ax
    46c5:	b0 02                	mov    $0x2,%al
    46c7:	50                   	push   %ax
    46c8:	b0 00                	mov    $0x0,%al
    46ca:	50                   	push   %ax
    46cb:	b0 00                	mov    $0x0,%al
    46cd:	50                   	push   %ax
    46ce:	31 c0                	xor    %ax,%ax
    46d0:	50                   	push   %ax
    46d1:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    46d6:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    46da:	75 96                	jne    0x4672
    46dc:	83 7e fe 01          	cmpw   $0x1,-0x2(%bp)
    46e0:	75 86                	jne    0x4668
    46e2:	89 ec                	mov    %bp,%sp
    46e4:	5d                   	pop    %bp
    46e5:	cb                   	lret
    46e6:	55                   	push   %bp
    46e7:	89 e5                	mov    %sp,%bp
    46e9:	83 ec 06             	sub    $0x6,%sp
    46ec:	c7 06 a4 3f 61 00    	movw   $0x61,0x3fa4
    46f2:	c7 06 a6 3f 42 00    	movw   $0x42,0x3fa6
    46f8:	c7 06 a8 3f 14 00    	movw   $0x14,0x3fa8
    46fe:	c7 06 b0 3f a9 00    	movw   $0xa9,0x3fb0
    4704:	c7 06 aa 3f 62 00    	movw   $0x62,0x3faa
    470a:	c7 06 b2 3f ed 00    	movw   $0xed,0x3fb2
    4710:	c7 06 ac 3f bd 01    	movw   $0x1bd,0x3fac
    4716:	c7 06 b4 3f ed 00    	movw   $0xed,0x3fb4
    471c:	c7 06 ae 3f 0b 02    	movw   $0x20b,0x3fae
    4722:	c7 06 b6 3f a9 00    	movw   $0xa9,0x3fb6
    4728:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    472d:	eb 03                	jmp    0x4732
    472f:	ff 46 fe             	incw   -0x2(%bp)
    4732:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    4737:	eb 03                	jmp    0x473c
    4739:	ff 46 fc             	incw   -0x4(%bp)
    473c:	8b 46 fc             	mov    -0x4(%bp),%ax
    473f:	48                   	dec    %ax
    4740:	b9 62 00             	mov    $0x62,%cx
    4743:	f7 e9                	imul   %cx
    4745:	40                   	inc    %ax
    4746:	8b d0                	mov    %ax,%dx
    4748:	8b 46 fc             	mov    -0x4(%bp),%ax
    474b:	d1 e0                	shl    %ax
    474d:	8b 7e fe             	mov    -0x2(%bp),%di
    4750:	b1 03                	mov    $0x3,%cl
    4752:	d3 e7                	shl    %cl,%di
    4754:	03 f8                	add    %ax,%di
    4756:	89 95 ae 3f          	mov    %dx,0x3fae(%di)
    475a:	8b 46 fe             	mov    -0x2(%bp),%ax
    475d:	48                   	dec    %ax
    475e:	b9 43 00             	mov    $0x43,%cx
    4761:	f7 e9                	imul   %cx
    4763:	40                   	inc    %ax
    4764:	8b d0                	mov    %ax,%dx
    4766:	8b 46 fc             	mov    -0x4(%bp),%ax
    4769:	d1 e0                	shl    %ax
    476b:	8b 7e fe             	mov    -0x2(%bp),%di
    476e:	b1 03                	mov    $0x3,%cl
    4770:	d3 e7                	shl    %cl,%di
    4772:	03 f8                	add    %ax,%di
    4774:	89 95 d6 3f          	mov    %dx,0x3fd6(%di)
    4778:	83 7e fc 04          	cmpw   $0x4,-0x4(%bp)
    477c:	75 bb                	jne    0x4739
    477e:	83 7e fe 05          	cmpw   $0x5,-0x2(%bp)
    4782:	75 ab                	jne    0x472f
    4784:	89 ec                	mov    %bp,%sp
    4786:	5d                   	pop    %bp
    4787:	cb                   	lret
    4788:	08 4e 69             	or     %cl,0x69(%bp)
    478b:	6e                   	outsb  %ds:(%si),(%dx)
    478c:	65 2e 43             	gs cs inc %bx
    478f:	66 67 08 4e 69       	data32 or %cl,0x69(%esi)
    4794:	6e                   	outsb  %ds:(%si),(%dx)
    4795:	65 2e 63 66 67       	gs arpl %sp,%cs:0x67(%bp)
    479a:	03 00                	add    (%bx,%si),%ax
	...
    47b8:	00 00                	add    %al,(%bx,%si)
    47ba:	0e                   	push   %cs
	...
    47d7:	00 00                	add    %al,(%bx,%si)
    47d9:	00 08                	add    %cl,(%bx,%si)
    47db:	4e                   	dec    %si
    47dc:	69 6e 65 2e 72       	imul   $0x722e,0x65(%bp),%bp
    47e1:	65 73 06             	gs jae 0x47ea
    47e4:	4e                   	dec    %si
    47e5:	6f                   	outsw  %ds:(%si),(%dx)
    47e6:	6e                   	outsb  %ds:(%si),(%dx)
    47e7:	61                   	popa
    47e8:	6d                   	insw   (%dx),%es:(%di)
    47e9:	65 06                	gs push %es
    47eb:	40                   	inc    %ax
    47ec:	40                   	inc    %ax
    47ed:	40                   	inc    %ax
    47ee:	40                   	inc    %ax
    47ef:	40                   	inc    %ax
    47f0:	40                   	inc    %ax
    47f1:	55                   	push   %bp
    47f2:	89 e5                	mov    %sp,%bp
    47f4:	83 ec 0c             	sub    $0xc,%sp
    47f7:	c6 46 f9 00          	movb   $0x0,-0x7(%bp)
    47fb:	bf 88 47             	mov    $0x4788,%di
    47fe:	0e                   	push   %cs
    47ff:	57                   	push   %di
    4800:	b8 20 00             	mov    $0x20,%ax
    4803:	50                   	push   %ax
    4804:	bf 60 36             	mov    $0x3660,%di
    4807:	1e                   	push   %ds
    4808:	57                   	push   %di
    4809:	9a 72 00 bf 1d       	lcall  $0x1dbf,$0x72
    480e:	83 3e e4 64 00       	cmpw   $0x0,0x64e4
    4813:	74 03                	je     0x4818
    4815:	e9 84 00             	jmp    0x489c
    4818:	bf e0 35             	mov    $0x35e0,%di
    481b:	1e                   	push   %ds
    481c:	57                   	push   %di
    481d:	bf 91 47             	mov    $0x4791,%di
    4820:	0e                   	push   %cs
    4821:	57                   	push   %di
    4822:	9a 5e 13 ce 1d       	lcall  $0x1dce,$0x135e
    4827:	bf e0 35             	mov    $0x35e0,%di
    482a:	1e                   	push   %ds
    482b:	57                   	push   %di
    482c:	b8 02 00             	mov    $0x2,%ax
    482f:	50                   	push   %ax
    4830:	9a 8c 13 ce 1d       	lcall  $0x1dce,$0x138c
    4835:	bf e0 35             	mov    $0x35e0,%di
    4838:	1e                   	push   %ds
    4839:	57                   	push   %di
    483a:	bf de 35             	mov    $0x35de,%di
    483d:	1e                   	push   %ds
    483e:	57                   	push   %di
    483f:	9a 41 14 ce 1d       	lcall  $0x1dce,$0x1441
    4844:	83 c4 04             	add    $0x4,%sp
    4847:	9a 07 02 ce 1d       	lcall  $0x1dce,$0x207
    484c:	09 c0                	or     %ax,%ax
    484e:	75 3d                	jne    0x488d
    4850:	a0 de 35             	mov    0x35de,%al
    4853:	50                   	push   %ax
    4854:	bf 9a 47             	mov    $0x479a,%di
    4857:	0e                   	push   %cs
    4858:	57                   	push   %di
    4859:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    485e:	74 2d                	je     0x488d
    4860:	a0 df 35             	mov    0x35df,%al
    4863:	50                   	push   %ax
    4864:	bf ba 47             	mov    $0x47ba,%di
    4867:	0e                   	push   %cs
    4868:	57                   	push   %di
    4869:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    486e:	74 1d                	je     0x488d
    4870:	80 3e de 35 01       	cmpb   $0x1,0x35de
    4875:	75 07                	jne    0x487e
    4877:	c6 06 0c 37 01       	movb   $0x1,0x370c
    487c:	eb 05                	jmp    0x4883
    487e:	c6 06 0c 37 00       	movb   $0x0,0x370c
    4883:	a0 df 35             	mov    0x35df,%al
    4886:	a2 ba 38             	mov    %al,0x38ba
    4889:	c6 46 f9 01          	movb   $0x1,-0x7(%bp)
    488d:	bf e0 35             	mov    $0x35e0,%di
    4890:	1e                   	push   %ds
    4891:	57                   	push   %di
    4892:	9a 0d 14 ce 1d       	lcall  $0x1dce,$0x140d
    4897:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    489c:	80 7e f9 00          	cmpb   $0x0,-0x7(%bp)
    48a0:	75 0a                	jne    0x48ac
    48a2:	c6 06 0c 37 01       	movb   $0x1,0x370c
    48a7:	c6 06 ba 38 01       	movb   $0x1,0x38ba
    48ac:	c6 06 0d 37 00       	movb   $0x0,0x370d
    48b1:	c6 06 0e 37 04       	movb   $0x4,0x370e
    48b6:	c6 46 f8 00          	movb   $0x0,-0x8(%bp)
    48ba:	bf da 47             	mov    $0x47da,%di
    48bd:	0e                   	push   %cs
    48be:	57                   	push   %di
    48bf:	b8 20 00             	mov    $0x20,%ax
    48c2:	50                   	push   %ax
    48c3:	bf 60 36             	mov    $0x3660,%di
    48c6:	1e                   	push   %ds
    48c7:	57                   	push   %di
    48c8:	9a 72 00 bf 1d       	lcall  $0x1dbf,$0x72
    48cd:	83 3e e4 64 00       	cmpw   $0x0,0x64e4
    48d2:	74 03                	je     0x48d7
    48d4:	e9 89 02             	jmp    0x4b60
    48d7:	bf 5e 35             	mov    $0x355e,%di
    48da:	1e                   	push   %ds
    48db:	57                   	push   %di
    48dc:	bf da 47             	mov    $0x47da,%di
    48df:	0e                   	push   %cs
    48e0:	57                   	push   %di
    48e1:	9a 5e 13 ce 1d       	lcall  $0x1dce,$0x135e
    48e6:	bf 5e 35             	mov    $0x355e,%di
    48e9:	1e                   	push   %ds
    48ea:	57                   	push   %di
    48eb:	b8 3c 00             	mov    $0x3c,%ax
    48ee:	50                   	push   %ax
    48ef:	9a 8c 13 ce 1d       	lcall  $0x1dce,$0x138c
    48f4:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    48f9:	bf 5e 35             	mov    $0x355e,%di
    48fc:	1e                   	push   %ds
    48fd:	57                   	push   %di
    48fe:	9a 41 15 ce 1d       	lcall  $0x1dce,$0x1541
    4903:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    4908:	08 c0                	or     %al,%al
    490a:	74 03                	je     0x490f
    490c:	e9 6a 01             	jmp    0x4a79
    490f:	80 7e f8 0a          	cmpb   $0xa,-0x8(%bp)
    4913:	72 03                	jb     0x4918
    4915:	e9 61 01             	jmp    0x4a79
    4918:	bf 5e 35             	mov    $0x355e,%di
    491b:	1e                   	push   %ds
    491c:	57                   	push   %di
    491d:	8a 46 f8             	mov    -0x8(%bp),%al
    4920:	30 e4                	xor    %ah,%ah
    4922:	40                   	inc    %ax
    4923:	ba 3c 00             	mov    $0x3c,%dx
    4926:	f7 e2                	mul    %dx
    4928:	8b f8                	mov    %ax,%di
    492a:	81 c7 ca 32          	add    $0x32ca,%di
    492e:	1e                   	push   %ds
    492f:	57                   	push   %di
    4930:	9a 41 14 ce 1d       	lcall  $0x1dce,$0x1441
    4935:	83 c4 04             	add    $0x4,%sp
    4938:	9a 07 02 ce 1d       	lcall  $0x1dce,$0x207
    493d:	09 c0                	or     %ax,%ax
    493f:	74 03                	je     0x4944
    4941:	e9 32 01             	jmp    0x4a76
    4944:	fe 46 f8             	incb   -0x8(%bp)
    4947:	8a 46 f8             	mov    -0x8(%bp),%al
    494a:	30 e4                	xor    %ah,%ah
    494c:	ba 3c 00             	mov    $0x3c,%dx
    494f:	f7 e2                	mul    %dx
    4951:	8b f8                	mov    %ax,%di
    4953:	81 c7 ca 32          	add    $0x32ca,%di
    4957:	89 7e f4             	mov    %di,-0xc(%bp)
    495a:	8c 5e f6             	mov    %ds,-0xa(%bp)
    495d:	c4 7e f4             	les    -0xc(%bp),%di
    4960:	06                   	push   %es
    4961:	57                   	push   %di
    4962:	8a 46 f8             	mov    -0x8(%bp),%al
    4965:	30 e4                	xor    %ah,%ah
    4967:	ba 14 00             	mov    $0x14,%dx
    496a:	f7 e2                	mul    %dx
    496c:	8b f8                	mov    %ax,%di
    496e:	81 c7 9a 30          	add    $0x309a,%di
    4972:	1e                   	push   %ds
    4973:	57                   	push   %di
    4974:	b8 08 00             	mov    $0x8,%ax
    4977:	50                   	push   %ax
    4978:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    497d:	c4 7e f4             	les    -0xc(%bp),%di
    4980:	26 8b 4d 09          	mov    %es:0x9(%di),%cx
    4984:	8a 46 f8             	mov    -0x8(%bp),%al
    4987:	30 e4                	xor    %ah,%ah
    4989:	ba 14 00             	mov    $0x14,%dx
    498c:	f7 e2                	mul    %dx
    498e:	8b f8                	mov    %ax,%di
    4990:	89 8d a3 30          	mov    %cx,0x30a3(%di)
    4994:	c4 7e f4             	les    -0xc(%bp),%di
    4997:	81 c7 0b 00          	add    $0xb,%di
    499b:	06                   	push   %es
    499c:	57                   	push   %di
    499d:	8a 46 f8             	mov    -0x8(%bp),%al
    49a0:	30 e4                	xor    %ah,%ah
    49a2:	ba 14 00             	mov    $0x14,%dx
    49a5:	f7 e2                	mul    %dx
    49a7:	8b f8                	mov    %ax,%di
    49a9:	81 c7 a5 30          	add    $0x30a5,%di
    49ad:	1e                   	push   %ds
    49ae:	57                   	push   %di
    49af:	b8 08 00             	mov    $0x8,%ax
    49b2:	50                   	push   %ax
    49b3:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    49b8:	c4 7e f4             	les    -0xc(%bp),%di
    49bb:	81 c7 14 00          	add    $0x14,%di
    49bf:	06                   	push   %es
    49c0:	57                   	push   %di
    49c1:	8a 46 f8             	mov    -0x8(%bp),%al
    49c4:	30 e4                	xor    %ah,%ah
    49c6:	ba 14 00             	mov    $0x14,%dx
    49c9:	f7 e2                	mul    %dx
    49cb:	8b f8                	mov    %ax,%di
    49cd:	81 c7 62 31          	add    $0x3162,%di
    49d1:	1e                   	push   %ds
    49d2:	57                   	push   %di
    49d3:	b8 08 00             	mov    $0x8,%ax
    49d6:	50                   	push   %ax
    49d7:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    49dc:	c4 7e f4             	les    -0xc(%bp),%di
    49df:	26 8b 4d 1d          	mov    %es:0x1d(%di),%cx
    49e3:	8a 46 f8             	mov    -0x8(%bp),%al
    49e6:	30 e4                	xor    %ah,%ah
    49e8:	ba 14 00             	mov    $0x14,%dx
    49eb:	f7 e2                	mul    %dx
    49ed:	8b f8                	mov    %ax,%di
    49ef:	89 8d 6b 31          	mov    %cx,0x316b(%di)
    49f3:	c4 7e f4             	les    -0xc(%bp),%di
    49f6:	81 c7 1f 00          	add    $0x1f,%di
    49fa:	06                   	push   %es
    49fb:	57                   	push   %di
    49fc:	8a 46 f8             	mov    -0x8(%bp),%al
    49ff:	30 e4                	xor    %ah,%ah
    4a01:	ba 14 00             	mov    $0x14,%dx
    4a04:	f7 e2                	mul    %dx
    4a06:	8b f8                	mov    %ax,%di
    4a08:	81 c7 6d 31          	add    $0x316d,%di
    4a0c:	1e                   	push   %ds
    4a0d:	57                   	push   %di
    4a0e:	b8 08 00             	mov    $0x8,%ax
    4a11:	50                   	push   %ax
    4a12:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4a17:	c4 7e f4             	les    -0xc(%bp),%di
    4a1a:	81 c7 28 00          	add    $0x28,%di
    4a1e:	06                   	push   %es
    4a1f:	57                   	push   %di
    4a20:	8a 46 f8             	mov    -0x8(%bp),%al
    4a23:	30 e4                	xor    %ah,%ah
    4a25:	ba 14 00             	mov    $0x14,%dx
    4a28:	f7 e2                	mul    %dx
    4a2a:	8b f8                	mov    %ax,%di
    4a2c:	81 c7 2a 32          	add    $0x322a,%di
    4a30:	1e                   	push   %ds
    4a31:	57                   	push   %di
    4a32:	b8 08 00             	mov    $0x8,%ax
    4a35:	50                   	push   %ax
    4a36:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4a3b:	c4 7e f4             	les    -0xc(%bp),%di
    4a3e:	26 8b 4d 31          	mov    %es:0x31(%di),%cx
    4a42:	8a 46 f8             	mov    -0x8(%bp),%al
    4a45:	30 e4                	xor    %ah,%ah
    4a47:	ba 14 00             	mov    $0x14,%dx
    4a4a:	f7 e2                	mul    %dx
    4a4c:	8b f8                	mov    %ax,%di
    4a4e:	89 8d 33 32          	mov    %cx,0x3233(%di)
    4a52:	c4 7e f4             	les    -0xc(%bp),%di
    4a55:	81 c7 33 00          	add    $0x33,%di
    4a59:	06                   	push   %es
    4a5a:	57                   	push   %di
    4a5b:	8a 46 f8             	mov    -0x8(%bp),%al
    4a5e:	30 e4                	xor    %ah,%ah
    4a60:	ba 14 00             	mov    $0x14,%dx
    4a63:	f7 e2                	mul    %dx
    4a65:	8b f8                	mov    %ax,%di
    4a67:	81 c7 35 32          	add    $0x3235,%di
    4a6b:	1e                   	push   %ds
    4a6c:	57                   	push   %di
    4a6d:	b8 08 00             	mov    $0x8,%ax
    4a70:	50                   	push   %ax
    4a71:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4a76:	e9 80 fe             	jmp    0x48f9
    4a79:	bf 5e 35             	mov    $0x355e,%di
    4a7c:	1e                   	push   %ds
    4a7d:	57                   	push   %di
    4a7e:	9a 0d 14 ce 1d       	lcall  $0x1dce,$0x140d
    4a83:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    4a88:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    4a8d:	eb 03                	jmp    0x4a92
    4a8f:	ff 46 fa             	incw   -0x6(%bp)
    4a92:	8a 46 f8             	mov    -0x8(%bp),%al
    4a95:	30 e4                	xor    %ah,%ah
    4a97:	89 46 f6             	mov    %ax,-0xa(%bp)
    4a9a:	b8 01 00             	mov    $0x1,%ax
    4a9d:	3b 46 f6             	cmp    -0xa(%bp),%ax
    4aa0:	7e 03                	jle    0x4aa5
    4aa2:	e9 b2 00             	jmp    0x4b57
    4aa5:	89 46 fe             	mov    %ax,-0x2(%bp)
    4aa8:	eb 03                	jmp    0x4aad
    4aaa:	ff 46 fe             	incw   -0x2(%bp)
    4aad:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    4ab2:	eb 03                	jmp    0x4ab7
    4ab4:	ff 46 fc             	incw   -0x4(%bp)
    4ab7:	8b 46 fc             	mov    -0x4(%bp),%ax
    4aba:	8b d8                	mov    %ax,%bx
    4abc:	8b 46 fe             	mov    -0x2(%bp),%ax
    4abf:	ba 14 00             	mov    $0x14,%dx
    4ac2:	f7 e2                	mul    %dx
    4ac4:	8b c8                	mov    %ax,%cx
    4ac6:	8b 46 fa             	mov    -0x6(%bp),%ax
    4ac9:	ba c8 00             	mov    $0xc8,%dx
    4acc:	f7 e2                	mul    %dx
    4ace:	8b f8                	mov    %ax,%di
    4ad0:	03 f9                	add    %cx,%di
    4ad2:	03 fb                	add    %bx,%di
    4ad4:	8a 85 d2 2f          	mov    0x2fd2(%di),%al
    4ad8:	34 ff                	xor    $0xff,%al
    4ada:	50                   	push   %ax
    4adb:	8b 46 fc             	mov    -0x4(%bp),%ax
    4ade:	8b d8                	mov    %ax,%bx
    4ae0:	8b 46 fe             	mov    -0x2(%bp),%ax
    4ae3:	ba 14 00             	mov    $0x14,%dx
    4ae6:	f7 e2                	mul    %dx
    4ae8:	8b c8                	mov    %ax,%cx
    4aea:	8b 46 fa             	mov    -0x6(%bp),%ax
    4aed:	ba c8 00             	mov    $0xc8,%dx
    4af0:	f7 e2                	mul    %dx
    4af2:	8b f8                	mov    %ax,%di
    4af4:	03 f9                	add    %cx,%di
    4af6:	03 fb                	add    %bx,%di
    4af8:	58                   	pop    %ax
    4af9:	88 85 d2 2f          	mov    %al,0x2fd2(%di)
    4afd:	8b 46 fc             	mov    -0x4(%bp),%ax
    4b00:	8b d8                	mov    %ax,%bx
    4b02:	8b 46 fe             	mov    -0x2(%bp),%ax
    4b05:	ba 14 00             	mov    $0x14,%dx
    4b08:	f7 e2                	mul    %dx
    4b0a:	8b c8                	mov    %ax,%cx
    4b0c:	8b 46 fa             	mov    -0x6(%bp),%ax
    4b0f:	ba c8 00             	mov    $0xc8,%dx
    4b12:	f7 e2                	mul    %dx
    4b14:	8b f8                	mov    %ax,%di
    4b16:	03 f9                	add    %cx,%di
    4b18:	03 fb                	add    %bx,%di
    4b1a:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    4b1e:	34 ff                	xor    $0xff,%al
    4b20:	50                   	push   %ax
    4b21:	8b 46 fc             	mov    -0x4(%bp),%ax
    4b24:	8b d8                	mov    %ax,%bx
    4b26:	8b 46 fe             	mov    -0x2(%bp),%ax
    4b29:	ba 14 00             	mov    $0x14,%dx
    4b2c:	f7 e2                	mul    %dx
    4b2e:	8b c8                	mov    %ax,%cx
    4b30:	8b 46 fa             	mov    -0x6(%bp),%ax
    4b33:	ba c8 00             	mov    $0xc8,%dx
    4b36:	f7 e2                	mul    %dx
    4b38:	8b f8                	mov    %ax,%di
    4b3a:	03 f9                	add    %cx,%di
    4b3c:	03 fb                	add    %bx,%di
    4b3e:	58                   	pop    %ax
    4b3f:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    4b43:	83 7e fc 08          	cmpw   $0x8,-0x4(%bp)
    4b47:	74 03                	je     0x4b4c
    4b49:	e9 68 ff             	jmp    0x4ab4
    4b4c:	8b 46 fe             	mov    -0x2(%bp),%ax
    4b4f:	3b 46 f6             	cmp    -0xa(%bp),%ax
    4b52:	74 03                	je     0x4b57
    4b54:	e9 53 ff             	jmp    0x4aaa
    4b57:	83 7e fa 03          	cmpw   $0x3,-0x6(%bp)
    4b5b:	74 03                	je     0x4b60
    4b5d:	e9 2f ff             	jmp    0x4a8f
    4b60:	8a 46 f8             	mov    -0x8(%bp),%al
    4b63:	30 e4                	xor    %ah,%ah
    4b65:	40                   	inc    %ax
    4b66:	3d 0a 00             	cmp    $0xa,%ax
    4b69:	7e 03                	jle    0x4b6e
    4b6b:	e9 91 00             	jmp    0x4bff
    4b6e:	89 46 fe             	mov    %ax,-0x2(%bp)
    4b71:	eb 03                	jmp    0x4b76
    4b73:	ff 46 fe             	incw   -0x2(%bp)
    4b76:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    4b7b:	eb 03                	jmp    0x4b80
    4b7d:	ff 46 fc             	incw   -0x4(%bp)
    4b80:	bf e3 47             	mov    $0x47e3,%di
    4b83:	0e                   	push   %cs
    4b84:	57                   	push   %di
    4b85:	8b 46 fe             	mov    -0x2(%bp),%ax
    4b88:	ba 14 00             	mov    $0x14,%dx
    4b8b:	f7 e2                	mul    %dx
    4b8d:	8b c8                	mov    %ax,%cx
    4b8f:	8b 46 fc             	mov    -0x4(%bp),%ax
    4b92:	ba c8 00             	mov    $0xc8,%dx
    4b95:	f7 e2                	mul    %dx
    4b97:	8b f8                	mov    %ax,%di
    4b99:	03 f9                	add    %cx,%di
    4b9b:	81 c7 d2 2f          	add    $0x2fd2,%di
    4b9f:	1e                   	push   %ds
    4ba0:	57                   	push   %di
    4ba1:	b8 08 00             	mov    $0x8,%ax
    4ba4:	50                   	push   %ax
    4ba5:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4baa:	8b 46 fe             	mov    -0x2(%bp),%ax
    4bad:	ba 14 00             	mov    $0x14,%dx
    4bb0:	f7 e2                	mul    %dx
    4bb2:	8b c8                	mov    %ax,%cx
    4bb4:	8b 46 fc             	mov    -0x4(%bp),%ax
    4bb7:	ba c8 00             	mov    $0xc8,%dx
    4bba:	f7 e2                	mul    %dx
    4bbc:	8b f8                	mov    %ax,%di
    4bbe:	03 f9                	add    %cx,%di
    4bc0:	31 c0                	xor    %ax,%ax
    4bc2:	89 85 db 2f          	mov    %ax,0x2fdb(%di)
    4bc6:	bf ea 47             	mov    $0x47ea,%di
    4bc9:	0e                   	push   %cs
    4bca:	57                   	push   %di
    4bcb:	8b 46 fe             	mov    -0x2(%bp),%ax
    4bce:	ba 14 00             	mov    $0x14,%dx
    4bd1:	f7 e2                	mul    %dx
    4bd3:	8b c8                	mov    %ax,%cx
    4bd5:	8b 46 fc             	mov    -0x4(%bp),%ax
    4bd8:	ba c8 00             	mov    $0xc8,%dx
    4bdb:	f7 e2                	mul    %dx
    4bdd:	8b f8                	mov    %ax,%di
    4bdf:	03 f9                	add    %cx,%di
    4be1:	81 c7 dd 2f          	add    $0x2fdd,%di
    4be5:	1e                   	push   %ds
    4be6:	57                   	push   %di
    4be7:	b8 08 00             	mov    $0x8,%ax
    4bea:	50                   	push   %ax
    4beb:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    4bf0:	83 7e fc 03          	cmpw   $0x3,-0x4(%bp)
    4bf4:	75 87                	jne    0x4b7d
    4bf6:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    4bfa:	74 03                	je     0x4bff
    4bfc:	e9 74 ff             	jmp    0x4b73
    4bff:	c7 06 ec 36 5a 01    	movw   $0x15a,0x36ec
    4c05:	c7 06 f2 36 01 00    	movw   $0x1,0x36f2
    4c0b:	c7 06 f8 36 b2 01    	movw   $0x1b2,0x36f8
    4c11:	c7 06 fe 36 01 00    	movw   $0x1,0x36fe
    4c17:	c7 06 ee 36 ed 01    	movw   $0x1ed,0x36ee
    4c1d:	c7 06 f4 36 01 00    	movw   $0x1,0x36f4
    4c23:	c7 06 fa 36 45 02    	movw   $0x245,0x36fa
    4c29:	c7 06 00 37 01 00    	movw   $0x1,0x3700
    4c2f:	c7 06 f0 36 ed 01    	movw   $0x1ed,0x36f0
    4c35:	c7 06 f6 36 69 00    	movw   $0x69,0x36f6
    4c3b:	c7 06 fc 36 45 02    	movw   $0x245,0x36fc
    4c41:	c7 06 02 37 69 00    	movw   $0x69,0x3702
    4c47:	c7 06 e4 36 c0 00    	movw   $0xc0,0x36e4
    4c4d:	c7 06 e6 36 72 00    	movw   $0x72,0x36e6
    4c53:	c7 06 e8 36 65 01    	movw   $0x165,0x36e8
    4c59:	c7 06 ea 36 72 00    	movw   $0x72,0x36ea
    4c5f:	c7 06 04 37 57 00    	movw   $0x57,0x3704
    4c65:	c7 06 06 37 67 00    	movw   $0x67,0x3706
    4c6b:	c7 06 08 37 3a 00    	movw   $0x3a,0x3708
    4c71:	c7 06 0a 37 67 00    	movw   $0x67,0x370a
    4c77:	c6 06 28 3d 0a       	movb   $0xa,0x3d28
    4c7c:	c6 06 29 3d 09       	movb   $0x9,0x3d29
    4c81:	c6 06 2a 3d 01       	movb   $0x1,0x3d2a
    4c86:	c6 06 2b 3d 01       	movb   $0x1,0x3d2b
    4c8b:	c7 06 1a 3d e9 01    	movw   $0x1e9,0x3d1a
    4c91:	c7 06 1c 3d d1 00    	movw   $0xd1,0x3d1c
    4c97:	c7 06 1e 3d 58 00    	movw   $0x58,0x3d1e
    4c9d:	c7 06 20 3d 09 00    	movw   $0x9,0x3d20
    4ca3:	c7 06 16 3d 5d 01    	movw   $0x15d,0x3d16
    4ca9:	c7 06 18 3d e5 00    	movw   $0xe5,0x3d18
    4caf:	a0 2a 3d             	mov    0x3d2a,%al
    4cb2:	30 e4                	xor    %ah,%ah
    4cb4:	8b d0                	mov    %ax,%dx
    4cb6:	a0 28 3d             	mov    0x3d28,%al
    4cb9:	30 e4                	xor    %ah,%ah
    4cbb:	03 c2                	add    %dx,%ax
    4cbd:	8b c8                	mov    %ax,%cx
    4cbf:	a1 1e 3d             	mov    0x3d1e,%ax
    4cc2:	31 d2                	xor    %dx,%dx
    4cc4:	f7 f1                	div    %cx
    4cc6:	a2 98 3e             	mov    %al,0x3e98
    4cc9:	c6 06 8e 36 00       	movb   $0x0,0x368e
    4cce:	c6 06 9c 3f 01       	movb   $0x1,0x3f9c
    4cd3:	c6 06 98 36 00       	movb   $0x0,0x3698
    4cd8:	c7 46 fe 20 00       	movw   $0x20,-0x2(%bp)
    4cdd:	eb 03                	jmp    0x4ce2
    4cdf:	ff 46 fe             	incw   -0x2(%bp)
    4ce2:	8b 7e fe             	mov    -0x2(%bp),%di
    4ce5:	d1 e7                	shl    %di
    4ce7:	c7 85 ec 3c 4c 01    	movw   $0x14c,0x3cec(%di)
    4ced:	8b 46 fe             	mov    -0x2(%bp),%ax
    4cf0:	2d 20 00             	sub    $0x20,%ax
    4cf3:	b9 0a 00             	mov    $0xa,%cx
    4cf6:	f7 e9                	imul   %cx
    4cf8:	05 69 00             	add    $0x69,%ax
    4cfb:	8b 7e fe             	mov    -0x2(%bp),%di
    4cfe:	d1 e7                	shl    %di
    4d00:	89 85 a2 3d          	mov    %ax,0x3da2(%di)
    4d04:	83 7e fe 30          	cmpw   $0x30,-0x2(%bp)
    4d08:	75 d5                	jne    0x4cdf
    4d0a:	c7 46 fe 31 00       	movw   $0x31,-0x2(%bp)
    4d0f:	eb 03                	jmp    0x4d14
    4d11:	ff 46 fe             	incw   -0x2(%bp)
    4d14:	8b 7e fe             	mov    -0x2(%bp),%di
    4d17:	d1 e7                	shl    %di
    4d19:	c7 85 ec 3c 57 01    	movw   $0x157,0x3cec(%di)
    4d1f:	8b 46 fe             	mov    -0x2(%bp),%ax
    4d22:	2d 31 00             	sub    $0x31,%ax
    4d25:	b9 0a 00             	mov    $0xa,%cx
    4d28:	f7 e9                	imul   %cx
    4d2a:	05 69 00             	add    $0x69,%ax
    4d2d:	8b 7e fe             	mov    -0x2(%bp),%di
    4d30:	d1 e7                	shl    %di
    4d32:	89 85 a2 3d          	mov    %ax,0x3da2(%di)
    4d36:	83 7e fe 41          	cmpw   $0x41,-0x2(%bp)
    4d3a:	75 d5                	jne    0x4d11
    4d3c:	c7 46 fe 42 00       	movw   $0x42,-0x2(%bp)
    4d41:	eb 03                	jmp    0x4d46
    4d43:	ff 46 fe             	incw   -0x2(%bp)
    4d46:	8b 7e fe             	mov    -0x2(%bp),%di
    4d49:	d1 e7                	shl    %di
    4d4b:	c7 85 ec 3c 62 01    	movw   $0x162,0x3cec(%di)
    4d51:	8b 46 fe             	mov    -0x2(%bp),%ax
    4d54:	2d 42 00             	sub    $0x42,%ax
    4d57:	b9 0a 00             	mov    $0xa,%cx
    4d5a:	f7 e9                	imul   %cx
    4d5c:	05 69 00             	add    $0x69,%ax
    4d5f:	8b 7e fe             	mov    -0x2(%bp),%di
    4d62:	d1 e7                	shl    %di
    4d64:	89 85 a2 3d          	mov    %ax,0x3da2(%di)
    4d68:	83 7e fe 52          	cmpw   $0x52,-0x2(%bp)
    4d6c:	75 d5                	jne    0x4d43
    4d6e:	c7 46 fe 53 00       	movw   $0x53,-0x2(%bp)
    4d73:	eb 03                	jmp    0x4d78
    4d75:	ff 46 fe             	incw   -0x2(%bp)
    4d78:	8b 7e fe             	mov    -0x2(%bp),%di
    4d7b:	d1 e7                	shl    %di
    4d7d:	c7 85 ec 3c 6d 01    	movw   $0x16d,0x3cec(%di)
    4d83:	8b 46 fe             	mov    -0x2(%bp),%ax
    4d86:	2d 53 00             	sub    $0x53,%ax
    4d89:	b9 0a 00             	mov    $0xa,%cx
    4d8c:	f7 e9                	imul   %cx
    4d8e:	05 69 00             	add    $0x69,%ax
    4d91:	8b 7e fe             	mov    -0x2(%bp),%di
    4d94:	d1 e7                	shl    %di
    4d96:	89 85 a2 3d          	mov    %ax,0x3da2(%di)
    4d9a:	83 7e fe 63          	cmpw   $0x63,-0x2(%bp)
    4d9e:	75 d5                	jne    0x4d75
    4da0:	c7 46 fe 64 00       	movw   $0x64,-0x2(%bp)
    4da5:	eb 03                	jmp    0x4daa
    4da7:	ff 46 fe             	incw   -0x2(%bp)
    4daa:	8b 7e fe             	mov    -0x2(%bp),%di
    4dad:	d1 e7                	shl    %di
    4daf:	c7 85 ec 3c 78 01    	movw   $0x178,0x3cec(%di)
    4db5:	8b 46 fe             	mov    -0x2(%bp),%ax
    4db8:	2d 64 00             	sub    $0x64,%ax
    4dbb:	b9 0a 00             	mov    $0xa,%cx
    4dbe:	f7 e9                	imul   %cx
    4dc0:	05 69 00             	add    $0x69,%ax
    4dc3:	8b 7e fe             	mov    -0x2(%bp),%di
    4dc6:	d1 e7                	shl    %di
    4dc8:	89 85 a2 3d          	mov    %ax,0x3da2(%di)
    4dcc:	83 7e fe 74          	cmpw   $0x74,-0x2(%bp)
    4dd0:	75 d5                	jne    0x4da7
    4dd2:	c7 46 fe 75 00       	movw   $0x75,-0x2(%bp)
    4dd7:	eb 03                	jmp    0x4ddc
    4dd9:	ff 46 fe             	incw   -0x2(%bp)
    4ddc:	8b 7e fe             	mov    -0x2(%bp),%di
    4ddf:	d1 e7                	shl    %di
    4de1:	c7 85 ec 3c 83 01    	movw   $0x183,0x3cec(%di)
    4de7:	8b 46 fe             	mov    -0x2(%bp),%ax
    4dea:	2d 75 00             	sub    $0x75,%ax
    4ded:	b9 0a 00             	mov    $0xa,%cx
    4df0:	f7 e9                	imul   %cx
    4df2:	05 69 00             	add    $0x69,%ax
    4df5:	8b 7e fe             	mov    -0x2(%bp),%di
    4df8:	d1 e7                	shl    %di
    4dfa:	89 85 a2 3d          	mov    %ax,0x3da2(%di)
    4dfe:	83 7e fe 7a          	cmpw   $0x7a,-0x2(%bp)
    4e02:	75 d5                	jne    0x4dd9
    4e04:	c7 06 b8 36 0a 00    	movw   $0xa,0x36b8
    4e0a:	c7 06 ba 36 09 00    	movw   $0x9,0x36ba
    4e10:	31 c0                	xor    %ax,%ax
    4e12:	89 46 fe             	mov    %ax,-0x2(%bp)
    4e15:	eb 03                	jmp    0x4e1a
    4e17:	ff 46 fe             	incw   -0x2(%bp)
    4e1a:	8b 7e fe             	mov    -0x2(%bp),%di
    4e1d:	d1 e7                	shl    %di
    4e1f:	c7 85 bc 36 83 01    	movw   $0x183,0x36bc(%di)
    4e25:	8b 46 fe             	mov    -0x2(%bp),%ax
    4e28:	b9 0a 00             	mov    $0xa,%cx
    4e2b:	f7 e9                	imul   %cx
    4e2d:	05 a5 00             	add    $0xa5,%ax
    4e30:	8b 7e fe             	mov    -0x2(%bp),%di
    4e33:	d1 e7                	shl    %di
    4e35:	89 85 d0 36          	mov    %ax,0x36d0(%di)
    4e39:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    4e3d:	75 d8                	jne    0x4e17
    4e3f:	c7 06 10 37 4d 00    	movw   $0x4d,0x3710
    4e45:	c7 06 12 37 d3 00    	movw   $0xd3,0x3712
    4e4b:	c7 06 14 37 59 01    	movw   $0x159,0x3714
    4e51:	c7 06 16 37 e4 01    	movw   $0x1e4,0x3716
    4e57:	c7 06 18 37 5f 02    	movw   $0x25f,0x3718
    4e5d:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    4e62:	eb 03                	jmp    0x4e67
    4e64:	ff 46 fe             	incw   -0x2(%bp)
    4e67:	8b 7e fe             	mov    -0x2(%bp),%di
    4e6a:	d1 e7                	shl    %di
    4e6c:	c7 85 18 37 3d 01    	movw   $0x13d,0x3718(%di)
    4e72:	83 7e fe 05          	cmpw   $0x5,-0x2(%bp)
    4e76:	75 ec                	jne    0x4e64
    4e78:	31 c0                	xor    %ax,%ax
    4e7a:	a3 24 37             	mov    %ax,0x3724
    4e7d:	c7 06 2e 37 2b 01    	movw   $0x12b,0x372e
    4e83:	c7 06 38 37 45 00    	movw   $0x45,0x3738
    4e89:	c7 06 42 37 54 01    	movw   $0x154,0x3742
    4e8f:	c7 06 26 37 91 00    	movw   $0x91,0x3726
    4e95:	c7 06 30 37 27 01    	movw   $0x127,0x3730
    4e9b:	c7 06 3a 37 cd 00    	movw   $0xcd,0x373a
    4ea1:	c7 06 44 37 54 01    	movw   $0x154,0x3744
    4ea7:	c7 06 28 37 1b 01    	movw   $0x11b,0x3728
    4ead:	c7 06 32 37 2e 01    	movw   $0x12e,0x3732
    4eb3:	c7 06 3c 37 51 01    	movw   $0x151,0x373c
    4eb9:	c7 06 46 37 54 01    	movw   $0x154,0x3746
    4ebf:	c7 06 2a 37 9a 01    	movw   $0x19a,0x372a
    4ec5:	c7 06 34 37 33 01    	movw   $0x133,0x3734
    4ecb:	c7 06 3e 37 d9 01    	movw   $0x1d9,0x373e
    4ed1:	c7 06 48 37 54 01    	movw   $0x154,0x3748
    4ed7:	c7 06 2c 37 23 02    	movw   $0x223,0x372c
    4edd:	c7 06 36 37 2e 01    	movw   $0x12e,0x3736
    4ee3:	c7 06 40 37 56 02    	movw   $0x256,0x3740
    4ee9:	c7 06 4a 37 54 01    	movw   $0x154,0x374a
    4eef:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    4ef4:	eb 03                	jmp    0x4ef9
    4ef6:	ff 46 fe             	incw   -0x2(%bp)
    4ef9:	8b 7e fe             	mov    -0x2(%bp),%di
    4efc:	d1 e7                	shl    %di
    4efe:	c7 85 4a 37 c0 00    	movw   $0xc0,0x374a(%di)
    4f04:	a0 2b 3d             	mov    0x3d2b,%al
    4f07:	30 e4                	xor    %ah,%ah
    4f09:	8b d0                	mov    %ax,%dx
    4f0b:	a0 29 3d             	mov    0x3d29,%al
    4f0e:	30 e4                	xor    %ah,%ah
    4f10:	03 c2                	add    %dx,%ax
    4f12:	8b d0                	mov    %ax,%dx
    4f14:	8b 46 fe             	mov    -0x2(%bp),%ax
    4f17:	48                   	dec    %ax
    4f18:	f7 ea                	imul   %dx
    4f1a:	05 72 00             	add    $0x72,%ax
    4f1d:	8b 7e fe             	mov    -0x2(%bp),%di
    4f20:	d1 e7                	shl    %di
    4f22:	89 85 5e 37          	mov    %ax,0x375e(%di)
    4f26:	8b 7e fe             	mov    -0x2(%bp),%di
    4f29:	d1 e7                	shl    %di
    4f2b:	c7 85 72 37 16 01    	movw   $0x116,0x3772(%di)
    4f31:	a0 2b 3d             	mov    0x3d2b,%al
    4f34:	30 e4                	xor    %ah,%ah
    4f36:	8b d0                	mov    %ax,%dx
    4f38:	a0 29 3d             	mov    0x3d29,%al
    4f3b:	30 e4                	xor    %ah,%ah
    4f3d:	03 c2                	add    %dx,%ax
    4f3f:	8b d0                	mov    %ax,%dx
    4f41:	8b 46 fe             	mov    -0x2(%bp),%ax
    4f44:	48                   	dec    %ax
    4f45:	f7 ea                	imul   %dx
    4f47:	05 7a 00             	add    $0x7a,%ax
    4f4a:	8b 7e fe             	mov    -0x2(%bp),%di
    4f4d:	d1 e7                	shl    %di
    4f4f:	89 85 86 37          	mov    %ax,0x3786(%di)
    4f53:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    4f57:	75 9d                	jne    0x4ef6
    4f59:	c7 06 5e 37 c0 00    	movw   $0xc0,0x375e
    4f5f:	a0 2b 3d             	mov    0x3d2b,%al
    4f62:	30 e4                	xor    %ah,%ah
    4f64:	8b d0                	mov    %ax,%dx
    4f66:	a0 29 3d             	mov    0x3d29,%al
    4f69:	30 e4                	xor    %ah,%ah
    4f6b:	03 c2                	add    %dx,%ax
    4f6d:	b9 09 00             	mov    $0x9,%cx
    4f70:	f7 e9                	imul   %cx
    4f72:	05 72 00             	add    $0x72,%ax
    4f75:	05 04 00             	add    $0x4,%ax
    4f78:	a3 72 37             	mov    %ax,0x3772
    4f7b:	c7 06 86 37 16 01    	movw   $0x116,0x3786
    4f81:	a0 2b 3d             	mov    0x3d2b,%al
    4f84:	30 e4                	xor    %ah,%ah
    4f86:	8b d0                	mov    %ax,%dx
    4f88:	a0 29 3d             	mov    0x3d29,%al
    4f8b:	30 e4                	xor    %ah,%ah
    4f8d:	03 c2                	add    %dx,%ax
    4f8f:	b9 09 00             	mov    $0x9,%cx
    4f92:	f7 e9                	imul   %cx
    4f94:	05 7a 00             	add    $0x7a,%ax
    4f97:	05 04 00             	add    $0x4,%ax
    4f9a:	a3 9a 37             	mov    %ax,0x379a
    4f9d:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    4fa2:	eb 03                	jmp    0x4fa7
    4fa4:	ff 46 fe             	incw   -0x2(%bp)
    4fa7:	8b 7e fe             	mov    -0x2(%bp),%di
    4faa:	d1 e7                	shl    %di
    4fac:	c7 85 9a 37 8e 01    	movw   $0x18e,0x379a(%di)
    4fb2:	8b 46 fe             	mov    -0x2(%bp),%ax
    4fb5:	48                   	dec    %ax
    4fb6:	b9 2b 00             	mov    $0x2b,%cx
    4fb9:	f7 e9                	imul   %cx
    4fbb:	05 08 01             	add    $0x108,%ax
    4fbe:	8b 7e fe             	mov    -0x2(%bp),%di
    4fc1:	d1 e7                	shl    %di
    4fc3:	89 85 9e 37          	mov    %ax,0x379e(%di)
    4fc7:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    4fcb:	75 d7                	jne    0x4fa4
    4fcd:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    4fd2:	eb 03                	jmp    0x4fd7
    4fd4:	ff 46 fe             	incw   -0x2(%bp)
    4fd7:	8b 7e fe             	mov    -0x2(%bp),%di
    4fda:	d1 e7                	shl    %di
    4fdc:	c7 85 a2 37 42 02    	movw   $0x242,0x37a2(%di)
    4fe2:	8b 46 fe             	mov    -0x2(%bp),%ax
    4fe5:	48                   	dec    %ax
    4fe6:	b9 2f 00             	mov    $0x2f,%cx
    4fe9:	f7 e9                	imul   %cx
    4feb:	05 d1 00             	add    $0xd1,%ax
    4fee:	8b 7e fe             	mov    -0x2(%bp),%di
    4ff1:	d1 e7                	shl    %di
    4ff3:	89 85 a8 37          	mov    %ax,0x37a8(%di)
    4ff7:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    4ffb:	75 d7                	jne    0x4fd4
    4ffd:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    5002:	eb 03                	jmp    0x5007
    5004:	ff 46 fe             	incw   -0x2(%bp)
    5007:	8b 7e fe             	mov    -0x2(%bp),%di
    500a:	d1 e7                	shl    %di
    500c:	c7 85 ae 37 d5 01    	movw   $0x1d5,0x37ae(%di)
    5012:	8b 46 fe             	mov    -0x2(%bp),%ax
    5015:	48                   	dec    %ax
    5016:	b9 28 00             	mov    $0x28,%cx
    5019:	f7 e9                	imul   %cx
    501b:	05 e6 00             	add    $0xe6,%ax
    501e:	8b 7e fe             	mov    -0x2(%bp),%di
    5021:	d1 e7                	shl    %di
    5023:	89 85 b4 37          	mov    %ax,0x37b4(%di)
    5027:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    502b:	75 d7                	jne    0x5004
    502d:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    5032:	eb 03                	jmp    0x5037
    5034:	ff 46 fe             	incw   -0x2(%bp)
    5037:	8b 7e fe             	mov    -0x2(%bp),%di
    503a:	d1 e7                	shl    %di
    503c:	c7 85 ba 37 4d 01    	movw   $0x14d,0x37ba(%di)
    5042:	8b 46 fe             	mov    -0x2(%bp),%ax
    5045:	48                   	dec    %ax
    5046:	b9 23 00             	mov    $0x23,%cx
    5049:	f7 e9                	imul   %cx
    504b:	05 18 01             	add    $0x118,%ax
    504e:	8b 7e fe             	mov    -0x2(%bp),%di
    5051:	d1 e7                	shl    %di
    5053:	89 85 be 37          	mov    %ax,0x37be(%di)
    5057:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    505b:	75 d7                	jne    0x5034
    505d:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    5062:	eb 03                	jmp    0x5067
    5064:	ff 46 fe             	incw   -0x2(%bp)
    5067:	8b 7e fe             	mov    -0x2(%bp),%di
    506a:	d1 e7                	shl    %di
    506c:	c7 85 c2 37 0d 02    	movw   $0x20d,0x37c2(%di)
    5072:	8b 46 fe             	mov    -0x2(%bp),%ax
    5075:	48                   	dec    %ax
    5076:	b9 28 00             	mov    $0x28,%cx
    5079:	f7 e9                	imul   %cx
    507b:	05 e6 00             	add    $0xe6,%ax
    507e:	8b 7e fe             	mov    -0x2(%bp),%di
    5081:	d1 e7                	shl    %di
    5083:	89 85 c8 37          	mov    %ax,0x37c8(%di)
    5087:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    508b:	75 d7                	jne    0x5064
    508d:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    5092:	eb 03                	jmp    0x5097
    5094:	ff 46 fe             	incw   -0x2(%bp)
    5097:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    509c:	eb 03                	jmp    0x50a1
    509e:	ff 46 fc             	incw   -0x4(%bp)
    50a1:	8b 46 fc             	mov    -0x4(%bp),%ax
    50a4:	48                   	dec    %ax
    50a5:	b9 11 00             	mov    $0x11,%cx
    50a8:	f7 e9                	imul   %cx
    50aa:	8b d0                	mov    %ax,%dx
    50ac:	8b 46 fe             	mov    -0x2(%bp),%ax
    50af:	48                   	dec    %ax
    50b0:	b9 09 00             	mov    $0x9,%cx
    50b3:	d3 e0                	shl    %cl,%ax
    50b5:	05 0e 00             	add    $0xe,%ax
    50b8:	03 c2                	add    %dx,%ax
    50ba:	8b d8                	mov    %ax,%bx
    50bc:	8b 46 fc             	mov    -0x4(%bp),%ax
    50bf:	d1 e0                	shl    %ax
    50c1:	8b c8                	mov    %ax,%cx
    50c3:	8b 46 fe             	mov    -0x2(%bp),%ax
    50c6:	ba 18 00             	mov    $0x18,%dx
    50c9:	f7 e2                	mul    %dx
    50cb:	8b f8                	mov    %ax,%di
    50cd:	03 f9                	add    %cx,%di
    50cf:	89 9d f0 39          	mov    %bx,0x39f0(%di)
    50d3:	8b 46 fc             	mov    -0x4(%bp),%ax
    50d6:	d1 e0                	shl    %ax
    50d8:	8b c8                	mov    %ax,%cx
    50da:	8b 46 fe             	mov    -0x2(%bp),%ax
    50dd:	ba 18 00             	mov    $0x18,%dx
    50e0:	f7 e2                	mul    %dx
    50e2:	8b f8                	mov    %ax,%di
    50e4:	03 f9                	add    %cx,%di
    50e6:	c7 85 38 3a 91 00    	movw   $0x91,0x3a38(%di)
    50ec:	83 7e fc 06          	cmpw   $0x6,-0x4(%bp)
    50f0:	75 ac                	jne    0x509e
    50f2:	c7 46 fc 07 00       	movw   $0x7,-0x4(%bp)
    50f7:	eb 03                	jmp    0x50fc
    50f9:	ff 46 fc             	incw   -0x4(%bp)
    50fc:	8b 46 fc             	mov    -0x4(%bp),%ax
    50ff:	2d 07 00             	sub    $0x7,%ax
    5102:	b9 11 00             	mov    $0x11,%cx
    5105:	f7 e9                	imul   %cx
    5107:	8b d0                	mov    %ax,%dx
    5109:	8b 46 fe             	mov    -0x2(%bp),%ax
    510c:	48                   	dec    %ax
    510d:	b9 09 00             	mov    $0x9,%cx
    5110:	d3 e0                	shl    %cl,%ax
    5112:	05 0e 00             	add    $0xe,%ax
    5115:	03 c2                	add    %dx,%ax
    5117:	8b d8                	mov    %ax,%bx
    5119:	8b 46 fc             	mov    -0x4(%bp),%ax
    511c:	d1 e0                	shl    %ax
    511e:	8b c8                	mov    %ax,%cx
    5120:	8b 46 fe             	mov    -0x2(%bp),%ax
    5123:	ba 18 00             	mov    $0x18,%dx
    5126:	f7 e2                	mul    %dx
    5128:	8b f8                	mov    %ax,%di
    512a:	03 f9                	add    %cx,%di
    512c:	89 9d f0 39          	mov    %bx,0x39f0(%di)
    5130:	8b 46 fc             	mov    -0x4(%bp),%ax
    5133:	d1 e0                	shl    %ax
    5135:	8b c8                	mov    %ax,%cx
    5137:	8b 46 fe             	mov    -0x2(%bp),%ax
    513a:	ba 18 00             	mov    $0x18,%dx
    513d:	f7 e2                	mul    %dx
    513f:	8b f8                	mov    %ax,%di
    5141:	03 f9                	add    %cx,%di
    5143:	c7 85 38 3a a3 00    	movw   $0xa3,0x3a38(%di)
    5149:	83 7e fc 0c          	cmpw   $0xc,-0x4(%bp)
    514d:	75 aa                	jne    0x50f9
    514f:	8b 7e fe             	mov    -0x2(%bp),%di
    5152:	d1 e7                	shl    %di
    5154:	c7 85 98 3a 0e 00    	movw   $0xe,0x3a98(%di)
    515a:	8b 7e fe             	mov    -0x2(%bp),%di
    515d:	d1 e7                	shl    %di
    515f:	c7 85 9e 3a 10 00    	movw   $0x10,0x3a9e(%di)
    5165:	83 7e fe 02          	cmpw   $0x2,-0x2(%bp)
    5169:	74 03                	je     0x516e
    516b:	e9 26 ff             	jmp    0x5094
    516e:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    5173:	eb 03                	jmp    0x5178
    5175:	ff 46 fc             	incw   -0x4(%bp)
    5178:	8b 46 fc             	mov    -0x4(%bp),%ax
    517b:	48                   	dec    %ax
    517c:	b9 04 00             	mov    $0x4,%cx
    517f:	d3 e0                	shl    %cl,%ax
    5181:	05 bf 00             	add    $0xbf,%ax
    5184:	8b 7e fc             	mov    -0x4(%bp),%di
    5187:	d1 e7                	shl    %di
    5189:	89 85 38 3a          	mov    %ax,0x3a38(%di)
    518d:	8b 7e fc             	mov    -0x4(%bp),%di
    5190:	d1 e7                	shl    %di
    5192:	c7 85 80 3a 06 01    	movw   $0x106,0x3a80(%di)
    5198:	83 7e fc 0c          	cmpw   $0xc,-0x4(%bp)
    519c:	75 d7                	jne    0x5175
    519e:	c7 06 9e 3a 53 00    	movw   $0x53,0x3a9e
    51a4:	c7 06 a4 3a 59 00    	movw   $0x59,0x3aa4
    51aa:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    51af:	eb 03                	jmp    0x51b4
    51b1:	ff 46 fe             	incw   -0x2(%bp)
    51b4:	c7 46 fc 06 00       	movw   $0x6,-0x4(%bp)
    51b9:	eb 03                	jmp    0x51be
    51bb:	ff 46 fc             	incw   -0x4(%bp)
    51be:	8b 46 fe             	mov    -0x2(%bp),%ax
    51c1:	48                   	dec    %ax
    51c2:	b9 25 00             	mov    $0x25,%cx
    51c5:	f7 e9                	imul   %cx
    51c7:	8b d8                	mov    %ax,%bx
    51c9:	8b 46 fc             	mov    -0x4(%bp),%ax
    51cc:	d1 e0                	shl    %ax
    51ce:	8b c8                	mov    %ax,%cx
    51d0:	8b 46 fe             	mov    -0x2(%bp),%ax
    51d3:	ba 12 00             	mov    $0x12,%dx
    51d6:	f7 e2                	mul    %dx
    51d8:	8b f8                	mov    %ax,%di
    51da:	03 f9                	add    %cx,%di
    51dc:	89 9d 34 3b          	mov    %bx,0x3b34(%di)
    51e0:	8b 46 fc             	mov    -0x4(%bp),%ax
    51e3:	2d 06 00             	sub    $0x6,%ax
    51e6:	b9 24 00             	mov    $0x24,%cx
    51e9:	f7 e9                	imul   %cx
    51eb:	8b d8                	mov    %ax,%bx
    51ed:	8b 46 fc             	mov    -0x4(%bp),%ax
    51f0:	d1 e0                	shl    %ax
    51f2:	8b c8                	mov    %ax,%cx
    51f4:	8b 46 fe             	mov    -0x2(%bp),%ax
    51f7:	ba 12 00             	mov    $0x12,%dx
    51fa:	f7 e2                	mul    %dx
    51fc:	8b f8                	mov    %ax,%di
    51fe:	03 f9                	add    %cx,%di
    5200:	89 9d 7c 3b          	mov    %bx,0x3b7c(%di)
    5204:	8b 46 fc             	mov    -0x4(%bp),%ax
    5207:	2d 06 00             	sub    $0x6,%ax
    520a:	b9 27 00             	mov    $0x27,%cx
    520d:	f7 e9                	imul   %cx
    520f:	05 91 00             	add    $0x91,%ax
    5212:	8b d8                	mov    %ax,%bx
    5214:	8b 46 fc             	mov    -0x4(%bp),%ax
    5217:	d1 e0                	shl    %ax
    5219:	8b c8                	mov    %ax,%cx
    521b:	8b 46 fe             	mov    -0x2(%bp),%ax
    521e:	ba 12 00             	mov    $0x12,%dx
    5221:	f7 e2                	mul    %dx
    5223:	8b f8                	mov    %ax,%di
    5225:	03 f9                	add    %cx,%di
    5227:	89 9d a0 3a          	mov    %bx,0x3aa0(%di)
    522b:	8b 46 fe             	mov    -0x2(%bp),%ax
    522e:	48                   	dec    %ax
    522f:	b9 26 00             	mov    $0x26,%cx
    5232:	f7 e9                	imul   %cx
    5234:	05 47 00             	add    $0x47,%ax
    5237:	8b d8                	mov    %ax,%bx
    5239:	8b 46 fc             	mov    -0x4(%bp),%ax
    523c:	d1 e0                	shl    %ax
    523e:	8b c8                	mov    %ax,%cx
    5240:	8b 46 fe             	mov    -0x2(%bp),%ax
    5243:	ba 12 00             	mov    $0x12,%dx
    5246:	f7 e2                	mul    %dx
    5248:	8b f8                	mov    %ax,%di
    524a:	03 f9                	add    %cx,%di
    524c:	89 9d e8 3a          	mov    %bx,0x3ae8(%di)
    5250:	83 7e fc 0e          	cmpw   $0xe,-0x4(%bp)
    5254:	74 03                	je     0x5259
    5256:	e9 62 ff             	jmp    0x51bb
    5259:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    525d:	74 03                	je     0x5262
    525f:	e9 4f ff             	jmp    0x51b1
    5262:	c7 06 4e 3b 26 00    	movw   $0x26,0x3b4e
    5268:	c7 06 50 3b 25 00    	movw   $0x25,0x3b50
    526e:	c7 06 ae 38 48 00    	movw   $0x48,0x38ae
    5274:	c7 06 b4 38 bc 00    	movw   $0xbc,0x38b4
    527a:	c7 06 b0 38 48 02    	movw   $0x248,0x38b0
    5280:	c7 06 b6 38 bc 00    	movw   $0xbc,0x38b6
    5286:	c7 06 b2 38 4b 01    	movw   $0x14b,0x38b2
    528c:	c7 06 b8 38 f5 00    	movw   $0xf5,0x38b8
    5292:	89 ec                	mov    %bp,%sp
    5294:	5d                   	pop    %bp
    5295:	cb                   	lret
    5296:	08 4e 69             	or     %cl,0x69(%bp)
    5299:	6e                   	outsb  %ds:(%si),(%dx)
    529a:	65 2e 6d             	gs cs insw (%dx),%es:(%di)
    529d:	73 63                	jae    0x5302
    529f:	14 4d                	adc    $0x4d,%al
    52a1:	75 73                	jne    0x5316
    52a3:	69 63 2d 46 69       	imul   $0x6946,0x2d(%bp,%di),%sp
    52a8:	6c                   	insb   (%dx),%es:(%di)
    52a9:	65 20 6e 6f          	and    %ch,%gs:0x6f(%bp)
    52ad:	74 20                	je     0x52cf
    52af:	66 6f                	outsl  %ds:(%si),(%dx)
    52b1:	75 6e                	jne    0x5321
    52b3:	64 08 4e 69          	or     %cl,%fs:0x69(%bp)
    52b7:	6e                   	outsb  %ds:(%si),(%dx)
    52b8:	65 2e 6c             	gs cs insb (%dx),%es:(%di)
    52bb:	69 62 0b 5a 46       	imul   $0x465a,0xb(%bp,%si),%sp
    52c0:	5f                   	pop    %di
    52c1:	4e                   	dec    %si
    52c2:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    52c7:	63 78 0b             	arpl   %di,0xb(%bx,%si)
    52ca:	56                   	push   %si
    52cb:	52                   	push   %dx
    52cc:	5f                   	pop    %di
    52cd:	4e                   	dec    %si
    52ce:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    52d3:	63 78 0b             	arpl   %di,0xb(%bx,%si)
    52d6:	5a                   	pop    %dx
    52d7:	52                   	push   %dx
    52d8:	5f                   	pop    %di
    52d9:	4e                   	dec    %si
    52da:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    52df:	63 78 0b             	arpl   %di,0xb(%bx,%si)
    52e2:	54                   	push   %sp
    52e3:	46                   	inc    %si
    52e4:	5f                   	pop    %di
    52e5:	4e                   	dec    %si
    52e6:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    52eb:	63 78 0b             	arpl   %di,0xb(%bx,%si)
    52ee:	54                   	push   %sp
    52ef:	52                   	push   %dx
    52f0:	5f                   	pop    %di
    52f1:	4e                   	dec    %si
    52f2:	69 6e 65 2e 70       	imul   $0x702e,0x65(%bp),%bp
    52f7:	63 78 9a             	arpl   %di,-0x66(%bx,%si)
    52fa:	00 00                	add    %al,(%bx,%si)
    52fc:	ce                   	into
    52fd:	1d 9a 29             	sbb    $0x299a,%ax
    5300:	0c e8                	or     $0xe8,%al
    5302:	1c 9a                	sbb    $0x9a,%al
    5304:	08 03                	or     %al,(%bp,%di)
    5306:	f5                   	cmc
    5307:	1b 9a f5 00          	sbb    0xf5(%bp,%si),%bx
    530b:	13 1b                	adc    (%bp,%di),%bx
    530d:	9a c8 0f f5 17       	lcall  $0x17f5,$0xfc8
    5312:	9a 00 00 10 13       	lcall  $0x1310,$0x0
    5317:	9a b3 10 a3 0c       	lcall  $0xca3,$0x10b3
    531c:	9a 13 01 85 0c       	lcall  $0xc85,$0x113
    5321:	9a 4a 1c bf 0a       	lcall  $0xabf,$0x1c4a
    5326:	9a 5e 22 95 08       	lcall  $0x895,$0x225e
    532b:	9a 1d 29 02 06       	lcall  $0x602,$0x291d
    5330:	55                   	push   %bp
    5331:	89 e5                	mov    %sp,%bp
    5333:	81 ec 00 01          	sub    $0x100,%sp
    5337:	c6 06 30 2c 00       	movb   $0x0,0x2c30
    533c:	9a 21 16 ce 1d       	lcall  $0x1dce,$0x1621
    5341:	09 c0                	or     %ax,%ax
    5343:	7e 37                	jle    0x537c
    5345:	8d be 00 ff          	lea    -0x100(%bp),%di
    5349:	16                   	push   %ss
    534a:	57                   	push   %di
    534b:	b8 01 00             	mov    $0x1,%ax
    534e:	50                   	push   %ax
    534f:	9a d2 15 ce 1d       	lcall  $0x1dce,$0x15d2
    5354:	bf 18 2d             	mov    $0x2d18,%di
    5357:	1e                   	push   %ds
    5358:	57                   	push   %di
    5359:	b8 ff 00             	mov    $0xff,%ax
    535c:	50                   	push   %ax
    535d:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    5362:	80 3e 19 2d 2f       	cmpb   $0x2f,0x2d19
    5367:	75 13                	jne    0x537c
    5369:	80 3e 1a 2d 73       	cmpb   $0x73,0x2d1a
    536e:	74 07                	je     0x5377
    5370:	80 3e 1a 2d 53       	cmpb   $0x53,0x2d1a
    5375:	75 05                	jne    0x537c
    5377:	31 c0                	xor    %ax,%ax
    5379:	a3 be 5e             	mov    %ax,0x5ebe
    537c:	c6 06 96 2c 00       	movb   $0x0,0x2c96
    5381:	bf 96 52             	mov    $0x5296,%di
    5384:	0e                   	push   %cs
    5385:	57                   	push   %di
    5386:	b8 20 00             	mov    $0x20,%ax
    5389:	50                   	push   %ax
    538a:	bf 60 36             	mov    $0x3660,%di
    538d:	1e                   	push   %ds
    538e:	57                   	push   %di
    538f:	9a 72 00 bf 1d       	lcall  $0x1dbf,$0x72
    5394:	83 3e e4 64 00       	cmpw   $0x0,0x64e4
    5399:	74 05                	je     0x53a0
    539b:	c6 06 96 2c 01       	movb   $0x1,0x2c96
    53a0:	80 3e 96 2c 00       	cmpb   $0x0,0x2c96
    53a5:	74 24                	je     0x53cb
    53a7:	bf e6 65             	mov    $0x65e6,%di
    53aa:	1e                   	push   %ds
    53ab:	57                   	push   %di
    53ac:	bf 9f 52             	mov    $0x529f,%di
    53af:	0e                   	push   %cs
    53b0:	57                   	push   %di
    53b1:	31 c0                	xor    %ax,%ax
    53b3:	50                   	push   %ax
    53b4:	9a 7f 12 ce 1d       	lcall  $0x1dce,$0x127f
    53b9:	9a 02 12 ce 1d       	lcall  $0x1dce,$0x1202
    53be:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    53c3:	b8 01 00             	mov    $0x1,%ax
    53c6:	9a d8 00 ce 1d       	lcall  $0x1dce,$0xd8
    53cb:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    53d0:	74 03                	je     0x53d5
    53d2:	e9 57 01             	jmp    0x552c
    53d5:	bf 98 2c             	mov    $0x2c98,%di
    53d8:	1e                   	push   %ds
    53d9:	57                   	push   %di
    53da:	bf 96 52             	mov    $0x5296,%di
    53dd:	0e                   	push   %cs
    53de:	57                   	push   %di
    53df:	9a 5e 13 ce 1d       	lcall  $0x1dce,$0x135e
    53e4:	bf 98 2c             	mov    $0x2c98,%di
    53e7:	1e                   	push   %ds
    53e8:	57                   	push   %di
    53e9:	b8 01 00             	mov    $0x1,%ax
    53ec:	50                   	push   %ax
    53ed:	9a 8c 13 ce 1d       	lcall  $0x1dce,$0x138c
    53f2:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    53f7:	bf 08 40             	mov    $0x4008,%di
    53fa:	1e                   	push   %ds
    53fb:	57                   	push   %di
    53fc:	b8 0d 06             	mov    $0x60d,%ax
    53ff:	50                   	push   %ax
    5400:	9a 29 03 ce 1d       	lcall  $0x1dce,$0x329
    5405:	bf 0c 40             	mov    $0x400c,%di
    5408:	1e                   	push   %ds
    5409:	57                   	push   %di
    540a:	b8 4f 02             	mov    $0x24f,%ax
    540d:	50                   	push   %ax
    540e:	9a 29 03 ce 1d       	lcall  $0x1dce,$0x329
    5413:	bf 10 40             	mov    $0x4010,%di
    5416:	1e                   	push   %ds
    5417:	57                   	push   %di
    5418:	b8 e0 09             	mov    $0x9e0,%ax
    541b:	50                   	push   %ax
    541c:	9a 29 03 ce 1d       	lcall  $0x1dce,$0x329
    5421:	bf 14 40             	mov    $0x4014,%di
    5424:	1e                   	push   %ds
    5425:	57                   	push   %di
    5426:	b8 8c 01             	mov    $0x18c,%ax
    5429:	50                   	push   %ax
    542a:	9a 29 03 ce 1d       	lcall  $0x1dce,$0x329
    542f:	bf 18 40             	mov    $0x4018,%di
    5432:	1e                   	push   %ds
    5433:	57                   	push   %di
    5434:	b8 6f 13             	mov    $0x136f,%ax
    5437:	50                   	push   %ax
    5438:	9a 29 03 ce 1d       	lcall  $0x1dce,$0x329
    543d:	bf 1c 40             	mov    $0x401c,%di
    5440:	1e                   	push   %ds
    5441:	57                   	push   %di
    5442:	b8 12 03             	mov    $0x312,%ax
    5445:	50                   	push   %ax
    5446:	9a 29 03 ce 1d       	lcall  $0x1dce,$0x329
    544b:	c7 06 20 40 0d 06    	movw   $0x60d,0x4020
    5451:	c7 06 22 40 4f 02    	movw   $0x24f,0x4022
    5457:	c7 06 24 40 e0 09    	movw   $0x9e0,0x4024
    545d:	c7 06 26 40 8c 01    	movw   $0x18c,0x4026
    5463:	c7 06 28 40 6f 13    	movw   $0x136f,0x4028
    5469:	c7 06 2a 40 12 03    	movw   $0x312,0x402a
    546f:	bf 98 2c             	mov    $0x2c98,%di
    5472:	1e                   	push   %ds
    5473:	57                   	push   %di
    5474:	c4 3e 08 40          	les    0x4008,%di
    5478:	06                   	push   %es
    5479:	57                   	push   %di
    547a:	ff 36 20 40          	push   0x4020
    547e:	31 c0                	xor    %ax,%ax
    5480:	50                   	push   %ax
    5481:	50                   	push   %ax
    5482:	9a 77 14 ce 1d       	lcall  $0x1dce,$0x1477
    5487:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    548c:	bf 98 2c             	mov    $0x2c98,%di
    548f:	1e                   	push   %ds
    5490:	57                   	push   %di
    5491:	c4 3e 0c 40          	les    0x400c,%di
    5495:	06                   	push   %es
    5496:	57                   	push   %di
    5497:	ff 36 22 40          	push   0x4022
    549b:	31 c0                	xor    %ax,%ax
    549d:	50                   	push   %ax
    549e:	50                   	push   %ax
    549f:	9a 77 14 ce 1d       	lcall  $0x1dce,$0x1477
    54a4:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    54a9:	bf 98 2c             	mov    $0x2c98,%di
    54ac:	1e                   	push   %ds
    54ad:	57                   	push   %di
    54ae:	c4 3e 10 40          	les    0x4010,%di
    54b2:	06                   	push   %es
    54b3:	57                   	push   %di
    54b4:	ff 36 24 40          	push   0x4024
    54b8:	31 c0                	xor    %ax,%ax
    54ba:	50                   	push   %ax
    54bb:	50                   	push   %ax
    54bc:	9a 77 14 ce 1d       	lcall  $0x1dce,$0x1477
    54c1:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    54c6:	bf 98 2c             	mov    $0x2c98,%di
    54c9:	1e                   	push   %ds
    54ca:	57                   	push   %di
    54cb:	c4 3e 14 40          	les    0x4014,%di
    54cf:	06                   	push   %es
    54d0:	57                   	push   %di
    54d1:	ff 36 26 40          	push   0x4026
    54d5:	31 c0                	xor    %ax,%ax
    54d7:	50                   	push   %ax
    54d8:	50                   	push   %ax
    54d9:	9a 77 14 ce 1d       	lcall  $0x1dce,$0x1477
    54de:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    54e3:	bf 98 2c             	mov    $0x2c98,%di
    54e6:	1e                   	push   %ds
    54e7:	57                   	push   %di
    54e8:	c4 3e 18 40          	les    0x4018,%di
    54ec:	06                   	push   %es
    54ed:	57                   	push   %di
    54ee:	ff 36 28 40          	push   0x4028
    54f2:	31 c0                	xor    %ax,%ax
    54f4:	50                   	push   %ax
    54f5:	50                   	push   %ax
    54f6:	9a 77 14 ce 1d       	lcall  $0x1dce,$0x1477
    54fb:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    5500:	bf 98 2c             	mov    $0x2c98,%di
    5503:	1e                   	push   %ds
    5504:	57                   	push   %di
    5505:	c4 3e 1c 40          	les    0x401c,%di
    5509:	06                   	push   %es
    550a:	57                   	push   %di
    550b:	ff 36 2a 40          	push   0x402a
    550f:	31 c0                	xor    %ax,%ax
    5511:	50                   	push   %ax
    5512:	50                   	push   %ax
    5513:	9a 77 14 ce 1d       	lcall  $0x1dce,$0x1477
    5518:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    551d:	bf 98 2c             	mov    $0x2c98,%di
    5520:	1e                   	push   %ds
    5521:	57                   	push   %di
    5522:	9a 0d 14 ce 1d       	lcall  $0x1dce,$0x140d
    5527:	9a 0e 02 ce 1d       	lcall  $0x1dce,$0x20e
    552c:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    5531:	75 0f                	jne    0x5542
    5533:	bf 18 40             	mov    $0x4018,%di
    5536:	1e                   	push   %ds
    5537:	57                   	push   %di
    5538:	bf 1c 40             	mov    $0x401c,%di
    553b:	1e                   	push   %ds
    553c:	57                   	push   %di
    553d:	9a d1 01 f5 1b       	lcall  $0x1bf5,$0x1d1
    5542:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    5547:	75 14                	jne    0x555d
    5549:	9a 34 02 f5 1b       	lcall  $0x1bf5,$0x234
    554e:	bf 10 40             	mov    $0x4010,%di
    5551:	1e                   	push   %ds
    5552:	57                   	push   %di
    5553:	bf 14 40             	mov    $0x4014,%di
    5556:	1e                   	push   %ds
    5557:	57                   	push   %di
    5558:	9a d1 01 f5 1b       	lcall  $0x1bf5,$0x1d1
    555d:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    5562:	75 14                	jne    0x5578
    5564:	9a 34 02 f5 1b       	lcall  $0x1bf5,$0x234
    5569:	bf 08 40             	mov    $0x4008,%di
    556c:	1e                   	push   %ds
    556d:	57                   	push   %di
    556e:	bf 0c 40             	mov    $0x400c,%di
    5571:	1e                   	push   %ds
    5572:	57                   	push   %di
    5573:	9a d1 01 f5 1b       	lcall  $0x1bf5,$0x1d1
    5578:	c6 06 84 45 00       	movb   $0x0,0x4584
    557d:	9a ff 06 a3 0c       	lcall  $0xca3,$0x6ff
    5582:	bf b4 52             	mov    $0x52b4,%di
    5585:	0e                   	push   %cs
    5586:	57                   	push   %di
    5587:	bf bd 52             	mov    $0x52bd,%di
    558a:	0e                   	push   %cs
    558b:	57                   	push   %di
    558c:	9a 44 07 a3 0c       	lcall  $0xca3,$0x744
    5591:	b8 0f 00             	mov    $0xf,%ax
    5594:	50                   	push   %ax
    5595:	b8 0a 00             	mov    $0xa,%ax
    5598:	50                   	push   %ax
    5599:	bf 08 25             	mov    $0x2508,%di
    559c:	1e                   	push   %ds
    559d:	57                   	push   %di
    559e:	31 c0                	xor    %ax,%ax
    55a0:	50                   	push   %ax
    55a1:	31 c0                	xor    %ax,%ax
    55a3:	50                   	push   %ax
    55a4:	9a a4 09 a3 0c       	lcall  $0xca3,$0x9a4
    55a9:	9a af 07 a3 0c       	lcall  $0xca3,$0x7af
    55ae:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    55b3:	74 13                	je     0x55c8
    55b5:	31 c0                	xor    %ax,%ax
    55b7:	50                   	push   %ax
    55b8:	31 c0                	xor    %ax,%ax
    55ba:	50                   	push   %ax
    55bb:	b8 76 02             	mov    $0x276,%ax
    55be:	50                   	push   %ax
    55bf:	b8 52 01             	mov    $0x152,%ax
    55c2:	50                   	push   %ax
    55c3:	9a e6 07 a3 0c       	lcall  $0xca3,$0x7e6
    55c8:	bf b4 52             	mov    $0x52b4,%di
    55cb:	0e                   	push   %cs
    55cc:	57                   	push   %di
    55cd:	bf c9 52             	mov    $0x52c9,%di
    55d0:	0e                   	push   %cs
    55d1:	57                   	push   %di
    55d2:	31 c0                	xor    %ax,%ax
    55d4:	50                   	push   %ax
    55d5:	31 c0                	xor    %ax,%ax
    55d7:	50                   	push   %ax
    55d8:	b8 01 00             	mov    $0x1,%ax
    55db:	50                   	push   %ax
    55dc:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    55e1:	c7 06 36 2c 00 01    	movw   $0x100,0x2c36
    55e7:	c7 06 66 2c 91 00    	movw   $0x91,0x2c66
    55ed:	c7 06 4e 2c 00 01    	movw   $0x100,0x2c4e
    55f3:	c7 06 7e 2c 01 00    	movw   $0x1,0x2c7e
    55f9:	c7 06 38 2c 55 01    	movw   $0x155,0x2c38
    55ff:	c7 06 68 2c 91 00    	movw   $0x91,0x2c68
    5605:	c7 06 50 2c 55 01    	movw   $0x155,0x2c50
    560b:	c7 06 80 2c 01 00    	movw   $0x1,0x2c80
    5611:	c7 06 3a 2c 01 00    	movw   $0x1,0x2c3a
    5617:	c7 06 6a 2c bd 00    	movw   $0xbd,0x2c6a
    561d:	c7 06 52 2c 01 00    	movw   $0x1,0x2c52
    5623:	c7 06 82 2c 31 00    	movw   $0x31,0x2c82
    5629:	c7 06 3c 2c 56 00    	movw   $0x56,0x2c3c
    562f:	c7 06 6c 2c bd 00    	movw   $0xbd,0x2c6c
    5635:	c7 06 54 2c 56 00    	movw   $0x56,0x2c54
    563b:	c7 06 84 2c 31 00    	movw   $0x31,0x2c84
    5641:	c7 06 3e 2c ab 00    	movw   $0xab,0x2c3e
    5647:	c7 06 6e 2c bd 00    	movw   $0xbd,0x2c6e
    564d:	c7 06 56 2c ab 00    	movw   $0xab,0x2c56
    5653:	c7 06 86 2c 31 00    	movw   $0x31,0x2c86
    5659:	c7 06 40 2c 01 00    	movw   $0x1,0x2c40
    565f:	c7 06 70 2c 03 01    	movw   $0x103,0x2c70
    5665:	c7 06 58 2c 01 00    	movw   $0x1,0x2c58
    566b:	c7 06 88 2c 77 00    	movw   $0x77,0x2c88
    5671:	c7 06 42 2c 56 00    	movw   $0x56,0x2c42
    5677:	c7 06 72 2c 03 01    	movw   $0x103,0x2c72
    567d:	c7 06 5a 2c 56 00    	movw   $0x56,0x2c5a
    5683:	c7 06 8a 2c 77 00    	movw   $0x77,0x2c8a
    5689:	c7 06 44 2c ab 00    	movw   $0xab,0x2c44
    568f:	c7 06 74 2c 03 01    	movw   $0x103,0x2c74
    5695:	c7 06 5c 2c ab 00    	movw   $0xab,0x2c5c
    569b:	c7 06 8c 2c 77 00    	movw   $0x77,0x2c8c
    56a1:	c7 06 46 2c 00 01    	movw   $0x100,0x2c46
    56a7:	c7 06 76 2c f1 00    	movw   $0xf1,0x2c76
    56ad:	c7 06 5e 2c 00 01    	movw   $0x100,0x2c5e
    56b3:	c7 06 8e 2c 31 00    	movw   $0x31,0x2c8e
    56b9:	c7 06 48 2c 55 01    	movw   $0x155,0x2c48
    56bf:	c7 06 78 2c f1 00    	movw   $0xf1,0x2c78
    56c5:	c7 06 60 2c 55 01    	movw   $0x155,0x2c60
    56cb:	c7 06 90 2c 31 00    	movw   $0x31,0x2c90
    56d1:	c7 06 4a 2c 00 01    	movw   $0x100,0x2c4a
    56d7:	c7 06 7a 2c c1 00    	movw   $0xc1,0x2c7a
    56dd:	c7 06 62 2c 00 01    	movw   $0x100,0x2c62
    56e3:	c7 06 92 2c 61 00    	movw   $0x61,0x2c92
    56e9:	c7 06 4c 2c 55 01    	movw   $0x155,0x2c4c
    56ef:	c7 06 7c 2c c1 00    	movw   $0xc1,0x2c7c
    56f5:	c7 06 64 2c 55 01    	movw   $0x155,0x2c64
    56fb:	c7 06 94 2c 61 00    	movw   $0x61,0x2c94
    5701:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5707:	eb 04                	jmp    0x570d
    5709:	ff 06 32 2c          	incw   0x2c32
    570d:	c7 06 34 2c 01 00    	movw   $0x1,0x2c34
    5713:	eb 04                	jmp    0x5719
    5715:	ff 06 34 2c          	incw   0x2c34
    5719:	c7 06 ae 3c 54 00    	movw   $0x54,0x3cae
    571f:	83 3e 34 2c 03       	cmpw   $0x3,0x2c34
    5724:	7c 15                	jl     0x573b
    5726:	83 3e 34 2c 08       	cmpw   $0x8,0x2c34
    572b:	7f 0e                	jg     0x573b
    572d:	8b 3e 34 2c          	mov    0x2c34,%di
    5731:	d1 e7                	shl    %di
    5733:	c7 85 ae 3c 45 00    	movw   $0x45,0x3cae(%di)
    5739:	eb 0c                	jmp    0x5747
    573b:	8b 3e 34 2c          	mov    0x2c34,%di
    573f:	d1 e7                	shl    %di
    5741:	c7 85 ae 3c 2f 00    	movw   $0x2f,0x3cae(%di)
    5747:	b8 01 00             	mov    $0x1,%ax
    574a:	50                   	push   %ax
    574b:	a1 34 2c             	mov    0x2c34,%ax
    574e:	d1 e0                	shl    %ax
    5750:	d1 e0                	shl    %ax
    5752:	8b c8                	mov    %ax,%cx
    5754:	a1 32 2c             	mov    0x2c32,%ax
    5757:	ba 30 00             	mov    $0x30,%dx
    575a:	f7 e2                	mul    %dx
    575c:	8b f8                	mov    %ax,%di
    575e:	03 f9                	add    %cx,%di
    5760:	8d 85 1a 3c          	lea    0x3c1a(%di),%ax
    5764:	8c da                	mov    %ds,%dx
    5766:	52                   	push   %dx
    5767:	50                   	push   %ax
    5768:	b8 05 00             	mov    $0x5,%ax
    576b:	50                   	push   %ax
    576c:	ff 36 ae 3c          	push   0x3cae
    5770:	8b 3e 34 2c          	mov    0x2c34,%di
    5774:	d1 e7                	shl    %di
    5776:	ff b5 ae 3c          	push   0x3cae(%di)
    577a:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    577f:	a1 34 2c             	mov    0x2c34,%ax
    5782:	d1 e0                	shl    %ax
    5784:	d1 e0                	shl    %ax
    5786:	8b c8                	mov    %ax,%cx
    5788:	a1 32 2c             	mov    0x2c32,%ax
    578b:	ba 30 00             	mov    $0x30,%dx
    578e:	f7 e2                	mul    %dx
    5790:	8b f8                	mov    %ax,%di
    5792:	03 f9                	add    %cx,%di
    5794:	ff b5 1c 3c          	push   0x3c1c(%di)
    5798:	ff b5 1a 3c          	push   0x3c1a(%di)
    579c:	a1 34 2c             	mov    0x2c34,%ax
    579f:	d1 e0                	shl    %ax
    57a1:	8b c8                	mov    %ax,%cx
    57a3:	a1 32 2c             	mov    0x2c32,%ax
    57a6:	ba 18 00             	mov    $0x18,%dx
    57a9:	f7 e2                	mul    %dx
    57ab:	8b f8                	mov    %ax,%di
    57ad:	03 f9                	add    %cx,%di
    57af:	ff b5 1c 2c          	push   0x2c1c(%di)
    57b3:	a1 34 2c             	mov    0x2c34,%ax
    57b6:	d1 e0                	shl    %ax
    57b8:	8b c8                	mov    %ax,%cx
    57ba:	a1 32 2c             	mov    0x2c32,%ax
    57bd:	ba 18 00             	mov    $0x18,%dx
    57c0:	f7 e2                	mul    %dx
    57c2:	8b f8                	mov    %ax,%di
    57c4:	03 f9                	add    %cx,%di
    57c6:	ff b5 4c 2c          	push   0x2c4c(%di)
    57ca:	ff 36 ae 3c          	push   0x3cae
    57ce:	8b 3e 34 2c          	mov    0x2c34,%di
    57d2:	d1 e7                	shl    %di
    57d4:	ff b5 ae 3c          	push   0x3cae(%di)
    57d8:	b8 01 00             	mov    $0x1,%ax
    57db:	50                   	push   %ax
    57dc:	b0 00                	mov    $0x0,%al
    57de:	50                   	push   %ax
    57df:	b0 00                	mov    $0x0,%al
    57e1:	50                   	push   %ax
    57e2:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    57e7:	83 3e 34 2c 0c       	cmpw   $0xc,0x2c34
    57ec:	74 03                	je     0x57f1
    57ee:	e9 24 ff             	jmp    0x5715
    57f1:	83 3e 32 2c 02       	cmpw   $0x2,0x2c32
    57f6:	74 03                	je     0x57fb
    57f8:	e9 0e ff             	jmp    0x5709
    57fb:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5801:	eb 04                	jmp    0x5807
    5803:	ff 06 32 2c          	incw   0x2c32
    5807:	b8 01 00             	mov    $0x1,%ax
    580a:	50                   	push   %ax
    580b:	8b 3e 32 2c          	mov    0x2c32,%di
    580f:	d1 e7                	shl    %di
    5811:	d1 e7                	shl    %di
    5813:	8d 85 e6 3c          	lea    0x3ce6(%di),%ax
    5817:	8c da                	mov    %ds,%dx
    5819:	52                   	push   %dx
    581a:	50                   	push   %ax
    581b:	b8 05 00             	mov    $0x5,%ax
    581e:	50                   	push   %ax
    581f:	b8 45 00             	mov    $0x45,%ax
    5822:	50                   	push   %ax
    5823:	b8 3d 00             	mov    $0x3d,%ax
    5826:	50                   	push   %ax
    5827:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    582c:	8b 3e 32 2c          	mov    0x2c32,%di
    5830:	d1 e7                	shl    %di
    5832:	d1 e7                	shl    %di
    5834:	ff b5 e8 3c          	push   0x3ce8(%di)
    5838:	ff b5 e6 3c          	push   0x3ce6(%di)
    583c:	b8 3a 02             	mov    $0x23a,%ax
    583f:	50                   	push   %ax
    5840:	a1 32 2c             	mov    0x2c32,%ax
    5843:	48                   	dec    %ax
    5844:	b9 3f 00             	mov    $0x3f,%cx
    5847:	f7 e9                	imul   %cx
    5849:	40                   	inc    %ax
    584a:	50                   	push   %ax
    584b:	b8 45 00             	mov    $0x45,%ax
    584e:	50                   	push   %ax
    584f:	b8 3d 00             	mov    $0x3d,%ax
    5852:	50                   	push   %ax
    5853:	b8 01 00             	mov    $0x1,%ax
    5856:	50                   	push   %ax
    5857:	b0 00                	mov    $0x0,%al
    5859:	50                   	push   %ax
    585a:	b0 00                	mov    $0x0,%al
    585c:	50                   	push   %ax
    585d:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5862:	83 3e 32 2c 05       	cmpw   $0x5,0x2c32
    5867:	75 9a                	jne    0x5803
    5869:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    586f:	eb 04                	jmp    0x5875
    5871:	ff 06 32 2c          	incw   0x2c32
    5875:	b8 01 00             	mov    $0x1,%ax
    5878:	50                   	push   %ax
    5879:	8b 3e 32 2c          	mov    0x2c32,%di
    587d:	d1 e7                	shl    %di
    587f:	d1 e7                	shl    %di
    5881:	8d 85 fa 3c          	lea    0x3cfa(%di),%ax
    5885:	8c da                	mov    %ds,%dx
    5887:	52                   	push   %dx
    5888:	50                   	push   %ax
    5889:	b8 05 00             	mov    $0x5,%ax
    588c:	50                   	push   %ax
    588d:	b8 45 00             	mov    $0x45,%ax
    5890:	50                   	push   %ax
    5891:	b8 5d 00             	mov    $0x5d,%ax
    5894:	50                   	push   %ax
    5895:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    589a:	8b 3e 32 2c          	mov    0x2c32,%di
    589e:	d1 e7                	shl    %di
    58a0:	d1 e7                	shl    %di
    58a2:	ff b5 fc 3c          	push   0x3cfc(%di)
    58a6:	ff b5 fa 3c          	push   0x3cfa(%di)
    58aa:	b8 f4 01             	mov    $0x1f4,%ax
    58ad:	50                   	push   %ax
    58ae:	a1 32 2c             	mov    0x2c32,%ax
    58b1:	48                   	dec    %ax
    58b2:	b9 5e 00             	mov    $0x5e,%cx
    58b5:	f7 e9                	imul   %cx
    58b7:	40                   	inc    %ax
    58b8:	50                   	push   %ax
    58b9:	b8 45 00             	mov    $0x45,%ax
    58bc:	50                   	push   %ax
    58bd:	b8 5d 00             	mov    $0x5d,%ax
    58c0:	50                   	push   %ax
    58c1:	b8 01 00             	mov    $0x1,%ax
    58c4:	50                   	push   %ax
    58c5:	b0 00                	mov    $0x0,%al
    58c7:	50                   	push   %ax
    58c8:	b0 00                	mov    $0x0,%al
    58ca:	50                   	push   %ax
    58cb:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    58d0:	83 3e 32 2c 03       	cmpw   $0x3,0x2c32
    58d5:	75 9a                	jne    0x5871
    58d7:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    58dd:	eb 04                	jmp    0x58e3
    58df:	ff 06 32 2c          	incw   0x2c32
    58e3:	b8 01 00             	mov    $0x1,%ax
    58e6:	50                   	push   %ax
    58e7:	8b 3e 32 2c          	mov    0x2c32,%di
    58eb:	d1 e7                	shl    %di
    58ed:	d1 e7                	shl    %di
    58ef:	8d 85 0a 3d          	lea    0x3d0a(%di),%ax
    58f3:	8c da                	mov    %ds,%dx
    58f5:	52                   	push   %dx
    58f6:	50                   	push   %ax
    58f7:	b8 05 00             	mov    $0x5,%ax
    58fa:	50                   	push   %ax
    58fb:	b8 45 00             	mov    $0x45,%ax
    58fe:	50                   	push   %ax
    58ff:	b8 4c 00             	mov    $0x4c,%ax
    5902:	50                   	push   %ax
    5903:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5908:	8b 3e 32 2c          	mov    0x2c32,%di
    590c:	d1 e7                	shl    %di
    590e:	d1 e7                	shl    %di
    5910:	ff b5 0c 3d          	push   0x3d0c(%di)
    5914:	ff b5 0a 3d          	push   0x3d0a(%di)
    5918:	b8 ae 01             	mov    $0x1ae,%ax
    591b:	50                   	push   %ax
    591c:	a1 32 2c             	mov    0x2c32,%ax
    591f:	48                   	dec    %ax
    5920:	b9 4d 00             	mov    $0x4d,%cx
    5923:	f7 e9                	imul   %cx
    5925:	05 40 00             	add    $0x40,%ax
    5928:	50                   	push   %ax
    5929:	b8 45 00             	mov    $0x45,%ax
    592c:	50                   	push   %ax
    592d:	b8 4c 00             	mov    $0x4c,%ax
    5930:	50                   	push   %ax
    5931:	b8 01 00             	mov    $0x1,%ax
    5934:	50                   	push   %ax
    5935:	b0 00                	mov    $0x0,%al
    5937:	50                   	push   %ax
    5938:	b0 00                	mov    $0x0,%al
    593a:	50                   	push   %ax
    593b:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5940:	83 3e 32 2c 02       	cmpw   $0x2,0x2c32
    5945:	75 98                	jne    0x58df
    5947:	b8 01 00             	mov    $0x1,%ax
    594a:	50                   	push   %ax
    594b:	b8 0a 3d             	mov    $0x3d0a,%ax
    594e:	8c da                	mov    %ds,%dx
    5950:	52                   	push   %dx
    5951:	50                   	push   %ax
    5952:	b8 05 00             	mov    $0x5,%ax
    5955:	50                   	push   %ax
    5956:	b8 45 00             	mov    $0x45,%ax
    5959:	50                   	push   %ax
    595a:	b8 3d 00             	mov    $0x3d,%ax
    595d:	50                   	push   %ax
    595e:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5963:	ff 36 0c 3d          	push   0x3d0c
    5967:	ff 36 0a 3d          	push   0x3d0a
    596b:	b8 ae 01             	mov    $0x1ae,%ax
    596e:	50                   	push   %ax
    596f:	b8 01 00             	mov    $0x1,%ax
    5972:	50                   	push   %ax
    5973:	b8 45 00             	mov    $0x45,%ax
    5976:	50                   	push   %ax
    5977:	b8 3d 00             	mov    $0x3d,%ax
    597a:	50                   	push   %ax
    597b:	b8 01 00             	mov    $0x1,%ax
    597e:	50                   	push   %ax
    597f:	b0 00                	mov    $0x0,%al
    5981:	50                   	push   %ax
    5982:	b0 00                	mov    $0x0,%al
    5984:	50                   	push   %ax
    5985:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    598a:	bf b4 52             	mov    $0x52b4,%di
    598d:	0e                   	push   %cs
    598e:	57                   	push   %di
    598f:	bf d5 52             	mov    $0x52d5,%di
    5992:	0e                   	push   %cs
    5993:	57                   	push   %di
    5994:	31 c0                	xor    %ax,%ax
    5996:	50                   	push   %ax
    5997:	31 c0                	xor    %ax,%ax
    5999:	50                   	push   %ax
    599a:	b8 01 00             	mov    $0x1,%ax
    599d:	50                   	push   %ax
    599e:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    59a3:	0e                   	push   %cs
    59a4:	e8 3f ed             	call   0x46e6
    59a7:	b8 05 00             	mov    $0x5,%ax
    59aa:	50                   	push   %ax
    59ab:	bf b4 52             	mov    $0x52b4,%di
    59ae:	0e                   	push   %cs
    59af:	57                   	push   %di
    59b0:	bf bd 52             	mov    $0x52bd,%di
    59b3:	0e                   	push   %cs
    59b4:	57                   	push   %di
    59b5:	b8 3c 3c             	mov    $0x3c3c,%ax
    59b8:	8c da                	mov    %ds,%dx
    59ba:	52                   	push   %dx
    59bb:	50                   	push   %ax
    59bc:	9a 43 02 a3 0c       	lcall  $0xca3,$0x243
    59c1:	31 c0                	xor    %ax,%ax
    59c3:	a3 32 2c             	mov    %ax,0x2c32
    59c6:	eb 04                	jmp    0x59cc
    59c8:	ff 06 32 2c          	incw   0x2c32
    59cc:	8b 3e 32 2c          	mov    0x2c32,%di
    59d0:	c6 85 2a 3c 00       	movb   $0x0,0x3c2a(%di)
    59d5:	83 3e 32 2c 10       	cmpw   $0x10,0x2c32
    59da:	75 ec                	jne    0x59c8
    59dc:	b8 2a 3c             	mov    $0x3c2a,%ax
    59df:	8c da                	mov    %ds,%dx
    59e1:	52                   	push   %dx
    59e2:	50                   	push   %ax
    59e3:	9a d6 03 a3 0c       	lcall  $0xca3,$0x3d6
    59e8:	bf b4 52             	mov    $0x52b4,%di
    59eb:	0e                   	push   %cs
    59ec:	57                   	push   %di
    59ed:	bf bd 52             	mov    $0x52bd,%di
    59f0:	0e                   	push   %cs
    59f1:	57                   	push   %di
    59f2:	31 c0                	xor    %ax,%ax
    59f4:	50                   	push   %ax
    59f5:	31 c0                	xor    %ax,%ax
    59f7:	50                   	push   %ax
    59f8:	31 c0                	xor    %ax,%ax
    59fa:	50                   	push   %ax
    59fb:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    5a00:	c7 06 fa 2f 09 01    	movw   $0x109,0x2ffa
    5a06:	c7 06 fc 2f 82 00    	movw   $0x82,0x2ffc
    5a0c:	b8 01 00             	mov    $0x1,%ax
    5a0f:	50                   	push   %ax
    5a10:	b8 fe 2f             	mov    $0x2ffe,%ax
    5a13:	8c da                	mov    %ds,%dx
    5a15:	52                   	push   %dx
    5a16:	50                   	push   %ax
    5a17:	b8 05 00             	mov    $0x5,%ax
    5a1a:	50                   	push   %ax
    5a1b:	b8 5c 00             	mov    $0x5c,%ax
    5a1e:	50                   	push   %ax
    5a1f:	b8 3c 00             	mov    $0x3c,%ax
    5a22:	50                   	push   %ax
    5a23:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5a28:	ff 36 00 30          	push   0x3000
    5a2c:	ff 36 fe 2f          	push   0x2ffe
    5a30:	b8 23 02             	mov    $0x223,%ax
    5a33:	50                   	push   %ax
    5a34:	b8 a7 00             	mov    $0xa7,%ax
    5a37:	50                   	push   %ax
    5a38:	b8 5c 00             	mov    $0x5c,%ax
    5a3b:	50                   	push   %ax
    5a3c:	b8 3c 00             	mov    $0x3c,%ax
    5a3f:	50                   	push   %ax
    5a40:	b8 01 00             	mov    $0x1,%ax
    5a43:	50                   	push   %ax
    5a44:	b0 00                	mov    $0x0,%al
    5a46:	50                   	push   %ax
    5a47:	b0 00                	mov    $0x0,%al
    5a49:	50                   	push   %ax
    5a4a:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5a4f:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5a55:	eb 04                	jmp    0x5a5b
    5a57:	ff 06 32 2c          	incw   0x2c32
    5a5b:	c7 06 34 2c 01 00    	movw   $0x1,0x2c34
    5a61:	eb 04                	jmp    0x5a67
    5a63:	ff 06 34 2c          	incw   0x2c34
    5a67:	b8 01 00             	mov    $0x1,%ax
    5a6a:	50                   	push   %ax
    5a6b:	a1 32 2c             	mov    0x2c32,%ax
    5a6e:	48                   	dec    %ax
    5a6f:	b9 03 00             	mov    $0x3,%cx
    5a72:	f7 e9                	imul   %cx
    5a74:	40                   	inc    %ax
    5a75:	03 06 34 2c          	add    0x2c34,%ax
    5a79:	8b f8                	mov    %ax,%di
    5a7b:	d1 e7                	shl    %di
    5a7d:	d1 e7                	shl    %di
    5a7f:	8d 85 fa 2f          	lea    0x2ffa(%di),%ax
    5a83:	8c da                	mov    %ds,%dx
    5a85:	52                   	push   %dx
    5a86:	50                   	push   %ax
    5a87:	b8 05 00             	mov    $0x5,%ax
    5a8a:	50                   	push   %ax
    5a8b:	b8 4e 00             	mov    $0x4e,%ax
    5a8e:	50                   	push   %ax
    5a8f:	b8 3c 00             	mov    $0x3c,%ax
    5a92:	50                   	push   %ax
    5a93:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5a98:	a1 32 2c             	mov    0x2c32,%ax
    5a9b:	48                   	dec    %ax
    5a9c:	b9 03 00             	mov    $0x3,%cx
    5a9f:	f7 e9                	imul   %cx
    5aa1:	40                   	inc    %ax
    5aa2:	03 06 34 2c          	add    0x2c34,%ax
    5aa6:	8b f8                	mov    %ax,%di
    5aa8:	d1 e7                	shl    %di
    5aaa:	d1 e7                	shl    %di
    5aac:	ff b5 fc 2f          	push   0x2ffc(%di)
    5ab0:	ff b5 fa 2f          	push   0x2ffa(%di)
    5ab4:	a1 34 2c             	mov    0x2c34,%ax
    5ab7:	48                   	dec    %ax
    5ab8:	b9 4f 00             	mov    $0x4f,%cx
    5abb:	f7 e9                	imul   %cx
    5abd:	05 93 01             	add    $0x193,%ax
    5ac0:	50                   	push   %ax
    5ac1:	a1 32 2c             	mov    0x2c32,%ax
    5ac4:	48                   	dec    %ax
    5ac5:	b9 3d 00             	mov    $0x3d,%cx
    5ac8:	f7 e9                	imul   %cx
    5aca:	05 e4 00             	add    $0xe4,%ax
    5acd:	50                   	push   %ax
    5ace:	b8 4e 00             	mov    $0x4e,%ax
    5ad1:	50                   	push   %ax
    5ad2:	b8 3c 00             	mov    $0x3c,%ax
    5ad5:	50                   	push   %ax
    5ad6:	b8 01 00             	mov    $0x1,%ax
    5ad9:	50                   	push   %ax
    5ada:	b0 00                	mov    $0x0,%al
    5adc:	50                   	push   %ax
    5add:	b0 00                	mov    $0x0,%al
    5adf:	50                   	push   %ax
    5ae0:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5ae5:	83 3e 34 2c 03       	cmpw   $0x3,0x2c34
    5aea:	74 03                	je     0x5aef
    5aec:	e9 74 ff             	jmp    0x5a63
    5aef:	83 3e 32 2c 02       	cmpw   $0x2,0x2c32
    5af4:	74 03                	je     0x5af9
    5af6:	e9 5e ff             	jmp    0x5a57
    5af9:	bf 3c 3c             	mov    $0x3c3c,%di
    5afc:	1e                   	push   %ds
    5afd:	57                   	push   %di
    5afe:	b8 3c 00             	mov    $0x3c,%ax
    5b01:	50                   	push   %ax
    5b02:	9a 5b 0a a3 0c       	lcall  $0xca3,$0xa5b
    5b07:	0e                   	push   %cs
    5b08:	e8 a6 e8             	call   0x43b1
    5b0b:	bf 3c 3c             	mov    $0x3c3c,%di
    5b0e:	1e                   	push   %ds
    5b0f:	57                   	push   %di
    5b10:	b8 28 00             	mov    $0x28,%ax
    5b13:	50                   	push   %ax
    5b14:	9a f4 0c a3 0c       	lcall  $0xca3,$0xcf4
    5b19:	0e                   	push   %cs
    5b1a:	e8 d4 ec             	call   0x47f1
    5b1d:	31 c0                	xor    %ax,%ax
    5b1f:	50                   	push   %ax
    5b20:	31 c0                	xor    %ax,%ax
    5b22:	50                   	push   %ax
    5b23:	b8 7f 02             	mov    $0x27f,%ax
    5b26:	50                   	push   %ax
    5b27:	b8 5d 01             	mov    $0x15d,%ax
    5b2a:	50                   	push   %ax
    5b2b:	b0 01                	mov    $0x1,%al
    5b2d:	50                   	push   %ax
    5b2e:	9a 2c 0a f5 17       	lcall  $0x17f5,$0xa2c
    5b33:	9a c3 0a f5 17       	lcall  $0x17f5,$0xac3
    5b38:	b8 05 00             	mov    $0x5,%ax
    5b3b:	50                   	push   %ax
    5b3c:	bf b4 52             	mov    $0x52b4,%di
    5b3f:	0e                   	push   %cs
    5b40:	57                   	push   %di
    5b41:	bf e1 52             	mov    $0x52e1,%di
    5b44:	0e                   	push   %cs
    5b45:	57                   	push   %di
    5b46:	b8 3c 3c             	mov    $0x3c3c,%ax
    5b49:	8c da                	mov    %ds,%dx
    5b4b:	52                   	push   %dx
    5b4c:	50                   	push   %ax
    5b4d:	9a 43 02 a3 0c       	lcall  $0xca3,$0x243
    5b52:	ff 36 00 30          	push   0x3000
    5b56:	ff 36 fe 2f          	push   0x2ffe
    5b5a:	31 c0                	xor    %ax,%ax
    5b5c:	50                   	push   %ax
    5b5d:	ff 36 fa 2f          	push   0x2ffa
    5b61:	ff 36 fc 2f          	push   0x2ffc
    5b65:	31 c0                	xor    %ax,%ax
    5b67:	50                   	push   %ax
    5b68:	b0 02                	mov    $0x2,%al
    5b6a:	50                   	push   %ax
    5b6b:	b0 00                	mov    $0x0,%al
    5b6d:	50                   	push   %ax
    5b6e:	b0 00                	mov    $0x0,%al
    5b70:	50                   	push   %ax
    5b71:	b8 0a 00             	mov    $0xa,%ax
    5b74:	50                   	push   %ax
    5b75:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    5b7a:	bf 3c 3c             	mov    $0x3c3c,%di
    5b7d:	1e                   	push   %ds
    5b7e:	57                   	push   %di
    5b7f:	b8 3c 00             	mov    $0x3c,%ax
    5b82:	50                   	push   %ax
    5b83:	9a 5b 0a a3 0c       	lcall  $0xca3,$0xa5b
    5b88:	c7 06 32 2c 02 00    	movw   $0x2,0x2c32
    5b8e:	eb 04                	jmp    0x5b94
    5b90:	ff 06 32 2c          	incw   0x2c32
    5b94:	8b 3e 32 2c          	mov    0x2c32,%di
    5b98:	d1 e7                	shl    %di
    5b9a:	d1 e7                	shl    %di
    5b9c:	ff b5 fc 2f          	push   0x2ffc(%di)
    5ba0:	ff b5 fa 2f          	push   0x2ffa(%di)
    5ba4:	31 c0                	xor    %ax,%ax
    5ba6:	50                   	push   %ax
    5ba7:	ff 36 fa 2f          	push   0x2ffa
    5bab:	ff 36 fc 2f          	push   0x2ffc
    5baf:	31 c0                	xor    %ax,%ax
    5bb1:	50                   	push   %ax
    5bb2:	b0 02                	mov    $0x2,%al
    5bb4:	50                   	push   %ax
    5bb5:	b0 00                	mov    $0x0,%al
    5bb7:	50                   	push   %ax
    5bb8:	b0 00                	mov    $0x0,%al
    5bba:	50                   	push   %ax
    5bbb:	b8 78 00             	mov    $0x78,%ax
    5bbe:	50                   	push   %ax
    5bbf:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    5bc4:	83 3e 32 2c 05       	cmpw   $0x5,0x2c32
    5bc9:	75 c5                	jne    0x5b90
    5bcb:	ff 36 14 30          	push   0x3014
    5bcf:	ff 36 12 30          	push   0x3012
    5bd3:	31 c0                	xor    %ax,%ax
    5bd5:	50                   	push   %ax
    5bd6:	ff 36 fa 2f          	push   0x2ffa
    5bda:	ff 36 fc 2f          	push   0x2ffc
    5bde:	31 c0                	xor    %ax,%ax
    5be0:	50                   	push   %ax
    5be1:	b0 02                	mov    $0x2,%al
    5be3:	50                   	push   %ax
    5be4:	b0 00                	mov    $0x0,%al
    5be6:	50                   	push   %ax
    5be7:	b0 00                	mov    $0x0,%al
    5be9:	50                   	push   %ax
    5bea:	b8 0a 00             	mov    $0xa,%ax
    5bed:	50                   	push   %ax
    5bee:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    5bf3:	bf b4 52             	mov    $0x52b4,%di
    5bf6:	0e                   	push   %cs
    5bf7:	57                   	push   %di
    5bf8:	bf ed 52             	mov    $0x52ed,%di
    5bfb:	0e                   	push   %cs
    5bfc:	57                   	push   %di
    5bfd:	31 c0                	xor    %ax,%ax
    5bff:	50                   	push   %ax
    5c00:	31 c0                	xor    %ax,%ax
    5c02:	50                   	push   %ax
    5c03:	b8 01 00             	mov    $0x1,%ax
    5c06:	50                   	push   %ax
    5c07:	b8 2c 01             	mov    $0x12c,%ax
    5c0a:	50                   	push   %ax
    5c0b:	9a 69 1b bf 0a       	lcall  $0xabf,$0x1b69
    5c10:	ff 36 18 30          	push   0x3018
    5c14:	ff 36 16 30          	push   0x3016
    5c18:	31 c0                	xor    %ax,%ax
    5c1a:	50                   	push   %ax
    5c1b:	ff 36 fa 2f          	push   0x2ffa
    5c1f:	ff 36 fc 2f          	push   0x2ffc
    5c23:	31 c0                	xor    %ax,%ax
    5c25:	50                   	push   %ax
    5c26:	b0 02                	mov    $0x2,%al
    5c28:	50                   	push   %ax
    5c29:	b0 00                	mov    $0x0,%al
    5c2b:	50                   	push   %ax
    5c2c:	b0 00                	mov    $0x0,%al
    5c2e:	50                   	push   %ax
    5c2f:	b8 3c 00             	mov    $0x3c,%ax
    5c32:	50                   	push   %ax
    5c33:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    5c38:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5c3e:	eb 04                	jmp    0x5c44
    5c40:	ff 06 32 2c          	incw   0x2c32
    5c44:	c7 06 34 2c 06 00    	movw   $0x6,0x2c34
    5c4a:	eb 04                	jmp    0x5c50
    5c4c:	ff 06 34 2c          	incw   0x2c34
    5c50:	b8 01 00             	mov    $0x1,%ax
    5c53:	50                   	push   %ax
    5c54:	a1 34 2c             	mov    0x2c34,%ax
    5c57:	d1 e0                	shl    %ax
    5c59:	d1 e0                	shl    %ax
    5c5b:	8b c8                	mov    %ax,%cx
    5c5d:	a1 32 2c             	mov    0x2c32,%ax
    5c60:	ba 24 00             	mov    $0x24,%dx
    5c63:	f7 e2                	mul    %dx
    5c65:	8b f8                	mov    %ax,%di
    5c67:	03 f9                	add    %cx,%di
    5c69:	8d 85 36 39          	lea    0x3936(%di),%ax
    5c6d:	8c da                	mov    %ds,%dx
    5c6f:	52                   	push   %dx
    5c70:	50                   	push   %ax
    5c71:	b8 05 00             	mov    $0x5,%ax
    5c74:	50                   	push   %ax
    5c75:	ff 36 4e 3b          	push   0x3b4e
    5c79:	ff 36 50 3b          	push   0x3b50
    5c7d:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5c82:	a1 34 2c             	mov    0x2c34,%ax
    5c85:	d1 e0                	shl    %ax
    5c87:	d1 e0                	shl    %ax
    5c89:	8b c8                	mov    %ax,%cx
    5c8b:	a1 32 2c             	mov    0x2c32,%ax
    5c8e:	ba 24 00             	mov    $0x24,%dx
    5c91:	f7 e2                	mul    %dx
    5c93:	8b f8                	mov    %ax,%di
    5c95:	03 f9                	add    %cx,%di
    5c97:	ff b5 38 39          	push   0x3938(%di)
    5c9b:	ff b5 36 39          	push   0x3936(%di)
    5c9f:	a1 34 2c             	mov    0x2c34,%ax
    5ca2:	d1 e0                	shl    %ax
    5ca4:	8b c8                	mov    %ax,%cx
    5ca6:	a1 32 2c             	mov    0x2c32,%ax
    5ca9:	ba 12 00             	mov    $0x12,%dx
    5cac:	f7 e2                	mul    %dx
    5cae:	8b f8                	mov    %ax,%di
    5cb0:	03 f9                	add    %cx,%di
    5cb2:	ff b5 34 3b          	push   0x3b34(%di)
    5cb6:	a1 34 2c             	mov    0x2c34,%ax
    5cb9:	d1 e0                	shl    %ax
    5cbb:	8b c8                	mov    %ax,%cx
    5cbd:	a1 32 2c             	mov    0x2c32,%ax
    5cc0:	ba 12 00             	mov    $0x12,%dx
    5cc3:	f7 e2                	mul    %dx
    5cc5:	8b f8                	mov    %ax,%di
    5cc7:	03 f9                	add    %cx,%di
    5cc9:	ff b5 7c 3b          	push   0x3b7c(%di)
    5ccd:	ff 36 4e 3b          	push   0x3b4e
    5cd1:	ff 36 50 3b          	push   0x3b50
    5cd5:	b8 01 00             	mov    $0x1,%ax
    5cd8:	50                   	push   %ax
    5cd9:	b0 00                	mov    $0x0,%al
    5cdb:	50                   	push   %ax
    5cdc:	b0 00                	mov    $0x0,%al
    5cde:	50                   	push   %ax
    5cdf:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5ce4:	83 3e 34 2c 0e       	cmpw   $0xe,0x2c34
    5ce9:	74 03                	je     0x5cee
    5ceb:	e9 5e ff             	jmp    0x5c4c
    5cee:	83 3e 32 2c 04       	cmpw   $0x4,0x2c32
    5cf3:	74 03                	je     0x5cf8
    5cf5:	e9 48 ff             	jmp    0x5c40
    5cf8:	b8 01 00             	mov    $0x1,%ax
    5cfb:	50                   	push   %ax
    5cfc:	b8 16 39             	mov    $0x3916,%ax
    5cff:	8c da                	mov    %ds,%dx
    5d01:	52                   	push   %dx
    5d02:	50                   	push   %ax
    5d03:	b8 05 00             	mov    $0x5,%ax
    5d06:	50                   	push   %ax
    5d07:	b8 50 00             	mov    $0x50,%ax
    5d0a:	50                   	push   %ax
    5d0b:	b8 2c 00             	mov    $0x2c,%ax
    5d0e:	50                   	push   %ax
    5d0f:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5d14:	ff 36 18 39          	push   0x3918
    5d18:	ff 36 16 39          	push   0x3916
    5d1c:	b8 96 00             	mov    $0x96,%ax
    5d1f:	50                   	push   %ax
    5d20:	b8 1f 01             	mov    $0x11f,%ax
    5d23:	50                   	push   %ax
    5d24:	b8 50 00             	mov    $0x50,%ax
    5d27:	50                   	push   %ax
    5d28:	b8 2c 00             	mov    $0x2c,%ax
    5d2b:	50                   	push   %ax
    5d2c:	b8 01 00             	mov    $0x1,%ax
    5d2f:	50                   	push   %ax
    5d30:	b0 00                	mov    $0x0,%al
    5d32:	50                   	push   %ax
    5d33:	b0 00                	mov    $0x0,%al
    5d35:	50                   	push   %ax
    5d36:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5d3b:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5d41:	eb 04                	jmp    0x5d47
    5d43:	ff 06 32 2c          	incw   0x2c32
    5d47:	b8 01 00             	mov    $0x1,%ax
    5d4a:	50                   	push   %ax
    5d4b:	8b 3e 32 2c          	mov    0x2c32,%di
    5d4f:	d1 e7                	shl    %di
    5d51:	d1 e7                	shl    %di
    5d53:	8d 85 16 39          	lea    0x3916(%di),%ax
    5d57:	8c da                	mov    %ds,%dx
    5d59:	52                   	push   %dx
    5d5a:	50                   	push   %ax
    5d5b:	b8 05 00             	mov    $0x5,%ax
    5d5e:	50                   	push   %ax
    5d5f:	b8 48 00             	mov    $0x48,%ax
    5d62:	50                   	push   %ax
    5d63:	b8 19 00             	mov    $0x19,%ax
    5d66:	50                   	push   %ax
    5d67:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5d6c:	8b 3e 32 2c          	mov    0x2c32,%di
    5d70:	d1 e7                	shl    %di
    5d72:	d1 e7                	shl    %di
    5d74:	ff b5 18 39          	push   0x3918(%di)
    5d78:	ff b5 16 39          	push   0x3916(%di)
    5d7c:	b8 96 00             	mov    $0x96,%ax
    5d7f:	50                   	push   %ax
    5d80:	a1 32 2c             	mov    0x2c32,%ax
    5d83:	48                   	dec    %ax
    5d84:	b9 1a 00             	mov    $0x1a,%cx
    5d87:	f7 e9                	imul   %cx
    5d89:	40                   	inc    %ax
    5d8a:	50                   	push   %ax
    5d8b:	b8 48 00             	mov    $0x48,%ax
    5d8e:	50                   	push   %ax
    5d8f:	b8 19 00             	mov    $0x19,%ax
    5d92:	50                   	push   %ax
    5d93:	b8 01 00             	mov    $0x1,%ax
    5d96:	50                   	push   %ax
    5d97:	b0 00                	mov    $0x0,%al
    5d99:	50                   	push   %ax
    5d9a:	b0 00                	mov    $0x0,%al
    5d9c:	50                   	push   %ax
    5d9d:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5da2:	83 3e 32 2c 0b       	cmpw   $0xb,0x2c32
    5da7:	75 9a                	jne    0x5d43
    5da9:	c7 06 32 2c 0c 00    	movw   $0xc,0x2c32
    5daf:	eb 04                	jmp    0x5db5
    5db1:	ff 06 32 2c          	incw   0x2c32
    5db5:	b8 01 00             	mov    $0x1,%ax
    5db8:	50                   	push   %ax
    5db9:	8b 3e 32 2c          	mov    0x2c32,%di
    5dbd:	d1 e7                	shl    %di
    5dbf:	d1 e7                	shl    %di
    5dc1:	8d 85 16 39          	lea    0x3916(%di),%ax
    5dc5:	8c da                	mov    %ds,%dx
    5dc7:	52                   	push   %dx
    5dc8:	50                   	push   %ax
    5dc9:	b8 05 00             	mov    $0x5,%ax
    5dcc:	50                   	push   %ax
    5dcd:	b8 48 00             	mov    $0x48,%ax
    5dd0:	50                   	push   %ax
    5dd1:	b8 19 00             	mov    $0x19,%ax
    5dd4:	50                   	push   %ax
    5dd5:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    5dda:	8b 3e 32 2c          	mov    0x2c32,%di
    5dde:	d1 e7                	shl    %di
    5de0:	d1 e7                	shl    %di
    5de2:	ff b5 18 39          	push   0x3918(%di)
    5de6:	ff b5 16 39          	push   0x3916(%di)
    5dea:	b8 df 00             	mov    $0xdf,%ax
    5ded:	50                   	push   %ax
    5dee:	a1 32 2c             	mov    0x2c32,%ax
    5df1:	2d 0c 00             	sub    $0xc,%ax
    5df4:	b9 1a 00             	mov    $0x1a,%cx
    5df7:	f7 e9                	imul   %cx
    5df9:	40                   	inc    %ax
    5dfa:	50                   	push   %ax
    5dfb:	b8 48 00             	mov    $0x48,%ax
    5dfe:	50                   	push   %ax
    5dff:	b8 19 00             	mov    $0x19,%ax
    5e02:	50                   	push   %ax
    5e03:	b8 01 00             	mov    $0x1,%ax
    5e06:	50                   	push   %ax
    5e07:	b0 00                	mov    $0x0,%al
    5e09:	50                   	push   %ax
    5e0a:	b0 00                	mov    $0x0,%al
    5e0c:	50                   	push   %ax
    5e0d:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    5e12:	83 3e 32 2c 16       	cmpw   $0x16,0x2c32
    5e17:	75 98                	jne    0x5db1
    5e19:	ff 36 14 30          	push   0x3014
    5e1d:	ff 36 12 30          	push   0x3012
    5e21:	31 c0                	xor    %ax,%ax
    5e23:	50                   	push   %ax
    5e24:	ff 36 fa 2f          	push   0x2ffa
    5e28:	ff 36 fc 2f          	push   0x2ffc
    5e2c:	31 c0                	xor    %ax,%ax
    5e2e:	50                   	push   %ax
    5e2f:	b0 02                	mov    $0x2,%al
    5e31:	50                   	push   %ax
    5e32:	b0 00                	mov    $0x0,%al
    5e34:	50                   	push   %ax
    5e35:	b0 00                	mov    $0x0,%al
    5e37:	50                   	push   %ax
    5e38:	b8 14 00             	mov    $0x14,%ax
    5e3b:	50                   	push   %ax
    5e3c:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    5e41:	9a 61 1e 02 06       	lcall  $0x602,$0x1e61
    5e46:	c7 06 32 2c 05 00    	movw   $0x5,0x2c32
    5e4c:	eb 04                	jmp    0x5e52
    5e4e:	ff 0e 32 2c          	decw   0x2c32
    5e52:	8b 3e 32 2c          	mov    0x2c32,%di
    5e56:	d1 e7                	shl    %di
    5e58:	d1 e7                	shl    %di
    5e5a:	ff b5 fc 2f          	push   0x2ffc(%di)
    5e5e:	ff b5 fa 2f          	push   0x2ffa(%di)
    5e62:	31 c0                	xor    %ax,%ax
    5e64:	50                   	push   %ax
    5e65:	ff 36 fa 2f          	push   0x2ffa
    5e69:	ff 36 fc 2f          	push   0x2ffc
    5e6d:	31 c0                	xor    %ax,%ax
    5e6f:	50                   	push   %ax
    5e70:	b0 02                	mov    $0x2,%al
    5e72:	50                   	push   %ax
    5e73:	b0 00                	mov    $0x0,%al
    5e75:	50                   	push   %ax
    5e76:	b0 00                	mov    $0x0,%al
    5e78:	50                   	push   %ax
    5e79:	b8 78 00             	mov    $0x78,%ax
    5e7c:	50                   	push   %ax
    5e7d:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    5e82:	83 3e 32 2c 01       	cmpw   $0x1,0x2c32
    5e87:	75 c5                	jne    0x5e4e
    5e89:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5e8f:	eb 04                	jmp    0x5e95
    5e91:	ff 06 32 2c          	incw   0x2c32
    5e95:	8b 3e 32 2c          	mov    0x2c32,%di
    5e99:	d1 e7                	shl    %di
    5e9b:	d1 e7                	shl    %di
    5e9d:	ff b5 fc 2f          	push   0x2ffc(%di)
    5ea1:	ff b5 fa 2f          	push   0x2ffa(%di)
    5ea5:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    5eaa:	83 3e 32 2c 07       	cmpw   $0x7,0x2c32
    5eaf:	75 e0                	jne    0x5e91
    5eb1:	bf 3c 3c             	mov    $0x3c3c,%di
    5eb4:	1e                   	push   %ds
    5eb5:	57                   	push   %di
    5eb6:	b8 3c 00             	mov    $0x3c,%ax
    5eb9:	50                   	push   %ax
    5eba:	9a f4 0c a3 0c       	lcall  $0xca3,$0xcf4
    5ebf:	0e                   	push   %cs
    5ec0:	e8 a8 d2             	call   0x316b
    5ec3:	bf 3c 3c             	mov    $0x3c3c,%di
    5ec6:	1e                   	push   %ds
    5ec7:	57                   	push   %di
    5ec8:	b8 3c 00             	mov    $0x3c,%ax
    5ecb:	50                   	push   %ax
    5ecc:	9a 5b 0a a3 0c       	lcall  $0xca3,$0xa5b
    5ed1:	a1 16 37             	mov    0x3716,%ax
    5ed4:	05 0f 00             	add    $0xf,%ax
    5ed7:	a3 80 45             	mov    %ax,0x4580
    5eda:	a1 20 37             	mov    0x3720,%ax
    5edd:	05 0c 00             	add    $0xc,%ax
    5ee0:	a3 82 45             	mov    %ax,0x4582
    5ee3:	80 3e 68 42 00       	cmpb   $0x0,0x4268
    5ee8:	74 0d                	je     0x5ef7
    5eea:	ff 36 80 45          	push   0x4580
    5eee:	ff 36 82 45          	push   0x4582
    5ef2:	9a 43 08 a3 0c       	lcall  $0xca3,$0x843
    5ef7:	83 3e be 5e 01       	cmpw   $0x1,0x5ebe
    5efc:	75 0f                	jne    0x5f0d
    5efe:	bf 10 40             	mov    $0x4010,%di
    5f01:	1e                   	push   %ds
    5f02:	57                   	push   %di
    5f03:	bf 14 40             	mov    $0x4014,%di
    5f06:	1e                   	push   %ds
    5f07:	57                   	push   %di
    5f08:	9a d1 01 f5 1b       	lcall  $0x1bf5,$0x1d1
    5f0d:	0e                   	push   %cs
    5f0e:	e8 32 d9             	call   0x3843
    5f11:	9a cd 0d 02 06       	lcall  $0x602,$0xdcd
    5f16:	bf 3c 3c             	mov    $0x3c3c,%di
    5f19:	1e                   	push   %ds
    5f1a:	57                   	push   %di
    5f1b:	b8 3c 00             	mov    $0x3c,%ax
    5f1e:	50                   	push   %ax
    5f1f:	9a f4 0c a3 0c       	lcall  $0xca3,$0xcf4
    5f24:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5f2a:	eb 04                	jmp    0x5f30
    5f2c:	ff 06 32 2c          	incw   0x2c32
    5f30:	8b 3e 32 2c          	mov    0x2c32,%di
    5f34:	d1 e7                	shl    %di
    5f36:	d1 e7                	shl    %di
    5f38:	ff b5 2a 40          	push   0x402a(%di)
    5f3c:	ff b5 28 40          	push   0x4028(%di)
    5f40:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    5f45:	83 3e 32 2c 04       	cmpw   $0x4,0x2c32
    5f4a:	75 e0                	jne    0x5f2c
    5f4c:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5f52:	eb 04                	jmp    0x5f58
    5f54:	ff 06 32 2c          	incw   0x2c32
    5f58:	c7 06 34 2c 01 00    	movw   $0x1,0x2c34
    5f5e:	eb 04                	jmp    0x5f64
    5f60:	ff 06 34 2c          	incw   0x2c34
    5f64:	a1 34 2c             	mov    0x2c34,%ax
    5f67:	d1 e0                	shl    %ax
    5f69:	d1 e0                	shl    %ax
    5f6b:	8b c8                	mov    %ax,%cx
    5f6d:	a1 32 2c             	mov    0x2c32,%ax
    5f70:	ba 30 00             	mov    $0x30,%dx
    5f73:	f7 e2                	mul    %dx
    5f75:	8b f8                	mov    %ax,%di
    5f77:	03 f9                	add    %cx,%di
    5f79:	ff b5 1c 3c          	push   0x3c1c(%di)
    5f7d:	ff b5 1a 3c          	push   0x3c1a(%di)
    5f81:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    5f86:	83 3e 34 2c 0c       	cmpw   $0xc,0x2c34
    5f8b:	75 d3                	jne    0x5f60
    5f8d:	83 3e 32 2c 02       	cmpw   $0x2,0x2c32
    5f92:	75 c0                	jne    0x5f54
    5f94:	c7 06 32 2c 01 00    	movw   $0x1,0x2c32
    5f9a:	eb 04                	jmp    0x5fa0
    5f9c:	ff 06 32 2c          	incw   0x2c32
    5fa0:	c7 06 34 2c 06 00    	movw   $0x6,0x2c34
    5fa6:	eb 04                	jmp    0x5fac
    5fa8:	ff 06 34 2c          	incw   0x2c34
    5fac:	a1 34 2c             	mov    0x2c34,%ax
    5faf:	d1 e0                	shl    %ax
    5fb1:	d1 e0                	shl    %ax
    5fb3:	8b c8                	mov    %ax,%cx
    5fb5:	a1 32 2c             	mov    0x2c32,%ax
    5fb8:	ba 24 00             	mov    $0x24,%dx
    5fbb:	f7 e2                	mul    %dx
    5fbd:	8b f8                	mov    %ax,%di
    5fbf:	03 f9                	add    %cx,%di
    5fc1:	ff b5 38 39          	push   0x3938(%di)
    5fc5:	ff b5 36 39          	push   0x3936(%di)
    5fc9:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    5fce:	83 3e 34 2c 0e       	cmpw   $0xe,0x2c34
    5fd3:	75 d3                	jne    0x5fa8
    5fd5:	83 3e 32 2c 04       	cmpw   $0x4,0x2c32
    5fda:	75 c0                	jne    0x5f9c
    5fdc:	31 c0                	xor    %ax,%ax
    5fde:	a3 32 2c             	mov    %ax,0x2c32
    5fe1:	eb 04                	jmp    0x5fe7
    5fe3:	ff 06 32 2c          	incw   0x2c32
    5fe7:	8b 3e 32 2c          	mov    0x2c32,%di
    5feb:	d1 e7                	shl    %di
    5fed:	d1 e7                	shl    %di
    5fef:	ff b5 18 39          	push   0x3918(%di)
    5ff3:	ff b5 16 39          	push   0x3916(%di)
    5ff7:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    5ffc:	83 3e 32 2c 16       	cmpw   $0x16,0x2c32
    6001:	75 e0                	jne    0x5fe3
    6003:	9a 36 07 a3 0c       	lcall  $0xca3,$0x736
    6008:	89 ec                	mov    %bp,%sp
    600a:	5d                   	pop    %bp
    600b:	31 c0                	xor    %ax,%ax
    600d:	9a d8 00 ce 1d       	lcall  $0x1dce,$0xd8
	...
    601e:	00 00                	add    %al,(%bx,%si)
    6020:	55                   	push   %bp
    6021:	89 e5                	mov    %sp,%bp
    6023:	83 ec 04             	sub    $0x4,%sp
    6026:	a1 f2 3b             	mov    0x3bf2,%ax
    6029:	d1 e0                	shl    %ax
    602b:	8b f0                	mov    %ax,%si
    602d:	d1 e0                	shl    %ax
    602f:	03 c6                	add    %si,%ax
    6031:	8b c8                	mov    %ax,%cx
    6033:	a0 02 3a             	mov    0x3a02,%al
    6036:	30 e4                	xor    %ah,%ah
    6038:	ba 48 00             	mov    $0x48,%dx
    603b:	f7 e2                	mul    %dx
    603d:	8b f8                	mov    %ax,%di
    603f:	03 f9                	add    %cx,%di
    6041:	81 c7 82 37          	add    $0x3782,%di
    6045:	89 7e fc             	mov    %di,-0x4(%bp)
    6048:	8c 5e fe             	mov    %ds,-0x2(%bp)
    604b:	c4 7e fc             	les    -0x4(%bp),%di
    604e:	26 8a 05             	mov    %es:(%di),%al
    6051:	8b 3e f6 3b          	mov    0x3bf6,%di
    6055:	88 85 f7 3b          	mov    %al,0x3bf7(%di)
    6059:	c4 7e fc             	les    -0x4(%bp),%di
    605c:	26 8a 45 01          	mov    %es:0x1(%di),%al
    6060:	8b 3e f6 3b          	mov    0x3bf6,%di
    6064:	88 85 0f 3c          	mov    %al,0x3c0f(%di)
    6068:	89 ec                	mov    %bp,%sp
    606a:	5d                   	pop    %bp
    606b:	cb                   	lret
    606c:	55                   	push   %bp
    606d:	89 e5                	mov    %sp,%bp
    606f:	83 ec 42             	sub    $0x42,%sp
    6072:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6077:	eb 03                	jmp    0x607c
    6079:	ff 46 fe             	incw   -0x2(%bp)
    607c:	c7 46 fc 06 00       	movw   $0x6,-0x4(%bp)
    6081:	eb 03                	jmp    0x6086
    6083:	ff 46 fc             	incw   -0x4(%bp)
    6086:	8b 46 fc             	mov    -0x4(%bp),%ax
    6089:	8b c8                	mov    %ax,%cx
    608b:	8b 46 fe             	mov    -0x2(%bp),%ax
    608e:	ba 09 00             	mov    $0x9,%dx
    6091:	f7 e2                	mul    %dx
    6093:	8b f8                	mov    %ax,%di
    6095:	03 f9                	add    %cx,%di
    6097:	c6 43 b5 00          	movb   $0x0,-0x4b(%bp,%di)
    609b:	83 7e fc 0e          	cmpw   $0xe,-0x4(%bp)
    609f:	75 e2                	jne    0x6083
    60a1:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    60a5:	75 d2                	jne    0x6079
    60a7:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    60ac:	eb 03                	jmp    0x60b1
    60ae:	ff 46 fe             	incw   -0x2(%bp)
    60b1:	8b 46 fe             	mov    -0x2(%bp),%ax
    60b4:	d1 e0                	shl    %ax
    60b6:	8b f0                	mov    %ax,%si
    60b8:	d1 e0                	shl    %ax
    60ba:	03 c6                	add    %si,%ax
    60bc:	8b c8                	mov    %ax,%cx
    60be:	a0 02 3a             	mov    0x3a02,%al
    60c1:	30 e4                	xor    %ah,%ah
    60c3:	ba 48 00             	mov    $0x48,%dx
    60c6:	f7 e2                	mul    %dx
    60c8:	8b f8                	mov    %ax,%di
    60ca:	03 f9                	add    %cx,%di
    60cc:	81 c7 82 37          	add    $0x3782,%di
    60d0:	89 7e be             	mov    %di,-0x42(%bp)
    60d3:	8c 5e c0             	mov    %ds,-0x40(%bp)
    60d6:	c4 7e be             	les    -0x42(%bp),%di
    60d9:	26 80 3d 00          	cmpb   $0x0,%es:(%di)
    60dd:	74 1e                	je     0x60fd
    60df:	c4 7e be             	les    -0x42(%bp),%di
    60e2:	26 8a 45 01          	mov    %es:0x1(%di),%al
    60e6:	98                   	cbtw
    60e7:	8b c8                	mov    %ax,%cx
    60e9:	c4 7e be             	les    -0x42(%bp),%di
    60ec:	26 8a 05             	mov    %es:(%di),%al
    60ef:	98                   	cbtw
    60f0:	ba 09 00             	mov    $0x9,%dx
    60f3:	f7 e2                	mul    %dx
    60f5:	8b f8                	mov    %ax,%di
    60f7:	03 f9                	add    %cx,%di
    60f9:	c6 43 b5 01          	movb   $0x1,-0x4b(%bp,%di)
    60fd:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    6101:	75 ab                	jne    0x60ae
    6103:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6108:	eb 03                	jmp    0x610d
    610a:	ff 46 fe             	incw   -0x2(%bp)
    610d:	8b 7e fe             	mov    -0x2(%bp),%di
    6110:	c6 85 cd 38 00       	movb   $0x0,0x38cd(%di)
    6115:	8b 7e fe             	mov    -0x2(%bp),%di
    6118:	c6 85 d5 38 00       	movb   $0x0,0x38d5(%di)
    611d:	8b 7e fe             	mov    -0x2(%bp),%di
    6120:	c6 85 dd 38 00       	movb   $0x0,0x38dd(%di)
    6125:	31 c0                	xor    %ax,%ax
    6127:	89 46 f8             	mov    %ax,-0x8(%bp)
    612a:	c6 46 c2 00          	movb   $0x0,-0x3e(%bp)
    612e:	8b 7e fe             	mov    -0x2(%bp),%di
    6131:	8a 85 bd 38          	mov    0x38bd(%di),%al
    6135:	30 e4                	xor    %ah,%ah
    6137:	48                   	dec    %ax
    6138:	89 46 c0             	mov    %ax,-0x40(%bp)
    613b:	b8 06 00             	mov    $0x6,%ax
    613e:	3b 46 c0             	cmp    -0x40(%bp),%ax
    6141:	7e 03                	jle    0x6146
    6143:	e9 9d 00             	jmp    0x61e3
    6146:	89 46 fc             	mov    %ax,-0x4(%bp)
    6149:	eb 03                	jmp    0x614e
    614b:	ff 46 fc             	incw   -0x4(%bp)
    614e:	c6 46 c3 00          	movb   $0x0,-0x3d(%bp)
    6152:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    6157:	eb 03                	jmp    0x615c
    6159:	ff 46 fa             	incw   -0x6(%bp)
    615c:	8b 46 fa             	mov    -0x6(%bp),%ax
    615f:	d1 e0                	shl    %ax
    6161:	8b f0                	mov    %ax,%si
    6163:	d1 e0                	shl    %ax
    6165:	03 c6                	add    %si,%ax
    6167:	8b c8                	mov    %ax,%cx
    6169:	a0 02 3a             	mov    0x3a02,%al
    616c:	30 e4                	xor    %ah,%ah
    616e:	ba 48 00             	mov    $0x48,%dx
    6171:	f7 e2                	mul    %dx
    6173:	8b f8                	mov    %ax,%di
    6175:	03 f9                	add    %cx,%di
    6177:	8a 85 82 37          	mov    0x3782(%di),%al
    617b:	98                   	cbtw
    617c:	3b 46 fe             	cmp    -0x2(%bp),%ax
    617f:	75 29                	jne    0x61aa
    6181:	8b 46 fa             	mov    -0x6(%bp),%ax
    6184:	d1 e0                	shl    %ax
    6186:	8b f0                	mov    %ax,%si
    6188:	d1 e0                	shl    %ax
    618a:	03 c6                	add    %si,%ax
    618c:	8b c8                	mov    %ax,%cx
    618e:	a0 02 3a             	mov    0x3a02,%al
    6191:	30 e4                	xor    %ah,%ah
    6193:	ba 48 00             	mov    $0x48,%dx
    6196:	f7 e2                	mul    %dx
    6198:	8b f8                	mov    %ax,%di
    619a:	03 f9                	add    %cx,%di
    619c:	8a 85 83 37          	mov    0x3783(%di),%al
    61a0:	98                   	cbtw
    61a1:	3b 46 fc             	cmp    -0x4(%bp),%ax
    61a4:	75 04                	jne    0x61aa
    61a6:	c6 46 c3 01          	movb   $0x1,-0x3d(%bp)
    61aa:	83 7e fa 0c          	cmpw   $0xc,-0x6(%bp)
    61ae:	75 a9                	jne    0x6159
    61b0:	80 7e c3 00          	cmpb   $0x0,-0x3d(%bp)
    61b4:	75 19                	jne    0x61cf
    61b6:	8b 7e fe             	mov    -0x2(%bp),%di
    61b9:	fe 85 cd 38          	incb   0x38cd(%di)
    61bd:	80 7e c2 00          	cmpb   $0x0,-0x3e(%bp)
    61c1:	75 07                	jne    0x61ca
    61c3:	8b 7e fe             	mov    -0x2(%bp),%di
    61c6:	fe 85 dd 38          	incb   0x38dd(%di)
    61ca:	ff 46 f8             	incw   -0x8(%bp)
    61cd:	eb 09                	jmp    0x61d8
    61cf:	c6 46 c2 01          	movb   $0x1,-0x3e(%bp)
    61d3:	31 c0                	xor    %ax,%ax
    61d5:	89 46 f8             	mov    %ax,-0x8(%bp)
    61d8:	8b 46 fc             	mov    -0x4(%bp),%ax
    61db:	3b 46 c0             	cmp    -0x40(%bp),%ax
    61de:	74 03                	je     0x61e3
    61e0:	e9 68 ff             	jmp    0x614b
    61e3:	8a 46 f8             	mov    -0x8(%bp),%al
    61e6:	8b 7e fe             	mov    -0x2(%bp),%di
    61e9:	88 85 d5 38          	mov    %al,0x38d5(%di)
    61ed:	8b 7e fe             	mov    -0x2(%bp),%di
    61f0:	c6 85 d1 38 00       	movb   $0x0,0x38d1(%di)
    61f5:	8b 7e fe             	mov    -0x2(%bp),%di
    61f8:	c6 85 d9 38 00       	movb   $0x0,0x38d9(%di)
    61fd:	8b 7e fe             	mov    -0x2(%bp),%di
    6200:	c6 85 e1 38 00       	movb   $0x0,0x38e1(%di)
    6205:	31 c0                	xor    %ax,%ax
    6207:	89 46 f8             	mov    %ax,-0x8(%bp)
    620a:	c6 46 c2 00          	movb   $0x0,-0x3e(%bp)
    620e:	8b 7e fe             	mov    -0x2(%bp),%di
    6211:	8a 85 c1 38          	mov    0x38c1(%di),%al
    6215:	30 e4                	xor    %ah,%ah
    6217:	40                   	inc    %ax
    6218:	89 46 c0             	mov    %ax,-0x40(%bp)
    621b:	b8 0e 00             	mov    $0xe,%ax
    621e:	3b 46 c0             	cmp    -0x40(%bp),%ax
    6221:	7d 03                	jge    0x6226
    6223:	e9 9d 00             	jmp    0x62c3
    6226:	89 46 fc             	mov    %ax,-0x4(%bp)
    6229:	eb 03                	jmp    0x622e
    622b:	ff 4e fc             	decw   -0x4(%bp)
    622e:	c6 46 c3 00          	movb   $0x0,-0x3d(%bp)
    6232:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    6237:	eb 03                	jmp    0x623c
    6239:	ff 46 fa             	incw   -0x6(%bp)
    623c:	8b 46 fa             	mov    -0x6(%bp),%ax
    623f:	d1 e0                	shl    %ax
    6241:	8b f0                	mov    %ax,%si
    6243:	d1 e0                	shl    %ax
    6245:	03 c6                	add    %si,%ax
    6247:	8b c8                	mov    %ax,%cx
    6249:	a0 02 3a             	mov    0x3a02,%al
    624c:	30 e4                	xor    %ah,%ah
    624e:	ba 48 00             	mov    $0x48,%dx
    6251:	f7 e2                	mul    %dx
    6253:	8b f8                	mov    %ax,%di
    6255:	03 f9                	add    %cx,%di
    6257:	8a 85 82 37          	mov    0x3782(%di),%al
    625b:	98                   	cbtw
    625c:	3b 46 fe             	cmp    -0x2(%bp),%ax
    625f:	75 29                	jne    0x628a
    6261:	8b 46 fa             	mov    -0x6(%bp),%ax
    6264:	d1 e0                	shl    %ax
    6266:	8b f0                	mov    %ax,%si
    6268:	d1 e0                	shl    %ax
    626a:	03 c6                	add    %si,%ax
    626c:	8b c8                	mov    %ax,%cx
    626e:	a0 02 3a             	mov    0x3a02,%al
    6271:	30 e4                	xor    %ah,%ah
    6273:	ba 48 00             	mov    $0x48,%dx
    6276:	f7 e2                	mul    %dx
    6278:	8b f8                	mov    %ax,%di
    627a:	03 f9                	add    %cx,%di
    627c:	8a 85 83 37          	mov    0x3783(%di),%al
    6280:	98                   	cbtw
    6281:	3b 46 fc             	cmp    -0x4(%bp),%ax
    6284:	75 04                	jne    0x628a
    6286:	c6 46 c3 01          	movb   $0x1,-0x3d(%bp)
    628a:	83 7e fa 0c          	cmpw   $0xc,-0x6(%bp)
    628e:	75 a9                	jne    0x6239
    6290:	80 7e c3 00          	cmpb   $0x0,-0x3d(%bp)
    6294:	75 19                	jne    0x62af
    6296:	8b 7e fe             	mov    -0x2(%bp),%di
    6299:	fe 85 d1 38          	incb   0x38d1(%di)
    629d:	80 7e c2 00          	cmpb   $0x0,-0x3e(%bp)
    62a1:	75 07                	jne    0x62aa
    62a3:	8b 7e fe             	mov    -0x2(%bp),%di
    62a6:	fe 85 e1 38          	incb   0x38e1(%di)
    62aa:	ff 46 f8             	incw   -0x8(%bp)
    62ad:	eb 09                	jmp    0x62b8
    62af:	c6 46 c2 01          	movb   $0x1,-0x3e(%bp)
    62b3:	31 c0                	xor    %ax,%ax
    62b5:	89 46 f8             	mov    %ax,-0x8(%bp)
    62b8:	8b 46 fc             	mov    -0x4(%bp),%ax
    62bb:	3b 46 c0             	cmp    -0x40(%bp),%ax
    62be:	74 03                	je     0x62c3
    62c0:	e9 68 ff             	jmp    0x622b
    62c3:	8a 46 f8             	mov    -0x8(%bp),%al
    62c6:	8b 7e fe             	mov    -0x2(%bp),%di
    62c9:	88 85 d9 38          	mov    %al,0x38d9(%di)
    62cd:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    62d1:	74 03                	je     0x62d6
    62d3:	e9 34 fe             	jmp    0x610a
    62d6:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    62db:	74 03                	je     0x62e0
    62dd:	e9 72 02             	jmp    0x6552
    62e0:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    62e5:	eb 03                	jmp    0x62ea
    62e7:	ff 46 fe             	incw   -0x2(%bp)
    62ea:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    62ef:	eb 03                	jmp    0x62f4
    62f1:	ff 46 fc             	incw   -0x4(%bp)
    62f4:	8b 46 fe             	mov    -0x2(%bp),%ax
    62f7:	8b 7e fc             	mov    -0x4(%bp),%di
    62fa:	d1 e7                	shl    %di
    62fc:	d1 e7                	shl    %di
    62fe:	03 f8                	add    %ax,%di
    6300:	80 bd b9 38 09       	cmpb   $0x9,0x38b9(%di)
    6305:	74 3b                	je     0x6342
    6307:	8b 46 fe             	mov    -0x2(%bp),%ax
    630a:	8b 7e fc             	mov    -0x4(%bp),%di
    630d:	d1 e7                	shl    %di
    630f:	d1 e7                	shl    %di
    6311:	03 f8                	add    %ax,%di
    6313:	8a 85 d9 38          	mov    0x38d9(%di),%al
    6317:	30 e4                	xor    %ah,%ah
    6319:	8b d0                	mov    %ax,%dx
    631b:	8b 46 fe             	mov    -0x2(%bp),%ax
    631e:	8b 7e fc             	mov    -0x4(%bp),%di
    6321:	d1 e7                	shl    %di
    6323:	d1 e7                	shl    %di
    6325:	03 f8                	add    %ax,%di
    6327:	8a 85 c9 38          	mov    0x38c9(%di),%al
    632b:	30 e4                	xor    %ah,%ah
    632d:	2b c2                	sub    %dx,%ax
    632f:	8b d0                	mov    %ax,%dx
    6331:	8b 46 fe             	mov    -0x2(%bp),%ax
    6334:	d1 e0                	shl    %ax
    6336:	8b 7e fc             	mov    -0x4(%bp),%di
    6339:	b1 03                	mov    $0x3,%cl
    633b:	d3 e7                	shl    %cl,%di
    633d:	03 f8                	add    %ax,%di
    633f:	89 53 de             	mov    %dx,-0x22(%bp,%di)
    6342:	83 7e fc 02          	cmpw   $0x2,-0x4(%bp)
    6346:	75 a9                	jne    0x62f1
    6348:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    634c:	75 99                	jne    0x62e7
    634e:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6353:	eb 03                	jmp    0x6358
    6355:	ff 46 fe             	incw   -0x2(%bp)
    6358:	8b 7e fe             	mov    -0x2(%bp),%di
    635b:	80 bd bd 38 09       	cmpb   $0x9,0x38bd(%di)
    6360:	74 03                	je     0x6365
    6362:	e9 42 01             	jmp    0x64a7
    6365:	8b 7e fe             	mov    -0x2(%bp),%di
    6368:	d1 e7                	shl    %di
    636a:	31 c0                	xor    %ax,%ax
    636c:	89 43 e6             	mov    %ax,-0x1a(%bp,%di)
    636f:	8b 7e fe             	mov    -0x2(%bp),%di
    6372:	d1 e7                	shl    %di
    6374:	31 c0                	xor    %ax,%ax
    6376:	89 43 ee             	mov    %ax,-0x12(%bp,%di)
    6379:	8b 7e fe             	mov    -0x2(%bp),%di
    637c:	80 bd cd 38 03       	cmpb   $0x3,0x38cd(%di)
    6381:	75 26                	jne    0x63a9
    6383:	8b 7e fe             	mov    -0x2(%bp),%di
    6386:	8a 85 d1 38          	mov    0x38d1(%di),%al
    638a:	8b 7e fe             	mov    -0x2(%bp),%di
    638d:	3a 85 e1 38          	cmp    0x38e1(%di),%al
    6391:	75 0c                	jne    0x639f
    6393:	8b 7e fe             	mov    -0x2(%bp),%di
    6396:	d1 e7                	shl    %di
    6398:	31 c0                	xor    %ax,%ax
    639a:	89 43 e6             	mov    %ax,-0x1a(%bp,%di)
    639d:	eb 0a                	jmp    0x63a9
    639f:	8b 7e fe             	mov    -0x2(%bp),%di
    63a2:	d1 e7                	shl    %di
    63a4:	c7 43 e6 03 00       	movw   $0x3,-0x1a(%bp,%di)
    63a9:	8b 7e fe             	mov    -0x2(%bp),%di
    63ac:	80 bd cd 38 03       	cmpb   $0x3,0x38cd(%di)
    63b1:	74 1e                	je     0x63d1
    63b3:	8b 7e fe             	mov    -0x2(%bp),%di
    63b6:	8a 85 dd 38          	mov    0x38dd(%di),%al
    63ba:	30 e4                	xor    %ah,%ah
    63bc:	8b d0                	mov    %ax,%dx
    63be:	8b 7e fe             	mov    -0x2(%bp),%di
    63c1:	8a 85 cd 38          	mov    0x38cd(%di),%al
    63c5:	30 e4                	xor    %ah,%ah
    63c7:	2b c2                	sub    %dx,%ax
    63c9:	8b 7e fe             	mov    -0x2(%bp),%di
    63cc:	d1 e7                	shl    %di
    63ce:	89 43 e6             	mov    %ax,-0x1a(%bp,%di)
    63d1:	8b 7e fe             	mov    -0x2(%bp),%di
    63d4:	80 bd d1 38 05       	cmpb   $0x5,0x38d1(%di)
    63d9:	75 26                	jne    0x6401
    63db:	8b 7e fe             	mov    -0x2(%bp),%di
    63de:	8a 85 cd 38          	mov    0x38cd(%di),%al
    63e2:	8b 7e fe             	mov    -0x2(%bp),%di
    63e5:	3a 85 dd 38          	cmp    0x38dd(%di),%al
    63e9:	75 0c                	jne    0x63f7
    63eb:	8b 7e fe             	mov    -0x2(%bp),%di
    63ee:	d1 e7                	shl    %di
    63f0:	31 c0                	xor    %ax,%ax
    63f2:	89 43 ee             	mov    %ax,-0x12(%bp,%di)
    63f5:	eb 0a                	jmp    0x6401
    63f7:	8b 7e fe             	mov    -0x2(%bp),%di
    63fa:	d1 e7                	shl    %di
    63fc:	c7 43 ee 05 00       	movw   $0x5,-0x12(%bp,%di)
    6401:	8b 7e fe             	mov    -0x2(%bp),%di
    6404:	80 bd d1 38 05       	cmpb   $0x5,0x38d1(%di)
    6409:	74 1e                	je     0x6429
    640b:	8b 7e fe             	mov    -0x2(%bp),%di
    640e:	8a 85 e1 38          	mov    0x38e1(%di),%al
    6412:	30 e4                	xor    %ah,%ah
    6414:	8b d0                	mov    %ax,%dx
    6416:	8b 7e fe             	mov    -0x2(%bp),%di
    6419:	8a 85 d1 38          	mov    0x38d1(%di),%al
    641d:	30 e4                	xor    %ah,%ah
    641f:	2b c2                	sub    %dx,%ax
    6421:	8b 7e fe             	mov    -0x2(%bp),%di
    6424:	d1 e7                	shl    %di
    6426:	89 43 ee             	mov    %ax,-0x12(%bp,%di)
    6429:	8b 7e fe             	mov    -0x2(%bp),%di
    642c:	d1 e7                	shl    %di
    642e:	8b 43 e6             	mov    -0x1a(%bp,%di),%ax
    6431:	8b 7e fe             	mov    -0x2(%bp),%di
    6434:	d1 e7                	shl    %di
    6436:	03 43 ee             	add    -0x12(%bp,%di),%ax
    6439:	8b 7e fe             	mov    -0x2(%bp),%di
    643c:	d1 e7                	shl    %di
    643e:	89 43 e6             	mov    %ax,-0x1a(%bp,%di)
    6441:	8b 7e fe             	mov    -0x2(%bp),%di
    6444:	d1 e7                	shl    %di
    6446:	8b 43 e6             	mov    -0x1a(%bp,%di),%ax
    6449:	8b 7e fe             	mov    -0x2(%bp),%di
    644c:	d1 e7                	shl    %di
    644e:	89 43 ee             	mov    %ax,-0x12(%bp,%di)
    6451:	8b 7e fe             	mov    -0x2(%bp),%di
    6454:	8a 85 d9 38          	mov    0x38d9(%di),%al
    6458:	30 e4                	xor    %ah,%ah
    645a:	8b d0                	mov    %ax,%dx
    645c:	8b 7e fe             	mov    -0x2(%bp),%di
    645f:	8a 85 d5 38          	mov    0x38d5(%di),%al
    6463:	30 e4                	xor    %ah,%ah
    6465:	03 c2                	add    %dx,%ax
    6467:	8b 7e fe             	mov    -0x2(%bp),%di
    646a:	88 85 d5 38          	mov    %al,0x38d5(%di)
    646e:	8b 7e fe             	mov    -0x2(%bp),%di
    6471:	8a 85 d5 38          	mov    0x38d5(%di),%al
    6475:	8b 7e fe             	mov    -0x2(%bp),%di
    6478:	88 85 d9 38          	mov    %al,0x38d9(%di)
    647c:	8b 7e fe             	mov    -0x2(%bp),%di
    647f:	8a 85 e1 38          	mov    0x38e1(%di),%al
    6483:	30 e4                	xor    %ah,%ah
    6485:	8b d0                	mov    %ax,%dx
    6487:	8b 7e fe             	mov    -0x2(%bp),%di
    648a:	8a 85 dd 38          	mov    0x38dd(%di),%al
    648e:	30 e4                	xor    %ah,%ah
    6490:	03 c2                	add    %dx,%ax
    6492:	8b 7e fe             	mov    -0x2(%bp),%di
    6495:	88 85 dd 38          	mov    %al,0x38dd(%di)
    6499:	8b 7e fe             	mov    -0x2(%bp),%di
    649c:	8a 85 dd 38          	mov    0x38dd(%di),%al
    64a0:	8b 7e fe             	mov    -0x2(%bp),%di
    64a3:	88 85 e1 38          	mov    %al,0x38e1(%di)
    64a7:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    64ab:	74 03                	je     0x64b0
    64ad:	e9 a5 fe             	jmp    0x6355
    64b0:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    64b5:	eb 03                	jmp    0x64ba
    64b7:	ff 46 fe             	incw   -0x2(%bp)
    64ba:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    64bf:	eb 03                	jmp    0x64c4
    64c1:	ff 46 fc             	incw   -0x4(%bp)
    64c4:	8b 46 fe             	mov    -0x2(%bp),%ax
    64c7:	d1 e0                	shl    %ax
    64c9:	8b 7e fc             	mov    -0x4(%bp),%di
    64cc:	b1 03                	mov    $0x3,%cl
    64ce:	d3 e7                	shl    %cl,%di
    64d0:	03 f8                	add    %ax,%di
    64d2:	83 7b de 00          	cmpw   $0x0,-0x22(%bp,%di)
    64d6:	75 11                	jne    0x64e9
    64d8:	8b 46 fe             	mov    -0x2(%bp),%ax
    64db:	8b 7e fc             	mov    -0x4(%bp),%di
    64de:	d1 e7                	shl    %di
    64e0:	d1 e7                	shl    %di
    64e2:	03 f8                	add    %ax,%di
    64e4:	c6 85 c1 38 00       	movb   $0x0,0x38c1(%di)
    64e9:	8b 46 fe             	mov    -0x2(%bp),%ax
    64ec:	d1 e0                	shl    %ax
    64ee:	8b 7e fc             	mov    -0x4(%bp),%di
    64f1:	b1 03                	mov    $0x3,%cl
    64f3:	d3 e7                	shl    %cl,%di
    64f5:	03 f8                	add    %ax,%di
    64f7:	83 7b de 00          	cmpw   $0x0,-0x22(%bp,%di)
    64fb:	74 28                	je     0x6525
    64fd:	8b 46 fe             	mov    -0x2(%bp),%ax
    6500:	d1 e0                	shl    %ax
    6502:	8b 7e fc             	mov    -0x4(%bp),%di
    6505:	b1 03                	mov    $0x3,%cl
    6507:	d3 e7                	shl    %cl,%di
    6509:	03 f8                	add    %ax,%di
    650b:	8b 53 de             	mov    -0x22(%bp,%di),%dx
    650e:	b8 08 00             	mov    $0x8,%ax
    6511:	2b c2                	sub    %dx,%ax
    6513:	8a d0                	mov    %al,%dl
    6515:	8b 46 fe             	mov    -0x2(%bp),%ax
    6518:	8b 7e fc             	mov    -0x4(%bp),%di
    651b:	d1 e7                	shl    %di
    651d:	d1 e7                	shl    %di
    651f:	03 f8                	add    %ax,%di
    6521:	88 95 c1 38          	mov    %dl,0x38c1(%di)
    6525:	8b 46 fe             	mov    -0x2(%bp),%ax
    6528:	8b 7e fc             	mov    -0x4(%bp),%di
    652b:	d1 e7                	shl    %di
    652d:	d1 e7                	shl    %di
    652f:	03 f8                	add    %ax,%di
    6531:	80 bd b9 38 09       	cmpb   $0x9,0x38b9(%di)
    6536:	75 08                	jne    0x6540
    6538:	8b 7e fe             	mov    -0x2(%bp),%di
    653b:	c6 85 c9 38 00       	movb   $0x0,0x38c9(%di)
    6540:	83 7e fc 02          	cmpw   $0x2,-0x4(%bp)
    6544:	74 03                	je     0x6549
    6546:	e9 78 ff             	jmp    0x64c1
    6549:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    654d:	74 03                	je     0x6552
    654f:	e9 65 ff             	jmp    0x64b7
    6552:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    6557:	75 03                	jne    0x655c
    6559:	e9 55 01             	jmp    0x66b1
    655c:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6561:	eb 03                	jmp    0x6566
    6563:	ff 46 fe             	incw   -0x2(%bp)
    6566:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    656b:	eb 03                	jmp    0x6570
    656d:	ff 46 fc             	incw   -0x4(%bp)
    6570:	8b 46 fe             	mov    -0x2(%bp),%ax
    6573:	8b 7e fc             	mov    -0x4(%bp),%di
    6576:	d1 e7                	shl    %di
    6578:	d1 e7                	shl    %di
    657a:	03 f8                	add    %ax,%di
    657c:	8a 85 d9 38          	mov    0x38d9(%di),%al
    6580:	30 e4                	xor    %ah,%ah
    6582:	8b d0                	mov    %ax,%dx
    6584:	8b 46 fe             	mov    -0x2(%bp),%ax
    6587:	8b 7e fc             	mov    -0x4(%bp),%di
    658a:	d1 e7                	shl    %di
    658c:	d1 e7                	shl    %di
    658e:	03 f8                	add    %ax,%di
    6590:	8a 85 c9 38          	mov    0x38c9(%di),%al
    6594:	30 e4                	xor    %ah,%ah
    6596:	2b c2                	sub    %dx,%ax
    6598:	8b d0                	mov    %ax,%dx
    659a:	8b 46 fe             	mov    -0x2(%bp),%ax
    659d:	d1 e0                	shl    %ax
    659f:	8b 7e fc             	mov    -0x4(%bp),%di
    65a2:	b1 03                	mov    $0x3,%cl
    65a4:	d3 e7                	shl    %cl,%di
    65a6:	03 f8                	add    %ax,%di
    65a8:	89 53 de             	mov    %dx,-0x22(%bp,%di)
    65ab:	83 7e fc 02          	cmpw   $0x2,-0x4(%bp)
    65af:	75 bc                	jne    0x656d
    65b1:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    65b5:	75 ac                	jne    0x6563
    65b7:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    65bc:	eb 03                	jmp    0x65c1
    65be:	ff 46 fe             	incw   -0x2(%bp)
    65c1:	8b 7e fe             	mov    -0x2(%bp),%di
    65c4:	80 bd bd 38 09       	cmpb   $0x9,0x38bd(%di)
    65c9:	74 03                	je     0x65ce
    65cb:	e9 7e 00             	jmp    0x664c
    65ce:	8b 7e fe             	mov    -0x2(%bp),%di
    65d1:	d1 e7                	shl    %di
    65d3:	8b 43 e6             	mov    -0x1a(%bp,%di),%ax
    65d6:	8b 7e fe             	mov    -0x2(%bp),%di
    65d9:	d1 e7                	shl    %di
    65db:	03 43 ee             	add    -0x12(%bp,%di),%ax
    65de:	8b 7e fe             	mov    -0x2(%bp),%di
    65e1:	d1 e7                	shl    %di
    65e3:	89 43 e6             	mov    %ax,-0x1a(%bp,%di)
    65e6:	8b 7e fe             	mov    -0x2(%bp),%di
    65e9:	d1 e7                	shl    %di
    65eb:	8b 43 e6             	mov    -0x1a(%bp,%di),%ax
    65ee:	8b 7e fe             	mov    -0x2(%bp),%di
    65f1:	d1 e7                	shl    %di
    65f3:	89 43 ee             	mov    %ax,-0x12(%bp,%di)
    65f6:	8b 7e fe             	mov    -0x2(%bp),%di
    65f9:	8a 85 d9 38          	mov    0x38d9(%di),%al
    65fd:	30 e4                	xor    %ah,%ah
    65ff:	8b d0                	mov    %ax,%dx
    6601:	8b 7e fe             	mov    -0x2(%bp),%di
    6604:	8a 85 d5 38          	mov    0x38d5(%di),%al
    6608:	30 e4                	xor    %ah,%ah
    660a:	03 c2                	add    %dx,%ax
    660c:	8b 7e fe             	mov    -0x2(%bp),%di
    660f:	88 85 d5 38          	mov    %al,0x38d5(%di)
    6613:	8b 7e fe             	mov    -0x2(%bp),%di
    6616:	8a 85 d5 38          	mov    0x38d5(%di),%al
    661a:	8b 7e fe             	mov    -0x2(%bp),%di
    661d:	88 85 d9 38          	mov    %al,0x38d9(%di)
    6621:	8b 7e fe             	mov    -0x2(%bp),%di
    6624:	8a 85 e1 38          	mov    0x38e1(%di),%al
    6628:	30 e4                	xor    %ah,%ah
    662a:	8b d0                	mov    %ax,%dx
    662c:	8b 7e fe             	mov    -0x2(%bp),%di
    662f:	8a 85 dd 38          	mov    0x38dd(%di),%al
    6633:	30 e4                	xor    %ah,%ah
    6635:	03 c2                	add    %dx,%ax
    6637:	8b 7e fe             	mov    -0x2(%bp),%di
    663a:	88 85 dd 38          	mov    %al,0x38dd(%di)
    663e:	8b 7e fe             	mov    -0x2(%bp),%di
    6641:	8a 85 dd 38          	mov    0x38dd(%di),%al
    6645:	8b 7e fe             	mov    -0x2(%bp),%di
    6648:	88 85 e1 38          	mov    %al,0x38e1(%di)
    664c:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    6650:	74 03                	je     0x6655
    6652:	e9 69 ff             	jmp    0x65be
    6655:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    665a:	eb 03                	jmp    0x665f
    665c:	ff 46 fe             	incw   -0x2(%bp)
    665f:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    6664:	eb 03                	jmp    0x6669
    6666:	ff 46 fc             	incw   -0x4(%bp)
    6669:	8b 46 fe             	mov    -0x2(%bp),%ax
    666c:	d1 e0                	shl    %ax
    666e:	8b 7e fc             	mov    -0x4(%bp),%di
    6671:	b1 03                	mov    $0x3,%cl
    6673:	d3 e7                	shl    %cl,%di
    6675:	03 f8                	add    %ax,%di
    6677:	8a 53 de             	mov    -0x22(%bp,%di),%dl
    667a:	8b 46 fe             	mov    -0x2(%bp),%ax
    667d:	8b 7e fc             	mov    -0x4(%bp),%di
    6680:	d1 e7                	shl    %di
    6682:	d1 e7                	shl    %di
    6684:	03 f8                	add    %ax,%di
    6686:	88 95 c1 38          	mov    %dl,0x38c1(%di)
    668a:	8b 46 fe             	mov    -0x2(%bp),%ax
    668d:	8b 7e fc             	mov    -0x4(%bp),%di
    6690:	d1 e7                	shl    %di
    6692:	d1 e7                	shl    %di
    6694:	03 f8                	add    %ax,%di
    6696:	80 bd b9 38 09       	cmpb   $0x9,0x38b9(%di)
    669b:	75 08                	jne    0x66a5
    669d:	8b 7e fe             	mov    -0x2(%bp),%di
    66a0:	c6 85 c9 38 00       	movb   $0x0,0x38c9(%di)
    66a5:	83 7e fc 02          	cmpw   $0x2,-0x4(%bp)
    66a9:	75 bb                	jne    0x6666
    66ab:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    66af:	75 ab                	jne    0x665c
    66b1:	89 ec                	mov    %bp,%sp
    66b3:	5d                   	pop    %bp
    66b4:	cb                   	lret
    66b5:	55                   	push   %bp
    66b6:	89 e5                	mov    %sp,%bp
    66b8:	83 ec 0c             	sub    $0xc,%sp
    66bb:	31 c0                	xor    %ax,%ax
    66bd:	a3 e2 3b             	mov    %ax,0x3be2
    66c0:	8b 46 06             	mov    0x6(%bp),%ax
    66c3:	d1 e0                	shl    %ax
    66c5:	8b f0                	mov    %ax,%si
    66c7:	d1 e0                	shl    %ax
    66c9:	03 c6                	add    %si,%ax
    66cb:	8b c8                	mov    %ax,%cx
    66cd:	a0 02 3a             	mov    0x3a02,%al
    66d0:	30 e4                	xor    %ah,%ah
    66d2:	ba 48 00             	mov    $0x48,%dx
    66d5:	f7 e2                	mul    %dx
    66d7:	8b f8                	mov    %ax,%di
    66d9:	03 f9                	add    %cx,%di
    66db:	81 c7 82 37          	add    $0x3782,%di
    66df:	89 7e f6             	mov    %di,-0xa(%bp)
    66e2:	8c 5e f8             	mov    %ds,-0x8(%bp)
    66e5:	c4 7e f6             	les    -0xa(%bp),%di
    66e8:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    66ed:	7f 03                	jg     0x66f2
    66ef:	e9 9a 01             	jmp    0x688c
    66f2:	c4 7e f6             	les    -0xa(%bp),%di
    66f5:	26 8a 45 01          	mov    %es:0x1(%di),%al
    66f9:	98                   	cbtw
    66fa:	48                   	dec    %ax
    66fb:	89 46 f4             	mov    %ax,-0xc(%bp)
    66fe:	b8 09 00             	mov    $0x9,%ax
    6701:	3b 46 f4             	cmp    -0xc(%bp),%ax
    6704:	7e 03                	jle    0x6709
    6706:	e9 83 01             	jmp    0x688c
    6709:	89 46 fe             	mov    %ax,-0x2(%bp)
    670c:	eb 03                	jmp    0x6711
    670e:	ff 46 fe             	incw   -0x2(%bp)
    6711:	8b 46 fe             	mov    -0x2(%bp),%ax
    6714:	8b c8                	mov    %ax,%cx
    6716:	c4 7e f6             	les    -0xa(%bp),%di
    6719:	26 8a 05             	mov    %es:(%di),%al
    671c:	98                   	cbtw
    671d:	ba 09 00             	mov    $0x9,%dx
    6720:	f7 e2                	mul    %dx
    6722:	8b f8                	mov    %ax,%di
    6724:	03 f9                	add    %cx,%di
    6726:	80 bd 53 30 00       	cmpb   $0x0,0x3053(%di)
    672b:	74 7b                	je     0x67a8
    672d:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    6731:	75 21                	jne    0x6754
    6733:	8b 46 fe             	mov    -0x2(%bp),%ax
    6736:	8b c8                	mov    %ax,%cx
    6738:	c4 7e f6             	les    -0xa(%bp),%di
    673b:	26 8a 05             	mov    %es:(%di),%al
    673e:	98                   	cbtw
    673f:	ba 09 00             	mov    $0x9,%dx
    6742:	f7 e2                	mul    %dx
    6744:	8b f8                	mov    %ax,%di
    6746:	03 f9                	add    %cx,%di
    6748:	8a 85 53 30          	mov    0x3053(%di),%al
    674c:	30 e4                	xor    %ah,%ah
    674e:	48                   	dec    %ax
    674f:	89 46 fa             	mov    %ax,-0x6(%bp)
    6752:	eb 3e                	jmp    0x6792
    6754:	8b 46 fe             	mov    -0x2(%bp),%ax
    6757:	48                   	dec    %ax
    6758:	8b c8                	mov    %ax,%cx
    675a:	c4 7e f6             	les    -0xa(%bp),%di
    675d:	26 8a 05             	mov    %es:(%di),%al
    6760:	98                   	cbtw
    6761:	ba 09 00             	mov    $0x9,%dx
    6764:	f7 e2                	mul    %dx
    6766:	8b f8                	mov    %ax,%di
    6768:	03 f9                	add    %cx,%di
    676a:	8a 85 77 30          	mov    0x3077(%di),%al
    676e:	30 e4                	xor    %ah,%ah
    6770:	8b d8                	mov    %ax,%bx
    6772:	8b 46 fe             	mov    -0x2(%bp),%ax
    6775:	8b c8                	mov    %ax,%cx
    6777:	c4 7e f6             	les    -0xa(%bp),%di
    677a:	26 8a 05             	mov    %es:(%di),%al
    677d:	98                   	cbtw
    677e:	ba 09 00             	mov    $0x9,%dx
    6781:	f7 e2                	mul    %dx
    6783:	8b f8                	mov    %ax,%di
    6785:	03 f9                	add    %cx,%di
    6787:	8a 85 53 30          	mov    0x3053(%di),%al
    678b:	30 e4                	xor    %ah,%ah
    678d:	2b c3                	sub    %bx,%ax
    678f:	89 46 fa             	mov    %ax,-0x6(%bp)
    6792:	8b 46 fa             	mov    -0x6(%bp),%ax
    6795:	99                   	cwtd
    6796:	b9 03 00             	mov    $0x3,%cx
    6799:	f7 f9                	idiv   %cx
    679b:	48                   	dec    %ax
    679c:	89 46 fa             	mov    %ax,-0x6(%bp)
    679f:	a1 e2 3b             	mov    0x3be2,%ax
    67a2:	2b 46 fa             	sub    -0x6(%bp),%ax
    67a5:	a3 e2 3b             	mov    %ax,0x3be2
    67a8:	8b 46 fe             	mov    -0x2(%bp),%ax
    67ab:	8b d8                	mov    %ax,%bx
    67ad:	c4 7e f6             	les    -0xa(%bp),%di
    67b0:	26 8a 05             	mov    %es:(%di),%al
    67b3:	98                   	cbtw
    67b4:	ba 09 00             	mov    $0x9,%dx
    67b7:	f7 e2                	mul    %dx
    67b9:	8b c8                	mov    %ax,%cx
    67bb:	a0 02 3a             	mov    0x3a02,%al
    67be:	30 e4                	xor    %ah,%ah
    67c0:	8b d0                	mov    %ax,%dx
    67c2:	b8 03 00             	mov    $0x3,%ax
    67c5:	2b c2                	sub    %dx,%ax
    67c7:	ba 24 00             	mov    $0x24,%dx
    67ca:	f7 e2                	mul    %dx
    67cc:	8b f8                	mov    %ax,%di
    67ce:	03 f9                	add    %cx,%di
    67d0:	03 fb                	add    %bx,%di
    67d2:	80 bd e7 2f 00       	cmpb   $0x0,0x2fe7(%di)
    67d7:	75 03                	jne    0x67dc
    67d9:	e9 a5 00             	jmp    0x6881
    67dc:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    67e0:	75 36                	jne    0x6818
    67e2:	8b 46 fe             	mov    -0x2(%bp),%ax
    67e5:	8b d8                	mov    %ax,%bx
    67e7:	c4 7e f6             	les    -0xa(%bp),%di
    67ea:	26 8a 05             	mov    %es:(%di),%al
    67ed:	98                   	cbtw
    67ee:	ba 09 00             	mov    $0x9,%dx
    67f1:	f7 e2                	mul    %dx
    67f3:	8b c8                	mov    %ax,%cx
    67f5:	a0 02 3a             	mov    0x3a02,%al
    67f8:	30 e4                	xor    %ah,%ah
    67fa:	8b d0                	mov    %ax,%dx
    67fc:	b8 03 00             	mov    $0x3,%ax
    67ff:	2b c2                	sub    %dx,%ax
    6801:	ba 24 00             	mov    $0x24,%dx
    6804:	f7 e2                	mul    %dx
    6806:	8b f8                	mov    %ax,%di
    6808:	03 f9                	add    %cx,%di
    680a:	03 fb                	add    %bx,%di
    680c:	8a 85 e7 2f          	mov    0x2fe7(%di),%al
    6810:	30 e4                	xor    %ah,%ah
    6812:	48                   	dec    %ax
    6813:	89 46 fa             	mov    %ax,-0x6(%bp)
    6816:	eb 53                	jmp    0x686b
    6818:	8b 46 fe             	mov    -0x2(%bp),%ax
    681b:	48                   	dec    %ax
    681c:	8b c8                	mov    %ax,%cx
    681e:	c4 7e f6             	les    -0xa(%bp),%di
    6821:	26 8a 05             	mov    %es:(%di),%al
    6824:	98                   	cbtw
    6825:	ba 09 00             	mov    $0x9,%dx
    6828:	f7 e2                	mul    %dx
    682a:	8b f8                	mov    %ax,%di
    682c:	03 f9                	add    %cx,%di
    682e:	8a 85 77 30          	mov    0x3077(%di),%al
    6832:	30 e4                	xor    %ah,%ah
    6834:	50                   	push   %ax
    6835:	8b 46 fe             	mov    -0x2(%bp),%ax
    6838:	8b d8                	mov    %ax,%bx
    683a:	c4 7e f6             	les    -0xa(%bp),%di
    683d:	26 8a 05             	mov    %es:(%di),%al
    6840:	98                   	cbtw
    6841:	ba 09 00             	mov    $0x9,%dx
    6844:	f7 e2                	mul    %dx
    6846:	8b c8                	mov    %ax,%cx
    6848:	a0 02 3a             	mov    0x3a02,%al
    684b:	30 e4                	xor    %ah,%ah
    684d:	8b d0                	mov    %ax,%dx
    684f:	b8 03 00             	mov    $0x3,%ax
    6852:	2b c2                	sub    %dx,%ax
    6854:	ba 24 00             	mov    $0x24,%dx
    6857:	f7 e2                	mul    %dx
    6859:	8b f8                	mov    %ax,%di
    685b:	03 f9                	add    %cx,%di
    685d:	03 fb                	add    %bx,%di
    685f:	8a 85 e7 2f          	mov    0x2fe7(%di),%al
    6863:	30 e4                	xor    %ah,%ah
    6865:	5a                   	pop    %dx
    6866:	2b c2                	sub    %dx,%ax
    6868:	89 46 fa             	mov    %ax,-0x6(%bp)
    686b:	8b 46 fa             	mov    -0x6(%bp),%ax
    686e:	99                   	cwtd
    686f:	b9 03 00             	mov    $0x3,%cx
    6872:	f7 f9                	idiv   %cx
    6874:	48                   	dec    %ax
    6875:	89 46 fa             	mov    %ax,-0x6(%bp)
    6878:	a1 e2 3b             	mov    0x3be2,%ax
    687b:	03 46 fa             	add    -0x6(%bp),%ax
    687e:	a3 e2 3b             	mov    %ax,0x3be2
    6881:	8b 46 fe             	mov    -0x2(%bp),%ax
    6884:	3b 46 f4             	cmp    -0xc(%bp),%ax
    6887:	74 03                	je     0x688c
    6889:	e9 82 fe             	jmp    0x670e
    688c:	c4 7e f6             	les    -0xa(%bp),%di
    688f:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    6894:	7c 03                	jl     0x6899
    6896:	e9 9a 01             	jmp    0x6a33
    6899:	c4 7e f6             	les    -0xa(%bp),%di
    689c:	26 8a 45 01          	mov    %es:0x1(%di),%al
    68a0:	98                   	cbtw
    68a1:	40                   	inc    %ax
    68a2:	89 46 f4             	mov    %ax,-0xc(%bp)
    68a5:	b8 09 00             	mov    $0x9,%ax
    68a8:	3b 46 f4             	cmp    -0xc(%bp),%ax
    68ab:	7d 03                	jge    0x68b0
    68ad:	e9 83 01             	jmp    0x6a33
    68b0:	89 46 fe             	mov    %ax,-0x2(%bp)
    68b3:	eb 03                	jmp    0x68b8
    68b5:	ff 4e fe             	decw   -0x2(%bp)
    68b8:	8b 46 fe             	mov    -0x2(%bp),%ax
    68bb:	8b c8                	mov    %ax,%cx
    68bd:	c4 7e f6             	les    -0xa(%bp),%di
    68c0:	26 8a 05             	mov    %es:(%di),%al
    68c3:	98                   	cbtw
    68c4:	ba 09 00             	mov    $0x9,%dx
    68c7:	f7 e2                	mul    %dx
    68c9:	8b f8                	mov    %ax,%di
    68cb:	03 f9                	add    %cx,%di
    68cd:	80 bd 53 30 00       	cmpb   $0x0,0x3053(%di)
    68d2:	74 7b                	je     0x694f
    68d4:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    68d8:	75 21                	jne    0x68fb
    68da:	8b 46 fe             	mov    -0x2(%bp),%ax
    68dd:	8b c8                	mov    %ax,%cx
    68df:	c4 7e f6             	les    -0xa(%bp),%di
    68e2:	26 8a 05             	mov    %es:(%di),%al
    68e5:	98                   	cbtw
    68e6:	ba 09 00             	mov    $0x9,%dx
    68e9:	f7 e2                	mul    %dx
    68eb:	8b f8                	mov    %ax,%di
    68ed:	03 f9                	add    %cx,%di
    68ef:	8a 85 53 30          	mov    0x3053(%di),%al
    68f3:	30 e4                	xor    %ah,%ah
    68f5:	48                   	dec    %ax
    68f6:	89 46 fa             	mov    %ax,-0x6(%bp)
    68f9:	eb 3e                	jmp    0x6939
    68fb:	8b 46 fe             	mov    -0x2(%bp),%ax
    68fe:	40                   	inc    %ax
    68ff:	8b c8                	mov    %ax,%cx
    6901:	c4 7e f6             	les    -0xa(%bp),%di
    6904:	26 8a 05             	mov    %es:(%di),%al
    6907:	98                   	cbtw
    6908:	ba 09 00             	mov    $0x9,%dx
    690b:	f7 e2                	mul    %dx
    690d:	8b f8                	mov    %ax,%di
    690f:	03 f9                	add    %cx,%di
    6911:	8a 85 77 30          	mov    0x3077(%di),%al
    6915:	30 e4                	xor    %ah,%ah
    6917:	8b d8                	mov    %ax,%bx
    6919:	8b 46 fe             	mov    -0x2(%bp),%ax
    691c:	8b c8                	mov    %ax,%cx
    691e:	c4 7e f6             	les    -0xa(%bp),%di
    6921:	26 8a 05             	mov    %es:(%di),%al
    6924:	98                   	cbtw
    6925:	ba 09 00             	mov    $0x9,%dx
    6928:	f7 e2                	mul    %dx
    692a:	8b f8                	mov    %ax,%di
    692c:	03 f9                	add    %cx,%di
    692e:	8a 85 53 30          	mov    0x3053(%di),%al
    6932:	30 e4                	xor    %ah,%ah
    6934:	2b c3                	sub    %bx,%ax
    6936:	89 46 fa             	mov    %ax,-0x6(%bp)
    6939:	8b 46 fa             	mov    -0x6(%bp),%ax
    693c:	99                   	cwtd
    693d:	b9 03 00             	mov    $0x3,%cx
    6940:	f7 f9                	idiv   %cx
    6942:	48                   	dec    %ax
    6943:	89 46 fa             	mov    %ax,-0x6(%bp)
    6946:	a1 e2 3b             	mov    0x3be2,%ax
    6949:	2b 46 fa             	sub    -0x6(%bp),%ax
    694c:	a3 e2 3b             	mov    %ax,0x3be2
    694f:	8b 46 fe             	mov    -0x2(%bp),%ax
    6952:	8b d8                	mov    %ax,%bx
    6954:	c4 7e f6             	les    -0xa(%bp),%di
    6957:	26 8a 05             	mov    %es:(%di),%al
    695a:	98                   	cbtw
    695b:	ba 09 00             	mov    $0x9,%dx
    695e:	f7 e2                	mul    %dx
    6960:	8b c8                	mov    %ax,%cx
    6962:	a0 02 3a             	mov    0x3a02,%al
    6965:	30 e4                	xor    %ah,%ah
    6967:	8b d0                	mov    %ax,%dx
    6969:	b8 03 00             	mov    $0x3,%ax
    696c:	2b c2                	sub    %dx,%ax
    696e:	ba 24 00             	mov    $0x24,%dx
    6971:	f7 e2                	mul    %dx
    6973:	8b f8                	mov    %ax,%di
    6975:	03 f9                	add    %cx,%di
    6977:	03 fb                	add    %bx,%di
    6979:	80 bd e7 2f 00       	cmpb   $0x0,0x2fe7(%di)
    697e:	75 03                	jne    0x6983
    6980:	e9 a5 00             	jmp    0x6a28
    6983:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    6987:	75 36                	jne    0x69bf
    6989:	8b 46 fe             	mov    -0x2(%bp),%ax
    698c:	8b d8                	mov    %ax,%bx
    698e:	c4 7e f6             	les    -0xa(%bp),%di
    6991:	26 8a 05             	mov    %es:(%di),%al
    6994:	98                   	cbtw
    6995:	ba 09 00             	mov    $0x9,%dx
    6998:	f7 e2                	mul    %dx
    699a:	8b c8                	mov    %ax,%cx
    699c:	a0 02 3a             	mov    0x3a02,%al
    699f:	30 e4                	xor    %ah,%ah
    69a1:	8b d0                	mov    %ax,%dx
    69a3:	b8 03 00             	mov    $0x3,%ax
    69a6:	2b c2                	sub    %dx,%ax
    69a8:	ba 24 00             	mov    $0x24,%dx
    69ab:	f7 e2                	mul    %dx
    69ad:	8b f8                	mov    %ax,%di
    69af:	03 f9                	add    %cx,%di
    69b1:	03 fb                	add    %bx,%di
    69b3:	8a 85 e7 2f          	mov    0x2fe7(%di),%al
    69b7:	30 e4                	xor    %ah,%ah
    69b9:	48                   	dec    %ax
    69ba:	89 46 fa             	mov    %ax,-0x6(%bp)
    69bd:	eb 53                	jmp    0x6a12
    69bf:	8b 46 fe             	mov    -0x2(%bp),%ax
    69c2:	40                   	inc    %ax
    69c3:	8b c8                	mov    %ax,%cx
    69c5:	c4 7e f6             	les    -0xa(%bp),%di
    69c8:	26 8a 05             	mov    %es:(%di),%al
    69cb:	98                   	cbtw
    69cc:	ba 09 00             	mov    $0x9,%dx
    69cf:	f7 e2                	mul    %dx
    69d1:	8b f8                	mov    %ax,%di
    69d3:	03 f9                	add    %cx,%di
    69d5:	8a 85 77 30          	mov    0x3077(%di),%al
    69d9:	30 e4                	xor    %ah,%ah
    69db:	50                   	push   %ax
    69dc:	8b 46 fe             	mov    -0x2(%bp),%ax
    69df:	8b d8                	mov    %ax,%bx
    69e1:	c4 7e f6             	les    -0xa(%bp),%di
    69e4:	26 8a 05             	mov    %es:(%di),%al
    69e7:	98                   	cbtw
    69e8:	ba 09 00             	mov    $0x9,%dx
    69eb:	f7 e2                	mul    %dx
    69ed:	8b c8                	mov    %ax,%cx
    69ef:	a0 02 3a             	mov    0x3a02,%al
    69f2:	30 e4                	xor    %ah,%ah
    69f4:	8b d0                	mov    %ax,%dx
    69f6:	b8 03 00             	mov    $0x3,%ax
    69f9:	2b c2                	sub    %dx,%ax
    69fb:	ba 24 00             	mov    $0x24,%dx
    69fe:	f7 e2                	mul    %dx
    6a00:	8b f8                	mov    %ax,%di
    6a02:	03 f9                	add    %cx,%di
    6a04:	03 fb                	add    %bx,%di
    6a06:	8a 85 e7 2f          	mov    0x2fe7(%di),%al
    6a0a:	30 e4                	xor    %ah,%ah
    6a0c:	5a                   	pop    %dx
    6a0d:	2b c2                	sub    %dx,%ax
    6a0f:	89 46 fa             	mov    %ax,-0x6(%bp)
    6a12:	a1 e2 3b             	mov    0x3be2,%ax
    6a15:	03 46 fa             	add    -0x6(%bp),%ax
    6a18:	a3 e2 3b             	mov    %ax,0x3be2
    6a1b:	8b 46 fa             	mov    -0x6(%bp),%ax
    6a1e:	99                   	cwtd
    6a1f:	b9 03 00             	mov    $0x3,%cx
    6a22:	f7 f9                	idiv   %cx
    6a24:	48                   	dec    %ax
    6a25:	89 46 fa             	mov    %ax,-0x6(%bp)
    6a28:	8b 46 fe             	mov    -0x2(%bp),%ax
    6a2b:	3b 46 f4             	cmp    -0xc(%bp),%ax
    6a2e:	74 03                	je     0x6a33
    6a30:	e9 82 fe             	jmp    0x68b5
    6a33:	89 ec                	mov    %bp,%sp
    6a35:	5d                   	pop    %bp
    6a36:	ca 02 00             	lret   $0x2
    6a39:	55                   	push   %bp
    6a3a:	89 e5                	mov    %sp,%bp
    6a3c:	83 ec 06             	sub    $0x6,%sp
    6a3f:	31 c0                	xor    %ax,%ax
    6a41:	a3 e2 3b             	mov    %ax,0x3be2
    6a44:	8b 46 06             	mov    0x6(%bp),%ax
    6a47:	d1 e0                	shl    %ax
    6a49:	8b f0                	mov    %ax,%si
    6a4b:	d1 e0                	shl    %ax
    6a4d:	03 c6                	add    %si,%ax
    6a4f:	8b c8                	mov    %ax,%cx
    6a51:	a0 02 3a             	mov    0x3a02,%al
    6a54:	30 e4                	xor    %ah,%ah
    6a56:	ba 48 00             	mov    $0x48,%dx
    6a59:	f7 e2                	mul    %dx
    6a5b:	8b f8                	mov    %ax,%di
    6a5d:	03 f9                	add    %cx,%di
    6a5f:	81 c7 82 37          	add    $0x3782,%di
    6a63:	89 7e fa             	mov    %di,-0x6(%bp)
    6a66:	8c 5e fc             	mov    %ds,-0x4(%bp)
    6a69:	c4 7e fa             	les    -0x6(%bp),%di
    6a6c:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    6a71:	7d 24                	jge    0x6a97
    6a73:	c4 7e fa             	les    -0x6(%bp),%di
    6a76:	26 8a 05             	mov    %es:(%di),%al
    6a79:	98                   	cbtw
    6a7a:	8b f8                	mov    %ax,%di
    6a7c:	8a 85 dd 38          	mov    0x38dd(%di),%al
    6a80:	30 e4                	xor    %ah,%ah
    6a82:	a3 e4 3b             	mov    %ax,0x3be4
    6a85:	c4 7e fa             	les    -0x6(%bp),%di
    6a88:	26 8a 05             	mov    %es:(%di),%al
    6a8b:	98                   	cbtw
    6a8c:	8b f8                	mov    %ax,%di
    6a8e:	8a 85 d5 38          	mov    0x38d5(%di),%al
    6a92:	30 e4                	xor    %ah,%ah
    6a94:	a3 e8 3b             	mov    %ax,0x3be8
    6a97:	c4 7e fa             	les    -0x6(%bp),%di
    6a9a:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    6a9f:	7e 24                	jle    0x6ac5
    6aa1:	c4 7e fa             	les    -0x6(%bp),%di
    6aa4:	26 8a 05             	mov    %es:(%di),%al
    6aa7:	98                   	cbtw
    6aa8:	8b f8                	mov    %ax,%di
    6aaa:	8a 85 e1 38          	mov    0x38e1(%di),%al
    6aae:	30 e4                	xor    %ah,%ah
    6ab0:	a3 e4 3b             	mov    %ax,0x3be4
    6ab3:	c4 7e fa             	les    -0x6(%bp),%di
    6ab6:	26 8a 05             	mov    %es:(%di),%al
    6ab9:	98                   	cbtw
    6aba:	8b f8                	mov    %ax,%di
    6abc:	8a 85 d9 38          	mov    0x38d9(%di),%al
    6ac0:	30 e4                	xor    %ah,%ah
    6ac2:	a3 e8 3b             	mov    %ax,0x3be8
    6ac5:	c4 7e fa             	les    -0x6(%bp),%di
    6ac8:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    6acd:	75 4a                	jne    0x6b19
    6acf:	c4 7e fa             	les    -0x6(%bp),%di
    6ad2:	26 8a 05             	mov    %es:(%di),%al
    6ad5:	98                   	cbtw
    6ad6:	8b f8                	mov    %ax,%di
    6ad8:	8a 85 e1 38          	mov    0x38e1(%di),%al
    6adc:	30 e4                	xor    %ah,%ah
    6ade:	8b d0                	mov    %ax,%dx
    6ae0:	c4 7e fa             	les    -0x6(%bp),%di
    6ae3:	26 8a 05             	mov    %es:(%di),%al
    6ae6:	98                   	cbtw
    6ae7:	8b f8                	mov    %ax,%di
    6ae9:	8a 85 dd 38          	mov    0x38dd(%di),%al
    6aed:	30 e4                	xor    %ah,%ah
    6aef:	03 c2                	add    %dx,%ax
    6af1:	a3 e4 3b             	mov    %ax,0x3be4
    6af4:	c4 7e fa             	les    -0x6(%bp),%di
    6af7:	26 8a 05             	mov    %es:(%di),%al
    6afa:	98                   	cbtw
    6afb:	8b f8                	mov    %ax,%di
    6afd:	8a 85 d9 38          	mov    0x38d9(%di),%al
    6b01:	30 e4                	xor    %ah,%ah
    6b03:	8b d0                	mov    %ax,%dx
    6b05:	c4 7e fa             	les    -0x6(%bp),%di
    6b08:	26 8a 05             	mov    %es:(%di),%al
    6b0b:	98                   	cbtw
    6b0c:	8b f8                	mov    %ax,%di
    6b0e:	8a 85 d5 38          	mov    0x38d5(%di),%al
    6b12:	30 e4                	xor    %ah,%ah
    6b14:	03 c2                	add    %dx,%ax
    6b16:	a3 e8 3b             	mov    %ax,0x3be8
    6b19:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    6b1e:	75 14                	jne    0x6b34
    6b20:	80 3e ac 30 01       	cmpb   $0x1,0x30ac
    6b25:	75 0d                	jne    0x6b34
    6b27:	83 3e e8 3b 00       	cmpw   $0x0,0x3be8
    6b2c:	75 06                	jne    0x6b34
    6b2e:	c7 06 e6 3b f4 01    	movw   $0x1f4,0x3be6
    6b34:	a1 e6 3b             	mov    0x3be6,%ax
    6b37:	3b 06 ee 3b          	cmp    0x3bee,%ax
    6b3b:	74 03                	je     0x6b40
    6b3d:	e9 65 01             	jmp    0x6ca5
    6b40:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    6b45:	75 4e                	jne    0x6b95
    6b47:	80 3e ac 30 01       	cmpb   $0x1,0x30ac
    6b4c:	75 47                	jne    0x6b95
    6b4e:	ff 76 06             	push   0x6(%bp)
    6b51:	0e                   	push   %cs
    6b52:	e8 60 fb             	call   0x66b5
    6b55:	a1 e2 3b             	mov    0x3be2,%ax
    6b58:	3b 06 ea 3b          	cmp    0x3bea,%ax
    6b5c:	75 19                	jne    0x6b77
    6b5e:	ff 06 f6 3b          	incw   0x3bf6
    6b62:	ff 36 f6 3b          	push   0x3bf6
    6b66:	9a 94 0c ce 1d       	lcall  $0x1dce,$0xc94
    6b6b:	89 46 fe             	mov    %ax,-0x2(%bp)
    6b6e:	83 7e fe 00          	cmpw   $0x0,-0x2(%bp)
    6b72:	74 03                	je     0x6b77
    6b74:	e9 6b 01             	jmp    0x6ce2
    6b77:	a1 e2 3b             	mov    0x3be2,%ax
    6b7a:	3b 06 ea 3b          	cmp    0x3bea,%ax
    6b7e:	7e 03                	jle    0x6b83
    6b80:	e9 5f 01             	jmp    0x6ce2
    6b83:	a1 e2 3b             	mov    0x3be2,%ax
    6b86:	3b 06 ea 3b          	cmp    0x3bea,%ax
    6b8a:	7d 06                	jge    0x6b92
    6b8c:	c7 06 f6 3b 01 00    	movw   $0x1,0x3bf6
    6b92:	e9 dd 00             	jmp    0x6c72
    6b95:	80 3e ba 38 01       	cmpb   $0x1,0x38ba
    6b9a:	75 14                	jne    0x6bb0
    6b9c:	80 3e ba 38 01       	cmpb   $0x1,0x38ba
    6ba1:	74 03                	je     0x6ba6
    6ba3:	e9 cc 00             	jmp    0x6c72
    6ba6:	83 3e ec 3b 00       	cmpw   $0x0,0x3bec
    6bab:	74 03                	je     0x6bb0
    6bad:	e9 c2 00             	jmp    0x6c72
    6bb0:	a1 e8 3b             	mov    0x3be8,%ax
    6bb3:	3b 06 f0 3b          	cmp    0x3bf0,%ax
    6bb7:	74 03                	je     0x6bbc
    6bb9:	e9 9b 00             	jmp    0x6c57
    6bbc:	a1 e4 3b             	mov    0x3be4,%ax
    6bbf:	3b 06 ec 3b          	cmp    0x3bec,%ax
    6bc3:	75 77                	jne    0x6c3c
    6bc5:	80 3e ba 38 03       	cmpb   $0x3,0x38ba
    6bca:	75 57                	jne    0x6c23
    6bcc:	a0 02 3a             	mov    0x3a02,%al
    6bcf:	30 e4                	xor    %ah,%ah
    6bd1:	8b f8                	mov    %ax,%di
    6bd3:	8a 85 a9 30          	mov    0x30a9(%di),%al
    6bd7:	3a 06 ac 30          	cmp    0x30ac,%al
    6bdb:	76 46                	jbe    0x6c23
    6bdd:	ff 76 06             	push   0x6(%bp)
    6be0:	0e                   	push   %cs
    6be1:	e8 d1 fa             	call   0x66b5
    6be4:	a1 e2 3b             	mov    0x3be2,%ax
    6be7:	3b 06 ea 3b          	cmp    0x3bea,%ax
    6beb:	75 19                	jne    0x6c06
    6bed:	ff 06 f6 3b          	incw   0x3bf6
    6bf1:	ff 36 f6 3b          	push   0x3bf6
    6bf5:	9a 94 0c ce 1d       	lcall  $0x1dce,$0xc94
    6bfa:	89 46 fe             	mov    %ax,-0x2(%bp)
    6bfd:	83 7e fe 00          	cmpw   $0x0,-0x2(%bp)
    6c01:	74 03                	je     0x6c06
    6c03:	e9 dc 00             	jmp    0x6ce2
    6c06:	a1 e2 3b             	mov    0x3be2,%ax
    6c09:	3b 06 ea 3b          	cmp    0x3bea,%ax
    6c0d:	7e 03                	jle    0x6c12
    6c0f:	e9 d0 00             	jmp    0x6ce2
    6c12:	a1 e2 3b             	mov    0x3be2,%ax
    6c15:	3b 06 ea 3b          	cmp    0x3bea,%ax
    6c19:	7d 06                	jge    0x6c21
    6c1b:	c7 06 f6 3b 01 00    	movw   $0x1,0x3bf6
    6c21:	eb 19                	jmp    0x6c3c
    6c23:	ff 06 f6 3b          	incw   0x3bf6
    6c27:	ff 36 f6 3b          	push   0x3bf6
    6c2b:	9a 94 0c ce 1d       	lcall  $0x1dce,$0xc94
    6c30:	89 46 fe             	mov    %ax,-0x2(%bp)
    6c33:	83 7e fe 00          	cmpw   $0x0,-0x2(%bp)
    6c37:	74 03                	je     0x6c3c
    6c39:	e9 a6 00             	jmp    0x6ce2
    6c3c:	a1 e4 3b             	mov    0x3be4,%ax
    6c3f:	3b 06 ec 3b          	cmp    0x3bec,%ax
    6c43:	7e 03                	jle    0x6c48
    6c45:	e9 9a 00             	jmp    0x6ce2
    6c48:	a1 e4 3b             	mov    0x3be4,%ax
    6c4b:	3b 06 ec 3b          	cmp    0x3bec,%ax
    6c4f:	7d 06                	jge    0x6c57
    6c51:	c7 06 f6 3b 01 00    	movw   $0x1,0x3bf6
    6c57:	a1 e8 3b             	mov    0x3be8,%ax
    6c5a:	3b 06 f0 3b          	cmp    0x3bf0,%ax
    6c5e:	7e 03                	jle    0x6c63
    6c60:	e9 7f 00             	jmp    0x6ce2
    6c63:	a1 e8 3b             	mov    0x3be8,%ax
    6c66:	3b 06 f0 3b          	cmp    0x3bf0,%ax
    6c6a:	7d 06                	jge    0x6c72
    6c6c:	c7 06 f6 3b 01 00    	movw   $0x1,0x3bf6
    6c72:	80 3e ba 38 01       	cmpb   $0x1,0x38ba
    6c77:	75 2c                	jne    0x6ca5
    6c79:	83 3e e4 3b 00       	cmpw   $0x0,0x3be4
    6c7e:	74 18                	je     0x6c98
    6c80:	ff 06 f6 3b          	incw   0x3bf6
    6c84:	ff 36 f6 3b          	push   0x3bf6
    6c88:	9a 94 0c ce 1d       	lcall  $0x1dce,$0xc94
    6c8d:	89 46 fe             	mov    %ax,-0x2(%bp)
    6c90:	83 7e fe 00          	cmpw   $0x0,-0x2(%bp)
    6c94:	74 02                	je     0x6c98
    6c96:	eb 4a                	jmp    0x6ce2
    6c98:	83 3e e4 3b 00       	cmpw   $0x0,0x3be4
    6c9d:	75 06                	jne    0x6ca5
    6c9f:	c7 06 f6 3b 01 00    	movw   $0x1,0x3bf6
    6ca5:	a1 e6 3b             	mov    0x3be6,%ax
    6ca8:	3b 06 ee 3b          	cmp    0x3bee,%ax
    6cac:	7e 06                	jle    0x6cb4
    6cae:	c7 06 f6 3b 01 00    	movw   $0x1,0x3bf6
    6cb4:	8b 46 06             	mov    0x6(%bp),%ax
    6cb7:	a3 f2 3b             	mov    %ax,0x3bf2
    6cba:	a1 e6 3b             	mov    0x3be6,%ax
    6cbd:	a3 ee 3b             	mov    %ax,0x3bee
    6cc0:	a1 e8 3b             	mov    0x3be8,%ax
    6cc3:	a3 f0 3b             	mov    %ax,0x3bf0
    6cc6:	a1 e4 3b             	mov    0x3be4,%ax
    6cc9:	a3 ec 3b             	mov    %ax,0x3bec
    6ccc:	ff 76 06             	push   0x6(%bp)
    6ccf:	0e                   	push   %cs
    6cd0:	e8 e2 f9             	call   0x66b5
    6cd3:	a1 e2 3b             	mov    0x3be2,%ax
    6cd6:	a3 ea 3b             	mov    %ax,0x3bea
    6cd9:	0e                   	push   %cs
    6cda:	e8 43 f3             	call   0x6020
    6cdd:	c6 06 f4 3b 00       	movb   $0x0,0x3bf4
    6ce2:	89 ec                	mov    %bp,%sp
    6ce4:	5d                   	pop    %bp
    6ce5:	ca 02 00             	lret   $0x2
    6ce8:	55                   	push   %bp
    6ce9:	89 e5                	mov    %sp,%bp
    6ceb:	83 ec 0a             	sub    $0xa,%sp
    6cee:	31 c0                	xor    %ax,%ax
    6cf0:	a3 f6 3b             	mov    %ax,0x3bf6
    6cf3:	c6 46 fb 00          	movb   $0x0,-0x5(%bp)
    6cf7:	c6 06 f4 3b 01       	movb   $0x1,0x3bf4
    6cfc:	0e                   	push   %cs
    6cfd:	e8 6c f3             	call   0x606c
    6d00:	c7 06 ee 3b ff ff    	movw   $0xffff,0x3bee
    6d06:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6d0b:	eb 03                	jmp    0x6d10
    6d0d:	ff 46 fe             	incw   -0x2(%bp)
    6d10:	8b 46 fe             	mov    -0x2(%bp),%ax
    6d13:	d1 e0                	shl    %ax
    6d15:	8b f0                	mov    %ax,%si
    6d17:	d1 e0                	shl    %ax
    6d19:	03 c6                	add    %si,%ax
    6d1b:	8b c8                	mov    %ax,%cx
    6d1d:	a0 02 3a             	mov    0x3a02,%al
    6d20:	30 e4                	xor    %ah,%ah
    6d22:	ba 48 00             	mov    $0x48,%dx
    6d25:	f7 e2                	mul    %dx
    6d27:	8b f8                	mov    %ax,%di
    6d29:	03 f9                	add    %cx,%di
    6d2b:	81 c7 82 37          	add    $0x3782,%di
    6d2f:	89 7e f6             	mov    %di,-0xa(%bp)
    6d32:	8c 5e f8             	mov    %ds,-0x8(%bp)
    6d35:	c4 7e f6             	les    -0xa(%bp),%di
    6d38:	26 80 3d 00          	cmpb   $0x0,%es:(%di)
    6d3c:	75 03                	jne    0x6d41
    6d3e:	e9 7f 00             	jmp    0x6dc0
    6d41:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    6d46:	eb 03                	jmp    0x6d4b
    6d48:	ff 46 fc             	incw   -0x4(%bp)
    6d4b:	c4 7e f6             	les    -0xa(%bp),%di
    6d4e:	26 8a 05             	mov    %es:(%di),%al
    6d51:	98                   	cbtw
    6d52:	8b 7e fc             	mov    -0x4(%bp),%di
    6d55:	d1 e7                	shl    %di
    6d57:	d1 e7                	shl    %di
    6d59:	03 f8                	add    %ax,%di
    6d5b:	8a 85 b9 38          	mov    0x38b9(%di),%al
    6d5f:	c4 7e f6             	les    -0xa(%bp),%di
    6d62:	26 3a 45 01          	cmp    %es:0x1(%di),%al
    6d66:	75 52                	jne    0x6dba
    6d68:	c4 7e f6             	les    -0xa(%bp),%di
    6d6b:	26 8a 05             	mov    %es:(%di),%al
    6d6e:	98                   	cbtw
    6d6f:	8b 7e fc             	mov    -0x4(%bp),%di
    6d72:	d1 e7                	shl    %di
    6d74:	d1 e7                	shl    %di
    6d76:	03 f8                	add    %ax,%di
    6d78:	8a 85 c1 38          	mov    0x38c1(%di),%al
    6d7c:	30 e4                	xor    %ah,%ah
    6d7e:	a3 e6 3b             	mov    %ax,0x3be6
    6d81:	c4 7e f6             	les    -0xa(%bp),%di
    6d84:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    6d89:	75 13                	jne    0x6d9e
    6d8b:	c4 7e f6             	les    -0xa(%bp),%di
    6d8e:	26 80 3d 03          	cmpb   $0x3,%es:(%di)
    6d92:	75 0a                	jne    0x6d9e
    6d94:	c7 06 e6 3b e8 03    	movw   $0x3e8,0x3be6
    6d9a:	c6 46 fb 01          	movb   $0x1,-0x5(%bp)
    6d9e:	a1 e6 3b             	mov    0x3be6,%ax
    6da1:	3b 06 ee 3b          	cmp    0x3bee,%ax
    6da5:	7c 07                	jl     0x6dae
    6da7:	ff 76 fe             	push   -0x2(%bp)
    6daa:	0e                   	push   %cs
    6dab:	e8 8b fc             	call   0x6a39
    6dae:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    6db3:	3d 1b 01             	cmp    $0x11b,%ax
    6db6:	75 02                	jne    0x6dba
    6db8:	eb 26                	jmp    0x6de0
    6dba:	83 7e fc 02          	cmpw   $0x2,-0x4(%bp)
    6dbe:	75 88                	jne    0x6d48
    6dc0:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    6dc4:	74 03                	je     0x6dc9
    6dc6:	e9 44 ff             	jmp    0x6d0d
    6dc9:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    6dce:	3d 1b 01             	cmp    $0x11b,%ax
    6dd1:	75 02                	jne    0x6dd5
    6dd3:	eb 0b                	jmp    0x6de0
    6dd5:	80 7e fb 00          	cmpb   $0x0,-0x5(%bp)
    6dd9:	74 05                	je     0x6de0
    6ddb:	31 c0                	xor    %ax,%ax
    6ddd:	a3 f6 3b             	mov    %ax,0x3bf6
    6de0:	89 ec                	mov    %bp,%sp
    6de2:	5d                   	pop    %bp
    6de3:	cb                   	lret
    6de4:	08 4e 69             	or     %cl,0x69(%bp)
    6de7:	6e                   	outsb  %ds:(%si),(%dx)
    6de8:	65 2e 72 65          	gs jb,pn 0x6e51
    6dec:	73 55                	jae    0x6e43
    6dee:	89 e5                	mov    %sp,%bp
    6df0:	83 ec 0a             	sub    $0xa,%sp
    6df3:	bf 5e 35             	mov    $0x355e,%di
    6df6:	1e                   	push   %ds
    6df7:	57                   	push   %di
    6df8:	bf c4 0d             	mov    $0xdc4,%di
    6dfb:	0e                   	push   %cs
    6dfc:	57                   	push   %di
    6dfd:	9a 5e 13 ce 1d       	lcall  $0x1dce,$0x135e
    6e02:	bf 5e 35             	mov    $0x355e,%di
    6e05:	1e                   	push   %ds
    6e06:	57                   	push   %di
    6e07:	b8 3c 00             	mov    $0x3c,%ax
    6e0a:	50                   	push   %ax
    6e0b:	9a 95 13 ce 1d       	lcall  $0x1dce,$0x1395
    6e10:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    6e15:	eb 03                	jmp    0x6e1a
    6e17:	ff 46 fa             	incw   -0x6(%bp)
    6e1a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6e1f:	eb 03                	jmp    0x6e24
    6e21:	ff 46 fe             	incw   -0x2(%bp)
    6e24:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    6e29:	eb 03                	jmp    0x6e2e
    6e2b:	ff 46 fc             	incw   -0x4(%bp)
    6e2e:	8b 46 fc             	mov    -0x4(%bp),%ax
    6e31:	8b d8                	mov    %ax,%bx
    6e33:	8b 46 fe             	mov    -0x2(%bp),%ax
    6e36:	ba 14 00             	mov    $0x14,%dx
    6e39:	f7 e2                	mul    %dx
    6e3b:	8b c8                	mov    %ax,%cx
    6e3d:	8b 46 fa             	mov    -0x6(%bp),%ax
    6e40:	ba c8 00             	mov    $0xc8,%dx
    6e43:	f7 e2                	mul    %dx
    6e45:	8b f8                	mov    %ax,%di
    6e47:	03 f9                	add    %cx,%di
    6e49:	03 fb                	add    %bx,%di
    6e4b:	8a 85 d2 2f          	mov    0x2fd2(%di),%al
    6e4f:	34 ff                	xor    $0xff,%al
    6e51:	50                   	push   %ax
    6e52:	8b 46 fc             	mov    -0x4(%bp),%ax
    6e55:	8b d8                	mov    %ax,%bx
    6e57:	8b 46 fe             	mov    -0x2(%bp),%ax
    6e5a:	ba 14 00             	mov    $0x14,%dx
    6e5d:	f7 e2                	mul    %dx
    6e5f:	8b c8                	mov    %ax,%cx
    6e61:	8b 46 fa             	mov    -0x6(%bp),%ax
    6e64:	ba c8 00             	mov    $0xc8,%dx
    6e67:	f7 e2                	mul    %dx
    6e69:	8b f8                	mov    %ax,%di
    6e6b:	03 f9                	add    %cx,%di
    6e6d:	03 fb                	add    %bx,%di
    6e6f:	58                   	pop    %ax
    6e70:	88 85 d2 2f          	mov    %al,0x2fd2(%di)
    6e74:	8b 46 fc             	mov    -0x4(%bp),%ax
    6e77:	8b d8                	mov    %ax,%bx
    6e79:	8b 46 fe             	mov    -0x2(%bp),%ax
    6e7c:	ba 14 00             	mov    $0x14,%dx
    6e7f:	f7 e2                	mul    %dx
    6e81:	8b c8                	mov    %ax,%cx
    6e83:	8b 46 fa             	mov    -0x6(%bp),%ax
    6e86:	ba c8 00             	mov    $0xc8,%dx
    6e89:	f7 e2                	mul    %dx
    6e8b:	8b f8                	mov    %ax,%di
    6e8d:	03 f9                	add    %cx,%di
    6e8f:	03 fb                	add    %bx,%di
    6e91:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    6e95:	34 ff                	xor    $0xff,%al
    6e97:	50                   	push   %ax
    6e98:	8b 46 fc             	mov    -0x4(%bp),%ax
    6e9b:	8b d8                	mov    %ax,%bx
    6e9d:	8b 46 fe             	mov    -0x2(%bp),%ax
    6ea0:	ba 14 00             	mov    $0x14,%dx
    6ea3:	f7 e2                	mul    %dx
    6ea5:	8b c8                	mov    %ax,%cx
    6ea7:	8b 46 fa             	mov    -0x6(%bp),%ax
    6eaa:	ba c8 00             	mov    $0xc8,%dx
    6ead:	f7 e2                	mul    %dx
    6eaf:	8b f8                	mov    %ax,%di
    6eb1:	03 f9                	add    %cx,%di
    6eb3:	03 fb                	add    %bx,%di
    6eb5:	58                   	pop    %ax
    6eb6:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    6eba:	83 7e fc 08          	cmpw   $0x8,-0x4(%bp)
    6ebe:	74 03                	je     0x6ec3
    6ec0:	e9 68 ff             	jmp    0x6e2b
    6ec3:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    6ec7:	74 03                	je     0x6ecc
    6ec9:	e9 55 ff             	jmp    0x6e21
    6ecc:	83 7e fa 03          	cmpw   $0x3,-0x6(%bp)
    6ed0:	74 03                	je     0x6ed5
    6ed2:	e9 42 ff             	jmp    0x6e17
    6ed5:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    6eda:	eb 03                	jmp    0x6edf
    6edc:	ff 46 fe             	incw   -0x2(%bp)
    6edf:	8b 46 fe             	mov    -0x2(%bp),%ax
    6ee2:	ba 3c 00             	mov    $0x3c,%dx
    6ee5:	f7 e2                	mul    %dx
    6ee7:	8b f8                	mov    %ax,%di
    6ee9:	81 c7 ca 32          	add    $0x32ca,%di
    6eed:	89 7e f6             	mov    %di,-0xa(%bp)
    6ef0:	8c 5e f8             	mov    %ds,-0x8(%bp)
    6ef3:	8b 46 fe             	mov    -0x2(%bp),%ax
    6ef6:	ba 14 00             	mov    $0x14,%dx
    6ef9:	f7 e2                	mul    %dx
    6efb:	8b f8                	mov    %ax,%di
    6efd:	81 c7 9a 30          	add    $0x309a,%di
    6f01:	1e                   	push   %ds
    6f02:	57                   	push   %di
    6f03:	c4 7e f6             	les    -0xa(%bp),%di
    6f06:	06                   	push   %es
    6f07:	57                   	push   %di
    6f08:	b8 08 00             	mov    $0x8,%ax
    6f0b:	50                   	push   %ax
    6f0c:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    6f11:	8b 46 fe             	mov    -0x2(%bp),%ax
    6f14:	ba 14 00             	mov    $0x14,%dx
    6f17:	f7 e2                	mul    %dx
    6f19:	8b f8                	mov    %ax,%di
    6f1b:	8b 85 a3 30          	mov    0x30a3(%di),%ax
    6f1f:	c4 7e f6             	les    -0xa(%bp),%di
    6f22:	26 89 45 09          	mov    %ax,%es:0x9(%di)
    6f26:	8b 46 fe             	mov    -0x2(%bp),%ax
    6f29:	ba 14 00             	mov    $0x14,%dx
    6f2c:	f7 e2                	mul    %dx
    6f2e:	8b f8                	mov    %ax,%di
    6f30:	81 c7 a5 30          	add    $0x30a5,%di
    6f34:	1e                   	push   %ds
    6f35:	57                   	push   %di
    6f36:	c4 7e f6             	les    -0xa(%bp),%di
    6f39:	81 c7 0b 00          	add    $0xb,%di
    6f3d:	06                   	push   %es
    6f3e:	57                   	push   %di
    6f3f:	b8 08 00             	mov    $0x8,%ax
    6f42:	50                   	push   %ax
    6f43:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    6f48:	8b 46 fe             	mov    -0x2(%bp),%ax
    6f4b:	ba 14 00             	mov    $0x14,%dx
    6f4e:	f7 e2                	mul    %dx
    6f50:	8b f8                	mov    %ax,%di
    6f52:	81 c7 62 31          	add    $0x3162,%di
    6f56:	1e                   	push   %ds
    6f57:	57                   	push   %di
    6f58:	c4 7e f6             	les    -0xa(%bp),%di
    6f5b:	81 c7 14 00          	add    $0x14,%di
    6f5f:	06                   	push   %es
    6f60:	57                   	push   %di
    6f61:	b8 08 00             	mov    $0x8,%ax
    6f64:	50                   	push   %ax
    6f65:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    6f6a:	8b 46 fe             	mov    -0x2(%bp),%ax
    6f6d:	ba 14 00             	mov    $0x14,%dx
    6f70:	f7 e2                	mul    %dx
    6f72:	8b f8                	mov    %ax,%di
    6f74:	8b 85 6b 31          	mov    0x316b(%di),%ax
    6f78:	c4 7e f6             	les    -0xa(%bp),%di
    6f7b:	26 89 45 1d          	mov    %ax,%es:0x1d(%di)
    6f7f:	8b 46 fe             	mov    -0x2(%bp),%ax
    6f82:	ba 14 00             	mov    $0x14,%dx
    6f85:	f7 e2                	mul    %dx
    6f87:	8b f8                	mov    %ax,%di
    6f89:	81 c7 6d 31          	add    $0x316d,%di
    6f8d:	1e                   	push   %ds
    6f8e:	57                   	push   %di
    6f8f:	c4 7e f6             	les    -0xa(%bp),%di
    6f92:	81 c7 1f 00          	add    $0x1f,%di
    6f96:	06                   	push   %es
    6f97:	57                   	push   %di
    6f98:	b8 08 00             	mov    $0x8,%ax
    6f9b:	50                   	push   %ax
    6f9c:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    6fa1:	8b 46 fe             	mov    -0x2(%bp),%ax
    6fa4:	ba 14 00             	mov    $0x14,%dx
    6fa7:	f7 e2                	mul    %dx
    6fa9:	8b f8                	mov    %ax,%di
    6fab:	81 c7 2a 32          	add    $0x322a,%di
    6faf:	1e                   	push   %ds
    6fb0:	57                   	push   %di
    6fb1:	c4 7e f6             	les    -0xa(%bp),%di
    6fb4:	81 c7 28 00          	add    $0x28,%di
    6fb8:	06                   	push   %es
    6fb9:	57                   	push   %di
    6fba:	b8 08 00             	mov    $0x8,%ax
    6fbd:	50                   	push   %ax
    6fbe:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    6fc3:	8b 46 fe             	mov    -0x2(%bp),%ax
    6fc6:	ba 14 00             	mov    $0x14,%dx
    6fc9:	f7 e2                	mul    %dx
    6fcb:	8b f8                	mov    %ax,%di
    6fcd:	8b 85 33 32          	mov    0x3233(%di),%ax
    6fd1:	c4 7e f6             	les    -0xa(%bp),%di
    6fd4:	26 89 45 31          	mov    %ax,%es:0x31(%di)
    6fd8:	8b 46 fe             	mov    -0x2(%bp),%ax
    6fdb:	ba 14 00             	mov    $0x14,%dx
    6fde:	f7 e2                	mul    %dx
    6fe0:	8b f8                	mov    %ax,%di
    6fe2:	81 c7 35 32          	add    $0x3235,%di
    6fe6:	1e                   	push   %ds
    6fe7:	57                   	push   %di
    6fe8:	c4 7e f6             	les    -0xa(%bp),%di
    6feb:	81 c7 33 00          	add    $0x33,%di
    6fef:	06                   	push   %es
    6ff0:	57                   	push   %di
    6ff1:	b8 08 00             	mov    $0x8,%ax
    6ff4:	50                   	push   %ax
    6ff5:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    6ffa:	bf 5e 35             	mov    $0x355e,%di
    6ffd:	1e                   	push   %ds
    6ffe:	57                   	push   %di
    6fff:	8b 46 fe             	mov    -0x2(%bp),%ax
    7002:	ba 3c 00             	mov    $0x3c,%dx
    7005:	f7 e2                	mul    %dx
    7007:	8b f8                	mov    %ax,%di
    7009:	81 c7 ca 32          	add    $0x32ca,%di
    700d:	1e                   	push   %ds
    700e:	57                   	push   %di
    700f:	9a 48 14 ce 1d       	lcall  $0x1dce,$0x1448
    7014:	83 c4 04             	add    $0x4,%sp
    7017:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    701b:	74 03                	je     0x7020
    701d:	e9 bc fe             	jmp    0x6edc
    7020:	bf 5e 35             	mov    $0x355e,%di
    7023:	1e                   	push   %ds
    7024:	57                   	push   %di
    7025:	9a 0d 14 ce 1d       	lcall  $0x1dce,$0x140d
    702a:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    702f:	eb 03                	jmp    0x7034
    7031:	ff 46 fa             	incw   -0x6(%bp)
    7034:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    7039:	eb 03                	jmp    0x703e
    703b:	ff 46 fe             	incw   -0x2(%bp)
    703e:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    7043:	eb 03                	jmp    0x7048
    7045:	ff 46 fc             	incw   -0x4(%bp)
    7048:	8b 46 fc             	mov    -0x4(%bp),%ax
    704b:	8b d8                	mov    %ax,%bx
    704d:	8b 46 fe             	mov    -0x2(%bp),%ax
    7050:	ba 14 00             	mov    $0x14,%dx
    7053:	f7 e2                	mul    %dx
    7055:	8b c8                	mov    %ax,%cx
    7057:	8b 46 fa             	mov    -0x6(%bp),%ax
    705a:	ba c8 00             	mov    $0xc8,%dx
    705d:	f7 e2                	mul    %dx
    705f:	8b f8                	mov    %ax,%di
    7061:	03 f9                	add    %cx,%di
    7063:	03 fb                	add    %bx,%di
    7065:	8a 85 d2 2f          	mov    0x2fd2(%di),%al
    7069:	34 ff                	xor    $0xff,%al
    706b:	50                   	push   %ax
    706c:	8b 46 fc             	mov    -0x4(%bp),%ax
    706f:	8b d8                	mov    %ax,%bx
    7071:	8b 46 fe             	mov    -0x2(%bp),%ax
    7074:	ba 14 00             	mov    $0x14,%dx
    7077:	f7 e2                	mul    %dx
    7079:	8b c8                	mov    %ax,%cx
    707b:	8b 46 fa             	mov    -0x6(%bp),%ax
    707e:	ba c8 00             	mov    $0xc8,%dx
    7081:	f7 e2                	mul    %dx
    7083:	8b f8                	mov    %ax,%di
    7085:	03 f9                	add    %cx,%di
    7087:	03 fb                	add    %bx,%di
    7089:	58                   	pop    %ax
    708a:	88 85 d2 2f          	mov    %al,0x2fd2(%di)
    708e:	8b 46 fc             	mov    -0x4(%bp),%ax
    7091:	8b d8                	mov    %ax,%bx
    7093:	8b 46 fe             	mov    -0x2(%bp),%ax
    7096:	ba 14 00             	mov    $0x14,%dx
    7099:	f7 e2                	mul    %dx
    709b:	8b c8                	mov    %ax,%cx
    709d:	8b 46 fa             	mov    -0x6(%bp),%ax
    70a0:	ba c8 00             	mov    $0xc8,%dx
    70a3:	f7 e2                	mul    %dx
    70a5:	8b f8                	mov    %ax,%di
    70a7:	03 f9                	add    %cx,%di
    70a9:	03 fb                	add    %bx,%di
    70ab:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    70af:	34 ff                	xor    $0xff,%al
    70b1:	50                   	push   %ax
    70b2:	8b 46 fc             	mov    -0x4(%bp),%ax
    70b5:	8b d8                	mov    %ax,%bx
    70b7:	8b 46 fe             	mov    -0x2(%bp),%ax
    70ba:	ba 14 00             	mov    $0x14,%dx
    70bd:	f7 e2                	mul    %dx
    70bf:	8b c8                	mov    %ax,%cx
    70c1:	8b 46 fa             	mov    -0x6(%bp),%ax
    70c4:	ba c8 00             	mov    $0xc8,%dx
    70c7:	f7 e2                	mul    %dx
    70c9:	8b f8                	mov    %ax,%di
    70cb:	03 f9                	add    %cx,%di
    70cd:	03 fb                	add    %bx,%di
    70cf:	58                   	pop    %ax
    70d0:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    70d4:	83 7e fc 08          	cmpw   $0x8,-0x4(%bp)
    70d8:	74 03                	je     0x70dd
    70da:	e9 68 ff             	jmp    0x7045
    70dd:	83 7e fe 0a          	cmpw   $0xa,-0x2(%bp)
    70e1:	74 03                	je     0x70e6
    70e3:	e9 55 ff             	jmp    0x703b
    70e6:	83 7e fa 03          	cmpw   $0x3,-0x6(%bp)
    70ea:	74 03                	je     0x70ef
    70ec:	e9 42 ff             	jmp    0x7031
    70ef:	89 ec                	mov    %bp,%sp
    70f1:	5d                   	pop    %bp
    70f2:	cb                   	lret
    70f3:	55                   	push   %bp
    70f4:	89 e5                	mov    %sp,%bp
    70f6:	81 ec ea 00          	sub    $0xea,%sp
    70fa:	31 c0                	xor    %ax,%ax
    70fc:	89 46 fe             	mov    %ax,-0x2(%bp)
    70ff:	eb 03                	jmp    0x7104
    7101:	ff 46 fe             	incw   -0x2(%bp)
    7104:	8b 46 fe             	mov    -0x2(%bp),%ax
    7107:	b9 21 00             	mov    $0x21,%cx
    710a:	f7 e9                	imul   %cx
    710c:	05 77 00             	add    $0x77,%ax
    710f:	8b 7e fe             	mov    -0x2(%bp),%di
    7112:	d1 e7                	shl    %di
    7114:	89 83 58 ff          	mov    %ax,-0xa8(%bp,%di)
    7118:	8b 7e fe             	mov    -0x2(%bp),%di
    711b:	d1 e7                	shl    %di
    711d:	c7 83 16 ff 4c 01    	movw   $0x14c,-0xea(%bp,%di)
    7123:	83 7e fe 06          	cmpw   $0x6,-0x2(%bp)
    7127:	75 d8                	jne    0x7101
    7129:	c7 46 fe 07 00       	movw   $0x7,-0x2(%bp)
    712e:	eb 03                	jmp    0x7133
    7130:	ff 46 fe             	incw   -0x2(%bp)
    7133:	8b 46 fe             	mov    -0x2(%bp),%ax
    7136:	2d 07 00             	sub    $0x7,%ax
    7139:	b9 21 00             	mov    $0x21,%cx
    713c:	f7 e9                	imul   %cx
    713e:	05 77 00             	add    $0x77,%ax
    7141:	8b 7e fe             	mov    -0x2(%bp),%di
    7144:	d1 e7                	shl    %di
    7146:	89 83 58 ff          	mov    %ax,-0xa8(%bp,%di)
    714a:	8b 7e fe             	mov    -0x2(%bp),%di
    714d:	d1 e7                	shl    %di
    714f:	c7 83 16 ff 52 01    	movw   $0x152,-0xea(%bp,%di)
    7155:	83 7e fe 13          	cmpw   $0x13,-0x2(%bp)
    7159:	75 d5                	jne    0x7130
    715b:	c7 46 fe 14 00       	movw   $0x14,-0x2(%bp)
    7160:	eb 03                	jmp    0x7165
    7162:	ff 46 fe             	incw   -0x2(%bp)
    7165:	8b 46 fe             	mov    -0x2(%bp),%ax
    7168:	2d 14 00             	sub    $0x14,%ax
    716b:	b9 21 00             	mov    $0x21,%cx
    716e:	f7 e9                	imul   %cx
    7170:	05 77 00             	add    $0x77,%ax
    7173:	8b 7e fe             	mov    -0x2(%bp),%di
    7176:	d1 e7                	shl    %di
    7178:	89 83 58 ff          	mov    %ax,-0xa8(%bp,%di)
    717c:	8b 7e fe             	mov    -0x2(%bp),%di
    717f:	d1 e7                	shl    %di
    7181:	c7 83 16 ff 58 01    	movw   $0x158,-0xea(%bp,%di)
    7187:	83 7e fe 20          	cmpw   $0x20,-0x2(%bp)
    718b:	75 d5                	jne    0x7162
    718d:	83 7e 06 00          	cmpw   $0x0,0x6(%bp)
    7191:	7e 15                	jle    0x71a8
    7193:	81 7e 06 40 01       	cmpw   $0x140,0x6(%bp)
    7198:	7f 0e                	jg     0x71a8
    719a:	8b 46 06             	mov    0x6(%bp),%ax
    719d:	99                   	cwtd
    719e:	b9 0a 00             	mov    $0xa,%cx
    71a1:	f7 f9                	idiv   %cx
    71a3:	89 46 fc             	mov    %ax,-0x4(%bp)
    71a6:	eb 05                	jmp    0x71ad
    71a8:	31 c0                	xor    %ax,%ax
    71aa:	89 46 fc             	mov    %ax,-0x4(%bp)
    71ad:	8b 7e fc             	mov    -0x4(%bp),%di
    71b0:	d1 e7                	shl    %di
    71b2:	ff b3 58 ff          	push   -0xa8(%bp,%di)
    71b6:	8b 7e fc             	mov    -0x4(%bp),%di
    71b9:	d1 e7                	shl    %di
    71bb:	ff b3 16 ff          	push   -0xea(%bp,%di)
    71bf:	b8 20 00             	mov    $0x20,%ax
    71c2:	50                   	push   %ax
    71c3:	b8 05 00             	mov    $0x5,%ax
    71c6:	50                   	push   %ax
    71c7:	b8 01 00             	mov    $0x1,%ax
    71ca:	50                   	push   %ax
    71cb:	b8 c7 01             	mov    $0x1c7,%ax
    71ce:	50                   	push   %ax
    71cf:	b8 33 00             	mov    $0x33,%ax
    71d2:	50                   	push   %ax
    71d3:	31 c0                	xor    %ax,%ax
    71d5:	50                   	push   %ax
    71d6:	b0 02                	mov    $0x2,%al
    71d8:	50                   	push   %ax
    71d9:	b0 00                	mov    $0x0,%al
    71db:	50                   	push   %ax
    71dc:	b0 01                	mov    $0x1,%al
    71de:	50                   	push   %ax
    71df:	31 c0                	xor    %ax,%ax
    71e1:	50                   	push   %ax
    71e2:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    71e7:	89 ec                	mov    %bp,%sp
    71e9:	5d                   	pop    %bp
    71ea:	ca 02 00             	lret   $0x2
    71ed:	55                   	push   %bp
    71ee:	89 e5                	mov    %sp,%bp
    71f0:	83 ec 3e             	sub    $0x3e,%sp
    71f3:	c7 46 f6 08 00       	movw   $0x8,-0xa(%bp)
    71f8:	c7 46 f4 07 00       	movw   $0x7,-0xc(%bp)
    71fd:	31 c0                	xor    %ax,%ax
    71ff:	89 46 fe             	mov    %ax,-0x2(%bp)
    7202:	eb 03                	jmp    0x7207
    7204:	ff 46 fe             	incw   -0x2(%bp)
    7207:	8b 7e fe             	mov    -0x2(%bp),%di
    720a:	d1 e7                	shl    %di
    720c:	c7 43 d8 6d 00       	movw   $0x6d,-0x28(%bp,%di)
    7211:	8b 46 fe             	mov    -0x2(%bp),%ax
    7214:	b9 03 00             	mov    $0x3,%cx
    7217:	d3 e0                	shl    %cl,%ax
    7219:	05 5e 00             	add    $0x5e,%ax
    721c:	8b 7e fe             	mov    -0x2(%bp),%di
    721f:	d1 e7                	shl    %di
    7221:	89 43 c4             	mov    %ax,-0x3c(%bp,%di)
    7224:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    7228:	75 da                	jne    0x7204
    722a:	c7 46 f2 6d 00       	movw   $0x6d,-0xe(%bp)
    722f:	c7 46 f0 ae 00       	movw   $0xae,-0x10(%bp)
    7234:	c7 46 ee 6d 00       	movw   $0x6d,-0x12(%bp)
    7239:	c7 46 ec b6 00       	movw   $0xb6,-0x14(%bp)
    723e:	c7 46 c2 01 00       	movw   $0x1,-0x3e(%bp)
    7243:	83 7e 0c 00          	cmpw   $0x0,0xc(%bp)
    7247:	7d 12                	jge    0x725b
    7249:	c6 46 f9 01          	movb   $0x1,-0x7(%bp)
    724d:	8b 46 0c             	mov    0xc(%bp),%ax
    7250:	09 c0                	or     %ax,%ax
    7252:	79 02                	jns    0x7256
    7254:	f7 d8                	neg    %ax
    7256:	89 46 0c             	mov    %ax,0xc(%bp)
    7259:	eb 04                	jmp    0x725f
    725b:	c6 46 f9 00          	movb   $0x0,-0x7(%bp)
    725f:	8b 46 0c             	mov    0xc(%bp),%ax
    7262:	89 46 fc             	mov    %ax,-0x4(%bp)
    7265:	8b 46 0a             	mov    0xa(%bp),%ax
    7268:	89 46 fe             	mov    %ax,-0x2(%bp)
    726b:	8b 46 c2             	mov    -0x3e(%bp),%ax
    726e:	99                   	cwtd
    726f:	52                   	push   %dx
    7270:	50                   	push   %ax
    7271:	8b 46 f6             	mov    -0xa(%bp),%ax
    7274:	31 d2                	xor    %dx,%dx
    7276:	8b c8                	mov    %ax,%cx
    7278:	8b da                	mov    %dx,%bx
    727a:	8b 46 08             	mov    0x8(%bp),%ax
    727d:	99                   	cwtd
    727e:	2b c1                	sub    %cx,%ax
    7280:	1b d3                	sbb    %bx,%dx
    7282:	59                   	pop    %cx
    7283:	5b                   	pop    %bx
    7284:	2b c1                	sub    %cx,%ax
    7286:	1b d3                	sbb    %bx,%dx
    7288:	89 46 08             	mov    %ax,0x8(%bp)
    728b:	8b 46 fc             	mov    -0x4(%bp),%ax
    728e:	99                   	cwtd
    728f:	b9 0a 00             	mov    $0xa,%cx
    7292:	f7 f9                	idiv   %cx
    7294:	92                   	xchg   %ax,%dx
    7295:	89 46 fa             	mov    %ax,-0x6(%bp)
    7298:	8b 46 fc             	mov    -0x4(%bp),%ax
    729b:	99                   	cwtd
    729c:	b9 0a 00             	mov    $0xa,%cx
    729f:	f7 f9                	idiv   %cx
    72a1:	89 46 fc             	mov    %ax,-0x4(%bp)
    72a4:	8b 7e fa             	mov    -0x6(%bp),%di
    72a7:	d1 e7                	shl    %di
    72a9:	ff 73 d8             	push   -0x28(%bp,%di)
    72ac:	8b 7e fa             	mov    -0x6(%bp),%di
    72af:	d1 e7                	shl    %di
    72b1:	ff 73 c4             	push   -0x3c(%bp,%di)
    72b4:	ff 76 f6             	push   -0xa(%bp)
    72b7:	ff 76 f4             	push   -0xc(%bp)
    72ba:	b8 01 00             	mov    $0x1,%ax
    72bd:	50                   	push   %ax
    72be:	ff 76 08             	push   0x8(%bp)
    72c1:	ff 76 06             	push   0x6(%bp)
    72c4:	31 c0                	xor    %ax,%ax
    72c6:	50                   	push   %ax
    72c7:	b0 02                	mov    $0x2,%al
    72c9:	50                   	push   %ax
    72ca:	b0 00                	mov    $0x0,%al
    72cc:	50                   	push   %ax
    72cd:	b0 01                	mov    $0x1,%al
    72cf:	50                   	push   %ax
    72d0:	31 c0                	xor    %ax,%ax
    72d2:	50                   	push   %ax
    72d3:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    72d8:	ff 4e fe             	decw   -0x2(%bp)
    72db:	83 7e fc 00          	cmpw   $0x0,-0x4(%bp)
    72df:	7e 06                	jle    0x72e7
    72e1:	83 7e fe 00          	cmpw   $0x0,-0x2(%bp)
    72e5:	7f 84                	jg     0x726b
    72e7:	83 7e fe 00          	cmpw   $0x0,-0x2(%bp)
    72eb:	7f 03                	jg     0x72f0
    72ed:	e9 86 00             	jmp    0x7376
    72f0:	8b 46 c2             	mov    -0x3e(%bp),%ax
    72f3:	99                   	cwtd
    72f4:	52                   	push   %dx
    72f5:	50                   	push   %ax
    72f6:	8b 46 f6             	mov    -0xa(%bp),%ax
    72f9:	31 d2                	xor    %dx,%dx
    72fb:	8b c8                	mov    %ax,%cx
    72fd:	8b da                	mov    %dx,%bx
    72ff:	8b 46 08             	mov    0x8(%bp),%ax
    7302:	99                   	cwtd
    7303:	2b c1                	sub    %cx,%ax
    7305:	1b d3                	sbb    %bx,%dx
    7307:	59                   	pop    %cx
    7308:	5b                   	pop    %bx
    7309:	2b c1                	sub    %cx,%ax
    730b:	1b d3                	sbb    %bx,%dx
    730d:	89 46 08             	mov    %ax,0x8(%bp)
    7310:	80 7e f9 00          	cmpb   $0x0,-0x7(%bp)
    7314:	74 30                	je     0x7346
    7316:	ff 76 ee             	push   -0x12(%bp)
    7319:	ff 76 ec             	push   -0x14(%bp)
    731c:	ff 76 f6             	push   -0xa(%bp)
    731f:	ff 76 f4             	push   -0xc(%bp)
    7322:	b8 01 00             	mov    $0x1,%ax
    7325:	50                   	push   %ax
    7326:	ff 76 08             	push   0x8(%bp)
    7329:	ff 76 06             	push   0x6(%bp)
    732c:	31 c0                	xor    %ax,%ax
    732e:	50                   	push   %ax
    732f:	b0 02                	mov    $0x2,%al
    7331:	50                   	push   %ax
    7332:	b0 00                	mov    $0x0,%al
    7334:	50                   	push   %ax
    7335:	b0 01                	mov    $0x1,%al
    7337:	50                   	push   %ax
    7338:	31 c0                	xor    %ax,%ax
    733a:	50                   	push   %ax
    733b:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7340:	c6 46 f9 00          	movb   $0x0,-0x7(%bp)
    7344:	eb 2a                	jmp    0x7370
    7346:	ff 76 f2             	push   -0xe(%bp)
    7349:	ff 76 f0             	push   -0x10(%bp)
    734c:	ff 76 f6             	push   -0xa(%bp)
    734f:	ff 76 f4             	push   -0xc(%bp)
    7352:	b8 01 00             	mov    $0x1,%ax
    7355:	50                   	push   %ax
    7356:	ff 76 08             	push   0x8(%bp)
    7359:	ff 76 06             	push   0x6(%bp)
    735c:	31 c0                	xor    %ax,%ax
    735e:	50                   	push   %ax
    735f:	b0 02                	mov    $0x2,%al
    7361:	50                   	push   %ax
    7362:	b0 00                	mov    $0x0,%al
    7364:	50                   	push   %ax
    7365:	b0 01                	mov    $0x1,%al
    7367:	50                   	push   %ax
    7368:	31 c0                	xor    %ax,%ax
    736a:	50                   	push   %ax
    736b:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7370:	ff 4e fe             	decw   -0x2(%bp)
    7373:	e9 71 ff             	jmp    0x72e7
    7376:	89 ec                	mov    %bp,%sp
    7378:	5d                   	pop    %bp
    7379:	ca 08 00             	lret   $0x8
    737c:	55                   	push   %bp
    737d:	89 e5                	mov    %sp,%bp
    737f:	81 ec c2 00          	sub    $0xc2,%sp
    7383:	8a 46 06             	mov    0x6(%bp),%al
    7386:	30 e4                	xor    %ah,%ah
    7388:	3d 01 00             	cmp    $0x1,%ax
    738b:	74 03                	je     0x7390
    738d:	e9 c8 00             	jmp    0x7458
    7390:	c7 46 fc 02 00       	movw   $0x2,-0x4(%bp)
    7395:	8b 46 fc             	mov    -0x4(%bp),%ax
    7398:	89 86 3e ff          	mov    %ax,-0xc2(%bp)
    739c:	b8 01 00             	mov    $0x1,%ax
    739f:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    73a3:	7f 34                	jg     0x73d9
    73a5:	89 46 fe             	mov    %ax,-0x2(%bp)
    73a8:	eb 03                	jmp    0x73ad
    73aa:	ff 46 fe             	incw   -0x2(%bp)
    73ad:	8b 7e fe             	mov    -0x2(%bp),%di
    73b0:	d1 e7                	shl    %di
    73b2:	c7 43 b6 dd 01       	movw   $0x1dd,-0x4a(%bp,%di)
    73b7:	8b 46 fe             	mov    -0x2(%bp),%ax
    73ba:	48                   	dec    %ax
    73bb:	b9 28 00             	mov    $0x28,%cx
    73be:	f7 e9                	imul   %cx
    73c0:	8b d0                	mov    %ax,%dx
    73c2:	b8 15 01             	mov    $0x115,%ax
    73c5:	2b c2                	sub    %dx,%ax
    73c7:	8b 7e fe             	mov    -0x2(%bp),%di
    73ca:	d1 e7                	shl    %di
    73cc:	89 83 7a ff          	mov    %ax,-0x86(%bp,%di)
    73d0:	8b 46 fe             	mov    -0x2(%bp),%ax
    73d3:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    73d7:	75 d1                	jne    0x73aa
    73d9:	c7 46 fa 19 01       	movw   $0x119,-0x6(%bp)
    73de:	c7 46 f8 14 00       	movw   $0x14,-0x8(%bp)
    73e3:	c7 46 f6 3c 00       	movw   $0x3c,-0xa(%bp)
    73e8:	c7 46 f4 27 00       	movw   $0x27,-0xc(%bp)
    73ed:	c7 86 40 ff e8 03    	movw   $0x3e8,-0xc0(%bp)
    73f3:	c7 86 42 ff f4 01    	movw   $0x1f4,-0xbe(%bp)
    73f9:	8b 46 fc             	mov    -0x4(%bp),%ax
    73fc:	89 86 3e ff          	mov    %ax,-0xc2(%bp)
    7400:	b8 01 00             	mov    $0x1,%ax
    7403:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    7407:	7f 4c                	jg     0x7455
    7409:	89 46 fe             	mov    %ax,-0x2(%bp)
    740c:	eb 03                	jmp    0x7411
    740e:	ff 46 fe             	incw   -0x2(%bp)
    7411:	8b 7e fe             	mov    -0x2(%bp),%di
    7414:	d1 e7                	shl    %di
    7416:	ff 73 b6             	push   -0x4a(%bp,%di)
    7419:	8b 7e fe             	mov    -0x2(%bp),%di
    741c:	d1 e7                	shl    %di
    741e:	ff b3 7a ff          	push   -0x86(%bp,%di)
    7422:	ff 76 f6             	push   -0xa(%bp)
    7425:	ff 76 f4             	push   -0xc(%bp)
    7428:	b8 01 00             	mov    $0x1,%ax
    742b:	50                   	push   %ax
    742c:	ff 76 fa             	push   -0x6(%bp)
    742f:	ff 76 f8             	push   -0x8(%bp)
    7432:	31 c0                	xor    %ax,%ax
    7434:	50                   	push   %ax
    7435:	b0 02                	mov    $0x2,%al
    7437:	50                   	push   %ax
    7438:	b0 00                	mov    $0x0,%al
    743a:	50                   	push   %ax
    743b:	b0 01                	mov    $0x1,%al
    743d:	50                   	push   %ax
    743e:	8b 7e fe             	mov    -0x2(%bp),%di
    7441:	d1 e7                	shl    %di
    7443:	ff b3 3e ff          	push   -0xc2(%bp,%di)
    7447:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    744c:	8b 46 fe             	mov    -0x2(%bp),%ax
    744f:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    7453:	75 b9                	jne    0x740e
    7455:	e9 36 04             	jmp    0x788e
    7458:	3d 02 00             	cmp    $0x2,%ax
    745b:	74 03                	je     0x7460
    745d:	e9 75 01             	jmp    0x75d5
    7460:	c7 46 fc 0e 00       	movw   $0xe,-0x4(%bp)
    7465:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    746a:	eb 03                	jmp    0x746f
    746c:	ff 46 fe             	incw   -0x2(%bp)
    746f:	8b 7e fe             	mov    -0x2(%bp),%di
    7472:	d1 e7                	shl    %di
    7474:	c7 43 b6 dd 01       	movw   $0x1dd,-0x4a(%bp,%di)
    7479:	8b 46 fe             	mov    -0x2(%bp),%ax
    747c:	48                   	dec    %ax
    747d:	b9 28 00             	mov    $0x28,%cx
    7480:	f7 e9                	imul   %cx
    7482:	05 25 00             	add    $0x25,%ax
    7485:	8b 7e fe             	mov    -0x2(%bp),%di
    7488:	d1 e7                	shl    %di
    748a:	89 83 7a ff          	mov    %ax,-0x86(%bp,%di)
    748e:	83 7e fe 05          	cmpw   $0x5,-0x2(%bp)
    7492:	75 d8                	jne    0x746c
    7494:	c7 46 c2 dd 01       	movw   $0x1dd,-0x3e(%bp)
    7499:	c7 46 86 9d 00       	movw   $0x9d,-0x7a(%bp)
    749e:	c7 46 fe 07 00       	movw   $0x7,-0x2(%bp)
    74a3:	eb 03                	jmp    0x74a8
    74a5:	ff 46 fe             	incw   -0x2(%bp)
    74a8:	8b 7e fe             	mov    -0x2(%bp),%di
    74ab:	d1 e7                	shl    %di
    74ad:	c7 43 b6 dd 01       	movw   $0x1dd,-0x4a(%bp,%di)
    74b2:	8b 46 fe             	mov    -0x2(%bp),%ax
    74b5:	2d 07 00             	sub    $0x7,%ax
    74b8:	b9 28 00             	mov    $0x28,%cx
    74bb:	f7 e9                	imul   %cx
    74bd:	05 75 00             	add    $0x75,%ax
    74c0:	8b 7e fe             	mov    -0x2(%bp),%di
    74c3:	d1 e7                	shl    %di
    74c5:	89 83 7a ff          	mov    %ax,-0x86(%bp,%di)
    74c9:	83 7e fe 09          	cmpw   $0x9,-0x2(%bp)
    74cd:	75 d6                	jne    0x74a5
    74cf:	c7 46 fe 0a 00       	movw   $0xa,-0x2(%bp)
    74d4:	eb 03                	jmp    0x74d9
    74d6:	ff 46 fe             	incw   -0x2(%bp)
    74d9:	8b 7e fe             	mov    -0x2(%bp),%di
    74dc:	d1 e7                	shl    %di
    74de:	c7 43 b6 dd 01       	movw   $0x1dd,-0x4a(%bp,%di)
    74e3:	8b 46 fe             	mov    -0x2(%bp),%ax
    74e6:	2d 0a 00             	sub    $0xa,%ax
    74e9:	b9 28 00             	mov    $0x28,%cx
    74ec:	f7 e9                	imul   %cx
    74ee:	8b d0                	mov    %ax,%dx
    74f0:	b8 9d 00             	mov    $0x9d,%ax
    74f3:	2b c2                	sub    %dx,%ax
    74f5:	8b 7e fe             	mov    -0x2(%bp),%di
    74f8:	d1 e7                	shl    %di
    74fa:	89 83 7a ff          	mov    %ax,-0x86(%bp,%di)
    74fe:	83 7e fe 0d          	cmpw   $0xd,-0x2(%bp)
    7502:	75 d2                	jne    0x74d6
    7504:	c7 46 d2 dd 01       	movw   $0x1dd,-0x2e(%bp)
    7509:	c7 46 96 ed 00       	movw   $0xed,-0x6a(%bp)
    750e:	c7 46 fa 19 01       	movw   $0x119,-0x6(%bp)
    7513:	c7 46 f8 14 00       	movw   $0x14,-0x8(%bp)
    7518:	c7 46 f6 3c 00       	movw   $0x3c,-0xa(%bp)
    751d:	c7 46 f4 27 00       	movw   $0x27,-0xc(%bp)
    7522:	c7 86 40 ff c8 00    	movw   $0xc8,-0xc0(%bp)
    7528:	c7 86 42 ff c8 00    	movw   $0xc8,-0xbe(%bp)
    752e:	c7 86 44 ff 64 00    	movw   $0x64,-0xbc(%bp)
    7534:	c7 86 46 ff 64 00    	movw   $0x64,-0xba(%bp)
    753a:	c7 86 48 ff 64 00    	movw   $0x64,-0xb8(%bp)
    7540:	c7 86 4a ff 64 00    	movw   $0x64,-0xb6(%bp)
    7546:	c7 86 4c ff 64 00    	movw   $0x64,-0xb4(%bp)
    754c:	c7 86 4e ff 64 00    	movw   $0x64,-0xb2(%bp)
    7552:	c7 86 50 ff 64 00    	movw   $0x64,-0xb0(%bp)
    7558:	c7 86 52 ff 64 00    	movw   $0x64,-0xae(%bp)
    755e:	c7 86 54 ff 64 00    	movw   $0x64,-0xac(%bp)
    7564:	c7 86 56 ff c8 00    	movw   $0xc8,-0xaa(%bp)
    756a:	c7 86 58 ff c8 00    	movw   $0xc8,-0xa8(%bp)
    7570:	c7 86 5a ff c8 00    	movw   $0xc8,-0xa6(%bp)
    7576:	8b 46 fc             	mov    -0x4(%bp),%ax
    7579:	89 86 3e ff          	mov    %ax,-0xc2(%bp)
    757d:	b8 01 00             	mov    $0x1,%ax
    7580:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    7584:	7f 4c                	jg     0x75d2
    7586:	89 46 fe             	mov    %ax,-0x2(%bp)
    7589:	eb 03                	jmp    0x758e
    758b:	ff 46 fe             	incw   -0x2(%bp)
    758e:	8b 7e fe             	mov    -0x2(%bp),%di
    7591:	d1 e7                	shl    %di
    7593:	ff 73 b6             	push   -0x4a(%bp,%di)
    7596:	8b 7e fe             	mov    -0x2(%bp),%di
    7599:	d1 e7                	shl    %di
    759b:	ff b3 7a ff          	push   -0x86(%bp,%di)
    759f:	ff 76 f6             	push   -0xa(%bp)
    75a2:	ff 76 f4             	push   -0xc(%bp)
    75a5:	b8 01 00             	mov    $0x1,%ax
    75a8:	50                   	push   %ax
    75a9:	ff 76 fa             	push   -0x6(%bp)
    75ac:	ff 76 f8             	push   -0x8(%bp)
    75af:	31 c0                	xor    %ax,%ax
    75b1:	50                   	push   %ax
    75b2:	b0 02                	mov    $0x2,%al
    75b4:	50                   	push   %ax
    75b5:	b0 00                	mov    $0x0,%al
    75b7:	50                   	push   %ax
    75b8:	b0 01                	mov    $0x1,%al
    75ba:	50                   	push   %ax
    75bb:	8b 7e fe             	mov    -0x2(%bp),%di
    75be:	d1 e7                	shl    %di
    75c0:	ff b3 3e ff          	push   -0xc2(%bp,%di)
    75c4:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    75c9:	8b 46 fe             	mov    -0x2(%bp),%ax
    75cc:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    75d0:	75 b9                	jne    0x758b
    75d2:	e9 b9 02             	jmp    0x788e
    75d5:	3d 03 00             	cmp    $0x3,%ax
    75d8:	74 03                	je     0x75dd
    75da:	e9 56 01             	jmp    0x7733
    75dd:	c7 46 fc 14 00       	movw   $0x14,-0x4(%bp)
    75e2:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    75e7:	eb 03                	jmp    0x75ec
    75e9:	ff 46 fe             	incw   -0x2(%bp)
    75ec:	8b 7e fe             	mov    -0x2(%bp),%di
    75ef:	d1 e7                	shl    %di
    75f1:	c7 43 b6 76 00       	movw   $0x76,-0x4a(%bp,%di)
    75f6:	8b 46 fe             	mov    -0x2(%bp),%ax
    75f9:	48                   	dec    %ax
    75fa:	b9 2b 00             	mov    $0x2b,%cx
    75fd:	f7 e9                	imul   %cx
    75ff:	40                   	inc    %ax
    7600:	8b 7e fe             	mov    -0x2(%bp),%di
    7603:	d1 e7                	shl    %di
    7605:	89 83 7a ff          	mov    %ax,-0x86(%bp,%di)
    7609:	83 7e fe 06          	cmpw   $0x6,-0x2(%bp)
    760d:	75 da                	jne    0x75e9
    760f:	c7 46 c4 76 00       	movw   $0x76,-0x3c(%bp)
    7614:	c7 46 88 ad 00       	movw   $0xad,-0x78(%bp)
    7619:	c7 46 c6 76 00       	movw   $0x76,-0x3a(%bp)
    761e:	c7 46 8a d8 00       	movw   $0xd8,-0x76(%bp)
    7623:	c7 46 c8 76 00       	movw   $0x76,-0x38(%bp)
    7628:	c7 46 8c 82 00       	movw   $0x82,-0x74(%bp)
    762d:	c7 46 ca 76 00       	movw   $0x76,-0x36(%bp)
    7632:	c7 46 8e ad 00       	movw   $0xad,-0x72(%bp)
    7637:	c7 46 cc 76 00       	movw   $0x76,-0x34(%bp)
    763c:	c7 46 90 d8 00       	movw   $0xd8,-0x70(%bp)
    7641:	c7 46 ce 76 00       	movw   $0x76,-0x32(%bp)
    7646:	c7 46 92 82 00       	movw   $0x82,-0x6e(%bp)
    764b:	c7 46 d0 76 00       	movw   $0x76,-0x30(%bp)
    7650:	c7 46 94 ad 00       	movw   $0xad,-0x6c(%bp)
    7655:	c7 46 d2 76 00       	movw   $0x76,-0x2e(%bp)
    765a:	c7 46 96 d8 00       	movw   $0xd8,-0x6a(%bp)
    765f:	c7 46 d4 76 00       	movw   $0x76,-0x2c(%bp)
    7664:	c7 46 98 82 00       	movw   $0x82,-0x68(%bp)
    7669:	c7 46 d6 76 00       	movw   $0x76,-0x2a(%bp)
    766e:	c7 46 9a ad 00       	movw   $0xad,-0x66(%bp)
    7673:	c7 46 d8 76 00       	movw   $0x76,-0x28(%bp)
    7678:	c7 46 9c d8 00       	movw   $0xd8,-0x64(%bp)
    767d:	c7 46 da 76 00       	movw   $0x76,-0x26(%bp)
    7682:	c7 46 9e 82 00       	movw   $0x82,-0x62(%bp)
    7687:	c7 46 dc 76 00       	movw   $0x76,-0x24(%bp)
    768c:	c7 46 a0 57 00       	movw   $0x57,-0x60(%bp)
    7691:	c7 46 de 76 00       	movw   $0x76,-0x22(%bp)
    7696:	c7 46 a2 03 01       	movw   $0x103,-0x5e(%bp)
    769b:	c7 46 e0 76 00       	movw   $0x76,-0x20(%bp)
    76a0:	c7 46 a4 01 00       	movw   $0x1,-0x5c(%bp)
    76a5:	c7 46 fa 13 00       	movw   $0x13,-0x6(%bp)
    76aa:	c7 46 f8 65 00       	movw   $0x65,-0x8(%bp)
    76af:	c7 46 f6 49 00       	movw   $0x49,-0xa(%bp)
    76b4:	c7 46 f4 2a 00       	movw   $0x2a,-0xc(%bp)
    76b9:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    76be:	eb 03                	jmp    0x76c3
    76c0:	ff 46 fe             	incw   -0x2(%bp)
    76c3:	8b 7e fe             	mov    -0x2(%bp),%di
    76c6:	d1 e7                	shl    %di
    76c8:	c7 83 3e ff 64 00    	movw   $0x64,-0xc2(%bp,%di)
    76ce:	83 7e fe 15          	cmpw   $0x15,-0x2(%bp)
    76d2:	75 ec                	jne    0x76c0
    76d4:	8b 46 fc             	mov    -0x4(%bp),%ax
    76d7:	89 86 3e ff          	mov    %ax,-0xc2(%bp)
    76db:	b8 01 00             	mov    $0x1,%ax
    76de:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    76e2:	7f 4c                	jg     0x7730
    76e4:	89 46 fe             	mov    %ax,-0x2(%bp)
    76e7:	eb 03                	jmp    0x76ec
    76e9:	ff 46 fe             	incw   -0x2(%bp)
    76ec:	8b 7e fe             	mov    -0x2(%bp),%di
    76ef:	d1 e7                	shl    %di
    76f1:	ff 73 b6             	push   -0x4a(%bp,%di)
    76f4:	8b 7e fe             	mov    -0x2(%bp),%di
    76f7:	d1 e7                	shl    %di
    76f9:	ff b3 7a ff          	push   -0x86(%bp,%di)
    76fd:	ff 76 f6             	push   -0xa(%bp)
    7700:	ff 76 f4             	push   -0xc(%bp)
    7703:	b8 01 00             	mov    $0x1,%ax
    7706:	50                   	push   %ax
    7707:	ff 76 fa             	push   -0x6(%bp)
    770a:	ff 76 f8             	push   -0x8(%bp)
    770d:	31 c0                	xor    %ax,%ax
    770f:	50                   	push   %ax
    7710:	b0 02                	mov    $0x2,%al
    7712:	50                   	push   %ax
    7713:	b0 00                	mov    $0x0,%al
    7715:	50                   	push   %ax
    7716:	b0 01                	mov    $0x1,%al
    7718:	50                   	push   %ax
    7719:	8b 7e fe             	mov    -0x2(%bp),%di
    771c:	d1 e7                	shl    %di
    771e:	ff b3 3e ff          	push   -0xc2(%bp,%di)
    7722:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7727:	8b 46 fe             	mov    -0x2(%bp),%ax
    772a:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    772e:	75 b9                	jne    0x76e9
    7730:	e9 5b 01             	jmp    0x788e
    7733:	3d 04 00             	cmp    $0x4,%ax
    7736:	74 03                	je     0x773b
    7738:	e9 53 01             	jmp    0x788e
    773b:	c7 46 fc 14 00       	movw   $0x14,-0x4(%bp)
    7740:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    7745:	eb 03                	jmp    0x774a
    7747:	ff 46 fe             	incw   -0x2(%bp)
    774a:	8b 7e fe             	mov    -0x2(%bp),%di
    774d:	d1 e7                	shl    %di
    774f:	c7 43 b6 76 00       	movw   $0x76,-0x4a(%bp,%di)
    7754:	8b 46 fe             	mov    -0x2(%bp),%ax
    7757:	48                   	dec    %ax
    7758:	b9 2b 00             	mov    $0x2b,%cx
    775b:	f7 e9                	imul   %cx
    775d:	40                   	inc    %ax
    775e:	8b 7e fe             	mov    -0x2(%bp),%di
    7761:	d1 e7                	shl    %di
    7763:	89 83 7a ff          	mov    %ax,-0x86(%bp,%di)
    7767:	83 7e fe 06          	cmpw   $0x6,-0x2(%bp)
    776b:	75 da                	jne    0x7747
    776d:	c7 46 c4 76 00       	movw   $0x76,-0x3c(%bp)
    7772:	c7 46 88 ad 00       	movw   $0xad,-0x78(%bp)
    7777:	c7 46 c6 76 00       	movw   $0x76,-0x3a(%bp)
    777c:	c7 46 8a d8 00       	movw   $0xd8,-0x76(%bp)
    7781:	c7 46 c8 76 00       	movw   $0x76,-0x38(%bp)
    7786:	c7 46 8c 82 00       	movw   $0x82,-0x74(%bp)
    778b:	c7 46 ca 76 00       	movw   $0x76,-0x36(%bp)
    7790:	c7 46 8e ad 00       	movw   $0xad,-0x72(%bp)
    7795:	c7 46 cc 76 00       	movw   $0x76,-0x34(%bp)
    779a:	c7 46 90 d8 00       	movw   $0xd8,-0x70(%bp)
    779f:	c7 46 ce 76 00       	movw   $0x76,-0x32(%bp)
    77a4:	c7 46 92 82 00       	movw   $0x82,-0x6e(%bp)
    77a9:	c7 46 d0 76 00       	movw   $0x76,-0x30(%bp)
    77ae:	c7 46 94 ad 00       	movw   $0xad,-0x6c(%bp)
    77b3:	c7 46 d2 76 00       	movw   $0x76,-0x2e(%bp)
    77b8:	c7 46 96 d8 00       	movw   $0xd8,-0x6a(%bp)
    77bd:	c7 46 d4 76 00       	movw   $0x76,-0x2c(%bp)
    77c2:	c7 46 98 82 00       	movw   $0x82,-0x68(%bp)
    77c7:	c7 46 d6 76 00       	movw   $0x76,-0x2a(%bp)
    77cc:	c7 46 9a ad 00       	movw   $0xad,-0x66(%bp)
    77d1:	c7 46 d8 76 00       	movw   $0x76,-0x28(%bp)
    77d6:	c7 46 9c d8 00       	movw   $0xd8,-0x64(%bp)
    77db:	c7 46 da 76 00       	movw   $0x76,-0x26(%bp)
    77e0:	c7 46 9e 82 00       	movw   $0x82,-0x62(%bp)
    77e5:	c7 46 dc 76 00       	movw   $0x76,-0x24(%bp)
    77ea:	c7 46 a0 57 00       	movw   $0x57,-0x60(%bp)
    77ef:	c7 46 de 76 00       	movw   $0x76,-0x22(%bp)
    77f4:	c7 46 a2 03 01       	movw   $0x103,-0x5e(%bp)
    77f9:	c7 46 e0 76 00       	movw   $0x76,-0x20(%bp)
    77fe:	c7 46 a4 01 00       	movw   $0x1,-0x5c(%bp)
    7803:	c7 46 fa 13 02       	movw   $0x213,-0x6(%bp)
    7808:	c7 46 f8 65 00       	movw   $0x65,-0x8(%bp)
    780d:	c7 46 f6 49 00       	movw   $0x49,-0xa(%bp)
    7812:	c7 46 f4 2a 00       	movw   $0x2a,-0xc(%bp)
    7817:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    781c:	eb 03                	jmp    0x7821
    781e:	ff 46 fe             	incw   -0x2(%bp)
    7821:	8b 7e fe             	mov    -0x2(%bp),%di
    7824:	d1 e7                	shl    %di
    7826:	c7 83 3e ff 64 00    	movw   $0x64,-0xc2(%bp,%di)
    782c:	83 7e fe 15          	cmpw   $0x15,-0x2(%bp)
    7830:	75 ec                	jne    0x781e
    7832:	8b 46 fc             	mov    -0x4(%bp),%ax
    7835:	89 86 3e ff          	mov    %ax,-0xc2(%bp)
    7839:	b8 01 00             	mov    $0x1,%ax
    783c:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    7840:	7f 4c                	jg     0x788e
    7842:	89 46 fe             	mov    %ax,-0x2(%bp)
    7845:	eb 03                	jmp    0x784a
    7847:	ff 46 fe             	incw   -0x2(%bp)
    784a:	8b 7e fe             	mov    -0x2(%bp),%di
    784d:	d1 e7                	shl    %di
    784f:	ff 73 b6             	push   -0x4a(%bp,%di)
    7852:	8b 7e fe             	mov    -0x2(%bp),%di
    7855:	d1 e7                	shl    %di
    7857:	ff b3 7a ff          	push   -0x86(%bp,%di)
    785b:	ff 76 f6             	push   -0xa(%bp)
    785e:	ff 76 f4             	push   -0xc(%bp)
    7861:	b8 01 00             	mov    $0x1,%ax
    7864:	50                   	push   %ax
    7865:	ff 76 fa             	push   -0x6(%bp)
    7868:	ff 76 f8             	push   -0x8(%bp)
    786b:	31 c0                	xor    %ax,%ax
    786d:	50                   	push   %ax
    786e:	b0 02                	mov    $0x2,%al
    7870:	50                   	push   %ax
    7871:	b0 00                	mov    $0x0,%al
    7873:	50                   	push   %ax
    7874:	b0 01                	mov    $0x1,%al
    7876:	50                   	push   %ax
    7877:	8b 7e fe             	mov    -0x2(%bp),%di
    787a:	d1 e7                	shl    %di
    787c:	ff b3 3e ff          	push   -0xc2(%bp,%di)
    7880:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7885:	8b 46 fe             	mov    -0x2(%bp),%ax
    7888:	3b 86 3e ff          	cmp    -0xc2(%bp),%ax
    788c:	75 b9                	jne    0x7847
    788e:	89 ec                	mov    %bp,%sp
    7890:	5d                   	pop    %bp
    7891:	ca 02 00             	lret   $0x2
    7894:	55                   	push   %bp
    7895:	89 e5                	mov    %sp,%bp
    7897:	83 ec 04             	sub    $0x4,%sp
    789a:	ff 36 24 3d          	push   0x3d24
    789e:	ff 36 22 3d          	push   0x3d22
    78a2:	31 c0                	xor    %ax,%ax
    78a4:	50                   	push   %ax
    78a5:	ff 36 1a 3d          	push   0x3d1a
    78a9:	ff 36 1c 3d          	push   0x3d1c
    78ad:	b8 01 00             	mov    $0x1,%ax
    78b0:	50                   	push   %ax
    78b1:	b0 02                	mov    $0x2,%al
    78b3:	50                   	push   %ax
    78b4:	b0 00                	mov    $0x0,%al
    78b6:	50                   	push   %ax
    78b7:	b0 00                	mov    $0x0,%al
    78b9:	50                   	push   %ax
    78ba:	31 c0                	xor    %ax,%ax
    78bc:	50                   	push   %ax
    78bd:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    78c2:	c4 7e 06             	les    0x6(%bp),%di
    78c5:	26 8a 05             	mov    %es:(%di),%al
    78c8:	30 e4                	xor    %ah,%ah
    78ca:	89 46 fc             	mov    %ax,-0x4(%bp)
    78cd:	b8 01 00             	mov    $0x1,%ax
    78d0:	3b 46 fc             	cmp    -0x4(%bp),%ax
    78d3:	7e 03                	jle    0x78d8
    78d5:	e9 8b 00             	jmp    0x7963
    78d8:	89 46 fe             	mov    %ax,-0x2(%bp)
    78db:	eb 03                	jmp    0x78e0
    78dd:	ff 46 fe             	incw   -0x2(%bp)
    78e0:	8b 46 fe             	mov    -0x2(%bp),%ax
    78e3:	c4 7e 06             	les    0x6(%bp),%di
    78e6:	03 f8                	add    %ax,%di
    78e8:	26 8a 05             	mov    %es:(%di),%al
    78eb:	30 e4                	xor    %ah,%ah
    78ed:	8b f8                	mov    %ax,%di
    78ef:	d1 e7                	shl    %di
    78f1:	ff b5 ec 3c          	push   0x3cec(%di)
    78f5:	8b 46 fe             	mov    -0x2(%bp),%ax
    78f8:	c4 7e 06             	les    0x6(%bp),%di
    78fb:	03 f8                	add    %ax,%di
    78fd:	26 8a 05             	mov    %es:(%di),%al
    7900:	30 e4                	xor    %ah,%ah
    7902:	8b f8                	mov    %ax,%di
    7904:	d1 e7                	shl    %di
    7906:	ff b5 a2 3d          	push   0x3da2(%di)
    790a:	a0 28 3d             	mov    0x3d28,%al
    790d:	30 e4                	xor    %ah,%ah
    790f:	50                   	push   %ax
    7910:	a0 29 3d             	mov    0x3d29,%al
    7913:	30 e4                	xor    %ah,%ah
    7915:	50                   	push   %ax
    7916:	b8 01 00             	mov    $0x1,%ax
    7919:	50                   	push   %ax
    791a:	8b 46 fe             	mov    -0x2(%bp),%ax
    791d:	48                   	dec    %ax
    791e:	8b c8                	mov    %ax,%cx
    7920:	a0 2a 3d             	mov    0x3d2a,%al
    7923:	30 e4                	xor    %ah,%ah
    7925:	8b d0                	mov    %ax,%dx
    7927:	a0 28 3d             	mov    0x3d28,%al
    792a:	30 e4                	xor    %ah,%ah
    792c:	03 c2                	add    %dx,%ax
    792e:	f7 e9                	imul   %cx
    7930:	99                   	cwtd
    7931:	8b c8                	mov    %ax,%cx
    7933:	8b da                	mov    %dx,%bx
    7935:	a1 1a 3d             	mov    0x3d1a,%ax
    7938:	31 d2                	xor    %dx,%dx
    793a:	03 c1                	add    %cx,%ax
    793c:	13 d3                	adc    %bx,%dx
    793e:	50                   	push   %ax
    793f:	ff 36 1c 3d          	push   0x3d1c
    7943:	b8 01 00             	mov    $0x1,%ax
    7946:	50                   	push   %ax
    7947:	b0 02                	mov    $0x2,%al
    7949:	50                   	push   %ax
    794a:	b0 00                	mov    $0x0,%al
    794c:	50                   	push   %ax
    794d:	b0 00                	mov    $0x0,%al
    794f:	50                   	push   %ax
    7950:	31 c0                	xor    %ax,%ax
    7952:	50                   	push   %ax
    7953:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7958:	8b 46 fe             	mov    -0x2(%bp),%ax
    795b:	3b 46 fc             	cmp    -0x4(%bp),%ax
    795e:	74 03                	je     0x7963
    7960:	e9 7a ff             	jmp    0x78dd
    7963:	ff 36 1a 3d          	push   0x3d1a
    7967:	ff 36 1c 3d          	push   0x3d1c
    796b:	ff 36 1e 3d          	push   0x3d1e
    796f:	ff 36 20 3d          	push   0x3d20
    7973:	b8 01 00             	mov    $0x1,%ax
    7976:	50                   	push   %ax
    7977:	ff 36 16 3d          	push   0x3d16
    797b:	ff 36 18 3d          	push   0x3d18
    797f:	31 c0                	xor    %ax,%ax
    7981:	50                   	push   %ax
    7982:	b0 02                	mov    $0x2,%al
    7984:	50                   	push   %ax
    7985:	b0 00                	mov    $0x0,%al
    7987:	50                   	push   %ax
    7988:	b0 00                	mov    $0x0,%al
    798a:	50                   	push   %ax
    798b:	31 c0                	xor    %ax,%ax
    798d:	50                   	push   %ax
    798e:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7993:	89 ec                	mov    %bp,%sp
    7995:	5d                   	pop    %bp
    7996:	ca 04 00             	lret   $0x4
    7999:	55                   	push   %bp
    799a:	89 e5                	mov    %sp,%bp
    799c:	b8 01 00             	mov    $0x1,%ax
    799f:	2b 06 9e 3f          	sub    0x3f9e,%ax
    79a3:	a3 9e 3f             	mov    %ax,0x3f9e
    79a6:	ff 76 08             	push   0x8(%bp)
    79a9:	ff 76 06             	push   0x6(%bp)
    79ac:	9a 25 0b f5 17       	lcall  $0x17f5,$0xb25
    79b1:	a0 28 3d             	mov    0x3d28,%al
    79b4:	30 e4                	xor    %ah,%ah
    79b6:	2d 02 00             	sub    $0x2,%ax
    79b9:	50                   	push   %ax
    79ba:	31 c0                	xor    %ax,%ax
    79bc:	50                   	push   %ax
    79bd:	9a 44 0b f5 17       	lcall  $0x17f5,$0xb44
    79c2:	89 ec                	mov    %bp,%sp
    79c4:	5d                   	pop    %bp
    79c5:	ca 04 00             	lret   $0x4
    79c8:	00 00                	add    %al,(%bx,%si)
    79ca:	00 00                	add    %al,(%bx,%si)
    79cc:	ff                   	(bad)
    79cd:	ff                   	(bad)
    79ce:	ff                   	(bad)
    79cf:	ff                   	(bad)
    79d0:	ff                   	(bad)
    79d1:	ff                   	(bad)
    79d2:	ff                   	(bad)
    79d3:	ff                   	(bad)
    79d4:	ff                   	(bad)
    79d5:	ff                   	(bad)
    79d6:	ff 07                	incw   (%bx)
	...
    79e8:	55                   	push   %bp
    79e9:	89 e5                	mov    %sp,%bp
    79eb:	81 ec 0e 01          	sub    $0x10e,%sp
    79ef:	80 7e 0a 01          	cmpb   $0x1,0xa(%bp)
    79f3:	75 43                	jne    0x7a38
    79f5:	b8 01 00             	mov    $0x1,%ax
    79f8:	50                   	push   %ax
    79f9:	b8 22 3d             	mov    $0x3d22,%ax
    79fc:	8c da                	mov    %ds,%dx
    79fe:	52                   	push   %dx
    79ff:	50                   	push   %ax
    7a00:	b8 05 00             	mov    $0x5,%ax
    7a03:	50                   	push   %ax
    7a04:	ff 36 1e 3d          	push   0x3d1e
    7a08:	ff 36 20 3d          	push   0x3d20
    7a0c:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    7a11:	ff 36 24 3d          	push   0x3d24
    7a15:	ff 36 22 3d          	push   0x3d22
    7a19:	ff 36 1a 3d          	push   0x3d1a
    7a1d:	ff 36 1c 3d          	push   0x3d1c
    7a21:	ff 36 1e 3d          	push   0x3d1e
    7a25:	ff 36 20 3d          	push   0x3d20
    7a29:	b8 01 00             	mov    $0x1,%ax
    7a2c:	50                   	push   %ax
    7a2d:	b0 00                	mov    $0x0,%al
    7a2f:	50                   	push   %ax
    7a30:	b0 00                	mov    $0x0,%al
    7a32:	50                   	push   %ax
    7a33:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    7a38:	c4 7e 06             	les    0x6(%bp),%di
    7a3b:	26 8a 05             	mov    %es:(%di),%al
    7a3e:	3a 06 98 3e          	cmp    0x3e98,%al
    7a42:	76 15                	jbe    0x7a59
    7a44:	c4 7e 06             	les    0x6(%bp),%di
    7a47:	06                   	push   %es
    7a48:	57                   	push   %di
    7a49:	a0 98 3e             	mov    0x3e98,%al
    7a4c:	30 e4                	xor    %ah,%ah
    7a4e:	40                   	inc    %ax
    7a4f:	50                   	push   %ax
    7a50:	b8 00 01             	mov    $0x100,%ax
    7a53:	50                   	push   %ax
    7a54:	9a d0 07 ce 1d       	lcall  $0x1dce,$0x7d0
    7a59:	80 7e 0a 01          	cmpb   $0x1,0xa(%bp)
    7a5d:	75 09                	jne    0x7a68
    7a5f:	c4 7e 06             	les    0x6(%bp),%di
    7a62:	06                   	push   %es
    7a63:	57                   	push   %di
    7a64:	0e                   	push   %cs
    7a65:	e8 2c fe             	call   0x7894
    7a68:	31 c0                	xor    %ax,%ax
    7a6a:	50                   	push   %ax
    7a6b:	31 c0                	xor    %ax,%ax
    7a6d:	50                   	push   %ax
    7a6e:	b8 02 00             	mov    $0x2,%ax
    7a71:	50                   	push   %ax
    7a72:	9a 71 0b f5 17       	lcall  $0x17f5,$0xb71
    7a77:	b8 01 00             	mov    $0x1,%ax
    7a7a:	50                   	push   %ax
    7a7b:	9a 72 11 f5 17       	lcall  $0x17f5,$0x1172
    7a80:	b8 02 00             	mov    $0x2,%ax
    7a83:	50                   	push   %ax
    7a84:	9a 4c 14 f5 17       	lcall  $0x17f5,$0x144c
    7a89:	31 c0                	xor    %ax,%ax
    7a8b:	a3 9e 3f             	mov    %ax,0x3f9e
    7a8e:	a0 29 3d             	mov    0x3d29,%al
    7a91:	30 e4                	xor    %ah,%ah
    7a93:	03 06 18 3d          	add    0x3d18,%ax
    7a97:	40                   	inc    %ax
    7a98:	a3 a2 3f             	mov    %ax,0x3fa2
    7a9b:	c4 7e 06             	les    0x6(%bp),%di
    7a9e:	06                   	push   %es
    7a9f:	57                   	push   %di
    7aa0:	8d 7e f2             	lea    -0xe(%bp),%di
    7aa3:	16                   	push   %ss
    7aa4:	57                   	push   %di
    7aa5:	b8 08 00             	mov    $0x8,%ax
    7aa8:	50                   	push   %ax
    7aa9:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    7aae:	c6 06 9a 3e 00       	movb   $0x0,0x3e9a
    7ab3:	c6 06 99 3e 01       	movb   $0x1,0x3e99
    7ab8:	c7 06 26 3d 20 39    	movw   $0x3920,0x3d26
    7abe:	a0 99 3e             	mov    0x3e99,%al
    7ac1:	30 e4                	xor    %ah,%ah
    7ac3:	48                   	dec    %ax
    7ac4:	8b c8                	mov    %ax,%cx
    7ac6:	a0 2a 3d             	mov    0x3d2a,%al
    7ac9:	30 e4                	xor    %ah,%ah
    7acb:	8b d0                	mov    %ax,%dx
    7acd:	a0 28 3d             	mov    0x3d28,%al
    7ad0:	30 e4                	xor    %ah,%ah
    7ad2:	03 c2                	add    %dx,%ax
    7ad4:	f7 e9                	imul   %cx
    7ad6:	03 06 16 3d          	add    0x3d16,%ax
    7ada:	a3 a0 3f             	mov    %ax,0x3fa0
    7add:	ff 36 a0 3f          	push   0x3fa0
    7ae1:	ff 36 a2 3f          	push   0x3fa2
    7ae5:	0e                   	push   %cs
    7ae6:	e8 b0 fe             	call   0x7999
    7ae9:	9a 4b 0b 13 1b       	lcall  $0x1b13,$0xb4b
    7aee:	08 c0                	or     %al,%al
    7af0:	75 03                	jne    0x7af5
    7af2:	e9 7d 02             	jmp    0x7d72
    7af5:	9a 5d 0b 13 1b       	lcall  $0x1b13,$0xb5d
    7afa:	a3 26 3d             	mov    %ax,0x3d26
    7afd:	a0 26 3d             	mov    0x3d26,%al
    7b00:	50                   	push   %ax
    7b01:	bf a8 19             	mov    $0x19a8,%di
    7b04:	0e                   	push   %cs
    7b05:	57                   	push   %di
    7b06:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    7b0b:	75 03                	jne    0x7b10
    7b0d:	e9 a7 00             	jmp    0x7bb7
    7b10:	8d be f2 fe          	lea    -0x10e(%bp),%di
    7b14:	16                   	push   %ss
    7b15:	57                   	push   %di
    7b16:	a0 26 3d             	mov    0x3d26,%al
    7b19:	50                   	push   %ax
    7b1a:	9a 4f 07 ce 1d       	lcall  $0x1dce,$0x74f
    7b1f:	bf 9c 3e             	mov    $0x3e9c,%di
    7b22:	1e                   	push   %ds
    7b23:	57                   	push   %di
    7b24:	b8 ff 00             	mov    $0xff,%ax
    7b27:	50                   	push   %ax
    7b28:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    7b2d:	80 3e 9c 3f 00       	cmpb   $0x0,0x3f9c
    7b32:	75 3b                	jne    0x7b6f
    7b34:	a0 99 3e             	mov    0x3e99,%al
    7b37:	3a 06 9a 3e          	cmp    0x3e9a,%al
    7b3b:	76 1f                	jbe    0x7b5c
    7b3d:	bf 9c 3e             	mov    $0x3e9c,%di
    7b40:	1e                   	push   %ds
    7b41:	57                   	push   %di
    7b42:	c4 7e 06             	les    0x6(%bp),%di
    7b45:	06                   	push   %es
    7b46:	57                   	push   %di
    7b47:	b8 ff 00             	mov    $0xff,%ax
    7b4a:	50                   	push   %ax
    7b4b:	a0 99 3e             	mov    0x3e99,%al
    7b4e:	30 e4                	xor    %ah,%ah
    7b50:	50                   	push   %ax
    7b51:	9a 7c 07 ce 1d       	lcall  $0x1dce,$0x77c
    7b56:	fe 06 9a 3e          	incb   0x3e9a
    7b5a:	eb 11                	jmp    0x7b6d
    7b5c:	8a 16 26 3d          	mov    0x3d26,%dl
    7b60:	a0 99 3e             	mov    0x3e99,%al
    7b63:	30 e4                	xor    %ah,%ah
    7b65:	c4 7e 06             	les    0x6(%bp),%di
    7b68:	03 f8                	add    %ax,%di
    7b6a:	26 88 15             	mov    %dl,%es:(%di)
    7b6d:	eb 26                	jmp    0x7b95
    7b6f:	a0 9a 3e             	mov    0x3e9a,%al
    7b72:	3a 06 98 3e          	cmp    0x3e98,%al
    7b76:	73 1d                	jae    0x7b95
    7b78:	bf 9c 3e             	mov    $0x3e9c,%di
    7b7b:	1e                   	push   %ds
    7b7c:	57                   	push   %di
    7b7d:	c4 7e 06             	les    0x6(%bp),%di
    7b80:	06                   	push   %es
    7b81:	57                   	push   %di
    7b82:	b8 ff 00             	mov    $0xff,%ax
    7b85:	50                   	push   %ax
    7b86:	a0 99 3e             	mov    0x3e99,%al
    7b89:	30 e4                	xor    %ah,%ah
    7b8b:	50                   	push   %ax
    7b8c:	9a 7c 07 ce 1d       	lcall  $0x1dce,$0x77c
    7b91:	fe 06 9a 3e          	incb   0x3e9a
    7b95:	a0 99 3e             	mov    0x3e99,%al
    7b98:	3a 06 98 3e          	cmp    0x3e98,%al
    7b9c:	73 04                	jae    0x7ba2
    7b9e:	fe 06 99 3e          	incb   0x3e99
    7ba2:	c4 7e 06             	les    0x6(%bp),%di
    7ba5:	06                   	push   %es
    7ba6:	57                   	push   %di
    7ba7:	a0 9a 3e             	mov    0x3e9a,%al
    7baa:	30 e4                	xor    %ah,%ah
    7bac:	40                   	inc    %ax
    7bad:	50                   	push   %ax
    7bae:	b8 00 01             	mov    $0x100,%ax
    7bb1:	50                   	push   %ax
    7bb2:	9a d0 07 ce 1d       	lcall  $0x1dce,$0x7d0
    7bb7:	c4 7e 06             	les    0x6(%bp),%di
    7bba:	26 8a 05             	mov    %es:(%di),%al
    7bbd:	a2 9a 3e             	mov    %al,0x3e9a
    7bc0:	a1 26 3d             	mov    0x3d26,%ax
    7bc3:	3d 00 52             	cmp    $0x5200,%ax
    7bc6:	75 12                	jne    0x7bda
    7bc8:	a0 9c 3f             	mov    0x3f9c,%al
    7bcb:	30 e4                	xor    %ah,%ah
    7bcd:	8b d0                	mov    %ax,%dx
    7bcf:	b8 01 00             	mov    $0x1,%ax
    7bd2:	2b c2                	sub    %dx,%ax
    7bd4:	a2 9c 3f             	mov    %al,0x3f9c
    7bd7:	e9 5f 01             	jmp    0x7d39
    7bda:	3d 00 47             	cmp    $0x4700,%ax
    7bdd:	75 08                	jne    0x7be7
    7bdf:	c6 06 99 3e 01       	movb   $0x1,0x3e99
    7be4:	e9 52 01             	jmp    0x7d39
    7be7:	3d 00 4f             	cmp    $0x4f00,%ax
    7bea:	75 15                	jne    0x7c01
    7bec:	a0 9a 3e             	mov    0x3e9a,%al
    7bef:	3a 06 98 3e          	cmp    0x3e98,%al
    7bf3:	73 09                	jae    0x7bfe
    7bf5:	a0 9a 3e             	mov    0x3e9a,%al
    7bf8:	30 e4                	xor    %ah,%ah
    7bfa:	40                   	inc    %ax
    7bfb:	a2 99 3e             	mov    %al,0x3e99
    7bfe:	e9 38 01             	jmp    0x7d39
    7c01:	3d 00 4d             	cmp    $0x4d00,%ax
    7c04:	75 19                	jne    0x7c1f
    7c06:	a0 99 3e             	mov    0x3e99,%al
    7c09:	3a 06 9a 3e          	cmp    0x3e9a,%al
    7c0d:	77 0d                	ja     0x7c1c
    7c0f:	a0 99 3e             	mov    0x3e99,%al
    7c12:	3a 06 98 3e          	cmp    0x3e98,%al
    7c16:	73 04                	jae    0x7c1c
    7c18:	fe 06 99 3e          	incb   0x3e99
    7c1c:	e9 1a 01             	jmp    0x7d39
    7c1f:	3d 00 4b             	cmp    $0x4b00,%ax
    7c22:	75 0e                	jne    0x7c32
    7c24:	80 3e 99 3e 01       	cmpb   $0x1,0x3e99
    7c29:	76 04                	jbe    0x7c2f
    7c2b:	fe 0e 99 3e          	decb   0x3e99
    7c2f:	e9 07 01             	jmp    0x7d39
    7c32:	3d 00 53             	cmp    $0x5300,%ax
    7c35:	75 69                	jne    0x7ca0
    7c37:	a0 99 3e             	mov    0x3e99,%al
    7c3a:	3a 06 9a 3e          	cmp    0x3e9a,%al
    7c3e:	76 07                	jbe    0x7c47
    7c40:	31 c0                	xor    %ax,%ax
    7c42:	89 46 fe             	mov    %ax,-0x2(%bp)
    7c45:	eb 11                	jmp    0x7c58
    7c47:	a0 99 3e             	mov    0x3e99,%al
    7c4a:	30 e4                	xor    %ah,%ah
    7c4c:	8b d0                	mov    %ax,%dx
    7c4e:	a0 9a 3e             	mov    0x3e9a,%al
    7c51:	30 e4                	xor    %ah,%ah
    7c53:	2b c2                	sub    %dx,%ax
    7c55:	89 46 fe             	mov    %ax,-0x2(%bp)
    7c58:	8d be f2 fe          	lea    -0x10e(%bp),%di
    7c5c:	16                   	push   %ss
    7c5d:	57                   	push   %di
    7c5e:	c4 7e 06             	les    0x6(%bp),%di
    7c61:	06                   	push   %es
    7c62:	57                   	push   %di
    7c63:	a0 99 3e             	mov    0x3e99,%al
    7c66:	30 e4                	xor    %ah,%ah
    7c68:	40                   	inc    %ax
    7c69:	50                   	push   %ax
    7c6a:	ff 76 fe             	push   -0x2(%bp)
    7c6d:	9a 80 06 ce 1d       	lcall  $0x1dce,$0x680
    7c72:	bf 9c 3e             	mov    $0x3e9c,%di
    7c75:	1e                   	push   %ds
    7c76:	57                   	push   %di
    7c77:	b8 ff 00             	mov    $0xff,%ax
    7c7a:	50                   	push   %ax
    7c7b:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    7c80:	bf 9c 3e             	mov    $0x3e9c,%di
    7c83:	1e                   	push   %ds
    7c84:	57                   	push   %di
    7c85:	c4 7e 06             	les    0x6(%bp),%di
    7c88:	06                   	push   %es
    7c89:	57                   	push   %di
    7c8a:	b8 ff 00             	mov    $0xff,%ax
    7c8d:	50                   	push   %ax
    7c8e:	a0 99 3e             	mov    0x3e99,%al
    7c91:	30 e4                	xor    %ah,%ah
    7c93:	50                   	push   %ax
    7c94:	9a 7c 07 ce 1d       	lcall  $0x1dce,$0x77c
    7c99:	fe 0e 9a 3e          	decb   0x3e9a
    7c9d:	e9 99 00             	jmp    0x7d39
    7ca0:	3d 08 0e             	cmp    $0xe08,%ax
    7ca3:	75 73                	jne    0x7d18
    7ca5:	80 3e 99 3e 01       	cmpb   $0x1,0x3e99
    7caa:	76 6a                	jbe    0x7d16
    7cac:	a0 99 3e             	mov    0x3e99,%al
    7caf:	3a 06 9a 3e          	cmp    0x3e9a,%al
    7cb3:	76 07                	jbe    0x7cbc
    7cb5:	31 c0                	xor    %ax,%ax
    7cb7:	89 46 fe             	mov    %ax,-0x2(%bp)
    7cba:	eb 12                	jmp    0x7cce
    7cbc:	a0 99 3e             	mov    0x3e99,%al
    7cbf:	30 e4                	xor    %ah,%ah
    7cc1:	8b d0                	mov    %ax,%dx
    7cc3:	a0 9a 3e             	mov    0x3e9a,%al
    7cc6:	30 e4                	xor    %ah,%ah
    7cc8:	2b c2                	sub    %dx,%ax
    7cca:	40                   	inc    %ax
    7ccb:	89 46 fe             	mov    %ax,-0x2(%bp)
    7cce:	8d be f2 fe          	lea    -0x10e(%bp),%di
    7cd2:	16                   	push   %ss
    7cd3:	57                   	push   %di
    7cd4:	c4 7e 06             	les    0x6(%bp),%di
    7cd7:	06                   	push   %es
    7cd8:	57                   	push   %di
    7cd9:	a0 99 3e             	mov    0x3e99,%al
    7cdc:	30 e4                	xor    %ah,%ah
    7cde:	50                   	push   %ax
    7cdf:	ff 76 fe             	push   -0x2(%bp)
    7ce2:	9a 80 06 ce 1d       	lcall  $0x1dce,$0x680
    7ce7:	bf 9c 3e             	mov    $0x3e9c,%di
    7cea:	1e                   	push   %ds
    7ceb:	57                   	push   %di
    7cec:	b8 ff 00             	mov    $0xff,%ax
    7cef:	50                   	push   %ax
    7cf0:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    7cf5:	fe 0e 99 3e          	decb   0x3e99
    7cf9:	bf 9c 3e             	mov    $0x3e9c,%di
    7cfc:	1e                   	push   %ds
    7cfd:	57                   	push   %di
    7cfe:	c4 7e 06             	les    0x6(%bp),%di
    7d01:	06                   	push   %es
    7d02:	57                   	push   %di
    7d03:	b8 ff 00             	mov    $0xff,%ax
    7d06:	50                   	push   %ax
    7d07:	a0 99 3e             	mov    0x3e99,%al
    7d0a:	30 e4                	xor    %ah,%ah
    7d0c:	50                   	push   %ax
    7d0d:	9a 7c 07 ce 1d       	lcall  $0x1dce,$0x77c
    7d12:	fe 0e 9a 3e          	decb   0x3e9a
    7d16:	eb 21                	jmp    0x7d39
    7d18:	3d 1b 01             	cmp    $0x11b,%ax
    7d1b:	75 1c                	jne    0x7d39
    7d1d:	8d 7e f2             	lea    -0xe(%bp),%di
    7d20:	16                   	push   %ss
    7d21:	57                   	push   %di
    7d22:	c4 7e 06             	les    0x6(%bp),%di
    7d25:	06                   	push   %es
    7d26:	57                   	push   %di
    7d27:	b8 ff 00             	mov    $0xff,%ax
    7d2a:	50                   	push   %ax
    7d2b:	9a 4e 06 ce 1d       	lcall  $0x1dce,$0x64e
    7d30:	c4 7e 06             	les    0x6(%bp),%di
    7d33:	26 8a 05             	mov    %es:(%di),%al
    7d36:	a2 9a 3e             	mov    %al,0x3e9a
    7d39:	c4 7e 06             	les    0x6(%bp),%di
    7d3c:	06                   	push   %es
    7d3d:	57                   	push   %di
    7d3e:	a0 9a 3e             	mov    0x3e9a,%al
    7d41:	30 e4                	xor    %ah,%ah
    7d43:	40                   	inc    %ax
    7d44:	50                   	push   %ax
    7d45:	b8 00 01             	mov    $0x100,%ax
    7d48:	50                   	push   %ax
    7d49:	9a d0 07 ce 1d       	lcall  $0x1dce,$0x7d0
    7d4e:	83 3e 9e 3f 01       	cmpw   $0x1,0x3f9e
    7d53:	75 0c                	jne    0x7d61
    7d55:	ff 36 a0 3f          	push   0x3fa0
    7d59:	ff 36 a2 3f          	push   0x3fa2
    7d5d:	0e                   	push   %cs
    7d5e:	e8 38 fc             	call   0x7999
    7d61:	80 7e 0a 01          	cmpb   $0x1,0xa(%bp)
    7d65:	75 09                	jne    0x7d70
    7d67:	c4 7e 06             	les    0x6(%bp),%di
    7d6a:	06                   	push   %es
    7d6b:	57                   	push   %di
    7d6c:	0e                   	push   %cs
    7d6d:	e8 24 fb             	call   0x7894
    7d70:	eb 09                	jmp    0x7d7b
    7d72:	b8 64 00             	mov    $0x64,%ax
    7d75:	50                   	push   %ax
    7d76:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    7d7b:	81 3e 26 3d 0d 1c    	cmpw   $0x1c0d,0x3d26
    7d81:	74 0b                	je     0x7d8e
    7d83:	81 3e 26 3d 1b 01    	cmpw   $0x11b,0x3d26
    7d89:	74 03                	je     0x7d8e
    7d8b:	e9 30 fd             	jmp    0x7abe
    7d8e:	80 7e 0a 01          	cmpb   $0x1,0xa(%bp)
    7d92:	75 0d                	jne    0x7da1
    7d94:	ff 36 24 3d          	push   0x3d24
    7d98:	ff 36 22 3d          	push   0x3d22
    7d9c:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    7da1:	a0 98 3e             	mov    0x3e98,%al
    7da4:	30 e4                	xor    %ah,%ah
    7da6:	89 46 f0             	mov    %ax,-0x10(%bp)
    7da9:	b8 01 00             	mov    $0x1,%ax
    7dac:	3b 46 f0             	cmp    -0x10(%bp),%ax
    7daf:	7f 66                	jg     0x7e17
    7db1:	89 46 fc             	mov    %ax,-0x4(%bp)
    7db4:	eb 03                	jmp    0x7db9
    7db6:	ff 46 fc             	incw   -0x4(%bp)
    7db9:	ff 36 2c 3d          	push   0x3d2c
    7dbd:	ff 36 e2 3d          	push   0x3de2
    7dc1:	a0 28 3d             	mov    0x3d28,%al
    7dc4:	30 e4                	xor    %ah,%ah
    7dc6:	50                   	push   %ax
    7dc7:	a0 29 3d             	mov    0x3d29,%al
    7dca:	30 e4                	xor    %ah,%ah
    7dcc:	50                   	push   %ax
    7dcd:	b8 01 00             	mov    $0x1,%ax
    7dd0:	50                   	push   %ax
    7dd1:	8b 46 fc             	mov    -0x4(%bp),%ax
    7dd4:	48                   	dec    %ax
    7dd5:	8b c8                	mov    %ax,%cx
    7dd7:	a0 2a 3d             	mov    0x3d2a,%al
    7dda:	30 e4                	xor    %ah,%ah
    7ddc:	8b d0                	mov    %ax,%dx
    7dde:	a0 28 3d             	mov    0x3d28,%al
    7de1:	30 e4                	xor    %ah,%ah
    7de3:	03 c2                	add    %dx,%ax
    7de5:	f7 e9                	imul   %cx
    7de7:	99                   	cwtd
    7de8:	8b c8                	mov    %ax,%cx
    7dea:	8b da                	mov    %dx,%bx
    7dec:	a1 1a 3d             	mov    0x3d1a,%ax
    7def:	31 d2                	xor    %dx,%dx
    7df1:	03 c1                	add    %cx,%ax
    7df3:	13 d3                	adc    %bx,%dx
    7df5:	50                   	push   %ax
    7df6:	ff 36 1c 3d          	push   0x3d1c
    7dfa:	b8 01 00             	mov    $0x1,%ax
    7dfd:	50                   	push   %ax
    7dfe:	b0 02                	mov    $0x2,%al
    7e00:	50                   	push   %ax
    7e01:	b0 00                	mov    $0x0,%al
    7e03:	50                   	push   %ax
    7e04:	b0 00                	mov    $0x0,%al
    7e06:	50                   	push   %ax
    7e07:	31 c0                	xor    %ax,%ax
    7e09:	50                   	push   %ax
    7e0a:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7e0f:	8b 46 fc             	mov    -0x4(%bp),%ax
    7e12:	3b 46 f0             	cmp    -0x10(%bp),%ax
    7e15:	75 9f                	jne    0x7db6
    7e17:	ff 36 1a 3d          	push   0x3d1a
    7e1b:	ff 36 1c 3d          	push   0x3d1c
    7e1f:	ff 36 1e 3d          	push   0x3d1e
    7e23:	ff 36 20 3d          	push   0x3d20
    7e27:	b8 01 00             	mov    $0x1,%ax
    7e2a:	50                   	push   %ax
    7e2b:	ff 36 16 3d          	push   0x3d16
    7e2f:	ff 36 18 3d          	push   0x3d18
    7e33:	31 c0                	xor    %ax,%ax
    7e35:	50                   	push   %ax
    7e36:	9a eb 08 bf 0a       	lcall  $0xabf,$0x8eb
    7e3b:	89 ec                	mov    %bp,%sp
    7e3d:	5d                   	pop    %bp
    7e3e:	ca 06 00             	lret   $0x6
    7e41:	00 00                	add    %al,(%bx,%si)
    7e43:	00 00                	add    %al,(%bx,%si)
    7e45:	ff                   	(bad)
    7e46:	ff                   	(bad)
    7e47:	ff                   	(bad)
    7e48:	ff                   	(bad)
    7e49:	ff                   	(bad)
    7e4a:	ff                   	(bad)
    7e4b:	ff                   	(bad)
    7e4c:	ff                   	(bad)
    7e4d:	ff                   	(bad)
    7e4e:	ff                   	(bad)
    7e4f:	ff 07                	incw   (%bx)
	...
    7e65:	00 00                	add    %al,(%bx,%si)
    7e67:	ff 03                	incw   (%bp,%di)
	...
    7e81:	55                   	push   %bp
    7e82:	89 e5                	mov    %sp,%bp
    7e84:	81 ec 1e 01          	sub    $0x11e,%sp
    7e88:	c7 46 f6 01 00       	movw   $0x1,-0xa(%bp)
    7e8d:	eb 03                	jmp    0x7e92
    7e8f:	ff 46 f6             	incw   -0xa(%bp)
    7e92:	8b 7e f6             	mov    -0xa(%bp),%di
    7e95:	d1 e7                	shl    %di
    7e97:	8b 85 f0 36          	mov    0x36f0(%di),%ax
    7e9b:	89 86 ee fe          	mov    %ax,-0x112(%bp)
    7e9f:	8b 7e f6             	mov    -0xa(%bp),%di
    7ea2:	d1 e7                	shl    %di
    7ea4:	8b 85 fc 36          	mov    0x36fc(%di),%ax
    7ea8:	89 86 ea fe          	mov    %ax,-0x116(%bp)
    7eac:	a0 2a 3d             	mov    0x3d2a,%al
    7eaf:	30 e4                	xor    %ah,%ah
    7eb1:	8b d0                	mov    %ax,%dx
    7eb3:	a0 28 3d             	mov    0x3d28,%al
    7eb6:	30 e4                	xor    %ah,%ah
    7eb8:	03 c2                	add    %dx,%ax
    7eba:	89 86 e8 fe          	mov    %ax,-0x118(%bp)
    7ebe:	a0 2b 3d             	mov    0x3d2b,%al
    7ec1:	30 e4                	xor    %ah,%ah
    7ec3:	8b d0                	mov    %ax,%dx
    7ec5:	a0 29 3d             	mov    0x3d29,%al
    7ec8:	30 e4                	xor    %ah,%ah
    7eca:	03 c2                	add    %dx,%ax
    7ecc:	89 86 e6 fe          	mov    %ax,-0x11a(%bp)
    7ed0:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    7ed5:	eb 03                	jmp    0x7eda
    7ed7:	ff 46 fc             	incw   -0x4(%bp)
    7eda:	83 7e fc 09          	cmpw   $0x9,-0x4(%bp)
    7ede:	75 0b                	jne    0x7eeb
    7ee0:	8b 86 e6 fe          	mov    -0x11a(%bp),%ax
    7ee4:	05 04 00             	add    $0x4,%ax
    7ee7:	89 86 e6 fe          	mov    %ax,-0x11a(%bp)
    7eeb:	8b 7e f6             	mov    -0xa(%bp),%di
    7eee:	d1 e7                	shl    %di
    7ef0:	8b 85 ea 36          	mov    0x36ea(%di),%ax
    7ef4:	89 86 f0 fe          	mov    %ax,-0x110(%bp)
    7ef8:	8b 46 fc             	mov    -0x4(%bp),%ax
    7efb:	ba 14 00             	mov    $0x14,%dx
    7efe:	f7 e2                	mul    %dx
    7f00:	8b c8                	mov    %ax,%cx
    7f02:	8b 46 f6             	mov    -0xa(%bp),%ax
    7f05:	ba c8 00             	mov    $0xc8,%dx
    7f08:	f7 e2                	mul    %dx
    7f0a:	8b f8                	mov    %ax,%di
    7f0c:	03 f9                	add    %cx,%di
    7f0e:	8a 85 d2 2f          	mov    0x2fd2(%di),%al
    7f12:	30 e4                	xor    %ah,%ah
    7f14:	89 86 f4 fe          	mov    %ax,-0x10c(%bp)
    7f18:	a0 98 3e             	mov    0x3e98,%al
    7f1b:	30 e4                	xor    %ah,%ah
    7f1d:	89 86 e2 fe          	mov    %ax,-0x11e(%bp)
    7f21:	b8 01 00             	mov    $0x1,%ax
    7f24:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    7f28:	7e 03                	jle    0x7f2d
    7f2a:	e9 ad 00             	jmp    0x7fda
    7f2d:	89 46 fa             	mov    %ax,-0x6(%bp)
    7f30:	eb 03                	jmp    0x7f35
    7f32:	ff 46 fa             	incw   -0x6(%bp)
    7f35:	8b 46 fa             	mov    -0x6(%bp),%ax
    7f38:	3b 86 f4 fe          	cmp    -0x10c(%bp),%ax
    7f3c:	7e 06                	jle    0x7f44
    7f3e:	c6 46 ff 20          	movb   $0x20,-0x1(%bp)
    7f42:	eb 24                	jmp    0x7f68
    7f44:	8b 46 fa             	mov    -0x6(%bp),%ax
    7f47:	8b d8                	mov    %ax,%bx
    7f49:	8b 46 fc             	mov    -0x4(%bp),%ax
    7f4c:	ba 14 00             	mov    $0x14,%dx
    7f4f:	f7 e2                	mul    %dx
    7f51:	8b c8                	mov    %ax,%cx
    7f53:	8b 46 f6             	mov    -0xa(%bp),%ax
    7f56:	ba c8 00             	mov    $0xc8,%dx
    7f59:	f7 e2                	mul    %dx
    7f5b:	8b f8                	mov    %ax,%di
    7f5d:	03 f9                	add    %cx,%di
    7f5f:	03 fb                	add    %bx,%di
    7f61:	8a 85 d2 2f          	mov    0x2fd2(%di),%al
    7f65:	88 46 ff             	mov    %al,-0x1(%bp)
    7f68:	8a 46 ff             	mov    -0x1(%bp),%al
    7f6b:	50                   	push   %ax
    7f6c:	bf 21 1e             	mov    $0x1e21,%di
    7f6f:	0e                   	push   %cs
    7f70:	57                   	push   %di
    7f71:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    7f76:	74 4a                	je     0x7fc2
    7f78:	8a 46 ff             	mov    -0x1(%bp),%al
    7f7b:	30 e4                	xor    %ah,%ah
    7f7d:	89 86 e4 fe          	mov    %ax,-0x11c(%bp)
    7f81:	8b be e4 fe          	mov    -0x11c(%bp),%di
    7f85:	d1 e7                	shl    %di
    7f87:	ff b5 ec 3c          	push   0x3cec(%di)
    7f8b:	8b be e4 fe          	mov    -0x11c(%bp),%di
    7f8f:	d1 e7                	shl    %di
    7f91:	ff b5 a2 3d          	push   0x3da2(%di)
    7f95:	a0 28 3d             	mov    0x3d28,%al
    7f98:	30 e4                	xor    %ah,%ah
    7f9a:	50                   	push   %ax
    7f9b:	a0 29 3d             	mov    0x3d29,%al
    7f9e:	30 e4                	xor    %ah,%ah
    7fa0:	50                   	push   %ax
    7fa1:	b8 01 00             	mov    $0x1,%ax
    7fa4:	50                   	push   %ax
    7fa5:	ff b6 f0 fe          	push   -0x110(%bp)
    7fa9:	ff b6 ee fe          	push   -0x112(%bp)
    7fad:	b8 01 00             	mov    $0x1,%ax
    7fb0:	50                   	push   %ax
    7fb1:	b0 02                	mov    $0x2,%al
    7fb3:	50                   	push   %ax
    7fb4:	b0 00                	mov    $0x0,%al
    7fb6:	50                   	push   %ax
    7fb7:	b0 00                	mov    $0x0,%al
    7fb9:	50                   	push   %ax
    7fba:	31 c0                	xor    %ax,%ax
    7fbc:	50                   	push   %ax
    7fbd:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    7fc2:	8b 86 f0 fe          	mov    -0x110(%bp),%ax
    7fc6:	03 86 e8 fe          	add    -0x118(%bp),%ax
    7fca:	89 86 f0 fe          	mov    %ax,-0x110(%bp)
    7fce:	8b 46 fa             	mov    -0x6(%bp),%ax
    7fd1:	3b 86 e2 fe          	cmp    -0x11e(%bp),%ax
    7fd5:	74 03                	je     0x7fda
    7fd7:	e9 58 ff             	jmp    0x7f32
    7fda:	8b 46 fc             	mov    -0x4(%bp),%ax
    7fdd:	ba 14 00             	mov    $0x14,%dx
    7fe0:	f7 e2                	mul    %dx
    7fe2:	8b c8                	mov    %ax,%cx
    7fe4:	8b 46 f6             	mov    -0xa(%bp),%ax
    7fe7:	ba c8 00             	mov    $0xc8,%dx
    7fea:	f7 e2                	mul    %dx
    7fec:	8b f8                	mov    %ax,%di
    7fee:	03 f9                	add    %cx,%di
    7ff0:	8b 85 db 2f          	mov    0x2fdb(%di),%ax
    7ff4:	99                   	cwtd
    7ff5:	52                   	push   %dx
    7ff6:	50                   	push   %ax
    7ff7:	31 c0                	xor    %ax,%ax
    7ff9:	50                   	push   %ax
    7ffa:	8d be f6 fe          	lea    -0x10a(%bp),%di
    7ffe:	16                   	push   %ss
    7fff:	57                   	push   %di
    8000:	b8 ff 00             	mov    $0xff,%ax
    8003:	50                   	push   %ax
    8004:	9a 3a 0e ce 1d       	lcall  $0x1dce,$0xe3a
    8009:	a0 28 3d             	mov    0x3d28,%al
    800c:	30 e4                	xor    %ah,%ah
    800e:	8b d0                	mov    %ax,%dx
    8010:	8b 7e f6             	mov    -0xa(%bp),%di
    8013:	d1 e7                	shl    %di
    8015:	8b 85 f6 36          	mov    0x36f6(%di),%ax
    8019:	03 06 08 37          	add    0x3708,%ax
    801d:	2b c2                	sub    %dx,%ax
    801f:	89 86 ec fe          	mov    %ax,-0x114(%bp)
    8023:	8a 86 f6 fe          	mov    -0x10a(%bp),%al
    8027:	30 e4                	xor    %ah,%ah
    8029:	89 86 f2 fe          	mov    %ax,-0x10e(%bp)
    802d:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    8032:	eb 03                	jmp    0x8037
    8034:	ff 46 fa             	incw   -0x6(%bp)
    8037:	83 7e fa 04          	cmpw   $0x4,-0x6(%bp)
    803b:	75 0b                	jne    0x8048
    803d:	8b 86 ec fe          	mov    -0x114(%bp),%ax
    8041:	2d 04 00             	sub    $0x4,%ax
    8044:	89 86 ec fe          	mov    %ax,-0x114(%bp)
    8048:	8b 46 fa             	mov    -0x6(%bp),%ax
    804b:	3b 86 f2 fe          	cmp    -0x10e(%bp),%ax
    804f:	7e 06                	jle    0x8057
    8051:	c6 46 ff 30          	movb   $0x30,-0x1(%bp)
    8055:	eb 11                	jmp    0x8068
    8057:	8b 86 f2 fe          	mov    -0x10e(%bp),%ax
    805b:	2b 46 fa             	sub    -0x6(%bp),%ax
    805e:	40                   	inc    %ax
    805f:	8b f8                	mov    %ax,%di
    8061:	8a 83 f6 fe          	mov    -0x10a(%bp,%di),%al
    8065:	88 46 ff             	mov    %al,-0x1(%bp)
    8068:	8a 46 ff             	mov    -0x1(%bp),%al
    806b:	50                   	push   %ax
    806c:	bf 41 1e             	mov    $0x1e41,%di
    806f:	0e                   	push   %cs
    8070:	57                   	push   %di
    8071:	9a d4 08 ce 1d       	lcall  $0x1dce,$0x8d4
    8076:	74 4d                	je     0x80c5
    8078:	8a 46 ff             	mov    -0x1(%bp),%al
    807b:	30 e4                	xor    %ah,%ah
    807d:	2d 30 00             	sub    $0x30,%ax
    8080:	89 86 e4 fe          	mov    %ax,-0x11c(%bp)
    8084:	8b be e4 fe          	mov    -0x11c(%bp),%di
    8088:	d1 e7                	shl    %di
    808a:	ff b5 bc 36          	push   0x36bc(%di)
    808e:	8b be e4 fe          	mov    -0x11c(%bp),%di
    8092:	d1 e7                	shl    %di
    8094:	ff b5 d0 36          	push   0x36d0(%di)
    8098:	a0 28 3d             	mov    0x3d28,%al
    809b:	30 e4                	xor    %ah,%ah
    809d:	50                   	push   %ax
    809e:	a0 29 3d             	mov    0x3d29,%al
    80a1:	30 e4                	xor    %ah,%ah
    80a3:	50                   	push   %ax
    80a4:	b8 01 00             	mov    $0x1,%ax
    80a7:	50                   	push   %ax
    80a8:	ff b6 ec fe          	push   -0x114(%bp)
    80ac:	ff b6 ea fe          	push   -0x116(%bp)
    80b0:	b8 01 00             	mov    $0x1,%ax
    80b3:	50                   	push   %ax
    80b4:	b0 02                	mov    $0x2,%al
    80b6:	50                   	push   %ax
    80b7:	b0 00                	mov    $0x0,%al
    80b9:	50                   	push   %ax
    80ba:	b0 00                	mov    $0x0,%al
    80bc:	50                   	push   %ax
    80bd:	31 c0                	xor    %ax,%ax
    80bf:	50                   	push   %ax
    80c0:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    80c5:	8b 86 ec fe          	mov    -0x114(%bp),%ax
    80c9:	2b 86 e8 fe          	sub    -0x118(%bp),%ax
    80cd:	89 86 ec fe          	mov    %ax,-0x114(%bp)
    80d1:	83 7e fa 05          	cmpw   $0x5,-0x6(%bp)
    80d5:	74 03                	je     0x80da
    80d7:	e9 5a ff             	jmp    0x8034
    80da:	8b 86 ee fe          	mov    -0x112(%bp),%ax
    80de:	03 86 e6 fe          	add    -0x11a(%bp),%ax
    80e2:	89 86 ee fe          	mov    %ax,-0x112(%bp)
    80e6:	8b 86 ee fe          	mov    -0x112(%bp),%ax
    80ea:	89 86 ea fe          	mov    %ax,-0x116(%bp)
    80ee:	83 7e fc 0a          	cmpw   $0xa,-0x4(%bp)
    80f2:	74 03                	je     0x80f7
    80f4:	e9 e0 fd             	jmp    0x7ed7
    80f7:	83 7e f6 03          	cmpw   $0x3,-0xa(%bp)
    80fb:	74 03                	je     0x8100
    80fd:	e9 8f fd             	jmp    0x7e8f
    8100:	89 ec                	mov    %bp,%sp
    8102:	5d                   	pop    %bp
    8103:	cb                   	lret
    8104:	55                   	push   %bp
    8105:	89 e5                	mov    %sp,%bp
    8107:	83 ec 0e             	sub    $0xe,%sp
    810a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    810f:	eb 03                	jmp    0x8114
    8111:	ff 46 fe             	incw   -0x2(%bp)
    8114:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    8119:	eb 03                	jmp    0x811e
    811b:	ff 46 fc             	incw   -0x4(%bp)
    811e:	8b 46 fc             	mov    -0x4(%bp),%ax
    8121:	d1 e0                	shl    %ax
    8123:	8b f0                	mov    %ax,%si
    8125:	d1 e0                	shl    %ax
    8127:	03 c6                	add    %si,%ax
    8129:	8b c8                	mov    %ax,%cx
    812b:	8b 46 fe             	mov    -0x2(%bp),%ax
    812e:	ba 48 00             	mov    $0x48,%dx
    8131:	f7 e2                	mul    %dx
    8133:	8b f8                	mov    %ax,%di
    8135:	03 f9                	add    %cx,%di
    8137:	81 c7 82 37          	add    $0x3782,%di
    813b:	89 7e f2             	mov    %di,-0xe(%bp)
    813e:	8c 5e f4             	mov    %ds,-0xc(%bp)
    8141:	c4 7e f2             	les    -0xe(%bp),%di
    8144:	26 80 3d 00          	cmpb   $0x0,%es:(%di)
    8148:	74 49                	je     0x8193
    814a:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    814e:	7d 20                	jge    0x8170
    8150:	c4 7e f2             	les    -0xe(%bp),%di
    8153:	26 ff 75 02          	push   %es:0x2(%di)
    8157:	c4 7e f2             	les    -0xe(%bp),%di
    815a:	26 ff 75 04          	push   %es:0x4(%di)
    815e:	ff 36 9a 3a          	push   0x3a9a
    8162:	ff 36 a0 3a          	push   0x3aa0
    8166:	31 c0                	xor    %ax,%ax
    8168:	50                   	push   %ax
    8169:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    816e:	eb 23                	jmp    0x8193
    8170:	c4 7e f2             	les    -0xe(%bp),%di
    8173:	26 ff 75 02          	push   %es:0x2(%di)
    8177:	c4 7e f2             	les    -0xe(%bp),%di
    817a:	26 ff 75 04          	push   %es:0x4(%di)
    817e:	8b 7e fc             	mov    -0x4(%bp),%di
    8181:	d1 e7                	shl    %di
    8183:	ff b5 a4 3a          	push   0x3aa4(%di)
    8187:	ff 36 a4 3a          	push   0x3aa4
    818b:	31 c0                	xor    %ax,%ax
    818d:	50                   	push   %ax
    818e:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    8193:	83 7e fc 0c          	cmpw   $0xc,-0x4(%bp)
    8197:	75 82                	jne    0x811b
    8199:	83 7e fe 03          	cmpw   $0x3,-0x2(%bp)
    819d:	74 03                	je     0x81a2
    819f:	e9 6f ff             	jmp    0x8111
    81a2:	b8 01 00             	mov    $0x1,%ax
    81a5:	50                   	push   %ax
    81a6:	8d 46 f8             	lea    -0x8(%bp),%ax
    81a9:	8c d2                	mov    %ss,%dx
    81ab:	52                   	push   %dx
    81ac:	50                   	push   %ax
    81ad:	b8 05 00             	mov    $0x5,%ax
    81b0:	50                   	push   %ax
    81b1:	ff 36 4e 3b          	push   0x3b4e
    81b5:	ff 36 50 3b          	push   0x3b50
    81b9:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    81be:	ff 76 fa             	push   -0x6(%bp)
    81c1:	ff 76 f8             	push   -0x8(%bp)
    81c4:	31 c0                	xor    %ax,%ax
    81c6:	50                   	push   %ax
    81c7:	b8 b6 00             	mov    $0xb6,%ax
    81ca:	50                   	push   %ax
    81cb:	ff 36 4e 3b          	push   0x3b4e
    81cf:	ff 36 50 3b          	push   0x3b50
    81d3:	b8 01 00             	mov    $0x1,%ax
    81d6:	50                   	push   %ax
    81d7:	b0 00                	mov    $0x0,%al
    81d9:	50                   	push   %ax
    81da:	b0 00                	mov    $0x0,%al
    81dc:	50                   	push   %ax
    81dd:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    81e2:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    81e7:	eb 03                	jmp    0x81ec
    81e9:	ff 46 fe             	incw   -0x2(%bp)
    81ec:	c7 46 fc 06 00       	movw   $0x6,-0x4(%bp)
    81f1:	eb 03                	jmp    0x81f6
    81f3:	ff 46 fc             	incw   -0x4(%bp)
    81f6:	ff 76 fa             	push   -0x6(%bp)
    81f9:	ff 76 f8             	push   -0x8(%bp)
    81fc:	31 c0                	xor    %ax,%ax
    81fe:	50                   	push   %ax
    81ff:	8b 46 fc             	mov    -0x4(%bp),%ax
    8202:	d1 e0                	shl    %ax
    8204:	8b c8                	mov    %ax,%cx
    8206:	8b 46 fe             	mov    -0x2(%bp),%ax
    8209:	ba 12 00             	mov    $0x12,%dx
    820c:	f7 e2                	mul    %dx
    820e:	8b f8                	mov    %ax,%di
    8210:	03 f9                	add    %cx,%di
    8212:	ff b5 a0 3a          	push   0x3aa0(%di)
    8216:	8b 46 fc             	mov    -0x4(%bp),%ax
    8219:	d1 e0                	shl    %ax
    821b:	8b c8                	mov    %ax,%cx
    821d:	8b 46 fe             	mov    -0x2(%bp),%ax
    8220:	ba 12 00             	mov    $0x12,%dx
    8223:	f7 e2                	mul    %dx
    8225:	8b f8                	mov    %ax,%di
    8227:	03 f9                	add    %cx,%di
    8229:	ff b5 e8 3a          	push   0x3ae8(%di)
    822d:	31 c0                	xor    %ax,%ax
    822f:	50                   	push   %ax
    8230:	b0 02                	mov    $0x2,%al
    8232:	50                   	push   %ax
    8233:	b0 00                	mov    $0x0,%al
    8235:	50                   	push   %ax
    8236:	b0 00                	mov    $0x0,%al
    8238:	50                   	push   %ax
    8239:	31 c0                	xor    %ax,%ax
    823b:	50                   	push   %ax
    823c:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    8241:	83 7e fc 0e          	cmpw   $0xe,-0x4(%bp)
    8245:	75 ac                	jne    0x81f3
    8247:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    824b:	75 9c                	jne    0x81e9
    824d:	ff 76 fa             	push   -0x6(%bp)
    8250:	ff 76 f8             	push   -0x8(%bp)
    8253:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    8258:	89 ec                	mov    %bp,%sp
    825a:	5d                   	pop    %bp
    825b:	cb                   	lret
    825c:	08 4e 69             	or     %cl,0x69(%bp)
    825f:	6e                   	outsb  %ds:(%si),(%dx)
    8260:	65 2e 6c             	gs cs insb (%dx),%es:(%di)
    8263:	69 62 55 89 e5       	imul   $0xe589,0x55(%bp,%si),%sp
    8268:	83 ec 34             	sub    $0x34,%sp
    826b:	9a 1b 0d ce 1d       	lcall  $0x1dce,$0xd1b
    8270:	31 c0                	xor    %ax,%ax
    8272:	89 46 d6             	mov    %ax,-0x2a(%bp)
    8275:	eb 03                	jmp    0x827a
    8277:	ff 46 d6             	incw   -0x2a(%bp)
    827a:	8b 7e d6             	mov    -0x2a(%bp),%di
    827d:	c6 43 dc 00          	movb   $0x0,-0x24(%bp,%di)
    8281:	83 7e d6 23          	cmpw   $0x23,-0x2a(%bp)
    8285:	75 f0                	jne    0x8277
    8287:	c7 46 d8 24 00       	movw   $0x24,-0x28(%bp)
    828c:	c7 46 d6 01 00       	movw   $0x1,-0x2a(%bp)
    8291:	eb 03                	jmp    0x8296
    8293:	ff 46 d6             	incw   -0x2a(%bp)
    8296:	c7 46 d4 01 00       	movw   $0x1,-0x2c(%bp)
    829b:	eb 03                	jmp    0x82a0
    829d:	ff 46 d4             	incw   -0x2c(%bp)
    82a0:	ff 76 d8             	push   -0x28(%bp)
    82a3:	9a 94 0c ce 1d       	lcall  $0x1dce,$0xc94
    82a8:	89 46 da             	mov    %ax,-0x26(%bp)
    82ab:	8b 46 d6             	mov    -0x2a(%bp),%ax
    82ae:	d1 e0                	shl    %ax
    82b0:	8b f0                	mov    %ax,%si
    82b2:	d1 e0                	shl    %ax
    82b4:	03 c6                	add    %si,%ax
    82b6:	8b c8                	mov    %ax,%cx
    82b8:	8b 46 d4             	mov    -0x2c(%bp),%ax
    82bb:	ba 48 00             	mov    $0x48,%dx
    82be:	f7 e2                	mul    %dx
    82c0:	8b f8                	mov    %ax,%di
    82c2:	03 f9                	add    %cx,%di
    82c4:	81 c7 82 37          	add    $0x3782,%di
    82c8:	89 7e cc             	mov    %di,-0x34(%bp)
    82cb:	8c 5e ce             	mov    %ds,-0x32(%bp)
    82ce:	c7 46 d2 ff ff       	movw   $0xffff,-0x2e(%bp)
    82d3:	c7 46 d0 ff ff       	movw   $0xffff,-0x30(%bp)
    82d8:	8b 46 da             	mov    -0x26(%bp),%ax
    82db:	31 d2                	xor    %dx,%dx
    82dd:	8b c8                	mov    %ax,%cx
    82df:	8b da                	mov    %dx,%bx
    82e1:	8b 46 d2             	mov    -0x2e(%bp),%ax
    82e4:	99                   	cwtd
    82e5:	3b d3                	cmp    %bx,%dx
    82e7:	7c 06                	jl     0x82ef
    82e9:	7f 15                	jg     0x8300
    82eb:	3b c1                	cmp    %cx,%ax
    82ed:	73 11                	jae    0x8300
    82ef:	ff 46 d0             	incw   -0x30(%bp)
    82f2:	8b 7e d0             	mov    -0x30(%bp),%di
    82f5:	80 7b dc 00          	cmpb   $0x0,-0x24(%bp,%di)
    82f9:	75 03                	jne    0x82fe
    82fb:	ff 46 d2             	incw   -0x2e(%bp)
    82fe:	eb d8                	jmp    0x82d8
    8300:	8b 7e d0             	mov    -0x30(%bp),%di
    8303:	c6 43 dc 01          	movb   $0x1,-0x24(%bp,%di)
    8307:	ff 4e d8             	decw   -0x28(%bp)
    830a:	8b 46 d0             	mov    -0x30(%bp),%ax
    830d:	99                   	cwtd
    830e:	b9 09 00             	mov    $0x9,%cx
    8311:	f7 f9                	idiv   %cx
    8313:	40                   	inc    %ax
    8314:	c4 7e cc             	les    -0x34(%bp),%di
    8317:	26 88 05             	mov    %al,%es:(%di)
    831a:	8b 46 d0             	mov    -0x30(%bp),%ax
    831d:	99                   	cwtd
    831e:	b9 09 00             	mov    $0x9,%cx
    8321:	f7 f9                	idiv   %cx
    8323:	92                   	xchg   %ax,%dx
    8324:	05 06 00             	add    $0x6,%ax
    8327:	c4 7e cc             	les    -0x34(%bp),%di
    832a:	26 88 45 01          	mov    %al,%es:0x1(%di)
    832e:	c4 7e cc             	les    -0x34(%bp),%di
    8331:	26 80 3d 03          	cmpb   $0x3,%es:(%di)
    8335:	75 10                	jne    0x8347
    8337:	c4 7e cc             	les    -0x34(%bp),%di
    833a:	26 80 7d 01 09       	cmpb   $0x9,%es:0x1(%di)
    833f:	75 06                	jne    0x8347
    8341:	8a 46 d4             	mov    -0x2c(%bp),%al
    8344:	a2 02 3a             	mov    %al,0x3a02
    8347:	8b 46 d6             	mov    -0x2a(%bp),%ax
    834a:	d1 e0                	shl    %ax
    834c:	8b c8                	mov    %ax,%cx
    834e:	8b 46 d4             	mov    -0x2c(%bp),%ax
    8351:	ba 18 00             	mov    $0x18,%dx
    8354:	f7 e2                	mul    %dx
    8356:	8b f8                	mov    %ax,%di
    8358:	03 f9                	add    %cx,%di
    835a:	8b 85 f0 39          	mov    0x39f0(%di),%ax
    835e:	c4 7e cc             	les    -0x34(%bp),%di
    8361:	26 89 45 02          	mov    %ax,%es:0x2(%di)
    8365:	8b 46 d6             	mov    -0x2a(%bp),%ax
    8368:	d1 e0                	shl    %ax
    836a:	8b c8                	mov    %ax,%cx
    836c:	8b 46 d4             	mov    -0x2c(%bp),%ax
    836f:	ba 18 00             	mov    $0x18,%dx
    8372:	f7 e2                	mul    %dx
    8374:	8b f8                	mov    %ax,%di
    8376:	03 f9                	add    %cx,%di
    8378:	8b 85 38 3a          	mov    0x3a38(%di),%ax
    837c:	c4 7e cc             	les    -0x34(%bp),%di
    837f:	26 89 45 04          	mov    %ax,%es:0x4(%di)
    8383:	83 7e d4 03          	cmpw   $0x3,-0x2c(%bp)
    8387:	74 03                	je     0x838c
    8389:	e9 11 ff             	jmp    0x829d
    838c:	83 7e d6 0c          	cmpw   $0xc,-0x2a(%bp)
    8390:	74 03                	je     0x8395
    8392:	e9 fe fe             	jmp    0x8293
    8395:	c7 46 d6 01 00       	movw   $0x1,-0x2a(%bp)
    839a:	eb 03                	jmp    0x839f
    839c:	ff 46 d6             	incw   -0x2a(%bp)
    839f:	8b 7e d6             	mov    -0x2a(%bp),%di
    83a2:	d1 e7                	shl    %di
    83a4:	8b f7                	mov    %di,%si
    83a6:	d1 e7                	shl    %di
    83a8:	03 fe                	add    %si,%di
    83aa:	81 c7 5a 38          	add    $0x385a,%di
    83ae:	89 7e cc             	mov    %di,-0x34(%bp)
    83b1:	8c 5e ce             	mov    %ds,-0x32(%bp)
    83b4:	bf 3c 22             	mov    $0x223c,%di
    83b7:	0e                   	push   %cs
    83b8:	57                   	push   %di
    83b9:	c4 7e cc             	les    -0x34(%bp),%di
    83bc:	26 8a 05             	mov    %es:(%di),%al
    83bf:	98                   	cbtw
    83c0:	b1 08                	mov    $0x8,%cl
    83c2:	d3 e0                	shl    %cl,%ax
    83c4:	8b d0                	mov    %ax,%dx
    83c6:	c4 7e cc             	les    -0x34(%bp),%di
    83c9:	26 8a 45 01          	mov    %es:0x1(%di),%al
    83cd:	98                   	cbtw
    83ce:	8b f8                	mov    %ax,%di
    83d0:	b1 0a                	mov    $0xa,%cl
    83d2:	d3 e7                	shl    %cl,%di
    83d4:	03 fa                	add    %dx,%di
    83d6:	81 c7 08 e8          	add    $0xe808,%di
    83da:	1e                   	push   %ds
    83db:	57                   	push   %di
    83dc:	31 c0                	xor    %ax,%ax
    83de:	50                   	push   %ax
    83df:	31 c0                	xor    %ax,%ax
    83e1:	50                   	push   %ax
    83e2:	b8 01 00             	mov    $0x1,%ax
    83e5:	50                   	push   %ax
    83e6:	9a eb 02 a3 0c       	lcall  $0xca3,$0x2eb
    83eb:	8b 7e d6             	mov    -0x2a(%bp),%di
    83ee:	d1 e7                	shl    %di
    83f0:	d1 e7                	shl    %di
    83f2:	ff b5 e4 38          	push   0x38e4(%di)
    83f6:	ff b5 e2 38          	push   0x38e2(%di)
    83fa:	31 c0                	xor    %ax,%ax
    83fc:	50                   	push   %ax
    83fd:	31 c0                	xor    %ax,%ax
    83ff:	50                   	push   %ax
    8400:	ff 36 9e 3a          	push   0x3a9e
    8404:	ff 36 a4 3a          	push   0x3aa4
    8408:	b8 01 00             	mov    $0x1,%ax
    840b:	50                   	push   %ax
    840c:	b0 00                	mov    $0x0,%al
    840e:	50                   	push   %ax
    840f:	b0 01                	mov    $0x1,%al
    8411:	50                   	push   %ax
    8412:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    8417:	8a 46 d6             	mov    -0x2a(%bp),%al
    841a:	8b 7e d6             	mov    -0x2a(%bp),%di
    841d:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    8421:	83 7e d6 0c          	cmpw   $0xc,-0x2a(%bp)
    8425:	74 03                	je     0x842a
    8427:	e9 72 ff             	jmp    0x839c
    842a:	89 ec                	mov    %bp,%sp
    842c:	5d                   	pop    %bp
    842d:	cb                   	lret
    842e:	55                   	push   %bp
    842f:	89 e5                	mov    %sp,%bp
    8431:	83 ec 28             	sub    $0x28,%sp
    8434:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    8439:	eb 03                	jmp    0x843e
    843b:	ff 46 fe             	incw   -0x2(%bp)
    843e:	8b 7e fe             	mov    -0x2(%bp),%di
    8441:	c6 43 f3 00          	movb   $0x0,-0xd(%bp,%di)
    8445:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    8449:	75 f0                	jne    0x843b
    844b:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    8450:	eb 03                	jmp    0x8455
    8452:	ff 46 fe             	incw   -0x2(%bp)
    8455:	c7 46 fc 01 00       	movw   $0x1,-0x4(%bp)
    845a:	eb 03                	jmp    0x845f
    845c:	ff 46 fc             	incw   -0x4(%bp)
    845f:	8b 46 fe             	mov    -0x2(%bp),%ax
    8462:	d1 e0                	shl    %ax
    8464:	8b f0                	mov    %ax,%si
    8466:	d1 e0                	shl    %ax
    8468:	03 c6                	add    %si,%ax
    846a:	8b c8                	mov    %ax,%cx
    846c:	8b 46 fc             	mov    -0x4(%bp),%ax
    846f:	ba 48 00             	mov    $0x48,%dx
    8472:	f7 e2                	mul    %dx
    8474:	8b f8                	mov    %ax,%di
    8476:	03 f9                	add    %cx,%di
    8478:	81 c7 82 37          	add    $0x3782,%di
    847c:	89 7e d8             	mov    %di,-0x28(%bp)
    847f:	8c 5e da             	mov    %ds,-0x26(%bp)
    8482:	83 7e fc 03          	cmpw   $0x3,-0x4(%bp)
    8486:	74 03                	je     0x848b
    8488:	e9 da 00             	jmp    0x8565
    848b:	83 7e fe 01          	cmpw   $0x1,-0x2(%bp)
    848f:	75 07                	jne    0x8498
    8491:	c7 46 f8 68 00       	movw   $0x68,-0x8(%bp)
    8496:	eb 05                	jmp    0x849d
    8498:	c7 46 f8 6c 00       	movw   $0x6c,-0x8(%bp)
    849d:	c7 46 fa 01 00       	movw   $0x1,-0x6(%bp)
    84a2:	eb 03                	jmp    0x84a7
    84a4:	ff 46 fa             	incw   -0x6(%bp)
    84a7:	8b 7e fe             	mov    -0x2(%bp),%di
    84aa:	d1 e7                	shl    %di
    84ac:	8b f7                	mov    %di,%si
    84ae:	d1 e7                	shl    %di
    84b0:	03 fe                	add    %si,%di
    84b2:	8a 85 5a 38          	mov    0x385a(%di),%al
    84b6:	98                   	cbtw
    84b7:	3b 46 fa             	cmp    -0x6(%bp),%ax
    84ba:	75 07                	jne    0x84c3
    84bc:	8b 7e fa             	mov    -0x6(%bp),%di
    84bf:	c6 43 f3 01          	movb   $0x1,-0xd(%bp,%di)
    84c3:	83 7e fa 04          	cmpw   $0x4,-0x6(%bp)
    84c7:	75 db                	jne    0x84a4
    84c9:	8b 7e fe             	mov    -0x2(%bp),%di
    84cc:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    84d0:	30 e4                	xor    %ah,%ah
    84d2:	8b f8                	mov    %ax,%di
    84d4:	d1 e7                	shl    %di
    84d6:	d1 e7                	shl    %di
    84d8:	ff b5 e4 38          	push   0x38e4(%di)
    84dc:	ff b5 e2 38          	push   0x38e2(%di)
    84e0:	31 c0                	xor    %ax,%ax
    84e2:	50                   	push   %ax
    84e3:	31 c0                	xor    %ax,%ax
    84e5:	50                   	push   %ax
    84e6:	31 c0                	xor    %ax,%ax
    84e8:	50                   	push   %ax
    84e9:	b8 01 00             	mov    $0x1,%ax
    84ec:	50                   	push   %ax
    84ed:	b0 02                	mov    $0x2,%al
    84ef:	50                   	push   %ax
    84f0:	b0 00                	mov    $0x0,%al
    84f2:	50                   	push   %ax
    84f3:	b0 01                	mov    $0x1,%al
    84f5:	50                   	push   %ax
    84f6:	31 c0                	xor    %ax,%ax
    84f8:	50                   	push   %ax
    84f9:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    84fe:	ff 76 f8             	push   -0x8(%bp)
    8501:	31 c0                	xor    %ax,%ax
    8503:	50                   	push   %ax
    8504:	b8 03 00             	mov    $0x3,%ax
    8507:	50                   	push   %ax
    8508:	ff 36 a4 3a          	push   0x3aa4
    850c:	b8 01 00             	mov    $0x1,%ax
    850f:	50                   	push   %ax
    8510:	31 c0                	xor    %ax,%ax
    8512:	50                   	push   %ax
    8513:	31 c0                	xor    %ax,%ax
    8515:	50                   	push   %ax
    8516:	b8 01 00             	mov    $0x1,%ax
    8519:	50                   	push   %ax
    851a:	b0 02                	mov    $0x2,%al
    851c:	50                   	push   %ax
    851d:	b0 00                	mov    $0x0,%al
    851f:	50                   	push   %ax
    8520:	b0 01                	mov    $0x1,%al
    8522:	50                   	push   %ax
    8523:	31 c0                	xor    %ax,%ax
    8525:	50                   	push   %ax
    8526:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    852b:	31 c0                	xor    %ax,%ax
    852d:	50                   	push   %ax
    852e:	31 c0                	xor    %ax,%ax
    8530:	50                   	push   %ax
    8531:	ff 36 9e 3a          	push   0x3a9e
    8535:	ff 36 a4 3a          	push   0x3aa4
    8539:	b8 01 00             	mov    $0x1,%ax
    853c:	50                   	push   %ax
    853d:	8b 46 fe             	mov    -0x2(%bp),%ax
    8540:	48                   	dec    %ax
    8541:	b9 04 00             	mov    $0x4,%cx
    8544:	d3 e0                	shl    %cl,%ax
    8546:	05 bf 00             	add    $0xbf,%ax
    8549:	50                   	push   %ax
    854a:	ff 36 82 3a          	push   0x3a82
    854e:	31 c0                	xor    %ax,%ax
    8550:	50                   	push   %ax
    8551:	b0 02                	mov    $0x2,%al
    8553:	50                   	push   %ax
    8554:	b0 00                	mov    $0x0,%al
    8556:	50                   	push   %ax
    8557:	b0 01                	mov    $0x1,%al
    8559:	50                   	push   %ax
    855a:	b8 05 00             	mov    $0x5,%ax
    855d:	50                   	push   %ax
    855e:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    8563:	eb 41                	jmp    0x85a6
    8565:	b8 de 01             	mov    $0x1de,%ax
    8568:	50                   	push   %ax
    8569:	b8 3e 01             	mov    $0x13e,%ax
    856c:	50                   	push   %ax
    856d:	8b 7e fc             	mov    -0x4(%bp),%di
    8570:	d1 e7                	shl    %di
    8572:	ff b5 98 3a          	push   0x3a98(%di)
    8576:	8b 7e fc             	mov    -0x4(%bp),%di
    8579:	d1 e7                	shl    %di
    857b:	ff b5 9e 3a          	push   0x3a9e(%di)
    857f:	b8 01 00             	mov    $0x1,%ax
    8582:	50                   	push   %ax
    8583:	c4 7e d8             	les    -0x28(%bp),%di
    8586:	26 ff 75 02          	push   %es:0x2(%di)
    858a:	c4 7e d8             	les    -0x28(%bp),%di
    858d:	26 ff 75 04          	push   %es:0x4(%di)
    8591:	31 c0                	xor    %ax,%ax
    8593:	50                   	push   %ax
    8594:	b0 02                	mov    $0x2,%al
    8596:	50                   	push   %ax
    8597:	b0 00                	mov    $0x0,%al
    8599:	50                   	push   %ax
    859a:	b0 01                	mov    $0x1,%al
    859c:	50                   	push   %ax
    859d:	b8 02 00             	mov    $0x2,%ax
    85a0:	50                   	push   %ax
    85a1:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    85a6:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    85ab:	3d 1b 01             	cmp    $0x11b,%ax
    85ae:	75 03                	jne    0x85b3
    85b0:	e9 86 03             	jmp    0x8939
    85b3:	83 7e fc 03          	cmpw   $0x3,-0x4(%bp)
    85b7:	74 03                	je     0x85bc
    85b9:	e9 a0 fe             	jmp    0x845c
    85bc:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    85c0:	74 03                	je     0x85c5
    85c2:	e9 8d fe             	jmp    0x8452
    85c5:	b8 64 00             	mov    $0x64,%ax
    85c8:	50                   	push   %ax
    85c9:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    85ce:	b8 bf 00             	mov    $0xbf,%ax
    85d1:	50                   	push   %ax
    85d2:	a1 82 3a             	mov    0x3a82,%ax
    85d5:	48                   	dec    %ax
    85d6:	50                   	push   %ax
    85d7:	a1 9e 3a             	mov    0x3a9e,%ax
    85da:	05 b0 00             	add    $0xb0,%ax
    85dd:	50                   	push   %ax
    85de:	ff 36 a4 3a          	push   0x3aa4
    85e2:	31 c0                	xor    %ax,%ax
    85e4:	50                   	push   %ax
    85e5:	b0 02                	mov    $0x2,%al
    85e7:	50                   	push   %ax
    85e8:	b0 00                	mov    $0x0,%al
    85ea:	50                   	push   %ax
    85eb:	b0 01                	mov    $0x1,%al
    85ed:	50                   	push   %ax
    85ee:	b8 14 00             	mov    $0x14,%ax
    85f1:	50                   	push   %ax
    85f2:	9a 91 16 bf 0a       	lcall  $0xabf,$0x1691
    85f7:	31 c0                	xor    %ax,%ax
    85f9:	50                   	push   %ax
    85fa:	31 c0                	xor    %ax,%ax
    85fc:	50                   	push   %ax
    85fd:	a1 9e 3a             	mov    0x3a9e,%ax
    8600:	05 10 00             	add    $0x10,%ax
    8603:	50                   	push   %ax
    8604:	ff 36 a4 3a          	push   0x3aa4
    8608:	b8 01 00             	mov    $0x1,%ax
    860b:	50                   	push   %ax
    860c:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    8611:	b8 64 00             	mov    $0x64,%ax
    8614:	50                   	push   %ax
    8615:	9a d7 0c 13 1b       	lcall  $0x1b13,$0xcd7
    861a:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    861f:	eb 03                	jmp    0x8624
    8621:	ff 46 fe             	incw   -0x2(%bp)
    8624:	8b 7e fe             	mov    -0x2(%bp),%di
    8627:	d1 e7                	shl    %di
    8629:	8b f7                	mov    %di,%si
    862b:	d1 e7                	shl    %di
    862d:	03 fe                	add    %si,%di
    862f:	81 c7 5a 38          	add    $0x385a,%di
    8633:	89 7e d8             	mov    %di,-0x28(%bp)
    8636:	8c 5e da             	mov    %ds,-0x26(%bp)
    8639:	c4 7e d8             	les    -0x28(%bp),%di
    863c:	26 8a 45 01          	mov    %es:0x1(%di),%al
    8640:	98                   	cbtw
    8641:	8b d8                	mov    %ax,%bx
    8643:	c4 7e d8             	les    -0x28(%bp),%di
    8646:	26 8a 05             	mov    %es:(%di),%al
    8649:	98                   	cbtw
    864a:	48                   	dec    %ax
    864b:	b9 09 00             	mov    $0x9,%cx
    864e:	f7 e9                	imul   %cx
    8650:	03 c3                	add    %bx,%ax
    8652:	2d 06 00             	sub    $0x6,%ax
    8655:	8b 7e fe             	mov    -0x2(%bp),%di
    8658:	88 43 e5             	mov    %al,-0x1b(%bp,%di)
    865b:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    865f:	75 c0                	jne    0x8621
    8661:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    8666:	eb 03                	jmp    0x866b
    8668:	ff 46 fe             	incw   -0x2(%bp)
    866b:	8b 46 fe             	mov    -0x2(%bp),%ax
    866e:	40                   	inc    %ax
    866f:	3d 0c 00             	cmp    $0xc,%ax
    8672:	7e 03                	jle    0x8677
    8674:	e9 cd 00             	jmp    0x8744
    8677:	89 46 fc             	mov    %ax,-0x4(%bp)
    867a:	eb 03                	jmp    0x867f
    867c:	ff 46 fc             	incw   -0x4(%bp)
    867f:	8b 7e fc             	mov    -0x4(%bp),%di
    8682:	8a 43 e5             	mov    -0x1b(%bp,%di),%al
    8685:	8b 7e fe             	mov    -0x2(%bp),%di
    8688:	3a 43 e5             	cmp    -0x1b(%bp,%di),%al
    868b:	72 03                	jb     0x8690
    868d:	e9 ab 00             	jmp    0x873b
    8690:	8b 7e fe             	mov    -0x2(%bp),%di
    8693:	8a 43 e5             	mov    -0x1b(%bp,%di),%al
    8696:	30 e4                	xor    %ah,%ah
    8698:	89 46 fa             	mov    %ax,-0x6(%bp)
    869b:	8b 7e fc             	mov    -0x4(%bp),%di
    869e:	8a 43 e5             	mov    -0x1b(%bp,%di),%al
    86a1:	8b 7e fe             	mov    -0x2(%bp),%di
    86a4:	88 43 e5             	mov    %al,-0x1b(%bp,%di)
    86a7:	8a 46 fa             	mov    -0x6(%bp),%al
    86aa:	8b 7e fc             	mov    -0x4(%bp),%di
    86ad:	88 43 e5             	mov    %al,-0x1b(%bp,%di)
    86b0:	8b 7e fe             	mov    -0x2(%bp),%di
    86b3:	d1 e7                	shl    %di
    86b5:	8b f7                	mov    %di,%si
    86b7:	d1 e7                	shl    %di
    86b9:	03 fe                	add    %si,%di
    86bb:	81 c7 5a 38          	add    $0x385a,%di
    86bf:	1e                   	push   %ds
    86c0:	57                   	push   %di
    86c1:	8d 7e e0             	lea    -0x20(%bp),%di
    86c4:	16                   	push   %ss
    86c5:	57                   	push   %di
    86c6:	b8 06 00             	mov    $0x6,%ax
    86c9:	50                   	push   %ax
    86ca:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    86cf:	8b 7e fc             	mov    -0x4(%bp),%di
    86d2:	d1 e7                	shl    %di
    86d4:	8b f7                	mov    %di,%si
    86d6:	d1 e7                	shl    %di
    86d8:	03 fe                	add    %si,%di
    86da:	81 c7 5a 38          	add    $0x385a,%di
    86de:	1e                   	push   %ds
    86df:	57                   	push   %di
    86e0:	8b 7e fe             	mov    -0x2(%bp),%di
    86e3:	d1 e7                	shl    %di
    86e5:	8b f7                	mov    %di,%si
    86e7:	d1 e7                	shl    %di
    86e9:	03 fe                	add    %si,%di
    86eb:	81 c7 5a 38          	add    $0x385a,%di
    86ef:	1e                   	push   %ds
    86f0:	57                   	push   %di
    86f1:	b8 06 00             	mov    $0x6,%ax
    86f4:	50                   	push   %ax
    86f5:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    86fa:	8d 7e e0             	lea    -0x20(%bp),%di
    86fd:	16                   	push   %ss
    86fe:	57                   	push   %di
    86ff:	8b 7e fc             	mov    -0x4(%bp),%di
    8702:	d1 e7                	shl    %di
    8704:	8b f7                	mov    %di,%si
    8706:	d1 e7                	shl    %di
    8708:	03 fe                	add    %si,%di
    870a:	81 c7 5a 38          	add    $0x385a,%di
    870e:	1e                   	push   %ds
    870f:	57                   	push   %di
    8710:	b8 06 00             	mov    $0x6,%ax
    8713:	50                   	push   %ax
    8714:	9a 5d 02 ce 1d       	lcall  $0x1dce,$0x25d
    8719:	8b 7e fe             	mov    -0x2(%bp),%di
    871c:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    8720:	88 46 df             	mov    %al,-0x21(%bp)
    8723:	8b 7e fc             	mov    -0x4(%bp),%di
    8726:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    872a:	8b 7e fe             	mov    -0x2(%bp),%di
    872d:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    8731:	8a 46 df             	mov    -0x21(%bp),%al
    8734:	8b 7e fc             	mov    -0x4(%bp),%di
    8737:	88 85 dd 2f          	mov    %al,0x2fdd(%di)
    873b:	83 7e fc 0c          	cmpw   $0xc,-0x4(%bp)
    873f:	74 03                	je     0x8744
    8741:	e9 38 ff             	jmp    0x867c
    8744:	83 7e fe 0b          	cmpw   $0xb,-0x2(%bp)
    8748:	74 03                	je     0x874d
    874a:	e9 1b ff             	jmp    0x8668
    874d:	31 c0                	xor    %ax,%ax
    874f:	89 46 f2             	mov    %ax,-0xe(%bp)
    8752:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    8757:	eb 03                	jmp    0x875c
    8759:	ff 46 fe             	incw   -0x2(%bp)
    875c:	8b 7e fe             	mov    -0x2(%bp),%di
    875f:	80 7b f3 01          	cmpb   $0x1,-0xd(%bp,%di)
    8763:	75 03                	jne    0x8768
    8765:	ff 46 f2             	incw   -0xe(%bp)
    8768:	83 7e fe 04          	cmpw   $0x4,-0x2(%bp)
    876c:	75 eb                	jne    0x8759
    876e:	8b 46 f2             	mov    -0xe(%bp),%ax
    8771:	99                   	cwtd
    8772:	8b c8                	mov    %ax,%cx
    8774:	8b da                	mov    %dx,%bx
    8776:	a1 9e 3a             	mov    0x3a9e,%ax
    8779:	31 d2                	xor    %dx,%dx
    877b:	9a 79 02 ce 1d       	lcall  $0x1dce,$0x279
    8780:	8b c8                	mov    %ax,%cx
    8782:	8b da                	mov    %dx,%bx
    8784:	b8 d0 01             	mov    $0x1d0,%ax
    8787:	31 d2                	xor    %dx,%dx
    8789:	2b c1                	sub    %cx,%ax
    878b:	1b d3                	sbb    %bx,%dx
    878d:	b9 02 00             	mov    $0x2,%cx
    8790:	31 db                	xor    %bx,%bx
    8792:	9a 94 02 ce 1d       	lcall  $0x1dce,$0x294
    8797:	a3 62 38             	mov    %ax,0x3862
    879a:	a1 62 38             	mov    0x3862,%ax
    879d:	89 46 dc             	mov    %ax,-0x24(%bp)
    87a0:	a0 60 38             	mov    0x3860,%al
    87a3:	88 46 de             	mov    %al,-0x22(%bp)
    87a6:	c7 46 fe 02 00       	movw   $0x2,-0x2(%bp)
    87ab:	eb 03                	jmp    0x87b0
    87ad:	ff 46 fe             	incw   -0x2(%bp)
    87b0:	8b 7e fe             	mov    -0x2(%bp),%di
    87b3:	d1 e7                	shl    %di
    87b5:	8b f7                	mov    %di,%si
    87b7:	d1 e7                	shl    %di
    87b9:	03 fe                	add    %si,%di
    87bb:	81 c7 5a 38          	add    $0x385a,%di
    87bf:	89 7e d8             	mov    %di,-0x28(%bp)
    87c2:	8c 5e da             	mov    %ds,-0x26(%bp)
    87c5:	c4 7e d8             	les    -0x28(%bp),%di
    87c8:	26 8a 05             	mov    %es:(%di),%al
    87cb:	3a 46 de             	cmp    -0x22(%bp),%al
    87ce:	75 1d                	jne    0x87ed
    87d0:	8b 46 dc             	mov    -0x24(%bp),%ax
    87d3:	05 10 00             	add    $0x10,%ax
    87d6:	c4 7e d8             	les    -0x28(%bp),%di
    87d9:	26 89 45 02          	mov    %ax,%es:0x2(%di)
    87dd:	8b 46 fe             	mov    -0x2(%bp),%ax
    87e0:	48                   	dec    %ax
    87e1:	8b f8                	mov    %ax,%di
    87e3:	d1 e7                	shl    %di
    87e5:	c7 85 a4 3a 10 00    	movw   $0x10,0x3aa4(%di)
    87eb:	eb 21                	jmp    0x880e
    87ed:	8b 46 dc             	mov    -0x24(%bp),%ax
    87f0:	03 06 9e 3a          	add    0x3a9e,%ax
    87f4:	05 10 00             	add    $0x10,%ax
    87f7:	c4 7e d8             	les    -0x28(%bp),%di
    87fa:	26 89 45 02          	mov    %ax,%es:0x2(%di)
    87fe:	8b 16 9e 3a          	mov    0x3a9e,%dx
    8802:	8b 46 fe             	mov    -0x2(%bp),%ax
    8805:	48                   	dec    %ax
    8806:	8b f8                	mov    %ax,%di
    8808:	d1 e7                	shl    %di
    880a:	89 95 a4 3a          	mov    %dx,0x3aa4(%di)
    880e:	c4 7e d8             	les    -0x28(%bp),%di
    8811:	26 8b 45 02          	mov    %es:0x2(%di),%ax
    8815:	89 46 dc             	mov    %ax,-0x24(%bp)
    8818:	c4 7e d8             	les    -0x28(%bp),%di
    881b:	26 8a 05             	mov    %es:(%di),%al
    881e:	88 46 de             	mov    %al,-0x22(%bp)
    8821:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    8825:	75 86                	jne    0x87ad
    8827:	a1 9e 3a             	mov    0x3a9e,%ax
    882a:	a3 bc 3a             	mov    %ax,0x3abc
    882d:	c7 46 fe 01 00       	movw   $0x1,-0x2(%bp)
    8832:	eb 03                	jmp    0x8837
    8834:	ff 46 fe             	incw   -0x2(%bp)
    8837:	8b 7e fe             	mov    -0x2(%bp),%di
    883a:	d1 e7                	shl    %di
    883c:	8b f7                	mov    %di,%si
    883e:	d1 e7                	shl    %di
    8840:	03 fe                	add    %si,%di
    8842:	81 c7 5a 38          	add    $0x385a,%di
    8846:	89 7e d8             	mov    %di,-0x28(%bp)
    8849:	8c 5e da             	mov    %ds,-0x26(%bp)
    884c:	83 7e fe 01          	cmpw   $0x1,-0x2(%bp)
    8850:	74 1a                	je     0x886c
    8852:	8b 46 fe             	mov    -0x2(%bp),%ax
    8855:	48                   	dec    %ax
    8856:	8b f8                	mov    %ax,%di
    8858:	d1 e7                	shl    %di
    885a:	8b f7                	mov    %di,%si
    885c:	d1 e7                	shl    %di
    885e:	03 fe                	add    %si,%di
    8860:	8a 85 5a 38          	mov    0x385a(%di),%al
    8864:	c4 7e d8             	les    -0x28(%bp),%di
    8867:	26 3a 05             	cmp    %es:(%di),%al
    886a:	74 07                	je     0x8873
    886c:	c7 46 f8 68 00       	movw   $0x68,-0x8(%bp)
    8871:	eb 05                	jmp    0x8878
    8873:	c7 46 f8 6c 00       	movw   $0x6c,-0x8(%bp)
    8878:	8b 7e fe             	mov    -0x2(%bp),%di
    887b:	8a 85 dd 2f          	mov    0x2fdd(%di),%al
    887f:	30 e4                	xor    %ah,%ah
    8881:	8b f8                	mov    %ax,%di
    8883:	d1 e7                	shl    %di
    8885:	d1 e7                	shl    %di
    8887:	ff b5 e4 38          	push   0x38e4(%di)
    888b:	ff b5 e2 38          	push   0x38e2(%di)
    888f:	31 c0                	xor    %ax,%ax
    8891:	50                   	push   %ax
    8892:	31 c0                	xor    %ax,%ax
    8894:	50                   	push   %ax
    8895:	31 c0                	xor    %ax,%ax
    8897:	50                   	push   %ax
    8898:	b8 01 00             	mov    $0x1,%ax
    889b:	50                   	push   %ax
    889c:	b0 02                	mov    $0x2,%al
    889e:	50                   	push   %ax
    889f:	b0 00                	mov    $0x0,%al
    88a1:	50                   	push   %ax
    88a2:	b0 01                	mov    $0x1,%al
    88a4:	50                   	push   %ax
    88a5:	b8 0a 00             	mov    $0xa,%ax
    88a8:	50                   	push   %ax
    88a9:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    88ae:	ff 76 f8             	push   -0x8(%bp)
    88b1:	31 c0                	xor    %ax,%ax
    88b3:	50                   	push   %ax
    88b4:	b8 03 00             	mov    $0x3,%ax
    88b7:	50                   	push   %ax
    88b8:	ff 36 a4 3a          	push   0x3aa4
    88bc:	b8 01 00             	mov    $0x1,%ax
    88bf:	50                   	push   %ax
    88c0:	31 c0                	xor    %ax,%ax
    88c2:	50                   	push   %ax
    88c3:	31 c0                	xor    %ax,%ax
    88c5:	50                   	push   %ax
    88c6:	b8 01 00             	mov    $0x1,%ax
    88c9:	50                   	push   %ax
    88ca:	b0 02                	mov    $0x2,%al
    88cc:	50                   	push   %ax
    88cd:	b0 00                	mov    $0x0,%al
    88cf:	50                   	push   %ax
    88d0:	b0 01                	mov    $0x1,%al
    88d2:	50                   	push   %ax
    88d3:	31 c0                	xor    %ax,%ax
    88d5:	50                   	push   %ax
    88d6:	9a 60 06 bf 0a       	lcall  $0xabf,$0x660
    88db:	31 c0                	xor    %ax,%ax
    88dd:	50                   	push   %ax
    88de:	31 c0                	xor    %ax,%ax
    88e0:	50                   	push   %ax
    88e1:	ff 36 9e 3a          	push   0x3a9e
    88e5:	ff 36 a4 3a          	push   0x3aa4
    88e9:	b8 01 00             	mov    $0x1,%ax
    88ec:	50                   	push   %ax
    88ed:	c4 7e d8             	les    -0x28(%bp),%di
    88f0:	26 ff 75 02          	push   %es:0x2(%di)
    88f4:	ff 36 82 3a          	push   0x3a82
    88f8:	31 c0                	xor    %ax,%ax
    88fa:	50                   	push   %ax
    88fb:	b0 02                	mov    $0x2,%al
    88fd:	50                   	push   %ax
    88fe:	b0 00                	mov    $0x0,%al
    8900:	50                   	push   %ax
    8901:	b0 01                	mov    $0x1,%al
    8903:	50                   	push   %ax
    8904:	b8 14 00             	mov    $0x14,%ax
    8907:	50                   	push   %ax
    8908:	9a 0c 19 bf 0a       	lcall  $0xabf,$0x190c
    890d:	9a 9b 00 85 0c       	lcall  $0xc85,$0x9b
    8912:	3d 1b 01             	cmp    $0x11b,%ax
    8915:	75 02                	jne    0x8919
    8917:	eb 20                	jmp    0x8939
    8919:	83 7e fe 0c          	cmpw   $0xc,-0x2(%bp)
    891d:	74 03                	je     0x8922
    891f:	e9 12 ff             	jmp    0x8834
    8922:	31 c0                	xor    %ax,%ax
    8924:	50                   	push   %ax
    8925:	31 c0                	xor    %ax,%ax
    8927:	50                   	push   %ax
    8928:	ff 36 9e 3a          	push   0x3a9e
    892c:	ff 36 a4 3a          	push   0x3aa4
    8930:	b8 01 00             	mov    $0x1,%ax
    8933:	50                   	push   %ax
    8934:	9a 4a 10 a3 0c       	lcall  $0xca3,$0x104a
    8939:	89 ec                	mov    %bp,%sp
    893b:	5d                   	pop    %bp
    893c:	cb                   	lret
    893d:	55                   	push   %bp
    893e:	89 e5                	mov    %sp,%bp
    8940:	89 ec                	mov    %bp,%sp
    8942:	5d                   	pop    %bp
    8943:	cb                   	lret
	...
    8950:	55                   	push   %bp
    8951:	89 e5                	mov    %sp,%bp
    8953:	83 ec 4a             	sub    $0x4a,%sp
    8956:	c4 46 14             	les    0x14(%bp),%ax
    8959:	8c c2                	mov    %es,%dx
    895b:	05 41 00             	add    $0x41,%ax
    895e:	83 d2 00             	adc    $0x0,%dx
    8961:	89 46 c0             	mov    %ax,-0x40(%bp)
    8964:	89 56 c2             	mov    %dx,-0x3e(%bp)
    8967:	8b 46 c2             	mov    -0x3e(%bp),%ax
    896a:	50                   	push   %ax
    896b:	8b 7e c0             	mov    -0x40(%bp),%di
    896e:	07                   	pop    %es
    896f:	26 8a 05             	mov    %es:(%di),%al
    8972:	30 e4                	xor    %ah,%ah
    8974:	89 46 f6             	mov    %ax,-0xa(%bp)
    8977:	c4 46 14             	les    0x14(%bp),%ax
    897a:	8c c2                	mov    %es,%dx
    897c:	05 42 00             	add    $0x42,%ax
    897f:	83 d2 00             	adc    $0x0,%dx
    8982:	89 46 c0             	mov    %ax,-0x40(%bp)
    8985:	89 56 c2             	mov    %dx,-0x3e(%bp)
    8988:	8b 46 c2             	mov    -0x3e(%bp),%ax
    898b:	50                   	push   %ax
    898c:	8b 7e c0             	mov    -0x40(%bp),%di
    898f:	07                   	pop    %es
    8990:	26 8b 05             	mov    %es:(%di),%ax
    8993:	89 46 f4             	mov    %ax,-0xc(%bp)
    8996:	c4 46 14             	les    0x14(%bp),%ax
    8999:	8c c2                	mov    %es,%dx
    899b:	05 04 00             	add    $0x4,%ax
    899e:	83 d2 00             	adc    $0x0,%dx
    89a1:	89 46 c0             	mov    %ax,-0x40(%bp)
    89a4:	89 56 c2             	mov    %dx,-0x3e(%bp)
    89a7:	8b 46 c2             	mov    -0x3e(%bp),%ax
    89aa:	50                   	push   %ax
    89ab:	8b 7e c0             	mov    -0x40(%bp),%di
    89ae:	07                   	pop    %es
    89af:	26 8b 05             	mov    %es:(%di),%ax
    89b2:	89 46 fe             	mov    %ax,-0x2(%bp)
    89b5:	c4 46 14             	les    0x14(%bp),%ax
    89b8:	8c c2                	mov    %es,%dx
    89ba:	05 06 00             	add    $0x6,%ax
    89bd:	83 d2 00             	adc    $0x0,%dx
    89c0:	89 46 c0             	mov    %ax,-0x40(%bp)
    89c3:	89 56 c2             	mov    %dx,-0x3e(%bp)
    89c6:	8b 46 c2             	mov    -0x3e(%bp),%ax
    89c9:	50                   	push   %ax
    89ca:	8b 7e c0             	mov    -0x40(%bp),%di
    89cd:	07                   	pop    %es
    89ce:	26 8b 05             	mov    %es:(%di),%ax
    89d1:	89 46 fa             	mov    %ax,-0x6(%bp)
    89d4:	c4 46 14             	les    0x14(%bp),%ax
    89d7:	8c c2                	mov    %es,%dx
    89d9:	05 08 00             	add    $0x8,%ax
    89dc:	83 d2 00             	adc    $0x0,%dx
    89df:	89 46 c0             	mov    %ax,-0x40(%bp)
    89e2:	89 56 c2             	mov    %dx,-0x3e(%bp)
    89e5:	8b 46 c2             	mov    -0x3e(%bp),%ax
    89e8:	50                   	push   %ax
    89e9:	8b 7e c0             	mov    -0x40(%bp),%di
    89ec:	07                   	pop    %es
    89ed:	26 8b 05             	mov    %es:(%di),%ax
    89f0:	89 46 fc             	mov    %ax,-0x4(%bp)
    89f3:	c4 46 14             	les    0x14(%bp),%ax
    89f6:	8c c2                	mov    %es,%dx
    89f8:	05 0a 00             	add    $0xa,%ax
    89fb:	83 d2 00             	adc    $0x0,%dx
    89fe:	89 46 c0             	mov    %ax,-0x40(%bp)
    8a01:	89 56 c2             	mov    %dx,-0x3e(%bp)
    8a04:	8b 46 c2             	mov    -0x3e(%bp),%ax
    8a07:	50                   	push   %ax
    8a08:	8b 7e c0             	mov    -0x40(%bp),%di
    8a0b:	07                   	pop    %es
    8a0c:	26 8b 05             	mov    %es:(%di),%ax
    8a0f:	89 46 f8             	mov    %ax,-0x8(%bp)
    8a12:	8b 46 fc             	mov    -0x4(%bp),%ax
    8a15:	2b 46 fe             	sub    -0x2(%bp),%ax
    8a18:	40                   	inc    %ax
    8a19:	89 46 f2             	mov    %ax,-0xe(%bp)
    8a1c:	8b 46 f8             	mov    -0x8(%bp),%ax
    8a1f:	2b 46 fa             	sub    -0x6(%bp),%ax
    8a22:	40                   	inc    %ax
    8a23:	89 46 f0             	mov    %ax,-0x10(%bp)
    8a26:	b8 01 00             	mov    $0x1,%ax
    8a29:	50                   	push   %ax
    8a2a:	8d 46 ec             	lea    -0x14(%bp),%ax
    8a2d:	8c d2                	mov    %ss,%dx
    8a2f:	52                   	push   %dx
    8a30:	50                   	push   %ax
    8a31:	b8 05 00             	mov    $0x5,%ax
    8a34:	50                   	push   %ax
    8a35:	ff 76 f2             	push   -0xe(%bp)
    8a38:	ff 76 f0             	push   -0x10(%bp)
    8a3b:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    8a40:	ff 76 ee             	push   -0x12(%bp)
    8a43:	ff 76 ec             	push   -0x14(%bp)
    8a46:	ff 76 12             	push   0x12(%bp)
    8a49:	ff 76 10             	push   0x10(%bp)
    8a4c:	ff 76 f2             	push   -0xe(%bp)
    8a4f:	ff 76 f0             	push   -0x10(%bp)
    8a52:	ff 76 0e             	push   0xe(%bp)
    8a55:	8a 46 0a             	mov    0xa(%bp),%al
    8a58:	50                   	push   %ax
    8a59:	8a 46 08             	mov    0x8(%bp),%al
    8a5c:	50                   	push   %ax
    8a5d:	9a 1f 01 bf 0a       	lcall  $0xabf,$0x11f
    8a62:	c4 46 14             	les    0x14(%bp),%ax
    8a65:	8c c2                	mov    %es,%dx
    8a67:	05 80 00             	add    $0x80,%ax
    8a6a:	83 d2 00             	adc    $0x0,%dx
    8a6d:	89 46 c8             	mov    %ax,-0x38(%bp)
    8a70:	89 56 ca             	mov    %dx,-0x36(%bp)
    8a73:	c4 46 ec             	les    -0x14(%bp),%ax
    8a76:	8c c2                	mov    %es,%dx
    8a78:	05 80 00             	add    $0x80,%ax
    8a7b:	83 d2 00             	adc    $0x0,%dx
    8a7e:	89 46 c4             	mov    %ax,-0x3c(%bp)
    8a81:	89 56 c6             	mov    %dx,-0x3a(%bp)
    8a84:	8b 46 f8             	mov    -0x8(%bp),%ax
    8a87:	89 46 b8             	mov    %ax,-0x48(%bp)
    8a8a:	8b 46 fa             	mov    -0x6(%bp),%ax
    8a8d:	3b 46 b8             	cmp    -0x48(%bp),%ax
    8a90:	7e 03                	jle    0x8a95
    8a92:	e9 e2 01             	jmp    0x8c77
    8a95:	89 46 bc             	mov    %ax,-0x44(%bp)
    8a98:	eb 03                	jmp    0x8a9d
    8a9a:	ff 46 bc             	incw   -0x44(%bp)
    8a9d:	c4 46 c8             	les    -0x38(%bp),%ax
    8aa0:	8c c2                	mov    %es,%dx
    8aa2:	89 46 e8             	mov    %ax,-0x18(%bp)
    8aa5:	89 56 ea             	mov    %dx,-0x16(%bp)
    8aa8:	8b 46 f4             	mov    -0xc(%bp),%ax
    8aab:	99                   	cwtd
    8aac:	03 46 e8             	add    -0x18(%bp),%ax
    8aaf:	13 56 ea             	adc    -0x16(%bp),%dx
    8ab2:	89 46 e4             	mov    %ax,-0x1c(%bp)
    8ab5:	89 56 e6             	mov    %dx,-0x1a(%bp)
    8ab8:	8b 46 f4             	mov    -0xc(%bp),%ax
    8abb:	99                   	cwtd
    8abc:	03 46 e4             	add    -0x1c(%bp),%ax
    8abf:	13 56 e6             	adc    -0x1a(%bp),%dx
    8ac2:	89 46 e0             	mov    %ax,-0x20(%bp)
    8ac5:	89 56 e2             	mov    %dx,-0x1e(%bp)
    8ac8:	8b 46 f4             	mov    -0xc(%bp),%ax
    8acb:	99                   	cwtd
    8acc:	03 46 e0             	add    -0x20(%bp),%ax
    8acf:	13 56 e2             	adc    -0x1e(%bp),%dx
    8ad2:	89 46 dc             	mov    %ax,-0x24(%bp)
    8ad5:	89 56 de             	mov    %dx,-0x22(%bp)
    8ad8:	c4 46 c4             	les    -0x3c(%bp),%ax
    8adb:	8c c2                	mov    %es,%dx
    8add:	89 46 d8             	mov    %ax,-0x28(%bp)
    8ae0:	89 56 da             	mov    %dx,-0x26(%bp)
    8ae3:	8b 46 f4             	mov    -0xc(%bp),%ax
    8ae6:	99                   	cwtd
    8ae7:	03 46 d8             	add    -0x28(%bp),%ax
    8aea:	13 56 da             	adc    -0x26(%bp),%dx
    8aed:	89 46 d4             	mov    %ax,-0x2c(%bp)
    8af0:	89 56 d6             	mov    %dx,-0x2a(%bp)
    8af3:	8b 46 f4             	mov    -0xc(%bp),%ax
    8af6:	99                   	cwtd
    8af7:	03 46 d4             	add    -0x2c(%bp),%ax
    8afa:	13 56 d6             	adc    -0x2a(%bp),%dx
    8afd:	89 46 d0             	mov    %ax,-0x30(%bp)
    8b00:	89 56 d2             	mov    %dx,-0x2e(%bp)
    8b03:	8b 46 f4             	mov    -0xc(%bp),%ax
    8b06:	99                   	cwtd
    8b07:	03 46 d0             	add    -0x30(%bp),%ax
    8b0a:	13 56 d2             	adc    -0x2e(%bp),%dx
    8b0d:	89 46 cc             	mov    %ax,-0x34(%bp)
    8b10:	89 56 ce             	mov    %dx,-0x32(%bp)
    8b13:	8b 46 f4             	mov    -0xc(%bp),%ax
    8b16:	89 46 b6             	mov    %ax,-0x4a(%bp)
    8b19:	b8 01 00             	mov    $0x1,%ax
    8b1c:	3b 46 b6             	cmp    -0x4a(%bp),%ax
    8b1f:	7e 03                	jle    0x8b24
    8b21:	e9 32 01             	jmp    0x8c56
    8b24:	89 46 ba             	mov    %ax,-0x46(%bp)
    8b27:	eb 03                	jmp    0x8b2c
    8b29:	ff 46 ba             	incw   -0x46(%bp)
    8b2c:	8b 46 de             	mov    -0x22(%bp),%ax
    8b2f:	50                   	push   %ax
    8b30:	8b 7e dc             	mov    -0x24(%bp),%di
    8b33:	07                   	pop    %es
    8b34:	26 8a 1d             	mov    %es:(%di),%bl
    8b37:	8b 46 e2             	mov    -0x1e(%bp),%ax
    8b3a:	50                   	push   %ax
    8b3b:	8b 7e e0             	mov    -0x20(%bp),%di
    8b3e:	07                   	pop    %es
    8b3f:	26 8a 0d             	mov    %es:(%di),%cl
    8b42:	8b 46 e6             	mov    -0x1a(%bp),%ax
    8b45:	50                   	push   %ax
    8b46:	8b 7e e4             	mov    -0x1c(%bp),%di
    8b49:	07                   	pop    %es
    8b4a:	26 8a 15             	mov    %es:(%di),%dl
    8b4d:	8b 46 ea             	mov    -0x16(%bp),%ax
    8b50:	50                   	push   %ax
    8b51:	8b 7e e8             	mov    -0x18(%bp),%di
    8b54:	07                   	pop    %es
    8b55:	26 8a 05             	mov    %es:(%di),%al
    8b58:	0a c2                	or     %dl,%al
    8b5a:	0a c1                	or     %cl,%al
    8b5c:	0a c3                	or     %bl,%al
    8b5e:	f6 d0                	not    %al
    8b60:	88 46 bf             	mov    %al,-0x41(%bp)
    8b63:	8b 46 da             	mov    -0x26(%bp),%ax
    8b66:	50                   	push   %ax
    8b67:	8b 7e d8             	mov    -0x28(%bp),%di
    8b6a:	07                   	pop    %es
    8b6b:	26 8a 05             	mov    %es:(%di),%al
    8b6e:	22 46 bf             	and    -0x41(%bp),%al
    8b71:	8a d0                	mov    %al,%dl
    8b73:	8b 46 ea             	mov    -0x16(%bp),%ax
    8b76:	50                   	push   %ax
    8b77:	8b 7e e8             	mov    -0x18(%bp),%di
    8b7a:	07                   	pop    %es
    8b7b:	26 8a 05             	mov    %es:(%di),%al
    8b7e:	32 c2                	xor    %dl,%al
    8b80:	8a d0                	mov    %al,%dl
    8b82:	8b 46 da             	mov    -0x26(%bp),%ax
    8b85:	50                   	push   %ax
    8b86:	8b 7e d8             	mov    -0x28(%bp),%di
    8b89:	07                   	pop    %es
    8b8a:	26 88 15             	mov    %dl,%es:(%di)
    8b8d:	8b 46 d6             	mov    -0x2a(%bp),%ax
    8b90:	50                   	push   %ax
    8b91:	8b 7e d4             	mov    -0x2c(%bp),%di
    8b94:	07                   	pop    %es
    8b95:	26 8a 05             	mov    %es:(%di),%al
    8b98:	22 46 bf             	and    -0x41(%bp),%al
    8b9b:	8a d0                	mov    %al,%dl
    8b9d:	8b 46 e6             	mov    -0x1a(%bp),%ax
    8ba0:	50                   	push   %ax
    8ba1:	8b 7e e4             	mov    -0x1c(%bp),%di
    8ba4:	07                   	pop    %es
    8ba5:	26 8a 05             	mov    %es:(%di),%al
    8ba8:	32 c2                	xor    %dl,%al
    8baa:	8a d0                	mov    %al,%dl
    8bac:	8b 46 d6             	mov    -0x2a(%bp),%ax
    8baf:	50                   	push   %ax
    8bb0:	8b 7e d4             	mov    -0x2c(%bp),%di
    8bb3:	07                   	pop    %es
    8bb4:	26 88 15             	mov    %dl,%es:(%di)
    8bb7:	8b 46 d2             	mov    -0x2e(%bp),%ax
    8bba:	50                   	push   %ax
    8bbb:	8b 7e d0             	mov    -0x30(%bp),%di
    8bbe:	07                   	pop    %es
    8bbf:	26 8a 05             	mov    %es:(%di),%al
    8bc2:	22 46 bf             	and    -0x41(%bp),%al
    8bc5:	8a d0                	mov    %al,%dl
    8bc7:	8b 46 e2             	mov    -0x1e(%bp),%ax
    8bca:	50                   	push   %ax
    8bcb:	8b 7e e0             	mov    -0x20(%bp),%di
    8bce:	07                   	pop    %es
    8bcf:	26 8a 05             	mov    %es:(%di),%al
    8bd2:	32 c2                	xor    %dl,%al
    8bd4:	8a d0                	mov    %al,%dl
    8bd6:	8b 46 d2             	mov    -0x2e(%bp),%ax
    8bd9:	50                   	push   %ax
    8bda:	8b 7e d0             	mov    -0x30(%bp),%di
    8bdd:	07                   	pop    %es
    8bde:	26 88 15             	mov    %dl,%es:(%di)
    8be1:	8b 46 ce             	mov    -0x32(%bp),%ax
    8be4:	50                   	push   %ax
    8be5:	8b 7e cc             	mov    -0x34(%bp),%di
    8be8:	07                   	pop    %es
    8be9:	26 8a 05             	mov    %es:(%di),%al
    8bec:	22 46 bf             	and    -0x41(%bp),%al
    8bef:	8a d0                	mov    %al,%dl
    8bf1:	8b 46 de             	mov    -0x22(%bp),%ax
    8bf4:	50                   	push   %ax
    8bf5:	8b 7e dc             	mov    -0x24(%bp),%di
    8bf8:	07                   	pop    %es
    8bf9:	26 8a 05             	mov    %es:(%di),%al
    8bfc:	32 c2                	xor    %dl,%al
    8bfe:	8a d0                	mov    %al,%dl
    8c00:	8b 46 ce             	mov    -0x32(%bp),%ax
    8c03:	50                   	push   %ax
    8c04:	8b 7e cc             	mov    -0x34(%bp),%di
    8c07:	07                   	pop    %es
    8c08:	26 88 15             	mov    %dl,%es:(%di)
    8c0b:	83 46 e8 01          	addw   $0x1,-0x18(%bp)
    8c0f:	83 56 ea 00          	adcw   $0x0,-0x16(%bp)
    8c13:	83 46 e4 01          	addw   $0x1,-0x1c(%bp)
    8c17:	83 56 e6 00          	adcw   $0x0,-0x1a(%bp)
    8c1b:	83 46 e0 01          	addw   $0x1,-0x20(%bp)
    8c1f:	83 56 e2 00          	adcw   $0x0,-0x1e(%bp)
    8c23:	83 46 dc 01          	addw   $0x1,-0x24(%bp)
    8c27:	83 56 de 00          	adcw   $0x0,-0x22(%bp)
    8c2b:	83 46 d8 01          	addw   $0x1,-0x28(%bp)
    8c2f:	83 56 da 00          	adcw   $0x0,-0x26(%bp)
    8c33:	83 46 d4 01          	addw   $0x1,-0x2c(%bp)
    8c37:	83 56 d6 00          	adcw   $0x0,-0x2a(%bp)
    8c3b:	83 46 d0 01          	addw   $0x1,-0x30(%bp)
    8c3f:	83 56 d2 00          	adcw   $0x0,-0x2e(%bp)
    8c43:	83 46 cc 01          	addw   $0x1,-0x34(%bp)
    8c47:	83 56 ce 00          	adcw   $0x0,-0x32(%bp)
    8c4b:	8b 46 ba             	mov    -0x46(%bp),%ax
    8c4e:	3b 46 b6             	cmp    -0x4a(%bp),%ax
    8c51:	74 03                	je     0x8c56
    8c53:	e9 d3 fe             	jmp    0x8b29
    8c56:	c4 46 dc             	les    -0x24(%bp),%ax
    8c59:	8c c2                	mov    %es,%dx
    8c5b:	89 46 c8             	mov    %ax,-0x38(%bp)
    8c5e:	89 56 ca             	mov    %dx,-0x36(%bp)
    8c61:	c4 46 cc             	les    -0x34(%bp),%ax
    8c64:	8c c2                	mov    %es,%dx
    8c66:	89 46 c4             	mov    %ax,-0x3c(%bp)
    8c69:	89 56 c6             	mov    %dx,-0x3a(%bp)
    8c6c:	8b 46 bc             	mov    -0x44(%bp),%ax
    8c6f:	3b 46 b8             	cmp    -0x48(%bp),%ax
    8c72:	74 03                	je     0x8c77
    8c74:	e9 23 fe             	jmp    0x8a9a
    8c77:	ff 76 ee             	push   -0x12(%bp)
    8c7a:	ff 76 ec             	push   -0x14(%bp)
    8c7d:	31 c0                	xor    %ax,%ax
    8c7f:	50                   	push   %ax
    8c80:	ff 76 12             	push   0x12(%bp)
    8c83:	ff 76 10             	push   0x10(%bp)
    8c86:	ff 76 0e             	push   0xe(%bp)
    8c89:	8a 46 0c             	mov    0xc(%bp),%al
    8c8c:	50                   	push   %ax
    8c8d:	8a 46 0a             	mov    0xa(%bp),%al
    8c90:	50                   	push   %ax
    8c91:	8a 46 08             	mov    0x8(%bp),%al
    8c94:	50                   	push   %ax
    8c95:	31 c0                	xor    %ax,%ax
    8c97:	50                   	push   %ax
    8c98:	9a 1f 02 bf 0a       	lcall  $0xabf,$0x21f
    8c9d:	ff 76 ee             	push   -0x12(%bp)
    8ca0:	ff 76 ec             	push   -0x14(%bp)
    8ca3:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    8ca8:	89 ec                	mov    %bp,%sp
    8caa:	5d                   	pop    %bp
    8cab:	ca 12 00             	lret   $0x12
    8cae:	55                   	push   %bp
    8caf:	89 e5                	mov    %sp,%bp
    8cb1:	81 ec 9c 00          	sub    $0x9c,%sp
    8cb5:	c6 86 69 ff 00       	movb   $0x0,-0x97(%bp)
    8cba:	8b 46 1c             	mov    0x1c(%bp),%ax
    8cbd:	3b 46 14             	cmp    0x14(%bp),%ax
    8cc0:	7e 08                	jle    0x8cca
    8cc2:	a1 32 2e             	mov    0x2e32,%ax
    8cc5:	f7 d8                	neg    %ax
    8cc7:	a3 32 2e             	mov    %ax,0x2e32
    8cca:	8b 46 1a             	mov    0x1a(%bp),%ax
    8ccd:	3b 46 12             	cmp    0x12(%bp),%ax
    8cd0:	7e 08                	jle    0x8cda
    8cd2:	a1 34 2e             	mov    0x2e34,%ax
    8cd5:	f7 d8                	neg    %ax
    8cd7:	a3 34 2e             	mov    %ax,0x2e34
    8cda:	8b 46 18             	mov    0x18(%bp),%ax
    8cdd:	89 46 ea             	mov    %ax,-0x16(%bp)
    8ce0:	8b 46 16             	mov    0x16(%bp),%ax
    8ce3:	89 46 e8             	mov    %ax,-0x18(%bp)
    8ce6:	8b 46 1c             	mov    0x1c(%bp),%ax
    8ce9:	89 46 f6             	mov    %ax,-0xa(%bp)
    8cec:	8b 46 1a             	mov    0x1a(%bp),%ax
    8cef:	89 46 f4             	mov    %ax,-0xc(%bp)
    8cf2:	80 7e 10 00          	cmpb   $0x0,0x10(%bp)
    8cf6:	74 03                	je     0x8cfb
    8cf8:	e9 cd 00             	jmp    0x8dc8
    8cfb:	80 be 69 ff 00       	cmpb   $0x0,-0x97(%bp)
    8d00:	75 1d                	jne    0x8d1f
    8d02:	8d be 78 ff          	lea    -0x88(%bp),%di
    8d06:	16                   	push   %ss
    8d07:	57                   	push   %di
    8d08:	8d be 76 ff          	lea    -0x8a(%bp),%di
    8d0c:	16                   	push   %ss
    8d0d:	57                   	push   %di
    8d0e:	8d be 74 ff          	lea    -0x8c(%bp),%di
    8d12:	16                   	push   %ss
    8d13:	57                   	push   %di
    8d14:	8d be 72 ff          	lea    -0x8e(%bp),%di
    8d18:	16                   	push   %ss
    8d19:	57                   	push   %di
    8d1a:	9a 36 00 bf 1d       	lcall  $0x1dbf,$0x36
    8d1f:	c6 86 69 ff 01       	movb   $0x1,-0x97(%bp)
    8d24:	80 3e 30 2e 00       	cmpb   $0x0,0x2e30
    8d29:	74 0d                	je     0x8d38
    8d2b:	ff 36 1a 2e          	push   0x2e1a
    8d2f:	ff 36 18 2e          	push   0x2e18
    8d33:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    8d38:	8b 46 18             	mov    0x18(%bp),%ax
    8d3b:	a3 1c 2e             	mov    %ax,0x2e1c
    8d3e:	8b 46 16             	mov    0x16(%bp),%ax
    8d41:	a3 1e 2e             	mov    %ax,0x2e1e
    8d44:	8b 46 1c             	mov    0x1c(%bp),%ax
    8d47:	a3 20 2e             	mov    %ax,0x2e20
    8d4a:	8b 46 1a             	mov    0x1a(%bp),%ax
    8d4d:	a3 22 2e             	mov    %ax,0x2e22
    8d50:	a1 20 2e             	mov    0x2e20,%ax
    8d53:	03 06 1c 2e          	add    0x2e1c,%ax
    8d57:	48                   	dec    %ax
    8d58:	a3 24 2e             	mov    %ax,0x2e24
    8d5b:	a1 22 2e             	mov    0x2e22,%ax
    8d5e:	03 06 1e 2e          	add    0x2e1e,%ax
    8d62:	48                   	dec    %ax
    8d63:	a3 26 2e             	mov    %ax,0x2e26
    8d66:	a1 d0 2f             	mov    0x2fd0,%ax
    8d69:	a3 28 2e             	mov    %ax,0x2e28
    8d6c:	a1 d2 2f             	mov    0x2fd2,%ax
    8d6f:	a3 2a 2e             	mov    %ax,0x2e2a
    8d72:	a1 28 2e             	mov    0x2e28,%ax
    8d75:	03 06 1c 2e          	add    0x2e1c,%ax
    8d79:	48                   	dec    %ax
    8d7a:	a3 2c 2e             	mov    %ax,0x2e2c
    8d7d:	a1 2a 2e             	mov    0x2e2a,%ax
    8d80:	03 06 1e 2e          	add    0x2e1e,%ax
    8d84:	48                   	dec    %ax
    8d85:	a3 2e 2e             	mov    %ax,0x2e2e
    8d88:	b8 01 00             	mov    $0x1,%ax
    8d8b:	50                   	push   %ax
    8d8c:	b8 18 2e             	mov    $0x2e18,%ax
    8d8f:	8c da                	mov    %ds,%dx
    8d91:	52                   	push   %dx
    8d92:	50                   	push   %ax
    8d93:	b8 05 00             	mov    $0x5,%ax
    8d96:	50                   	push   %ax
    8d97:	ff 76 18             	push   0x18(%bp)
    8d9a:	ff 76 16             	push   0x16(%bp)
    8d9d:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    8da2:	ff 36 1a 2e          	push   0x2e1a
    8da6:	ff 36 18 2e          	push   0x2e18
    8daa:	ff 36 28 2e          	push   0x2e28
    8dae:	ff 36 2a 2e          	push   0x2e2a
    8db2:	ff 36 2c 2e          	push   0x2e2c
    8db6:	ff 36 2e 2e          	push   0x2e2e
    8dba:	b8 01 00             	mov    $0x1,%ax
    8dbd:	50                   	push   %ax
    8dbe:	9a fb 01 a3 0c       	lcall  $0xca3,$0x1fb
    8dc3:	c6 06 30 2e 01       	movb   $0x1,0x2e30
    8dc8:	80 7e 10 02          	cmpb   $0x2,0x10(%bp)
    8dcc:	74 03                	je     0x8dd1
    8dce:	e9 aa 00             	jmp    0x8e7b
    8dd1:	80 be 69 ff 00       	cmpb   $0x0,-0x97(%bp)
    8dd6:	75 1d                	jne    0x8df5
    8dd8:	8d be 78 ff          	lea    -0x88(%bp),%di
    8ddc:	16                   	push   %ss
    8ddd:	57                   	push   %di
    8dde:	8d be 76 ff          	lea    -0x8a(%bp),%di
    8de2:	16                   	push   %ss
    8de3:	57                   	push   %di
    8de4:	8d be 74 ff          	lea    -0x8c(%bp),%di
    8de8:	16                   	push   %ss
    8de9:	57                   	push   %di
    8dea:	8d be 72 ff          	lea    -0x8e(%bp),%di
    8dee:	16                   	push   %ss
    8def:	57                   	push   %di
    8df0:	9a 36 00 bf 1d       	lcall  $0x1dbf,$0x36
    8df5:	c6 86 69 ff 01       	movb   $0x1,-0x97(%bp)
    8dfa:	80 3e 30 2e 00       	cmpb   $0x0,0x2e30
    8dff:	74 0d                	je     0x8e0e
    8e01:	ff 36 1a 2e          	push   0x2e1a
    8e05:	ff 36 18 2e          	push   0x2e18
    8e09:	9a c7 01 a3 0c       	lcall  $0xca3,$0x1c7
    8e0e:	8b 46 18             	mov    0x18(%bp),%ax
    8e11:	a3 1c 2e             	mov    %ax,0x2e1c
    8e14:	8b 46 16             	mov    0x16(%bp),%ax
    8e17:	a3 1e 2e             	mov    %ax,0x2e1e
    8e1a:	8b 46 1c             	mov    0x1c(%bp),%ax
    8e1d:	a3 20 2e             	mov    %ax,0x2e20
    8e20:	8b 46 1a             	mov    0x1a(%bp),%ax
    8e23:	a3 22 2e             	mov    %ax,0x2e22
    8e26:	a1 20 2e             	mov    0x2e20,%ax
    8e29:	03 06 1c 2e          	add    0x2e1c,%ax
    8e2d:	48                   	dec    %ax
    8e2e:	a3 24 2e             	mov    %ax,0x2e24
    8e31:	a1 22 2e             	mov    0x2e22,%ax
    8e34:	03 06 1e 2e          	add    0x2e1e,%ax
    8e38:	48                   	dec    %ax
    8e39:	a3 26 2e             	mov    %ax,0x2e26
    8e3c:	b8 01 00             	mov    $0x1,%ax
    8e3f:	50                   	push   %ax
    8e40:	b8 18 2e             	mov    $0x2e18,%ax
    8e43:	8c da                	mov    %ds,%dx
    8e45:	52                   	push   %dx
    8e46:	50                   	push   %ax
    8e47:	b8 05 00             	mov    $0x5,%ax
    8e4a:	50                   	push   %ax
    8e4b:	ff 76 18             	push   0x18(%bp)
    8e4e:	ff 76 16             	push   0x16(%bp)
    8e51:	9a 3d 05 a3 0c       	lcall  $0xca3,$0x53d
    8e56:	ff 36 1a 2e          	push   0x2e1a
    8e5a:	ff 36 18 2e          	push   0x2e18
    8e5e:	ff 36 20 2e          	push   0x2e20
    8e62:	ff 36 22 2e          	push   0x2e22
    8e66:	ff 36 24 2e          	push   0x2e24
    8e6a:	ff 36 26 2e          	push   0x2e26
    8e6e:	31 c0                	xor    %ax,%ax
    8e70:	50                   	push   %ax
    8e71:	9a fb 01 a3 0c       	lcall  $0xca3,$0x1fb
    8e76:	c6 06 30 2e 01       	movb   $0x1,0x2e30
    8e7b:	83 3e 32 2e 00       	cmpw   $0x0,0x2e32
    8e80:	75 07                	jne    0x8e89
    8e82:	83 3e 34 2e 00       	cmpw   $0x0,0x2e34
    8e87:	74 04                	je     0x8e8d
    8e89:	b0 00                	mov    $0x0,%al
    8e8b:	eb 02                	jmp    0x8e8f
    8e8d:	b0 01                	mov    $0x1,%al
    8e8f:	88 86 68 ff          	mov    %al,-0x98(%bp)
    8e93:	31 c0                	xor    %ax,%ax
    8e95:	a3 da 2f             	mov    %ax,0x2fda
    8e98:	31 c0                	xor    %ax,%ax
    8e9a:	89 86 7e ff          	mov    %ax,-0x82(%bp)
    8e9e:	80 be 68 ff 00       	cmpb   $0x0,-0x98(%bp)
    8ea3:	74 0a                	je     0x8eaf
    8ea5:	8b 86 7e ff          	mov    -0x82(%bp),%ax
    8ea9:	3b 06 ce 2f          	cmp    0x2fce,%ax
    8ead:	7c 1d                	jl     0x8ecc
    8eaf:	80 be 68 ff 00       	cmpb   $0x0,-0x98(%bp)
    8eb4:	74 03                	je     0x8eb9
    8eb6:	e9 cb 0b             	jmp    0x9a84
    8eb9:	8b 46 f6             	mov    -0xa(%bp),%ax
    8ebc:	3b 46 14             	cmp    0x14(%bp),%ax
    8ebf:	75 0b                	jne    0x8ecc
    8ec1:	8b 46 f4             	mov    -0xc(%bp),%ax
    8ec4:	3b 46 12             	cmp    0x12(%bp),%ax
    8ec7:	75 03                	jne    0x8ecc
    8ec9:	e9 b8 0b             	jmp    0x9a84
    8ecc:	80 be 69 ff 00       	cmpb   $0x0,-0x97(%bp)
    8ed1:	75 1d                	jne    0x8ef0
    8ed3:	8d be 78 ff          	lea    -0x88(%bp),%di
    8ed7:	16                   	push   %ss
    8ed8:	57                   	push   %di
    8ed9:	8d be 76 ff          	lea    -0x8a(%bp),%di
    8edd:	16                   	push   %ss
    8ede:	57                   	push   %di
    8edf:	8d be 74 ff          	lea    -0x8c(%bp),%di
    8ee3:	16                   	push   %ss
    8ee4:	57                   	push   %di
    8ee5:	8d be 72 ff          	lea    -0x8e(%bp),%di
    8ee9:	16                   	push   %ss
    8eea:	57                   	push   %di
    8eeb:	9a 36 00 bf 1d       	lcall  $0x1dbf,$0x36
    8ef0:	c6 86 69 ff 01       	movb   $0x1,-0x97(%bp)
    8ef5:	ff 86 7e ff          	incw   -0x82(%bp)
    8ef9:	ff 06 da 2f          	incw   0x2fda
    8efd:	a1 da 2f             	mov    0x2fda,%ax
    8f00:	3b 06 ce 2f          	cmp    0x2fce,%ax
    8f04:	7e 06                	jle    0x8f0c
    8f06:	c7 06 da 2f 01 00    	movw   $0x1,0x2fda
    8f0c:	a1 32 2e             	mov    0x2e32,%ax
    8f0f:	09 c0                	or     %ax,%ax
    8f11:	79 02                	jns    0x8f15
    8f13:	f7 d8                	neg    %ax
    8f15:	8b d0                	mov    %ax,%dx
    8f17:	8b 46 f6             	mov    -0xa(%bp),%ax
    8f1a:	2b 46 14             	sub    0x14(%bp),%ax
    8f1d:	09 c0                	or     %ax,%ax
    8f1f:	79 02                	jns    0x8f23
    8f21:	f7 d8                	neg    %ax
    8f23:	3b c2                	cmp    %dx,%ax
    8f25:	7e 0c                	jle    0x8f33
    8f27:	8b 46 f6             	mov    -0xa(%bp),%ax
    8f2a:	03 06 32 2e          	add    0x2e32,%ax
    8f2e:	89 46 f6             	mov    %ax,-0xa(%bp)
    8f31:	eb 06                	jmp    0x8f39
    8f33:	8b 46 14             	mov    0x14(%bp),%ax
    8f36:	89 46 f6             	mov    %ax,-0xa(%bp)
    8f39:	a1 34 2e             	mov    0x2e34,%ax
    8f3c:	09 c0                	or     %ax,%ax
    8f3e:	79 02                	jns    0x8f42
    8f40:	f7 d8                	neg    %ax
    8f42:	8b d0                	mov    %ax,%dx
    8f44:	8b 46 f4             	mov    -0xc(%bp),%ax
    8f47:	2b 46 12             	sub    0x12(%bp),%ax
    8f4a:	09 c0                	or     %ax,%ax
    8f4c:	79 02                	jns    0x8f50
    8f4e:	f7 d8                	neg    %ax
    8f50:	3b c2                	cmp    %dx,%ax
    8f52:	7e 0c                	jle    0x8f60
    8f54:	8b 46 f4             	mov    -0xc(%bp),%ax
    8f57:	03 06 34 2e          	add    0x2e34,%ax
    8f5b:	89 46 f4             	mov    %ax,-0xc(%bp)
    8f5e:	eb 06                	jmp    0x8f66
    8f60:	8b 46 12             	mov    0x12(%bp),%ax
    8f63:	89 46 f4             	mov    %ax,-0xc(%bp)
    8f66:	8b 46 f6             	mov    -0xa(%bp),%ax
    8f69:	3b 06 20 2e          	cmp    0x2e20,%ax
    8f6d:	7d 19                	jge    0x8f88
    8f6f:	a1 20 2e             	mov    0x2e20,%ax
    8f72:	2b 46 f6             	sub    -0xa(%bp),%ax
    8f75:	99                   	cwtd
    8f76:	b9 08 00             	mov    $0x8,%cx
    8f79:	f7 f9                	idiv   %cx
    8f7b:	92                   	xchg   %ax,%dx
    8f7c:	8b d0                	mov    %ax,%dx
    8f7e:	b8 08 00             	mov    $0x8,%ax
    8f81:	2b c2                	sub    %dx,%ax
    8f83:	89 46 d2             	mov    %ax,-0x2e(%bp)
    8f86:	eb 11                	jmp    0x8f99
    8f88:	8b 46 f6             	mov    -0xa(%bp),%ax
    8f8b:	2b 06 20 2e          	sub    0x2e20,%ax
    8f8f:	99                   	cwtd
    8f90:	b9 08 00             	mov    $0x8,%cx
    8f93:	f7 f9                	idiv   %cx
    8f95:	92                   	xchg   %ax,%dx
    8f96:	89 46 d2             	mov    %ax,-0x2e(%bp)
    8f99:	8b 46 f6             	mov    -0xa(%bp),%ax
    8f9c:	2b 46 d2             	sub    -0x2e(%bp),%ax
    8f9f:	89 46 f2             	mov    %ax,-0xe(%bp)
    8fa2:	8b 46 f4             	mov    -0xc(%bp),%ax
    8fa5:	89 46 f0             	mov    %ax,-0x10(%bp)
    8fa8:	8b 46 f2             	mov    -0xe(%bp),%ax
    8fab:	3b 06 20 2e          	cmp    0x2e20,%ax
    8faf:	7e 08                	jle    0x8fb9
    8fb1:	a1 20 2e             	mov    0x2e20,%ax
    8fb4:	89 46 de             	mov    %ax,-0x22(%bp)
    8fb7:	eb 06                	jmp    0x8fbf
    8fb9:	8b 46 f2             	mov    -0xe(%bp),%ax
    8fbc:	89 46 de             	mov    %ax,-0x22(%bp)
    8fbf:	8b 46 f0             	mov    -0x10(%bp),%ax
    8fc2:	3b 06 22 2e          	cmp    0x2e22,%ax
    8fc6:	7e 08                	jle    0x8fd0
    8fc8:	a1 22 2e             	mov    0x2e22,%ax
    8fcb:	89 46 dc             	mov    %ax,-0x24(%bp)
    8fce:	eb 06                	jmp    0x8fd6
    8fd0:	8b 46 f0             	mov    -0x10(%bp),%ax
    8fd3:	89 46 dc             	mov    %ax,-0x24(%bp)
    8fd6:	8b 46 18             	mov    0x18(%bp),%ax
    8fd9:	03 46 d2             	add    -0x2e(%bp),%ax
    8fdc:	89 46 ea             	mov    %ax,-0x16(%bp)
    8fdf:	8b 46 f2             	mov    -0xe(%bp),%ax
    8fe2:	03 46 ea             	add    -0x16(%bp),%ax
    8fe5:	48                   	dec    %ax
    8fe6:	89 46 ee             	mov    %ax,-0x12(%bp)
    8fe9:	8b 46 f0             	mov    -0x10(%bp),%ax
    8fec:	03 46 e8             	add    -0x18(%bp),%ax
    8fef:	48                   	dec    %ax
    8ff0:	89 46 ec             	mov    %ax,-0x14(%bp)
    8ff3:	8b 46 ee             	mov    -0x12(%bp),%ax
    8ff6:	3b 06 24 2e          	cmp    0x2e24,%ax
    8ffa:	7e 08                	jle    0x9004
    8ffc:	8b 46 ee             	mov    -0x12(%bp),%ax
    8fff:	89                   	.byte 0x89
