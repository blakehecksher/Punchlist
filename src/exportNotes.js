import { formatIssueCode } from "./issueIds.js";

function htmlToMarkdown(html) {
  if (!html || !html.includes("<")) return html;
  return html
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<u>(.*?)<\/u>/gi, "__$1__")
    .replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "");
}

function formatItemLine(issueCode, description) {
  return `    - ${issueCode}: ${htmlToMarkdown((description || "").trim())}`;
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
        formatItemLine(formatIssueCode("room", room.name, item.issueSeq), item.description),
      );
    });
    lines.push("");
  });

  return lines.join("\n").trim();
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

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown);
    return;
  }

  copyWithExecCommand(markdown);
}
