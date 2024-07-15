import { parse } from "acorn";
import { simple } from "acorn-walk";

/**
 * Verifies that the source code contains the expected functions and
 * adds an export statement to make them available for tests.
 */
export function addExports(source: string, fnNames: string[]): string {
  const fnsInSource: string[] = [];

  const ast = parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
  });

  simple(ast, {
    FunctionDeclaration(node) {
      fnsInSource.push(node?.id?.name || "anonymous");
    },
    ArrowFunctionExpression(node) {
      fnsInSource.push(node?.id?.name || "anonymous");
    },
  });

  for (const fnName of fnNames) {
    if (!fnsInSource.includes(fnName)) {
      throw new Error(`Expected a function named ${fnName}`);
    }
  }

  return `${source} export { ${fnNames.join(", ")} };`;
}
