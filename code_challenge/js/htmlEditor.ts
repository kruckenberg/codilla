import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import { dracula } from "thememirror";
// import { CodeContainer } from "./webContainer";
import type { FileNode, MetaJSON } from "./types";

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
// const nextChallengeEl = document.getElementById("next-challenge-button");

if (
  !codeEditorEl ||
  // !nextChallengeEl ||
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
  doc: (files["source.html"] as FileNode).file.contents as string,
  extensions: [basicSetup, dracula, extendTheme, html()],
});

let editorView = new EditorView({
  state: editorState,
  parent: codeEditorEl,
});

// let initialOutputState = EditorState.create({
//   doc: "",
//   extensions: [EditorState.readOnly.of(true), dracula, extendTheme],
// });
//
// let outputView = new EditorView({
//   state: initialOutputState,
//   parent: outputEl,
// });
//
// function logToOutput(message: string) {
//   outputView.dispatch({
//     changes: [{ from: outputView.state.doc.length, insert: message }],
//   });
// }
//
// /*****************************************************
//  * Container setup
//  ****************************************************/
// const container = new CodeContainer({
//   apiRoot: "/codilla/api/challenge",
//   csrfToken: csrfToken,
//   meta: metaJSON,
//   logger: logToOutput,
//   editor: editorView,
//   output: outputView,
// });
// container.init();
//
// /*****************************************************
//  * Action buttons
//  ****************************************************/
// [
//   runCodeButtonEl,
//   saveCodeButtonEl,
//   testCodeButtonEl,
//   resetCodeButtonEl,
// ].forEach((el) => {
//   el.addEventListener("click", () => {
//     nextChallengeEl.style.display = "none";
//   });
// });
//
runCodeButtonEl.addEventListener("click", () => {
  const iframe = document.getElementById("output") as HTMLIFrameElement;
  const iframeDoc = iframe?.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc) {
    return;
  }

  iframeDoc.open();
  iframeDoc.write(editorView.state.doc.toString());
  iframeDoc.close();
});
//
// saveCodeButtonEl.addEventListener("click", async () => container.save());
//
// testCodeButtonEl.addEventListener("click", async () => {
//   const passed = await container.test();
//   if (passed) {
//     nextChallengeEl.style.display = "block";
//   }
// });
//
// resetCodeButtonEl.addEventListener("click", async () => container.reset());
