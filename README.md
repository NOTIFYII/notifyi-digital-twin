# Notifyi Digital Twin

An interactive 3D digital twin of **Notifyi**, a six-joint desk robot built from four ROBOTIS DYNAMIXEL 2XL430-W250-T modules, with a display face and a hidden webcam. It runs in the browser with three.js; no server is needed.

**What you can do:** orbit the model, move each joint, jump to poses from the CAD, play the authored motions (posture cues, greetings, character motions), watch the live face (the eyes follow the pointer; click the head to poke it, double-click to wink), and switch between the newest build **mech_M9_PLA** (default), the RC3 build, the character skins (Sprout B/C, Tech, Hop, Dial) and two bookworm builds (worm_C4, worm_B7).

**mech_M9_PLA (2026-10-26):** the OpenCR and the Raspberry Pi are stacked under the base servo, so the base shrinks from 137 x 152.5 mm to 120 x 103 mm (it grows from 47.5 to 93.5 mm tall). A 1500 mAh LiPo (3S recommended; 4S only with a 12 V step-down) slides out of a door in the left wall; the OpenCR's own DC jack and power switch reach the same wall for a 12 V adapter. Every part is PLA, printed one by one on a Cubicon Single Plus (240 x 190 x 200 mm bed).

**Tabs:** `3D 모델` (the viewer), `출력 도면` (print.html: every M9 part as its own PLA print, turned to its print orientation on the Cubicon bed, with settings, slicer estimates, what changed for PLA and STL downloads), `연구 · 논문` (research.html: the P1 thesis, hypotheses, design, stimuli, computational checks, power simulation, the P2-P4 abstracts and their self-review - drafts, no human data) and `기준 부품 · 전원 안내` (the display, camera and controllers the model is built around, and the battery / power notes).

**Status:** a CAD model, not a built robot. Nothing has been printed, assembled, wired or powered; the checks are computed on nominal CAD geometry. Saving and exporting from the local tool are switched off in this copy.

**Contents:** `index.html` and `src/` (the viewer), `motions/` (authored motions), `assets/<revision>/` (joint configuration and the CAD assembly as base64 JSON chunks of a slimmed glTF), `assets/mech_M9_PLA/print/` (oriented STL per part, a zip of all of them, the print table). three.js 0.186.1 loads from jsDelivr.

**Third-party geometry:** the actuator meshes are tessellated from the 2XL430 STEP model published by ROBOTIS, and the OpenCR board from ROBOTIS' OpenCR STEP; they remain ROBOTIS's designs.

Generated from the Notifyi project with `scripts/build_static_viewer.py` (2026-10-26).
