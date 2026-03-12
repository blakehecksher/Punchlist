// Each row holds 2 items side-by-side. Max rows per page:
export const ROWS_PAGE_1 = 2;
export const ROWS_OTHER = 2;

function chunkPairs(arr) {
  const pairs = [];
  for (let i = 0; i < arr.length; i += 2) pairs.push([arr[i], arr[i + 1] || null]);
  return pairs;
}

// Segment types emitted by paginate():
//   'header'          — page chrome (project/date bar)
//   'siteConditions'  — site conditions list (page 1 only)
//   'gnHeader'        — { cont } General Notes header
//   'gnRows'          — { pairs } general notes, 2 per row
//   'byRoomLabel'     — "By Room" section divider
//   'roomRows'        — { roomId, roomName, cont, pairs } multi-item room
//   'singleRoomPair'  — { left, right? } two 1-item rooms sharing a row

export function paginate(data) {
  const pages = [];
  let currentPage = [];
  let rowsUsed = 0;
  let isFirstPage = true;

  const rowsForPage = () => isFirstPage ? ROWS_PAGE_1 : ROWS_OTHER;

  currentPage.push({ type: "header" });
  currentPage.push({ type: "siteConditions" });

  const flush = () => {
    pages.push(currentPage);
    currentPage = [{ type: "header" }];
    rowsUsed = 0;
    isFirstPage = false;
  };

  // General notes — 2 per row
  const gnPairs = chunkPairs(data.generalNotes);
  currentPage.push({ type: "gnHeader", cont: false, empty: gnPairs.length === 0 });
  if (gnPairs.length === 0) {
    currentPage.push({ type: "gnRows", pairs: [], empty: true });
  } else {
    let i = 0;
    while (i < gnPairs.length) {
      if (rowsUsed + 1 > rowsForPage()) {
        flush();
        currentPage.push({ type: "gnHeader", cont: true, empty: false });
      }
      const cap = rowsForPage() - rowsUsed;
      const batch = gnPairs.slice(i, i + cap);
      currentPage.push({ type: "gnRows", pairs: batch, empty: false });
      rowsUsed += batch.length;
      i += batch.length;
    }
  }

  // --- Rooms ---
  let byRoomLabelEmitted = false;
  let singleBuffer = null;

  const emitByRoomLabel = () => {
    if (!byRoomLabelEmitted) {
      currentPage.push({ type: "byRoomLabel" });
      byRoomLabelEmitted = true;
    }
  };

  const flushSingleBuffer = () => {
    if (!singleBuffer) return;
    if (rowsUsed >= rowsForPage()) flush();
    emitByRoomLabel();
    currentPage.push({ type: "singleRoomPair", left: singleBuffer, right: null });
    rowsUsed += 1;
    singleBuffer = null;
  };

  data.rooms.forEach((room) => {
    if (room.items.length === 0) {
      flushSingleBuffer();
      if (rowsUsed >= rowsForPage()) flush();
      emitByRoomLabel();
      currentPage.push({ type: "roomRows", roomId: room.id, roomName: room.name, cont: false, pairs: [] });
      return;
    }

    if (room.items.length === 1) {
      const entry = { roomId: room.id, roomName: room.name, item: room.items[0], cont: false };
      if (singleBuffer) {
        if (rowsUsed >= rowsForPage()) flush();
        emitByRoomLabel();
        currentPage.push({ type: "singleRoomPair", left: singleBuffer, right: entry });
        rowsUsed += 1;
        singleBuffer = null;
      } else {
        singleBuffer = entry;
      }
      return;
    }

    // Multi-item room (2+ items)
    flushSingleBuffer();

    const roomPairs = chunkPairs(room.items);
    const lastPair = roomPairs[roomPairs.length - 1];
    const hasTrailingSingle = lastPair && lastPair[1] === null;
    const totalRows = roomPairs.length;
    const availableRows = rowsForPage() - rowsUsed;

    if (totalRows <= availableRows) {
      emitByRoomLabel();
      currentPage.push({ type: "roomRows", roomId: room.id, roomName: room.name, cont: false, pairs: roomPairs });
      rowsUsed += totalRows;
    } else if (totalRows <= rowsForPage() || totalRows <= ROWS_OTHER) {
      flush();
      emitByRoomLabel();
      currentPage.push({ type: "roomRows", roomId: room.id, roomName: room.name, cont: false, pairs: roomPairs });
      rowsUsed += totalRows;
    } else {
      const fullPairs = hasTrailingSingle ? roomPairs.slice(0, -1) : roomPairs;
      let cont = false;
      let i = 0;

      while (i < fullPairs.length) {
        if (rowsUsed >= rowsForPage()) flush();
        emitByRoomLabel();
        const cap = rowsForPage() - rowsUsed;
        const batch = fullPairs.slice(i, i + cap);
        currentPage.push({ type: "roomRows", roomId: room.id, roomName: room.name, cont, pairs: batch });
        rowsUsed += batch.length;
        i += batch.length;
        cont = true;
      }

      if (hasTrailingSingle) {
        const trailingItem = lastPair[0];
        const entry = { roomId: room.id, roomName: room.name, item: trailingItem, cont };
        if (singleBuffer) {
          if (rowsUsed >= rowsForPage()) flush();
          emitByRoomLabel();
          currentPage.push({ type: "singleRoomPair", left: singleBuffer, right: entry });
          rowsUsed += 1;
          singleBuffer = null;
        } else {
          singleBuffer = entry;
        }
      }
    }
  });

  flushSingleBuffer();

  if (currentPage.length > 1) pages.push(currentPage);
  return pages;
}
