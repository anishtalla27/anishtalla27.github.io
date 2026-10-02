# anishtalla27.github.io

Personal portfolio. Plain HTML, CSS, and JavaScript, no build step.

## Run locally

    python3 -m http.server 4173

Then open http://localhost:4173.

## Editing content

Project entries, skills, and academics are generated from `js/data.js`. The homepage layout and About text are in `index.html`. Each entry looks like:

    {
      id: "stringmap",            // used in project.html?id=stringmap
      title, category, role, org, dates, status,
      cover: "fretboard",         // animated card art, see js/covers.js
      shots: ["assets/shots/stringmap-1.png"],   // real screenshots replace the cover art
      summary, problem, contribution,
      tech: [], details: [], outcomes: [],
      evidence: [{ label, url, kind }],   // kind: code | pr | live | doc | note
      demo: "fretboard",          // optional interactive demo on the detail page
    }

- Screenshots: drop images in `assets/shots/` and list them in `shots`. The first one becomes the card image and all of them appear on the project page.
- Resume: save a PDF as `assets/resume.pdf`. The Resume button appears on its own once the file exists.
- Cards only show Read more when the detail page has additional content or multiple evidence links. Simple entries link directly to their evidence when available.
- The homepage shows every entry once as a full card in its primary category section. All entries are visible without filters. `FEATURED_ORDER` in `js/data.js` sets priority within each section; `alsoIn` does not create extra cards.
- Category links such as `#research` and `#projects` scroll to their sections. `#index` and the old `#featured` link lead to the start of the work.
- Interactive demos live in `js/anim/` (hero circuit board, fretboard solver, gripper, sync pipeline). Full demos appear on their project pages.
- Dr. Kane's internship (`kane-ppbds`) and teaching-fellow role (`kane-teaching`) are separate entries with reciprocal links.

## Deploy to GitHub Pages

Create a public repo named `anishtalla27.github.io`, push this folder to `main`, and the site is served at https://anishtalla27.github.io within a minute or two.
