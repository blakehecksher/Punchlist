import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function escapeText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function convertInlineMarkers(value) {
  return value
    .replace(/~~([^~\n]+)~~/g, "<s>$1</s>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/__([^_\n]+)__/g, "<u>$1</u>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<i>$2</i>");
}

function sanitizeCanonicalNode(node) {
  let result = "";

  node.childNodes.forEach((child) => {
    if (child.nodeType === TEXT_NODE) {
      result += escapeText(child.textContent ?? "");
      return;
    }
    if (child.nodeType !== ELEMENT_NODE) return;

    const inner = sanitizeCanonicalNode(child);
    const tag = child.tagName;

    if (tag === "B" || tag === "STRONG") result += `<b>${inner}</b>`;
    else if (tag === "I" || tag === "EM") result += `<i>${inner}</i>`;
    else if (tag === "U") result += `<u>${inner}</u>`;
    else if (tag === "S" || tag === "DEL" || tag === "STRIKE") {
      result += `<s>${inner}</s>`;
    } else if (tag === "BR") result += "<br>";
    else result += inner;
  });

  return result;
}

function canonicalToEditorHtml(value) {
  if (!value) return "";
  const withFormatting = convertInlineMarkers(String(value));
  const doc = new DOMParser().parseFromString(
    withFormatting.replace(/\r\n?/g, "\n").replace(/\n/g, "<br>"),
    "text/html",
  );
  return sanitizeCanonicalNode(doc.body);
}

function serializeEditorNode(node) {
  let result = "";

  node.childNodes.forEach((child) => {
    if (child.nodeType === TEXT_NODE) {
      result += escapeText(child.textContent ?? "");
      return;
    }
    if (child.nodeType !== ELEMENT_NODE) return;

    const tag = child.tagName;
    let inner = serializeEditorNode(child);
    const style = (child.getAttribute("style") ?? "").toLowerCase();

    if (tag === "BR") {
      result += "\n";
      return;
    }

    const wrapLines = (tagName) =>
      inner
        .split("\n")
        .map((line) => (line ? `<${tagName}>${line}</${tagName}>` : line))
        .join("\n");

    if (tag === "B" || tag === "STRONG") inner = wrapLines("b");
    else if (tag === "I" || tag === "EM") inner = wrapLines("i");
    else if (tag === "U") inner = wrapLines("u");
    else if (tag === "S" || tag === "DEL" || tag === "STRIKE") {
      inner = wrapLines("s");
    } else {
      if (/font-weight\s*:\s*(bold|[5-9]00)/.test(style)) {
        inner = wrapLines("b");
      }
      if (/font-style\s*:\s*italic/.test(style)) inner = wrapLines("i");
      if (/text-decoration[^;]*underline/.test(style)) {
        inner = wrapLines("u");
      }
      if (/text-decoration[^;]*line-through/.test(style)) {
        inner = wrapLines("s");
      }
    }

    const isBlock = tag === "DIV" || tag === "P" || tag === "LI";
    if (isBlock && result && !result.endsWith("\n")) result += "\n";
    result += inner;
    if (isBlock && !result.endsWith("\n")) result += "\n";
  });

  return result;
}

function editorToCanonical(editor) {
  return serializeEditorNode(editor)
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n+$/g, "");
}

function selectionIsInside(editor, selection) {
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer);
}

const OutlineEditor = forwardRef(function OutlineEditor(
  {
    value,
    onChange,
    onStructuredPaste,
    onShortcut,
    placeholder,
    className,
    ariaLabel,
  },
  forwardedRef,
) {
  const editorRef = useRef(null);
  const lastValueRef = useRef(value ?? "");

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const nextValue = editorToCanonical(editorRef.current);
    lastValueRef.current = nextValue;
    onChange?.(nextValue);
  }, [onChange]);

  const applyFormat = useCallback(
    (command, label) => {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !selectionIsInside(editor, selection) || selection.isCollapsed) {
        editor?.focus();
        return { ok: false, reason: `Select text, then apply ${label}.` };
      }

      document.execCommand(command);
      emitChange();
      editor.focus();
      return { ok: true };
    },
    [emitChange],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      applyFormat,
      focus: () => editorRef.current?.focus(),
    }),
    [applyFormat],
  );

  useLayoutEffect(() => {
    if (!editorRef.current) return;
    const nextHtml = canonicalToEditorHtml(value ?? "");
    editorRef.current.innerHTML = nextHtml;
    lastValueRef.current = value ?? "";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editorRef.current) return;
    const current = value ?? "";
    if (current === lastValueRef.current) return;
    editorRef.current.innerHTML = canonicalToEditorHtml(current);
    lastValueRef.current = current;
  }, [value]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

      const key = event.key.toLowerCase();
      let command = null;
      let label = "";

      if (key === "b") {
        command = "bold";
        label = "bold";
      } else if (key === "u") {
        command = "underline";
        label = "underline";
      } else if (key === "x" && event.shiftKey) {
        command = "strikeThrough";
        label = "strikethrough";
      }

      if (!command) return;
      event.preventDefault();
      const result = applyFormat(command, label);
      onShortcut?.(label, result);
    },
    [applyFormat, onShortcut],
  );

  const handlePaste = useCallback(
    (event) => {
      const clipboard = event.clipboardData;
      const html = clipboard?.getData("text/html") ?? "";
      const converted = html ? onStructuredPaste?.(html) : null;

      event.preventDefault();

      if (converted) {
        document.execCommand(
          "insertHTML",
          false,
          canonicalToEditorHtml(converted),
        );
      } else {
        const text = clipboard?.getData("text/plain") ?? "";
        document.execCommand("insertText", false, text);
      }

      emitChange();
    },
    [emitChange, onStructuredPaste],
  );

  return (
    <div
      ref={editorRef}
      className={className}
      contentEditable
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline="true"
      aria-keyshortcuts="Control+B Meta+B Control+U Meta+U Control+Shift+X Meta+Shift+X"
      data-placeholder={placeholder}
      onInput={emitChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      suppressContentEditableWarning
      spellCheck
    />
  );
});

export default OutlineEditor;
