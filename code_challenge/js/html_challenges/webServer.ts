import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import type {
  EditorView,
  FileSystemTree,
  JSONReport,
  Logger,
  MetaJSON,
} from "../types";

export class WebServer {
  apiRoot: string;
  csrfToken: string;
  meta: MetaJSON;
  logger: Logger;
  editor: EditorView;
  output: EditorView;
  iframe: HTMLIFrameElement;

  container: WebContainer;

  files: FileSystemTree;

  constructor({
    meta,
    logger,
    editor,
    output,
    iframe,
    apiRoot,
    csrfToken,
  }: {
    meta: MetaJSON;
    logger: Logger;
    editor: EditorView;
    output: EditorView;
    iframe: HTMLIFrameElement;
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
    this.iframe = iframe;
  }

  async installDependencies() {
    const installProcess = await this.container.spawn("npm", ["install"]);
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      }),
    );
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
    await this.writeSource(this.meta.starter_code);
    this.callApi(
      "reset",
      { lesson_id: this.meta.lesson_id },
      { method: "PUT" },
    );
  }

  async run() {
    try {
      await this.writeSource(this.editor.state.doc.toString());
      this.save();
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

  async serve() {
    const serverProcess = await this.container.spawn("npm", ["run", "start"]);

    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      }),
    );

    this.container.on("server-ready", (port, url) => {
      this.iframe.src = url;
    });
  }

  async test() {
    this.clearOutput();

    try {
      await this.writeSource(this.editor.state.doc.toString());
    } catch (error) {
      return false;
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

    return passed;
  }

  async init() {
    if (!this.container) {
      this.container = await WebContainer.boot();
      this.files && (await this.container.mount(this.files));
      await this.installDependencies();
      this.serve();
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

  private async writeSource(source: string) {
    await this.container.fs.writeFile("index.html", source);
  }
}
