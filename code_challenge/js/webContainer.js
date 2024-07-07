import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";

export class CodeContainer {
  container;

  constructor({ files, logger }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.files = files;
    this.logger = logger;

    this.init();
  }

  async runCode() {
    try {
      const response = await this.container.spawn("node", ["source.js"]);

      response.output
        .pipeThrough(this._makeAnsiStripper())
        .pipeTo(this._makeWriter());

      if (await response.exit) {
        throw new Error("Process exited with code ", response.exit);
      }
    } catch (error) {
      console.error(error);
      this.logger(error?.message || "Something went wrong");
    }
  }

  async writeSource(code) {
    await this.container.fs.writeFile("source.js", code);
  }

  async init() {
    this.container = await WebContainer.boot();
    console.log("WebContainer booted.");
    await this.container.mount(this.files);
    console.log("File system mounted.");
  }

  _makeAnsiStripper() {
    return new TransformStream({
      transform: (chunk, controller) => controller.enqueue(stripAnsi(chunk)),
    });
  }

  _makeWriter() {
    const logger = this.logger;
    return new WritableStream({ write: logger });
  }
}
