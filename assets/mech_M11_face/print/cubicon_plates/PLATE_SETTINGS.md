# Cubicon Single Plus plates - settings for Cubicreator4

Pack: `03_Print/mech_M11_face_20261030`. Cubicreator4 is installed at `10_Tools/Cubicreator4/Cubicreator4.exe` (official installer 4.5.4, 2026-10-29).

1. Start Cubicreator4, device (장비) **3DP-310F - Cubicon Single+**, filament (필라멘트) **PLA**.
2. Open the plate's STL (or 3MF - same layout, parts as separate objects).
3. Set the values below. The expert settings are what the parts were checked with; the basic menu only has layer 0.15 / 0.2 and infill 20 / 40 % and no wall count.
4. Slice, check the layer preview, then **GCode 파일저장** -> save as `hfb/<revision>_<plate>.hfb` (e.g. M13_P1_base_shell.hfb) in the pack (English file name: the printer lists English names only).
5. Copy to a FAT32 USB stick, select it on the printer.

| Plate | Pieces | 레이어 높이 | 벽 라인 갯수 | 내부 채우기 밀도 | 지지대 생성 | 바닥보조물 | Basic menu instead | Est. (PrusaSlicer) |
|---|---|---|---|---|---|---|---|---|
| P1_base_shell | 1 | 0.2 | 6 | 15 % | 끔 | 스커트 | 0.2 mm, 20 % (Medium), support OFF, none (skirt) | 9.3 h, 117.0 g |
| P2_base_floor | 1 | 0.2 | 4 | 30 % | 끔 | 스커트 | 0.2 mm, 40 % (High), support OFF, none (skirt) | 5.5 h, 62.1 g |
| P3_servo_deck | 1 | 0.2 | 5 | 40 % | 끔 | 스커트 | 0.2 mm, 40 % (High), support OFF, none (skirt) | 3.8 h, 44.6 g |
| P4_head_face | 1 | 0.2 | 4 | 20 % | 끔 | 스커트 | 0.2 mm, 20 % (Medium), support OFF, none (skirt) | 2.2 h, 27.7 g |
| P5_camera_cradle | 1 | 0.2 | 5 | 60 % | 켬 | 브림 | 0.2 mm, 40 % (High), support ON, angle 40-50, offset Normal, 10 lines (Narrowly) | 2.8 h, 28.5 g |
| P6_yokes | 3 | 0.2 | 5 | 60 % | 끔 | 브림 | 0.2 mm, 40 % (High), support OFF, 10 lines (Narrowly) | 3.4 h, 33.1 g |
| P7_sled_strap | 2 | 0.2 | 4 | 40 % | 끔 | 브림 | 0.2 mm, 40 % (High), support OFF, 10 lines (Narrowly) | 2.0 h, 21.7 g |
| P8_flat_parts | 7 | 0.2 | 4 | 100 % | 끔 | 스커트 | 0.2 mm, 40 % (High), support OFF, none (skirt) | 1.7 h, 20.6 g |
| P9_small_parts | 13 | 0.12 | 4 | 100 % | 끔 | 브림 | 0.15 mm, 40 % (High), support OFF, 10 lines (Narrowly) | 1.8 h, 12.8 g |

P5 (camera cradle) is the only plate with supports: support angle 45 deg, 0.2 mm gap, no support inside the four hub holes (see the print tab). P9 mixes 0.12 mm parts; 0.12-0.15 mm is fine for all of them. Estimates are PrusaSlicer analysis summed per part - Cubicreator's own time and weight are closer to the real print.
