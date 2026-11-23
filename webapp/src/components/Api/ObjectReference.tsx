import type { CSSProperties } from "react";

// An object reference is aligned columns: field, type, then " - " and a
// note. From sm up, each line gets a hanging indent at its note column, so a
// long note wraps under itself instead of running off the edge; the text is
// monospace, so "ch" units match the columns exactly. Phones are too narrow
// for the field and type columns plus a note, so there the block keeps one
// line per field and scrolls sideways.
function ObjectReference({ text }: { text: string }) {
  return (
    <pre
      tabIndex={0}
      className="bg-(--surface-alt) rounded p-3 text-xs whitespace-pre sm:whitespace-pre-wrap overflow-x-auto border border-(--border-color) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
    >
      {text.split("\n").map((line, index) => {
        const hasNote = line.includes(" - ");
        const noteColumn = line.indexOf(" - ") + " - ".length;
        return (
          <span
            key={`${index.toString()}-${line}`}
            className={
              hasNote
                ? "block sm:pl-(--note-column) sm:-indent-(--note-column)"
                : "block"
            }
            style={
              hasNote
                ? ({
                    "--note-column": `${noteColumn.toString()}ch`,
                  } as CSSProperties)
                : undefined
            }
          >
            {line}
          </span>
        );
      })}
    </pre>
  );
}

export { ObjectReference };
