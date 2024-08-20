import { WebContainer } from "@webcontainer/api";
import type { Logger, MetaJSON, Terminal, WebContainerProcess } from "../types";

export class TerminalContainer {
  meta: MetaJSON;
  logger: Logger;

  container: WebContainer;

  constructor({ meta, logger }: { meta: MetaJSON; logger: Logger }) {
    if (this.container) {
      throw new Error("WebContainer already initialized");
    }

    this.meta = meta;
    this.logger = logger;
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

  async init() {
    if (!this.container) {
      this.container = await WebContainer.boot();
    }
  }
}
