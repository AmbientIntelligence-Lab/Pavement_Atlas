# PaveData Atlas 1.2

Open **index.html** for the complete Atlas. Open **av-model-simulation.html** for the separate, combined vehicle and sensor explorer. Keep this folder together when sharing or hosting it. The original Atlas and four model projects are unchanged.

## Changes, step by step

1. Moved “Feel the road. Drive it.” before the register, gallery and readiness screening.
2. Moved the complete global filter panel into the page, immediately before “Readiness screening, on your own weights.” The floating Filters shortcut and navigation link scroll to this panel. Filters still update all dataset views together.
3. Combined Waymo I-PACE, Cybercab, Aurora truck and Rivian EDV into one sensor explorer with a shared layout and controls, embedded in the Atlas and available as a separate HTML page.
4. Replaced Sedan / SUV / Truck / Bus with those same four source geometries in the driving simulation. Vehicle selections synchronize between the embedded explorer and road scene. Added touch steering and speed buttons.
5. Reordered both navigation and content.

## Content order

World Map → Data modalities → Annotation types → Acquisition platforms → Camera viewpoint → Supported AI tasks → Distress types → AV model and sensor interactions → Driving and simulation distress on the road → The register → Sample gallery → Global filters → Multi-criteria screening → Community submissions.

The request names 13 content modules because the number 5 is repeated. All 13 are included, plus global filters immediately before screening.

## Shared sensor explorer

- Switch models, drag to orbit, scroll or pinch to zoom.
- Select a marker or any searchable sensor-index entry. All sensors remain accessible in the index when markers overlap.
- Filter by sensor family, focus on a sensor, advance to the next entry, change views, reveal the body, separate sensors and view illustrative sensing directions.
- Cybercab: open doors. Aurora: add the trailer. Rivian: enable two optional fleet-system examples.
- Export the assembled selected model as GLB. Transparency and separation do not alter the export; optional equipment follows its checkbox.
- Keyboard: focus the 3D stage; arrows orbit, plus/minus zoom, R resets, Escape stops rotation. Controls and sensor-index entries are keyboard accessible.

There are 47 Waymo, 14 Cybercab, 22 Aurora and 34 base Rivian annotations (117 total), plus two optional Rivian examples. These are model annotations, not verified manufacturer hardware totals. Original evidence and limitations are in src/models/*/SOURCE-README.md and each inspector entry. Rivian EDV is a driver-operated delivery van with assistance systems. Driving dynamics and sensing sketches are educational, uncalibrated demonstrations.

## Files

- index.html: Atlas, preserved 177-record inventory, charts, register, gallery, screening and driving simulation.
- av-model-simulation.html: self-contained combined model/sensor viewer; no build or internet needed.
- assets/fleet-runtime.js: bundled Three.js r180 and shared fleet geometry for driving.
- src/fleet.js: adapter for all four supplied models.
- src/models/: copied original model and sensor sources, with source notes.
- src/av-app.js, src/av-style.css, src/av-template.html: editable combined viewer.
- src/atlas-v12.css, src/atlas-integration.js: Atlas additions and model synchronization.
- data/, assets/samples/, assets/gallery/, assets/distress/: preserved workbook and imagery.
- CREDITS.md, licenses/: attribution and Three.js license.
- verification/: verification notes and screenshots.

## Run or edit

The delivered pages need no installation. WebGL 2 / hardware acceleration is needed for 3D. The sensor explorer retains its text inventory when WebGL is unavailable. External source links need internet access.

Optional Node.js preview: run `npm start`, then open http://127.0.0.1:4184.

To rebuild the fleet bundle and standalone viewer, run `npm install`, `npm run build`, then `npm run check`. Dependency versions are pinned in package.json. On the original computer, build.mjs can also reuse matching dependencies from the neighboring waymo-ipace project. No neighboring folder is needed to use the delivered pages, or after npm install.

upgrade-from-v11.mjs documents the one-time index migration. It requires the neighboring original Atlas and overwrites the v1.2 index; it is deliberately not part of the normal build.

To publish on GitHub Pages or another static host, upload this folder's contents together. Runtime assets use relative paths; no API key or service is required. Community submissions retain the original email/download workflow.
