import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import type { API, FileSystemTree, IO, JSONReport, MetaJSON } from "../types";

export class WebServer {
  api: API;
  iframe: HTMLIFrameElement;
  io: IO;
  meta: MetaJSON;

  container: WebContainer;

  files: FileSystemTree;

  constructor({
    api,
    iframe,
    io,
    meta,
  }: {
    api: API;
    iframe: HTMLIFrameElement;
    io: IO;
    meta: MetaJSON;
  }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.api = api;
    this.io = io;
    this.meta = meta;
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
      this.io.logger("Test results not found or not parsed.");
      return false;
    }

    this.io.reportTestResults(results);
    return results.tests.every((result) => !result.err.message);
  }

  async reset() {
    this.io.overwrite(this.meta.starter_code);
    await this.writeSource(this.meta.starter_code);
    this.api.reset(this.meta.lesson_id);
  }

  async run() {
    try {
      await this.writeSource(this.io.editorState);
      this.save();
    } catch (error) {
      this.io.logger(error?.message || "Something went wrong");
    }
  }

  async save() {
    const code = this.io.editorState;
    try {
      await this.api.save(this.meta.lesson_id, code);
    } catch (error) {
      this.io.logger("Failed to save code");
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
    this.io.clearOutput();

    try {
      await this.writeSource(this.io.editorState);
    } catch (error) {
      return false;
    }

    if (!this.meta.has_tests) {
      if (this.meta.user.authenticated) {
        this.api.markComplete(this.meta.lesson_id, this.io.editorState);
      }
      window.location.assign(this.meta.next_lesson.link);
      return true;
    }

    const response = await this.container.spawn("npm", ["test"]);

    if (await response.exit) {
      this.io.logger("Something went wrong while running tests");
      return false;
    }

    const passed = await this.processTestResults();

    if (passed) {
      if (this.meta.user.authenticated) {
        this.api.markComplete(this.meta.lesson_id, this.io.editorState);
      }
    } else {
      this.api.save(this.meta.lesson_id, this.io.editorState);
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
    const logger = this.io.logger;
    return new WritableStream({ write: logger });
  }

  private async writeSource(source: string) {
    await this.container.fs.writeFile("index.html", source);
  }
}
