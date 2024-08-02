import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";
import { CodeContainer } from "./webContainer";
import type { FileNode } from "./types";

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

if (
  !codeEditorEl ||
  !outputEl ||
  !resetCodeButtonEl ||
  !runCodeButtonEl ||
  !saveCodeButtonEl ||
  !testCodeButtonEl
) {
  throw new Error("Missing required HTML elements");
}

let metaJSON;
try {
  metaJSON = JSON.parse(
    document.getElementById("meta-json")?.textContent || "",
  );
} catch (error) {
  throw new Error("Failed to parse challenge metadata");
}

const files = metaJSON.file_system;
const hasTests = metaJSON.has_tests;
const exports = metaJSON.exports || [];
const lesson_id = metaJSON.lesson_id;
const user_authenticated = metaJSON?.user?.authenticated || false;
const next_lesson_link = metaJSON?.next_lesson?.link || "";

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
container.init();

/*****************************************************
 * Actions
 ****************************************************/
async function saveCode() {
  const code = editorView.state.doc.toString();
  await container.writeSource(code);
  fetch("/api/challenge/save", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ lesson_id, code }),
  });
}

/*****************************************************
 * Action buttons
 ****************************************************/
runCodeButtonEl.addEventListener("click", async () => {
  saveCode();
  clearOutput();
  await container.writeSource(editorView.state.doc.toString());
  container.runCode();
});

saveCodeButtonEl.addEventListener("click", saveCode);

testCodeButtonEl.addEventListener("click", async () => {
  const code = editorView.state.doc.toString();
  await container.writeSource(code);
  if (hasTests) {
    clearOutput();
    container.runTest(exports);
    // TODO: handle failed tests
    return;
  }

  if (user_authenticated) {
    const response = await fetch("/api/challenge/complete", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ lesson_id, code }),
    });

    if (response.status === 200) {
      window.location.assign(next_lesson_link);
    }
    // TODO: handle error response
  } else {
    window.location.assign(next_lesson_link);
  }
});

resetCodeButtonEl.addEventListener("click", async () => {
  const code = metaJSON["starter_code"];
  editorView.setState(
    EditorState.create({
      doc: code,
      extensions: [basicSetup, dracula, extendTheme, javascript()],
    }),
  );
  await container.writeSource(code);
  fetch("/api/challenge/reset", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ lesson_id }),
  });
});
