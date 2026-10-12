# Version 1.3 verification

Verified locally on 12 October 2026. This records the checks actually performed; it is not an external dataset audit or a calibrated simulation validation.

## Source and scoring

- All 233 retained source records have stable IDs and source-row references. Both source files are shipped with SHA-256 provenance.
- The shared scoring engine reproduces all 699 source workbook values (lower bound, upper bound and resolved share), within 1e-8 tolerance.
- The evidence ledger retains 3,728 core-check rows and all 248 original source rows. Fifteen aliases merge into existing records.
- Labeled-16 contains 229 records; Unlabeled-13 contains four. The latter omits annotation evidence for the cohort, not record by record. G4 retains the source's inventory-level not-applicable status.
- Regression checks cover positive versus explicitly absent distress labels and Creative Commons license variants.

## Browser checks

The Codex in-app Chromium browser rendered the site through local HTTP at desktop (1440 × 1000) and mobile (390 × 844) viewports.

- Register search returned the two Waymo records, an unmatched search returned zero records, and reset restored the inventory.
- Switching to Unlabeled-13 displayed four ranked records, disabled annotation weight, and used five dimensions. Weight controls changed the profile.
- A dataset detail page rendered provenance, access terms, check evidence and source-ledger metadata. Its downloaded JSON contained the original evidence sidecar.
- The sensor explorer rendered the research vehicle, selected its roof lidar through the sensor-family filter, and displayed the corresponding inspector. The Waymo model and animated sketch were also exercised.
- The driving scene ran, paused, changed camera, changed to dusk/rain, and exported 519 generated samples in a browser test. The trace contained nonzero body displacement and acceleration. Mobile controls and scenario controls fit the viewport.
- The contribution form rejected missing required fields. A synthetic local example generated a real XLSX; openpyxl successfully read both worksheets and the Unicode/contact fields. The result explicitly said it had not sent an email. No test email was sent.
- Main catalog, dataset detail and both 3D workspaces had no horizontal document overflow in mobile checks. No browser error logs were observed in the tested workflows.

Screenshots are in [screenshots/](screenshots/). The README and browser user guide show the four primary views.

## Build and automated checks

`node build.mjs` generates the two bundled Three.js pages and fleet runtime. `node verify.mjs` checks source scoring, filter regressions, mocked submission behavior, page anchors, local asset paths, JavaScript syntax and screenshot presence. GitHub's Pages workflow runs the same verifier against committed files before publishing.

The simulation implementation also checked that signal phases never give conflicting movements green simultaneously and that all eight distress profiles produce finite generated responses; the smooth reference produces zero. Equations and simplifications are documented in [simulation notes](../src/models/SIMULATION-NOTES.md).

A design detector pass prompted higher contrast blue links and larger functional text in the preserved catalog. Table wrapper warnings were inspected as false positives because cell padding supplies the inset. Decorative gradients retained in unused legacy CSS do not render in the updated hero or buttons. These checks do not constitute a full WCAG conformance audit.

## Pending live service verification

Automatic email is deliberately disabled. Mock tests cannot prove Google authorization, anonymous deployment access, inbox delivery, or real Drive export. The owner setup and live acceptance checklist are in [SUBMISSIONS.md](SUBMISSIONS.md). Dataset download availability, publisher terms, missing metadata and scientific validity remain subject to the original source evidence.
