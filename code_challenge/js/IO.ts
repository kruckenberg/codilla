import stripAnsi from "strip-ansi";
import type {
  EditorView,
  JSONReport,
  Logger,
  WebContainerProcess,
} from "./types";

export class IO {
  logger: Logger;
  editor: EditorView;
  output: EditorView;

  constructor({
    logger,
    editor,
    output,
  }: {
    logger: Logger;
    editor: EditorView;
    output: EditorView;
  }) {
    this.logger = logger;
    this.editor = editor;
    this.output = output;
  }

  clearOutput() {
    this.output.dispatch({
      changes: {
        from: 0,
        to: this.output.state.doc.length,
        insert: "",
      },
    });
  }

  get editorState() {
    return this.editor.state.doc.toString();
  }

  makeAnsiStripper() {
    return new TransformStream({
      transform: (
        chunk: string,
        controller: TransformStreamDefaultController,
      ) => controller.enqueue(stripAnsi(chunk)),
    });
  }

  makeWriter() {
    const logger = this.logger;
    return new WritableStream({ write: logger });
  }

  overwrite(insert: string) {
    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert,
      },
    });
  }

  pipeOutput(processStream: WebContainerProcess, stripAnsi: boolean = true) {
    if (stripAnsi) {
      processStream.output
        .pipeThrough(this.makeAnsiStripper())
        .pipeTo(this.makeWriter());
    } else {
      processStream.output.pipeTo(this.makeWriter());
    }
  }

  reportTestResults(results: JSONReport) {
    if (!results) {
      this.logger("Test results not found or not parsed.");
      return;
    }

    for (const result of results.tests) {
      if (result.err.message) {
        this.logger(`✗ ${result.fullTitle}\n`);
      } else {
        this.logger(`✓ ${result.fullTitle}\n`);
      }
    }
    this.logger(
      `\n-------------------------------------\n${results.stats.passes} passes, ${results.stats.failures} failures\n`,
    );
  }
}
