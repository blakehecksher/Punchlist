export const DENSITY_OPTIONS = ["2x2", "3x3"];

export const DEFAULT_LAYOUT = {
  density: "2x2",
  showSummary: true,
  showCount: true,
};

const COLUMN_MAP = {
  "2x2": 2,
  "3x3": 3,
};

const FIRST_PAGE_ROWS = {
  "2x2": 2,
  "3x3": 2,
};

const OTHER_PAGE_ROWS = {
  "2x2": 2,
  "3x3": 3,
};

export function normalizeLayout(layout) {
  const density = DENSITY_OPTIONS.includes(layout?.density)
    ? layout.density
    : DEFAULT_LAYOUT.density;

  return {
    density,
    showSummary:
      typeof layout?.showSummary === "boolean"
        ? layout.showSummary
        : DEFAULT_LAYOUT.showSummary,
    showCount:
      typeof layout?.showCount === "boolean"
        ? layout.showCount
        : DEFAULT_LAYOUT.showCount,
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
