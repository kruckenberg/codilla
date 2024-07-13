import { Terminal } from "@xterm/xterm";
import { CodeContainer } from "./webContainer";

/*****************************************************
 * Get HTML elements
 ****************************************************/
const terminalEl = document.getElementById("terminal");
const completeButtonEl = document.getElementById("complete-button");

if (!terminalEl || !completeButtonEl) {
  throw new Error("Missing required HTML elements");
}

/*****************************************************
 * Create terminal
 ****************************************************/
const terminal = new Terminal({
  convertEol: true,
  cursorBlink: true,
  fontSize: 20,
  fontFamily: '"Fira Code", monospace',
  theme: {
    background: "#272822", // Monokai background color
    foreground: "#f8f8f2", // Monokai main text color
    cursor: "#f8f8f0", // Cursor color
  },
});
terminal.open(terminalEl);

function logToTerminal(_data: string) {}

async function startTerminal() {
  const codeContainer = new CodeContainer({ files: {}, logger: logToTerminal });
  await codeContainer.init();
  await codeContainer.startShell(terminal);
}

startTerminal();
