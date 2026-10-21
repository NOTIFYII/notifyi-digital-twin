# Notifyi Digital Twin

An interactive 3D digital twin of **Notifyi**, a six-joint desk robot built from four ROBOTIS DYNAMIXEL 2XL430-W250-T modules, with a display face and a hidden webcam. It runs in the browser with three.js; no server is needed.

**What you can do:** orbit the model, move each joint, jump to poses from the CAD, play the authored motions (posture cues, greetings, character motions), watch the live face (the eyes follow the pointer; click the head to poke it, double-click to wink), and switch between the RC3 build and the character skins (Sprout B/C, Tech, Hop, Dial).

**Status:** a CAD model, not a built robot. The RC3 release's own record lists physical fit, full motion and electrics as unverified. Saving and exporting from the local tool are switched off in this copy.

**Contents:** `index.html` and `src/` (the viewer), `motions/` (authored motions), `assets/<revision>/` (joint configuration and the CAD assembly as base64 JSON chunks of a slimmed glTF). three.js 0.186.1 loads from jsDelivr.

**Third-party geometry:** the actuator meshes are tessellated from the 2XL430 STEP model published by ROBOTIS; they remain ROBOTIS's design.

Generated from the Notifyi project with `scripts/build_static_viewer.py` (2026-10-21).
