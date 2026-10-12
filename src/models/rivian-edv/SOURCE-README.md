# Amazon Rivian EDV-700 · Fleet sensor explorer

Open **Amazon-Rivian-EDV.html** by double-clicking it in a current Edge, Chrome, Firefox or Safari browser with WebGL 2 enabled. It is self-contained: Three.js, controls, geometry, materials and livery are embedded. No installation, internet connection or local server is needed to use the viewer. External source links need internet access.

## Explore

- Drag to orbit; scroll or pinch to zoom; right-drag to pan.
- Select a marker or an entry in the searchable sensor index.
- Use **Focus on sensor** to approach the selected component.
- Choose Front, Left, Right, Rear, Top or Cabin views.
- **Transparent body** reveals cabin equipment and concealed radar.
- **Separate sensors** moves hardware out from its approximate mounts, with dashed connectors.
- **Sensing sketch** draws illustrative direction, not calibrated coverage or range.
- **Fleet additions** enables optional Fleet Edge and VAPR system examples.
- **Export model** saves an assembled GLB with annotated sensor nodes. Optional examples are included only when enabled; filters, transparency and separation do not distort the export.
- **Save image** downloads the current 3D view as a PNG, without interface labels.
- Keyboard: focus the 3D viewport and use arrow keys to orbit, +/− to zoom. R resets the viewer; Escape stops rotation or a camera transition. The sensor index and view buttons are keyboard accessible.

## Included files

- `Amazon-Rivian-EDV.html`: standalone, offline viewer.
- `Amazon-Rivian-EDV-700.glb`: assembled model with the 34 default annotated entries, usable in Blender and compatible 3D tools.
- `sensor-inventory.json`: complete inventory, approximate coordinates, evidence notes and source links; includes the two optional fleet examples.
- `src/`: readable Three.js source, HTML and styles.
- `build.mjs`, `package.json`: repeatable bundle build.
- `THIRD-PARTY-LICENSES.txt`: Three.js license.

## Inventory and limits

This is an original educational reconstruction of the U.S. EDV-700 in Amazon livery, based on the supplied references and additional manufacturer documentation. It is **not production CAD, a calibrated sensor map, or a complete vehicle parts inventory**. Overall dimensions and visible shapes are approximate; detailed housing dimensions are authored.

The default view contains 34 entries:

| Category | Representation |
|---|---|
| Exterior cameras | 11 positions: forward assistance, long-range, stereo pair, front surround, upper side pair, mirror pair, rear bracket pair |
| Cabin camera | 1 driver-monitoring camera; type documented, mount illustrative |
| Radar | 5 locations: front center and four corners; normally concealed modules |
| Ultrasonic | 16 positions: four front, four rear, four on each side |
| Localization | 1 representative GNSS/GPS antenna; physical mount and count not verified |

The 2023 Rivian EDV component diagram anchors the exterior layout. Its front stereo pair, two side-mounted surround cameras, mirror cameras and rear bracket are represented separately. Rear lens-to-display assignments are deliberately left unverified. The document also mentions a driver-monitoring camera without locating it. Rivian's 2022 Impact Report documents GPS in its fleet safety architecture.

Two **optional system examples** are available: Fleet Edge (street-view camera, GPS and computer represented together) and VAPR (representative cargo camera/projector assembly). These are not universal EDV fitment claims or exact camera counts. They are excluded from the supplied base GLB; enable them and export from the HTML to include them.

Scope covers perception, parking, driver observation and localization. Internal battery, thermal, chassis, airbag and tire-pressure sensors are not modeled. This is a driver-operated fleet van, not a robotaxi. No lidar equipment is added to the reference fleet layout.

All IDs are local model identifiers, not service part numbers. Units are metres: +X front, +Y up, +Z vehicle left. Positions, directions, lens spacing and sensing diagrams are approximate and must not be used for calibration, maintenance or measured safety analysis. Equipment varies by year, configuration and fleet upgrades.

## Sources

- [Wikipedia: Rivian EDV](https://en.wikipedia.org/wiki/Rivian_EDV) — user-supplied vehicle background and overall proportions.
- [Amazon: everything to know about its Rivian delivery vans](https://www.aboutamazon.com/news/transportation/everything-you-need-to-know-about-amazons-electric-delivery-vans-from-rivian) — user-supplied appearance and fleet context.
- [Rivian: Driver+ Calibration Requirements and Best Practices, EDV](https://rts.i-car.com/images/pdf/oem-info/rivian/position-statements/71350.pdf) — Rivian-authored RCI-86-22-002-1, February 3, 2023, pages 2–4; EDV-specific component map, hosted by I-CAR.
- [Rivian: Amazon deliveries, powered by Rivian](https://rivian.com/stories/amazon-electric-delivery-vehicle) — exterior imagery and driver-assistance context.
- [Rivian: 2022 Impact Report](https://downloads.rivian.com/2md5qhoeajym/1B94cwRuIpsdG3zQuiUREG/8c925a8ea8f19bc34ce14af57659ccee/Rivian_2022_Impact_Report.pdf) — fleet sensor architecture and GPS.
- [AWS: One Amazon Lane](https://aws.amazon.com/solutions/amazon/one-amazon-lane/road-delivery/) — Fleet Edge system overview.
- [Amazon: Vision-Assisted Package Retrieval](https://www.aboutamazon.com/news/transportation/amazon-vapr-delivery-van-packages) — fleet-dependent VAPR camera/projector system.

Research checked September 21, 2026. Source photos and PDFs were inspected for reference but are not embedded or redistributed with this deliverable. Livery textures and all model geometry were authored for this reconstruction. Names and branding identify the subject; this viewer is independent and unaffiliated.

## Edit and rebuild

With Node.js installed:

```sh
npm install
npm run build
```

This writes the standalone HTML. Optionally use `npm start` to preview at `http://127.0.0.1:4180`.

`src/model.js` builds the vehicle, `src/sensors.js` owns the inventory and evidence, and `src/app.js` implements the viewer. The browser exposes `window.EDVExplorer` for model inspection and integration; `exportGLB()` returns an assembled GLB ArrayBuffer. Geometry and UI run locally and send no telemetry.

## Verification

The supplied build is checked in headless Microsoft Edge using direct `file://` loading with HTTP(S) requests blocked. Checks cover inventory counts, search, filters, optional equipment, transparency, focus, separation, view presets, reset, mouse and keyboard controls, label visibility, PNG download and embedded-texture GLB export. Desktop and 390 px mobile captures are inspected. A graphics-disabled browser retains a text sensor guide. Validation artifacts remain in `.validation/` and `.impeccable/review/` in the working folder.
