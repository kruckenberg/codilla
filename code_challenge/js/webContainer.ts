import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import { addExports } from "./codeAnalysis";
import type {
  FileSystemTree,
  Logger,
  Terminal,
  WebContainerProcess,
} from "./types";

export class CodeContainer {
  container: WebContainer;
  files: FileSystemTree;
  logger: Logger;

  constructor({ files, logger }: { files: FileSystemTree; logger: Logger }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.files = files;
    this.logger = logger;
  }

  async runCode() {
    try {
      const response = await this.container.spawn("node", ["source.js"]);

      response.output
        .pipeThrough(this.makeAnsiStripper())
        .pipeTo(this.makeWriter());

      const exitCode = await response.exit;
      if (exitCode) {
        throw new Error(`Process exited with code ${exitCode}`);
      }
    } catch (error) {
      console.error(error);
      this.logger(error?.message || "Something went wrong");
    }
  }

  async runTest() {
    try {
      let source = await this.container.fs.readFile("source.js", "utf-8");
      source = `console.log = function () {}; ${addExports(source, ["addTwo", "map"])}`;
      await this.container.fs.writeFile("source.js", source);
    } catch (error) {
      this.logger(error?.message || "Something went wrong");
      return;
    }

    const response = await this.container.spawn("node", ["test.js"]);
    response.output
      .pipeThrough(this.makeAnsiStripper())
      .pipeTo(this.makeWriter());
  }

  async startShell(terminal: Terminal): Promise<WebContainerProcess> {
    const shellProcess = await this.container.spawn("jsh");
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      }),
    );

    const input = shellProcess.input.getWriter();
    terminal.onData((data: string) => {
      input.write(data);
    });

    terminal.input("node\n");
    terminal.focus();

    return shellProcess;
  }

  async writeSource(code: string) {
    await this.container.fs.writeFile("source.js", code);
  }

  async init() {
    if (!this.container) {
      this.container = await WebContainer.boot();
      await this.container.mount(this.files);
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
    const logger = this.logger;
    return new WritableStream({ write: logger });
  }
}
