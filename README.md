# Notifyi Digital Twin

An interactive 3D digital twin of **Notifyi**, a six-joint desk robot built from four ROBOTIS DYNAMIXEL 2XL430-W250-T modules, with a display face and a hidden webcam. It runs in the browser with three.js; no server is needed.

**What you can do:** orbit the model, move each joint, jump to poses from the CAD, play the authored motions (posture cues, greetings, character motions), watch the live face (the eyes follow the pointer; click the head to poke it, double-click to wink), and switch between the RC3 build and the character skins (Sprout B/C, Tech, Hop, Dial) and two bookworm builds (worm_C4, worm_B7).

**Tabs:** `3D 모델` (the viewer), `출력 도면` (print.html: RC3's six connected print files A-F in 3D with cut tabs, part lists, slicer estimates, cut maps and STL downloads), and `기준 부품 · 전원 안내` (the display, camera and controllers the model is built around, and the note that the base's print parts depend on the battery / power decision).

**Status:** a CAD model, not a built robot. The RC3 release's own record lists physical fit, full motion and electrics as unverified. Saving and exporting from the local tool are switched off in this copy.

**Contents:** `index.html` and `src/` (the viewer), `motions/` (authored motions), `assets/<revision>/` (joint configuration and the CAD assembly as base64 JSON chunks of a slimmed glTF). three.js 0.186.1 loads from jsDelivr.

**Third-party geometry:** the actuator meshes are tessellated from the 2XL430 STEP model published by ROBOTIS; they remain ROBOTIS's design.

Generated from the Notifyi project with `scripts/build_static_viewer.py` (2026-10-21).
