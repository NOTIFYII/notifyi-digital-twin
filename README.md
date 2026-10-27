# Notifyi Digital Twin

An interactive 3D digital twin of **Notifyi**, a six-joint desk robot built from four ROBOTIS DYNAMIXEL 2XL430-W250-T modules, with a display face and a hidden webcam. It runs in the browser with three.js; no server is needed.

**What you can do:** turn the model all the way round (up and down too), move it on the screen (right-drag, Shift-drag, two fingers, the arrow keys or the 이동 buttons), zoom toward the pointer, hide the panels (H); move each joint, jump to poses from the CAD, play the authored motions (posture cues, greetings, character motions), watch the live face (the eyes follow the pointer; click the head to poke it, double-click to wink), and switch between the newest build **mech_M10_PLA** (default), mech_M9_PLA, the RC3 build, the character skins (Sprout B/C, Tech, Hop, Dial) and two bookworm builds (worm_C4, worm_B7).

**mech_M10_PLA (2026-10-27):** mech_M9_PLA re-checked part by part so that nothing breaks when supports come off a PLA print. 30 of the 31 printed pieces now need no slicer support (45-degree gussets and corbels, upright vent slots, new print orientations); three parts carry print aids that come off without loading them (snap-off webs with a weak neck, a loose ring, 0.3 mm membranes); only the camera cradle keeps supports, and every feature they touch was checked against the pull that removes them. The review also fixed M9 errors (0.15 mm walls round two screw pockets, an insert breaking out of its ledge, two parts listed upside down, a short antenna-rod file, two wrong screw lengths).

**mech_M9_PLA (2026-10-26):** the OpenCR and the Raspberry Pi are stacked under the base servo, so the base shrinks from 137 x 152.5 mm to 120 x 103 mm (it grows from 47.5 to 93.5 mm tall). A 3S 1500 mAh LiPo (XT60) slides out of a door in the left wall; the OpenCR's own DC jack and power switch reach the same wall for a 12 V adapter. Every part is printed one by one in white PLA on a Cubicon Single Plus (240 x 190 x 200 mm bed) and painted in RC3's colours (cream, dark grey, olive, black; the face ring and light band stay white).

**Tabs:** `3D 모델` (the viewer), `출력 도면` (print.html: every M10 part as its own white-PLA print with its paint colour, turned to its print orientation on the Cubicon bed, with settings, slicer estimates, whether it needs support, its print aids and how to take them off, the removal / load / screw checks, and STL downloads), `연구 · 논문` (research.html: the P1 thesis, hypotheses, design, stimuli, computational checks, power simulation, the P2-P4 abstracts and their self-review - drafts, no human data) and `기준 부품 · 전원 안내` (the display, camera and controllers the model is built around, and the battery / power notes).

**Status:** a CAD model, not a built robot. Nothing has been printed, assembled, wired or powered; the checks are computed on nominal CAD geometry and hand calculations with assumed PLA strengths. Saving and exporting from the local tool are switched off in this copy.

**Contents:** `index.html` and `src/` (the viewer), `motions/` (authored motions), `assets/<revision>/` (joint configuration and the CAD assembly as base64 JSON chunks of a slimmed glTF), `assets/mech_M10_PLA/print/` (oriented STL per part with its print aids, a zip of all of them, the print table, the physics checks). three.js 0.186.1 loads from jsDelivr.

**Third-party geometry:** the actuator meshes are tessellated from the 2XL430 STEP model published by ROBOTIS, and the OpenCR board from ROBOTIS' OpenCR STEP; they remain ROBOTIS's designs.

Generated from the Notifyi project with `scripts/build_static_viewer.py` (2026-10-27).
