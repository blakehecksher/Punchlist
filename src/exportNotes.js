import { formatIssueCode } from "./issueIds.js";

function htmlToMarkdown(html) {
  if (!html || !html.includes("<")) return html;
  return html
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<u>(.*?)<\/u>/gi, "__$1__")
    .replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
    .replace(/<(?:del|strike|x)>(.*?)<\/(?:del|strike|x)>/gi, "~~$1~~")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

function hasInlineTag(html, format) {
  const patterns = {
    bold: [
      /<(?:b|strong)(?:\s|>)/i,
      /font-weight\s*:\s*(?:bold|[5-9]00)/i,
    ],
    strike: [
      /<(?:s|del|strike|x)(?:\s|>)/i,
      /text-decoration[^>"]*line-through/i,
    ],
  };

  return (patterns[format] || []).some((pattern) => pattern.test(html ?? ""));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatIssueCodeMarkdown(issueCode, isNew, isCompleted) {
  let formatted = issueCode;
  if (isNew) formatted = `__${formatted}__`;
  if (isCompleted) formatted = `~~${formatted}~~`;
  return formatted;
}

function formatIssueCodeHtml(issueCode, isNew, isCompleted) {
  let formatted = escapeHtml(issueCode);
  if (isNew) formatted = `<u>${formatted}</u>`;
  if (isCompleted) formatted = `<s>${formatted}</s>`;
  return formatted;
}

function formatItemLine(issueCode, description, isNew = false, isCompleted = false) {
  const md = htmlToMarkdown((description || "").trim());
  const lines = md.split("\n").filter((l) => l.trim());
  const prefix = `    - ${formatIssueCodeMarkdown(issueCode, isNew, isCompleted)}: `;
  if (lines.length <= 1) return `${prefix}${lines[0] || ""}`;
  return [
    `${prefix}${lines[0]}`,
    ...lines.slice(1).map((l) => `        ${l}`),
  ].join("\n");
}

function formatItemHtml(issueCode, description, isNew = false, isCompleted = false) {
  const raw = (description || "").trim();
  const parts = raw.split(/<br\s*\/?>/i);
  const firstLine = parts[0] || "";
  const separator = firstLine ? ": " : ":";
  const header = `${formatIssueCodeHtml(issueCode, isNew, isCompleted)}${separator}${firstLine}`;

  if (parts.length <= 1) return `<li>${header}</li>`;

  const subItems = parts
    .slice(1)
    .map((p) => p.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean)
    .map((p) => `<li>${p}</li>`)
    .join("");
  return `<li>${header}<ul>${subItems}</ul></li>`;
}

export function buildExportMarkdown(data) {
  const lines = [];

  if (data.siteConditions.length > 0) {
    lines.push("- Site Conditions");
    data.siteConditions.forEach((condition) => {
      lines.push(`    - ${(condition || "").trim()}`);
    });
    lines.push("");
  }

  if (data.generalNotes.length > 0) {
    lines.push("- General Notes");
    data.generalNotes.forEach((item) => {
      lines.push(
        formatItemLine(
          formatIssueCode("generalNotes", data.generalNotesTitle, item.issueSeq),
          item.description,
          Boolean(item.isNew),
          hasInlineTag(item.description, "strike"),
        ),
      );
    });
    lines.push("");
  }

  data.rooms.forEach((room) => {
    if (!room.items.length) return;
    lines.push(`- ${room.name}`);
    room.items.forEach((item) => {
      lines.push(
        formatItemLine(
          formatIssueCode("room", room.name, item.issueSeq),
          item.description,
          Boolean(item.isNew),
          hasInlineTag(item.description, "strike"),
        ),
      );
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

function buildSectionHtml(title, itemsHtml) {
  return `<li>${escapeHtml(title)}<ul>${itemsHtml}</ul></li>`;
}

export function buildExportHtml(data) {
  const sections = [];

  if (data.siteConditions.length > 0) {
    sections.push(
      buildSectionHtml(
        "Site Conditions",
        data.siteConditions
          .map((condition) => `<li>${escapeHtml((condition || "").trim())}</li>`)
          .join(""),
      ),
    );
  }

  if (data.generalNotes.length > 0) {
    sections.push(
      buildSectionHtml(
        "General Notes",
        data.generalNotes
          .map((item) =>
            formatItemHtml(
              formatIssueCode("generalNotes", data.generalNotesTitle, item.issueSeq),
              item.description,
              Boolean(item.isNew),
              hasInlineTag(item.description, "strike"),
            ),
          )
          .join(""),
      ),
    );
  }

  data.rooms.forEach((room) => {
    if (!room.items.length) return;
    sections.push(
      buildSectionHtml(
        room.name,
        room.items
          .map((item) =>
            formatItemHtml(
              formatIssueCode("room", room.name, item.issueSeq),
              item.description,
              Boolean(item.isNew),
              hasInlineTag(item.description, "strike"),
            ),
          )
          .join(""),
      ),
    );
  });

  return `<ul>${sections.join("")}</ul>`;
}

function copyWithExecCommand(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Copy failed");
}

export async function copyNotesToClipboard(data) {
  const markdown = `${buildExportMarkdown(data)}\n`;
  const html = buildExportHtml(data);

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([markdown], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return;
    } catch {
      // Fall back to plain text clipboard methods below.
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown);
    return;
  }

  copyWithExecCommand(markdown);
}
