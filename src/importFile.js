import { convertHtmlToImportText } from "./importHtml.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function getExtension(name) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

export async function readImportFile(file) {
  const extension = getExtension(file.name);

  if (extension === "doc") {
    throw new Error("Legacy .doc files are not supported. Save as .docx, .txt, or .md and try again.");
  }

  if (extension === "docx" || file.type === DOCX_MIME) {
    const { default: mammoth } = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const text = convertHtmlToImportText(result.value);

    if (!text) {
      throw new Error("That .docx did not contain importable outline text.");
    }

    return text;
  }

  return file.text();
}
