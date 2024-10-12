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

function getElementById<T extends HTMLElement>(elementId: string): T {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Missing required element with ID: ${elementId}`);
  }
  return element as T;
}

/*****************************************************
 * Get HTML elements
 ****************************************************/
const htmlEditorEl = getElementById<HTMLElement>("html-editor");
const cssEditorEl = getElementById<HTMLElement>("css-editor");
const jsEditorEl = getElementById<HTMLElement>("js-editor");
const iframeEl = getElementById<HTMLIFrameElement>("served-page");
const outputEl = getElementById<HTMLElement>("output");
const nextChallengeEl = getElementById<HTMLElement>("next-challenge-button");
const confirmResetModal = getElementById<HTMLDialogElement>("confirm-modal");
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

  confirmResetButtonEl.addEventListener("click", async () => {
    await container.reset();
    confirmResetModal.close();
  });
  rejectResetButtonEl.addEventListener("click", () =>
    confirmResetModal.close(),
  );
  resetCodeButtonEl.addEventListener("click", () =>
    confirmResetModal.showModal(),
  );
});
