import { WebContainer } from "@webcontainer/api";
import stripAnsi from "strip-ansi";
import { addExports } from "./codeAnalysis";
import type {
  FileSystemTree,
  JSONReport,
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

  async installDependencies() {
    const installProcess = await this.container.spawn("npm", ["install"]);
    return installProcess.exit;
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

  async reportTestResults() {
    let results: JSONReport;

    try {
      results = JSON.parse(
        await this.container.fs.readFile("test-results.json", "utf-8"),
      );
    } catch (error) {
      this.logger("Test results not found or not parsed.");
      return;
    }

    for (const result of results.tests) {
      if (result.err.message) {
        this.logger(`✗ ${result.fullTitle}\n`);
      } else {
        this.logger(`✓ ${result.fullTitle}\n`);
      }
    }
    this.logger(
      `\n-------------------------------------\n${results.stats.passes} passes, ${results.stats.failures} failures\n`,
    );
  }

  async runTest(exports: string[] = []) {
    try {
      let source = await this.container.fs.readFile("source.js", "utf-8");
      source = `${addExports(source, exports)}`;
      await this.container.fs.writeFile("source.js", source);
    } catch (error) {
      this.logger(error?.message || "Something went wrong");
      return;
    }

    const response = await this.container.spawn("npm", ["test"]);

    if (await response.exit) {
      this.logger("Something went wrong while running tests");
      return;
    }

    this.reportTestResults();
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

  async writeSource(code: string) {
    await this.container.fs.writeFile("source.js", code);
  }

  async init() {
    if (!this.container) {
      this.container = await WebContainer.boot();
      await this.container.mount(this.files);
      // only install dependencies if tests exist
      if (this.files?.["test.js"]) {
        await this.installDependencies();
      }
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
