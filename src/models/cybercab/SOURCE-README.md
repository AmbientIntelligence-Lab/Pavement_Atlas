# Cybercab sensor explorer

Double-click **Cybercab-Sensor-Explorer.html** to open the viewer in Chrome, Edge, or Firefox. The complete viewer, Three.js, model geometry, and font are embedded. No installation, web server, or internet connection is needed. A browser with WebGL hardware acceleration is required for the 3D view.

## Explore

- Drag to orbit; scroll or pinch to zoom.
- Select a model label or a component in the side panel to focus its location and read the description.
- Use All / Cameras / Audio / Sensing to filter the map.
- Use the preset buttons for front, rear, left, right, and top views.
- Reveal cabin makes the exterior transparent. Cabin component selections enable it automatically.
- View direction draws an illustrative volume for the selected camera, acoustic rings for microphones, or a door sensing area. These are not calibrated coverage or detection-range simulations.
- Open doors demonstrates approximate butterfly-door motion.
- Export model saves a GLB with the original closed-door model, named components, and evidence/source metadata. A ready-made **Cybercab-Study-Model.glb** is also provided.
- With the 3D viewport focused: arrow keys rotate, + / - zoom, R resets. Buttons support keyboard navigation. Reduced-motion preferences are respected.

## Evidence and limitations

The supplied **Cybercab-Rider-Guide.pdf** (September 4, 2026) provides the visual reference: cover; exterior and cabin on PDF page 5; door geometry on pages 7–8; trunk on page 9; dimensions on page 15. The model is an original procedural interpretation, not a traced mesh or manufacturer CAD.

Tesla's [First Responder Interaction Plan, version 1.2](https://digitalassets.tesla.com/tesla-contents/image/upload/cybercab-first-responder-interaction-plan.pdf) supplements the hardware annotations: fender cameras (printed p. 3), B-pillar microphones (p. 8), and the B-pillar camera (p. 23). The [online Rider Guide](https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/) documents the cabin camera, microphone function, and door obstruction detection.

**14 annotations are not a verified sensor total.** This viewer represents 8 exterior camera lenses, 1 cabin camera, 3 microphone annotations, and 2 door sensing areas. The windshield pair, front fascia camera, and rear camera placements/count are illustrative. The cabin microphone's position is illustrative. Door annotations identify a documented function, not a specific sensor technology or mounting point. Even documented regions use estimated 3D coordinates.

Reference width 1.754 m and height 1.408 m guide the proportions. The roughly 4.4 m body length, 2.7 m wheelbase, curvature, cabin, materials, and door mechanism are estimates. Sensors are enlarged for visibility. The model does not assert locations for radar, LiDAR, ultrasound, GNSS, IMU, wheel-speed, seat-load, or other undisclosed hardware. A complete engineering sensor inventory cannot be established from the reviewed material.

## Editable source

`src/model.js` builds the geometry, `src/sensors.js` contains the annotation data, `src/app.js` controls interaction, and `src/style.css` defines the layout.

To rebuild on another computer with Node.js:

```sh
npm install
npm run build
```

This writes `Cybercab-Sensor-Explorer.html` and the identical `index.html`. The build can also use the already-installed dependencies in the neighboring `waymo-ipace` workspace on the original computer. To preview via localhost instead of opening the file, use `npm start` and visit `http://127.0.0.1:8768`.

Three.js 0.180.0 is MIT licensed; Manrope is licensed under the SIL Open Font License. License files are included under `licenses/`. The Tesla documents are reference material and retain their original copyrights. This is an independent educational model, not an official Tesla product.

## Verification

Verified in Edge with networking disabled: model render, every component selection, category filtering, automatic cabin reveal, schematic overlays, door motion, source notes, GLB export with all 14 annotation nodes, and desktop/mobile layout. The HTML initiates no external requests. Verification evidence is in `.impeccable/review/`.
