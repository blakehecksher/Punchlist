# 2026-03-12 0046 WordImportHandoff

## TL;DR
- What changed: Reframed project state around reliable Word-native import, updated decisions to reject raw-text-only `.docx` parsing as the long-term approach, and recorded the current failure mode.
- Why: The office workflow is Word-first, so `.docx` reliability is now a core product requirement rather than a convenience feature.
- What didn't work: Current `.docx` import uses `mammoth.extractRawText(...)`, which strips Word list formatting. Direct paste from Word into a plain textarea also tends to flatten bullet hierarchy.
- Next: Implement a structure-preserving Word import path, evaluate rich-paste handling from Word, and test against real office documents.

---

## Full notes

The current importer is split across two layers:

- `src/importFile.js` reads uploaded files.
- `src/importParser.js` parses normalized bullet and heading text into `siteConditions`, `generalNotes`, and `rooms`.

The parser is workable when the input already contains literal bullet characters, numbering, headings, and indentation. That is why pasted clean text, `.txt`, and `.md` behave better.

The Word problem is upstream of the parser. For `.docx`, the app currently calls:

- `mammoth.extractRawText({ arrayBuffer })`

That API returns flattened text. In Word documents, bullets and nesting are typically stored as paragraph and list metadata, not as literal `-` characters in the text content. Once the import path collapses the document to raw text, the parser no longer has the structure it expects.

Observed practical effect:

- top-level Word bullets may arrive as plain paragraphs
- nested bullets may lose their depth
- section names may survive as text, but without reliable child association
- the imported result can look incomplete or ungrouped even when the Word file is visually correct

Direct paste from Word has a related problem. Pasting into a plain textarea often converts the clipboard payload to flattened text, so list markers and indentation can be inconsistent or lost before parsing.

Decision recorded this session:

- Word import is now considered a core requirement.
- Raw-text-only `.docx` extraction is not a sufficient final implementation.

Recommended implementation direction for the next session:

1. Replace raw `.docx` extraction with a structure-preserving reader that can recover paragraph order, list levels, and section boundaries from Word content.
2. Normalize that recovered structure into the same shape currently expected by `parseImportText(...)`, or evolve the parser to accept a richer intermediate representation.
3. Optionally add a dedicated paste handler for Word clipboard content if office users commonly paste instead of upload.
4. Validate against several real documents written by office staff, not synthetic samples.

No application code changed in this session. This was a documentation and handoff checkpoint to create a clean starting point for the next conversation.
