import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "thememirror";

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
