import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import type {
  API,
  EditorView,
  FileSystemTree,
  JSONReport,
  Logger,
  MetaJSON,
} from "../types";

export class WebServer {
  api: API;
  meta: MetaJSON;
  logger: Logger;
  editor: EditorView;
  output: EditorView;
  iframe: HTMLIFrameElement;

  container: WebContainer;

  files: FileSystemTree;

  constructor({
    api,
    meta,
    logger,
    editor,
    output,
    iframe,
  }: {
    api: API;
    meta: MetaJSON;
    logger: Logger;
    editor: EditorView;
    output: EditorView;
    iframe: HTMLIFrameElement;
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
    this.api.reset(this.meta.lesson_id);
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
      await this.api.save(this.meta.lesson_id, code);
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
      await this.installDependencies();
      this.serve();
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

  private async writeSource(source: string) {
    await this.container.fs.writeFile("index.html", source);
  }
}
