import { useRef, useLayoutEffect, useEffect, useCallback } from "react";

/**
 * Sanitize pasted HTML to only keep inline formatting tags (b, i, u, s).
 * Converts <strong>/<em>/<del>/<strike> to their canonical forms.
 * Also detects style-based formatting on spans and other elements.
 */
function sanitizeNode(node) {
  let result = "";
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      result += child.textContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      continue;
    }
    if (child.nodeType !== 1) continue;

    const tag = child.tagName;
    const inner = sanitizeNode(child);

    if (tag === "B" || tag === "STRONG") {
      result += inner ? `<b>${inner}</b>` : "";
    } else if (tag === "I" || tag === "EM") {
      result += inner ? `<i>${inner}</i>` : "";
    } else if (tag === "U") {
      result += inner ? `<u>${inner}</u>` : "";
    } else if (tag === "X" || tag === "DEL" || tag === "STRIKE") {
      result += inner ? `<s>${inner}</s>` : "";
    } else if (tag === "BR") {
      result += "<br>";
    } else {
      let wrapped = inner;
      const style = (child.getAttribute("style") || "").toLowerCase();
      if (/font-weight\s*:\s*(bold|[5-9]00)/.test(style))
        wrapped = `<b>${wrapped}</b>`;
      if (/font-style\s*:\s*italic/.test(style)) wrapped = `<i>${wrapped}</i>`;
      if (/text-decoration[^;]*underline/.test(style))
        wrapped = `<u>${wrapped}</u>`;
      if (/text-decoration[^;]*line-through/.test(style))
        wrapped = `<s>${wrapped}</s>`;
      result += wrapped;
    }
  }
  return result;
}

function sanitizePastedHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let result = sanitizeNode(doc.body);
  result = result.replace(/(<br>\s*)+$/g, "");
  result = result.replace(/(<br>\s*){3,}/g, "<br><br>");
  return result;
}

export default function RichText({ value, onChange, placeholder, className }) {
  const ref = useRef(null);
  const lastHtml = useRef(value || "");

  // Set initial content synchronously before paint to avoid flash.
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || "";
      lastHtml.current = value || "";
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. editing in summary updates the card).
  useEffect(() => {
    if (!ref.current) return;
    const current = value || "";
    if (current !== lastHtml.current) {
      ref.current.innerHTML = current;
      lastHtml.current = current;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!ref.current) return;
    let html = ref.current.innerHTML || "";
    // Browser leaves a <br> or <div><br></div> in empty contentEditable — normalize.
    if (html === "<br>" || html === "<div><br></div>") {
      html = "";
      ref.current.innerHTML = "";
    }
    lastHtml.current = html;
    onChange?.(html);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            document.execCommand("bold");
            emitChange();
            break;
          case "i":
            e.preventDefault();
            document.execCommand("italic");
            emitChange();
            break;
          case "u":
            e.preventDefault();
            document.execCommand("underline");
            emitChange();
            break;
          case "x":
            if (e.shiftKey) {
              e.preventDefault();
              document.execCommand("strikeThrough");
              emitChange();
            }
            break;
        }
      }
    },
    [emitChange],
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const html = e.clipboardData?.getData("text/html");
      const text = e.clipboardData?.getData("text/plain") || "";

      if (html) {
        const clean = sanitizePastedHtml(html);
        document.execCommand("insertHTML", false, clean);
      } else {
        document.execCommand("insertText", false, text);
      }
      emitChange();
    },
    [emitChange],
  );

  return (
    <div
      ref={ref}
      contentEditable
      className={className}
      data-placeholder={placeholder}
      onInput={emitChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      suppressContentEditableWarning
    />
  );
}
