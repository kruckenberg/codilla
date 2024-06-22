import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";

/*****************************************************
 * Init codemirror editor
 ****************************************************/
let extendTheme = EditorView.theme({
  "&": {
    height: "100%",
    "border-radius": "5px",
    fontSize: "1.25rem",
  },
  ".cm-scroller": {
    "border-radius": "5px",
    overflow: "auto",
  },
});

let state = EditorState.create({
  doc: JSON.parse(document.getElementById("starterCode").textContent),
  extensions: [basicSetup, dracula, extendTheme, javascript()],
});

let view = new EditorView({
  state: state,
  parent: document.getElementById("code-editor"),
});

/*****************************************************
 * Create web worker, handler
 ****************************************************/
if (window.Worker) {
  const worker = new Worker("/static/js/worker.js");
  const outputContainer = document.getElementById("output");

  worker.onmessage = (msg) => {
    outputContainer.innerHTML = msg.data;
  };

  const runCodeButton = document.getElementById("run-code-button");
  runCodeButton.addEventListener("click", () => {
    const rawCode = view.state.doc.toString();
    worker.postMessage(rawCode);
  });
}
