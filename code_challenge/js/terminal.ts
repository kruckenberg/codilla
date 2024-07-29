import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { CodeContainer } from "./webContainer";
import type { WebContainerProcess } from "./types";

/*****************************************************
 * Get HTML elements
 ****************************************************/
const terminalEl = document.getElementById("terminal");
const completeButtonEl = document.getElementById("complete-button");
const clearButtonEl = document.getElementById("clear-button");
const csrfToken =
  document.getElementById("csrf-token")?.getAttribute("data-csrf-token") || "";

if (!terminalEl || !completeButtonEl || !clearButtonEl) {
  throw new Error("Missing required HTML elements");
}

let metaJSON;
try {
  metaJSON = JSON.parse(
    document.getElementById("meta-json")?.textContent || "",
  );
} catch (error) {
  throw new Error("Failed to parse challenge metadata");
}

const lesson_id = metaJSON["lesson_id"];

/*****************************************************
 * Create shell and launch Node REPL
 ****************************************************/
function logToTerminal(_data: string) {}

let shellProcess: WebContainerProcess;
async function startTerminal() {
  const codeContainer = new CodeContainer({ files: {}, logger: logToTerminal });
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

completeButtonEl.addEventListener("click", () => {
  fetch("/api/challenge/complete", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ lesson_id }),
  });
});

startTerminal();
