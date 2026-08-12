# Testing

The app is a static Vite/React application, so the first useful test layer is
fast unit coverage around the pure import, pagination, and storage functions.
That layer runs without a browser and should run on every change and before a
GitHub Pages deployment.

## Current automated coverage

- `src/importParser.js`: bulleted and numbered section formats, nested numbered
  outlines, and issue-code re-import matching.
- `src/pagination.js`: the first-page site-condition rule, page-two overflow,
  and the normal two-row capacity when site conditions are not rendered.
- `src/projectStore.js`: project round trips, preservation of unknown saved
  fields, legacy migration safety, and active-project selection.

Run it with:

```text
npm test
```

## Next layer

The next addition should be a browser smoke suite using a real Chromium
session. It should create a project, import an outline, attach a photo, reload,
switch projects, issue a PDF, and confirm that the working project and issued
snapshot remain available. A print screenshot test should cover a short and a
long site-condition list so page one cannot regress into undersized cards.

Before deployment, run:

```text
npm test
npm run lint
npm run build
```
