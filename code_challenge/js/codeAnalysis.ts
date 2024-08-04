import { parse } from "acorn";
import { simple } from "acorn-walk";
import { generate } from "astring";

/**
 * Verifies that the source code contains the expected functions and
 * adds an export statement to make them available for tests.
 */
export function addExports(source: string, exportNames: string[]): string {
  const assignments: string[] = [];

  const ast = parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
  });

  simple(ast, {
    FunctionDeclaration(node) {
      assignments.push(node?.id?.name || "anonymous");
    },
    ArrowFunctionExpression(node) {
      assignments.push(node?.id?.name || "anonymous");
    },
    VariableDeclaration(node) {
      assignments.push(...node?.declarations.map((d) => d.id.name));
    },
  });

  for (const exportName of exportNames) {
    if (!assignments.includes(exportName)) {
      throw new Error(`Expected an assignment named ${exportName}`);
    }
  }

  return `${generate(ast)} export { ${exportNames.join(", ")} };`;
}
