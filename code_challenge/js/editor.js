import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";
import { files } from "./fileSystem.js";

import { exec, getWebContainer } from "./webContainer.js";

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
  doc: files["source.js"].file.contents,
  extensions: [basicSetup, dracula, extendTheme, javascript()],
});

let editorView = new EditorView({
  state: editorState,
  parent: document.getElementById("code-editor"),
});

let outputState = EditorState.create({
  doc: "",
  extensions: [EditorState.readOnly.of(true), dracula, extendTheme],
});

let outputView = new EditorView({
  state: outputState,
  parent: document.getElementById("output"),
});

const runCodeButton = document.getElementById("run-code-button");
runCodeButton.addEventListener("click", async () => {
  const output = await exec(getWebContainer(), "node", ["source.js"]);

  outputView.setState(outputState);
  outputView.dispatch({ changes: [{ from: 0, insert: output }] });
});
