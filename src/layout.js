export const DENSITY_OPTIONS = ["2x2", "3x3", "4x4"];

export const DEFAULT_LAYOUT = {
  density: "2x2",
  showPhotos: true,
};

const COLUMN_MAP = {
  "2x2": 2,
  "3x3": 3,
  "4x4": 4,
};

const FIRST_PAGE_ROWS = {
  "2x2": 2,
  "3x3": 2,
  "4x4": 3,
};

const OTHER_PAGE_ROWS = {
  "2x2": 2,
  "3x3": 3,
  "4x4": 4,
};

export function normalizeLayout(layout) {
  const density = DENSITY_OPTIONS.includes(layout?.density)
    ? layout.density
    : DEFAULT_LAYOUT.density;

  return {
    density,
    showPhotos:
      typeof layout?.showPhotos === "boolean"
        ? layout.showPhotos
        : DEFAULT_LAYOUT.showPhotos,
  };
}

export function getLayoutMetrics(layout) {
  const normalized = normalizeLayout(layout);

  return {
    ...normalized,
    columns: COLUMN_MAP[normalized.density],
    firstPageRows: FIRST_PAGE_ROWS[normalized.density],
    otherPageRows: OTHER_PAGE_ROWS[normalized.density],
  };
}
