# PaveData Atlas 1.3 simulation notes

The sensor explorer and driving scene are educational, browser-based Three.js / WebGL 2 visualizations. They use local procedural geometry and bundled scripts. They do not load a commercial simulator, vehicle digital twin, manufacturer CAD, calibrated sensor model or measured pavement profile.

## Vehicle models

Six models share `src/fleet.js`: Waymo I-PACE, Tesla Cybercab concept, Aurora freight tractor, Rivian EDV, a generic research survey vehicle, and a generic assisted-driving vehicle. Read each model's source notes for evidence and limitations. The generic models are original examples; the sensor arrangement is not attributed to a real laboratory or manufacturer. The Rivian and generic assisted-driving examples are driver-operated platforms. Displaying a dataset beside a vehicle does not establish that the illustrated vehicle collected the data.

The AV explorer provides selectable annotations, sensor-family filters, search, exploded placement, transparent bodywork, preset views, opt-in animated sensing sketches, and GLB export. Sensing sketches illustrate direction and modality. They do not model visibility, occlusion, detection range, noise, weather response or sensor performance.

## Urban route and controls

`driving-simulation.html` presents a repeating straight study route with two controlled crossroads. The scene includes cross traffic, following traffic, parked-style streetscape fixtures, and pedestrians who remain on the sidewalk. The simplified traffic controller has a 38-second sequence: 15 seconds main-road green, 3 seconds amber, 2 seconds clearance, 13 seconds cross-road green, 3 seconds amber, and 2 seconds clearance. Both intersections share the same phase. No protected turning movements or real signal plan is represented.

Demo cruise starts only when requested. It follows the lane, slows for leading vehicles and stops at red or amber signals. Manual controls change acceleration, braking and lateral position within the study lane, while signal and following-distance protections remain enabled. This is not a full free-driving or collision simulator. The route restarts after its eastern boundary. Hide the page or move the simulation out of view to suspend updates. Reduced-motion preferences prevent automatic motion; the driving scene always starts paused.

Use the on-screen buttons or focus the scene and press W / Up to accelerate, S / Down to brake, A / D to move laterally, Space to pause and R to reset. Select chase, cabin, aerial or roadside views. Use **Approach the distress** to move to the test section, start demo cruise and record a short response. If the reference surface was selected, this action chooses a pothole example.

## Pavement and response

The study section is approximately x = −43 to −19 metres. Smooth, pothole, transverse crack, longitudinal crack, alligator crack, wheel-path rut, raised patch, raveling and utility-cover options use authored geometric profiles. The displacement slider is an example surface parameter, not a field observation or distress severity classification. Daylight, dusk and night alter the lighting. Rain changes surface roughness and adds rain streaks; fog reduces visibility. Headlights activate in low light and poor weather. Weather does not calibrate friction, braking distances or sensor performance.

For each step, the simplified model samples the profile at front and rear wheel locations and averages those values into a target body displacement. The body responds as a damped spring:

`vertical acceleration = omega² × (target − body displacement) − 2 × damping × omega × body velocity`

The illustrative damping ratio is 0.72. Angular frequency is 7.5 rad/s for the freight tractor and 10.5 rad/s for other examples. These constants are authored for visual communication and have not been fitted to vehicles. They must not be used to predict ride quality, comfort, damage, tire loads or actual sensor output. Integration uses small time steps; the graph shows the last 12 seconds. Exports retain up to 18,000 generated samples and identify vehicle, surface, example displacement, time, route position, speed, body displacement and vertical acceleration.

The chart and CSV are not measured pavement data, IRI, PCI, a distress rating, or a calibrated vehicle response. Only the linked datasets' own documentation can establish labels, measurement procedures, calibration and use rights.

## Technical behavior

WebGL 2 and browser hardware acceleration are needed for 3D scenes. The descriptive sensor index and related-dataset links remain available when WebGL cannot initialize. Local HTTP hosting is needed for the related dataset JSON; opening an HTML file directly may block its fetch. The distributable HTML includes Three.js and application code. The live JSON references remain separate so the catalogue can be updated reproducibly.

Dataset association metadata is loaded from `data/vehicle-datasets.json`. Query parameter `?vehicle=lab` selects a model; accepted IDs are `waymo`, `cybercab`, `aurora`, `rivian`, `lab` and `adas`. `?embed=1` hides the standalone header and sends `atlas-viewer-height` or `atlas-driving-height` to the parent. Both views synchronize selection using `atlas-vehicle` messages restricted to their parent and same-origin pages.
