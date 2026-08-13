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

function flattenedText(node) {
  let result = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === TEXT_NODE) {
      result += child.textContent ?? "";
      return;
    }
    if (child.nodeType !== ELEMENT_NODE) return;
    if (child.tagName === "BR") {
      result += "\n";
      return;
    }
    const isBlock = child.tagName === "DIV" || child.tagName === "P";
    if (isBlock && result && !result.endsWith("\n")) result += "\n";
    result += flattenedText(child);
    if (isBlock && !result.endsWith("\n")) result += "\n";
  });
  return result;
}

function getCaretAnchor(editor) {
  const selection = window.getSelection();
  if (!selectionIsInside(editor, selection) || !selection.isCollapsed) return null;

  const range = selection.getRangeAt(0).cloneRange();
  range.setStart(editor, 0);
  const fragment = range.cloneContents();
  const holder = document.createElement("div");
  holder.appendChild(fragment);
  const before = flattenedText(holder);
  return {
    before,
    context: before.slice(-64),
  };
}

function placeCaretAtTextOffset(editor, requestedOffset) {
  let remaining = Math.max(0, requestedOffset);
  let lastTextNode = null;
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === TEXT_NODE) {
        lastTextNode = child;
        const length = child.textContent?.length ?? 0;
        if (remaining <= length) {
          range.setStart(child, remaining);
          return true;
        }
        remaining -= length;
        continue;
      }
      if (child.nodeType !== ELEMENT_NODE) continue;
      if (child.tagName === "BR") {
        if (remaining <= 1) {
          range.setStartAfter(child);
          return true;
        }
        remaining -= 1;
        continue;
      }
      if (walk(child)) return true;
    }
    return false;
  };

  if (!walk(editor)) {
    if (lastTextNode) {
      range.setStart(lastTextNode, lastTextNode.textContent?.length ?? 0);
    } else {
      range.setStart(editor, editor.childNodes.length);
    }
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function restoreCaretAnchor(editor, anchor) {
  if (!anchor) return;
  const nextText = flattenedText(editor);
  const contextIndex = anchor.context
    ? nextText.lastIndexOf(anchor.context)
    : -1;
  const offset =
    contextIndex >= 0
      ? contextIndex + anchor.context.length
      : Math.min(anchor.before.length, nextText.length);
  placeCaretAtTextOffset(editor, offset);
}

function restoreCollapsedSelection(node, offset) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStart(node, Math.max(0, Math.min(offset, node.textContent?.length ?? 0)));
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function adjustCurrentLineIndent(editor, direction) {
  const selection = window.getSelection();
  if (!selectionIsInside(editor, selection) || !selection.isCollapsed) {
    editor.focus();
    return false;
  }

  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== TEXT_NODE) {
    if (direction > 0) document.execCommand("insertText", false, "    ");
    return direction > 0;
  }

  const value = node.textContent ?? "";
  const offset = range.startOffset;
  const lineStart = value.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;

  if (direction > 0) {
    node.textContent = `${value.slice(0, lineStart)}    ${value.slice(lineStart)}`;
    restoreCollapsedSelection(node, offset + 4);
    return true;
  }

  const removable = value.slice(lineStart).match(/^ {1,4}/)?.[0].length ?? 0;
  if (!removable) return false;
  node.textContent = `${value.slice(0, lineStart)}${value.slice(lineStart + removable)}`;
  restoreCollapsedSelection(node, Math.max(lineStart, offset - removable));
  return true;
}

function getCurrentLineBeforeCaret(editor) {
  const before = getCaretAnchor(editor)?.before.replace(/\u00a0/g, " ") ?? "";
  return before.split("\n").at(-1) ?? "";
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
    readOnly = false,
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

  const applyIndent = useCallback(
    (direction) => {
      const editor = editorRef.current;
      if (!editor || readOnly) return { ok: false };
      editor.focus();
      const ok = adjustCurrentLineIndent(editor, direction);
      if (ok) emitChange();
      return { ok };
    },
    [emitChange, readOnly],
  );

  const applyHistory = useCallback(
    (command) => {
      const editor = editorRef.current;
      if (!editor || readOnly) return { ok: false };
      editor.focus();
      const ok = document.execCommand(command);
      if (ok) emitChange();
      return { ok };
    },
    [emitChange, readOnly],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      applyFormat,
      applyIndent,
      applyHistory,
      focus: () => editorRef.current?.focus(),
    }),
    [applyFormat, applyHistory, applyIndent],
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
    const editor = editorRef.current;
    const anchor = document.activeElement === editor ? getCaretAnchor(editor) : null;
    editor.innerHTML = canonicalToEditorHtml(current);
    lastValueRef.current = current;
    restoreCaretAnchor(editor, anchor);
  }, [value]);

  const handleKeyDown = useCallback(
    (event) => {
      if (readOnly) return;

      if (event.key === "Tab") {
        event.preventDefault();
        const result = applyIndent(event.shiftKey ? -1 : 1);
        onShortcut?.(event.shiftKey ? "outdent" : "indent", result);
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        const editor = editorRef.current;
        const currentLine = editor ? getCurrentLineBeforeCaret(editor) : "";
        const bullet = currentLine.match(/^(\s*)(?:[-*+]|(?:\d+)[.)])\s+/);
        if (bullet) {
          event.preventDefault();
          const indentation = bullet[1].length === 0 ? "    " : bullet[1];
          document.execCommand("insertHTML", false, `<br>${indentation}- `);
          emitChange();
          return;
        }
      }

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
    [applyFormat, applyIndent, emitChange, onShortcut, readOnly],
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
      contentEditable={!readOnly}
      role="textbox"
      aria-label={ariaLabel}
      aria-readonly={readOnly}
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
