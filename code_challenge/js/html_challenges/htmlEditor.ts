import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";
import { API } from "../API";
import { IO } from "../IO";
import { WebServer } from "./WebServer";
import type { FileNode, MetaJSON } from "../types";

/*****************************************************
 * Get HTML elements
 ****************************************************/
const htmlEditorEl = document.getElementById("html-editor");
const cssEditorEl = document.getElementById("css-editor");
const jsEditorEl = document.getElementById("js-editor");
const iframeEl = document.getElementById("served-page");
const outputEl = document.getElementById("output");
const nextChallengeEl = document.getElementById("next-challenge-button");
const resetCodeButtonEl = document.getElementById(
  "reset-code-button",
) as HTMLButtonElement;
const runCodeButtonEl = document.getElementById(
  "run-code-button",
) as HTMLButtonElement;
const saveCodeButtonEl = document.getElementById(
  "save-code-button",
) as HTMLButtonElement;
const testCodeButtonEl = document.getElementById(
  "test-code-button",
) as HTMLButtonElement;
const csrfToken =
  document.getElementById("csrf-token")?.getAttribute("data-csrf-token") || "";

if (
  !htmlEditorEl ||
  !cssEditorEl ||
  !jsEditorEl ||
  !nextChallengeEl ||
  !iframeEl ||
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
} catch (_error) {
  throw new Error("Failed to parse challenge metadata");
}

const files = metaJSON.file_system;
const hasTests = metaJSON.has_tests;

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

let initialOutputState = EditorState.create({
  doc: "",
  extensions: [EditorState.readOnly.of(true), dracula, extendTheme],
});

let htmlEditorState = EditorState.create({
  doc: (files["index.html"] as FileNode).file.contents as string,
  extensions: [basicSetup, dracula, extendTheme, html()],
});

let htmlEditorView = new EditorView({
  state: htmlEditorState,
  parent: htmlEditorEl,
});

let htmlOutputView = new EditorView({
  state: initialOutputState,
  parent: outputEl,
});

let dummyOutputView = new EditorView({
  state: initialOutputState,
});

let cssEditorState = EditorState.create({
  doc: (files["styles.css"] as FileNode).file.contents as string,
  extensions: [basicSetup, dracula, extendTheme, css()],
});

let cssEditorView = new EditorView({
  state: cssEditorState,
  parent: cssEditorEl,
});

let jsEditorState = EditorState.create({
  doc: (files["script.js"] as FileNode).file.contents as string,
  extensions: [basicSetup, dracula, extendTheme, javascript()],
});

let jsEditorView = new EditorView({
  state: jsEditorState,
  parent: jsEditorEl,
});

function logToOutput(message: string) {
  htmlOutputView.dispatch({
    changes: [{ from: htmlOutputView.state.doc.length, insert: message }],
  });
}

function dummyLogger(message: string) {}

const htmlIO = new IO({
  editor: htmlEditorView,
  output: htmlOutputView,
  logger: logToOutput,
});

const cssIO = new IO({
  editor: cssEditorView,
  output: dummyOutputView,
  logger: dummyLogger,
});

const jsIO = new IO({
  editor: jsEditorView,
  output: dummyOutputView,
  logger: dummyLogger,
});

/*****************************************************
 * API setup
 ****************************************************/
const api = new API({ csrfToken });

/*****************************************************
 * Container setup
 ****************************************************/
const container = new WebServer({
  api,
  iframe: iframeEl as HTMLIFrameElement,
  htmlIO,
  cssIO,
  jsIO,
  meta: metaJSON,
});

window.addEventListener("load", async () => {
  await container.init();

  /*****************************************************
   * Action buttons
   ****************************************************/
  [
    runCodeButtonEl,
    saveCodeButtonEl,
    testCodeButtonEl,
    resetCodeButtonEl,
  ].forEach((el) => {
    el.disabled = false;
  });

  runCodeButtonEl.addEventListener("click", async () => container.run());

  saveCodeButtonEl.addEventListener("click", async () => container.save());

  testCodeButtonEl.addEventListener("click", async () => {
    await container.save();

    if (hasTests) {
      const passed = await container.test();
      if (passed) {
        nextChallengeEl.style.display = "block";
      }
    } else {
      nextChallengeEl.style.display = "block";
    }
  });

  resetCodeButtonEl.addEventListener("click", async () => container.reset());
});
