import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";
import { files } from "./fileSystem";
import { CodeContainer } from "./webContainer";

import type { FileNode } from "./types";

/*****************************************************
 * Get HTML elements
 ****************************************************/
const codeEditorEl = document.getElementById("code-editor");
const outputEl = document.getElementById("output");
const runCodeButtonEl = document.getElementById("run-code-button");

if (!codeEditorEl || !outputEl || !runCodeButtonEl) {
  throw new Error("Missing required HTML elements");
}

/*****************************************************
 * Init codemirror editor
 ****************************************************/
let extendTheme = EditorView.theme({
  "&": {
    height: "100%",
    "border-radius": "5px",
    fontSize: "1.15rem",
  },
  ".cm-scroller": {
    "border-radius": "5px",
    overflow: "auto",
  },
});

let editorState = EditorState.create({
  doc: (files["source.js"] as FileNode).file.contents as string,
  extensions: [basicSetup, dracula, extendTheme, javascript()],
});

let editorView = new EditorView({
  state: editorState,
  parent: codeEditorEl,
});

let initialOutputState = EditorState.create({
  doc: "",
  extensions: [EditorState.readOnly.of(true), dracula, extendTheme],
});

let outputView = new EditorView({
  state: initialOutputState,
  parent: outputEl,
});

function logToOutput(message: string) {
  outputView.dispatch({
    changes: [{ from: outputView.state.doc.length, insert: message }],
  });
}

function clearOutput() {
  outputView.setState(initialOutputState);
}

/*****************************************************
 * Container setup
 ****************************************************/
const container = new CodeContainer({ files, logger: logToOutput });

/*****************************************************
 * Action buttons
 ****************************************************/
runCodeButtonEl.addEventListener("click", async () => {
  clearOutput();
  container.writeSource(editorView.state.doc.toString());
  container.runCode();
});
