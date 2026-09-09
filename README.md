# PaveData Atlas 1.1 — Pavement-AI Dataset Explorer

Interactive, fully static website for the reconciled register of **177 public pavement-distress datasets**
across six platforms (GitHub, Data.gov, Mendeley Data, Hugging Face, Zenodo, Kaggle): world map, modality /
annotation / acquisition / camera-viewpoint / distress views, a weight-adjustable readiness screening, a
filterable register with CSV export, a sample gallery, a driving simulation and a dataset-submission form.

## Folder layout

| Path | Purpose |
|---|---|
| `index.html` | The whole application (data, map, register, gallery, simulation). No build step or server needed. |
| `assets/three.r128.min.js` | three.js r128 (MIT) used by the driving simulation. |
| `assets/samples/`, `assets/gallery/` | Downscaled sample thumbnails published by the dataset authors (see `CREDITS.md`). |
| `assets/distress/` | Openly licensed distress reference photos from Wikimedia Commons (see `CREDITS.md`). |
| `data/Compared_All_Platforms_TH_v5.0.xlsx` | The reconciled inventory workbook the page is generated from (linked from the page footer). |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are (no Jekyll processing). |

## Publish on GitHub Pages

1. Create a new repository on GitHub (public, or private on a plan that supports private Pages).
2. Upload the **contents** of this folder to the repository root (`index.html` must sit at the root), or push it with git:

   ```bash
   git init
   git add .
   git commit -m "PaveData Atlas 1.1"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```

3. In the repository open **Settings → Pages**. Under **Build and deployment** choose **Source: Deploy from a branch**,
   then **Branch: main**, **Folder: / (root)** and press **Save**.
4. After one to two minutes the site is live at `https://<your-user>.github.io/<your-repo>/`
   (the URL is shown at the top of the Pages settings page). Every later push to `main` redeploys automatically.

Optional: a custom domain can be set on the same settings page (add a `CNAME` there; GitHub creates the file).

If you upload through the GitHub web interface and the hidden file `.nojekyll` is not picked up, add it afterwards with
**Add file → Create new file**, name it `.nojekyll` and commit it empty (it only stops GitHub from running Jekyll over the files).

## Notes

* Everything is relative-path based, so the site also works when opened as a local file or hosted under a sub-path.
* The dataset-submission form sends an e-mail through the visitor's mail client (`mailto:`) or downloads a JSON file;
  the review inbox is set once in `index.html` (`SUB_CONTACT`).
* To regenerate the page from an updated workbook use the scripts in the project's `analysis/` folder
  (`regen_v11_template.py` → `apply_v11.py` → `build_site.py`).
* Choose a license for your own content (for example CC BY 4.0 for the register and MIT for the page code)
  and add a `LICENSE` file before public release; third-party content keeps its own licenses (see `CREDITS.md`).
