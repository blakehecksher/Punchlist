export const DEFAULT_LAYOUT = {
  density: "2x2",
  showSummary: true,
  showCount: true,
};

export function normalizeLayout(layout) {
  return {
    // Punch List uses one document geometry: four photo cards per page.
    // Older saved 3x3 layouts migrate here automatically on load.
    density: DEFAULT_LAYOUT.density,
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
    columns: 2,
    firstPageRows: 2,
    otherPageRows: 2,
  };
}
