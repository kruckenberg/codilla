import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
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
        .pipeThrough(this._makeAnsiStripper())
        .pipeTo(this._makeWriter());

      const exitCode = await response.exit;
      if (exitCode) {
        throw new Error(`Process exited with code ${exitCode}`);
      }
    } catch (error) {
      console.error(error);
      this.logger(error?.message || "Something went wrong");
    }
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

  _makeAnsiStripper() {
    return new TransformStream({
      transform: (
        chunk: string,
        controller: TransformStreamDefaultController,
      ) => controller.enqueue(stripAnsi(chunk)),
    });
  }

  _makeWriter() {
    const logger = this.logger;
    return new WritableStream({ write: logger });
  }
}
