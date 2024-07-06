import { WebContainer } from "@webcontainer/api";
import { files } from "./fileSystem";

/**
 * Needed to remove ANSI escape codes from the output.
 * In future: use `strip-ansi` package?
 */
export default function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");

  return new RegExp(pattern, onlyFirst ? undefined : "g");
}

export async function exec(container, command, args) {
  try {
    let response = await container.spawn(command, args);

    let output = "";

    response.output.pipeTo(
      new WritableStream({
        async write(chunk) {
          output += chunk.toString().replace(ansiRegex(), "");
        },
      }),
    );

    if (await response.exit) {
      throw new Error("Command failed");
    }

    return output;
  } catch (error) {
    console.error(error);
  }
}

let webContainer;

export function getWebContainer() {
  return webContainer;
}

window.addEventListener("load", async () => {
  webContainer = await WebContainer.boot();
  await webContainer.mount(files);
});
