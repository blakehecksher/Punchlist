const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const LIST_TAGS = new Set(["OL", "UL"]);
const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
const BLOCK_TEXT_TAGS = new Set(["BLOCKQUOTE", "DIV", ...HEADING_TAGS, "P"]);
const WRAPPER_TAGS = new Set(["ARTICLE", "BODY", "DIV", "MAIN", "SECTION"]);
const BULLET_INDENT = "    ";

function isElementNode(node) {
  return node?.nodeType === ELEMENT_NODE;
}

function isTextNode(node) {
  return node?.nodeType === TEXT_NODE;
}

function isListNode(node) {
  return isElementNode(node) && LIST_TAGS.has(node.tagName);
}

function isBlockTextNode(node) {
  return isElementNode(node) && BLOCK_TEXT_TAGS.has(node.tagName);
}

function getStyleText(node) {
  return isElementNode(node) ? (node.getAttribute("style") ?? "").toLowerCase() : "";
}

function getClassText(node) {
  return isElementNode(node) && typeof node.className === "string" ? node.className : "";
}

function isWordListIgnoreNode(node) {
  return isElementNode(node) && (getStyleText(node).includes("mso-list:ignore") || node.tagName === "O:P");
}

function isWordListParagraph(node) {
  if (!isElementNode(node) || isListNode(node)) return false;
  const styleText = getStyleText(node);
  const classText = getClassText(node);
  return styleText.includes("mso-list:") || classText.includes("MsoListParagraph");
}

function normalizeWhitespace(value) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function stripWordListMarker(text) {
  return text
    .replace(/^\(?\d+[\].)]\s+/, "")
    .replace(/^[A-Za-z][.)]\s+/, "")
    .replace(/^[ivxlcdmIVXLCDM]+[.)]\s+/, "")
    .replace(/^[\u2022\u00b7\u25E6\u25AA\u25CF\uF0B7\-*o]+\s+/, "")
    .trim();
}

function sanitizeTextClone(clone) {
  if (typeof clone.querySelectorAll !== "function") return;

  clone.querySelectorAll("ol, ul").forEach((list) => list.remove());
  clone.querySelectorAll("*").forEach((element) => {
    if (isWordListIgnoreNode(element)) element.remove();
  });
}

function getNodeText(node, options = {}) {
  if (isTextNode(node)) return normalizeWhitespace(node.textContent ?? "");
  if (!isElementNode(node) || isListNode(node) || isWordListIgnoreNode(node)) return "";

  const clone = node.cloneNode(true);
  sanitizeTextClone(clone);

  let text = normalizeWhitespace(clone.textContent ?? "");
  if (options.wordList) text = stripWordListMarker(text);
  return text;
}

function getWordListDepth(node) {
  const styleText = getStyleText(node);
  const levelMatch = styleText.match(/level(\d+)/i);
  if (levelMatch) return Math.max(0, Number(levelMatch[1]) - 1);
  return null;
}

function parseCssLength(node, property) {
  const styleText = getStyleText(node);
  const valueMatch = styleText.match(new RegExp(`${property}\\s*:\\s*(-?\\d*\\.?\\d+)(in|pt|px|pc|cm|mm)?`, "i"));
  if (!valueMatch) return null;

  const value = Number(valueMatch[1]);
  if (!Number.isFinite(value)) return null;

  const unit = (valueMatch[2] ?? "px").toLowerCase();
  switch (unit) {
    case "in":
      return value * 96;
    case "pt":
      return value * (96 / 72);
    case "pc":
      return value * 16;
    case "cm":
      return value * (96 / 2.54);
    case "mm":
      return value * (96 / 25.4);
    default:
      return value;
  }
}

function getWordListMarginLeft(node) {
  return parseCssLength(node, "margin-left");
}

function getWordListMarkerIndent(node) {
  if (!isElementNode(node) || typeof node.querySelectorAll !== "function") return null;

  let score = 0;

  node.querySelectorAll("*").forEach((element) => {
    if (!isWordListIgnoreNode(element)) return;

    const styleText = getStyleText(element);
    const tabCountMatch = styleText.match(/mso-tab-count\s*:\s*(\d+)/i);
    if (tabCountMatch) score += Number(tabCountMatch[1]) * 4;

    const markerText = element.textContent ?? "";
    const spacingText = markerText
      .replace(/^[\s\u00a0]*/, "")
      .replace(/^(?:\(?\d+[\].)]|[A-Za-z][.)]|[ivxlcdmIVXLCDM]+[.)]|[\u2022\u00b7\u25E6\u25AA\u25CF\uF0B7\-*o])/, "");

    const nbspCount = (spacingText.match(/\u00a0/g) || []).length;
    const spaceCount = (spacingText.match(/ /g) || []).length;
    const tabCount = (spacingText.match(/\t/g) || []).length;
    score += nbspCount + spaceCount + (tabCount * 4);
  });

  return score > 0 ? score : null;
}

function applyWordListDepths(group) {
  const explicitDepths = group
    .map((entry) => entry.explicitDepth)
    .filter((depth) => depth !== null);
  const hasNestedExplicitDepth = explicitDepths.some((depth) => depth > 0);

  if (hasNestedExplicitDepth) {
    group.forEach((entry) => {
      entry.depth = entry.explicitDepth ?? 0;
    });
    return;
  }

  const uniqueMargins = [...new Set(
    group
      .map((entry) => entry.marginLeft)
      .filter((margin) => margin !== null)
      .map((margin) => Math.round(margin))
  )].sort((a, b) => a - b);

  if (uniqueMargins.length > 1) {
    group.forEach((entry) => {
      if (entry.marginLeft === null) {
        entry.depth = entry.explicitDepth ?? 0;
        return;
      }

      const roundedMargin = Math.round(entry.marginLeft);
      const marginIndex = uniqueMargins.findIndex((margin) => margin === roundedMargin);
      entry.depth = marginIndex === -1 ? (entry.explicitDepth ?? 0) : marginIndex;
      });
    return;
  }

  const uniqueMarkerIndents = [...new Set(
    group
      .map((entry) => entry.markerIndent)
      .filter((indent) => indent !== null)
      .map((indent) => Math.round(indent))
  )].sort((a, b) => a - b);

  if (uniqueMarkerIndents.length > 1) {
    group.forEach((entry) => {
      if (entry.markerIndent === null) {
        entry.depth = entry.explicitDepth ?? 0;
        return;
      }

      const roundedIndent = Math.round(entry.markerIndent);
      const indentIndex = uniqueMarkerIndents.findIndex((indent) => indent === roundedIndent);
      entry.depth = indentIndex === -1 ? (entry.explicitDepth ?? 0) : indentIndex;
    });
    return;
  }

  group.forEach((entry) => {
    entry.depth = entry.explicitDepth ?? 0;
  });
}

function normalizeWordListDepths(entries) {
  let currentGroup = [];

  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    applyWordListDepths(currentGroup);
    currentGroup = [];
  };

  entries.forEach((entry) => {
    if (entry.type === "wordList") {
      currentGroup.push(entry);
      return;
    }

    flushGroup();
  });

  flushGroup();
  return entries;
}

function hasStructuralChildren(node) {
  return Array.from(node.children).some((child) => {
    if (isListNode(child) || isWordListParagraph(child) || isBlockTextNode(child)) return true;
    return WRAPPER_TAGS.has(child.tagName) && hasStructuralChildren(child);
  });
}

function shouldRecurseIntoNode(node) {
  if (!isElementNode(node) || isListNode(node) || isWordListParagraph(node)) return false;
  if (!WRAPPER_TAGS.has(node.tagName)) return false;
  return hasStructuralChildren(node);
}

function collectSignificantNodes(root, nodes = []) {
  Array.from(root.childNodes).forEach((child) => {
    if (!isElementNode(child)) return;

    if (isListNode(child)) {
      nodes.push({ type: "list", node: child });
      return;
    }

    if (isWordListParagraph(child)) {
      const text = getNodeText(child, { wordList: true });
      if (text) {
        nodes.push({
          type: "wordList",
          node: child,
          text,
          explicitDepth: getWordListDepth(child),
          marginLeft: getWordListMarginLeft(child),
          markerIndent: getWordListMarkerIndent(child),
          depth: 0,
        });
      }
      return;
    }

    if (shouldRecurseIntoNode(child)) {
      collectSignificantNodes(child, nodes);
      return;
    }

    const text = getNodeText(child);
    if (text) {
      nodes.push({ type: "text", node: child, text });
      return;
    }

    if (child.children.length > 0) collectSignificantNodes(child, nodes);
  });

  return nodes;
}

function ensureTrailingColon(text) {
  return text.endsWith(":") ? text : `${text}:`;
}

function isListLikeEntry(entry) {
  return entry?.type === "list" || entry?.type === "wordList";
}

function looksLikeHeading(node, text, nextEntry) {
  if (!text) return false;
  if (isElementNode(node) && HEADING_TAGS.has(node.tagName)) return true;
  if (!isListLikeEntry(nextEntry)) return false;
  if (/[.!?;]$/.test(text)) return false;
  if (text.length > 80) return false;
  return text.split(/\s+/).length <= 10;
}

function appendListLines(listNode, depth, lines) {
  Array.from(listNode.children).forEach((child) => {
    if (!isElementNode(child) || child.tagName !== "LI") return;

    const text = getNodeText(child);
    if (text) lines.push(`${BULLET_INDENT.repeat(depth)}- ${text}`);

    const nestedDepth = text ? depth + 1 : depth;
    Array.from(child.children)
      .filter(isListNode)
      .forEach((nestedList) => appendListLines(nestedList, nestedDepth, lines));
  });
}

function parseHtmlEntries(html) {
  if (typeof DOMParser === "undefined") {
    throw new Error("Structured HTML import is not available in this browser.");
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return normalizeWordListDepths(collectSignificantNodes(doc.body));
}

export function hasStructuredImportHtml(html) {
  if (!html?.trim()) return false;

  const entries = parseHtmlEntries(html);
  return entries.some((entry, index) => (
    entry.type === "list" ||
    entry.type === "wordList" ||
    looksLikeHeading(entry.node, entry.text ?? "", entries[index + 1] ?? null)
  ));
}

export function convertHtmlToImportText(html) {
  const entries = parseHtmlEntries(html);
  const lines = [];

  entries.forEach((entry, index) => {
    if (entry.type === "list") {
      appendListLines(entry.node, 0, lines);
      return;
    }

    if (entry.type === "wordList") {
      lines.push(`${BULLET_INDENT.repeat(entry.depth)}- ${entry.text}`);
      return;
    }

    const nextEntry = entries[index + 1] ?? null;
    lines.push(looksLikeHeading(entry.node, entry.text, nextEntry) ? ensureTrailingColon(entry.text) : entry.text);
  });

  return lines.join("\n").trim();
}
