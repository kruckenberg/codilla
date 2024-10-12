import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { API } from "../API";
import { TerminalContainer } from "./TerminalContainer";
import { getElementById } from "../utils";
import type { MetaJSON, WebContainerProcess } from "../types";

/*****************************************************
 * Get HTML elements
 ****************************************************/
const terminalEl = getElementById<HTMLElement>("terminal");
const completeButtonEl = getElementById<HTMLButtonElement>("complete-button");
const clearButtonEl = getElementById<HTMLButtonElement>("clear-button");

/*****************************************************
 * Get dynamic data:w
 ****************************************************/
const csrfToken =
  document.getElementById("csrf-token")?.getAttribute("data-csrf-token") || "";

let metaJSON: MetaJSON;
try {
  metaJSON = JSON.parse(
    document.getElementById("meta-json")?.textContent || "",
  );
} catch (error) {
  throw new Error("Failed to parse challenge metadata");
}

const lesson_id = metaJSON.lesson_id;
const user_authenticated = metaJSON?.user?.authenticated || false;
const next_lesson_link = metaJSON?.next_lesson?.link || "";

/*****************************************************
 * API setup
 ****************************************************/
const api = new API({ csrfToken });

/*****************************************************
 * Create shell and launch Node REPL
 ****************************************************/
function logToTerminal(_data: string) {}

let shellProcess: WebContainerProcess;
async function startTerminal() {
  const codeContainer = new TerminalContainer({
    meta: metaJSON,
    logger: logToTerminal,
  });
  await codeContainer.init();
  shellProcess = await codeContainer.startShell(terminal);
}

/*****************************************************
 * Create terminal
 ****************************************************/
const fitAddon = new FitAddon();
const terminal = new Terminal({
  convertEol: true,
  cursorBlink: true,
  fontSize: 18,
  fontFamily: '"Fira Code", monospace',
  theme: {
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f0",
    cyan: "#8be9fd",
    green: "#50fa7b",
    red: "#ff5555",
    yellow: "#f1fa8c",
  },
});
terminal.loadAddon(fitAddon);
terminal.open(terminalEl);
fitAddon.fit();

// Responsive terminal sizing
window.addEventListener("resize", () => {
  fitAddon.fit();
  shellProcess &&
    shellProcess.resize({ cols: terminal.cols, rows: terminal.rows });
});

clearButtonEl.addEventListener("click", () => {
  terminal.clear();
  setTimeout(() => {
    terminal.focus();
  }, 0);
});

completeButtonEl.addEventListener("click", async () => {
  if (user_authenticated) {
    await api.markComplete(lesson_id, "");
    window.location.assign(next_lesson_link);
  }
});

startTerminal();
