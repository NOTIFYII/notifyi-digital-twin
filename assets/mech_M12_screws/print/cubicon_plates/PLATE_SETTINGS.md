# Cubicon Single Plus plates - settings for Cubicreator4

Pack: `03_Print/mech_M12_screws_20261029`. Device in Cubicreator4: **3DP-310F (Cubicon Single+)**, material **PLA**. Open each plate's STL (or 3MF), set the basic menu as below, slice, then *Save G-code* -> save as `hfb/M12_<plate>.hfb` (English name).

| Plate | Pieces | Layer | Infill | Speed | Support | Brim | Walls wanted | Est. (PrusaSlicer) |
|---|---|---|---|---|---|---|---|---|
| P1_base_shell | 1 | 0.2 | 20 % (Medium) | 60 (High quality) | OFF | none (skirt) | 6 (wanted infill 15 %) | 9.5 h, 117.2 g |
| P2_base_floor | 1 | 0.2 | 40 % (High) | 60 (High quality) | OFF | none (skirt) | 4 (wanted infill 30 %) | 5.5 h, 61.9 g |
| P3_servo_deck | 1 | 0.2 | 40 % (High) | 60 (High quality) | OFF | none (skirt) | 5 (wanted infill 40 %) | 3.8 h, 44.6 g |
| P4_head_face | 1 | 0.2 | 20 % (Medium) | 60 (High quality) | OFF | none (skirt) | 4 (wanted infill 20 %) | 2.5 h, 31.6 g |
| P5_camera_cradle | 1 | 0.2 | 40 % (High) | 60 (High quality) | ON, angle 40-50, offset Normal | 10 lines (Narrowly) | 5 (wanted infill 60 %) | 3.1 h, 29.8 g |
| P6_yokes | 3 | 0.2 | 40 % (High) | 60 (High quality) | OFF | 10 lines (Narrowly) | 5 (wanted infill 60 %) | 4.0 h, 39.3 g |
| P7_sled_strap | 2 | 0.2 | 40 % (High) | 60 (High quality) | OFF | 10 lines (Narrowly) | 4 (wanted infill 40 %) | 2.0 h, 21.6 g |
| P8_flat_parts | 5 | 0.2 | 40 % (High) | 60 (High quality) | OFF | none (skirt) | 4 (wanted infill 100 %) | 1.4 h, 15.1 g |
| P9_small_parts | 15 | 0.15 | 40 % (High) | 60 (High quality) | OFF | 10 lines (Narrowly) | 4 (wanted infill 100 %) | 3.2 h, 21.5 g |

Walls / infill above 40 % are what the parts were checked with; the basic menu has no wall count and stops at 40 % - if Cubicreator's detailed settings offer them, use the wanted values for P6 (yokes) and P5 (cradle).
