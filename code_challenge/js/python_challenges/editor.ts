import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { dracula } from "thememirror";
import { API } from "../API";
import { IO } from "../IO";
import type { FileNode, MetaJSON, PyodideInterface } from "../types";

declare var loadPyodide: () => Promise<PyodideInterface>;

/*****************************************************
 * Get HTML elements
 ****************************************************/
const codeEditorEl = document.getElementById("code-editor");
const outputEl = document.getElementById("output");
const resetCodeButtonEl = document.getElementById("reset-code-button");
const runCodeButtonEl = document.getElementById("run-code-button");
const saveCodeButtonEl = document.getElementById("save-code-button");
const testCodeButtonEl = document.getElementById("test-code-button");
const csrfToken =
  document.getElementById("csrf-token")?.getAttribute("data-csrf-token") || "";
const nextChallengeEl = document.getElementById("next-challenge-button");

if (
  !codeEditorEl ||
  !nextChallengeEl ||
  !outputEl ||
  !resetCodeButtonEl ||
  !runCodeButtonEl ||
  !saveCodeButtonEl ||
  !testCodeButtonEl
) {
  throw new Error("Missing required HTML elements");
}

let metaJSON: MetaJSON;
try {
  metaJSON = JSON.parse(
    document.getElementById("meta-json")?.textContent || "",
  );
} catch (error) {
  throw new Error("Failed to parse challenge metadata");
}

const files = metaJSON.file_system;

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
  doc: (files["source.py"] as FileNode).file.contents as string,
  extensions: [basicSetup, dracula, extendTheme, python()],
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

const io = new IO({
  editor: editorView,
  output: outputView,
  logger: logToOutput,
});

/*****************************************************
 * API setup
 ****************************************************/
const api = new API({ csrfToken });

/*****************************************************
 * Init pyodide
 ****************************************************/
async function initPyodide() {
  globalThis.pyodideReady = false;
  globalThis.pyodide = await loadPyodide();
  globalThis.pyodide.setStdout({
    batched: io.logger,
  });
  globalThis.pyodideReady = true;
}
initPyodide();

/*****************************************************
 * Action buttons
 ****************************************************/
[
  runCodeButtonEl,
  saveCodeButtonEl,
  testCodeButtonEl,
  resetCodeButtonEl,
].forEach((el) => {
  el.addEventListener("click", () => {
    nextChallengeEl.style.display = "none";
  });
});

runCodeButtonEl.addEventListener("click", () => {
  io.clearOutput();
  globalThis.pyodide.runPython(io.editorState);
});

saveCodeButtonEl.addEventListener("click", async () => {
  api.save(metaJSON.lesson_id, io.editorState);
});

testCodeButtonEl.addEventListener("click", async () => {
  // TODO: implement test code
  const passed = true;
  if (passed) {
    nextChallengeEl.style.display = "block";
  }
});

resetCodeButtonEl.addEventListener("click", async () => undefined);
