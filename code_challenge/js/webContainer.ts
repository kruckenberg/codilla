import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import { addExports, lint } from "./codeAnalysis";
import type {
  EditorView,
  FileSystemTree,
  JSONReport,
  Logger,
  MetaJSON,
  Terminal,
  WebContainerProcess,
} from "./types";

export class CodeContainer {
  apiRoot: string;
  csrfToken: string;
  meta: MetaJSON;
  logger: Logger;
  editor: EditorView;
  output: EditorView;

  container: WebContainer;

  files: FileSystemTree;

  constructor({
    meta,
    logger,
    editor,
    output,
    apiRoot,
    csrfToken,
  }: {
    meta: MetaJSON;
    logger: Logger;
    editor: EditorView;
    output: EditorView;
    apiRoot: string;
    csrfToken: string;
  }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.meta = meta;
    this.apiRoot = apiRoot;
    this.csrfToken = csrfToken;
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
    this.callApi(
      "reset",
      { lesson_id: this.meta.lesson_id },
      { method: "PUT" },
    );
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
      await this.callApi(
        "save",
        { lesson_id: this.meta.lesson_id, code },
        { method: "PUT" },
      );
    } catch (error) {
      this.logger("Failed to save code");
    }
  }

  async startShell(terminal: Terminal): Promise<WebContainerProcess> {
    const shellProcess = await this.container.spawn("jsh", {
      terminal: { cols: terminal.cols, rows: terminal.rows },
    });
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          // Hack to clear shell startup output
          if (data.includes('Type ".help" for more information')) {
            terminal.clear();
            terminal.focus();
            return;
          }
          terminal.write(data);
        },
      }),
    );
    const input = shellProcess.input.getWriter();
    terminal.onData((data: string) => {
      input.write(data);
    });

    terminal.input("node\n", false);

    return shellProcess;
  }

  async test() {
    this.clearOutput();

    try {
      await this.writeSource(
        this.editor.state.doc.toString(),
        this.meta.exports,
      );
    } catch (error) {
      return;
    }

    if (!this.meta.has_tests) {
      if (this.meta.user.authenticated) {
        this.callApi(
          "complete",
          {
            lesson_id: this.meta.lesson_id,
            code: this.editor.state.doc.toString(),
          },
          { method: "PUT" },
        );
      }
      window.location.assign(this.meta.next_lesson.link);
      return;
    }

    const response = await this.container.spawn("npm", ["test"]);

    if (await response.exit) {
      this.logger("Something went wrong while running tests");
      return;
    }

    const passed = await this.reportTestResults();

    if (passed) {
      this.logger("Next lesson in 5 seconds...");
      setTimeout(
        () => window.location.assign(this.meta.next_lesson.link),
        5000,
      );

      if (this.meta.user.authenticated) {
        this.callApi(
          "complete",
          {
            lesson_id: this.meta.lesson_id,
            code: this.editor.state.doc.toString(),
          },
          { method: "PUT" },
        );
      }
    } else {
      this.callApi(
        "save",
        {
          lesson_id: this.meta.lesson_id,
          code: this.editor.state.doc.toString(),
        },
        { method: "PUT" },
      );
    }
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

  private getApiPath(op: string) {
    const pathMap = {
      complete: "/complete",
      reset: "/reset",
      save: "/save",
    };

    return `${this.apiRoot}${pathMap[op]}`;
  }

  private async callApi(
    op: "complete" | "reset" | "save",
    payload: object,
    options: { method?: string },
  ) {
    fetch(this.getApiPath(op), {
      method: options.method || "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.csrfToken,
      },
      body: JSON.stringify(payload),
    });
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
