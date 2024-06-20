import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";

let theme = EditorView.theme({
  "&": { height: "100%" },
  ".cm-scroller": { overflow: "auto" },
});

let state = EditorState.create({
  doc: JSON.parse(document.getElementById("starterCode").textContent),
  extensions: [basicSetup, theme, javascript()],
});

let view = new EditorView({
  state: state,
  parent: document.getElementById("code-editor"),
});
