import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import { addExports, lint } from "./codeAnalysis";
import type {
  API,
  EditorView,
  FileSystemTree,
  JSONReport,
  Logger,
  MetaJSON,
  Terminal,
  WebContainerProcess,
} from "./types";

export class CodeContainer {
  api: API;
  meta: MetaJSON;
  logger: Logger;
  editor: EditorView;
  output: EditorView;

  container: WebContainer;

  files: FileSystemTree;

  constructor({
    api,
    meta,
    logger,
    editor,
    output,
  }: {
    api: API;
    meta: MetaJSON;
    logger: Logger;
    editor: EditorView;
    output: EditorView;
  }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.api = api;
    this.meta = meta;
    this.files = meta?.file_system;
    this.logger = logger;
    this.editor = editor;
    this.output = output;
  }

  async installDependencies() {
    const installProcess = await this.container.spawn("npm", ["install"]);
    return installProcess.exit;
  }

  async reportTestResults() {
    let results: JSONReport;
    let passed = true;

    try {
      results = JSON.parse(
        await this.container.fs.readFile("test-results.json", "utf-8"),
      );
    } catch (error) {
      this.logger("Test results not found or not parsed.");
      return false;
    }

    for (const result of results.tests) {
      if (result.err.message) {
        passed = false;
        this.logger(`✗ ${result.fullTitle}\n`);
      } else {
        this.logger(`✓ ${result.fullTitle}\n`);
      }
    }
    this.logger(
      `\n-------------------------------------\n${results.stats.passes} passes, ${results.stats.failures} failures\n`,
    );

    return passed;
  }

  async reset() {
    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert: this.meta.starter_code,
      },
    });
    await this.writeSource(this.meta.starter_code, false);
    this.api.reset(this.meta.lesson_id);
  }

  async run() {
    try {
      try {
        this.writeSource(this.editor.state.doc.toString(), false);
      } catch (error) {
        return;
      }

      this.save();
      this.clearOutput();

      const response = await this.container.spawn("node", ["source.js"]);

      response.output
        .pipeThrough(this.makeAnsiStripper())
        .pipeTo(this.makeWriter());

      const exitCode = await response.exit;
      if (exitCode) {
        throw new Error(`Process exited with code ${exitCode}`);
      }
    } catch (error) {
      this.logger(error?.message || "Something went wrong");
    }
  }

  async save() {
    const code = this.editor.state.doc.toString();
    try {
      await this.api.save(this.meta.lesson_id, code);
    } catch (error) {
      this.logger("Failed to save code");
    }
  }

  async test() {
    this.clearOutput();

    try {
      await this.writeSource(
        this.editor.state.doc.toString(),
        this.meta.exports,
      );
    } catch (error) {
      return false;
    }

    if (!this.meta.has_tests) {
      if (this.meta.user.authenticated) {
        this.api.markComplete(
          this.meta.lesson_id,
          this.editor.state.doc.toString(),
        );
      }
      window.location.assign(this.meta.next_lesson.link);
      return true;
    }

    const response = await this.container.spawn("npm", ["test"]);

    if (await response.exit) {
      this.logger("Something went wrong while running tests");
      return false;
    }

    const passed = await this.reportTestResults();

    if (passed) {
      if (this.meta.user.authenticated) {
        this.api.markComplete(
          this.meta.lesson_id,
          this.editor.state.doc.toString(),
        );
      }
    } else {
      this.api.save(this.meta.lesson_id, this.editor.state.doc.toString());
    }

    return passed;
  }

  async init() {
    if (!this.container) {
      this.container = await WebContainer.boot();
      this.files && (await this.container.mount(this.files));
      // only install dependencies if tests exist
      if (this.files?.["test.js"]) {
        await this.installDependencies();
      }
    }
  }

  private clearOutput() {
    this.output.dispatch({
      changes: {
        from: 0,
        to: this.output.state.doc.length,
        insert: "",
      },
    });
  }

  private makeAnsiStripper() {
    return new TransformStream({
      transform: (
        chunk: string,
        controller: TransformStreamDefaultController,
      ) => controller.enqueue(stripAnsi(chunk)),
    });
  }

  private makeWriter() {
    const logger = this.logger;
    return new WritableStream({ write: logger });
  }

  private async writeSource(source: string, exports: string[] | false) {
    try {
      const modifiedSource = exports
        ? addExports(source, exports)
        : lint(source);
      await this.container.fs.writeFile("source.js", modifiedSource);
    } catch (error) {
      this.logger(error?.message || "Something went wrong");
      throw error;
    }
  }
}
