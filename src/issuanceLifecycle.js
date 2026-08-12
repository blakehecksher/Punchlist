export function startCorrectionForIssuance(
  issuance = {},
  targetId,
  draftTitle = null,
) {
  const history = Array.isArray(issuance.history) ? issuance.history : [];
  const target = history.find((record) => record.id === targetId) ?? null;
  if (!target) return { issuance, target: null };

  return {
    target,
    issuance: {
      ...issuance,
      locked: false,
      draftMode: "correction",
      correctionTargetId: target.id,
      draftTitle,
    },
  };
}

export function replaceIssuanceRecord(issuance = {}, recordId, updates = {}) {
  const history = Array.isArray(issuance.history) ? issuance.history : [];
  const record = history.find((entry) => entry.id === recordId) ?? null;
  if (!record) return { issuance, record: null };

  const updatedRecord = { ...record, ...updates, id: record.id };
  return {
    record: updatedRecord,
    issuance: {
      ...issuance,
      history: history.map((entry) =>
        entry.id === record.id ? updatedRecord : entry,
      ),
    },
  };
}
