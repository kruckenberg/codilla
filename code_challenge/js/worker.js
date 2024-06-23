import * as eslint from "eslint-linter-browserify";

const originalConsoleLog = console.log;

function createConsoleLogProxy(outputs) {
  console.log = new Proxy(originalConsoleLog, {
    apply(_target, _thisArg, argArray) {
      outputs.push(argArray);
      return;
    },
  });
}

const linter = new eslint.Linter();

function formatErrors(errors) {
  const severityMap = {
    1: "warn",
    2: "error",
  };

  return errors.map((error) => {
    return {
      type: severityMap[error.severity],
      message: [`(line ${error.line}) ${error.message}`],
    };
  });
}

function formatLogs(logs) {
  return logs.map((log) => {
    return {
      type: "log",
      message: log,
    };
  });
}

onmessage = async function (msg) {
  const source = msg.data;

  const linterResults = formatErrors(
    linter.verify(source, {
      rules: {
        "no-undef": "error",
        "no-unused-vars": "error",
        "no-extra-semi": "warn",
        "no-unreachable": "warn",
        "no-irregular-whitespace": "warn",
        "no-unexpected-multiline": "error",
        "no-unsafe-negation": "error",
        "no-undefined": "error",
        "no-undef-init": "error",
      },
      languageOptions: {
        ecmaVersion: "latest",
        globals: { console: true },
        sourceType: "module",
      },
    }),
  );

  try {
    const logs = [];

    if (linterResults.some((r) => r.type === "error")) {
      postMessage(linterResults.filter((e) => e.type === "error"));
      return;
    }

    createConsoleLogProxy(logs);

    new Function(source)();

    postMessage(linterResults.concat(formatLogs(logs)));
  } catch (e) {
    postMessage(e);
  }
};
