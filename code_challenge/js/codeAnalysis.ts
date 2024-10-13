import { parse } from "acorn";
import { simple } from "acorn-walk";
import { generate } from "astring";
import { ParseError, MissingExportError } from "./utils/customErrors";
import { Program } from "acorn";

function parseCode(source: string | Program) {
  if (typeof source === "object") {
    return source;
  }

  try {
    return parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
    });
  } catch (error) {
    throw new ParseError(error.message || "Cannot parse code");
  }
}

export function lint(source: string | Program): string {
  return generate(parseCode(source));
}

/**
 * Verifies that the source code contains the expected functions and
 * adds an export statement to make them available for tests.
 */
export function addExports(source: string, exportNames: string[]): string {
  const assignments: string[] = [];

  const ast = parseCode(source);

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
      throw new MissingExportError(
        `Expected an assignment named ${exportName}`,
      );
    }
  }

  return `${lint(ast)} export { ${exportNames.join(", ")} };`;
}
