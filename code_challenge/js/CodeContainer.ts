import { WebContainer } from "@webcontainer/api";
import { addExports, lint } from "./codeAnalysis";
import type { API, FileSystemTree, IO, JSONReport, MetaJSON } from "./types";

export class CodeContainer {
  api: API;
  io: IO;
  meta: MetaJSON;

  container: WebContainer;

  files: FileSystemTree;

  constructor({ api, io, meta }: { api: API; io: IO; meta: MetaJSON }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.api = api;
    this.io = io;
    this.meta = meta;
    this.files = meta?.file_system;
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
    await this.writeSource(this.meta.starter_code, false);
    this.io.clearOutput();
    this.api.reset(this.meta.lesson_id);
  }

  async run() {
    if (this.meta.user.authenticated) {
      this.save();
    }
    this.io.clearOutput();

    try {
      await this.writeSource(this.io.editorState, false);

      const response = await this.container.spawn("node", ["source.js"]);
      this.io.pipeOutput(response, true);

      const exitCode = await response.exit;
      if (exitCode) {
        throw new Error(`Process exited with code ${exitCode}`);
      }
    } catch (error) {
      this.io.logger(error?.message || "Something went wrong");
    }
  }

  async save() {
    try {
      await this.api.save(this.meta.lesson_id, this.io.editorState);
    } catch (error) {
      this.io.logger("Failed to save code");
    }
  }

  async test() {
    this.io.clearOutput();

    try {
      await this.writeSource(this.io.editorState, this.meta.exports);
    } catch (error) {
      this.io.logger(error.message);
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
      this.io.pipeOutput(response);
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
      // only install dependencies if tests exist
      if (this.files?.["test.js"]) {
        await this.installDependencies();
      }
    }
  }

  private async writeSource(source: string, exports: string[] | false) {
    const modifiedSource = exports ? addExports(source, exports) : lint(source);
    await this.container.fs.writeFile("source.js", modifiedSource);
  }
}
