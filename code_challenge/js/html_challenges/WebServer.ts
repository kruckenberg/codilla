import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import type {
  API,
  FileSystemTree,
  HTMLStarterCode,
  IO,
  JSONReport,
  MetaJSON,
} from "../types";

export class WebServer {
  api: API;
  iframe: HTMLIFrameElement;
  htmlIO: IO;
  cssIO: IO;
  jsIO: IO;
  meta: MetaJSON;
  starter_code: HTMLStarterCode;

  container: WebContainer;

  files: FileSystemTree;

  constructor({
    api,
    iframe,
    htmlIO,
    cssIO,
    jsIO,
    meta,
  }: {
    api: API;
    iframe: HTMLIFrameElement;
    htmlIO: IO;
    cssIO: IO;
    jsIO: IO;
    meta: MetaJSON;
  }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.api = api;
    this.htmlIO = htmlIO;
    this.cssIO = cssIO;
    this.jsIO = jsIO;
    this.meta = meta;
    this.starter_code = this.parseStarterCode(meta.starter_code);
    this.files = meta?.file_system;
    this.iframe = iframe;
  }

  async installDependencies() {
    const installProcess = await this.container.spawn("npm", ["install"]);
    return installProcess.exit;
  }

  async processTestResults() {
    let results: JSONReport;

    try {
      results = JSON.parse(
        await this.container.fs.readFile("test-results.json", "utf-8"),
      );
    } catch (error) {
      this.htmlIO.logger("Test results not found or not parsed.");
      return false;
    }

    this.htmlIO.reportTestResults(results);
    return results.tests.every((result) => !result.err.message);
  }

  async reset() {
    this.htmlIO.overwrite(this.starter_code.html);
    this.cssIO.overwrite(this.starter_code.css);
    this.jsIO.overwrite(this.starter_code.js);
    await this.writeSource();
    this.api.reset(this.meta.lesson_id);
  }

  async run() {
    try {
      await this.writeSource();
      this.save();
    } catch (error) {
      this.htmlIO.logger(error?.message || "Something went wrong");
    }
  }

  async save() {
    const html = this.htmlIO.editorState;
    const css = this.cssIO.editorState;
    const js = this.jsIO.editorState;

    try {
      await this.api.save(
        this.meta.lesson_id,
        JSON.stringify({ html, css, js }),
      );
    } catch (error) {
      this.htmlIO.logger("Failed to save code");
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

      const placeholder = document.getElementById("iframe-placeholder");
      if (placeholder) {
        placeholder.style.display = "none";
      }
      this.iframe.style.display = "block";
    });
  }

  async test() {
    this.htmlIO.clearOutput();

    try {
      await this.writeSource();
    } catch (error) {
      return false;
    }

    if (!this.meta.has_tests) {
      if (this.meta.user.authenticated) {
        this.api.markComplete(this.meta.lesson_id, this.htmlIO.editorState);
      }
      window.location.assign(this.meta.next_lesson.link);
      return true;
    }

    const response = await this.container.spawn("npm", ["test"]);

    if (await response.exit) {
      this.htmlIO.logger("Something went wrong while running tests");
      return false;
    }

    const passed = await this.processTestResults();

    if (passed) {
      if (this.meta.user.authenticated) {
        this.api.markComplete(this.meta.lesson_id, this.htmlIO.editorState);
      }
    } else {
      this.api.save(this.meta.lesson_id, this.htmlIO.editorState);
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

  private makeAnsiStripper() {
    return new TransformStream({
      transform: (
        chunk: string,
        controller: TransformStreamDefaultController,
      ) => controller.enqueue(stripAnsi(chunk)),
    });
  }

  private makeWriter() {
    const logger = this.htmlIO.logger;
    return new WritableStream({ write: logger });
  }

  private parseStarterCode(raw: string): HTMLStarterCode {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return { html: raw, css: "", js: "" };
    }
  }

  private async writeSource() {
    await Promise.allSettled([
      this.container.fs.writeFile("index.html", this.htmlIO.editorState),
      this.container.fs.writeFile("styles.css", this.cssIO.editorState),
      this.container.fs.writeFile("script.js", this.jsIO.editorState),
    ]);
  }
}
