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
    fontSize: "1.15rem",
  },
  ".cm-scroller": {
    "border-radius": "5px",
    overflow: "auto",
  },
});

let editorState = EditorState.create({
  doc: JSON.parse(document.getElementById("starterCode").textContent),
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

/*****************************************************
 * Create web worker, handler
 ****************************************************/
if (window.Worker) {
  const worker = new Worker("/static/js/worker.js");

  worker.onmessage = (msg) => {
    console.log(msg.data);
    const consoleOutput =
      msg.data && msg.data.length
        ? msg.data.map(({ type, message }) => message.join(" ")).join("\n")
        : "No console output";

    outputView.setState(outputState);
    outputView.dispatch({
      changes: [{ from: 0, insert: consoleOutput }],
    });
  };

  const runCodeButton = document.getElementById("run-code-button");
  runCodeButton.addEventListener("click", () => {
    const sourceCode = editorView.state.doc.toString();
    worker.postMessage(sourceCode);
  });
}
