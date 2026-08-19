/**
 * The punch list document model.
 *
 * These are the shapes that get written to browser storage and to backup
 * files, so they outlive any single release. They are declared once here and
 * referenced from JSDoc in the data-layer modules:
 *
 *   \/** @type {import("./types.js").ProjectData} *\/
 *
 * Item state — new, revised, complete — is deliberately absent. It is read
 * from the inline formatting of `description` and never stored, so that there
 * is exactly one source of truth for it. A field here would invite a second.
 */

/** A punch item. Its `id` is what a photo is keyed by, so it must be stable. */
export interface Item {
  id: string;
  description: string;
  /** Per-section sequence behind the printed code, e.g. 2 in "102-02". */
  issueSeq: number;
  /** Present in memory only; stripped before writing to localStorage. */
  photo?: string | null;
  photoPosition?: PhotoPosition | null;
}

/**
 * An item as it may exist in storage, possibly carrying fields from releases
 * that have since been removed. `normalizeStoredData` strips these on load.
 */
export interface StoredItem extends Item {
  /**
   * Removed 2026-08. It was reset to false on every load, so it never
   * survived a reload while the markup in `description` always did.
   */
  isNew?: unknown;
}

/** Pan and zoom for a photo within its cell. */
export interface PhotoPosition {
  scale: number;
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  /** Next unused sequence. Never reused, so removal does not renumber. */
  nextItemIssueSeq?: number;
  items: Item[];
}

export interface Layout {
  density: string;
  showSummary: boolean;
  showCount: boolean;
}

/** A whole punch list, as held in memory and written to storage. */
export interface ProjectData {
  project: string;
  projectNum: string;
  title: string;
  date: string;
  firm: string;
  punchlistDate: string;
  generalNotesTitle: string;
  headerNote: string;
  layout: Layout;
  endOfPunchListEntries: string[];
  nextGeneralIssueSeq: number;
  siteConditions: string[];
  generalNotes: Item[];
  rooms: Room[];
  isExample?: boolean;
  exampleVersion?: number;
  /** Stamped on save; 0 or absent means written before versioning existed. */
  schemaVersion?: number;
  /** Records may carry fields from a newer release; they must survive a load. */
  [key: string]: unknown;
}

/** A row in the project list. Backup bookkeeping lives here, not in the document. */
export interface ProjectIndexEntry {
  id: string;
  name: string;
  projectNum: string;
  lastSaved: string;
  isExample?: boolean;
  /** ISO timestamp of the last backup file written for this project. */
  lastBackupAt?: string;
}

/** A photo as held in IndexedDB, keyed by "[projectId]:[itemId]". */
export interface StoredPhoto {
  dataUrl: string;
  position?: PhotoPosition | null;
}

/** Photos by bare item ID, as returned by idbGetAllPhotos. */
export type PhotoMap = Record<string, StoredPhoto | string>;

/** The contents of a .json backup file. */
export interface BackupPayload {
  _punchlistFile: true;
  /** File envelope version. Distinct from the document's schemaVersion. */
  _version: number;
  data: ProjectData;
  photos: PhotoMap;
}

/** One parsed item from an imported outline. */
export interface ParsedItem {
  /** Matched against existing items to keep identity across a re-import. */
  issueCode: string | null;
  description: string;
  isNew?: boolean;
}

export interface ParsedSection {
  name: string;
  items: ParsedItem[];
}

/** The output of parseImportText, and the input to mergeImportedNotes. */
export interface ParsedImport {
  siteConditions: string[];
  generalNotes: ParsedItem[];
  rooms: ParsedSection[];
}
