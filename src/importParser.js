const BULLET_RE = /^(\s*)(?:[-*+]|(?:\d+)[.)])\s+(.+?)\s*$/;
const COLON_HEADING_RE = /^[A-Za-z0-9].*:\s*$/;
const GENERAL_NOTES_KEYS = new Set(["general notes", "general note", "general"]);
const SITE_CONDITION_KEYS = new Set(["site conditions", "site condition"]);
const ISSUE_CODE_PREFIX_RE = /^(?:[A-Z]{2,4}|\d{2,4})-\d{2,}\s*:\s*/i;

function normalizeIndent(line) {
  return line.replace(/\t/g, "    ");
}

function normalizeSectionName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function classifySection(name) {
  const key = normalizeSectionName(name).toLowerCase();
  if (GENERAL_NOTES_KEYS.has(key)) return "generalNotes";
  if (SITE_CONDITION_KEYS.has(key)) return "siteConditions";
  return "room";
}

function stripHeadingSyntax(line) {
  if (/^#{1,6}\s+/.test(line)) return line.replace(/^#{1,6}\s+/, "").trim();
  if (/^\*\*.+\*\*$/.test(line)) return line.slice(2, -2).trim();
  if (COLON_HEADING_RE.test(line)) return line.replace(/:\s*$/, "").trim();
  return null;
}

function ensureSection(sections, rawName) {
  const name = normalizeSectionName(rawName);
  const key = name.toLowerCase();
  const type = classifySection(name);
  const existing = sections.find((section) => section.key === key);
  if (existing) return existing;

  const section = { key, name, type, items: [] };
  sections.push(section);
  return section;
}

function convertInlineMarkdownToHtml(text) {
  if (!text.includes("*") && !text.includes("_") && !text.includes("~")) return text;
  let result = text;
  result = result.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  result = result.replace(/__(.+?)__/g, "<u>$1</u>");
  result = result.replace(/~~(.+?)~~/g, "<s>$1</s>");
  return result;
}

function finalizeSections(sections) {
  const siteConditions = [];
  const generalNotes = [];
  const rooms = [];

  sections.forEach((section) => {
    const cleanedItems = section.items
      .map((item) => convertInlineMarkdownToHtml(item.replace(ISSUE_CODE_PREFIX_RE, "").trim()))
      .filter(Boolean);
    if (cleanedItems.length === 0) return;
    if (section.type === "siteConditions") {
      siteConditions.push(...cleanedItems);
      return;
    }
    if (section.type === "generalNotes") {
      generalNotes.push(...cleanedItems);
      return;
    }
    rooms.push({ name: section.name, items: cleanedItems });
  });

  if (siteConditions.length === 0 && generalNotes.length === 0 && rooms.length === 0) {
    throw new Error("No importable notes found. Use Site Conditions, General Notes, or room headings with bullet items underneath.");
  }

  return { siteConditions, generalNotes, rooms };
}

function flattenOutlineNode(node) {
  const children = node.children.map(flattenOutlineNode).filter(Boolean);
  if (children.length === 0) return node.content;
  if (!node.content) return children.join("; ");
  return `${node.content}: ${children.join("; ")}`;
}

function parseOutlineSections(text) {
  const lines = text
    .split("\n")
    .map(normalizeIndent)
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.trim() && line.trim() !== "---");

  const tokens = lines.map((line) => {
    const bullet = line.match(BULLET_RE);
    if (!bullet) return null;
    return {
      indent: bullet[1].length,
      content: bullet[2].trim(),
    };
  });

  if (tokens.some((token) => token === null)) return null;

  const root = { children: [] };
  const stack = [{ indent: -1, node: root }];

  tokens.forEach((token) => {
    const node = { content: token.content, children: [] };
    while (stack.length > 1 && token.indent <= stack[stack.length - 1].indent) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ indent: token.indent, node });
  });

  const topLevelSections = root.children.filter((node) => node.children.length > 0);
  if (topLevelSections.length === 0) return null;

  const sections = [];
  topLevelSections.forEach((sectionNode) => {
    const section = ensureSection(sections, sectionNode.content);
    sectionNode.children.forEach((itemNode) => {
      const item = flattenOutlineNode(itemNode);
      if (item) section.items.push(item);
    });
  });

  return finalizeSections(sections);
}

function parseHeadingSections(text) {
  const sections = [];
  let current = null;

  for (const rawLine of text.split("\n")) {
    const normalized = normalizeIndent(rawLine);
    const line = normalized.trim();
    if (!line || line === "---") continue;

    const heading = stripHeadingSyntax(line);
    if (heading && !BULLET_RE.test(normalized)) {
      current = ensureSection(sections, heading);
      continue;
    }

    const bullet = normalized.match(BULLET_RE);
    if (!current) current = ensureSection(sections, "General Notes");

    if (bullet) {
      current.items.push(bullet[2].trim());
      continue;
    }

    if (current.items.length > 0) {
      current.items[current.items.length - 1] = `${current.items[current.items.length - 1]} ${line}`.trim();
      continue;
    }

    current.items.push(line);
  }

  return finalizeSections(sections);
}

export function parseImportText(source) {
  const text = source.replace(/\r\n?/g, "\n").trim();
  if (!text) throw new Error("Paste notes or load a .docx/.md/.txt file before importing.");

  return parseOutlineSections(text) ?? parseHeadingSections(text);
}
