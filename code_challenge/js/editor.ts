import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";
import { API } from "./API";
import { CodeContainer } from "./CodeContainer";
import { IO } from "./IO";
import { getElementById } from "./utils";
import type { FileNode, MetaJSON } from "./types";

/*****************************************************
 * Get HTML elements
 ****************************************************/
const codeEditorEl = getElementById<HTMLElement>("code-editor");
const outputEl = getElementById<HTMLElement>("output");
const nextChallengeEl = getElementById<HTMLButtonElement>(
  "next-challenge-button",
);
const resetConfirmationModalEl =
  getElementById<HTMLDialogElement>("confirm-modal");
const confirmResetButtonEl = getElementById<HTMLButtonElement>(
  "confirm-reset-button",
);
const rejectResetButtonEl = getElementById<HTMLButtonElement>(
  "reject-reset-button",
);
const resetCodeButtonEl =
  getElementById<HTMLButtonElement>("reset-code-button");
const runCodeButtonEl = getElementById<HTMLButtonElement>("run-code-button");
const saveCodeButtonEl = getElementById<HTMLButtonElement>("save-code-button");
const testCodeButtonEl = getElementById<HTMLButtonElement>("test-code-button");

/*****************************************************
 * Get dynamic data
 ****************************************************/
const csrfToken =
  document.getElementById("csrf-token")?.getAttribute("data-csrf-token") || "";

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
 * Container setup
 ****************************************************/
const container = new CodeContainer({
  api,
  io,
  meta: metaJSON,
});
container.init();

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

runCodeButtonEl.addEventListener("click", async () => container.run());

saveCodeButtonEl.addEventListener("click", async () => container.save());

testCodeButtonEl.addEventListener("click", async () => {
  const passed = await container.test();
  if (passed) {
    nextChallengeEl.style.display = "block";
  }
});

resetCodeButtonEl.addEventListener("click", () => {
  resetConfirmationModalEl.showModal();
});
rejectResetButtonEl.addEventListener("click", () => {
  resetConfirmationModalEl.close();
});
confirmResetButtonEl.addEventListener("click", async () => {
  container.reset();
  resetConfirmationModalEl.close();
});
