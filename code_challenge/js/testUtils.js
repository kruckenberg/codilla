export default `export function isFunction(candidate) {
  return function () {
    const pass = typeof candidate === "function";
    return { pass };
  };
}

export function evaluatesTo(fn, input, expected) {
  return async function () {
    const funcTest = isFunction(fn)();
    if (!funcTest.pass) {
      return { pass: false, message: "Not a function" };
    }

    const result = await fn(...input);
    const pass = result === expected;
    const message = pass
      ? ""
      : \`Input: \${input} Expected: \${expected} Actual: \${result}\`;

    return { pass, message };
  };
}`;
