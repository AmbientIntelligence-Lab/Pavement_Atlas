# Aurora Truck Sensor Explorer

Open **Aurora-Truck.html** in Chrome, Edge, Firefox, or Safari. The HTML includes Three.js, the model, controls, styles, and procedural textures. No installation, internet connection, or server is needed for the viewer. WebGL 2 must be available. `index.html` is an identical copy.

## Explore

- Drag to orbit; scroll or pinch to zoom; right-drag to pan.
- Click a sensor marker, physical sensor, or hardware-index row for its description, role, location, uncertainty, and source.
- Filter lidar, cameras, radar, or supporting hardware; search by name, location, or model ID.
- **Focus on hardware** zooms in. **Next item** advances through the filtered index.
- **Trailer** shows the full combination. **See through** reveals hidden components.
- **Separate sensors** offsets components with lines back to their modeled mounts.
- **Sensing sketch** illustrates direction only. It is not calibrated and does not account for occlusion.
- **Export model** downloads a GLB with named sensor nodes and source metadata. It restores assembled positions and opaque body materials even when the current viewer is separated or transparent. Trailer inclusion follows its checkbox.
- Press **R** to reset, **Escape** to stop rotation. With the 3D viewport focused, use arrow keys to orbit and +/- to zoom. All hardware is also reachable through keyboard-accessible index buttons.

## What the model represents

This is original procedural geometry inspired by the public Aurora-powered Peterbilt 579 photograph, not Aurora/Peterbilt production CAD. It includes the cab, sleeper fairing, central and side pods, grille, mirrors, detailed wheels, tandem axles, chassis, fifth wheel, and optional freight trailer.

The 22 markers represent **3 lidar elements, 10 camera lenses, 6 radar elements, 2 cleaning outlets, and onboard compute**. These are an educational inventory of this model, **not a verified factory sensor count or full installation map**. Only sensor families and explicitly cited capabilities are source-backed. Individual apertures, allocations, counts, transforms, and sensing sketches are approximate or illustrative, as disclosed in each inspector entry. Aurora's FAQ states more than two dozen sensing devices; the supplied references do not identify each one. Therefore the viewer cannot label every actual production device with certainty.

The January 2026 architecture article describes FirstLight beyond 450 m and the 1,000 m capability of the next generation. The current Aurora homepage describes Driver 2 at 1,000 m. This earlier Peterbilt-style model is not a claim to reproduce Driver 2's physical installation.

## Sources

- [Aurora homepage: truck imagery and pod overview](https://aurora.tech/)
- [Perception architecture, January 23, 2026](https://aurora.tech/newsroom/seeing-with-superhuman-clarity-the-physics-and-architecture-behind-the)
- [Sensor suite FAQ, February 27, 2025](https://aurora.tech/newsroom/have-questions-about-aurora-and-avs-get-your-answers-here)
- [Sensor cleaning, May 21, 2023](https://aurora.tech/newsroom/capability-spotlight-stormy-weather)

Source links need an internet connection. No source-site images or external fonts are fetched by the viewer. Independent visualization; no affiliation implied.

## Files and rebuilding

- `Aurora-Truck.html`: portable viewer (about 0.6 MB).
- `Aurora-Peterbilt-Truck.glb`: exported assembled tractor with all 22 model markers.
- `src/model.js`: editable truck geometry.
- `src/sensors.js`: sensor descriptions, transforms, uncertainty and references.
- `src/app.js`: scene, interactions, labels, export.
- `src/template.html`, `src/style.css`: interface.
- `sensor-inventory.json`: readable model inventory.

With Node.js installed, run `npm install`, then `npm run build`. Use `npm start` for an optional local preview at http://127.0.0.1:4182. During creation this workspace reused the existing matching Three.js and esbuild dependencies through a local node_modules junction; it is not part of the portable HTML and is unnecessary for opening it. A fresh source checkout should run `npm install`.

## Verification

Tested the bundled page in a local browser preview, including all 22 index selections, the camera filter, search with no matches, sensor separation, sensing sketch, ghost mode, trailer, and GLB export. Desktop and mobile layouts were visually reviewed. The exported GLB was parsed to verify its header, all sensor metadata, and restored assembled transforms. Direct file:// navigation was blocked by the testing browser's URL policy; offline readiness was checked structurally (all runtime code embedded, no runtime asset requests).

Three.js is MIT licensed; its bundled license notice is retained in the HTML. The reconstruction's geometry is authored here.
