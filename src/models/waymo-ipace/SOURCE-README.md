# Waymo Jaguar I-PACE — sensor explorer

Open **Waymo-IPACE.html** by double-clicking it. All JavaScript, Three.js, geometry and generated textures are embedded. No server, install or internet connection is needed to view it. Use a current browser with WebGL 2 and hardware acceleration.

## Explore

- Drag to orbit, scroll or pinch to zoom, and right-drag to pan.
- Click sensor markers, physical sensor meshes, or a row in the searchable index.
- Filter lidar, cameras, radar, audio or supporting systems.
- Use Front, Side, Rear and Top views, or focus on a selected sensor.
- Separate sensors to expose their original mounting points. See through body reveals internal examples.
- Coverage sketch illustrates the selected sensor's sensing principle. It is not a calibrated field of view or range.
- Auto-rotate is optional. R resets the explorer; Escape stops automatic motion.
- Export 3D model downloads an assembled GLB with all hardware, named nodes and sensor metadata, independent of display settings.

**Waymo-Jaguar-IPACE.glb** is also included ready to import into Blender or another Three.js project. **sensor-inventory.json** contains the matching annotated inventory. Units are metres; +X is forward, +Y up, +Z vehicle left.

## Accuracy and scope

This is an original procedural educational reconstruction, not production CAD or a calibrated sensor rig. The car and sensor housings are approximated from public references. The user-supplied example guided its white body, dark glazing, wheel detail and rooftop sensor presentation.

The viewer contains 47 selectable entries: 29 individually identified schematic camera lenses, five lidars, six radar units, four illustrative audio receivers and three contextual supporting components. **The 29-camera total is published by Waymo, but the allocation of those lenses among assemblies, individual IDs, exact positions, orientations and dimensions are illustrative.** The five lidar assembly locations follow the official fifth-generation diagram. Radar housing shapes and mounting transforms are approximate. Four audio markers are not a claim about microphone count. GNSS, inertial sensing and compute are conceptual supporting components with unverified physical placement.

This does not claim to document every OEM sensor or cabin camera. The public references do not supply a complete camera-by-camera mounting map. The data explicitly records approximate placement rather than presenting guessed calibration as fact. Hidden rear hardware remains accessible through the index and view presets; overlapping markers are suppressed for legibility.

## References

- [User's visual reference: 3D Prompt — Waymo Jaguar I-PACE](https://3d-prompt.com/prompts/gpt-6-astra-2101325346427842909). Visual reference only; no code or asset was copied.
- [Waymo — Introducing the fifth-generation Driver](https://waymo.com/blog/2020/03/introducing-5th-generation-waymo-driver/). Primary sensor assembly layout and sensing categories.
- [Waymo — Driver overview](https://waymo.com/waymo-driver/). I-PACE camera total and compute overview.
- [Waymo — AI & ML](https://waymo.com/blog/2024/10/ai-and-ml-at-waymo/). External audio is part of the sensor suite.
- [Waymo — I-PACE first-responder references](https://waymo.com/firstresponders/).

## Edit or rebuild

The editable model is in `src/model.js`; interaction code is in `src/app.js`; the HTML and styles are in `src/template.html` and `src/style.css`.

```sh
npm install
npm run build
```

The build embeds Three.js 0.180.0 and its addons into `Waymo-IPACE.html`. Optional preview: `npm start`, then open http://127.0.0.1:4178. The served version and double-clickable HTML are the same artifact. Dependency versions are pinned; a pnpm lockfile is included.

Three.js is MIT licensed; see `THIRD-PARTY-LICENSES.txt`. Waymo and Jaguar names identify the subject. This is an independent visualization with no affiliation.

## Verification

Verified in a Chromium-based browser at desktop and 390-pixel mobile width. All 47 index entries selected the matching detail. Camera filtering and individual camera search, separation, transparency, preset views, and browser GLB export were exercised. The GLB was checked for finite geometry, its embedded textures, and all 47 sensor metadata nodes. Exact mounting geometry is intentionally not an engineering claim.
